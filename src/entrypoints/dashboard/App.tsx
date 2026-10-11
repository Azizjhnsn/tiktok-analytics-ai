import { Button } from '@/components/Button';
import { DataSummary } from '@/components/DataSummary';
import { APP_NAME } from '@/config/constants';
import { useAnalysis } from '@/hooks/useAnalysis';
import { useDataStats } from '@/hooks/useDataStats';
import { formatDateTime } from '@/utils/time';
import { AnomalyPanel } from './AnomalyPanel';
import { ChatPanel } from './ChatPanel';
import { DiagnosisPanel } from './DiagnosisPanel';
import { DownloadButton } from './DownloadButton';
import { GrowthStagePanel } from './GrowthStagePanel';
import { VideoTagTable } from './VideoTagTable';

export function App() {
  const { data: stats, error: statsError } = useDataStats();
  const { view, error: analysisError, reload, updateEnrichment } = useAnalysis();

  return (
    <main className="stack page">
      <header className="page-header">
        <h1>{APP_NAME}</h1>
        <DownloadButton disabled={!stats?.totalCaptures} />
      </header>

      <DataSummary stats={stats} error={statsError} />

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
            onAutoTagged={reload}
          />
          <DiagnosisPanel diagnosis={view.diagnosis} onDiagnosis={() => void reload()} />
          {view.diagnosis && <ChatPanel diagnosisId={view.diagnosis.createdAt} />}
        </>
      )}
    </main>
  );
}
