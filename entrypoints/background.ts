import { defineBackground } from 'wxt/utils/define-background';
import { browser } from 'wxt/browser';
import { loadSettings } from '../utils/settings';
import { translateText } from '../utils/openrouter';
import { isTranslateMessage, type TranslateMessage, type TranslateResponse } from '../utils/translation-messages';
import { isFollowupMessage, type FollowupMessage, type FollowupResponse } from '../utils/translation-messages';
import { answerFollowup } from '../utils/followup';

async function followup(message: FollowupMessage): Promise<FollowupResponse> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 25_000);
  try {
    const settings = await loadSettings();
    return { ok: true, answer: await answerFollowup(message, settings.apiKey, settings.targetLanguage, controller.signal) };
  } catch (cause) {
    return { ok: false, error: cause instanceof Error ? cause.message : 'Не удалось получить ответ.' };
  } finally { clearTimeout(timeout); }
}

async function translate(message: TranslateMessage): Promise<TranslateResponse> {
  const controller = new AbortController();
  // Stay below the service worker's fetch response timeout.
  const timeout = setTimeout(() => controller.abort(), 25_000);
  try {
    const settings = await loadSettings();
    return { ok: true, ...await translateText({
      text: message.text,
      context: message.context,
      targetLanguage: message.targetLanguage ?? settings.targetLanguage,
      apiKey: settings.apiKey,
      signal: controller.signal,
    }) };
  } catch (cause) {
    return { ok: false, error: cause instanceof Error ? cause.message : 'Не удалось перевести текст.' };
  } finally {
    clearTimeout(timeout);
  }
}

export default defineBackground(() => {
  browser.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (sender.id !== browser.runtime.id) return;
    if (message?.type === 'ai-translate:open-options') {
      browser.runtime.openOptionsPage().then(() => sendResponse({ ok: true }), () => sendResponse({ ok: false }));
      return true;
    }
    if (message?.type === 'ai-translate:followup') {
      if (!isFollowupMessage(message)) {
        sendResponse({ ok: false, error: 'Диалог слишком длинный или запрос некорректен. Начните заново с выделения текста.' });
        return;
      }
      void followup(message).then(sendResponse);
      return true;
    }
    if (message?.type !== 'ai-translate:translate') return;
    if (!isTranslateMessage(message)) {
      sendResponse({ ok: false, error: 'Некорректный запрос. Выделите не более 12 000 символов.' });
      return;
    }
    void translate(message).then(sendResponse);
    return true;
  });
  browser.runtime.onInstalled.addListener(({ reason }) => {
    console.info('AI Translate: extension installed or updated', reason);
  });
});
