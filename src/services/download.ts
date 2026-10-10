import { browser } from 'wxt/browser';
import { EXPORT_PICKER_ID } from '@/config/constants';
import { logger } from '@/utils/logger';

/**
 * Saves data as a JSON file in a folder the user picks.
 * Prefers the native save picker (exact name, not affected by download managers, remembers its folder);
 * falls back to a Save As download where the picker is unavailable (e.g. Brave).
 * Call from an extension page that stays open (not the popup, which closes when a dialog opens).
 * The picker opens before `loadData` runs, so the click's user activation hasn't expired.
 * Returns false when the user cancels.
 */
export async function saveJsonAs(filename: string, loadData: () => Promise<unknown>): Promise<boolean> {
  return window.showSaveFilePicker ? saveWithPicker(filename, loadData) : saveWithDownload(filename, toJsonBlob(await loadData()));
}

function toJsonBlob(data: unknown): Blob {
  return new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
}

async function saveWithPicker(filename: string, loadData: () => Promise<unknown>): Promise<boolean> {
  let handle: FileSystemFileHandle;
  try {
    handle = await window.showSaveFilePicker!({
      suggestedName: filename,
      id: EXPORT_PICKER_ID,
      types: [{ description: 'JSON', accept: { 'application/json': ['.json'] } }],
    });
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') return false;
    throw error;
  }
  const blob = toJsonBlob(await loadData());
  const writable = await handle.createWritable();
  await writable.write(blob);
  await writable.close();
  return true;
}

async function saveWithDownload(filename: string, blob: Blob): Promise<boolean> {
  const url = URL.createObjectURL(blob);
  try {
    const id = await browser.downloads.download({ url, filename, saveAs: true });
    revokeWhenFinished(id, url);
    return true;
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
