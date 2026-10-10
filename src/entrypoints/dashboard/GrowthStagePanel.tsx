import { NumberField } from '@/components/NumberField';
import { Panel } from '@/components/Panel';
import { SegmentedControl } from '@/components/SegmentedControl';
import { GROWTH_STAGE_PRESETS } from '@/config/constants';

interface GrowthStagePanelProps {
  stage: number;
  onChange: (growthStage: number) => void;
}

const CUSTOM = 'custom';
const OPTIONS = [...GROWTH_STAGE_PRESETS.map((n) => ({ value: String(n), label: String(n) })), { value: CUSTOM, label: 'Custom' }];

export function GrowthStagePanel({ stage, onChange }: GrowthStagePanelProps) {
  const isPreset = GROWTH_STAGE_PRESETS.includes(stage);
  return (
    <Panel title="Growth stage">
      <div className="stack">
        <div className="muted">Where do your videos usually stall (views)? The diagnosis focuses on getting past it.</div>
        <SegmentedControl
          options={OPTIONS}
          value={isPreset ? String(stage) : CUSTOM}
          onChange={(value) => onChange(value === CUSTOM ? (isPreset ? stage + 1 : stage) : Number(value))}
        />
        {!isPreset && <NumberField label="Custom views" value={stage} min={1} onChange={onChange} />}
      </div>
    </Panel>
  );
}
