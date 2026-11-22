import { escapeHtml } from '../../shared/escape.ts';
import { renderLessonInline } from './rich-text.ts';

let activeBubbleEl: HTMLElement | null = null;
let activeTriggerEl: HTMLElement | null = null;
let listenersBound = false;

export function hideLessonConceptBubble(): void {
  if (activeTriggerEl) {
    activeTriggerEl.classList.remove('vocab-active');
    activeTriggerEl.setAttribute('aria-expanded', 'false');
    activeTriggerEl = null;
  }
  if (activeBubbleEl) {
    activeBubbleEl.remove();
    activeBubbleEl = null;
  }
}

function bindGlobalDismiss(): void {
  if (listenersBound || typeof document === 'undefined') return;
  listenersBound = true;

  document.addEventListener('click', (event) => {
    const target = event.target instanceof Element ? event.target : null;
    if (!target || !activeBubbleEl) return;
    if (target.closest('.lesson-concept-bubble') || target.closest('.lesson-concept-word')) return;
    hideLessonConceptBubble();
  });

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && activeBubbleEl) {
      const prevTrigger = activeTriggerEl;
      hideLessonConceptBubble();
      prevTrigger?.focus();
    }
  });
}

/** Anlatım içindeki tıklanabilir kavrama dokunulduğunda sade tanım baloncuğunu açar. */
export function toggleLessonConceptBubble(trigger: HTMLElement): void {
  if (typeof document === 'undefined') return;
  bindGlobalDismiss();

  if (activeTriggerEl === trigger && activeBubbleEl) {
    hideLessonConceptBubble();
    return;
  }

  hideLessonConceptBubble();

  const term = trigger.dataset.lessonTerm || trigger.textContent?.trim() || '';
  const definition = trigger.dataset.lessonDef || '';
  if (!definition) return;

  const example = trigger.dataset.lessonExample || '';
  const emoji = trigger.dataset.lessonEmoji || '';

  const bubble = document.createElement('div');
  bubble.className = 'lesson-concept-bubble';
  bubble.setAttribute('role', 'tooltip');

  const emojiHtml = emoji ? `<span class="lesson-bubble-emoji" aria-hidden="true">${escapeHtml(emoji)}</span>` : '';
  const exampleHtml = example
    ? `<div class="lesson-bubble-example"><strong>Örnek:</strong> ${renderLessonInline(example)}</div>`
    : '';

  bubble.innerHTML = `
    <div class="lesson-bubble-head">
      ${emojiHtml}<span class="lesson-bubble-term">${escapeHtml(term)}</span>
    </div>
    <div class="lesson-bubble-def">${renderLessonInline(definition)}</div>
    ${exampleHtml}
  `;

  document.body.appendChild(bubble);
  activeBubbleEl = bubble;
  activeTriggerEl = trigger;
  trigger.classList.add('vocab-active');
  trigger.setAttribute('aria-expanded', 'true');

  positionBubble(bubble, trigger);
}

function positionBubble(bubble: HTMLElement, trigger: HTMLElement): void {
  const rect = trigger.getBoundingClientRect();
  const scrollX = window.scrollX || document.documentElement.scrollLeft || 0;
  const scrollY = window.scrollY || document.documentElement.scrollTop || 0;
  const viewportWidth = document.documentElement.clientWidth || window.innerWidth || 390;

  const maxWidth = Math.min(340, Math.max(220, viewportWidth - 20));
  bubble.style.maxWidth = `${maxWidth}px`;

  const bubbleRect = bubble.getBoundingClientRect();
  const targetCenterX = rect.left + scrollX + rect.width / 2;

  let left = targetCenterX - bubbleRect.width / 2;
  const minLeft = scrollX + 10;
  const maxLeft = scrollX + viewportWidth - bubbleRect.width - 10;
  if (left < minLeft) left = minLeft;
  if (left > maxLeft) left = maxLeft;

  const placeBelow = rect.top < bubbleRect.height + 16;
  const top = placeBelow ? rect.bottom + scrollY + 8 : rect.top + scrollY - bubbleRect.height - 8;

  bubble.classList.toggle('is-below', placeBelow);
  bubble.style.left = `${left}px`;
  bubble.style.top = `${top}px`;

  const arrowLeft = Math.max(16, Math.min(bubbleRect.width - 16, targetCenterX - left));
  bubble.style.setProperty('--lesson-arrow-left', `${arrowLeft}px`);
}
