import { useState, type ReactNode } from 'react';

interface CollapsibleProps {
  title: ReactNode;
  /** Short line under the title, visible while collapsed. */
  hint?: ReactNode;
  defaultOpen?: boolean;
  children: ReactNode;
}

/**
 * A panel that starts collapsed; click the header to expand.
 * Open state lives in React (synced from the native toggle) so re-renders never snap it shut.
 */
export function Collapsible({ title, hint, defaultOpen = false, children }: CollapsibleProps) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <details className="panel collapsible" open={open} onToggle={(event) => setOpen(event.currentTarget.open)}>
      <summary>
        <span className="panel-title">{title}</span>
        {hint && <span className="muted">{hint}</span>}
      </summary>
      {open && <div className="collapsible-body">{children}</div>}
    </details>
  );
}
