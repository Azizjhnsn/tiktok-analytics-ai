import { AUTO_TAG_BATCH_SIZE, FORMAT_SUGGESTIONS, HOOK_TYPE_SUGGESTIONS, REVIEW_VIDEO_COUNT } from '@/config/constants';
import type { AutoTags } from '@/types/enrichment';
import type { VideoSummary } from '@/types/organized';
import { isRecord, safeParseJson } from '@/utils/json';
import { logger } from '@/utils/logger';
import { truncate } from '@/utils/text';
import { nowIso } from '@/utils/time';
import { getAnalysisView } from './analysis';
import { updateEnrichment } from './enrichment';
import { chatCompletion, requireApiKey, type ChatContentPart } from './openai';

/**
 * Auto-tagging: the AI reads each video's cover image and caption and tags format, hook type and on-screen hook text.
 * Cover links come from already-captured data and are fetched by OpenAI, never by the extension or the browser.
 */

const SYSTEM_PROMPT = `You tag TikTok videos from their cover image (usually the first frame) and caption.
For each video return:
- format: one of ${FORMAT_SUGGESTIONS.map((f) => `"${f}"`).join(', ')}, or a short label of your own if none fits.
- hookType: one of ${HOOK_TYPE_SUGGESTIONS.map((h) => `"${h}"`).join(', ')}, judged from the on-screen text and caption opening.
- hookText: the text written on the cover image, verbatim (empty string if none or no image).
Reply as JSON: {"videos":[{"id":"...","format":"...","hookType":"...","hookText":"..."}]}`;

const CAPTION_CHARS = 300;

export type AutoTagProgress = (done: number, total: number) => void;

/** Tags public videos that have no auto tags yet. Returns how many were tagged. */
export async function autoTagMissing(onProgress?: AutoTagProgress): Promise<number> {
  const { videos, enrichment } = await getAnalysisView();
  return autoTagVideos(videos.filter((v) => !v.isPrivate && !enrichment.autoTags[v.id]), onProgress);
}

export async function autoTagVideos(videos: VideoSummary[], onProgress?: AutoTagProgress): Promise<number> {
  if (videos.length === 0) return 0;
  requireApiKey();
  let done = 0;
  onProgress?.(done, videos.length);
  for (let i = 0; i < videos.length; i += AUTO_TAG_BATCH_SIZE) {
    const batch = videos.slice(i, i + AUTO_TAG_BATCH_SIZE);
    const autoTags = await tagBatch(batch);
    await updateEnrichment({ autoTags });
    done += batch.length;
    onProgress?.(done, videos.length);
  }
  return done;
}

/** Tags with cover images; if OpenAI can't load them (e.g. expired links), retries from captions only. */
async function tagBatch(batch: VideoSummary[]): Promise<Record<string, AutoTags>> {
  const withImages = batch.some((v) => v.coverUrl);
  try {
    return await requestTags(batch, withImages);
  } catch (error) {
    if (!withImages) throw error;
    logger.warn('Auto-tagging with images failed; retrying from captions only', error);
    return requestTags(batch, false);
  }
}

async function requestTags(batch: VideoSummary[], withImages: boolean): Promise<Record<string, AutoTags>> {
  const content: ChatContentPart[] = batch.flatMap((video) => {
    const parts: ChatContentPart[] = [
      { type: 'text', text: `Video ${video.id} (${video.durationSec ?? '?'}s${video.isPhoto ? ', photo post' : ''}): ${truncate(video.caption, CAPTION_CHARS)}` },
    ];
    if (withImages && video.coverUrl) parts.push({ type: 'image_url', image_url: { url: video.coverUrl, detail: 'low' } });
    return parts;
  });

  const reply = await chatCompletion([{ role: 'system', content: SYSTEM_PROMPT }, { role: 'user', content }], { json: true });
  return parseTags(reply, batch, withImages);
}

function parseTags(reply: string, batch: VideoSummary[], withImages: boolean): Record<string, AutoTags> {
  const parsed = safeParseJson(reply);
  const rows = isRecord(parsed) && Array.isArray(parsed.videos) ? parsed.videos.filter(isRecord) : [];
  const text = (value: unknown) => (typeof value === 'string' ? value.trim() : '');
  const result: Record<string, AutoTags> = {};
  for (const video of batch) {
    const row = rows.find((r) => String(r.id) === video.id) ?? {};
    result[video.id] = {
      format: text(row.format),
      hookType: text(row.hookType),
      hookText: text(row.hookText),
      taggedAt: nowIso(),
      fromImage: withImages && Boolean(video.coverUrl),
    };
  }
  return result;
}

/** Key videos worth a human check: the best and worst performers by views (public only). */
export function pickReviewVideos(videos: VideoSummary[]): VideoSummary[] {
  const ranked = videos.filter((v) => !v.isPrivate && v.views !== null).sort((a, b) => (b.views ?? 0) - (a.views ?? 0));
  if (ranked.length <= REVIEW_VIDEO_COUNT) return ranked;
  const half = Math.ceil(REVIEW_VIDEO_COUNT / 2);
  return [...ranked.slice(0, half), ...ranked.slice(-(REVIEW_VIDEO_COUNT - half))];
}
