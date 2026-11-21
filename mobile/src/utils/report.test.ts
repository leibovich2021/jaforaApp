import assert from 'node:assert/strict';
import test from 'node:test';
import { BranchData, ExtractedReport, TruckTransfers } from '../types';
import { buildReportText } from './report';

const transfers: TruckTransfers = {
  eilat: 0,
  bashToTzra: 0,
  tzraToBeerot: 0,
  beerotToTzra: 0,
};

function branch(overrides: Partial<BranchData> = {}): BranchData {
  return {
    boxes: 0,
    points: 0,
    trucks: 0,
    avgBoxes: 0,
    avgPoints: 0,
    ...overrides,
  };
}

const bothBranches: ExtractedReport = {
  date: '22/06/2026',
  dayName: 'יום שני',
  tzora: branch({ trucks: 12, points: 120, boxes: 12000 }),
  beerSheva: branch({ trucks: 14, points: 153, boxes: 17151 }),
};

test('report ends with totals of trucks, boxes, and points across both branches', () => {
  const text = buildReportText(bothBranches, transfers, 'לוזיק');

  assert.ok(text.startsWith('שלום לוזיק'));
  assert.ok(text.includes('סניף צרעה'));
  assert.ok(text.includes('סניף באר שבע'));
  assert.ok(text.indexOf('סניף צרעה') < text.indexOf('סניף באר שבע'));
  assert.ok(text.indexOf('סניף באר שבע') < text.indexOf('סיכום שני הסניפים:'));
  assert.equal(text.split('━━━━━━━━━━━━━━━━━━━━━━').length - 1, 2);
  assert.ok(text.endsWith(`סיכום שני הסניפים:
סה"כ משאיות: 26
סה"כ תיבות: 29,151
סה"כ נקודות: 273`));
});

test('a single-branch day sums only the branch that has numbers', () => {
  const text = buildReportText({
    ...bothBranches,
    tzora: branch(),
  }, transfers, 'לוזיק');

  assert.equal(text.includes('סניף צרעה'), false);
  assert.ok(text.includes('סניף באר שבע'));
  assert.equal(text.split('━━━━━━━━━━━━━━━━━━━━━━').length - 1, 1);
  assert.ok(text.endsWith(`סיכום שני הסניפים:
סה"כ משאיות: 14
סה"כ תיבות: 17,151
סה"כ נקודות: 153`));
});

test('missing branches and non-numeric counts are treated as zero', () => {
  const dirty = {
    date: '22/06/2026',
    dayName: 'יום שני',
    beerSheva: { trucks: '14', points: null, boxes: '17,151' },
    tzora: undefined,
  } as unknown as ExtractedReport;

  const text = buildReportText(dirty, transfers, 'לוזיק');
  assert.equal(text.includes('סניף צרעה'), false);
  assert.ok(text.includes('14 משאיות'));
  assert.ok(text.includes('17,151 תיבות'));
  assert.ok(text.endsWith(`סיכום שני הסניפים:
סה"כ משאיות: 14
סה"כ תיבות: 17,151
סה"כ נקודות: 0`));

  const garbage = {
    date: '23/06/2026',
    dayName: '',
    beerSheva: { trucks: 'לא מספר', points: 'x', boxes: undefined },
    tzora: { trucks: 3, points: '1,200', boxes: 400 },
  } as unknown as ExtractedReport;

  const summed = buildReportText(garbage, transfers, 'לוזיק');
  assert.equal(summed.includes('סניף באר שבע'), false);
  assert.ok(summed.endsWith(`סיכום שני הסניפים:
סה"כ משאיות: 3
סה"כ תיבות: 400
סה"כ נקודות: 1,200`));
});
