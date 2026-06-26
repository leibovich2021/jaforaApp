import { ExtractedReport, BranchData } from '../types';
import { branchHasData } from '../utils/averages';

const EMPTY_BRANCH: BranchData = {
  boxes: 0,
  points: 0,
  trucks: 0,
  avgBoxes: 0,
  avgPoints: 0,
};

function normalizeBranch(raw: unknown): BranchData {
  if (!raw || typeof raw !== 'object') return { ...EMPTY_BRANCH };
  const b = raw as Record<string, unknown>;
  return {
    boxes: Number(b.boxes) || 0,
    points: Number(b.points) || 0,
    trucks: Number(b.trucks) || 0,
    avgBoxes: 0,
    avgPoints: 0,
  };
}

const EXTRACTION_PROMPT = `You are reading a photo of a Hebrew Excel spreadsheet with daily logistics data.

TABLE LAYOUT (columns, RIGHT to LEFT — Hebrew reading order):
1. Column A (rightmost): DATE and DAY — general column (e.g. "22/06/2026" and "יום שני")
2. Next column: BRANCH NAME (שם סניף) — e.g. "באר שבע" or "צרעה"
3. Next column: TRUCKS (משאיות) — number of trucks
4. Next column: POINTS (נקודות) — number of points
5. Next column (leftmost): BOXES (תיבות) — number of boxes

CRITICAL — ONE ROW PER BRANCH:
Each branch has exactly ONE data row under a date block. On that row, read leftward from the branch name:
  שם סניף → משאיות → נקודות → תיבות
Example for row "צרעה": trucks = value in משאיות column, points = value in נקודות column, boxes = value in תיבות column.
Same rule for row "באר שבע". Do NOT mix columns. Do NOT swap trucks/points/boxes. Do NOT sum sub-rows or detail lines — use only the single summary row per branch.

DATE RULE — MOST IMPORTANT:
The table lists dates for a whole year ahead. Many future dates have NO data (empty cells).
A date "has data" when AT LEAST ONE branch row ("באר שבע" OR "צרעה") has real numbers in משאיות, נקודות, and/or תיבות.
On some days only one branch has data; on other days both branches have data. Both cases are valid.
Do NOT use the latest calendar date. Do NOT use dates where all branch rows are empty.
Find the LATEST date (most recent chronologically) that ACTUALLY HAS DATA (one or both branches).
Example: if 26/06/2026 has data and 28/06/2026 exists but is empty — use 26/06/2026 only.

EXTRACT for that date:
- date (DD/MM/YYYY) and dayName (Hebrew, e.g. יום שני) from the date column
- beerSheva: trucks, points, boxes from the באר שבע row — if row is empty/missing, use 0 for all fields
- tzora: trucks, points, boxes from the צרעה row — if row is empty/missing, use 0 for all fields
- At least one branch must have real data on the chosen date

Averages are calculated by the app — set avgBoxes and avgPoints to 0.

Return ONLY valid JSON, no markdown:
{
  "date": "22/06/2026",
  "dayName": "יום שני",
  "beerSheva": { "boxes": 17151, "points": 153, "trucks": 14, "avgBoxes": 0, "avgPoints": 0 },
  "tzora": { "boxes": 22593, "points": 158, "trucks": 14, "avgBoxes": 0, "avgPoints": 0 }
}`;

function parseGeminiJson(text: string): ExtractedReport {
  const cleaned = text
    .replace(/```json\s*/gi, '')
    .replace(/```\s*/g, '')
    .trim();

  const start = cleaned.indexOf('{');
  const end = cleaned.lastIndexOf('}');
  if (start === -1 || end === -1) {
    throw new Error('לא הצלחתי לקרוא את הנתונים מהתמונה');
  }

  const parsed = JSON.parse(cleaned.slice(start, end + 1));

  if (!parsed.date) {
    throw new Error('חסרים נתונים בתשובה — נסה לצלם שוב');
  }

  const beerSheva = normalizeBranch(parsed.beerSheva);
  const tzora = normalizeBranch(parsed.tzora);

  if (!branchHasData(beerSheva) && !branchHasData(tzora)) {
    throw new Error('לא נמצאו נתונים בתמונה — נסה לצלם שוב');
  }

  return {
    date: String(parsed.date),
    dayName: String(parsed.dayName ?? ''),
    beerSheva,
    tzora,
  };
}

// מודל קל קודם — מהיר יותר; גיבוי אם לא זמין
const MODELS = ['gemini-2.5-flash-lite', 'gemini-2.5-flash', 'gemini-flash-latest'];

async function callGemini(
  base64: string,
  mimeType: string,
  apiKey: string,
  model: string,
) {
  return fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey.trim()}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              { text: EXTRACTION_PROMPT },
              { inline_data: { mime_type: mimeType, data: base64 } },
            ],
          },
        ],
        generationConfig: {
          temperature: 0.1,
          responseMimeType: 'application/json',
        },
      }),
    },
  );
}

export async function extractReportFromImage(
  base64: string,
  mimeType: string,
  apiKey: string,
): Promise<ExtractedReport> {
  if (!apiKey.trim()) {
    throw new Error('חסר מפתח Gemini — הוסף בהגדרות');
  }

  let lastError = 'שגיאה בקריאת התמונה';
  for (const model of MODELS) {
    const response = await callGemini(base64, mimeType, apiKey, model);

    if (!response.ok) {
      if (response.status === 400 || response.status === 403) {
        throw new Error('מפתח API לא תקין — בדוק בהגדרות');
      }
      if (response.status === 404) {
        lastError = `מודל ${model} לא זמין — מנסה מודל אחר...`;
        continue;
      }
      lastError = `שגיאת Gemini (${model}): ${response.status}`;
      continue;
    }

    const result = await response.json();
    const text = result?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text) {
      lastError = 'לא נמצאו נתונים בתמונה';
      continue;
    }

    return parseGeminiJson(text);
  }

  throw new Error(lastError);
}
