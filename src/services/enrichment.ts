import type { EffectiveTags, Enrichment, VideoTags } from '@/types/enrichment';
import { getEnrichment, saveEnrichment } from './storage';

export type EnrichmentPatch = Partial<Enrichment>;

/** Merges a patch; per-video tags and per-anomaly answers merge field by field. */
export async function updateEnrichment(patch: EnrichmentPatch): Promise<Enrichment> {
  const current = await getEnrichment();
  return saveEnrichment({
    ...current,
    ...patch,
    videoTags: mergeByKey(current.videoTags, patch.videoTags),
    autoTags: mergeByKey(current.autoTags, patch.autoTags),
    anomalyAnswers: mergeByKey(current.anomalyAnswers, patch.anomalyAnswers),
  });
}

function mergeByKey<T extends object>(current: Record<string, T>, patch?: Record<string, T>): Record<string, T> {
  const merged = { ...current };
  for (const [key, value] of Object.entries(patch ?? {})) merged[key] = { ...merged[key], ...value };
  return merged;
}

const TAG_FIELDS: (keyof VideoTags)[] = ['format', 'hookType', 'hookText'];

/** User tags win field by field; empty user fields fall back to the AI's tags. */
export function effectiveTags(enrichment: Enrichment, videoId: string): EffectiveTags {
  const user = enrichment.videoTags[videoId] ?? {};
  const auto = enrichment.autoTags[videoId] ?? {};
  const tags: EffectiveTags = { source: null };
  const sources = new Set<'user' | 'auto'>();
  for (const field of TAG_FIELDS) {
    const userValue = user[field]?.trim();
    const value = userValue || auto[field]?.trim();
    if (!value) continue;
    tags[field] = value;
    sources.add(userValue ? 'user' : 'auto');
  }
  tags.source = sources.size === 2 ? 'mixed' : ([...sources][0] ?? null);
  return tags;
}
