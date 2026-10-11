import { useEffect, useId, useState } from 'react';

interface TextFieldProps {
  label?: string;
  value: string;
  /** Called on blur or Enter, only when the value changed. */
  onCommit: (value: string) => void;
  placeholder?: string;
  /** Offered as autocomplete options; any text is still allowed. */
  suggestions?: string[];
  type?: 'text' | 'password';
  disabled?: boolean;
}

export function TextField({ label, value, onCommit, placeholder, suggestions, type = 'text', disabled }: TextFieldProps) {
  const [draft, setDraft] = useState(value);
  const listId = useId();
  useEffect(() => {
    setDraft(value);
  }, [value]);

  const commit = () => {
    if (draft !== value) onCommit(draft);
  };

  return (
    <label className="field">
      {label && <span className="muted">{label}</span>}
      <input
        type={type}
        value={draft}
        placeholder={placeholder}
        disabled={disabled}
        list={suggestions ? listId : undefined}
        onChange={(event) => setDraft(event.target.value)}
        onBlur={commit}
        onKeyDown={(event) => event.key === 'Enter' && commit()}
      />
      {suggestions && (
        <datalist id={listId}>
          {suggestions.map((option) => (
            <option key={option} value={option} />
          ))}
        </datalist>
      )}
    </label>
  );
}
