interface MultiSelectChipsProps<T extends string | number> {
  options: { value: T; label: string }[];
  selected: T[];
  onChange: (selected: T[]) => void;
  /** Keep at least one option selected. */
  required?: boolean;
  disabled?: boolean;
}

export function MultiSelectChips<T extends string | number>({ options, selected, onChange, required, disabled }: MultiSelectChipsProps<T>) {
  const toggle = (value: T) => {
    const next = selected.includes(value) ? selected.filter((v) => v !== value) : [...selected, value];
    if (required && next.length === 0) return;
    onChange(options.map((o) => o.value).filter((v) => next.includes(v)));
  };

  return (
    <div className="chips" role="group">
      {options.map((option) => (
        <button
          key={String(option.value)}
          type="button"
          aria-pressed={selected.includes(option.value)}
          className={selected.includes(option.value) ? 'chip chip-active' : 'chip'}
          disabled={disabled}
          onClick={() => toggle(option.value)}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}
