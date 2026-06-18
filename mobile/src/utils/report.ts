import { ExtractedReport, TruckTransfers } from '../types';
import { fmtAvgBoxes, fmtAvgPoints, fmtInt, withCalculatedAverages } from './averages';
import { buildBashNote, buildTzraNote, formatTrucksLine } from './truckNotes';

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

  return `שלום ${managerName}

דוח נתונים לתאריך ${data.date}

סניף באר שבע
${fmtInt(bash.boxes)} תיבות
${fmtInt(bash.points)} נקודות
${formatTrucksLine(bash.trucks, bashNote)}
ממוצע לנהג
${fmtAvgBoxes(bashAvg.avgBoxes)} תיבות
${fmtAvgPoints(bashAvg.avgPoints)} נקודות

${SEPARATOR}

דוח נתונים לתאריך ${data.date}

סניף צרעה
${fmtInt(tzora.boxes)} תיבות
${fmtInt(tzora.points)} נקודות
${formatTrucksLine(tzora.trucks, tzraNote)}
ממוצע לנהג
${fmtAvgBoxes(tzraAvg.avgBoxes)} תיבות
${fmtAvgPoints(tzraAvg.avgPoints)} נקודות`;
}
