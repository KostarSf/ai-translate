import type { TargetLanguage } from './settings';
import type { TranslationContext } from './translation-context';

export interface TranslateMessage {
  type: 'ai-translate:translate';
  text: string;
  targetLanguage?: TargetLanguage;
  context?: TranslationContext;
}

export interface TranslationResult {
  translation: string;
  wordNote?: string;
}

export type TranslateResponse = ({ ok: true } & TranslationResult) | { ok: false; error: string };

export interface DialogueEntry {
  role: 'user' | 'assistant';
  content: string;
}

export interface FollowupMessage {
  type: 'ai-translate:followup';
  text: string;
  context: TranslationContext;
  result: TranslationResult;
  messages: DialogueEntry[];
}

export type FollowupResponse = { ok: true; answer: string } | { ok: false; error: string };

export function isFollowupMessage(value: unknown): value is FollowupMessage {
  if (!value || typeof value !== 'object') return false;
  const message = value as Partial<FollowupMessage>;
  if (message.type !== 'ai-translate:followup' || !isTranslateMessage({ ...message, type: 'ai-translate:translate' }) || !message.context) return false;
  if (!message.result || typeof message.result !== 'object' ||
    typeof message.result.translation !== 'string' || !message.result.translation.trim() || message.result.translation.length > 24000 ||
    (message.result.wordNote !== undefined && (typeof message.result.wordNote !== 'string' || message.result.wordNote.length > 12000))) return false;
  if (!Array.isArray(message.messages) || message.messages.length === 0 || message.messages.length > 39 || message.messages.length % 2 !== 1) return false;
  let length = 0;
  return message.messages.every((entry, index) => {
    if (!entry || typeof entry !== 'object' || entry.role !== (index % 2 === 0 ? 'user' : 'assistant') ||
      typeof entry.content !== 'string' || !entry.content.trim() || entry.content.length > 8000) return false;
    length += entry.content.length;
    return length <= 64000;
  });
}

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
