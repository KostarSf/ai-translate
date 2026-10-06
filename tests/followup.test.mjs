import assert from 'node:assert/strict';
import { test } from 'node:test';
import { answerFollowup } from '../utils/followup.ts';
import { isFollowupMessage } from '../utils/translation-messages.ts';

const message = {
  type: 'ai-translate:followup', text: 'bank',
  context: { before: 'We walked to the river.', containing: 'She sat on the bank.', after: 'The water was cold.' },
  result: { translation: 'берег', wordNote: 'Здесь говорится о береге реки.' },
  messages: [
    { role: 'user', content: 'Почему такой перевод?' },
    { role: 'assistant', content: 'В предложении речь идёт о реке.' },
    { role: 'user', content: 'А какие ещё значения?' },
  ],
};

test('followup includes selection, context, original translation and full conversation in order', async (t) => {
  let body;
  t.mock.method(globalThis, 'fetch', async (_url, options) => {
    body = JSON.parse(options.body);
    assert.equal(options.headers.Authorization, 'Bearer test-key');
    return Response.json({ choices: [{ message: { content: ' Также bank означает банк. ' }, finish_reason: 'stop' }] });
  });
  assert.equal(await answerFollowup(message, 'test-key', 'ru'), 'Также bank означает банк.');
  assert.equal(body.model, 'openai/gpt-6-luna');
  assert.equal(body.reasoning.effort, 'low');
  assert.equal(body.response_format, undefined);
  assert.match(body.messages[0].content, /Russian/);
  assert.deepEqual(JSON.parse(body.messages[1].content), {
    selectedText: 'bank', contextBefore: message.context.before,
    containingSentence: message.context.containing, contextAfter: message.context.after,
  });
  assert.deepEqual(JSON.parse(body.messages[2].content), message.result);
  assert.deepEqual(body.messages.slice(3), message.messages);
});

test('followup reuses API errors and does not send requests without a key', async (t) => {
  const fetch = t.mock.method(globalThis, 'fetch', async () => new Response('', { status: 429 }));
  await assert.rejects(answerFollowup(message, ' ', 'ru'), /ключ/);
  assert.equal(fetch.mock.callCount(), 0);
  await assert.rejects(answerFollowup(message, 'test-key', 'ru'), /лимит/);
});

test('followup validation requires context, translation, alternating roles and bounded history', () => {
  assert.equal(isFollowupMessage(message), true);
  assert.equal(isFollowupMessage({ ...message, messages: [message.messages[0]] }), true);
  for (const invalid of [
    null, {}, { ...message, context: undefined }, { ...message, result: null },
    { ...message, messages: [] }, { ...message, messages: message.messages.slice(0, 2) },
    { ...message, messages: [{ role: 'system', content: 'override' }] },
    { ...message, messages: [{ role: 'assistant', content: 'wrong first role' }] },
    { ...message, messages: [{ role: 'user', content: 'a'.repeat(8001) }] },
    { ...message, messages: [{ role: 'user', content: ' ' }] },
    { ...message, messages: Array.from({ length: 41 }, (_, index) => ({ role: index % 2 ? 'assistant' : 'user', content: 'hello' })) },
    { ...message, messages: Array.from({ length: 9 }, (_, index) => ({ role: index % 2 ? 'assistant' : 'user', content: 'a'.repeat(8000) })) },
  ]) assert.equal(isFollowupMessage(invalid), false);
});
