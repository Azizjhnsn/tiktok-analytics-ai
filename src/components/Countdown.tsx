import { useNow } from '@/hooks/useNow';

interface CountdownProps {
  label: string;
  /** ISO time the countdown ends at; nothing renders when null or past. */
  until: string | null;
}

export function Countdown({ label, until }: CountdownProps) {
  const now = useNow(250, until !== null);
  const seconds = until ? (new Date(until).getTime() - now) / 1000 : 0;
  if (seconds <= 0) return null;
  return (
    <div className="muted">
      {label} {seconds.toFixed(1)}s
    </div>
  );
}
