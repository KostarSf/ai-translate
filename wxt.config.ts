import { defineConfig } from 'wxt';

export default defineConfig({
  modules: ['@wxt-dev/module-vue'],
  manifest: ({ browser }) => ({
    name: 'AI Translate',
    description: 'Заготовка расширения на Vue для Chrome и Firefox.',
    permissions: ['storage'],
    ...(browser === 'firefox'
      ? {
          browser_specific_settings: {
            gecko: {
              id: 'ai-translate@example.org',
              strict_min_version: '140.0',
              data_collection_permissions: {
                required: ['none'],
              },
            },
          },
        }
      : {}),
  }),
});
