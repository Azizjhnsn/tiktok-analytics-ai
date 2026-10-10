export function nowIso(): string {
  return new Date().toISOString();
}

/** Compact filename timestamp, e.g. 20261009-1330 */
export function fileTimestamp(date: Date = new Date()): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${date.getFullYear()}${pad(date.getMonth() + 1)}${pad(date.getDate())}-${pad(date.getHours())}${pad(date.getMinutes())}`;
}

export function formatDateTime(iso: string | null): string {
  return iso ? new Date(iso).toLocaleString() : '—';
}
