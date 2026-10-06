import { browser } from 'wxt/browser';

export type TargetLanguage = 'ru' | 'en';

export interface Settings {
  targetLanguage: TargetLanguage;
}

export const languageLabels: Record<TargetLanguage, string> = {
  ru: 'Русский',
  en: 'English',
};

export async function loadSettings(): Promise<Settings> {
  const { settings } = await browser.storage.local.get('settings');
  return {
    targetLanguage:
      typeof settings === 'object' &&
      settings !== null &&
      'targetLanguage' in settings &&
      settings.targetLanguage === 'en'
        ? 'en'
        : 'ru',
  };
}

export async function saveSettings(settings: Settings): Promise<void> {
  await browser.storage.local.set({ settings });
}
