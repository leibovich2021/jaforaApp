import { BranchData } from '../types';

export function calcAvgPerTruck(total: number, trucks: number): number {
  if (trucks <= 0) return 0;
  return total / trucks;
}

export function withCalculatedAverages(branch: BranchData): BranchData {
  return {
    ...branch,
    avgBoxes: calcAvgPerTruck(branch.boxes, branch.trucks),
    avgPoints: calcAvgPerTruck(branch.points, branch.trucks),
  };
}

/** ממוצע תיבות — מספר שלם (עיגול) */
export function fmtAvgBoxes(n: number): string {
  return Math.round(n).toLocaleString('he-IL');
}

/** ממוצע נקודות — מספר עשרוני */
export function fmtAvgPoints(n: number): string {
  return n.toLocaleString('he-IL', {
    minimumFractionDigits: 1,
    maximumFractionDigits: 2,
  });
}

export function fmtInt(n: number): string {
  return n.toLocaleString('he-IL');
}

/** לפחות ערך אחד (משאיות / נקודות / תיבות) קיים בשורת הסניף */
export function branchHasData(branch: BranchData): boolean {
  return branch.trucks > 0 || branch.points > 0 || branch.boxes > 0;
}
