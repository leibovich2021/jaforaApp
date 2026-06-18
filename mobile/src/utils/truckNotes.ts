import { TruckTransfers } from '../types';

function part(count: number, label: string): string | null {
  if (count <= 0) return null;
  return `${count} משאיות ${label}`;
}

/** הערות משאיות לבאר שבע — רק כמויות > 0 */
export function buildBashNote(transfers: TruckTransfers): string {
  const parts = [
    part(transfers.eilat, 'לאילת'),
    part(transfers.bashToTzra, 'לסניף צרעה'),
  ].filter((p): p is string => p !== null);

  if (parts.length === 0) return '';
  return `(${parts.join(' ו-')})`;
}

/** הערות משאיות לצרעה — רק כמויות > 0 */
export function buildTzraNote(transfers: TruckTransfers): string {
  const parts = [
    part(transfers.tzraToBeerot, 'לבארות יצחק'),
    part(transfers.beerotToTzra, 'מבארות יצחק'),
  ].filter((p): p is string => p !== null);

  if (parts.length === 0) return '';
  return `(${parts.join(', ')})`;
}

export function formatTrucksLine(trucks: number, note: string): string {
  const base = `${trucks.toLocaleString('he-IL')} משאיות`;
  return note ? `${base} ${note}` : base;
}
