import { onStateChange } from '../../app/state.ts';
import type { Choice } from '../../data/question.ts';
import { getCardChoiceText, getCardStem, getQuestionCards } from '../booklet/card-query.ts';
import {
  addHighlightRecord,
  captureHighlightRecord,
  getHighlightsForQuestion,
  removeHighlightRecord,
  resolveHighlightRange,
  wrapRangeWithMark,
  type HighlightColor,
  type HighlightRecord,
  type HighlightTarget,
} from './highlight-store.ts';

export type { HighlightColor };

let actionBubble: HTMLElement | null = null;
let currentRange: Range | null = null;

function removeActionBubble(): void {
  if (actionBubble && actionBubble.parentNode) {
    actionBubble.parentNode.removeChild(actionBubble);
  }
  actionBubble = null;
  currentRange = null;
}

interface SlotContext {
  readonly qid: number;
  readonly target: HighlightTarget;
  readonly slotEl: HTMLElement;
}

function getSlotContext(containerNode: Node): SlotContext | null {
  const el = (containerNode.nodeType === Node.ELEMENT_NODE
    ? containerNode
    : containerNode.parentElement) as HTMLElement | null;
  if (!el) return null;

  const card = el.closest<HTMLElement>('.booklet-question[data-qid]');
  const qid = card?.dataset.qid ? Number(card.dataset.qid) : NaN;
  if (!card || Number.isNaN(qid)) return null;

  const stemEl = el.closest<HTMLElement>('.q-stem-text');
  if (stemEl && card.contains(stemEl)) {
    return { qid, target: 'stem', slotEl: stemEl };
  }

  const choiceTextEl = el.closest<HTMLElement>('.choice-text-content');
  const letter = choiceTextEl?.closest<HTMLElement>('.optical-choice-row')?.dataset.letter as Choice | undefined;
  if (choiceTextEl && letter && card.contains(choiceTextEl)) {
    return { qid, target: letter, slotEl: choiceTextEl };
  }

  return null;
}

function applyRecordToSlot(slotEl: HTMLElement, record: HighlightRecord): void {
  if (slotEl.querySelector(`mark.user-highlight[data-hl-id="${record.id}"]`)) return;
  try {
    const range = resolveHighlightRange(slotEl, record);
    if (range) wrapRangeWithMark(range, record.color, record.id);
  } catch (err) {
    console.warn('[Highlighter] Vurgu geri yüklenemedi:', err);
  }
}

export function restoreHighlightsOnCards(cards: readonly HTMLElement[]): void {
  for (const card of cards) {
    const qid = card.dataset.qid ? Number(card.dataset.qid) : NaN;
    if (Number.isNaN(qid)) continue;

    const records = getHighlightsForQuestion(qid);
    if (records.length === 0) continue;

    for (const record of records) {
      const slotEl = record.target === 'stem'
        ? getCardStem(card)
        : getCardChoiceText(card, record.target);
      if (slotEl) applyRecordToSlot(slotEl, record);
    }
  }
}

function unwrapMarkElement(mark: HTMLElement): void {
  const parent = mark.parentNode;
  if (!parent) return;
  while (mark.firstChild) {
    parent.insertBefore(mark.firstChild, mark);
  }
  parent.removeChild(mark);
  parent.normalize();
}

/** Seçili alana fosfor uygular */
export function applyHighlightToSelection(color: HighlightColor = 'yellow'): void {
  const selection = window.getSelection();
  const range = currentRange || (selection && selection.rangeCount > 0 ? selection.getRangeAt(0) : null);
  if (!range || range.collapsed) {
    removeActionBubble();
    return;
  }

  // Seçilen metin soru kökü veya şık içinde mi kontrol et
  const container = range.commonAncestorContainer;
  const parentEl = (container.nodeType === Node.ELEMENT_NODE ? container : container.parentElement) as HTMLElement | null;
  const validHost = parentEl?.closest('.q-stem-text, .choice-text-content, .stem-card, .booklet-question');
  if (!validHost) {
    removeActionBubble();
    return;
  }

  const slotCtx = getSlotContext(container);
  let savedRecord: HighlightRecord | null = null;
  if (slotCtx) {
    savedRecord = captureHighlightRecord(range, slotCtx.slotEl, slotCtx.qid, slotCtx.target, color);
  }

  try {
    const hlId = savedRecord ? savedRecord.id : `hl_local_${Date.now().toString(36)}`;
    wrapRangeWithMark(range, color, hlId);
    if (savedRecord) {
      addHighlightRecord(savedRecord);
      const siblingCards = getQuestionCards(savedRecord.qid).filter(
        c => !c.contains(slotCtx?.slotEl ?? null),
      );
      restoreHighlightsOnCards(siblingCards);
    }
  } catch (err) {
    console.warn('[Highlighter] Metin sarmalanamadı:', err);
  }

  if (selection) {
    selection.removeAllRanges();
  }
  removeActionBubble();
}

/** Tıklanan fosforlu metnin vurgusunu kaldırır */
function handleHighlightClick(e: MouseEvent): void {
  const target = (e.target as HTMLElement | null)?.closest<HTMLElement>('.user-highlight');
  if (!target) return;

  e.preventDefault();
  e.stopPropagation();

  const hlId = target.dataset.hlId;
  const qidStr = target.closest<HTMLElement>('.booklet-question[data-qid]')?.dataset.qid;
  const qid = qidStr ? Number(qidStr) : NaN;

  unwrapMarkElement(target);

  if (hlId && !Number.isNaN(qid)) {
    removeHighlightRecord(qid, hlId);
    getQuestionCards(qid).forEach(card => {
      card.querySelectorAll<HTMLElement>(`mark.user-highlight[data-hl-id="${hlId}"]`).forEach(unwrapMarkElement);
    });
  }
}

/** Seçim yapıldığında mini butonları konumlandırır */
function handleSelectionChange(): void {
  const selection = window.getSelection();
  if (!selection || selection.rangeCount === 0 || selection.isCollapsed) {
    // Seçim yoksa ve kullanıcı menüye tıklamıyorsa kapat
    setTimeout(() => {
      const activeSel = window.getSelection();
      if (!activeSel || activeSel.isCollapsed) {
        removeActionBubble();
      }
    }, 150);
    return;
  }

  const range = selection.getRangeAt(0);
  const text = selection.toString().trim();
  if (!text) {
    removeActionBubble();
    return;
  }

  const container = range.commonAncestorContainer;
  const parentEl = (container.nodeType === Node.ELEMENT_NODE ? container : container.parentElement) as HTMLElement | null;
  const validHost = parentEl?.closest('.q-stem-text, .choice-text-content, .stem-card, .booklet-question');
  if (!validHost) {
    removeActionBubble();
    return;
  }

  currentRange = range.cloneRange();
  const rect = range.getBoundingClientRect();
  if (rect.width === 0 || rect.height === 0) {
    removeActionBubble();
    return;
  }

  if (!actionBubble) {
    actionBubble = document.createElement('div');
    actionBubble.className = 'selection-action-bubble';
    document.body.appendChild(actionBubble);
  }

  actionBubble.innerHTML = `
    <button class="btn-highlight-action btn-hl-yellow" type="button" data-color="yellow">
      <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
        <path d="m9 11-6 6v3h3l6-6"/>
        <path d="m22 12-4.6 4.6a2 2 0 0 1-2.8 0l-5.2-5.2a2 2 0 0 1 0-2.8L14 4"/>
      </svg>
      <span>Sarı</span>
    </button>
    <button class="btn-highlight-action btn-hl-red" type="button" data-color="red">
      <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
        <path d="m9 11-6 6v3h3l6-6"/>
        <path d="m22 12-4.6 4.6a2 2 0 0 1-2.8 0l-5.2-5.2a2 2 0 0 1 0-2.8L14 4"/>
      </svg>
      <span>Kırmızı</span>
    </button>
  `;

  actionBubble.querySelectorAll<HTMLElement>('.btn-highlight-action').forEach(btn => {
    const handleAction = (e: Event) => {
      e.preventDefault();
      e.stopPropagation();
      const color = (btn.dataset.color as HighlightColor) || 'yellow';
      applyHighlightToSelection(color);
    };
    btn.addEventListener('pointerdown', handleAction);
    btn.addEventListener('click', handleAction);
  });

  const bubbleWidth = 145;
  const scrollX = window.scrollX || document.documentElement.scrollLeft;
  const scrollY = window.scrollY || document.documentElement.scrollTop;

  let left = rect.left + rect.width / 2 + scrollX;
  left = Math.max(bubbleWidth / 2 + 8, Math.min(window.innerWidth - bubbleWidth / 2 - 8, left));

  let top = rect.top + scrollY;
  if (rect.top < 50) {
    actionBubble.classList.add('bubble-below');
    top = rect.bottom + scrollY;
  } else {
    actionBubble.classList.remove('bubble-below');
  }

  actionBubble.style.left = `${left}px`;
  actionBubble.style.top = `${top}px`;
}

let isInitialized = false;

/** Metin seçimi ve sarı fosforlama özelliğini başlatır */
export function initTextHighlighter(): void {
  if (isInitialized || typeof document === 'undefined') return;
  isInitialized = true;

  document.addEventListener('selectionchange', () => {
    // Mobil klavye/scroll debounce
    requestAnimationFrame(handleSelectionChange);
  });

  document.addEventListener('click', handleHighlightClick);
  
  // Sayfa kaydırıldığında veya dışarı tıklandığında menüyü gizleme
  document.addEventListener('scroll', () => {
    if (actionBubble && (!window.getSelection() || window.getSelection()?.isCollapsed)) {
      removeActionBubble();
    }
  }, { passive: true });

  onStateChange('booklet:rendered', payload => {
    if (!payload || typeof payload !== 'object' || !('cards' in payload)) return;
    const cards = Array.isArray(payload.cards) ? payload.cards : [];
    restoreHighlightsOnCards(cards.filter((el): el is HTMLElement => el instanceof HTMLElement));
  });
}
