/** The time window an insight covers, from the request TikTok's page made. */
export interface Timeframe {
  capturedAt: string;
  /** Window length in days and how many days before capture it ends (1 = ends yesterday). */
  days?: number;
  endDays?: number;
  /** Local dates derived from days/endDays and the capture time (YYYY-MM-DD). */
  fromDate?: string;
  toDate?: string;
  /** Studio's preset range code, and its length in days (1=7, 2=28, 3=60, 4=365). */
  range?: number;
  rangeDays?: number;
  dataDateRange?: number;
}

export interface AccountInsight {
  timeframe: Timeframe;
  value: unknown;
}

export interface RetentionPoint {
  sec: number;
  /** Share of viewers still watching, 0–1. */
  rate: number;
}

/** Flat, analysis-ready numbers for one video. Null means TikTok didn't provide it. */
export interface VideoSummary {
  id: string;
  /** Video metrics are lifetime totals as of this capture time. */
  dataAsOf: string | null;
  caption: string | null;
  createdAt: string | null;
  durationSec: number | null;
  isPhoto: boolean;
  /** Set to private ('Only me'). Kept in the data, excluded from comparisons. */
  isPrivate: boolean;
  views: number | null;
  likes: number | null;
  comments: number | null;
  shares: number | null;
  saves: number | null;
  /** Engagement per view, 0–1. */
  likeRate: number | null;
  commentRate: number | null;
  shareRate: number | null;
  saveRate: number | null;
  avgWatchSec: number | null;
  /** Average watch time as a share of video length, 0–1. */
  avgWatchRate: number | null;
  finishRate: number | null;
  retention2s: number | null;
  retention3s: number | null;
  /** Largest one-second fall in the retention curve. */
  biggestDrop: { atSec: number; drop: number } | null;
  newFollowers: number | null;
  /** Traffic source → share of views, 0–1. */
  trafficSources: Record<string, number>;
  retentionCurve: RetentionPoint[];
}

export interface OrganizedVideo {
  summary: VideoSummary;
  /** Every insight key TikTok returned for this video (latest non-null value per key). */
  insights: Record<string, unknown>;
}

export interface OrganizedData {
  account: {
    username: string | null;
    userId: string | null;
    /** Account-level insights (overview, viewers, followers pages): latest value per key and timeframe. */
    insights: Record<string, AccountInsight[]>;
  };
  /** What period the data covers. */
  coverage: {
    capturedFrom: string | null;
    capturedTo: string | null;
    videosPostedFrom: string | null;
    videosPostedTo: string | null;
  };
  /** Newest first. */
  videos: OrganizedVideo[];
}
