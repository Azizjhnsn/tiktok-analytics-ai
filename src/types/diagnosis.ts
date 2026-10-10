/** Latest LLM diagnosis and prescription. */
export interface Diagnosis {
  createdAt: string;
  model: string;
  growthStage: number;
  /** Markdown from the LLM: what worked, what didn't, why, and next steps. */
  text: string;
}
