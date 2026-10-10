import { useCallback, useState } from 'react';

/** Runs async UI actions with a shared busy flag and error message. */
export function useAction(onSettled?: () => unknown) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const run = useCallback(
    async (action: () => Promise<unknown>) => {
      setBusy(true);
      setError(null);
      try {
        await action();
      } catch (err) {
        setError(err instanceof Error ? err.message : String(err));
      } finally {
        setBusy(false);
        await onSettled?.();
      }
    },
    [onSettled],
  );

  return { busy, error, run };
}
