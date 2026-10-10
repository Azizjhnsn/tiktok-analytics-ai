export type WalkStatus = 'idle' | 'running' | 'stopping' | 'paused' | 'done' | 'error';

export interface WalkState {
  status: WalkStatus;
  tabId: number | null;
  /** Pages already visited. Persisted so walks resume where they left off. */
  completedUrls: string[];
  videosTotal: number;
  videosCompleted: number;
  /** Videos finished in the current session. Kept across Stop/Resume; resets only after the cap was reached. */
  sessionVideosDone: number;
  capReached: boolean;
  /** Videos whose main page was revisited once because retention was missing. */
  retriedVideoIds: string[];
  /** When the current random pause ends (for the popup countdown). */
  pauseUntil: string | null;
  currentUrl: string | null;
  message: string | null;
  updatedAt: string;
}
