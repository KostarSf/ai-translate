export interface TranslationContext {
  before: string;
  containing: string;
  after: string;
}

// Offsets refer to the actual selected occurrence, including repeated words.
export function extractSentenceContext(text: string, start: number, end: number): TranslationContext {
  const segments = [...new Intl.Segmenter(undefined, { granularity: 'sentence' }).segment(text)];
  const first = segments.findIndex((item) => item.index + item.segment.length > start);
  let last = first;
  while (last + 1 < segments.length && segments[last + 1]!.index < end) last++;
  if (first < 0) return { before: '', containing: '', after: '' };
  return {
    before: (segments[first - 1]?.segment ?? '').trim().slice(-4000),
    containing: text.slice(segments[first]!.index, segments[last]!.index + segments[last]!.segment.length).trim().slice(0, 16000),
    after: (segments[last + 1]?.segment ?? '').trim().slice(0, 4000),
  };
}
