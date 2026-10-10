import type { DataStats } from '@/types/capture';
import { formatDateTime } from '@/utils/time';
import { Panel } from './Panel';
import { StatTile } from './StatTile';

interface DataSummaryProps {
  stats: DataStats | null;
  error?: string | null;
}

export function DataSummary({ stats, error }: DataSummaryProps) {
  return (
    <Panel title="Collected data">
      <div className="row">
        <StatTile label="Responses" value={stats?.totalCaptures ?? '—'} />
        <StatTile label="Videos" value={stats?.videoCount ?? '—'} />
      </div>
      <div className="muted">Last capture: {formatDateTime(stats?.lastCapturedAt ?? null)}</div>
      {error && <div className="error">{error}</div>}
    </Panel>
  );
}
