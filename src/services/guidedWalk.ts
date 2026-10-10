import {
  POSTS_PAGE_URL,
  POSTS_SCROLL_MAX_ROUNDS,
  POSTS_SCROLL_STALE_LIMIT,
} from '@/config/constants';
import type { Settings } from '@/types/settings';
import type { WalkState, WalkStatus } from '@/types/walk';
import { randomBetween, sleep } from '@/utils/async';
import { logger } from '@/utils/logger';
import { nowIso } from '@/utils/time';
import { accountPageUrls, isTikTokUrl, videoPageUrls } from '@/utils/url';
import { getKnownVideoIds, getPostListProgress, isMissingRetention } from './capture';
import { sendToTab } from './messaging';
import { getSettings, getWalkState, resetWalkState, updateWalkState } from './storage';
import { getTabUrl, navigateTab } from './tabs';

/**
 * Guided walk: loads Studio pages one by one in the user's tab so the page fetches its own data,
 * which the interceptor captures. It never calls TikTok endpoints itself.
 */

let running = false;
let stopRequested = false;

const STOPPED_MESSAGE = 'Stopped. Start again to resume.';

export async function startWalk(tabId: number): Promise<WalkState> {
  if (running) return getWalkState();
  if (!isTikTokUrl(await getTabUrl(tabId))) throw new Error('Open TikTok Studio (logged in) in this tab first.');

  running = true;
  stopRequested = false;
  const previous = await getWalkState();
  // A new session starts after the cap was reached or a finished walk; a manual Stop/Resume continues the same one.
  const newSession = previous.capReached || previous.status === 'done';
  const sessionVideosDone = newSession ? 0 : previous.sessionVideosDone;
  const state = await updateWalkState({ status: 'running', tabId, sessionVideosDone, capReached: false, message: null });
  void runWalk(tabId).finally(() => (running = false));
  return state;
}

export async function stopWalk(): Promise<WalkState> {
  if (!running) return getWalkState();
  stopRequested = true;
  return updateWalkState({ status: 'stopping' });
}

export async function resetWalk(): Promise<WalkState> {
  if (running) throw new Error('Stop the walk first.');
  return resetWalkState();
}

/** On background start: a walk cut off by a restart becomes resumable. */
export async function recoverWalk(): Promise<void> {
  const { status } = await getWalkState();
  if (status === 'running' || status === 'stopping') {
    await updateWalkState({ status: 'paused', currentUrl: null, pauseUntil: null, message: 'Interrupted. Start again to resume.' });
  }
}

function finish(status: WalkStatus, message: string, patch: Partial<WalkState> = {}): Promise<WalkState> {
  return updateWalkState({ status, message, currentUrl: null, pauseUntil: null, ...patch });
}

/** Random pause between page actions, exposed to the popup as a countdown. */
async function pause(settings: Settings): Promise<void> {
  const ms = randomBetween(settings.walkDelayMinMs, settings.walkDelayMaxMs);
  await updateWalkState({ pauseUntil: new Date(Date.now() + ms).toISOString() });
  await sleep(ms);
  await updateWalkState({ pauseUntil: null });
}

async function visit(tabId: number, url: string, settings: Settings): Promise<void> {
  await updateWalkState({ currentUrl: url });
  await navigateTab(tabId, url);
  await pause(settings);
}

/** Opens the posts list and scrolls until every page of videos has been loaded (and captured). */
async function loadAllPosts(tabId: number, settings: Settings): Promise<void> {
  const since = nowIso();
  await visit(tabId, POSTS_PAGE_URL, settings);

  let previous = -1;
  let stale = 0;
  for (let round = 0; round < POSTS_SCROLL_MAX_ROUNDS && stale < POSTS_SCROLL_STALE_LIMIT; round++) {
    const { captures, hasMore } = await getPostListProgress(since);
    if (!hasMore || stopRequested) return;
    stale = captures === previous ? stale + 1 : 0;
    previous = captures;
    await sendToTab(tabId, 'page:scrollToBottom').catch((error: unknown) => logger.warn('Scroll failed', error));
    await pause(settings);
  }
}

function countCompletedVideos(videoIds: string[], completed: Set<string>): number {
  return videoIds.filter((id) => videoPageUrls(id).every((url) => completed.has(url))).length;
}

/** Revisits, once per video, main pages whose response came back without a retention curve. */
async function retryMissingRetention(tabId: number, videoIds: string[], settings: Settings): Promise<void> {
  const retried = new Set((await getWalkState()).retriedVideoIds);
  for (const videoId of videoIds) {
    if (stopRequested) return;
    if (retried.has(videoId) || !(await isMissingRetention(videoId))) continue;
    logger.info('Retrying video with missing retention', videoId);
    await visit(tabId, videoPageUrls(videoId)[0], settings);
    retried.add(videoId);
    await updateWalkState({ retriedVideoIds: [...retried] });
  }
}

async function runWalk(tabId: number): Promise<void> {
  try {
    const settings = await getSettings();
    await loadAllPosts(tabId, settings);

    const videoIds = await getKnownVideoIds();
    const completed = new Set((await getWalkState()).completedUrls);
    await updateWalkState({ videosTotal: videoIds.length, videosCompleted: countCompletedVideos(videoIds, completed) });

    const visitAndMark = async (url: string) => {
      await visit(tabId, url, settings);
      completed.add(url);
      await updateWalkState({ completedUrls: [...completed], videosCompleted: countCompletedVideos(videoIds, completed) });
    };

    for (const url of accountPageUrls(settings.walkDateRanges).filter((u) => !completed.has(u))) {
      if (stopRequested) return void (await finish('paused', STOPPED_MESSAGE));
      await visitAndMark(url);
    }

    let { sessionVideosDone } = await getWalkState();
    for (const videoId of videoIds) {
      const pending = videoPageUrls(videoId).filter((url) => !completed.has(url));
      if (pending.length === 0) continue;
      if (sessionVideosDone >= settings.walkSessionCap) {
        logger.info(`Session cap reached: ${sessionVideosDone}/${settings.walkSessionCap} videos`);
        return void (await finish('paused', `Session cap reached (${settings.walkSessionCap} videos). Start again for a new session.`, { capReached: true }));
      }
      for (const url of pending) {
        if (stopRequested) return void (await finish('paused', STOPPED_MESSAGE));
        await visitAndMark(url);
      }
      sessionVideosDone++;
      await updateWalkState({ sessionVideosDone });
    }

    await retryMissingRetention(tabId, videoIds, settings);
    if (stopRequested) return void (await finish('paused', STOPPED_MESSAGE));
    await finish('done', videoIds.length ? 'All videos captured.' : 'No videos found on the posts page.');
  } catch (error) {
    logger.error('Guided walk failed', error);
    await finish('error', error instanceof Error ? error.message : String(error));
  }
}
