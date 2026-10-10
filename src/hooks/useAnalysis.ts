import { useCallback, useEffect, useState } from 'react';
import { sendMessage } from '@/services/messaging';
import type { AnalysisView } from '@/types/analysis';
import type { Diagnosis } from '@/types/diagnosis';
import type { Enrichment } from '@/types/enrichment';

/** Loads the analysis view once; enrichment edits are saved and applied locally. */
export function useAnalysis() {
  const [view, setView] = useState<AnalysisView | null>(null);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    try {
      setView(await sendMessage('analysis:get'));
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    }
  }, []);

  useEffect(() => void reload(), [reload]);

  const updateEnrichment = useCallback(async (patch: Partial<Enrichment>) => {
    try {
      const enrichment = await sendMessage('enrichment:update', patch);
      setView((current) => current && { ...current, enrichment });
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    }
  }, []);

  const setDiagnosis = useCallback((diagnosis: Diagnosis) => {
    setView((current) => current && { ...current, diagnosis });
  }, []);

  return { view, error, reload, updateEnrichment, setDiagnosis };
}
