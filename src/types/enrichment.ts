/** Optional user input added after capture. */
export interface VideoTags {
  format?: string;
  hookType?: string;
  hookText?: string;
}

/** Tags the AI inferred from a video's cover image and caption. */
export interface AutoTags extends VideoTags {
  taggedAt: string;
  /** False when the cover image couldn't be used (e.g. expired link) and only the caption was read. */
  fromImage: boolean;
}

/** Tags used for analysis: the user's where given, otherwise the AI's. */
export interface EffectiveTags extends VideoTags {
  source: 'user' | 'auto' | 'mixed' | null;
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
  /** User-entered tags (override auto tags field by field). */
  videoTags: Record<string, VideoTags>;
  autoTags: Record<string, AutoTags>;
  /** Keyed by video id (one answer covers all of a video's odd numbers). */
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
