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

export function buildReportText(
  data: ExtractedReport,
  transfers: TruckTransfers,
  managerName: string,
): string {
  const { beerSheva: bash, tzora } = data;
  const hasTzra = branchHasData(tzora);
  const hasBash = branchHasData(bash);

  const blocks: string[] = [];
  if (hasTzra) {
    blocks.push(buildBranchBlock('צרעה', tzora, buildTzraNote(transfers), data.date));
  }
  if (hasBash) {
    blocks.push(buildBranchBlock('באר שבע', bash, buildBashNote(transfers), data.date));
  }

  return `שלום ${managerName}\n\n${blocks.join(`\n\n${SEPARATOR}\n\n`)}`;
}
