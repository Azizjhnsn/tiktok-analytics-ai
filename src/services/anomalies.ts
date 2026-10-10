import { ANOMALY_COUNT_BASE_MIN, ANOMALY_LOW_VIEWS, ANOMALY_MIN_VIEWS_FOR_RATES, ANOMALY_RATIO } from '@/config/constants';
import type { Anomaly, AnomalyKind } from '@/types/enrichment';
import type { VideoSummary } from '@/types/organized';
import { formatPercent, median, present } from '@/utils/stats';

type NumericKey = 'views' | 'likeRate' | 'shareRate' | 'saveRate' | 'newFollowers';

const RATIO_CHECKS: { kind: AnomalyKind; key: NumericKey; label: string; percent: boolean }[] = [
  { kind: 'view-spike', key: 'views', label: 'Views', percent: false },
  { kind: 'like-rate', key: 'likeRate', label: 'Like rate', percent: true },
  { kind: 'share-rate', key: 'shareRate', label: 'Share rate', percent: true },
  { kind: 'save-rate', key: 'saveRate', label: 'Save rate', percent: true },
  { kind: 'follower-gain', key: 'newFollowers', label: 'New followers', percent: false },
];

/** Flags public videos whose numbers are far out of proportion, so the user can explain them. */
export function detectAnomalies(videos: VideoSummary[]): Anomaly[] {
  const candidates = videos.filter((v) => !v.isPrivate);
  const anomalies: Anomaly[] = [];

  for (const video of candidates) {
    if (video.views !== null && video.views < ANOMALY_LOW_VIEWS) {
      anomalies.push(toAnomaly(video.id, 'low-views', `Only ${video.views} views (likely not distributed)`));
    }
  }

  const rated = candidates.filter((v) => (v.views ?? 0) >= ANOMALY_MIN_VIEWS_FOR_RATES);
  for (const check of RATIO_CHECKS) {
    const middle = median(present(rated.map((v) => v[check.key])));
    // Counts (views, followers) use a floor so tiny medians don't flag noise like 3 vs 1.
    const typical = check.percent ? middle : Math.max(middle ?? 0, ANOMALY_COUNT_BASE_MIN);
    if (!typical) continue;
    for (const video of rated) {
      const value = video[check.key];
      if (value === null || value < typical * ANOMALY_RATIO) continue;
      const show = (n: number) => (check.percent ? formatPercent(n, 1) : String(Math.round(n)));
      anomalies.push(toAnomaly(video.id, check.kind, `${check.label} ${show(value)} vs median ${show(typical)}`));
    }
  }
  return anomalies;
}

function toAnomaly(videoId: string, kind: AnomalyKind, reason: string): Anomaly {
  return { id: `${videoId}:${kind}`, videoId, kind, reason };
}
