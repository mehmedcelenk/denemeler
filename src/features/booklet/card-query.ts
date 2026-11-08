import type { Choice } from '../../data/question.ts';
import { state } from '../../app/state.ts';

export function getQuestionCards(qid: number): HTMLElement[] {
  if (typeof document === 'undefined') return [];
  return Array.from(document.querySelectorAll<HTMLElement>(`.booklet-question[data-qid="${qid}"]`));
}

export function getBookletCard(qid: number): HTMLElement | null {
  if (typeof document === 'undefined') return null;
  return document.querySelector<HTMLElement>(`#bookletPagesContainer .booklet-question[data-qid="${qid}"]`);
}

export function getBoardCard(qid: number): HTMLElement | null {
  if (typeof document === 'undefined') return null;
  return document.querySelector<HTMLElement>(`#boardQuestionStage .booklet-question[data-qid="${qid}"]`);
}

export function isBoardOverlayOpen(): boolean {
  if (typeof document === 'undefined') return false;
  const overlay = document.getElementById('boardSpaceOverlay');
  return Boolean(overlay && overlay.style.display === 'flex');
}

export function getActiveQuestionCard(qid: number, sourceEl?: Element | null): HTMLElement | null {
  if (typeof document === 'undefined') return null;
  if (sourceEl) {
    const scoped = sourceEl.closest<HTMLElement>('.booklet-question');
    if (scoped) return scoped;
  }
  if (state.activeBoardQuestionId === qid || isBoardOverlayOpen()) {
    const boardCard = getBoardCard(qid);
    if (boardCard) return boardCard;
  }
  return getBookletCard(qid) || document.querySelector<HTMLElement>(`.booklet-question[data-qid="${qid}"]`);
}

export function getCardStem(card: ParentNode): HTMLElement | null {
  return card.querySelector<HTMLElement>('[data-role="stem"]');
}

export function getCardChoiceRow(card: ParentNode, letter: Choice | string): HTMLElement | null {
  return card.querySelector<HTMLElement>(`.optical-choice-row[data-letter="${letter}"]`);
}

export function getCardChoiceText(card: ParentNode, letter: Choice | string): HTMLElement | null {
  return card.querySelector<HTMLElement>(`.optical-choice-row[data-letter="${letter}"] .choice-text-content`);
}

export function getCardAnswerBanner(card: ParentNode): HTMLElement | null {
  return card.querySelector<HTMLElement>('[data-role="answer-banner"]');
}

export function getCardActionElements(card: ParentNode, action: string, extraSelector = ''): HTMLElement[] {
  return Array.from(card.querySelectorAll<HTMLElement>(`[data-action="${action}"]${extraSelector}`));
}
