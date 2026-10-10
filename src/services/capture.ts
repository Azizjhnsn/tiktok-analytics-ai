import { ITEM_LIST_PATH, RETENTION_KEY, VOLATILE_BODY_KEYS } from '@/config/constants';
import type { CaptureRecord, DataStats, RawCapture } from '@/types/capture';
import { hashString } from '@/utils/hash';
import { isRecord, omitKeys, safeParseJson } from '@/utils/json';
import {
  extractInsightTypes,
  extractVideoIdFromPage,
  extractVideoIdFromRequest,
  getPath,
} from '@/utils/url';
import {
  addCapture,
  countCaptures,
  findCapture,
  getCapturedVideoIds,
  getCapturesByPath,
  getCapturesByVideoId,
  getLatestCaptureTime,
  getSettings,
  getWalkState,
} from './storage';

/** Wraps a raw response with lookup keys. The response body itself is kept untouched. */
export function toCaptureRecord(raw: RawCapture): CaptureRecord {
  const path = getPath(raw.url);
  const requestBody = safeParseJson(raw.requestBody);
  const body = safeParseJson(raw.responseText);
  const query = new URL(raw.url).search;
  return {
    url: raw.url,
    path,
    method: raw.method,
    status: raw.status,
    pageUrl: raw.pageUrl,
    capturedAt: raw.capturedAt,
    videoId: extractVideoIdFromRequest(raw.url) ?? extractVideoIdFromPage(raw.pageUrl),
    insightTypes: extractInsightTypes(raw.url),
    contentKey: hashString(JSON.stringify([path, query, requestBody, omitKeys(body, VOLATILE_BODY_KEYS)])),
    requestBody,
    body,
  };
}

async function shouldCapture(): Promise<boolean> {
  const [settings, walk] = await Promise.all([getSettings(), getWalkState()]);
  return (settings.mode === 'manual' && settings.passiveCapture) || walk.status === 'running';
}

export async function saveCapture(raw: RawCapture): Promise<void> {
  if (!(await shouldCapture())) return;
  await addCapture(toCaptureRecord(raw));
}

export async function getDataStats(): Promise<DataStats> {
  const [totalCaptures, videoIds, lastCapturedAt] = await Promise.all([
    countCaptures(),
    getCapturedVideoIds(),
    getLatestCaptureTime(),
  ]);
  return { totalCaptures, videoCount: videoIds.length, lastCapturedAt };
}

export function getItemList(body: unknown): Record<string, unknown>[] {
  return isRecord(body) && Array.isArray(body.item_list) ? body.item_list.filter(isRecord) : [];
}

/** All video IDs seen in captured post lists, newest first. */
export async function getKnownVideoIds(): Promise<string[]> {
  const items = (await getCapturesByPath(ITEM_LIST_PATH)).flatMap((capture) => getItemList(capture.body));
  const byId = new Map(items.map((item) => [String(item.item_id), Number(item.create_time ?? 0)]));
  return [...byId.entries()].sort((a, b) => b[1] - a[1]).map(([id]) => id);
}

/** Post-list pages captured since `sinceIso`, and whether the last page hasn't been reached yet. */
export async function getPostListProgress(sinceIso: string): Promise<{ captures: number; hasMore: boolean }> {
  const captures = (await getCapturesByPath(ITEM_LIST_PATH)).filter((c) => c.capturedAt >= sinceIso);
  const reachedEnd = captures.some((c) => isRecord(c.body) && c.body.has_more === false);
  return { captures: captures.length, hasMore: !reachedEnd };
}

/**
 * True when a video with views (not a photo post) has no retention curve captured.
 * TikTok sometimes omits it from a response; a revisit can recover it.
 */
export async function isMissingRetention(videoId: string): Promise<boolean> {
  const bodies = (await getCapturesByVideoId(videoId)).map((c) => c.body).filter(isRecord);
  if (bodies.some((body) => RETENTION_KEY in body)) return false;
  const info = bodies.map((body) => body.video_info).find(isRecord);
  const plays = isRecord(info?.statistics) ? Number(info.statistics.play_count ?? 0) : 0;
  return plays > 0 && !info?.image_post_info;
}

/** The account's @username, read from any captured video_info. */
export async function findUsername(): Promise<string | null> {
  const capture = await findCapture((c) => getAuthorUsername(c.body) !== null);
  return capture ? getAuthorUsername(capture.body) : null;
}

/** @username from a body (or merged insights) containing `video_info`. */
export function getAuthorUsername(body: unknown): string | null {
  const info = isRecord(body) ? body.video_info : undefined;
  const author = isRecord(info) ? info.author : undefined;
  return isRecord(author) && typeof author.unique_id === 'string' ? author.unique_id : null;
}
