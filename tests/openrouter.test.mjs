import assert from 'node:assert/strict';
import { test } from 'node:test';
import { translateText } from '../utils/openrouter.ts';

const request = { text: 'Hello', targetLanguage: 'ru', apiKey: ' test-key ' };

test('sends translation request with fixed model and low reasoning', async (t) => {
  t.mock.method(globalThis, 'fetch', async (url, options) => {
    assert.equal(url, 'https://openrouter.ai/api/v1/chat/completions');
    assert.equal(options.method, 'POST');
    assert.equal(options.headers.Authorization, 'Bearer test-key');
    const body = JSON.parse(options.body);
    assert.equal(body.model, 'openai/gpt-6-luna');
    assert.deepEqual(body.reasoning, { effort: 'low', exclude: true });
    assert.match(body.messages[0].content, /Russian/);
    assert.deepEqual(body.messages[1], { role: 'user', content: 'Hello' });
    return Response.json({ choices: [{ message: { content: ' Привет ' }, finish_reason: 'stop' }] });
  });
  assert.equal(await translateText(request), 'Привет');
});

test('does not send requests without a key or text', async (t) => {
  const fetch = t.mock.method(globalThis, 'fetch');
  await assert.rejects(translateText({ ...request, apiKey: ' ' }), /ключ/);
  await assert.rejects(translateText({ ...request, text: ' ' }), /текст/);
  assert.equal(fetch.mock.callCount(), 0);
});

test('sends context as separate data and instructs the model to translate only selection', async (t) => {
  t.mock.method(globalThis, 'fetch', async (_url, options) => {
    const body = JSON.parse(options.body);
    assert.match(body.messages[0].content, /Translate ONLY selectedText/);
    assert.deepEqual(JSON.parse(body.messages[1].content), {
      selectedText: 'bank', contextBefore: 'We walked to the river.',
      containingSentence: 'She sat on the bank.', contextAfter: 'The water was cold.',
    });
    return Response.json({ choices: [{ message: { content: 'берег' }, finish_reason: 'stop' }] });
  });
  assert.equal(await translateText({ ...request, text: 'bank', context: {
    before: 'We walked to the river.', containing: 'She sat on the bank.', after: 'The water was cold.',
  } }), 'берег');
});

test('handles authentication, balance, and rate limit errors without exposing response details', async (t) => {
  for (const [status, message] of [[401, /Неверный ключ/], [402, /Недостаточно средств/], [429, /лимит/]]) {
    const fetch = t.mock.method(globalThis, 'fetch', async () => new Response('private provider details', { status }));
    await assert.rejects(translateText(request), message);
    fetch.mock.restore();
  }
});

test('rejects empty, malformed, truncated, and API-error responses', async (t) => {
  for (const payload of [null, {}, { choices: [{ message: { content: '' } }] },
    { choices: [{ finish_reason: 'length', message: { content: 'Partial' } }] },
    { error: { code: 401 } }]) {
    const fetch = t.mock.method(globalThis, 'fetch', async () => Response.json(payload));
    await assert.rejects(translateText(request));
    fetch.mock.restore();
  }
});

test('handles network failure and forwards cancellation', async (t) => {
  const controller = new AbortController();
  controller.abort();
  t.mock.method(globalThis, 'fetch', async (_url, options) => {
    assert.equal(options.signal, controller.signal);
    throw new TypeError('fetch failed');
  });
  await assert.rejects(translateText({ ...request, signal: controller.signal }), /отменён/);
  await assert.rejects(translateText(request), /подключение/);
});
