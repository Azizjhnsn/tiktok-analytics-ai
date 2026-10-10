import { resetWalk, startWalk, stopWalk } from '@/services/guidedWalk';
import { getWalkState } from '@/services/storage';
import type { MessageHandlers } from '@/types/messages';

export const walkController: MessageHandlers = {
  'walk:start': ({ tabId }) => {
    if (!Number.isInteger(tabId)) throw new Error('No active tab.');
    return startWalk(tabId);
  },
  'walk:stop': () => stopWalk(),
  'walk:status': () => getWalkState(),
  'walk:reset': () => resetWalk(),
};
