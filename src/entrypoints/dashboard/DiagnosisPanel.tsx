import { Button } from '@/components/Button';
import { Markdown } from '@/components/Markdown';
import { Panel } from '@/components/Panel';
import { TextField } from '@/components/TextField';
import { ENV } from '@/config/env';
import { useAction } from '@/hooks/useAction';
import { useSettings } from '@/hooks/useSettings';
import { resolveOpenAiConfig, runDiagnosis } from '@/services/llm';
import type { Diagnosis } from '@/types/diagnosis';
import { formatDateTime } from '@/utils/time';

interface DiagnosisPanelProps {
  diagnosis: Diagnosis | null;
  onDiagnosis: (diagnosis: Diagnosis) => void;
}

export function DiagnosisPanel({ diagnosis, onDiagnosis }: DiagnosisPanelProps) {
  const { settings, update } = useSettings();
  const { busy, error, run } = useAction();
  const resolved = settings ? resolveOpenAiConfig(settings) : null;
  const keySource = settings?.openAiApiKey.trim() ? 'dashboard' : ENV.openAiApiKey ? '.env.local' : null;
  const modelSource = settings?.openAiModel.trim() ? 'dashboard' : ENV.openAiModel ? '.env.local' : 'default';

  return (
    <Panel title="Diagnosis & next steps">
      <div className="stack">
        {settings && (
          <div className="row">
            <TextField
              label={`OpenAI API key${keySource ? ` (using ${keySource})` : ' (missing)'}`}
              type="password"
              placeholder={ENV.openAiApiKey ? 'Leave empty to use .env.local' : 'sk-…'}
              value={settings.openAiApiKey}
              onCommit={(openAiApiKey) => void update({ openAiApiKey: openAiApiKey.trim() })}
            />
            <TextField
              label={`Model (using ${resolved?.model} from ${modelSource})`}
              placeholder={resolved?.model}
              value={settings.openAiModel}
              onCommit={(openAiModel) => void update({ openAiModel: openAiModel.trim() })}
            />
          </div>
        )}
        <div className="row">
          <Button variant="primary" disabled={busy || !keySource} onClick={() => void run(async () => onDiagnosis(await runDiagnosis()))}>
            {busy ? 'Analyzing… (up to a few minutes)' : diagnosis ? 'Run again' : 'Run diagnosis'}
          </Button>
        </div>
        <div className="muted">Sends the organized numbers, your tags and answers (no raw responses) to OpenAI.</div>
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
