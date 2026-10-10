interface ProgressBarProps {
  value: number;
  max: number;
  label?: string;
}

export function ProgressBar({ value, max, label }: ProgressBarProps) {
  const percent = max > 0 ? Math.min(100, (value / max) * 100) : 0;
  return (
    <div className="stack-tight">
      {label && (
        <div className="muted">
          {label} {value}/{max || '?'}
        </div>
      )}
      <div className="progress" role="progressbar" aria-valuenow={value} aria-valuemax={max}>
        <div className="progress-fill" style={{ width: `${percent}%` }} />
      </div>
    </div>
  );
}
