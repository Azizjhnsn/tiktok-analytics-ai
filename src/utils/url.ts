import {
  ACCOUNT_PAGE_TABS,
  CAPTURE_PATH_PATTERNS,
  STUDIO_BASE_URL,
  TIKTOK_ORIGIN,
  VIDEO_PAGE_PATTERN,
  VIDEO_PAGE_SUFFIXES,
} from '@/config/constants';
import { isRecord, safeParseJson } from './json';

export function toAbsoluteUrl(url: string, base: string): string {
  try {
    return new URL(url, base).href;
  } catch {
    return url;
  }
}

export function getPath(url: string): string {
  try {
    return new URL(url).pathname;
  } catch {
    return url;
  }
}

export function matchesCapturePath(url: string): boolean {
  const path = getPath(url);
  return CAPTURE_PATH_PATTERNS.some((pattern) => pattern.test(path));
}

export function extractVideoIdFromPage(pageUrl: string): string | null {
  return getPath(pageUrl).match(VIDEO_PAGE_PATTERN)?.[1] ?? null;
}

/** The `type_requests` query param: a JSON array of insight request objects. */
/** Parsed `type_requests` query param: one entry per requested insight, with its time window. */
export function getTypeRequests(url: string): Record<string, unknown>[] {
  try {
    const raw = new URL(url).searchParams.get('type_requests');
    const parsed = safeParseJson(raw);
    return Array.isArray(parsed) ? parsed.filter(isRecord) : [];
  } catch {
    return [];
  }
}

/** Insight types requested (TikTok uses both `insigh_type` and `insight_type`). */
export function extractInsightTypes(url: string): string[] {
  const types = getTypeRequests(url).map((req) => req.insigh_type ?? req.insight_type);
  return [...new Set(types.filter((type) => type !== undefined).map(String))];
}

/** Video ID referenced by the request itself (`aweme_id` / `item_id`), if any. */
export function extractVideoIdFromRequest(url: string): string | null {
  for (const req of getTypeRequests(url)) {
    const id = req.aweme_id ?? req.item_id;
    if (id !== undefined) return String(id);
  }
  try {
    return new URL(url).searchParams.get('item_id');
  } catch {
    return null;
  }
}

export function videoPageUrls(videoId: string): string[] {
  return VIDEO_PAGE_SUFFIXES.map((suffix) => `${STUDIO_BASE_URL}/analytics/${videoId}${suffix}`);
}

/** Account analytics pages, once per date range, e.g. /analytics/viewers?dateRange={"type":"fixed","pastDay":28} */
export function accountPageUrls(rangeDays: number[]): string[] {
  return rangeDays.flatMap((days) => {
    const query = `dateRange=${encodeURIComponent(JSON.stringify({ type: 'fixed', pastDay: days }))}`;
    return ACCOUNT_PAGE_TABS.map((tab) => `${STUDIO_BASE_URL}/analytics/${tab}?${query}`);
  });
}

export function isTikTokUrl(url: string | undefined): boolean {
  return Boolean(url?.startsWith(TIKTOK_ORIGIN));
}
