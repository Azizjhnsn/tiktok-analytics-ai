import { openDB, type DBSchema, type IDBPDatabase } from 'idb';
import { browser } from 'wxt/browser';
import {
  DB_NAME,
  DB_VERSION,
  DEFAULT_ENRICHMENT,
  DEFAULT_SETTINGS,
  DIAGNOSIS_KEY,
  ENRICHMENT_KEY,
  EXPORT_COUNTER_KEY,
  SETTINGS_KEY,
  WALK_STATE_KEY,
} from '@/config/constants';
import type { CaptureRecord } from '@/types/capture';
import type { Diagnosis } from '@/types/diagnosis';
import type { Enrichment } from '@/types/enrichment';
import type { Settings } from '@/types/settings';
import type { WalkState } from '@/types/walk';
import { nowIso } from '@/utils/time';

/** Single persistence layer: captures in IndexedDB, settings and walk state in extension storage. */

interface CollectorDB extends DBSchema {
  captures: {
    key: number;
    value: CaptureRecord;
    indexes: { byVideoId: string; byCapturedAt: string; byPath: string; byContentKey: string };
  };
}

let dbPromise: Promise<IDBPDatabase<CollectorDB>> | null = null;

function getDb(): Promise<IDBPDatabase<CollectorDB>> {
  dbPromise ??= openDB<CollectorDB>(DB_NAME, DB_VERSION, {
    upgrade(db, oldVersion, _newVersion, transaction) {
      if (oldVersion < 1) {
        const store = db.createObjectStore('captures', { keyPath: 'id', autoIncrement: true });
        store.createIndex('byVideoId', 'videoId');
        store.createIndex('byCapturedAt', 'capturedAt');
      }
      if (oldVersion < 2) {
        const store = transaction.objectStore('captures');
        store.createIndex('byPath', 'path');
        store.createIndex('byContentKey', 'contentKey', { unique: true });
      }
    },
  });
  return dbPromise;
}

/** Stores a capture. Returns false when an identical response is already stored. */
export async function addCapture(record: CaptureRecord): Promise<boolean> {
  try {
    await (await getDb()).add('captures', record);
    return true;
  } catch (error) {
    if (error instanceof DOMException && error.name === 'ConstraintError') return false;
    throw error;
  }
}

export async function getAllCaptures(): Promise<CaptureRecord[]> {
  return (await getDb()).getAll('captures');
}

export async function getCapturesByPath(path: string): Promise<CaptureRecord[]> {
  return (await getDb()).getAllFromIndex('captures', 'byPath', path);
}

export async function getCapturesByVideoId(videoId: string): Promise<CaptureRecord[]> {
  return (await getDb()).getAllFromIndex('captures', 'byVideoId', videoId);
}

/** First capture matching the predicate, scanning without loading the whole store. */
export async function findCapture(predicate: (capture: CaptureRecord) => boolean): Promise<CaptureRecord | null> {
  for (let cursor = await (await getDb()).transaction('captures').store.openCursor(); cursor; cursor = await cursor.continue()) {
    if (predicate(cursor.value)) return cursor.value;
  }
  return null;
}

export async function countCaptures(): Promise<number> {
  return (await getDb()).count('captures');
}

export async function getCapturedVideoIds(): Promise<string[]> {
  const ids: string[] = [];
  const index = (await getDb()).transaction('captures').store.index('byVideoId');
  for (let cursor = await index.openKeyCursor(null, 'nextunique'); cursor; cursor = await cursor.continue()) {
    ids.push(cursor.key);
  }
  return ids;
}

export async function getLatestCaptureTime(): Promise<string | null> {
  const cursor = await (await getDb()).transaction('captures').store.index('byCapturedAt').openCursor(null, 'prev');
  return cursor?.value.capturedAt ?? null;
}

export async function clearCaptures(): Promise<void> {
  await (await getDb()).clear('captures');
}

async function readLocal<T>(key: string): Promise<T | undefined> {
  return (await browser.storage.local.get(key))[key] as T | undefined;
}

async function writeLocal<T>(key: string, value: T): Promise<T> {
  await browser.storage.local.set({ [key]: value });
  return value;
}

export async function getSettings(): Promise<Settings> {
  return { ...DEFAULT_SETTINGS, ...(await readLocal<Partial<Settings>>(SETTINGS_KEY)) };
}

export async function updateSettings(patch: Partial<Settings>): Promise<Settings> {
  return writeLocal(SETTINGS_KEY, { ...(await getSettings()), ...patch });
}

const INITIAL_WALK_STATE: Omit<WalkState, 'updatedAt'> = {
  status: 'idle',
  tabId: null,
  completedUrls: [],
  videosTotal: 0,
  videosCompleted: 0,
  sessionVideosDone: 0,
  capReached: false,
  retriedVideoIds: [],
  pauseUntil: null,
  currentUrl: null,
  message: null,
};

export async function getWalkState(): Promise<WalkState> {
  return { ...INITIAL_WALK_STATE, updatedAt: nowIso(), ...(await readLocal<WalkState>(WALK_STATE_KEY)) };
}

export async function updateWalkState(patch: Partial<WalkState>): Promise<WalkState> {
  return writeLocal(WALK_STATE_KEY, { ...(await getWalkState()), ...patch, updatedAt: nowIso() });
}

export async function resetWalkState(): Promise<WalkState> {
  return writeLocal(WALK_STATE_KEY, { ...INITIAL_WALK_STATE, updatedAt: nowIso() });
}

/** Increments and returns the persisted export sequence number. */
export async function nextExportNumber(): Promise<number> {
  return writeLocal(EXPORT_COUNTER_KEY, ((await readLocal<number>(EXPORT_COUNTER_KEY)) ?? 0) + 1);
}

export async function getEnrichment(): Promise<Enrichment> {
  return { ...DEFAULT_ENRICHMENT, ...(await readLocal<Partial<Enrichment>>(ENRICHMENT_KEY)) };
}

export function saveEnrichment(enrichment: Enrichment): Promise<Enrichment> {
  return writeLocal(ENRICHMENT_KEY, enrichment);
}

export async function getDiagnosis(): Promise<Diagnosis | null> {
  return (await readLocal<Diagnosis>(DIAGNOSIS_KEY)) ?? null;
}

export function saveDiagnosis(diagnosis: Diagnosis): Promise<Diagnosis> {
  return writeLocal(DIAGNOSIS_KEY, diagnosis);
}
