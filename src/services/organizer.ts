import {
  INSIGHT_PATH_PATTERN,
  ITEM_LIST_PATH,
  NON_INSIGHT_BODY_KEYS,
  PRIVATE_VISIBILITY,
  RETENTION_KEY,
  USER_PATH,
} from '@/config/constants';
import type { CaptureRecord } from '@/types/capture';
import type { AccountInsight, OrganizedData, OrganizedVideo, VideoSummary } from '@/types/organized';
import {
  biggestDrop,
  readKeyedShares,
  readMetric,
  readRetentionCurve,
  retentionAt,
  toNumber,
} from '@/utils/insight';
import { isRecord } from '@/utils/json';
import { ratio, round } from '@/utils/math';
import { timeframeFor, timeframeKey } from '@/utils/timeframe';
import { getTypeRequests } from '@/utils/url';
import { getAuthorUsername, getItemList } from './capture';

/** Turns raw captures into one analysis-ready structure. Pure: reads nothing but its input. */
export function organize(captures: CaptureRecord[]): OrganizedData {
  const chronological = [...captures].sort((a, b) => a.capturedAt.localeCompare(b.capturedAt));
  const insightCaptures = chronological.filter((c) => INSIGHT_PATH_PATTERN.test(c.path));

  const accountInsights = accountInsightsByTimeframe(insightCaptures.filter((c) => c.videoId === null));
  const byVideo = groupByVideo(insightCaptures);
  const listItems = latestListItems(chronological);
  const videoIds = new Set([...byVideo.keys(), ...listItems.keys()]);

  const videos = [...videoIds]
    .map((id) => {
      const captures = byVideo.get(id) ?? [];
      return organizeVideo(id, mergeInsights(captures), captures.at(-1)?.capturedAt ?? null, listItems.get(id));
    })
    .sort((a, b) => (b.summary.createdAt ?? '').localeCompare(a.summary.createdAt ?? ''));

  const posted = videos.map((v) => v.summary.createdAt).filter((d): d is string => d !== null).sort();
  return {
    account: { username: findUsername(videos), userId: findUserId(chronological), insights: accountInsights },
    coverage: {
      capturedFrom: chronological[0]?.capturedAt ?? null,
      capturedTo: chronological.at(-1)?.capturedAt ?? null,
      videosPostedFrom: posted[0] ?? null,
      videosPostedTo: posted.at(-1) ?? null,
    },
    videos,
  };
}

/** Each key keeps its latest non-null value per distinct time window (e.g. 7 days and 28 days side by side). */
function accountInsightsByTimeframe(captures: CaptureRecord[]): Record<string, AccountInsight[]> {
  const byKey: Record<string, Map<string, AccountInsight>> = {};
  for (const capture of captures) {
    if (!isRecord(capture.body)) continue;
    const typeRequests = getTypeRequests(capture.url);
    for (const [key, value] of Object.entries(capture.body)) {
      if (value === null || NON_INSIGHT_BODY_KEYS.includes(key)) continue;
      const timeframe = timeframeFor(key, typeRequests, capture.capturedAt);
      (byKey[key] ??= new Map()).set(timeframeKey(timeframe), { timeframe, value });
    }
  }
  return Object.fromEntries(Object.entries(byKey).map(([key, entries]) => [key, [...entries.values()]]));
}

/** Latest non-null value per body key; request/response metadata is dropped. */
function mergeInsights(captures: CaptureRecord[]): Record<string, unknown> {
  const merged: Record<string, unknown> = {};
  for (const { body } of captures) {
    if (!isRecord(body)) continue;
    for (const [key, value] of Object.entries(body)) {
      if (value !== null && !NON_INSIGHT_BODY_KEYS.includes(key)) merged[key] = value;
    }
  }
  return merged;
}

function groupByVideo(captures: CaptureRecord[]): Map<string, CaptureRecord[]> {
  const groups = new Map<string, CaptureRecord[]>();
  for (const capture of captures) {
    if (capture.videoId) groups.set(capture.videoId, [...(groups.get(capture.videoId) ?? []), capture]);
  }
  return groups;
}

function latestListItems(captures: CaptureRecord[]): Map<string, Record<string, unknown>> {
  const items = captures.filter((c) => c.path === ITEM_LIST_PATH).flatMap((c) => getItemList(c.body));
  return new Map(items.map((item) => [String(item.item_id), item]));
}

function organizeVideo(
  id: string,
  insights: Record<string, unknown>,
  dataAsOf: string | null,
  listItem?: Record<string, unknown>,
): OrganizedVideo {
  const info = isRecord(insights.video_info) ? insights.video_info : {};
  const stats = isRecord(info.statistics) ? info.statistics : {};
  const video = isRecord(info.video) ? info.video : {};
  const item = listItem ?? {};

  const views = toNumber(stats.play_count) ?? readMetric(insights.realtime_total_video_views) ?? toNumber(item.play_count);
  const likes = toNumber(stats.digg_count) ?? toNumber(item.like_count);
  const comments = toNumber(stats.comment_count) ?? toNumber(item.comment_count);
  const shares = toNumber(stats.share_count) ?? toNumber(item.share_count);
  const saves = toNumber(stats.collect_count) ?? toNumber(item.favorite_count);
  const durationMs = toNumber(video.duration) || toNumber(item.duration);
  const durationSec = durationMs ? durationMs / 1000 : null;
  const createTime = toNumber(info.create_time) ?? toNumber(item.create_time);
  const avgWatchSec = readMetric(insights.video_per_duration_realtime);
  const curve = readRetentionCurve(insights[RETENTION_KEY]);

  const summary: VideoSummary = {
    id,
    dataAsOf,
    caption: typeof info.desc === 'string' ? info.desc : typeof item.desc === 'string' ? item.desc : null,
    createdAt: createTime ? new Date(createTime * 1000).toISOString() : null,
    durationSec,
    isPhoto: Boolean(info.image_post_info) || (durationSec === null && views !== null),
    isPrivate: toNumber(item.visibility) === PRIVATE_VISIBILITY,
    coverUrl: findCoverUrl(info, video, item),
    views,
    likes,
    comments,
    shares,
    saves,
    likeRate: round(ratio(likes, views)),
    commentRate: round(ratio(comments, views)),
    shareRate: round(ratio(shares, views)),
    saveRate: round(ratio(saves, views)),
    avgWatchSec,
    avgWatchRate: round(ratio(avgWatchSec, durationSec)),
    finishRate: readMetric(insights.video_finish_rate_realtime),
    retention2s: retentionAt(curve, 2),
    retention3s: retentionAt(curve, 3),
    biggestDrop: biggestDrop(curve),
    newFollowers: readMetric(insights.realtime_new_followers) ?? readMetric(insights.video_new_followers),
    trafficSources: readKeyedShares(insights.video_traffic_source_percent_realtime),
    retentionCurve: curve,
  };
  return { summary, insights };
}

function findUsername(videos: OrganizedVideo[]): string | null {
  for (const { insights } of videos) {
    const username = getAuthorUsername(insights);
    if (username) return username;
  }
  return null;
}

function findUserId(captures: CaptureRecord[]): string | null {
  const body = captures.findLast((c) => c.path === USER_PATH)?.body;
  return isRecord(body) && typeof body.userId === 'string' ? body.userId : null;
}

/** First cover link found in the captured video info, photo-post info or post list. */
function findCoverUrl(info: Record<string, unknown>, video: Record<string, unknown>, item: Record<string, unknown>): string | null {
  const photoCover = isRecord(info.image_post_info) ? info.image_post_info.image_post_cover : undefined;
  const candidates = [
    isRecord(video.cover) ? video.cover.url_list : undefined,
    isRecord(photoCover) && isRecord(photoCover.display_image) ? photoCover.display_image.url_list : undefined,
    item.cover_url,
  ];
  for (const list of candidates) {
    if (Array.isArray(list) && typeof list[0] === 'string') return list[0];
  }
  return null;
}
