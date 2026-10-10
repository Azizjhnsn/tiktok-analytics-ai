import { registerControllers } from '@/controllers';
import { recoverWalk } from '@/services/guidedWalk';

export default defineBackground(() => {
  registerControllers();
  void recoverWalk();
});
