import type { Question } from '../../data/question.ts';
import type { QuestionLesson } from '../../data/lesson.ts';
import { getActiveQuestionCard, getQuestionCards } from '../booklet/card-query.ts';
import { hideLessonConceptBubble, toggleLessonConceptBubble } from './lesson-bubble.ts';
import {
  renderLessonEmptyMarkup,
  renderLessonInlineMarkup,
  renderLessonLoadingMarkup,
} from './lesson-view.ts';

export { hideLessonConceptBubble };

let panelListenersBound = false;

function getInlineHost(card: HTMLElement | null): HTMLElement | null {
  return card?.querySelector<HTMLElement>('[data-role="lesson-inline-host"]') ?? null;
}

function setCardButtonOpenState(card: HTMLElement, isOpen: boolean): void {
  card.querySelectorAll<HTMLElement>('[data-action="open-question-lesson"]').forEach(btn => {
    btn.classList.toggle('is-open', isOpen);
    btn.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
  });
}

export function isLessonPanelOpen(qid: number, sourceEl?: Element | null): boolean {
  const card = getActiveQuestionCard(qid, sourceEl);
  const host = getInlineHost(card);
  return Boolean(host && !host.hidden);
}

export function closeLessonPanel(qid: number, sourceEl?: Element | null): void {
  const card = getActiveQuestionCard(qid, sourceEl);
  if (!card) return;
  const host = getInlineHost(card);
  if (host) {
    host.hidden = true;
    host.innerHTML = '';
  }
  setCardButtonOpenState(card, false);
  hideLessonConceptBubble();
}

export function closeAllLessonPanelsForQuestion(qid: number): void {
  getQuestionCards(qid).forEach(card => {
    const host = getInlineHost(card);
    if (host) {
      host.hidden = true;
      host.innerHTML = '';
    }
    setCardButtonOpenState(card, false);
  });
  hideLessonConceptBubble();
}

function mountInlineHtml(qid: number, html: string, sourceEl?: Element | null): HTMLElement | null {
  const card = getActiveQuestionCard(qid, sourceEl);
  const host = getInlineHost(card);
  if (!card || !host) return null;
  host.innerHTML = html;
  host.hidden = false;
  setCardButtonOpenState(card, true);
  return host;
}

export function showLessonLoading(qid: number, q?: Question, sourceEl?: Element | null): void {
  mountInlineHtml(qid, renderLessonLoadingMarkup(q), sourceEl);
}

export function showLessonEmpty(qid: number, q?: Question, sourceEl?: Element | null): void {
  mountInlineHtml(qid, renderLessonEmptyMarkup(q), sourceEl);
}

export function showLessonContent(lesson: QuestionLesson, sourceEl?: Element | null): void {
  mountInlineHtml(lesson.questionId, renderLessonInlineMarkup(lesson), sourceEl);
}

export function bindLessonPanelListeners(): void {
  if (panelListenersBound || typeof document === 'undefined') return;
  panelListenersBound = true;

  document.addEventListener('click', (event) => {
    const target = event.target instanceof Element ? event.target : null;
    if (!target) return;

    const panel = target.closest<HTMLElement>('[data-role="lesson-inline-panel"]');
    if (!panel) return;

    if (target.closest('[data-lesson-close]')) {
      event.stopPropagation();
      const host = panel.closest<HTMLElement>('[data-role="lesson-inline-host"]');
      const qid = Number(host?.dataset.qid || panel.dataset.qid || '');
      if (!Number.isNaN(qid) && qid > 0) closeLessonPanel(qid, host);
      return;
    }

    const conceptBtn = target.closest<HTMLElement>('.lesson-concept-word');
    if (conceptBtn) {
      event.stopPropagation();
      event.preventDefault();
      toggleLessonConceptBubble(conceptBtn);
    }
  });
}
