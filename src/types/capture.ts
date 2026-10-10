/** A response as intercepted in the page, before storage. */
export interface RawCapture {
  url: string;
  method: string;
  status: number;
  requestBody: string | null;
  responseText: string;
  pageUrl: string;
  capturedAt: string;
}

/** A stored capture. Bodies are kept in full (parsed when JSON, else raw text). */
export interface CaptureRecord {
  id?: number;
  url: string;
  path: string;
  method: string;
  status: number;
  pageUrl: string;
  capturedAt: string;
  videoId: string | null;
  insightTypes: string[];
  /** Hash of path + request + body (minus volatile keys). Identical responses are stored once. */
  contentKey: string;
  requestBody: unknown;
  body: unknown;
}

export interface DataStats {
  totalCaptures: number;
  videoCount: number;
  lastCapturedAt: string | null;
}
