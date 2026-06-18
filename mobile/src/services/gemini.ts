import { ExtractedReport } from '../types';

const EXTRACTION_PROMPT = `You are reading a photo of an Excel spreadsheet with daily logistics data in Hebrew.

The table has rows grouped by date. Each date block contains rows for locations including:
- באר שבע (Be'er Sheva)
- צרעה (Tzora)

IMPORTANT RULE: Find the LATEST date (most recent chronologically) that has actual numeric data filled in for both "באר שבע" and "צרעה" rows. Ignore empty future dates.

For that latest date, extract:
- date (format: DD/MM/YYYY)
- dayName (Hebrew day name, e.g. יום שני)
- beerSheva: total boxes (תיבות), total points (נקודות), trucks (משאיות)
- tzora: same fields

Note: averages will be calculated by the app (boxes/trucks, points/trucks). You may set avgBoxes and avgPoints to 0.

Return ONLY valid JSON, no markdown, no explanation:
{
  "date": "22/06/2026",
  "dayName": "יום שני",
  "beerSheva": { "boxes": 17151, "points": 153, "trucks": 14, "avgBoxes": 1225, "avgPoints": 11 },
  "tzora": { "boxes": 22593, "points": 158, "trucks": 14, "avgBoxes": 1614, "avgPoints": 11 }
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

  if (!parsed.beerSheva || !parsed.tzora || !parsed.date) {
    throw new Error('חסרים נתונים בתשובה — נסה לצלם שוב');
  }

  return parsed as ExtractedReport;
}

const MODELS = ['gemini-2.0-flash', 'gemini-1.5-flash'];

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
