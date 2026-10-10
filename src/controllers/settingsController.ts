import { getSettings, updateSettings } from '@/services/storage';
import type { MessageHandlers } from '@/types/messages';

export const settingsController: MessageHandlers = {
  'settings:get': () => getSettings(),
  'settings:update': (patch) => updateSettings(patch),
};
