export function isSingleWord(text: string): boolean {
  const word = text.trim().replace(/^["“«'‘(\[]+|["”»'’).,!?;:\]]+$/gu, '');
  if (!/^\p{L}[\p{L}\p{M}\p{N}]*(?:[-‐‑'’][\p{L}\p{M}\p{N}]+)*(?:\+\+|#)?$/u.test(word)) return false;
  const parts = [...new Intl.Segmenter(undefined, { granularity: 'word' }).segment(word)]
    .filter((part) => part.isWordLike);
  // Connectors join compounds and contractions; adjacent CJK words stay separate.
  return parts.length > 0 && parts.every((part, index) => index === 0 ||
    /^[-‐‑'’]+$/u.test(word.slice(parts[index - 1]!.index + parts[index - 1]!.segment.length, part.index)));
}
