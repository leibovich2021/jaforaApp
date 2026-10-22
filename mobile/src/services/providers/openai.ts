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

const OPENAI_MODEL = 'gpt-5.4';

type StatusFn = (message: string) => void;

function contentText(json: unknown): { text: string; diagnostic: string } {
  const root = json && typeof json === 'object' ? (json as Record<string, unknown>) : {};
  const choices = Array.isArray(root.choices) ? root.choices : [];
  const choice = choices[0] && typeof choices[0] === 'object' ? (choices[0] as Record<string, unknown>) : {};
  const message = choice.message && typeof choice.message === 'object'
    ? (choice.message as Record<string, unknown>)
    : {};
  const content = message.content;
  let text = '';
  if (typeof content === 'string') text = content.trim();
  else if (Array.isArray(content)) {
    text = content
      .map((part) => {
        if (!part || typeof part !== 'object') return '';
        const record = part as Record<string, unknown>;
        return typeof record.text === 'string' ? record.text : '';
      })
      .join('\n')
      .trim();
  }
  const finish = typeof choice.finish_reason === 'string' ? choice.finish_reason : '';
  const refusal = typeof message.refusal === 'string' ? message.refusal : '';
  const diagnostic = [finish && finish !== 'stop' ? `finish_reason=${finish}` : '', refusal]
    .filter(Boolean)
    .join(', ');
  return { text, diagnostic };
}

function requestBody(image: VisionImage, withSchema: boolean) {
  return {
    model: OPENAI_MODEL,
    max_completion_tokens: 2048,
    messages: [
      {
        role: 'user',
        content: [
          { type: 'text', text: EXTRACTION_PROMPT },
          {
            type: 'image_url',
            image_url: {
              url: `data:${image.mimeType};base64,${image.base64}`,
              detail: 'high',
            },
          },
        ],
      },
    ],
    ...(withSchema
      ? {
          response_format: {
            type: 'json_schema',
            json_schema: {
              name: 'daily_report',
              strict: true,
              schema: reportJsonSchema(true),
            },
          },
        }
      : {}),
  };
}

export async function extractWithOpenAI(
  image: VisionImage,
  apiKey: string,
  onStatus?: StatusFn,
): Promise<VisionSuccess> {
  onStatus?.('קורא עם OpenAI…');
  let configError = '';

  for (const withSchema of [true, false]) {
    const response = await postJson(
      'https://api.openai.com/v1/chat/completions',
      { Authorization: `Bearer ${apiKey}` },
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
        diagnostic ? `OpenAI החזיר תשובה ריקה (${diagnostic})` : 'OpenAI החזיר תשובה ריקה',
        false,
      );
    }
    return { report: parseReportText(text), model: OPENAI_MODEL };
  }

  throw new ProviderRequestError(configError || 'בקשת OpenAI נדחתה', false);
}
