export function median(values: number[]): number | null {
  if (values.length === 0) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
}

export function mean(values: number[]): number | null {
  return values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : null;
}

/** Drops nulls so stats only use values TikTok provided. */
export function present(values: (number | null)[]): number[] {
  return values.filter((value): value is number => value !== null);
}

export function formatPercent(value: number | null, decimals = 0): string {
  return value === null ? '—' : `${(value * 100).toFixed(decimals)}%`;
}
