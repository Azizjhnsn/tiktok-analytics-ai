/** One message in the follow-up conversation about a diagnosis. */
export interface ChatTurn {
  role: 'user' | 'assistant';
  content: string;
  at: string;
}
