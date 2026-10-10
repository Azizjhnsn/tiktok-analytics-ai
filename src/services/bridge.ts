import { BRIDGE_SOURCE } from '@/config/constants';
import type { RawCapture } from '@/types/capture';

/** Passes captures from the MAIN-world interceptor to the isolated content script. */

interface BridgeMessage {
  source: typeof BRIDGE_SOURCE;
  raw: RawCapture;
}

export function postCapture(raw: RawCapture): void {
  window.postMessage({ source: BRIDGE_SOURCE, raw } satisfies BridgeMessage, window.location.origin);
}

export function onBridgeCapture(listener: (raw: RawCapture) => void): void {
  window.addEventListener('message', (event: MessageEvent) => {
    if (event.source !== window || event.origin !== window.location.origin) return;
    const message = event.data as Partial<BridgeMessage> | null;
    if (message?.source === BRIDGE_SOURCE && message.raw) listener(message.raw);
  });
}
