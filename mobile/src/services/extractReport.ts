import { AppSettings, ExtractedReport } from '../types';
import { keyFor, planProviders, PROVIDER_LABELS } from '../extraction/plan';
import { extractWithAnthropic } from './providers/anthropic';
import { extractWithGemini, VisionImage, VisionSuccess } from './providers/gemini';
import { extractWithOpenAI } from './providers/openai';

export interface ExtractionResult {
  report: ExtractedReport;
  providerLabel: string;
}

const EXTRACTORS = {
  gemini: extractWithGemini,
  openai: extractWithOpenAI,
  anthropic: extractWithAnthropic,
} as const;

export async function extractReportFromImage(
  base64: string,
  mimeType: string,
  settings: AppSettings,
  onStatus?: (message: string) => void,
): Promise<ExtractionResult> {
  const plan = planProviders(settings);
  const configured = plan.filter((id) => keyFor(settings, id).length > 0);
  if (configured.length === 0) {
    throw new Error('חסר מפתח API. הוסף מפתח Gemini בהגדרות. אפשר גם להוסיף מפתח OpenAI או Claude כגיבוי.');
  }

  const image: VisionImage = { base64, mimeType };
  const failures: string[] = [];

  for (let index = 0; index < plan.length; index += 1) {
    const id = plan[index];
    const label = PROVIDER_LABELS[id];
    const apiKey = keyFor(settings, id);
    if (!apiKey) {
      failures.push(`${label}: אין מפתח בהגדרות`);
      continue;
    }
    if (failures.length > 0) {
      onStatus?.(`הקריאה הקודמת נכשלה. מנסה ${label}…`);
    }

    try {
      const result: VisionSuccess = await EXTRACTORS[id](image, apiKey, onStatus);
      return { report: result.report, providerLabel: `${label} · ${result.model}` };
    } catch (err) {
      const detail = err instanceof Error ? err.message : String(err);
      failures.push(`${label}:\n${detail}`);
    }
  }

  throw new Error(`לא הצלחתי לקרוא את התמונה.\n\n${failures.join('\n\n')}`);
}
