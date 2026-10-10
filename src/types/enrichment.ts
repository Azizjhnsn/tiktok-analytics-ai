/** Optional user input added after capture. */
export interface VideoTags {
  format?: string;
  hookType?: string;
  hookText?: string;
}

export interface AnomalyAnswer {
  /** What happened, e.g. "friends shared it", "accidental like burst". */
  context?: string;
  /** Leave this video out of comparisons. */
  ignore?: boolean;
}

export interface Enrichment {
  /** View count where videos usually stall; sets the diagnosis focus. */
  growthStage: number;
  videoTags: Record<string, VideoTags>;
  /** Keyed by anomaly id. */
  anomalyAnswers: Record<string, AnomalyAnswer>;
}

export type AnomalyKind = 'low-views' | 'view-spike' | 'like-rate' | 'share-rate' | 'save-rate' | 'follower-gain';

export interface Anomaly {
  id: string;
  videoId: string;
  kind: AnomalyKind;
  /** Human-readable reason, e.g. "Like rate 31% vs median 8%". */
  reason: string;
}
