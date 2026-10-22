/**
 * Shared extraction instructions and JSON schema.
 * Column order is screen position: immediately RIGHT of the date is trucks,
 * then points, then boxes. Branch names are row labels, not a column in between.
 */

const branchProperties = {
  trucks: {
    type: 'integer',
    description:
      'משאיות. The integer in the cell immediately to the right of the date on this row. A small count, usually well under 80.',
  },
  points: {
    type: 'integer',
    description:
      'נקודות (stops). The next cell to the right of trucks. Normally larger than trucks and smaller than boxes.',
  },
  boxes: {
    type: 'integer',
    description:
      'תיבות. The next cell to the right of points. Normally the largest number, often in the thousands.',
  },
  avgBoxes: {
    type: 'integer',
    description: 'Always 0. The app calculates averages.',
  },
  avgPoints: {
    type: 'integer',
    description: 'Always 0. The app calculates averages.',
  },
} as const;

const branchRequired = ['trucks', 'points', 'boxes', 'avgBoxes', 'avgPoints'];

export function reportJsonSchema(strict: boolean): Record<string, unknown> {
  const branch: Record<string, unknown> = {
    type: 'object',
    properties: branchProperties,
    required: branchRequired,
  };
  if (strict) branch.additionalProperties = false;

  const root: Record<string, unknown> = {
    type: 'object',
    properties: {
      date: {
        type: 'string',
        description: 'Latest date that actually has numbers, formatted DD/MM/YYYY.',
      },
      dayName: {
        type: 'string',
        description: 'Hebrew weekday printed with that date, such as יום שני. Empty string if it is not visible.',
      },
      beerSheva: branch,
      tzora: {
        type: 'object',
        properties: branchProperties,
        required: branchRequired,
        ...(strict ? { additionalProperties: false } : {}),
      },
    },
    required: ['date', 'dayName', 'beerSheva', 'tzora'],
  };
  if (strict) root.additionalProperties = false;
  return root;
}

export const EXTRACTION_PROMPT = `You read one photo of a fixed Hebrew Excel sheet of daily truck-delivery data and return JSON only.

COLUMN GEOMETRY — use the photo, not Excel column letters.
Find the DATE (DD/MM/YYYY, often with a Hebrew weekday such as יום שני).
The three numbers sit IMMEDIATELY TO THE RIGHT of that date column, left to right, in this exact order:

| DATE (תאריך + יום) | TRUCKS (משאיות) | POINTS (נקודות, stops) | BOXES (תיבות) |

- trucks = the cell directly to the right of the date
- points = the next cell to the right of trucks
- boxes = the next cell to the right of points

There is NO branch-name column between the date and the trucks. Do not skip a column. Do not swap trucks and points.
באר שבע and צרעה are ROW labels (one summary row each). They may be written in the date column or beside the row. They are not a numeric column.
Ignore columns to the LEFT of the date, headers, totals, and detail lines under a summary row.
Read the cell that is physically in that column. Do not rearrange numbers so they "look reasonable".

ROWS:
- beerSheva = the single summary row labeled באר שבע
- tzora = the single summary row labeled צרעה
If a branch row is missing or its cells are empty, use 0 for trucks, points, and boxes.
At least one branch on the chosen date must have a real number.

DATE:
The sheet lists many future dates. Empty cells are not data.
Choose the latest date chronologically where at least one of באר שבע or צרעה has a number in trucks, points, or boxes.
Do not pick a later date whose branch rows are empty.
date is DD/MM/YYYY. dayName is the Hebrew weekday on that date, or "" if it is not visible.

Set avgBoxes and avgPoints to 0.

Example of the column mapping (numbers are illustrative):
{"date":"22/06/2026","dayName":"יום שני","beerSheva":{"trucks":14,"points":153,"boxes":17151,"avgBoxes":0,"avgPoints":0},"tzora":{"trucks":14,"points":158,"boxes":22593,"avgBoxes":0,"avgPoints":0}}`;
