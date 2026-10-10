import { Panel } from '@/components/Panel';
import { TextField } from '@/components/TextField';
import { Toggle } from '@/components/Toggle';
import type { Anomaly, AnomalyAnswer, Enrichment } from '@/types/enrichment';
import type { VideoSummary } from '@/types/organized';
import { truncate } from '@/utils/text';

interface AnomalyPanelProps {
  anomalies: Anomaly[];
  videos: VideoSummary[];
  enrichment: Enrichment;
  onAnswer: (anomalyId: string, answer: AnomalyAnswer) => void;
}

export function AnomalyPanel({ anomalies, videos, enrichment, onAnswer }: AnomalyPanelProps) {
  const captionOf = (id: string) => truncate(videos.find((v) => v.id === id)?.caption ?? id, 70);
  return (
    <Panel title={`Odd numbers (optional) · ${anomalies.length}`}>
      <div className="stack">
        <div className="muted">
          Numbers far from your usual. Say what happened (friends shared it, a promotion, accidental likes…) so the diagnosis
          isn't skewed, or leave the video out.
        </div>
        {anomalies.length === 0 && <div className="muted">Nothing unusual found.</div>}
        {anomalies.map((anomaly) => {
          const answer = enrichment.anomalyAnswers[anomaly.id] ?? {};
          return (
            <div key={anomaly.id} className="stack-tight anomaly">
              <div>
                <strong>{anomaly.reason}</strong> · {captionOf(anomaly.videoId)}
              </div>
              <TextField
                placeholder="What happened? (optional)"
                value={answer.context ?? ''}
                onCommit={(context) => onAnswer(anomaly.id, { context })}
              />
              <Toggle
                label="Leave this video out of comparisons"
                checked={answer.ignore ?? false}
                onChange={(ignore) => onAnswer(anomaly.id, { ignore })}
              />
            </div>
          );
        })}
      </div>
    </Panel>
  );
}
