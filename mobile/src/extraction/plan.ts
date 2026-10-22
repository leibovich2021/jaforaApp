import { AppSettings, VisionProviderId } from '../types';
import { cleanApiKey } from './apiError';

export type ConcreteProvider = Exclude<VisionProviderId, 'auto'>;

export const PROVIDER_LABELS: Record<ConcreteProvider, string> = {
  gemini: 'Gemini',
  openai: 'OpenAI',
  anthropic: 'Claude',
};

const ORDER: ConcreteProvider[] = ['gemini', 'openai', 'anthropic'];

export function keyFor(settings: AppSettings, id: ConcreteProvider): string {
  if (id === 'gemini') return cleanApiKey(settings.geminiApiKey);
  if (id === 'openai') return cleanApiKey(settings.openaiApiKey);
  return cleanApiKey(settings.anthropicApiKey);
}

export function hasVisionKey(settings: AppSettings): boolean {
  return ORDER.some((id) => keyFor(settings, id).length > 0);
}

/**
 * Auto: Gemini, then OpenAI, then Claude — only providers that have a key.
 * A chosen provider is tried first, then the others that have a key.
 */
export function planProviders(settings: AppSettings): ConcreteProvider[] {
  const available = ORDER.filter((id) => keyFor(settings, id).length > 0);
  const preferred = settings.visionProvider ?? 'auto';
  if (preferred !== 'gemini' && preferred !== 'openai' && preferred !== 'anthropic') {
    return available;
  }
  const rest = available.filter((id) => id !== preferred);
  return [preferred, ...rest];
}
