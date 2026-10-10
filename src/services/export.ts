import { APP_NAME, EXPORT_SCHEMA_VERSION } from '@/config/constants';
import type { ExportFile } from '@/types/export';
import { fileTimestamp, nowIso } from '@/utils/time';
import { findUsername, getDataStats } from './capture';
import { detectAnomalies } from './anomalies';
import { organize } from './organizer';
import { getAllCaptures, getDiagnosis, getEnrichment, nextExportNumber } from './storage';

/** Next export filename, e.g. E003_yourname_20261010-0918_64v.json. Advances the export counter. */
export async function nextExportFilename(): Promise<string> {
  const [exportNumber, username, stats] = await Promise.all([nextExportNumber(), findUsername(), getDataStats()]);
  return `E${String(exportNumber).padStart(3, '0')}_${username ?? 'unknown'}_${fileTimestamp()}_${stats.videoCount}v.json`;
}

export async function buildExport(): Promise<ExportFile> {
  const [stats, captures, enrichment, diagnosis] = await Promise.all([
    getDataStats(),
    getAllCaptures(),
    getEnrichment(),
    getDiagnosis(),
  ]);
  const organized = organize(captures);
  return {
    app: APP_NAME,
    schemaVersion: EXPORT_SCHEMA_VERSION,
    exportedAt: nowIso(),
    stats,
    organized,
    enrichment,
    anomalies: detectAnomalies(organized.videos.map((v) => v.summary)),
    diagnosis,
    captures,
  };
}
