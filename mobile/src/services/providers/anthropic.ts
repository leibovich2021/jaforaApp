import {
  ProviderRequestError,
  isAuthFailure,
  isModelUnavailable,
  messageFromBody,
  postJson,
} from '../../extraction/apiError';
import { parseReportText } from '../../extraction/parseReport';
import { EXTRACTION_PROMPT, reportJsonSchema } from '../../extraction/prompt';
import { VisionImage, VisionSuccess } from './gemini';

const ANTHROPIC_MODEL = 'claude-sonnet-5-5';

type StatusFn = (message: string) => void;

function contentText(json: unknown): { text: string; diagnostic: string } {
  const root = json && typeof json === 'object' ? (json as Record<string, unknown>) : {};
  const blocks = Array.isArray(root.content) ? root.content : [];
  const text = blocks
    .map((block) => {
      if (!block || typeof block !== 'object') return '';
      const record = block as Record<string, unknown>;
      if (record.type === 'text' && typeof record.text === 'string') return record.text;
      return '';
    })
    .join('\n')
    .trim();
  const stop = typeof root.stop_reason === 'string' ? root.stop_reason : '';
  const diagnostic = stop && stop !== 'end_turn' ? `stop_reason=${stop}` : '';
  return { text, diagnostic };
}

function requestBody(image: VisionImage, withSchema: boolean) {
  return {
    model: ANTHROPIC_MODEL,
    max_tokens: 4096,
    messages: [
      {
        role: 'user',
        content: [
          {
            type: 'image',
            source: {
              type: 'base64',
              media_type: image.mimeType,
              data: image.base64,
            },
          },
          { type: 'text', text: EXTRACTION_PROMPT },
        ],
      },
    ],
    ...(withSchema
      ? {
          output_config: {
            format: {
              type: 'json_schema',
              schema: reportJsonSchema(true),
            },
          },
        }
      : {}),
  };
}

export async function extractWithAnthropic(
  image: VisionImage,
  apiKey: string,
  onStatus?: StatusFn,
): Promise<VisionSuccess> {
  onStatus?.('קורא עם Claude…');
  let configError = '';

  for (const withSchema of [true, false]) {
    const response = await postJson(
      'https://api.anthropic.com/v1/messages',
      {
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      requestBody(image, withSchema),
    );

    if (!response.ok) {
      const message = messageFromBody(response.json, response.raw, response.status);
      if (isAuthFailure(response.status, message) || isModelUnavailable(response.status, message)) {
        throw new ProviderRequestError(message, isAuthFailure(response.status, message));
      }
      if (withSchema && response.status === 400) {
        configError = message;
        continue;
      }
      throw new ProviderRequestError(message, false);
    }

    const { text, diagnostic } = contentText(response.json);
    if (!text) {
      throw new ProviderRequestError(
        diagnostic ? `Claude החזיר תשובה ריקה (${diagnostic})` : 'Claude החזיר תשובה ריקה',
        false,
      );
    }
    return { report: parseReportText(text), model: ANTHROPIC_MODEL };
  }

  throw new ProviderRequestError(configError || 'בקשת Claude נדחתה', false);
}
