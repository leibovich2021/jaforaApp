import { ExtractedReport, TruckTransfers } from '../types';
import { fmtAvgBoxes, fmtAvgPoints, fmtInt, withCalculatedAverages } from './averages';

function buildBashNote(transfers: TruckTransfers): string {
  return `(${transfers.eilat} משאיות לאילת ו-${transfers.bashToTzra} משאיות לסניף צרעה)`;
}

function buildTzraNote(transfers: TruckTransfers): string {
  return `(${transfers.tzraToBeerot} משאיות לבארות יצחק, ${transfers.beerotToTzra} משאיות מבארות יצחק)`;
}

/** מפריד בין סניפים — קצר, שורה אחת, נראה טוב בוואטסאפ */
const SEPARATOR = '━━━━━━━━━━━━━━━━━━━━━━';

export function buildReportText(
  data: ExtractedReport,
  transfers: TruckTransfers,
  managerName: string,
): string {
  const { beerSheva: bash, tzora } = data;
  const bashAvg = withCalculatedAverages(bash);
  const tzraAvg = withCalculatedAverages(tzora);
  const bashNote = buildBashNote(transfers);
  const tzraNote = buildTzraNote(transfers);

  return `שלום ${managerName} דוח נתונים

נתונים לתאריך ${data.date}

סניף באר שבע
${fmtInt(bash.boxes)} תיבות
${fmtInt(bash.points)} נקודות
${fmtInt(bash.trucks)} משאיות ${bashNote}
ממוצע לנהג
${fmtAvgBoxes(bashAvg.avgBoxes)} תיבות
${fmtAvgPoints(bashAvg.avgPoints)} נקודות

${SEPARATOR}

נתונים לתאריך ${data.date}

סניף צרעה
${fmtInt(tzora.boxes)} תיבות
${fmtInt(tzora.points)} נקודות
${fmtInt(tzora.trucks)} משאיות ${tzraNote}
ממוצע לנהג
${fmtAvgBoxes(tzraAvg.avgBoxes)} תיבות
${fmtAvgPoints(tzraAvg.avgPoints)} נקודות`;
}
