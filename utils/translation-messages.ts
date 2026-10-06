import type { TargetLanguage } from './settings';
import type { TranslationContext } from './translation-context';

export interface TranslateMessage {
  type: 'ai-translate:translate';
  text: string;
  targetLanguage?: TargetLanguage;
  context?: TranslationContext;
}

export type TranslateResponse = { ok: true; translation: string } | { ok: false; error: string };

export function isTranslateMessage(value: unknown): value is TranslateMessage {
  if (!value || typeof value !== 'object') return false;
  const message = value as Partial<TranslateMessage>;
  return message.type === 'ai-translate:translate' &&
    typeof message.text === 'string' && message.text.trim().length > 0 && message.text.length <= 12000 &&
    (message.targetLanguage === undefined || message.targetLanguage === 'ru' || message.targetLanguage === 'en') &&
    (message.context === undefined || (
      message.context !== null && typeof message.context === 'object' &&
      typeof message.context.before === 'string' && message.context.before.length <= 4000 &&
      typeof message.context.containing === 'string' && message.context.containing.length <= 16000 &&
      typeof message.context.after === 'string' && message.context.after.length <= 4000
    ));
}
