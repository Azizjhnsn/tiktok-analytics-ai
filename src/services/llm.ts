import { ENV } from '@/config/env';
import { FALLBACK_OPENAI_MODEL, OPENAI_CHAT_URL } from '@/config/constants';
import type { Diagnosis } from '@/types/diagnosis';
import type { Settings } from '@/types/settings';
import { isRecord } from '@/utils/json';
import { logger } from '@/utils/logger';
import { nowIso } from '@/utils/time';
import { buildDiagnosisInput } from './analysis';
import { getSettings, saveDiagnosis } from './storage';

/**
 * The only outbound request the extension makes: a user-triggered OpenAI call.
 * Runs in the dashboard page (not the background), so a long LLM reply can't be cut off by service-worker shutdown.
 */

const SYSTEM_PROMPT = `You are a TikTok growth analyst. You get one creator's analytics as JSON: per-video metrics, group comparisons (by stage, format, hook type, posting hour, duration), audience data, user tags and the user's explanations of anomalies.
Rates are 0–1. retention2s/retention3s = share of viewers still watching at 2s/3s (the hook). avgWatchRate = average watch time / video length. finishRate = full-watch share. biggestDrop = the second where the most viewers leave.
Timeframes: per-video numbers are lifetime totals as of dataAsOf. Each account insight has a timeframe (days ending endDays before capture, with fromDate/toDate; rangeDays gives the length of preset ranges). coverage gives the capture period and the posting dates covered. State which timeframe a conclusion is based on.
growthStage is the view count where the creator's videos usually stall; focus on what separates videos that passed it from those that didn't.
Respect anomaly explanations (e.g. friends sharing, accidental likes): don't treat those numbers as organic.
Be specific and evidence-based: cite video captions and numbers. Say when the sample is too small to conclude.
Reply in Markdown with these sections:
## What works
## What doesn't
## Why (likely causes, hook first)
## Next steps
Concrete, prioritized actions for the next 5–10 videos at this growth stage (hook scripts/structures to try, format, length, posting time, what to test and how to measure it).`;

/** Dashboard setting first, then .env.local, then (model only) the fallback. */
export function resolveOpenAiConfig(settings: Settings) {
  return {
    apiKey: settings.openAiApiKey.trim() || ENV.openAiApiKey || null,
    model: settings.openAiModel.trim() || ENV.openAiModel || FALLBACK_OPENAI_MODEL,
  };
}

export async function runDiagnosis(): Promise<Diagnosis> {
  const { apiKey, model } = resolveOpenAiConfig(await getSettings());
  if (!apiKey) throw new Error('No OpenAI API key. Set WXT_OPENAI_API_KEY in .env.local and rebuild, or enter one on the dashboard.');
  const input = await buildDiagnosisInput();
  if (input.videos.length === 0) throw new Error('No public videos to analyze yet. Capture data first.');

  const response = await fetch(OPENAI_CHAT_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({
      model,
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: JSON.stringify(input) },
      ],
    }),
  });
  const body: unknown = await response.json().catch(() => null);
  if (!response.ok) {
    const message = isRecord(body) && isRecord(body.error) ? String(body.error.message) : `HTTP ${response.status}`;
    logger.error('OpenAI request failed', message);
    throw new Error(`OpenAI: ${message}`);
  }

  return saveDiagnosis({
    createdAt: nowIso(),
    model,
    growthStage: input.growthStage,
    text: readReply(body),
  });
}

function readReply(body: unknown): string {
  const choice = isRecord(body) && Array.isArray(body.choices) ? body.choices[0] : undefined;
  const message = isRecord(choice) ? choice.message : undefined;
  const content = isRecord(message) ? message.content : undefined;
  if (typeof content !== 'string' || !content.trim()) throw new Error('OpenAI returned an empty reply.');
  return content;
}
