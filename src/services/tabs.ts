import { browser } from 'wxt/browser';
import { DASHBOARD_PATH, TAB_LOAD_TIMEOUT_MS } from '@/config/constants';

export async function getActiveTab() {
  const [tab] = await browser.tabs.query({ active: true, currentWindow: true });
  return tab;
}

export async function openDashboard(): Promise<void> {
  await browser.tabs.create({ url: browser.runtime.getURL(DASHBOARD_PATH) });
}

export async function getTabUrl(tabId: number): Promise<string | undefined> {
  return (await browser.tabs.get(tabId)).url;
}

/** Loads a URL in the tab and resolves once the page has finished loading (or the timeout passes). */
export function navigateTab(tabId: number, url: string): Promise<void> {
  return new Promise<void>((resolve, reject) => {
    const timer = setTimeout(() => cleanup(resolve), TAB_LOAD_TIMEOUT_MS);
    function listener(updatedId: number, info: { status?: string }) {
      if (updatedId === tabId && info.status === 'complete') cleanup(resolve);
    }
    function cleanup(settle: () => void) {
      clearTimeout(timer);
      browser.tabs.onUpdated.removeListener(listener);
      settle();
    }
    browser.tabs.onUpdated.addListener(listener);
    browser.tabs.update(tabId, { url }).catch((error: unknown) => cleanup(() => reject(error)));
  });
}
