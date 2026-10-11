import type { Diagnosis } from '@/types/diagnosis';
import { nowIso } from '@/utils/time';
import { buildDiagnosisInput } from './analysis';
import { autoTagMissing } from './autoTag';
import { chatCompletion, OPENAI_CONFIG, requireApiKey } from './openai';
import { saveChat, saveDiagnosis } from './storage';

/** Diagnosis and prescription: one OpenAI call over the organized data, tags and answers. */

const SYSTEM_PROMPT = `You are a TikTok growth analyst. You get one creator's analytics as JSON: per-video metrics, group comparisons (by stage, format, hook type, posting hour, duration), audience data, user tags and the user's explanations of anomalies.
Rates are 0–1. retention2s/retention3s = share of viewers still watching at 2s/3s (the hook). avgWatchRate = average watch time / video length. finishRate = full-watch share. biggestDrop = the second where the most viewers leave.
Timeframes: per-video numbers are lifetime totals as of dataAsOf. Each account insight has a timeframe (days ending endDays before capture, with fromDate/toDate; rangeDays gives the length of preset ranges). coverage gives the capture period and the posting dates covered. State which timeframe a conclusion is based on.
growthStage is the view count where the creator's videos usually stall; focus on what separates videos that passed it from those that didn't.
Odd numbers: look closely at every video with anomaly flags (and at excludedVideos). Use the other statistics to work out the cause before using them as evidence: e.g. a video that is private or was private (views but no retention data), a photo post, mostly non-For You traffic (profile, follow, direct message, search = existing audience or shares rather than the algorithm), a very new video still accumulating views, or an unusually short/long duration. Say what you concluded and treat those videos differently (exclude or down-weight) where the cause isn't organic reach.
Tags: each video's tags come from AI reading its cover image and caption (tagSource 'auto'), or from the user ('user', more reliable). Compare formats and hook types using them, and note when auto tags may be unreliable.
Respect the user's explanations (userContext, e.g. friends sharing, accidental likes): don't treat those numbers as organic.
Be specific and evidence-based: cite video captions and numbers. Say when the sample is too small to conclude.
Reply in Markdown with these sections:
## What works
## What doesn't
## Why (likely causes, hook first)
## Next steps
Concrete, prioritized actions for the next 5–10 videos at this growth stage (hook scripts/structures to try, format, length, posting time, what to test and how to measure it).`;

export async function runDiagnosis(): Promise<Diagnosis> {
  requireApiKey();
  await autoTagMissing();
  const input = await buildDiagnosisInput();
  if (input.videos.length === 0) throw new Error('No public videos to analyze yet. Capture data first.');

  const text = await chatCompletion([
    { role: 'system', content: SYSTEM_PROMPT },
    { role: 'user', content: JSON.stringify(input) },
  ]);
  // A new diagnosis starts a new conversation.
  await saveChat([]);
  return saveDiagnosis({ createdAt: nowIso(), model: OPENAI_CONFIG.model, growthStage: input.growthStage, text });
}
