import { Button } from '@/components/Button';
import { ConfirmButton } from '@/components/ConfirmButton';
import { DataSummary } from '@/components/DataSummary';
import { Panel } from '@/components/Panel';
import { SegmentedControl } from '@/components/SegmentedControl';
import { Toggle } from '@/components/Toggle';
import { APP_NAME, STATS_REFRESH_MS } from '@/config/constants';
import { useAction } from '@/hooks/useAction';
import { useDataStats } from '@/hooks/useDataStats';
import { usePolling } from '@/hooks/usePolling';
import { useSettings } from '@/hooks/useSettings';
import { sendMessage } from '@/services/messaging';
import { openDashboard } from '@/services/tabs';
import type { CollectionMode } from '@/types/settings';
import { WalkPanel } from './WalkPanel';

const MODE_OPTIONS: { value: CollectionMode; label: string }[] = [
  { value: 'manual', label: 'Manual' },
  { value: 'automatic', label: 'Automatic' },
];

const loadWalk = () => sendMessage('walk:status');

export function App() {
  const { settings, update } = useSettings();
  const { data: stats, error: statsError, refresh } = useDataStats();
  const { data: walk, refresh: refreshWalk } = usePolling(loadWalk, STATS_REFRESH_MS);
  const { busy, error, run } = useAction(refresh);

  const walkActive = walk?.status === 'running' || walk?.status === 'stopping';

  return (
    <main className="stack popup">
      <strong>{APP_NAME}</strong>

      <Panel title="Mode">
        <div className="stack">
          <SegmentedControl
            options={MODE_OPTIONS}
            value={settings?.mode ?? 'manual'}
            disabled={!settings || walkActive}
            onChange={(mode) => void update({ mode })}
          />
          {settings?.mode === 'manual' && (
            <Toggle
              label="Capture while browsing"
              hint="Saves analytics from TikTok Studio pages you open."
              checked={settings.passiveCapture}
              onChange={(passiveCapture) => void update({ passiveCapture })}
            />
          )}
        </div>
      </Panel>

      {settings?.mode === 'automatic' && (
        <WalkPanel walk={walk} active={walkActive} settings={settings} update={update} onChange={refreshWalk} />
      )}

      <DataSummary stats={stats} error={statsError ?? error} />

      <div className="row">
        <Button variant="primary" disabled={busy} onClick={() => void run(openDashboard)}>
          Open dashboard
        </Button>
        <ConfirmButton
          label="Clear data"
          confirmLabel="Confirm clear"
          disabled={busy || walkActive || !stats?.totalCaptures}
          onConfirm={() => void run(() => sendMessage('data:clear'))}
        />
      </div>
    </main>
  );
}
