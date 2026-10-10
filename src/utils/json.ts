/** Parses JSON text; returns the original text when it isn't valid JSON. */
export function safeParseJson(text: string | null): unknown {
  if (text === null) return null;
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

/** Shallow copy of an object without the given keys; non-objects are returned as-is. */
export function omitKeys(value: unknown, keys: string[]): unknown {
  if (!isRecord(value)) return value;
  return Object.fromEntries(Object.entries(value).filter(([key]) => !keys.includes(key)));
}

export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}
