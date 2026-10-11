import { Collapsible } from '@/components/Collapsible';
import { TextField } from '@/components/TextField';
import { Toggle } from '@/components/Toggle';
import type { Anomaly, AnomalyAnswer, Enrichment } from '@/types/enrichment';
import type { VideoSummary } from '@/types/organized';
import { truncate } from '@/utils/text';
import { formatDateTime } from '@/utils/time';

interface AnomalyPanelProps {
  anomalies: Anomaly[];
  videos: VideoSummary[];
  enrichment: Enrichment;
  onAnswer: (videoId: string, answer: AnomalyAnswer) => void;
}

function groupByVideo(anomalies: Anomaly[]): Map<string, Anomaly[]> {
  const groups = new Map<string, Anomaly[]>();
  for (const anomaly of anomalies) groups.set(anomaly.videoId, [...(groups.get(anomaly.videoId) ?? []), anomaly]);
  return groups;
}

export function AnomalyPanel({ anomalies, videos, enrichment, onAnswer }: AnomalyPanelProps) {
  const groups = groupByVideo(anomalies);
  const answered = [...groups.keys()].filter((id) => enrichment.anomalyAnswers[id]?.context || enrichment.anomalyAnswers[id]?.ignore).length;

  if (groups.size === 0) {
    return <Collapsible title="Odd numbers" hint="Nothing unusual found.">{null}</Collapsible>;
  }

  return (
    <Collapsible
      title={`We found ${groups.size} video${groups.size === 1 ? '' : 's'} with odd numbers`}
      hint={`Do you have any specific information about them? Optional${answered ? ` · ${answered} answered` : ''}.`}
    >
      <div className="stack">
        <div className="muted">
          Tell us what happened (friends shared it, a promotion, accidental likes…) so the diagnosis isn't skewed, or leave the
          video out of comparisons.
        </div>
        {[...groups.entries()].map(([videoId, items]) => {
          const video = videos.find((v) => v.id === videoId);
          const answer = enrichment.anomalyAnswers[videoId] ?? {};
          return (
            <div key={videoId} className="stack-tight anomaly">
              <div>
                <strong>{truncate(video?.caption ?? videoId, 80)}</strong>
                <span className="muted"> · {formatDateTime(video?.createdAt ?? null)} · {video?.views ?? '—'} views</span>
              </div>
              <div className="muted">{items.map((a) => a.reason).join(' · ')}</div>
              <TextField
                placeholder="What happened? (optional)"
                value={answer.context ?? ''}
                onCommit={(context) => onAnswer(videoId, { context })}
              />
              <Toggle
                label="Leave this video out of comparisons"
                checked={answer.ignore ?? false}
                onChange={(ignore) => onAnswer(videoId, { ignore })}
              />
            </div>
          );
        })}
      </div>
    </Collapsible>
  );
}
