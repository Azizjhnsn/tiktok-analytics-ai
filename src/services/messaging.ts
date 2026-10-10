import { browser } from 'wxt/browser';
import type { MessageArgs, MessageHandlers, MessageMap, MessageType } from '@/types/messages';
import { logger } from '@/utils/logger';

interface Envelope {
  type: MessageType;
  data: unknown;
}

interface Reply {
  result?: unknown;
  error?: string;
}

function unwrap<K extends MessageType>(reply: unknown): MessageMap[K]['res'] {
  const { result, error } = (reply ?? {}) as Reply;
  if (error) throw new Error(error);
  return result as MessageMap[K]['res'];
}

/** Typed request to the background. Rejects if the handler failed. */
export async function sendMessage<K extends MessageType>(type: K, ...[data]: MessageArgs<K>): Promise<MessageMap[K]['res']> {
  return unwrap<K>(await browser.runtime.sendMessage({ type, data } satisfies Envelope));
}

/** Typed request from the background to a tab's content script. */
export async function sendToTab<K extends MessageType>(
  tabId: number,
  type: K,
  ...[data]: MessageArgs<K>
): Promise<MessageMap[K]['res']> {
  return unwrap<K>(await browser.tabs.sendMessage(tabId, { type, data } satisfies Envelope));
}

/** Routes incoming messages in this context (background or content script) to their handlers. */
export function registerHandlers(handlers: MessageHandlers): void {
  browser.runtime.onMessage.addListener((message: unknown, _sender, sendResponse) => {
    const { type, data } = (message ?? {}) as Envelope;
    const handler = handlers[type] as ((data: unknown) => unknown) | undefined;
    if (!handler) return false;

    Promise.resolve()
      .then(() => handler(data))
      .then(
        (result) => sendResponse({ result } satisfies Reply),
        (error: unknown) => {
          logger.error(`Handler "${type}" failed`, error);
          sendResponse({ error: error instanceof Error ? error.message : String(error) } satisfies Reply);
        },
      );
    return true; // keep the channel open for the async reply
  });
}
