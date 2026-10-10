import type { Enrichment } from '@/types/enrichment';
import { getEnrichment, saveEnrichment } from './storage';

export type EnrichmentPatch = Partial<Enrichment>;

/** Merges a patch; per-video tags and per-anomaly answers merge field by field. */
export async function updateEnrichment(patch: EnrichmentPatch): Promise<Enrichment> {
  const current = await getEnrichment();
  return saveEnrichment({
    ...current,
    ...patch,
    videoTags: mergeByKey(current.videoTags, patch.videoTags),
    anomalyAnswers: mergeByKey(current.anomalyAnswers, patch.anomalyAnswers),
  });
}

function mergeByKey<T extends object>(current: Record<string, T>, patch?: Record<string, T>): Record<string, T> {
  const merged = { ...current };
  for (const [key, value] of Object.entries(patch ?? {})) merged[key] = { ...merged[key], ...value };
  return merged;
}
