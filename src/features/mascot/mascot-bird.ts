import type { TalkMood } from '../../shared/mascot-lines.ts';
import type { BirdMascotId } from '../../shared/mascot-types.ts';
import { renderRoboBirdSvg } from '../../shared/mascot-bird-svg.ts';
import { bindBirdListeners, createBirdDom, createBirdExpression } from './mascot-bird-dom.ts';
import {
  detectBirdScreen,
  getQnumPerch,
  resolveScreenTarget,
  useMobileBirdPerch,
  type BirdPerchState,
  type ScreenKind,
  type WelcomePerchKind,
} from './mascot-bird-perch.ts';
import {
  createFlightState,
  evaluateFlightFrame,
  formatBirdTransform,
  getRandomEdgeEntry,
  spawnChickenFeather,
  updateFlightTarget,
  type FlightState,
} from './mascot-bird-flight.ts';
import { createBirdScrollTracker } from './mascot-bird-scroll.ts';

const MOOD_MS = 1450;

let rootEl: HTMLElement | null = null;
let bubbleEl: HTMLElement | null = null;
let perchedQnumEl: HTMLElement | null = null;
let perchedBubbleEl: HTMLElement | null = null;
let activeSpecies: BirdMascotId = 'bird';
let active = false;
let currentScreen: ScreenKind = 'welcome';
let currentX = 0;
let currentY = 0;
let hasPos = false;
let flight: FlightState | null = null;
let lastFeatherAt = 0;
let flightRafId: number | null = null;
let moodTimer: ReturnType<typeof setTimeout> | null = null;
let landTimer: ReturnType<typeof setTimeout> | null = null;
let unbindListeners: (() => void) | null = null;
let welcomeSpotRatio = 0.78;
let barSpotRatio = 0.82;
let welcomePerchKind: WelcomePerchKind | null = null;

const expr = createBirdExpression(
  () => rootEl,
  () => bubbleEl,
  () => active && !flight,
  () => activeSpecies,
);

function rollPerchRandoms(): void {
  welcomeSpotRatio = Math.random() < 0.5 ? 0.08 + Math.random() * 0.24 : 0.68 + Math.random() * 0.24;
  barSpotRatio = 0.14 + Math.random() * 0.74;
}

function applyTransform(x: number, y: number, scale = 1, rotateDeg = 0): void {
  if (!rootEl) return;
  currentX = x;
  currentY = y;
  hasPos = true;
  rootEl.style.transform = formatBirdTransform(x, y, scale, rotateDeg);
}

function cancelFlight(): void {
  if (flightRafId !== null) { cancelAnimationFrame(flightRafId); flightRafId = null; }
  flight = null;
  if (landTimer !== null) { clearTimeout(landTimer); landTimer = null; }
  if (rootEl) { delete rootEl.dataset.flying; delete rootEl.dataset.landing; }
}

function stepFlight(now: number): void {
  flightRafId = null;
  if (!flight || !rootEl || !active) return;

  updateFlightTarget(flight, perchedQnumEl, welcomeSpotRatio, barSpotRatio);
  const frame = evaluateFlightFrame(flight, now);
  if (!frame.done) {
    applyTransform(frame.x, frame.y, frame.scale, frame.bankDeg);
    if (activeSpecies === 'bird' && now - lastFeatherAt > 190 && Math.random() < 0.72) {
      lastFeatherAt = now;
      spawnChickenFeather(frame.x, frame.y);
    }
    flightRafId = requestAnimationFrame(stepFlight);
    return;
  }

  applyTransform(flight.endX, flight.endY);
  flight = null;
  delete rootEl.dataset.flying;
  rootEl.dataset.landing = 'true';
  landTimer = setTimeout(() => { landTimer = null; if (rootEl) delete rootEl.dataset.landing; }, 320);
  expr.scheduleQuirk();
}

function flyTo(targetX: number, targetY: number, stateName: BirdPerchState): void {
  if (!rootEl) return;
  rootEl.dataset.state = stateName;
  if (!hasPos) { const e = getRandomEdgeEntry(targetX, targetY); applyTransform(e.x, e.y); }
  const dx = targetX - currentX;
  if (Math.hypot(dx, targetY - currentY) < 10) { cancelFlight(); applyTransform(targetX, targetY); return; }

  expr.clearQuirk();
  cancelFlight();
  if (Math.abs(dx) > 4) {
    rootEl.dataset.facing = dx < 0 ? 'left' : 'right';
  }
  rootEl.dataset.flying = 'true';
  flight = createFlightState(currentX, currentY, targetX, targetY, stateName, performance.now(), activeSpecies);
  flightRafId = requestAnimationFrame(stepFlight);
}

const scrollTracker = createBirdScrollTracker({
  isActive: () => active,
  getRootEl: () => rootEl,
  getSpecies: () => activeSpecies,
  isFlying: () => Boolean(flight),
  getFlightStateName: () => flight?.stateName ?? null,
  getPerchedQnum: () => perchedQnumEl,
  setPerchedQnum: (el) => { perchedQnumEl = el; },
  getPerchedBubble: () => perchedBubbleEl,
  setPerchedBubble: (el) => { perchedBubbleEl = el; },
  getWelcomeKind: () => welcomePerchKind,
  setWelcomeKind: (kind) => { welcomePerchKind = kind; },
  getWelcomeSpotRatio: () => welcomeSpotRatio,
  setWelcomeSpotRatio: (r) => { welcomeSpotRatio = r; },
  getBarSpotRatio: () => barSpotRatio,
  rollBarSpotRatio: () => { barSpotRatio = 0.14 + Math.random() * 0.74; },
  getCurrentCoords: () => ({ x: currentX, y: currentY }),
  applyTransform: (x, y) => applyTransform(x, y),
  flyTo: (x, y, state) => flyTo(x, y, state),
  cancelFlight: () => cancelFlight(),
});

function flyInForScreen(screen: ScreenKind): void {
  if (!active || !rootEl || screen === 'profile') return;
  perchedQnumEl = null;
  rollPerchRandoms();
  requestAnimationFrame(() => {
    if (!active || !rootEl || detectBirdScreen() !== screen) return;
    const target = resolveScreenTarget(screen, welcomeSpotRatio, barSpotRatio, activeSpecies);
    perchedQnumEl = target.qnumEl;
    welcomePerchKind = target.welcomeKind ?? null;
    const entry = getRandomEdgeEntry(target.x, target.y);
    cancelFlight();
    applyTransform(entry.x, entry.y);
    flyTo(target.x, target.y, target.stateName);
  });
}

function handleBodyClassChange(): void {
  const next = detectBirdScreen();
  if (next === currentScreen) return;
  currentScreen = next;
  if (!active) return;
  if (next === 'profile') { cancelFlight(); expr.clearQuirk(); expr.hideBubble(); return; }
  flyInForScreen(next);
}

function handleDocumentPointerDown(event: PointerEvent): void {
  if (!active || !rootEl || detectBirdScreen() !== 'questions') return;
  if (useMobileBirdPerch()) return;
  const el = event.target instanceof Element ? event.target : null;
  if (!el || el.closest('.vocab-word, .sound-word, .lesson-concept-word, .vocab-bubble, .lesson-concept-bubble, [data-role="lesson-inline-panel"], [data-action*="lesson"]')) return;
  const qnum = el.closest<HTMLElement>('.booklet-question')?.querySelector<HTMLElement>('[data-role="qnum"]') ?? null;
  if (!qnum || perchedQnumEl === qnum) return;
  perchedQnumEl = qnum;
  const pos = getQnumPerch(qnum, activeSpecies);
  flyTo(pos.x, pos.y, 'question');
}

function handleBirdTap(): void {
  if (!active || !rootEl) return;
  if (activeSpecies === 'bird') spawnChickenFeather(currentX, currentY);
  reactRoboBird('welcome');
}

function ensureMounted(): boolean {
  if (typeof document === 'undefined' || !document.body) return false;
  if (rootEl && rootEl.isConnected) return true;
  const dom = createBirdDom(handleBirdTap, activeSpecies);
  rootEl = dom.root;
  bubbleEl = dom.bubble;

  if (!unbindListeners) {
    unbindListeners = bindBirdListeners({
      onPointerDown: handleDocumentPointerDown,
      onScrollOrResize: scrollTracker.schedulePerchSync,
      onBodyClassChange: handleBodyClassChange,
      onBubbleChange: () => { if (active) requestAnimationFrame(scrollTracker.syncCurrentPerch); },
      onWelcomeMutation: () => { if (active && detectBirdScreen() === 'welcome') scrollTracker.schedulePerchSync(); },
    });
  }
  return true;
}

function clearTimers(): void {
  if (moodTimer) clearTimeout(moodTimer);
  moodTimer = null;
  scrollTracker.reset();
}

export function syncRoboBird(species: BirdMascotId | null, greet = false): void {
  if (!ensureMounted() || !rootEl) return;
  const wasActive = active;
  const speciesChanged = species !== null && species !== activeSpecies;
  active = species !== null;
  rootEl.hidden = !active;
  if (!species) {
    cancelFlight(); expr.clearQuirk(); expr.hideBubble(); clearTimers();
    perchedQnumEl = null; perchedBubbleEl = null; hasPos = false;
    return;
  }
  activeSpecies = species;
  rootEl.dataset.species = species;
  if (speciesChanged) {
    const stage = rootEl.querySelector<HTMLElement>('.mascot-bird-stage');
    if (stage) stage.innerHTML = renderRoboBirdSvg(species);
  }
  currentScreen = detectBirdScreen();
  if (!wasActive || greet) flyInForScreen(currentScreen); else scrollTracker.syncCurrentPerch();
  if (greet && currentScreen !== 'profile') reactRoboBird('welcome');
}

export function reactRoboBird(mood: TalkMood): void {
  if (!active || !rootEl || rootEl.hidden) return;
  if (moodTimer) clearTimeout(moodTimer);
  rootEl.dataset.mood = 'idle';
  void rootEl.offsetWidth;
  rootEl.dataset.mood = mood;
  expr.showBubble(mood);
  moodTimer = setTimeout(() => {
    moodTimer = null;
    if (!rootEl) return;
    rootEl.dataset.mood = 'idle';
    if (mood === 'correct' || mood === 'wrong') scrollTracker.advanceAfterAnswer();
  }, MOOD_MS);
}

export function setRoboBirdPrintHidden(hidden: boolean): void {
  if (!rootEl) return;
  if (hidden) rootEl.dataset.printHidden = 'true'; else delete rootEl.dataset.printHidden;
}

export function resetRoboBirdForTest(): void {
  active = false; hasPos = false; welcomePerchKind = null;
  perchedQnumEl = null; perchedBubbleEl = null;
  cancelFlight(); expr.clearQuirk(); expr.hideBubble(); clearTimers();
  unbindListeners?.(); unbindListeners = null;
  rootEl?.remove(); rootEl = null; bubbleEl = null;
}
