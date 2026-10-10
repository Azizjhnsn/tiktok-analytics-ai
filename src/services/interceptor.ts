import type { RawCapture } from '@/types/capture';
import { logger } from '@/utils/logger';
import { nowIso } from '@/utils/time';
import { matchesCapturePath, toAbsoluteUrl } from '@/utils/url';

/**
 * Runs in the page's MAIN world. Observes responses the page already receives.
 * It never issues requests of its own.
 */

type CaptureListener = (raw: RawCapture) => void;

function buildRaw(url: string, method: string, status: number, requestBody: unknown, responseText: string): RawCapture {
  return {
    url,
    method: method.toUpperCase(),
    status,
    requestBody: typeof requestBody === 'string' ? requestBody : null,
    responseText,
    pageUrl: window.location.href,
    capturedAt: nowIso(),
  };
}

function installFetchHook(onCapture: CaptureListener): void {
  const originalFetch = window.fetch;

  window.fetch = async function (...args: Parameters<typeof fetch>): Promise<Response> {
    const response = await originalFetch.apply(window, args);
    try {
      const [input, init] = args;
      const request = input instanceof Request ? input : null;
      const url = toAbsoluteUrl(request?.url ?? String(input), window.location.href);
      if (matchesCapturePath(url)) {
        const method = init?.method ?? request?.method ?? 'GET';
        response
          .clone()
          .text()
          .then((text) => onCapture(buildRaw(url, method, response.status, init?.body, text)))
          .catch((error: unknown) => logger.warn('Could not read fetch response', url, error));
      }
    } catch (error) {
      logger.warn('Fetch hook error', error);
    }
    return response;
  };
}

function readXhrText(xhr: XMLHttpRequest): string | null {
  if (xhr.responseType === '' || xhr.responseType === 'text') return xhr.responseText;
  if (xhr.responseType === 'json') return JSON.stringify(xhr.response);
  return null;
}

function installXhrHook(onCapture: CaptureListener): void {
  const proto = XMLHttpRequest.prototype;
  const originalOpen = proto.open;
  const originalSend = proto.send;
  const requests = new WeakMap<XMLHttpRequest, { method: string; url: string }>();

  proto.open = function (this: XMLHttpRequest, method: string, url: string | URL, ...rest: unknown[]) {
    requests.set(this, { method, url: toAbsoluteUrl(String(url), window.location.href) });
    return (originalOpen as (...a: unknown[]) => void).call(this, method, url, ...rest);
  } as typeof proto.open;

  proto.send = function (this: XMLHttpRequest, body?: Document | XMLHttpRequestBodyInit | null) {
    const request = requests.get(this);
    if (request && matchesCapturePath(request.url)) {
      this.addEventListener('load', () => {
        const text = readXhrText(this);
        if (text !== null) onCapture(buildRaw(request.url, request.method, this.status, body, text));
      });
    }
    return originalSend.call(this, body);
  };
}

export function installInterceptor(onCapture: CaptureListener): void {
  installFetchHook(onCapture);
  installXhrHook(onCapture);
}
