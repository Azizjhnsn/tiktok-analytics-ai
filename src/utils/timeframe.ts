import { RANGE_CODE_DAYS } from '@/config/constants';
import type { Timeframe } from '@/types/organized';
import { toNumber } from './insight';

const DAY_MS = 86_400_000;

function localDate(ms: number): string {
  const date = new Date(ms);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

/**
 * Time window of one insight key, from the request's `type_requests` entry for it
 * (or the only entry, for numeric-type requests whose response keys differ from the request).
 */
export function timeframeFor(key: string, typeRequests: Record<string, unknown>[], capturedAt: string): Timeframe {
  const request =
    typeRequests.find((r) => (r.insigh_type ?? r.insight_type) === key) ?? (typeRequests.length === 1 ? typeRequests[0] : {});
  const days = toNumber(request.days) ?? undefined;
  const endDays = toNumber(request.end_days) ?? undefined;
  const range = toNumber(request.range) ?? undefined;
  const timeframe: Timeframe = {
    capturedAt,
    days,
    endDays,
    range,
    rangeDays: range === undefined ? undefined : RANGE_CODE_DAYS[range],
    dataDateRange: toNumber(request.data_date_range) ?? undefined,
  };
  if (days !== undefined) {
    const end = new Date(capturedAt).getTime() - (endDays ?? 0) * DAY_MS;
    timeframe.toDate = localDate(end);
    timeframe.fromDate = localDate(end - (days - 1) * DAY_MS);
  }
  return timeframe;
}

/** Stable id for "same window", ignoring when it was captured. */
export function timeframeKey({ days, endDays, range, dataDateRange }: Timeframe): string {
  return JSON.stringify([days, endDays, range, dataDateRange]);
}
