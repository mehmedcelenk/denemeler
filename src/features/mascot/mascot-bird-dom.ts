import { renderRoboBirdSvg } from '../../shared/mascot-bird-svg.ts';
import { pickMascotQuip, type TalkMood } from '../../shared/mascot-lines.ts';
import type { BirdMascotId } from '../../shared/mascot-types.ts';
import { BIRD_ID, detectBirdScreen } from './mascot-bird-perch.ts';

export function createBirdDom(onTap: () => void, initialSpecies: BirdMascotId = 'bird'): { root: HTMLElement; bubble: HTMLElement } {
  document.getElementById(BIRD_ID)?.remove();
  const root = document.createElement('div');
  root.id = BIRD_ID;
  root.className = 'mascot-bird';
  root.dataset.role = 'mascot-bird';
  root.dataset.state = 'bar';
  root.dataset.facing = 'right';
  root.dataset.mood = 'idle';
  root.dataset.species = initialSpecies;
  root.hidden = true;

  const bubble = document.createElement('span');
  bubble.className = 'mascot-bird-bubble';
  bubble.dataset.role = 'mascot-bird-bubble';
  bubble.hidden = true;

  const btn = document.createElement('button');
  btn.type = 'button';
  btn.className = 'mascot-bird-btn';
  btn.setAttribute('aria-label', 'Robokuş maskotu');
  btn.innerHTML = `<span class="mascot-bird-stage">${renderRoboBirdSvg(initialSpecies)}</span>`;
  btn.addEventListener('click', onTap);

  root.appendChild(bubble);
  root.appendChild(btn);
  document.body.appendChild(root);
  return { root, bubble };
}

export interface BirdExpressionController {
  showBubble: (mood: TalkMood) => void;
  hideBubble: () => void;
  scheduleQuirk: () => void;
  clearQuirk: () => void;
}

export function createBirdExpression(
  getRoot: () => HTMLElement | null,
  getBubble: () => HTMLElement | null,
  canAct: () => boolean,
  getSpecies: () => BirdMascotId,
): BirdExpressionController {
  let bubbleTimer: ReturnType<typeof setTimeout> | null = null;
  let quirkTimer: ReturnType<typeof setTimeout> | null = null;
  let quirkClearTimer: ReturnType<typeof setTimeout> | null = null;

  function hideBubble(): void {
    if (bubbleTimer !== null) { clearTimeout(bubbleTimer); bubbleTimer = null; }
    const el = getBubble();
    if (el) { el.hidden = true; el.textContent = ''; }
  }

  function showBubble(mood: TalkMood): void {
    const root = getRoot();
    const el = getBubble();
    if (!root || !el || root.hidden || detectBirdScreen() === 'profile') return;
    const quip = pickMascotQuip(getSpecies(), mood);
    if (!quip) return;
    hideBubble();
    el.textContent = quip;
    el.hidden = false;
    bubbleTimer = setTimeout(() => { bubbleTimer = null; el.hidden = true; el.textContent = ''; }, 1850);
  }

  function clearQuirk(): void {
    if (quirkTimer !== null) { clearTimeout(quirkTimer); quirkTimer = null; }
    if (quirkClearTimer !== null) { clearTimeout(quirkClearTimer); quirkClearTimer = null; }
    const root = getRoot();
    if (root) delete root.dataset.quirk;
  }

  function scheduleQuirk(): void {
    clearQuirk();
    const root = getRoot();
    if (!root || root.hidden || detectBirdScreen() === 'profile') return;
    const waitMs = 4200 + Math.floor(Math.random() * 5800);
    quirkTimer = setTimeout(() => {
      quirkTimer = null;
      const cur = getRoot();
      if (!cur || cur.hidden || !canAct() || detectBirdScreen() === 'profile') { scheduleQuirk(); return; }
      const roll = Math.random();
      if (roll < 0.42) {
        cur.dataset.facing = cur.dataset.facing === 'left' ? 'right' : 'left';
        scheduleQuirk();
        return;
      }
      const quirk = roll < 0.72 ? 'ruffle' : 'tilt';
      cur.dataset.quirk = quirk;
      quirkClearTimer = setTimeout(() => {
        quirkClearTimer = null;
        if (cur) delete cur.dataset.quirk;
        scheduleQuirk();
      }, quirk === 'ruffle' ? 520 : 820);
    }, waitMs);
  }

  return { showBubble, hideBubble, scheduleQuirk, clearQuirk };
}

export interface BirdObserverHandlers {
  onPointerDown: (event: PointerEvent) => void;
  onScrollOrResize: () => void;
  onBodyClassChange: () => void;
  onBubbleChange: () => void;
  onWelcomeMutation: () => void;
}

function isConceptBubbleNode(node: Node): boolean {
  return node instanceof Element && node.matches('.vocab-bubble, .lesson-concept-bubble');
}

export function bindBirdListeners(handlers: BirdObserverHandlers): () => void {
  document.addEventListener('pointerdown', handlers.onPointerDown, { capture: true, passive: true });
  window.addEventListener('scroll', handlers.onScrollOrResize, { capture: true, passive: true });
  window.addEventListener('resize', handlers.onScrollOrResize, { passive: true });
  let bodyObs: MutationObserver | null = null;
  let welcomeObs: MutationObserver | null = null;
  let bookletObs: MutationObserver | null = null;
  if (typeof MutationObserver !== 'undefined') {
    bodyObs = new MutationObserver((records) => {
      if (records.some(r => r.type === 'attributes')) handlers.onBodyClassChange();
      const bubbleMutated = records.some(
        r => r.type === 'childList' && ([...r.addedNodes, ...r.removedNodes].some(isConceptBubbleNode)),
      );
      if (bubbleMutated) handlers.onBubbleChange();
    });
    bodyObs.observe(document.body, { attributes: true, attributeFilter: ['class'], childList: true });
    const portal = document.getElementById('welcomePortal');
    if (portal) {
      welcomeObs = new MutationObserver(handlers.onWelcomeMutation);
      welcomeObs.observe(portal, { childList: true, subtree: true });
    }
    const booklet = document.getElementById('bookletPagesContainer');
    if (booklet) {
      bookletObs = new MutationObserver(handlers.onBubbleChange);
      bookletObs.observe(booklet, { childList: true, subtree: true, attributes: true, attributeFilter: ['hidden'] });
    }
  }
  return () => {
    document.removeEventListener('pointerdown', handlers.onPointerDown, { capture: true });
    window.removeEventListener('scroll', handlers.onScrollOrResize, { capture: true });
    window.removeEventListener('resize', handlers.onScrollOrResize);
    bodyObs?.disconnect();
    welcomeObs?.disconnect();
    bookletObs?.disconnect();
  };
}
