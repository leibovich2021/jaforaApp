import { ExtractedReport } from '../../types';
import {
  ProviderRequestError,
  isAuthFailure,
  isConfigRejection,
  isModelUnavailable,
  messageFromBody,
  postJson,
} from '../../extraction/apiError';
import { textFromGemini } from '../../extraction/geminiText';
import { parseReportText } from '../../extraction/parseReport';
import { EXTRACTION_PROMPT, reportJsonSchema } from '../../extraction/prompt';
import { reportHasColumnSuspicion } from '../../extraction/sanity';

/**
 * gemini-2.5-* is closed to new API keys ("no longer available to new users").
 * gemini-flash-latest is a moving alias. Use current stable ids.
 */
const GEMINI_MODELS = ['gemini-3.5-flash-lite', 'gemini-3.8-flash', 'gemini-3.6-flash'] as const;

export interface VisionImage {
  base64: string;
  mimeType: string;
}

export interface VisionSuccess {
  report: ExtractedReport;
  model: string;
}

type StatusFn = (message: string) => void;

function requestBody(mode: 'sdk' | 'rest', image: VisionImage) {
  const schema = reportJsonSchema(false);
  const contents = [
    {
      parts: [
        { inline_data: { mime_type: image.mimeType, data: image.base64 } },
        { text: EXTRACTION_PROMPT },
      ],
    },
  ];

  if (mode === 'rest') {
    return {
      contents,
      generationConfig: {
        maxOutputTokens: 2048,
        responseFormat: {
          text: { mimeType: 'APPLICATION_JSON', schema },
        },
      },
    };
  }

  return {
    contents,
    generationConfig: {
      maxOutputTokens: 2048,
      responseMimeType: 'application/json',
      responseJsonSchema: schema,
      thinkingConfig: { thinkingLevel: 'minimal' },
    },
  };
}

async function readModel(model: string, image: VisionImage, apiKey: string): Promise<ExtractedReport> {
  let configError = '';

  for (const mode of ['sdk', 'rest'] as const) {
    const response = await postJson(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`,
      { 'x-goog-api-key': apiKey },
      requestBody(mode, image),
    );

    if (!response.ok) {
      const message = messageFromBody(response.json, response.raw, response.status);
      if (isAuthFailure(response.status, message)) {
        throw new ProviderRequestError(message, true);
      }
      if (isModelUnavailable(response.status, message)) {
        throw new ProviderRequestError(message, false);
      }
      if (mode === 'sdk' && isConfigRejection(response.status, message)) {
        configError = message;
        continue;
      }
      throw new ProviderRequestError(message, false);
    }

    const { text, diagnostic } = textFromGemini(response.json);
    if (!text) {
      throw new ProviderRequestError(
        diagnostic ? `Gemini החזיר תשובה ריקה (${diagnostic})` : 'Gemini החזיר תשובה ריקה',
        false,
      );
    }
    return parseReportText(text);
  }

  throw new ProviderRequestError(configError || 'בקשת Gemini נדחתה', false);
}

export async function extractWithGemini(
  image: VisionImage,
  apiKey: string,
  onStatus?: StatusFn,
): Promise<VisionSuccess> {
  const failures: string[] = [];
  let best: VisionSuccess | null = null;

  for (let index = 0; index < GEMINI_MODELS.length; index += 1) {
    const model = GEMINI_MODELS[index];
    if (index === 0) onStatus?.('קורא עם Gemini…');
    else if (best) onStatus?.('המספרים לא מסתדרים עם סדר העמודות. בודק שוב עם מודל Gemini חזק יותר…');
    else onStatus?.('מנסה מודל Gemini אחר…');

    try {
      const report = await readModel(model, image, apiKey);
      const suspicious = reportHasColumnSuspicion(report);
      best = { report, model };
      if (!suspicious || index >= 1) break;
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      failures.push(`${model}: ${message}`);
      if (err instanceof ProviderRequestError && err.auth) {
        if (!best) throw new ProviderRequestError(failures.join('\n'), true);
        break;
      }
      if (best) break;
    }
  }

  if (best) return best;
  throw new ProviderRequestError(failures.join('\n') || 'Gemini לא החזיר תוצאה', false);
}
