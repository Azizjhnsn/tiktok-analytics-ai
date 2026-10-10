import { getDataStats } from '@/services/capture';
import { buildExport, nextExportFilename } from '@/services/export';
import { clearCaptures } from '@/services/storage';
import type { MessageHandlers } from '@/types/messages';

export const dataController: MessageHandlers = {
  'data:stats': () => getDataStats(),
  'data:exportFilename': () => nextExportFilename(),
  'data:export': () => buildExport(),
  'data:clear': () => clearCaptures(),
};
