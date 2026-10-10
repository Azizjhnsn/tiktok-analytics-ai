import { getAnalysisView } from '@/services/analysis';
import { updateEnrichment } from '@/services/enrichment';
import type { MessageHandlers } from '@/types/messages';

export const analysisController: MessageHandlers = {
  'analysis:get': () => getAnalysisView(),
  'enrichment:update': (patch) => updateEnrichment(patch ?? {}),
};
