import { browser } from 'wxt/browser';
import { logger } from '@/utils/logger';

/**
 * Downloads data as a JSON file straight into the browser's Downloads folder (no dialog).
 * A backup only: the app and the AI read captured data from extension storage, never from this file.
 * Call from an extension page that stays open, so the blob URL lives until the download finishes.
 */
export async function downloadJson(filename: string, data: unknown): Promise<void> {
  const url = URL.createObjectURL(new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' }));
  try {
    revokeWhenFinished(await browser.downloads.download({ url, filename }), url);
  } catch (error) {
    URL.revokeObjectURL(url);
    logger.error('Download failed', error);
    throw error;
  }
}

function revokeWhenFinished(downloadId: number, url: string): void {
  const listener = (delta: Browser.downloads.DownloadDelta) => {
    const state = delta.state?.current;
    if (delta.id !== downloadId || (state !== 'complete' && state !== 'interrupted')) return;
    URL.revokeObjectURL(url);
    browser.downloads.onChanged.removeListener(listener);
  };
  browser.downloads.onChanged.addListener(listener);
}
