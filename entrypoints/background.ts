import { defineBackground } from 'wxt/utils/define-background';
import { browser } from 'wxt/browser';

export default defineBackground(() => {
  // Register extension-wide event handlers here.
  browser.runtime.onInstalled.addListener(({ reason }) => {
    console.info('AI Translate: extension installed or updated', reason);
  });
});
