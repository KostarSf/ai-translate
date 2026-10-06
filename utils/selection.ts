import { extractSentenceContext, type TranslationContext } from './translation-context.ts';

export interface PageSelection {
  text: string;
  context: TranslationContext;
  range: Range;
}

const excluded = 'script, style, noscript, nav, input, textarea, select, button, [contenteditable]:not([contenteditable="false"]), [hidden], [aria-hidden="true"], ai-translate-selection';
const blocks = 'p, li, blockquote, pre, td, th, h1, h2, h3, h4, h5, h6, div';

export function readPageSelection(document: Document): PageSelection | null {
  const selection = document.getSelection();
  if (!selection || selection.isCollapsed || selection.rangeCount !== 1) return null;
  const range = selection.getRangeAt(0).cloneRange();
  const text = range.toString().trim();
  if (!text || text.length > 12000) return null;
  const startElement = range.startContainer.nodeType === 1
    ? range.startContainer as Element : range.startContainer.parentElement;
  const endElement = range.endContainer.nodeType === 1
    ? range.endContainer as Element : range.endContainer.parentElement;
  if (!startElement || !endElement || startElement.closest(excluded) || endElement.closest(excluded)) return null;
  // Shadow trees and editors are excluded in this first version.
  if (range.startContainer.getRootNode() !== document || range.endContainer.getRootNode() !== document) return null;
  const common = range.commonAncestorContainer.nodeType === 1
    ? range.commonAncestorContainer as Element : range.commonAncestorContainer.parentElement!;
  const root = common.closest('article, main, [role="main"]') ?? common.closest(blocks)?.parentElement ?? common;
  const walker = document.createTreeWalker(root, 4);
  let fullText = '';
  let start = -1;
  let end = -1;
  let previousBlock: Element | null = null;
  for (let node = walker.nextNode(); node; node = walker.nextNode()) {
    const parent = node.parentElement;
    if (!parent || parent.closest(excluded)) continue;
    const style = document.defaultView?.getComputedStyle(parent);
    if (style?.display === 'none' || style?.visibility === 'hidden' || !parent.getClientRects().length) continue;
    const block = parent.closest(blocks);
    if (block !== previousBlock && fullText) fullText += '\n';
    previousBlock = block;
    const value = node.textContent ?? '';
    const offset = fullText.length;
    const startsBeforeEnd = range.comparePoint(node, 0) <= 0;
    const endsAfterStart = range.comparePoint(node, value.length) >= 0;
    if (startsBeforeEnd && endsAfterStart) {
      const localStart = range.startContainer === node ? range.startOffset : 0;
      const localEnd = range.endContainer === node ? range.endOffset : value.length;
      if (localEnd > localStart) {
        if (start < 0) start = offset + localStart;
        end = offset + localEnd;
      }
    }
    fullText += value;
  }
  if (start < 0 || end < 0) return null;
  // Do not accidentally include skipped hidden/editor text in the selection.
  if (fullText.slice(start, end).replace(/\s+/g, '') !== text.replace(/\s+/g, '')) return null;
  return { text, range, context: extractSentenceContext(fullText, start, end) };
}
