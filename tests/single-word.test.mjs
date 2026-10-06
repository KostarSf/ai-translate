import assert from 'node:assert/strict';
import { test } from 'node:test';
import { isSingleWord } from '../utils/single-word.ts';

test('recognizes individual words, punctuation, contractions, and compounds', () => {
  for (const word of ['bank', ' берег ', '“bank,”', "don't", 'mother-in-law', 'научно‑технический', 'C++', 'C#', 'cafe\u0301']) {
    assert.equal(isSingleWord(word), true, word);
  }
});

test('does not show a word note for phrases, sentences, numbers, or empty selections', () => {
  for (const text of ['', ' ', 'river bank', 'a\nbank', 'Hello, world!', '123', '---', '😄', 'word/word']) {
    assert.equal(isSingleWord(text), false, text);
  }
});
