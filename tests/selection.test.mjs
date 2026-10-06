import assert from 'node:assert/strict';
import { test } from 'node:test';
import { JSDOM } from 'jsdom';
import { readPageSelection } from '../utils/selection.ts';
import { extractSentenceContext } from '../utils/translation-context.ts';

function page(html) {
  const dom = new JSDOM(html);
  dom.window.HTMLElement.prototype.getClientRects = () => [{ width: 100, height: 20 }];
  return dom;
}

function select(document, startNode, start, endNode = startNode, end = start + 4) {
  const range = document.createRange();
  range.setStart(startNode, start);
  range.setEnd(endNode, end);
  document.getSelection().removeAllRanges();
  document.getSelection().addRange(range);
}

test('sentence context uses selected occurrence, not the first repeated word', () => {
  const text = 'The bank was closed. We walked to the river. She sat on the bank. The water was cold. We went home.';
  const start = text.lastIndexOf('bank');
  assert.deepEqual(extractSentenceContext(text, start, start + 4), {
    before: 'We walked to the river.', containing: 'She sat on the bank.', after: 'The water was cold.',
  });
});

test('context covers all selected sentences plus one neighbor on each side', () => {
  const text = 'First sentence. Second sentence. Third sentence. Last sentence.';
  assert.deepEqual(extractSentenceContext(text, text.indexOf('Second'), text.indexOf('Last')), {
    before: 'First sentence.', containing: 'Second sentence. Third sentence.', after: 'Last sentence.',
  });
  assert.deepEqual(extractSentenceContext('Одно предложение.', 0, 4), {
    before: '', containing: 'Одно предложение.', after: '',
  });
});

test('reads word inside inline markup with neighboring paragraphs', () => {
  const dom = page('<main><p>We walked along the river.</p><p>She sat on the <strong>bank</strong>.</p><p>The water was cold.</p><p>Unrelated text.</p></main>');
  const document = dom.window.document;
  select(document, document.querySelector('strong').firstChild, 0);
  const result = readPageSelection(document);
  assert.equal(result.text, 'bank');
  assert.deepEqual(result.context, {
    before: 'We walked along the river.', containing: 'She sat on the bank.', after: 'The water was cold.',
  });
  dom.window.close();
});

test('reads ranges spanning inline elements and repeated words', () => {
  const dom = page('<p>The bank closed. We reached the river. A <em>river bank</em> was nearby. It was quiet.</p>');
  const document = dom.window.document;
  const node = document.querySelector('em').firstChild;
  select(document, node, 6, node, 10);
  const result = readPageSelection(document);
  assert.equal(result.text, 'bank');
  assert.equal(result.context.containing, 'A river bank was nearby.');
  assert.equal(result.context.before, 'We reached the river.');
  select(document, node, 6, document.querySelector('p').lastChild, 11);
  assert.equal(readPageSelection(document).text, 'bank was nearby');
  dom.window.close();
});

test('does not read editors, controls, hidden content, or empty selections', () => {
  const dom = page('<main><p hidden>Secret.</p><p>Before.</p><p><b>word</b>.</p><p>After.</p><div contenteditable="true">edit</div><button>text</button></main>');
  const document = dom.window.document;
  assert.equal(readPageSelection(document), null);
  for (const selector of ['[contenteditable]', 'button', '[hidden]']) {
    select(document, document.querySelector(selector).firstChild, 0);
    assert.equal(readPageSelection(document), null);
  }
  select(document, document.querySelector('b').firstChild, 0);
  const result = readPageSelection(document);
  assert.equal(result.context.before, 'Before.');
  assert.equal(result.context.after, 'After.');
  dom.window.close();
});

test('supports element endpoints and selections across paragraphs', () => {
  const dom = page('<main><p>Before.</p><p>One.</p><p>Two.</p><p>After.</p></main>');
  const document = dom.window.document;
  const root = document.querySelector('main');
  select(document, root, 1, root, 3);
  const result = readPageSelection(document);
  assert.ok(result);
  assert.equal(result.context.before, 'Before.');
  assert.equal(result.context.after, 'After.');
  dom.window.close();
});
