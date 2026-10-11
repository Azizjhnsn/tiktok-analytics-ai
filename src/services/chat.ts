import type { ChatTurn } from '@/types/chat';
import { nowIso } from '@/utils/time';
import { buildDiagnosisInput } from './analysis';
import { chatCompletion, type ChatMessage } from './openai';
import { getChat, getDiagnosis, saveChat } from './storage';

/** Follow-up conversation about the latest diagnosis, grounded in the same data the diagnosis used. */

const SYSTEM_PROMPT = `You are the TikTok growth analyst who wrote the diagnosis below. The creator is asking follow-up questions to understand it.
Answer clearly and concisely, in plain language, citing their own videos (captions) and numbers from the data. Explain terms (e.g. retention at 3s, finish rate) when useful.
If the data can't answer a question, say so and suggest what to test or capture. Stay consistent with the diagnosis unless the data shows it was wrong; then say so.
Reply in Markdown.`;

export { getChat };

export async function sendChatMessage(text: string): Promise<ChatTurn[]> {
  const diagnosis = await getDiagnosis();
  if (!diagnosis) throw new Error('Run a diagnosis first.');
  const [history, input] = await Promise.all([getChat(), buildDiagnosisInput()]);
  const question: ChatTurn = { role: 'user', content: text.trim(), at: nowIso() };

  const messages: ChatMessage[] = [
    { role: 'system', content: SYSTEM_PROMPT },
    { role: 'user', content: `My analytics data:\n${JSON.stringify(input)}` },
    { role: 'assistant', content: diagnosis.text },
    ...[...history, question].map(({ role, content }) => ({ role, content })),
  ];
  const answer: ChatTurn = { role: 'assistant', content: await chatCompletion(messages), at: nowIso() };
  return saveChat([...history, question, answer]);
}

export function clearChat(): Promise<ChatTurn[]> {
  return saveChat([]);
}
