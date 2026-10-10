import { useCallback, useEffect, useState } from 'react';
import { sendMessage } from '@/services/messaging';
import type { Settings } from '@/types/settings';

export function useSettings() {
  const [settings, setSettings] = useState<Settings | null>(null);

  useEffect(() => {
    void sendMessage('settings:get').then(setSettings);
  }, []);

  const update = useCallback(async (patch: Partial<Settings>) => {
    setSettings(await sendMessage('settings:update', patch));
  }, []);

  return { settings, update };
}
