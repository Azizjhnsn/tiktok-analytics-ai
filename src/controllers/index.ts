import { registerHandlers } from '@/services/messaging';
import { analysisController } from './analysisController';
import { captureController } from './captureController';
import { dataController } from './dataController';
import { settingsController } from './settingsController';
import { walkController } from './walkController';

export function registerControllers(): void {
  registerHandlers({
    ...analysisController,
    ...captureController,
    ...dataController,
    ...settingsController,
    ...walkController,
  });
}
