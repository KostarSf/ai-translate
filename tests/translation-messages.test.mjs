import assert from 'node:assert/strict';
import { test } from 'node:test';
import { isTranslateMessage } from '../utils/translation-messages.ts';

test('background accepts bounded translation messages and rejects malformed input', () => {
  const message = { type: 'ai-translate:translate', text: 'bank', context: { before: '', containing: 'A bank.', after: '' } };
  assert.equal(isTranslateMessage(message), true);
  assert.equal(isTranslateMessage({ type: 'ai-translate:translate', text: 'Hello', targetLanguage: 'en' }), true);
  for (const value of [null, {}, { ...message, text: '' }, { ...message, text: 'a'.repeat(12001) },
    { ...message, context: null }, { ...message, context: { before: 1 } },
    { ...message, targetLanguage: 'invalid' }, { ...message, context: { ...message.context, after: 'x'.repeat(4001) } }]) {
    assert.equal(isTranslateMessage(value), false);
  }
});
