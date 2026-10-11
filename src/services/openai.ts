import { FALLBACK_OPENAI_MODEL, OPENAI_CHAT_URL } from '@/config/constants';
import { ENV } from '@/config/env';
import { isRecord } from '@/utils/json';
import { logger } from '@/utils/logger';

/**
 * The only outbound requests the extension makes: user-data calls to OpenAI.
 * Called from the dashboard page (not the background), so long replies can't be cut off by service-worker shutdown.
 */

/** OpenAI config comes only from .env.local (build time). */
export const OPENAI_CONFIG = {
  apiKey: ENV.openAiApiKey ?? null,
  model: ENV.openAiModel ?? FALLBACK_OPENAI_MODEL,
};

export type ChatContentPart = { type: 'text'; text: string } | { type: 'image_url'; image_url: { url: string; detail: 'low' } };

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string | ChatContentPart[];
}

export function requireApiKey(): string {
  if (!OPENAI_CONFIG.apiKey) throw new Error('No OpenAI API key. Set WXT_OPENAI_API_KEY in .env.local and rebuild.');
  return OPENAI_CONFIG.apiKey;
}

/** Sends a chat completion and returns the reply text. `json` asks for a JSON object reply. */
export async function chatCompletion(messages: ChatMessage[], options: { json?: boolean } = {}): Promise<string> {
  const response = await fetch(OPENAI_CHAT_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${requireApiKey()}` },
    body: JSON.stringify({
      model: OPENAI_CONFIG.model,
      messages,
      ...(options.json ? { response_format: { type: 'json_object' } } : {}),
    }),
  });
  const body: unknown = await response.json().catch(() => null);
  if (!response.ok) {
    const message = isRecord(body) && isRecord(body.error) ? String(body.error.message) : `HTTP ${response.status}`;
    logger.error('OpenAI request failed', message);
    throw new Error(`OpenAI: ${message}`);
  }
  return readReply(body);
}

function readReply(body: unknown): string {
  const choice = isRecord(body) && Array.isArray(body.choices) ? body.choices[0] : undefined;
  const message = isRecord(choice) ? choice.message : undefined;
  const content = isRecord(message) ? message.content : undefined;
  if (typeof content !== 'string' || !content.trim()) throw new Error('OpenAI returned an empty reply.');
  return content;
}
