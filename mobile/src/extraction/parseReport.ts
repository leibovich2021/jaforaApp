import { BranchData, ExtractedReport } from '../types';
import { branchHasData } from '../utils/averages';

const EMPTY_BRANCH: BranchData = {
  boxes: 0,
  points: 0,
  trucks: 0,
  avgBoxes: 0,
  avgPoints: 0,
};

/** Accepts 17151, "17,151", "17 151", and numeric strings. Empty or junk becomes 0. */
export function parseLooseNumber(value: unknown): number {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return Math.max(0, Math.round(value));
  }
  if (typeof value === 'string') {
    const cleaned = value.replace(/[^\d.-]/g, '');
    if (!cleaned || cleaned === '-' || cleaned === '.') return 0;
    const parsed = Number(cleaned);
    if (Number.isFinite(parsed)) return Math.max(0, Math.round(parsed));
  }
  return 0;
}

export function normalizeDate(raw: string): string {
  const value = raw.trim();
  const iso = value.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (iso) return `${iso[3]}/${iso[2]}/${iso[1]}`;
  return value;
}

export function normalizeBranch(raw: unknown): BranchData {
  if (!raw || typeof raw !== 'object') return { ...EMPTY_BRANCH };
  const branch = raw as Record<string, unknown>;
  return {
    trucks: parseLooseNumber(branch.trucks),
    points: parseLooseNumber(branch.points),
    boxes: parseLooseNumber(branch.boxes),
    avgBoxes: 0,
    avgPoints: 0,
  };
}

function snippet(text: string): string {
  const oneLine = text.replace(/\s+/g, ' ').trim();
  if (!oneLine) return '';
  const cut = oneLine.length > 180 ? `${oneLine.slice(0, 180)}…` : oneLine;
  return `\nתשובת המודל: ${cut}`;
}

export function parseReportText(text: string): ExtractedReport {
  const cleaned = text.replace(/```json\s*/gi, '').replace(/```\s*/g, '').trim();
  const start = cleaned.indexOf('{');
  const end = cleaned.lastIndexOf('}');
  if (start === -1 || end === -1 || end <= start) {
    throw new Error(`לא הצלחתי לקרוא JSON מהתשובה.${snippet(text)}`);
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(cleaned.slice(start, end + 1));
  } catch {
    throw new Error(`התשובה אינה JSON תקין.${snippet(text)}`);
  }

  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
    throw new Error(`מבנה התשובה לא תואם לדוח.${snippet(text)}`);
  }

  const record = parsed as Record<string, unknown>;
  if (!record.date || typeof record.date !== 'string') {
    throw new Error(`חסר תאריך בתשובת המודל.${snippet(text)}`);
  }

  const beerSheva = normalizeBranch(record.beerSheva);
  const tzora = normalizeBranch(record.tzora);
  if (!branchHasData(beerSheva) && !branchHasData(tzora)) {
    throw new Error('לא נמצאו מספרים בתמונה. ודא שרואים תאריך ולפחות שורה אחת של באר שבע או צרעה.');
  }

  return {
    date: normalizeDate(record.date),
    dayName: typeof record.dayName === 'string' ? record.dayName.trim() : '',
    beerSheva,
    tzora,
  };
}
