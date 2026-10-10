import { Button } from '@/components/Button';
import { Countdown } from '@/components/Countdown';
import { MultiSelectChips } from '@/components/MultiSelectChips';
import { NumberField } from '@/components/NumberField';
import { Panel } from '@/components/Panel';
import { ProgressBar } from '@/components/ProgressBar';
import { DATE_RANGE_OPTIONS } from '@/config/constants';
import { useAction } from '@/hooks/useAction';
import { sendMessage } from '@/services/messaging';
import { getActiveTab } from '@/services/tabs';
import type { Settings } from '@/types/settings';
import type { WalkState } from '@/types/walk';

const RANGE_OPTIONS = DATE_RANGE_OPTIONS.map((days) => ({ value: days, label: `${days} days` }));

interface WalkPanelProps {
  walk: WalkState | null;
  active: boolean;
  settings: Settings;
  update: (patch: Partial<Settings>) => Promise<void>;
  onChange: () => unknown;
}

export function WalkPanel({ walk, active, settings, update, onChange }: WalkPanelProps) {
  const { busy, error, run } = useAction(onChange);

  const start = () =>
    run(async () => {
      const tab = await getActiveTab();
      if (tab?.id === undefined) throw new Error('No active tab.');
      await sendMessage('walk:start', { tabId: tab.id });
    });

  return (
    <Panel title="Guided walk">
      <div className="stack">
        <div className="muted">
          Opens each video's analytics pages in this tab, one by one. Keep the tab open.
        </div>

        {walk && (
          <>
            <ProgressBar label="Session" value={walk.sessionVideosDone} max={settings.walkSessionCap} />
            <ProgressBar label="Overall" value={walk.videosCompleted} max={walk.videosTotal} />
            <div className="muted">
              {walk.status}
              {walk.message ? ` · ${walk.message}` : ''}
            </div>
            <Countdown label="Next page in" until={walk.pauseUntil} />
            {walk.currentUrl && <div className="muted truncate">{walk.currentUrl}</div>}
          </>
        )}

        <div className="stack-tight">
          <span className="muted">Account date ranges (each one loads the 4 account pages)</span>
          <MultiSelectChips
            options={RANGE_OPTIONS}
            selected={settings.walkDateRanges}
            required
            disabled={active}
            onChange={(walkDateRanges) => void update({ walkDateRanges })}
          />
        </div>

        <div className="row">
          <NumberField
            label="Min pause (s)"
            value={settings.walkDelayMinMs / 1000}
            min={1}
            disabled={active}
            onChange={(s) => void update({ walkDelayMinMs: s * 1000 })}
          />
          <NumberField
            label="Max pause (s)"
            value={settings.walkDelayMaxMs / 1000}
            min={1}
            disabled={active}
            onChange={(s) => void update({ walkDelayMaxMs: s * 1000 })}
          />
          <NumberField
            label="Videos/session"
            value={settings.walkSessionCap}
            min={1}
            disabled={active}
            onChange={(walkSessionCap) => void update({ walkSessionCap })}
          />
        </div>

        <div className="row">
          {active ? (
            <Button disabled={busy || walk?.status === 'stopping'} onClick={() => void run(() => sendMessage('walk:stop'))}>
              Stop
            </Button>
          ) : (
            <Button variant="primary" disabled={busy} onClick={() => void start()}>
              {walk?.completedUrls.length ? 'Resume walk' : 'Start walk'}
            </Button>
          )}
          <Button disabled={busy || active || !walk?.completedUrls.length} onClick={() => void run(() => sendMessage('walk:reset'))}>
            Reset progress
          </Button>
        </div>
        {error && <div className="error">{error}</div>}
      </div>
    </Panel>
  );
}
