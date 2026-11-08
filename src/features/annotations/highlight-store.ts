import type { Choice } from '../../data/question.ts';

export type HighlightColor = 'yellow' | 'red';
export type HighlightTarget = 'stem' | Choice;

export interface HighlightRecord {
  readonly id: string;
  readonly qid: number;
  readonly target: HighlightTarget;
  readonly color: HighlightColor;
  readonly exact: string;
  readonly prefix: string;
  readonly suffix: string;
}

export interface TextSegment {
  readonly node: Text;
  readonly start: number;
  readonly end: number;
}

const CONTEXT_LEN = 24;
const highlightsByQid = new Map<number, HighlightRecord[]>();
let nextHighlightSeq = 1;

export function createHighlightId(): string {
  return `hl_${Date.now().toString(36)}_${nextHighlightSeq++}`;
}

export function getHighlightsForQuestion(qid: number): readonly HighlightRecord[] {
  return highlightsByQid.get(qid) ?? [];
}

export function addHighlightRecord(record: HighlightRecord): void {
  const existing = highlightsByQid.get(record.qid) ?? [];
  existing.push(record);
  highlightsByQid.set(record.qid, existing);
}

export function removeHighlightRecord(qid: number, hlId: string): void {
  const existing = highlightsByQid.get(qid);
  if (!existing) return;
  const filtered = existing.filter(item => item.id !== hlId);
  if (filtered.length === 0) {
    highlightsByQid.delete(qid);
  } else {
    highlightsByQid.set(qid, filtered);
  }
}

export function clearAllHighlightRecords(): void {
  highlightsByQid.clear();
}

export function collectVisibleTextSegments(slotEl: Element): {
  fullText: string;
  segments: TextSegment[];
} {
  const walker = document.createTreeWalker(slotEl, NodeFilter.SHOW_TEXT, {
    acceptNode(node) {
      const parent = node.parentElement;
      if (!parent) return NodeFilter.FILTER_REJECT;
      if (parent.closest('rt.interlinear-gloss, .katex-mathml')) {
        return NodeFilter.FILTER_REJECT;
      }
      return NodeFilter.FILTER_ACCEPT;
    },
  });

  const segments: TextSegment[] = [];
  let fullText = '';
  let current = walker.nextNode();
  while (current) {
    const textNode = current as Text;
    const len = textNode.data.length;
    if (len > 0) {
      const start = fullText.length;
      const end = start + len;
      segments.push({ node: textNode, start, end });
      fullText += textNode.data;
    }
    current = walker.nextNode();
  }

  return { fullText, segments };
}

export function captureHighlightRecord(
  range: Range,
  slotEl: Element,
  qid: number,
  target: HighlightTarget,
  color: HighlightColor,
): HighlightRecord | null {
  const { fullText, segments } = collectVisibleTextSegments(slotEl);
  if (!fullText || segments.length === 0) return null;

  let globalStart = Number.POSITIVE_INFINITY;
  let globalEnd = -1;

  for (const seg of segments) {
    const len = seg.node.data.length;
    if (range.comparePoint(seg.node, len) < 0) continue;
    if (range.comparePoint(seg.node, 0) > 0) break;

    const localStart = seg.node === range.startContainer
      ? range.startOffset
      : (range.comparePoint(seg.node, 0) < 0 ? len : 0);
    const localEnd = seg.node === range.endContainer
      ? range.endOffset
      : (range.comparePoint(seg.node, len) > 0 ? 0 : len);

    if (localEnd <= localStart) continue;
    globalStart = Math.min(globalStart, seg.start + localStart);
    globalEnd = Math.max(globalEnd, seg.start + localEnd);
  }

  if (!Number.isFinite(globalStart) || globalEnd <= globalStart) return null;
  const exact = fullText.slice(globalStart, globalEnd);
  if (!exact.trim()) return null;

  return {
    id: createHighlightId(),
    qid,
    target,
    color,
    exact,
    prefix: fullText.slice(Math.max(0, globalStart - CONTEXT_LEN), globalStart),
    suffix: fullText.slice(globalEnd, Math.min(fullText.length, globalEnd + CONTEXT_LEN)),
  };
}

function findBestTextOffset(fullText: string, record: HighlightRecord): number {
  const firstIdx = fullText.indexOf(record.exact);
  if (firstIdx === -1) return -1;

  let bestIdx = firstIdx;
  let bestScore = -1;
  let searchFrom = 0;

  while (searchFrom <= fullText.length - record.exact.length) {
    const idx = fullText.indexOf(record.exact, searchFrom);
    if (idx === -1) break;

    let score = 0;
    if (record.prefix) {
      const actualPrefix = fullText.slice(Math.max(0, idx - record.prefix.length), idx);
      if (actualPrefix === record.prefix) score += 2;
    }
    if (record.suffix) {
      const endPos = idx + record.exact.length;
      const actualSuffix = fullText.slice(endPos, Math.min(fullText.length, endPos + record.suffix.length));
      if (actualSuffix === record.suffix) score += 1;
    }
    if (score > bestScore) {
      bestScore = score;
      bestIdx = idx;
      if (score === 3) break;
    }
    searchFrom = idx + 1;
  }

  return bestIdx;
}

export function resolveHighlightRange(slotEl: Element, record: HighlightRecord): Range | null {
  const { fullText, segments } = collectVisibleTextSegments(slotEl);
  if (!fullText || segments.length === 0) return null;

  const matchStart = findBestTextOffset(fullText, record);
  if (matchStart === -1) return null;
  const matchEnd = matchStart + record.exact.length;

  let startSeg: TextSegment | null = null;
  let endSeg: TextSegment | null = null;
  for (const seg of segments) {
    if (!startSeg && matchStart >= seg.start && matchStart < seg.end) {
      startSeg = seg;
    }
    if (matchEnd > seg.start && matchEnd <= seg.end) {
      endSeg = seg;
      break;
    }
  }
  if (!startSeg || !endSeg) return null;

  const range = document.createRange();
  range.setStart(startSeg.node, matchStart - startSeg.start);
  range.setEnd(endSeg.node, matchEnd - endSeg.start);
  return range;
}

export function wrapRangeWithMark(range: Range, color: HighlightColor, hlId: string): HTMLElement {
  const mark = document.createElement('mark');
  mark.className = `user-highlight hl-${color}`;
  mark.dataset.hlId = hlId;
  mark.title = 'Vurguyu kaldırmak için tıkla';

  const content = range.extractContents();
  mark.appendChild(content);
  range.insertNode(mark);
  return mark;
}
