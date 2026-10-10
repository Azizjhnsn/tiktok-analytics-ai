/** part / whole, or null when either is missing or whole is 0. */
export function ratio(part: number | null, whole: number | null): number | null {
  return part === null || whole === null || whole === 0 ? null : part / whole;
}

export function round(value: number | null, decimals = 4): number | null {
  if (value === null) return null;
  const factor = 10 ** decimals;
  return Math.round(value * factor) / factor;
}
