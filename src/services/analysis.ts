import { LLM_ACCOUNT_INSIGHT_MAX_CHARS, LLM_CAPTION_MAX_CHARS } from '@/config/constants';
import type { AnalysisView } from '@/types/analysis';
import type { Anomaly, Enrichment } from '@/types/enrichment';
import type { AccountInsight, VideoSummary } from '@/types/organized';
import { round } from '@/utils/math';
import { mean, median, present } from '@/utils/stats';
import { detectAnomalies } from './anomalies';
import { effectiveTags } from './enrichment';
import { organize } from './organizer';
import { getAllCaptures, getDiagnosis, getEnrichment } from './storage';

/** Account insight keys worth sending to the LLM (audience and follower context). */
const ACCOUNT_KEYS_FOR_LLM = [
  'follower_num',
  'unique_viewer_num',
  'new_viewer_num',
  'returning_viewer',
  'viewer_gender_percent',
  'viewer_age_distribution',
  'viewer_country_city_percent',
  'viewer_active_history_hours',
  'follower_gender_percent',
  'follower_age_distribution',
  'follower_location_percent',
  'follower_active_history_hours',
];

async function loadAnalysis() {
  const [captures, enrichment, diagnosis] = await Promise.all([getAllCaptures(), getEnrichment(), getDiagnosis()]);
  const { account, videos, coverage } = organize(captures);
  const summaries = videos.map((v) => v.summary);
  const view: AnalysisView = {
    username: account.username,
    coverage,
    videos: summaries,
    anomalies: detectAnomalies(summaries),
    enrichment,
    diagnosis,
  };
  return { view, accountInsights: account.insights };
}

export async function getAnalysisView(): Promise<AnalysisView> {
  return (await loadAnalysis()).view;
}

/** Videos used for comparisons: public, and not marked "ignore" in any anomaly answer. */
function comparableVideos(videos: VideoSummary[], anomalies: Anomaly[], enrichment: Enrichment): VideoSummary[] {
  const ignored = new Set(anomalies.filter((a) => enrichment.anomalyAnswers[a.videoId]?.ignore).map((a) => a.videoId));
  return videos.filter((v) => !v.isPrivate && !ignored.has(v.id));
}

function groupStats(videos: VideoSummary[]) {
  const avg = (pick: (v: VideoSummary) => number | null) => round(mean(present(videos.map(pick))));
  return {
    count: videos.length,
    medianViews: median(present(videos.map((v) => v.views))),
    avgRetention2s: avg((v) => v.retention2s),
    avgRetention3s: avg((v) => v.retention3s),
    avgWatchRate: avg((v) => v.avgWatchRate),
    avgFinishRate: avg((v) => v.finishRate),
    avgLikeRate: avg((v) => v.likeRate),
    avgShareRate: avg((v) => v.shareRate),
    avgSaveRate: avg((v) => v.saveRate),
  };
}

function groupBy(videos: VideoSummary[], keyOf: (v: VideoSummary) => string | null) {
  const groups: Record<string, VideoSummary[]> = {};
  for (const video of videos) {
    const key = keyOf(video);
    if (key) (groups[key] ??= []).push(video);
  }
  return Object.fromEntries(Object.entries(groups).map(([key, group]) => [key, groupStats(group)]));
}

function hourBucket(iso: string | null): string | null {
  if (!iso) return null;
  const hour = new Date(iso).getHours();
  return `${String(Math.floor(hour / 3) * 3).padStart(2, '0')}–${String(Math.floor(hour / 3) * 3 + 3).padStart(2, '0')}h`;
}

function durationBucket(sec: number | null): string | null {
  if (sec === null) return null;
  if (sec < 15) return '<15s';
  if (sec < 30) return '15–30s';
  if (sec < 60) return '30–60s';
  return '60s+';
}

function compactVideo(video: VideoSummary, enrichment: Enrichment, anomalies: Anomaly[]) {
  const { retentionCurve, caption, coverUrl: _coverUrl, ...numbers } = video;
  const flags = anomalies.filter((a) => a.videoId === video.id).map((a) => a.reason);
  const notes = flags.length ? { flags, userContext: enrichment.anomalyAnswers[video.id]?.context ?? null } : null;
  return {
    ...numbers,
    caption: caption?.slice(0, LLM_CAPTION_MAX_CHARS) ?? null,
    postedLocal: video.createdAt ? new Date(video.createdAt).toLocaleString() : null,
    retentionFirst10s: retentionCurve.filter((p) => p.sec <= 10).map((p) => round(p.rate, 2)),
    tags: effectiveTags(enrichment, video.id),
    anomalies: notes,
  };
}

function trimmedAccountInsights(insights: Record<string, AccountInsight[]>) {
  const result: Record<string, { timeframe: AccountInsight['timeframe']; value: string }[]> = {};
  for (const key of ACCOUNT_KEYS_FOR_LLM) {
    const entries = insights[key];
    if (!entries) continue;
    result[key] = entries.map(({ timeframe, value }) => ({
      timeframe,
      value: JSON.stringify(value).slice(0, LLM_ACCOUNT_INSIGHT_MAX_CHARS),
    }));
  }
  return result;
}

export async function buildDiagnosisInput() {
  const { view, accountInsights } = await loadAnalysis();
  return composeDiagnosisInput(view, accountInsights);
}

/** Compact, pre-computed input for the LLM: per-video rows plus group comparisons. */
export function composeDiagnosisInput(view: AnalysisView, accountInsights: Record<string, AccountInsight[]>) {
  const { videos, anomalies, enrichment } = view;
  const comparable = comparableVideos(videos, anomalies, enrichment);
  const tagOf = (field: 'format' | 'hookType') => (v: VideoSummary) => effectiveTags(enrichment, v.id)[field] ?? null;
  const stage = enrichment.growthStage;

  return {
    username: view.username,
    growthStage: stage,
    coverage: view.coverage,
    totals: { videos: videos.length, private: videos.filter((v) => v.isPrivate).length, compared: comparable.length },
    overall: groupStats(comparable),
    byStage: {
      [`reached ${stage}+ views`]: groupStats(comparable.filter((v) => (v.views ?? 0) >= stage)),
      [`stalled under ${stage}`]: groupStats(comparable.filter((v) => (v.views ?? 0) < stage)),
    },
    byFormat: groupBy(comparable, tagOf('format')),
    byHookType: groupBy(comparable, tagOf('hookType')),
    byPostingHourLocal: groupBy(comparable, (v) => hourBucket(v.createdAt)),
    byDuration: groupBy(comparable, (v) => durationBucket(v.durationSec)),
    account: trimmedAccountInsights(accountInsights),
    videos: comparable.map((v) => compactVideo(v, enrichment, anomalies)),
    /** Videos left out of comparisons (private, or excluded by the user), so odd numbers can be explained. */
    excludedVideos: videos
      .filter((v) => !comparable.includes(v))
      .map((v) => ({
        ...compactVideo(v, enrichment, anomalies),
        excludedBecause: v.isPrivate ? 'private' : 'user excluded',
      })),
  };
}
