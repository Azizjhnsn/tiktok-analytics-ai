import type { RetentionPoint } from '@/types/organized';
import { isRecord } from './json';

/** Pure readers for TikTok insight entries, e.g. `{ value: { status: 0, value: 5.74 } }`. */

export function toNumber(value: unknown): number | null {
  if (typeof value === 'number') return Number.isFinite(value) ? value : null;
  if (typeof value === 'string' && value.trim() !== '') {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}

/** Unwraps nested `value` fields down to a number, if there is one. */
export function readMetric(entry: unknown): number | null {
  let current = entry;
  for (let depth = 0; depth < 4 && isRecord(current); depth++) current = current.value;
  return toNumber(current);
}

export function readRetentionCurve(entry: unknown): RetentionPoint[] {
  const value = isRecord(entry) ? entry.value : undefined;
  const list = isRecord(value) && Array.isArray(value.list) ? value.list.filter(isRecord) : [];
  return list
    .map((point) => ({ sec: (toNumber(point.timestamp) ?? NaN) / 1000, rate: toNumber(point.value) ?? NaN }))
    .filter((point) => Number.isFinite(point.sec) && Number.isFinite(point.rate))
    .sort((a, b) => a.sec - b.sec);
}

/** Retention at `sec`, from the nearest earlier curve point. */
export function retentionAt(curve: RetentionPoint[], sec: number): number | null {
  return curve.filter((point) => point.sec <= sec).at(-1)?.rate ?? null;
}

export function biggestDrop(curve: RetentionPoint[]): { atSec: number; drop: number } | null {
  let result: { atSec: number; drop: number } | null = null;
  for (let i = 1; i < curve.length; i++) {
    const drop = curve[i - 1].rate - curve[i].rate;
    if (!result || drop > result.drop) result = { atSec: curve[i - 1].sec, drop };
  }
  return result;
}

/** `{ value: { value: [{ key, value }] } }` → `{ key: value }`. */
export function readKeyedShares(entry: unknown): Record<string, number> {
  const outer = isRecord(entry) ? entry.value : undefined;
  const list = isRecord(outer) && Array.isArray(outer.value) ? outer.value.filter(isRecord) : [];
  const shares: Record<string, number> = {};
  for (const item of list) {
    const share = toNumber(item.value);
    if (typeof item.key === 'string' && share !== null) shares[item.key] = share;
  }
  return shares;
}
