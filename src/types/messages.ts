import type { AnalysisView } from './analysis';
import type { DataStats, RawCapture } from './capture';
import type { Enrichment } from './enrichment';
import type { ExportFile } from './export';
import type { Settings } from './settings';
import type { WalkState } from './walk';

/** Every message to the background (and background → tab): request and response types. */
export interface MessageMap {
  'capture:save': { req: RawCapture; res: void };
  'data:stats': { req: void; res: DataStats };
  'data:exportFilename': { req: void; res: string };
  'data:export': { req: void; res: ExportFile };
  'data:clear': { req: void; res: void };
  'analysis:get': { req: void; res: AnalysisView };
  'enrichment:update': { req: Partial<Enrichment>; res: Enrichment };
  'settings:get': { req: void; res: Settings };
  'settings:update': { req: Partial<Settings>; res: Settings };
  'walk:start': { req: { tabId: number }; res: WalkState };
  'walk:stop': { req: void; res: WalkState };
  'walk:status': { req: void; res: WalkState };
  'walk:reset': { req: void; res: WalkState };
  /** Background → content script on the walked tab. */
  'page:scrollToBottom': { req: void; res: void };
}

export type MessageType = keyof MessageMap;

export type MessageArgs<K extends MessageType> = MessageMap[K]['req'] extends void ? [] : [MessageMap[K]['req']];

export type MessageHandlers = {
  [K in MessageType]?: (data: MessageMap[K]['req']) => Promise<MessageMap[K]['res']> | MessageMap[K]['res'];
};
