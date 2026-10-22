import assert from 'node:assert/strict';
import test from 'node:test';
import { DEFAULT_SETTINGS } from '../types';
import {
  describeHttpError,
  isAuthFailure,
  isConfigRejection,
  isModelUnavailable,
} from './apiError';
import { textFromGemini } from './geminiText';
import { parseLooseNumber, parseReportText } from './parseReport';
import { hasVisionKey, planProviders } from './plan';
import { EXTRACTION_PROMPT } from './prompt';
import {
  collectReportWarnings,
  hasColumnSuspicion,
  suggestedColumnFix,
} from './sanity';

const sample = {
  date: '22/06/2026',
  dayName: 'יום שני',
  beerSheva: { trucks: 14, points: 153, boxes: 17151, avgBoxes: 9, avgPoints: 4 },
  tzora: { trucks: 0, points: 0, boxes: 0, avgBoxes: 0, avgPoints: 0 },
};

test('parseReportText reads JSON even when the model wraps it in markdown', () => {
  const report = parseReportText('```json\n' + JSON.stringify(sample) + '\n```');
  assert.equal(report.date, '22/06/2026');
  assert.equal(report.dayName, 'יום שני');
  assert.equal(report.beerSheva.trucks, 14);
  assert.equal(report.beerSheva.points, 153);
  assert.equal(report.beerSheva.boxes, 17151);
  assert.equal(report.beerSheva.avgBoxes, 0);
  assert.equal(report.tzora.trucks, 0);
});

test('parseLooseNumber strips thousands separators and does not swap fields', () => {
  assert.equal(parseLooseNumber('17,151'), 17151);
  assert.equal(parseLooseNumber('14 '), 14);
  const swapped = parseReportText(JSON.stringify({
    date: '2026-06-22',
    dayName: 'יום ראשון',
    beerSheva: { trucks: '153', points: '14', boxes: '17,151' },
    tzora: { trucks: 0, points: 0, boxes: 0 },
  }));
  assert.equal(swapped.date, '22/06/2026');
  assert.equal(swapped.beerSheva.trucks, 153);
  assert.equal(swapped.beerSheva.points, 14);
  assert.equal(swapped.beerSheva.boxes, 17151);
  assert.equal(hasColumnSuspicion(swapped.beerSheva), true);
});

test('suggestedColumnFix sorts trucks < points < boxes and leaves a valid row alone', () => {
  const fix = suggestedColumnFix({
    trucks: 153,
    points: 14,
    boxes: 17151,
    avgBoxes: 0,
    avgPoints: 0,
  });
  assert.deepEqual(
    fix && { trucks: fix.trucks, points: fix.points, boxes: fix.boxes },
    { trucks: 14, points: 153, boxes: 17151 },
  );
  assert.equal(suggestedColumnFix({
    trucks: 14,
    points: 153,
    boxes: 17151,
    avgBoxes: 0,
    avgPoints: 0,
  }), null);
  assert.equal(collectReportWarnings({
    date: '22/06/2026',
    dayName: '',
    beerSheva: { trucks: 14, points: 153, boxes: 17151, avgBoxes: 0, avgPoints: 0 },
    tzora: { trucks: 0, points: 0, boxes: 0, avgBoxes: 0, avgPoints: 0 },
  }).length, 0);
});

test('a closed Gemini 2.5 model is not reported as a bad API key', () => {
  const message = 'This model models/gemini-2.5-flash-lite is no longer available to new users. Please update your code to use models/gemini-3.5-flash-lite';
  assert.equal(isModelUnavailable(400, message), true);
  assert.equal(isAuthFailure(400, message), false);
  assert.equal(isModelUnavailable(404, message), true);
  assert.equal(
    describeHttpError(404, message).includes('no longer available to new users'),
    true,
  );
});

test('an invalid API key stays an auth failure and the API text is kept', () => {
  const message = 'API key not valid. Please pass a valid API key.';
  assert.equal(isAuthFailure(400, message), true);
  assert.equal(isModelUnavailable(400, message), false);
  assert.equal(describeHttpError(400, message), `HTTP 400: ${message}`);
});

test('unknown generationConfig fields are a config rejection, not an auth failure', () => {
  const message = 'Invalid JSON payload received. Unknown name "responseFormat" at generation_config';
  assert.equal(isConfigRejection(400, message), true);
  assert.equal(isAuthFailure(400, message), false);
});

test('provider plan tries Gemini first and falls back to keys that exist', () => {
  assert.deepEqual(planProviders({
    ...DEFAULT_SETTINGS,
    geminiApiKey: 'AIza-test',
    openaiApiKey: 'sk-test',
    visionProvider: 'auto',
  }), ['gemini', 'openai']);

  assert.deepEqual(planProviders({
    ...DEFAULT_SETTINGS,
    geminiApiKey: 'AIza test',
    anthropicApiKey: 'sk-ant-test',
    visionProvider: 'anthropic',
  }), ['anthropic', 'gemini']);

  assert.equal(hasVisionKey(DEFAULT_SETTINGS), false);
  assert.deepEqual(planProviders({
    ...DEFAULT_SETTINGS,
    visionProvider: 'openai',
  }), ['openai']);
});

test('Gemini thought parts are skipped when the JSON is in a later part', () => {
  const { text } = textFromGemini({
    candidates: [{
      content: {
        parts: [
          { thought: true, text: 'counting columns' },
          { text: JSON.stringify(sample) },
        ],
      },
      finishReason: 'STOP',
    }],
  });
  assert.equal(parseReportText(text).beerSheva.trucks, 14);
});

test('the prompt states the physical column order and does not insert a branch column', () => {
  assert.match(EXTRACTION_PROMPT, /IMMEDIATELY TO THE RIGHT/);
  assert.match(EXTRACTION_PROMPT, /TRUCKS \(משאיות\)/);
  assert.match(EXTRACTION_PROMPT, /POINTS \(נקודות, stops\)/);
  assert.match(EXTRACTION_PROMPT, /BOXES \(תיבות\)/);
  assert.match(EXTRACTION_PROMPT, /NO branch-name column/);
});
