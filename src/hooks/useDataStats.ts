import { STATS_REFRESH_MS } from '@/config/constants';
import { sendMessage } from '@/services/messaging';
import { usePolling } from './usePolling';

const loadStats = () => sendMessage('data:stats');

export function useDataStats() {
  return usePolling(loadStats, STATS_REFRESH_MS);
}
