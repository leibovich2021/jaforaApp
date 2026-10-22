import { BranchData, ExtractedReport } from '../types';
import { branchHasData } from '../utils/averages';

export interface BranchFlags {
  trucks: boolean;
  points: boolean;
  boxes: boolean;
  messages: string[];
}

export function inspectBranch(branch: BranchData): BranchFlags {
  const messages: string[] = [];
  let trucks = false;
  let points = false;
  let boxes = false;

  if (!branchHasData(branch)) {
    return { trucks, points, boxes, messages };
  }

  if (branch.trucks > 0 && branch.points > 0 && branch.trucks >= branch.points) {
    trucks = true;
    points = true;
    messages.push('מספר המשאיות גדול או שווה למספר הנקודות. בגיליון המשאיות הן העמודה שמיד מימין לתאריך, ואחר כך נקודות.');
  }

  if (branch.points > 0 && branch.boxes > 0 && branch.points >= branch.boxes) {
    points = true;
    boxes = true;
    messages.push('מספר הנקודות גדול או שווה למספר התיבות. בדרך כלל יש הרבה יותר תיבות מנקודות.');
  }

  if ((branch.boxes > 0 || branch.points > 0) && branch.trucks <= 0) {
    trucks = true;
    messages.push('יש תיבות או נקודות בלי מספר משאיות, ולכן אין ממוצע לנהג.');
  }

  return { trucks, points, boxes, messages };
}

/** True when the trucks/points/boxes inequality looks like a shifted column. */
export function hasColumnSuspicion(branch: BranchData): boolean {
  if (branch.trucks > 0 && branch.points > 0 && branch.trucks >= branch.points) return true;
  if (branch.points > 0 && branch.boxes > 0 && branch.points >= branch.boxes) return true;
  return false;
}

export function reportHasColumnSuspicion(report: ExtractedReport): boolean {
  return hasColumnSuspicion(report.beerSheva) || hasColumnSuspicion(report.tzora);
}

/**
 * If the three counts are positive and not in trucks < points < boxes order,
 * offer the sorted assignment. The caller shows it; nothing is applied silently.
 */
export function suggestedColumnFix(branch: BranchData): BranchData | null {
  if (!(branch.trucks > 0 && branch.points > 0 && branch.boxes > 0)) return null;
  if (branch.trucks < branch.points && branch.points < branch.boxes) return null;

  const [trucks, points, boxes] = [branch.trucks, branch.points, branch.boxes].sort((a, b) => a - b);
  if (!(trucks < points && points < boxes)) return null;
  if (trucks === branch.trucks && points === branch.points && boxes === branch.boxes) return null;

  return { ...branch, trucks, points, boxes, avgBoxes: 0, avgPoints: 0 };
}

export function dateWarning(date: string): string | null {
  const value = date.trim();
  if (!value) return 'חסר תאריך';
  if (!/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(value)) return 'התאריך צריך להיות בפורמט DD/MM/YYYY';
  return null;
}

export function collectReportWarnings(report: ExtractedReport): string[] {
  const warnings: string[] = [];
  const date = dateWarning(report.date);
  if (date) warnings.push(date);

  const beer = inspectBranch(report.beerSheva);
  const tzora = inspectBranch(report.tzora);
  for (const message of beer.messages) warnings.push(`באר שבע: ${message}`);
  for (const message of tzora.messages) warnings.push(`צרעה: ${message}`);
  return warnings;
}
