import { Button } from '@/components/Button';
import { Markdown } from '@/components/Markdown';
import { Panel } from '@/components/Panel';
import { useAction } from '@/hooks/useAction';
import { runDiagnosis } from '@/services/llm';
import { OPENAI_CONFIG } from '@/services/openai';
import type { Diagnosis } from '@/types/diagnosis';
import { formatDateTime } from '@/utils/time';

interface DiagnosisPanelProps {
  diagnosis: Diagnosis | null;
  onDiagnosis: (diagnosis: Diagnosis) => unknown;
}

export function DiagnosisPanel({ diagnosis, onDiagnosis }: DiagnosisPanelProps) {
  const { busy, error, run } = useAction();

  return (
    <Panel title="Diagnosis & next steps">
      <div className="stack">
        <div className="row">
          <Button
            variant="primary"
            disabled={busy || !OPENAI_CONFIG.apiKey}
            onClick={() => void run(async () => onDiagnosis(await runDiagnosis()))}
          >
            {busy ? 'Analyzing… (up to a few minutes)' : diagnosis ? 'Run again' : 'Run diagnosis'}
          </Button>
        </div>
        {!OPENAI_CONFIG.apiKey && <div className="error">Set WXT_OPENAI_API_KEY in .env.local and rebuild (see README).</div>}
        {error && <div className="error">{error}</div>}
        {diagnosis && (
          <>
            <div className="muted">
              {formatDateTime(diagnosis.createdAt)} · {diagnosis.model} · stage {diagnosis.growthStage}
            </div>
            <Markdown text={diagnosis.text} />
          </>
        )}
      </div>
    </Panel>
  );
}
