export type CollectionMode = 'manual' | 'automatic';

export interface Settings {
  /** Manual: capture while the user browses. Automatic: Guided walk. */
  mode: CollectionMode;
  /** Manual mode: capture analytics responses while the user browses TikTok Studio. */
  passiveCapture: boolean;
  /** Random pause range after each Guided walk page load. */
  walkDelayMinMs: number;
  walkDelayMaxMs: number;
  /** Max videos visited per Guided walk session. */
  walkSessionCap: number;
  /** Date ranges (days) the walk loads each account page with. */
  walkDateRanges: number[];
}
