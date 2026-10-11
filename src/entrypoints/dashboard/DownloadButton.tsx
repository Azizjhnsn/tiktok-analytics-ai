import { Button } from '@/components/Button';
import { useAction } from '@/hooks/useAction';
import { downloadJson } from '@/services/download';
import { sendMessage } from '@/services/messaging';

/** Optional backup: saves the full dataset to the Downloads folder. */
export function DownloadButton({ disabled }: { disabled: boolean }) {
  const { busy, error, run } = useAction();

  const download = () =>
    run(async () => {
      const [filename, file] = await Promise.all([sendMessage('data:exportFilename'), sendMessage('data:export')]);
      await downloadJson(filename, file);
    });

  return (
    <div className="stack-tight align-end">
      <Button disabled={disabled || busy} title="Download all data as JSON (backup)" onClick={() => void download()}>
        {busy ? 'Preparing…' : '⬇ Download'}
      </Button>
      {error && <div className="error">{error}</div>}
    </div>
  );
}
