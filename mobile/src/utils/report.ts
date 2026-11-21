import { ExtractedReport, TruckTransfers, BranchData } from '../types';
import {
  branchHasData,
  fmtAvgBoxes,
  fmtAvgPoints,
  fmtInt,
  withCalculatedAverages,
} from './averages';
import { buildBashNote, buildTzraNote, formatTrucksLine } from './truckNotes';

const SEPARATOR = '━━━━━━━━━━━━━━━━━━━━━━';

function countOf(
  branch: { trucks?: unknown; points?: unknown; boxes?: unknown } | null | undefined,
  field: 'trucks' | 'points' | 'boxes',
): number {
  if (!branch || typeof branch !== 'object') return 0;
  const value = branch[field];
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string') {
    const cleaned = value.replace(/[^\d.-]/g, '');
    if (!cleaned || cleaned === '-' || cleaned === '.') return 0;
    const parsed = Number(cleaned);
    if (Number.isFinite(parsed)) return parsed;
  }
  return 0;
}

function readableBranch(branch: BranchData | null | undefined): BranchData | null {
  if (!branch || typeof branch !== 'object') return null;
  const normalized: BranchData = {
    boxes: countOf(branch, 'boxes'),
    points: countOf(branch, 'points'),
    trucks: countOf(branch, 'trucks'),
    avgBoxes: typeof branch.avgBoxes === 'number' ? branch.avgBoxes : 0,
    avgPoints: typeof branch.avgPoints === 'number' ? branch.avgPoints : 0,
  };
  return branchHasData(normalized) ? normalized : null;
}

function buildBranchBlock(branchLabel: string, branch: BranchData, note: string, date: string): string {
  const avg = withCalculatedAverages(branch);
  return `דוח נתונים לתאריך ${date}

סניף ${branchLabel}
${fmtInt(branch.boxes)} תיבות
${fmtInt(branch.points)} נקודות
${formatTrucksLine(branch.trucks, note)}
ממוצע לנהג
${fmtAvgBoxes(avg.avgBoxes)} תיבות
${fmtAvgPoints(avg.avgPoints)} נקודות`;
}

function buildSummaryBlock(branches: Array<BranchData | null | undefined>): string {
  const trucks = branches.reduce((sum, branch) => sum + countOf(branch, 'trucks'), 0);
  const boxes = branches.reduce((sum, branch) => sum + countOf(branch, 'boxes'), 0);
  return `סיכום שני הסניפים:
סה"כ משאיות: ${fmtInt(trucks)}
סה"כ תיבות: ${fmtInt(boxes)}`;
}

export function buildReportText(
  data: ExtractedReport,
  transfers: TruckTransfers,
  managerName: string,
): string {
  const bash = data?.beerSheva;
  const tzora = data?.tzora;
  const blocks: string[] = [];
  const tzoraBlock = readableBranch(tzora);
  const bashBlock = readableBranch(bash);
  if (tzoraBlock) {
    blocks.push(buildBranchBlock('צרעה', tzoraBlock, buildTzraNote(transfers), data.date));
  }
  if (bashBlock) {
    blocks.push(buildBranchBlock('באר שבע', bashBlock, buildBashNote(transfers), data.date));
  }

  const summary = buildSummaryBlock([tzora, bash]);
  const branchText = blocks.join(`\n\n${SEPARATOR}\n\n`);
  const body = branchText
    ? `${branchText}\n\n${SEPARATOR}\n\n${summary}`
    : `${SEPARATOR}\n\n${summary}`;
  return `שלום ${managerName}\n\n${body}`;
}
