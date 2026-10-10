import { defineConfig } from 'wxt';

export default defineConfig({
  srcDir: 'src',
  modules: ['@wxt-dev/module-react'],
  manifest: {
    name: 'TikTok Analytics Collector',
    description: 'Captures TikTok Studio analytics for growth diagnosis.',
    permissions: ['storage', 'downloads'],
    host_permissions: ['https://www.tiktok.com/*', 'https://api.openai.com/*'],
  },
});
