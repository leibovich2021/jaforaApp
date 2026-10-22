/** Pull the JSON text out of a generateContent response, skipping thought parts. */
export function textFromGemini(json: unknown): { text: string; diagnostic: string } {
  const root = json && typeof json === 'object' ? (json as Record<string, unknown>) : {};
  const candidates = Array.isArray(root.candidates) ? root.candidates : [];
  const candidate = candidates[0] && typeof candidates[0] === 'object'
    ? (candidates[0] as Record<string, unknown>)
    : {};
  const content = candidate.content && typeof candidate.content === 'object'
    ? (candidate.content as Record<string, unknown>)
    : {};
  const parts = Array.isArray(content.parts) ? content.parts : [];

  const visible: string[] = [];
  const thoughts: string[] = [];
  for (const part of parts) {
    if (!part || typeof part !== 'object') continue;
    const record = part as Record<string, unknown>;
    if (typeof record.text !== 'string' || !record.text.trim()) continue;
    if (record.thought === true) thoughts.push(record.text);
    else visible.push(record.text);
  }

  const text = (visible.length > 0 ? visible : thoughts).join('\n').trim();
  const finish = typeof candidate.finishReason === 'string' ? candidate.finishReason : '';
  const feedback = root.promptFeedback && typeof root.promptFeedback === 'object'
    ? (root.promptFeedback as Record<string, unknown>)
    : {};
  const block = typeof feedback.blockReason === 'string' ? feedback.blockReason : '';
  const diagnostic = [
    finish && finish !== 'STOP' ? `finishReason=${finish}` : '',
    block ? `blockReason=${block}` : '',
  ]
    .filter(Boolean)
    .join(', ');

  return { text, diagnostic };
}
