interface ToggleProps {
  label: string;
  hint?: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
}

export function Toggle({ label, hint, checked, onChange, disabled }: ToggleProps) {
  return (
    <label className="toggle">
      <span>
        <div>{label}</div>
        {hint && <div className="muted">{hint}</div>}
      </span>
      <input
        type="checkbox"
        checked={checked}
        disabled={disabled}
        onChange={(event) => onChange(event.target.checked)}
      />
    </label>
  );
}
