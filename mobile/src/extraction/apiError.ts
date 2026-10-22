export class ProviderRequestError extends Error {
  readonly auth: boolean;

  constructor(message: string, auth = false) {
    super(message);
    this.name = 'ProviderRequestError';
    this.auth = auth;
  }
}

export function cleanApiKey(raw: string): string {
  return raw.replace(/\s+/g, '');
}

export function describeHttpError(status: number, message: string): string {
  const clean = message.replace(/\s+/g, ' ').trim();
  if (!clean) return `HTTP ${status}`;
  if (clean.includes(`HTTP ${status}`)) return clean.slice(0, 700);
  return `HTTP ${status}: ${clean}`.slice(0, 700);
}

/** Model id retired, renamed, or closed to this key. Try another model. */
export function isModelUnavailable(status: number, message: string): boolean {
  const normalized = message.toLowerCase();
  return (
    status === 404 ||
    normalized.includes('not found') ||
    normalized.includes('no longer available') ||
    normalized.includes('not available to new users') ||
    normalized.includes('is not supported for') ||
    normalized.includes('unsupported model') ||
    normalized.includes('model is deprecated') ||
    normalized.includes('was retired')
  );
}

/** Bad or missing key. Do not keep calling the same provider with other models. */
export function isAuthFailure(status: number, message: string): boolean {
  if (isModelUnavailable(status, message)) return false;
  const normalized = message.toLowerCase();
  return (
    status === 401 ||
    status === 403 ||
    normalized.includes('api key not valid') ||
    normalized.includes('api_key_invalid') ||
    normalized.includes('invalid api key') ||
    normalized.includes('incorrect api key') ||
    normalized.includes('unauthenticated') ||
    normalized.includes('permission denied') ||
    normalized.includes('api key expired')
  );
}

/** The request shape (schema / thinking field) was rejected. Retry a simpler body. */
export function isConfigRejection(status: number, message: string): boolean {
  if (status !== 400 || isModelUnavailable(status, message) || isAuthFailure(status, message)) {
    return false;
  }
  return /responseFormat|responseJsonSchema|responseSchema|responseMimeType|thinkingConfig|thinkingLevel|unknown name|cannot find field|invalid json payload/i.test(
    message,
  );
}

export function messageFromBody(json: unknown, raw: string, status: number): string {
  const record = json && typeof json === 'object' ? (json as Record<string, unknown>) : null;
  const error = record?.error;
  let message = '';
  if (typeof error === 'string') message = error;
  else if (error && typeof error === 'object') {
    const err = error as Record<string, unknown>;
    if (typeof err.message === 'string') message = err.message;
  }
  if (!message && typeof record?.message === 'string') message = record.message;
  if (!message) message = raw;
  return describeHttpError(status, message);
}

export function timeoutSignal(ms: number): AbortSignal | undefined {
  try {
    if (typeof AbortSignal !== 'undefined' && typeof AbortSignal.timeout === 'function') {
      return AbortSignal.timeout(ms);
    }
  } catch {
    return undefined;
  }
  return undefined;
}

export interface HttpResult {
  ok: boolean;
  status: number;
  json: unknown;
  raw: string;
}

export async function postJson(
  url: string,
  headers: Record<string, string>,
  body: unknown,
): Promise<HttpResult> {
  let response: Response;
  try {
    response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...headers },
      body: JSON.stringify(body),
      signal: timeoutSignal(50_000),
    });
  } catch (err) {
    if (err instanceof Error && err.name === 'AbortError') {
      throw new ProviderRequestError('הזמן שהוקצב לקריאה נגמר', false);
    }
    const detail = err instanceof Error ? err.message : String(err);
    throw new ProviderRequestError(`אין חיבור לשרת (${detail})`, false);
  }

  const raw = await response.text();
  let json: unknown = null;
  try {
    json = raw ? JSON.parse(raw) : null;
  } catch {
    json = null;
  }
  return { ok: response.ok, status: response.status, json, raw };
}
