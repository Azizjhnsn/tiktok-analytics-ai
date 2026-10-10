import { useEffect, useState } from 'react';
import { COPIED_FEEDBACK_MS } from '@/config/constants';
import { logger } from '@/utils/logger';
import { Button } from './Button';

interface CopyButtonProps {
  label: string;
  text: string;
}

/** Copies text to the clipboard and briefly confirms with "Copied" (or reports failure). */
export function CopyButton({ label, text }: CopyButtonProps) {
  const [feedback, setFeedback] = useState<string | null>(null);

  useEffect(() => {
    if (!feedback) return;
    const timer = setTimeout(() => setFeedback(null), COPIED_FEEDBACK_MS);
    return () => clearTimeout(timer);
  }, [feedback]);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setFeedback('Copied');
    } catch (error) {
      logger.error('Copy failed', error);
      setFeedback('Copy failed');
    }
  };

  return <Button onClick={() => void copy()}>{feedback ?? label}</Button>;
}
