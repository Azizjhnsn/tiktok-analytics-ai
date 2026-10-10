import { useState } from 'react';
import { Button } from '@/components/Button';
import { CopyButton } from '@/components/CopyButton';
import { DataSummary } from '@/components/DataSummary';
import { Panel } from '@/components/Panel';
import { APP_NAME, EXPORT_DIR } from '@/config/constants';
import { useAction } from '@/hooks/useAction';
import { useAnalysis } from '@/hooks/useAnalysis';
import { useDataStats } from '@/hooks/useDataStats';
import { saveJsonAs } from '@/services/download';
import { sendMessage } from '@/services/messaging';
import { formatDateTime } from '@/utils/time';
import { AnomalyPanel } from './AnomalyPanel';
import { DiagnosisPanel } from './DiagnosisPanel';
import { GrowthStagePanel } from './GrowthStagePanel';
import { VideoTagTable } from './VideoTagTable';

export function App() {
  const { data: stats, error: statsError } = useDataStats();
  const { view, error: analysisError, reload, updateEnrichment, setDiagnosis } = useAnalysis();
  const { busy, error, run } = useAction();
  const [saved, setSaved] = useState<string | null>(null);

  const exportJson = () =>
    run(async () => {
      setSaved(null);
      const filename = await sendMessage('data:exportFilename');
      if (await saveJsonAs(filename, () => sendMessage('data:export'))) setSaved(filename);
    });

  return (
    <main className="stack page">
      <h1>{APP_NAME}</h1>

      <DataSummary stats={stats} error={statsError} />

      <Panel title="Export">
        <div className="stack">
          <div className="muted">
            Downloads everything (raw, organized, your tags and answers, diagnosis) as one JSON file. Choose the folder in
            the Save As dialog. {EXPORT_DIR ? `Suggested: ${EXPORT_DIR}` : 'Set WXT_EXPORT_DIR in .env.local to get a suggested folder.'}
          </div>
          <div className="row">
            <Button variant="primary" disabled={busy || !stats?.totalCaptures} onClick={() => void exportJson()}>
              Save as…
            </Button>
            {EXPORT_DIR && <CopyButton label="Copy path" text={EXPORT_DIR} />}
          </div>
          {saved && <div className="muted">Saved {saved}</div>}
          {error && <div className="error">{error}</div>}
        </div>
      </Panel>

      {analysisError && <div className="error">{analysisError}</div>}
      {!view && !analysisError && <div className="muted">Organizing data…</div>}
      {view && (
        <>
          <div className="row">
            <Button onClick={() => void reload()}>Refresh data</Button>
            <div className="muted">
              Captured {formatDateTime(view.coverage.capturedFrom)} – {formatDateTime(view.coverage.capturedTo)} · videos posted{' '}
              {formatDateTime(view.coverage.videosPostedFrom)} – {formatDateTime(view.coverage.videosPostedTo)}. Video numbers
              are lifetime totals as of capture.
            </div>
          </div>
          <GrowthStagePanel stage={view.enrichment.growthStage} onChange={(growthStage) => void updateEnrichment({ growthStage })} />
          <AnomalyPanel
            anomalies={view.anomalies}
            videos={view.videos}
            enrichment={view.enrichment}
            onAnswer={(id, answer) => void updateEnrichment({ anomalyAnswers: { [id]: answer } })}
          />
          <VideoTagTable
            videos={view.videos}
            enrichment={view.enrichment}
            onTag={(id, tags) => void updateEnrichment({ videoTags: { [id]: tags } })}
          />
          <DiagnosisPanel diagnosis={view.diagnosis} onDiagnosis={setDiagnosis} />
        </>
      )}
    </main>
  );
}
