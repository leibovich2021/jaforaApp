export interface BranchData {
  boxes: number;
  points: number;
  trucks: number;
  avgBoxes: number;
  avgPoints: number;
}

export interface ExtractedReport {
  date: string;
  dayName: string;
  beerSheva: BranchData;
  tzora: BranchData;
}

export interface TruckTransfers {
  eilat: number;
  bashToTzra: number;
  tzraToBeerot: number;
  beerotToTzra: number;
}

export type VisionProviderId = 'auto' | 'gemini' | 'openai' | 'anthropic';

export interface AppSettings {
  managerName: string;
  managerPhone: string;
  geminiApiKey: string;
  openaiApiKey: string;
  anthropicApiKey: string;
  visionProvider: VisionProviderId;
}

export type Screen = 'home' | 'loading' | 'review';

export const DEFAULT_SETTINGS: AppSettings = {
  managerName: 'לוזיק',
  managerPhone: '972501234567',
  geminiApiKey: '',
  openaiApiKey: '',
  anthropicApiKey: '',
  visionProvider: 'auto',
};
