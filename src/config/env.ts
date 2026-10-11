/**
 * Build-time values from `.env.local` (project root, git-ignored). WXT only exposes `WXT_`-prefixed keys.
 * Rebuild after changing them.
 */
function clean(value: unknown): string | undefined {
  return typeof value === 'string' && value.trim() !== '' ? value.trim() : undefined;
}

// Static references so the bundler can inline each value.
export const ENV = {
  openAiApiKey: clean(import.meta.env.WXT_OPENAI_API_KEY),
  openAiModel: clean(import.meta.env.WXT_OPENAI_MODEL),
};
