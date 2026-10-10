import { saveCapture } from '@/services/capture';
import type { MessageHandlers } from '@/types/messages';

export const captureController: MessageHandlers = {
  'capture:save': (raw) => saveCapture(raw),
};
