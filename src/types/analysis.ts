import type { Diagnosis } from './diagnosis';
import type { Anomaly, Enrichment } from './enrichment';
import type { OrganizedData, VideoSummary } from './organized';

/** Everything the dashboard needs for enrichment and diagnosis. */
export interface AnalysisView {
  username: string | null;
  coverage: OrganizedData['coverage'];
  videos: VideoSummary[];
  anomalies: Anomaly[];
  enrichment: Enrichment;
  diagnosis: Diagnosis | null;
}
