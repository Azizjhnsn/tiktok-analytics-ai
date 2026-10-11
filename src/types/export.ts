import type { CaptureRecord, DataStats } from './capture';
import type { ChatTurn } from './chat';
import type { Diagnosis } from './diagnosis';
import type { Anomaly, Enrichment } from './enrichment';
import type { OrganizedData } from './organized';

export interface ExportFile {
  app: string;
  schemaVersion: number;
  exportedAt: string;
  stats: DataStats;
  organized: OrganizedData;
  enrichment: Enrichment;
  anomalies: Anomaly[];
  diagnosis: Diagnosis | null;
  chat: ChatTurn[];
  captures: CaptureRecord[];
}
