import { defineConfig } from 'wxt';

export default defineConfig({
  modules: ['@wxt-dev/module-vue'],
  manifest: ({ browser }) => ({
    name: 'AI Translate',
    description: 'Перевод текста с помощью OpenRouter.',
    permissions: ['storage'],
    host_permissions: ['http://*/*', 'https://*/*'],
    ...(browser === 'firefox'
      ? {
          browser_specific_settings: {
            gecko: {
              id: '{ff7f419e-0556-4c74-96ff-26dffa0ac40d}',
              strict_min_version: '140.0',
              data_collection_permissions: {
                required: ['authenticationInfo', 'personalCommunications', 'websiteContent'],
              },
            },
          },
        }
      : {}),
  }),
});
