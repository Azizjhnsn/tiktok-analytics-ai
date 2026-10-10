import { STUDIO_MATCH } from '@/config/constants';
import { onBridgeCapture } from '@/services/bridge';
import { registerHandlers, sendMessage } from '@/services/messaging';
import { scrollToBottom } from '@/services/pageScroll';
import { logger } from '@/utils/logger';

export default defineContentScript({
  matches: [STUDIO_MATCH],
  runAt: 'document_start',
  main() {
    onBridgeCapture((raw) => {
      sendMessage('capture:save', raw).catch((error: unknown) => logger.error('Capture not saved', error));
    });
    registerHandlers({ 'page:scrollToBottom': () => scrollToBottom() });
  },
});
