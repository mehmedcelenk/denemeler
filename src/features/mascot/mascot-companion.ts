import {
  isActiveMascotId,
  isBirdMascotId,
  type ActiveMascotId,
  type MascotId,
  type MascotMood,
} from '../../shared/mascot-types.ts';
import { renderActiveMascotSvg } from '../../shared/mascot-svgs.ts';
import { pickMascotQuip, type TalkMood } from '../../shared/mascot-lines.ts';
import { reactRoboBird, resetRoboBirdForTest, setRoboBirdPrintHidden, syncRoboBird } from './mascot-bird.ts';

const COMPANION_ID = 'mascotCompanion';
const BUBBLE_MS = 1750;
const DEFAULT_MOOD_MS: Readonly<Record<Exclude<MascotMood, 'idle'>, number>> = {
  welcome: 1150,
  correct: 1450,
  wrong: 1350,
};

let containerEl: HTMLElement | null = null;
let handleEl: HTMLButtonElement | null = null;
let frameEl: HTMLElement | null = null;
let svgHostEl: HTMLElement | null = null;
let bubbleEl: HTMLElement | null = null;
let renderedMascot: ActiveMascotId | null = null;
let moodTimer: ReturnType<typeof setTimeout> | null = null;
let bubbleTimer: ReturnType<typeof setTimeout> | null = null;

function clearMoodTimer(): void {
  if (moodTimer !== null) {
    clearTimeout(moodTimer);
    moodTimer = null;
  }
}

function hideBubble(): void {
  if (bubbleTimer !== null) {
    clearTimeout(bubbleTimer);
    bubbleTimer = null;
  }
  if (bubbleEl) {
    bubbleEl.hidden = true;
    bubbleEl.textContent = '';
  }
}

function maybeShowBubble(mood: TalkMood): void {
  if (!bubbleEl || !renderedMascot || !containerEl || containerEl.hidden) return;
  const quip = pickMascotQuip(renderedMascot, mood);
  if (!quip) return;
  hideBubble();
  bubbleEl.textContent = quip;
  bubbleEl.hidden = false;
  bubbleTimer = setTimeout(() => {
    bubbleTimer = null;
    if (bubbleEl) {
      bubbleEl.hidden = true;
      bubbleEl.textContent = '';
    }
  }, BUBBLE_MS);
}

function firePortholeTorpedo(): void {
  if (!frameEl || renderedMascot !== 'fish') return;
  frameEl.querySelectorAll('.mascot-porthole-bolt').forEach(el => el.remove());
  const bolt = document.createElement('span');
  bolt.className = 'mascot-porthole-bolt';
  bolt.setAttribute('aria-hidden', 'true');
  frameEl.appendChild(bolt);
  setTimeout(() => bolt.remove(), 460);
}

function ensureMounted(): boolean {
  if (typeof document === 'undefined' || !document.body) return false;
  if (containerEl && containerEl.isConnected) return true;

  document.getElementById(COMPANION_ID)?.remove();

  const root = document.createElement('div');
  root.id = COMPANION_ID;
  root.className = 'mascot-companion';
  root.dataset.role = 'mascot-companion';
  root.dataset.mood = 'idle';
  root.hidden = true;

  const handle = document.createElement('button');
  handle.type = 'button';
  handle.className = 'mascot-handle';
  handle.dataset.role = 'mascot-handle';
  handle.setAttribute('aria-label', 'Maskot rozeti');

  const frame = document.createElement('span');
  frame.className = 'mascot-frame';
  frame.setAttribute('aria-hidden', 'true');

  const svgHost = document.createElement('span');
  svgHost.className = 'mascot-stage';
  svgHost.dataset.role = 'mascot-stage';
  frame.appendChild(svgHost);
  handle.appendChild(frame);

  const bubble = document.createElement('span');
  bubble.className = 'mascot-bubble';
  bubble.dataset.role = 'mascot-bubble';
  bubble.hidden = true;

  root.appendChild(handle);
  root.appendChild(bubble);

  handle.addEventListener('click', () => {
    triggerMascotMood('welcome', 1100);
  });

  const topHud = document.querySelector<HTMLElement>('.top-center-badge-container');
  if (topHud) topHud.prepend(root);
  else document.body.appendChild(root);

  containerEl = root;
  handleEl = handle;
  frameEl = frame;
  svgHostEl = svgHost;
  bubbleEl = bubble;
  renderedMascot = null;
  return true;
}

/** Maskot HUD rozetinin görünürlüğünü ve aktif SVG karakterini günceller. */
export function syncMascotCompanion(isSignedIn: boolean, mascotId: MascotId, greet = false): void {
  const birdSpecies = isSignedIn && isBirdMascotId(mascotId) ? mascotId : null;
  syncRoboBird(birdSpecies, greet);

  if (!ensureMounted() || !containerEl || !svgHostEl || !handleEl) return;

  if (!isSignedIn || !isActiveMascotId(mascotId) || birdSpecies !== null) {
    clearMoodTimer();
    hideBubble();
    containerEl.hidden = true;
    containerEl.dataset.mascot = birdSpecies ?? 'none';
    containerEl.dataset.mood = 'idle';
    renderedMascot = null;
    return;
  }

  if (renderedMascot !== mascotId) {
    svgHostEl.innerHTML = renderActiveMascotSvg(mascotId);
    renderedMascot = mascotId;
    containerEl.dataset.mascot = mascotId;
  }

  containerEl.hidden = false;
  if (greet) {
    triggerMascotMood('welcome');
  } else if (moodTimer === null) {
    containerEl.dataset.mood = 'idle';
  }
}

/** Doğru/yanlış/karşılama anında kısa Clash Royale tarzı emote tepkisi oynatır. */
export function triggerMascotMood(
  mood: Exclude<MascotMood, 'idle'>,
  durationMs = DEFAULT_MOOD_MS[mood],
): void {
  reactRoboBird(mood);
  if (!containerEl || containerEl.hidden || !renderedMascot) return;
  clearMoodTimer();
  containerEl.dataset.mood = 'idle';
  void containerEl.offsetWidth;
  containerEl.dataset.mood = mood;
  if (mood === 'correct') firePortholeTorpedo();
  maybeShowBubble(mood);
  moodTimer = setTimeout(() => {
    moodTimer = null;
    if (containerEl) containerEl.dataset.mood = 'idle';
  }, durationMs);
}

export function setMascotPrintHidden(hidden: boolean): void {
  setRoboBirdPrintHidden(hidden);
  if (!containerEl) return;
  if (hidden) containerEl.dataset.printHidden = 'true';
  else delete containerEl.dataset.printHidden;
}

export function resetMascotCompanionForTest(): void {
  resetRoboBirdForTest();
  clearMoodTimer();
  hideBubble();
  containerEl?.remove();
  containerEl = null;
  handleEl = null;
  frameEl = null;
  svgHostEl = null;
  bubbleEl = null;
  renderedMascot = null;
}
