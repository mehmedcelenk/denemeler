import type { TalkMood } from '../../shared/mascot-lines.ts';
import type { BirdMascotId } from '../../shared/mascot-types.ts';
import { renderRoboBirdSvg } from '../../shared/mascot-bird-svg.ts';
import { bindBirdListeners, createBird3DHost, createBirdDom, createBirdExpression } from './mascot-bird-dom.ts';
import {
  detectBirdScreen,
  findActiveConceptBubble,
  getBubblePerch,
  getQnumPerch,
  getWelcomePerch,
  resolveScreenTarget,
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
let syncRafId: number | null = null;
let moodTimer: ReturnType<typeof setTimeout> | null = null;
let landTimer: ReturnType<typeof setTimeout> | null = null;
let scrollSettleTimer: ReturnType<typeof setTimeout> | null = null;
let unbindListeners: (() => void) | null = null;
let welcomeSpotRatio = 0.78;
let barSpotRatio = 0.82;
let welcomePerchKind: WelcomePerchKind | null = null;

const bird3d = createBird3DHost();
const expr = createBirdExpression(
  () => rootEl,
  () => bubbleEl,
  () => active && !flight,
  () => activeSpecies,
  (patch) => bird3d.setState(patch),
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
    bird3d?.setState({ flying: true, bankDeg: frame.bankDeg, flightProgress: frame.progress });
    if (activeSpecies === 'bird' && now - lastFeatherAt > 190 && Math.random() < 0.72) { lastFeatherAt = now; spawnChickenFeather(frame.x, frame.y); }
    flightRafId = requestAnimationFrame(stepFlight);
    return;
  }

  applyTransform(flight.endX, flight.endY);
  flight = null;
  delete rootEl.dataset.flying;
  rootEl.dataset.landing = 'true';
  bird3d?.setState({ flying: false, landing: true, bankDeg: 0, flightProgress: 1 });
  landTimer = setTimeout(() => { landTimer = null; if (rootEl) delete rootEl.dataset.landing; bird3d?.setState({ landing: false }); }, 320);
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
    const nextFacing = dx < 0 ? 'left' : 'right';
    rootEl.dataset.facing = nextFacing;
    bird3d?.setState({ facing: nextFacing });
  }
  rootEl.dataset.flying = 'true';
  bird3d?.setState({ flying: true, landing: false });
  flight = createFlightState(currentX, currentY, targetX, targetY, stateName, performance.now(), activeSpecies);
  flightRafId = requestAnimationFrame(stepFlight);
}

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

function syncCurrentPerch(): void {
  if (!active || !rootEl) return;
  const screen = detectBirdScreen();
  if (screen === 'profile') return;

  const bubble = findActiveConceptBubble();
  if (bubble) {
    const bp = getBubblePerch(bubble, welcomeSpotRatio, activeSpecies);
    if (bp.inView) {
      if (perchedBubbleEl !== bubble) { perchedBubbleEl = bubble; welcomeSpotRatio = 0.16 + Math.random() * 0.68; const f = getBubblePerch(bubble, welcomeSpotRatio, activeSpecies); flyTo(f.x, f.y, 'bubble'); }
      else if (!flight) applyTransform(bp.x, bp.y);
      return;
    }
  }
  const wasOnBubble = perchedBubbleEl !== null;
  perchedBubbleEl = null;

  if (screen === 'welcome') {
    const pos = getWelcomePerch(welcomeSpotRatio, barSpotRatio, activeSpecies);
    rootEl.dataset.state = 'welcome';
    if (wasOnBubble || (welcomePerchKind !== null && pos.kind !== welcomePerchKind)) { welcomePerchKind = pos.kind; flyTo(pos.x, pos.y, 'welcome'); }
    else if (!flight) { welcomePerchKind = pos.kind; applyTransform(pos.x, pos.y); }
    return;
  }

  if (perchedQnumEl && perchedQnumEl.isConnected) {
    const pos = getQnumPerch(perchedQnumEl, activeSpecies);
    if (pos.inView) {
      if (wasOnBubble) flyTo(pos.x, pos.y, 'question');
      else if (!flight) applyTransform(pos.x, pos.y);
      return;
    }
  }

  const prevState = rootEl.dataset.state;
  const target = resolveScreenTarget('questions', welcomeSpotRatio, barSpotRatio, activeSpecies);
  perchedQnumEl = target.qnumEl;
  if (target.qnumEl) { if (flight?.stateName !== 'question') flyTo(target.x, target.y, 'question'); return; }
  if (flight?.stateName === 'bar') return;
  if (prevState !== 'bar' || Math.hypot(target.x - currentX, target.y - currentY) > 22) {
    barSpotRatio = 0.14 + Math.random() * 0.74;
    const freshBar = resolveScreenTarget('questions', welcomeSpotRatio, barSpotRatio, activeSpecies);
    flyTo(freshBar.x, freshBar.y, 'bar');
  } else if (!flight) applyTransform(target.x, target.y);
}

function settleScrollPerch(): void {
  scrollSettleTimer = null;
  if (!active || !rootEl || detectBirdScreen() !== 'questions') return;
  const target = resolveScreenTarget('questions', welcomeSpotRatio, barSpotRatio, activeSpecies);
  if (target.stateName === 'bubble') return;
  if (target.qnumEl === perchedQnumEl && rootEl.dataset.state === target.stateName) return;
  perchedQnumEl = target.qnumEl;
  if (!target.qnumEl) barSpotRatio = 0.14 + Math.random() * 0.74;
  const finalTarget = resolveScreenTarget('questions', welcomeSpotRatio, barSpotRatio, activeSpecies);
  flyTo(finalTarget.x, finalTarget.y, finalTarget.stateName);
}

function schedulePerchSync(): void {
  if (!active) return;
  if (syncRafId === null) syncRafId = requestAnimationFrame(() => { syncRafId = null; syncCurrentPerch(); });
  if (scrollSettleTimer !== null) clearTimeout(scrollSettleTimer);
  scrollSettleTimer = setTimeout(settleScrollPerch, 160);
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
  const el = event.target instanceof Element ? event.target : null;
  if (!el || el.closest('.vocab-word, .sound-word, .lesson-concept-word, .vocab-bubble, .lesson-concept-bubble, [data-role="lesson-inline-panel"], [data-action*="lesson"]')) return;
  const qnum = el.closest<HTMLElement>('.booklet-question')?.querySelector<HTMLElement>('[data-role="qnum"]') ?? null;
  if (!qnum || perchedQnumEl === qnum) return;
  perchedQnumEl = qnum;
  const pos = getQnumPerch(qnum, activeSpecies);
  flyTo(pos.x, pos.y, 'question');
}

function ensureMounted(): boolean {
  if (typeof document === 'undefined' || !document.body) return false;
  if (rootEl && rootEl.isConnected) return true;
  const dom = createBirdDom(() => reactRoboBird('welcome'));
  rootEl = dom.root;
  bubbleEl = dom.bubble;

  if (!unbindListeners) {
    unbindListeners = bindBirdListeners({
      onPointerDown: handleDocumentPointerDown,
      onScrollOrResize: schedulePerchSync,
      onBodyClassChange: handleBodyClassChange,
      onBubbleChange: () => { if (active) requestAnimationFrame(syncCurrentPerch); },
      onWelcomeMutation: () => { if (active && detectBirdScreen() === 'welcome') schedulePerchSync(); },
    });
  }
  return true;
}

function clearTimers(): void {
  if (moodTimer !== null) { clearTimeout(moodTimer); moodTimer = null; }
  if (scrollSettleTimer !== null) { clearTimeout(scrollSettleTimer); scrollSettleTimer = null; }
  if (syncRafId !== null) { cancelAnimationFrame(syncRafId); syncRafId = null; }
}

export function syncRoboBird(species: BirdMascotId | null, greet = false): void {
  if (!ensureMounted() || !rootEl) return;
  const wasActive = active;
  const speciesChanged = species !== null && species !== activeSpecies;
  active = species !== null;
  rootEl.hidden = !active;
  if (!species) {
    cancelFlight(); expr.clearQuirk(); expr.hideBubble(); clearTimers();
    bird3d.destroy(rootEl); perchedQnumEl = null; perchedBubbleEl = null; hasPos = false;
    return;
  }
  activeSpecies = species;
  rootEl.dataset.species = species;
  if (speciesChanged && !bird3d.hasActive()) {
    const stage = rootEl.querySelector<HTMLElement>('.mascot-bird-stage');
    if (stage) stage.innerHTML = renderRoboBirdSvg(species);
  }
  bird3d.ensure(rootEl, activeSpecies, () => active, { flying: Boolean(flight), facing: rootEl.dataset.facing === 'left' ? 'left' : 'right' });
  currentScreen = detectBirdScreen();
  if (!wasActive || greet) flyInForScreen(currentScreen); else syncCurrentPerch();
  if (greet && currentScreen !== 'profile') reactRoboBird('welcome');
}

export function reactRoboBird(mood: TalkMood): void {
  if (!active || !rootEl || rootEl.hidden) return;
  if (moodTimer !== null) { clearTimeout(moodTimer); moodTimer = null; }
  rootEl.dataset.mood = 'idle';
  void rootEl.offsetWidth;
  rootEl.dataset.mood = mood;
  bird3d?.setState({ mood });
  expr.showBubble(mood);
  moodTimer = setTimeout(() => {
    moodTimer = null;
    if (!rootEl) return;
    rootEl.dataset.mood = 'idle';
    bird3d?.setState({ mood: 'idle' });
    if (mood === 'correct' || mood === 'wrong') settleScrollPerch();
  }, MOOD_MS);
}

export function setRoboBirdPrintHidden(hidden: boolean): void {
  if (!rootEl) return;
  if (hidden) rootEl.dataset.printHidden = 'true'; else delete rootEl.dataset.printHidden;
}

export function resetRoboBirdForTest(): void {
  active = false; hasPos = false; perchedQnumEl = null; perchedBubbleEl = null;
  cancelFlight(); expr.clearQuirk(); expr.hideBubble(); clearTimers();
  bird3d.destroy(rootEl);
  unbindListeners?.(); unbindListeners = null; welcomePerchKind = null;
  rootEl?.remove(); rootEl = null; bubbleEl = null;
}
