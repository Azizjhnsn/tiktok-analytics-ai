interface TextAreaProps {
  value: string;
  onChange: (value: string) => void;
  /** Enter submits; Shift+Enter adds a new line. */
  onSubmit: () => void;
  placeholder?: string;
  disabled?: boolean;
  rows?: number;
}

export function TextArea({ value, onChange, onSubmit, placeholder, disabled, rows = 3 }: TextAreaProps) {
  return (
    <textarea
      className="textarea"
      value={value}
      rows={rows}
      placeholder={placeholder}
      disabled={disabled}
      onChange={(event) => onChange(event.target.value)}
      onKeyDown={(event) => {
        if (event.key === 'Enter' && !event.shiftKey) {
          event.preventDefault();
          onSubmit();
        }
      }}
    />
  );
}
