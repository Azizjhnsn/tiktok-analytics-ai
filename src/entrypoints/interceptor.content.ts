import { STUDIO_MATCH } from '@/config/constants';
import { postCapture } from '@/services/bridge';
import { installInterceptor } from '@/services/interceptor';

export default defineContentScript({
  matches: [STUDIO_MATCH],
  runAt: 'document_start',
  world: 'MAIN',
  main() {
    installInterceptor(postCapture);
  },
});
