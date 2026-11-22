import {
  BIRD_H,
  BIRD_W,
  clamp,
  findActiveConceptBubble,
  getBismillahGuardRect,
  getBottomBarPerch,
  getBubblePerch,
  getQnumPerch,
  getWelcomePerch,
  type BirdPerchState,
} from './mascot-bird-perch.ts';

import type { BirdMascotId } from '../../shared/mascot-types.ts';
import type { Bird3DController } from './mascot-bird-3d.ts';

export async function loadRoboBird3D(
  stage: HTMLElement,
  species: BirdMascotId,
): Promise<Bird3DController | null> {
  try {
    const { mountRoboBird3D } = await import('./mascot-bird-3d.ts');
    return stage.isConnected ? mountRoboBird3D(stage, species) : null;
  } catch (err) {
    console.warn('[mascot-bird-3d] WebGL yüklenemedi, SVG yedeği kullanılıyor:', err);
    return null;
  }
}

export interface FlightState {
  startX: number;
  startY: number;
  ctrlOffsetX: number;
  arcLift: number;
  endX: number;
  endY: number;
  startTime: number;
  durationMs: number;
  burstAmp: number;
  burstPhase: number;
  wingBeats: number;
  prevX: number;
  prevY: number;
  stateName: BirdPerchState;
  species: BirdMascotId;
}

export interface FlightFrame {
  x: number;
  y: number;
  scale: number;
  bankDeg: number;
  progress: number;
  done: boolean;
}

/** Tavuk uçarken kanatlarından süzülerek düşen minik tüy/kanatçık parçacığı üretir. */
export function spawnChickenFeather(x: number, y: number): void {
  if (typeof document === 'undefined' || !document.body) return;
  const el = document.createElement('span');
  el.className = 'mascot-bird-feather';
  el.setAttribute('aria-hidden', 'true');
  el.style.left = `${Math.round(x + 22 + (Math.random() - 0.5) * 20)}px`;
  el.style.top = `${Math.round(y + 28 + (Math.random() - 0.5) * 10)}px`;
  el.style.setProperty('--fx', `${Math.round((Math.random() - 0.5) * 34)}px`);
  el.style.setProperty('--fr', `${Math.round((Math.random() - 0.5) * 160)}deg`);
  document.body.appendChild(el);
  setTimeout(() => el.remove(), 1150);
}

export function formatBirdTransform(x: number, y: number, scale = 1, rotateDeg = 0): string {
  return scale === 1 && rotateDeg === 0
    ? `translate3d(${Math.round(x)}px, ${Math.round(y)}px, 0)`
    : `translate3d(${x.toFixed(1)}px, ${y.toFixed(1)}px, 0) scale(${scale.toFixed(3)}) rotate(${rotateDeg.toFixed(1)}deg)`;
}

function easeInOutCubic(t: number): number {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

export function getRandomEdgeEntry(targetX: number, targetY: number): { x: number; y: number } {
  const vw = window.innerWidth || 420;
  const vh = window.innerHeight || 800;
  const edge = Math.floor(Math.random() * 4);
  const jitter = (span: number) => (Math.random() - 0.5) * span;

  if (edge === 0) return { x: -BIRD_W - 28, y: clamp(targetY + jitter(240), 70, vh - BIRD_H - 40) };
  if (edge === 1) return { x: vw + 28, y: clamp(targetY + jitter(240), 70, vh - BIRD_H - 40) };
  if (edge === 2) {
    const guard = getBismillahGuardRect();
    let x = clamp(targetX + jitter(300), 20, vw - BIRD_W - 20);
    if (guard && x + BIRD_W > guard.left - 16 && x < guard.right + 16) {
      x = Math.random() < 0.5 ? Math.max(12, guard.left - BIRD_W - 24) : Math.min(vw - BIRD_W - 12, guard.right + 24);
    }
    return { x, y: -BIRD_H - 28 };
  }
  return { x: clamp(targetX + jitter(300), 20, vw - BIRD_W - 20), y: vh + 28 };
}

export function createFlightState(
  startX: number,
  startY: number,
  endX: number,
  endY: number,
  stateName: BirdPerchState,
  now: number,
  species: BirdMascotId = 'bird',
): FlightState {
  const dx = endX - startX;
  const dy = endY - startY;
  const dist = Math.hypot(dx, dy);
  const isRaven = species === 'raven';
  const isChicken = species === 'bird';
  const speedMul = isRaven ? 1.32 : isChicken ? 1.08 : 1;
  const hasBurst = Math.random() < (isChicken ? 0.9 : 0.72);
  return {
    startX,
    startY,
    ctrlOffsetX: clamp(-dx * (0.1 + Math.random() * 0.14) + (Math.random() - 0.5) * (isChicken ? 120 : 85), -115, 115),
    arcLift: clamp(dist * (isRaven ? 0.36 : 0.26 + Math.random() * 0.16), 55, 190),
    endX,
    endY,
    startTime: now,
    durationMs: clamp(Math.round((740 + dist * (0.5 + Math.random() * 0.16) + Math.random() * 140) * speedMul), 820, 1850),
    burstAmp: hasBurst ? (isChicken ? 0.09 : 0.05) + Math.random() * 0.06 : 0,
    burstPhase: 0.22 + Math.random() * 0.56,
    wingBeats: isChicken ? 10 : isRaven ? 3 : 5,
    prevX: startX,
    prevY: startY,
    stateName,
    species,
  };
}

export function updateFlightTarget(
  flight: FlightState,
  perchedQnumEl: HTMLElement | null,
  spotRatio: number,
  barRatio: number,
): void {
  if (flight.stateName === 'bubble') {
    const b = findActiveConceptBubble();
    if (b) { const bp = getBubblePerch(b, spotRatio, flight.species); flight.endX = bp.x; flight.endY = bp.y; return; }
  }
  if (flight.stateName === 'question' && perchedQnumEl?.isConnected) {
    const live = getQnumPerch(perchedQnumEl, flight.species);
    flight.endX = live.x;
    flight.endY = live.y;
  } else if (flight.stateName === 'welcome') {
    const w = getWelcomePerch(spotRatio, barRatio, flight.species);
    flight.endX = w.x;
    flight.endY = w.y;
  } else {
    const bar = getBottomBarPerch(barRatio, flight.species);
    flight.endX = bar.x;
    flight.endY = bar.y;
  }
}

export function evaluateFlightFrame(flight: FlightState, now: number): FlightFrame {
  const rawT = clamp((now - flight.startTime) / flight.durationMs, 0, 1);

  const baseT = easeInOutCubic(rawT);
  const burstWindow = Math.exp(-Math.pow((rawT - flight.burstPhase) / 0.18, 2));
  const t = clamp(baseT + flight.burstAmp * burstWindow * Math.sin(Math.PI * rawT), 0, 1);
  const inv = 1 - t;

  const ctrlX = (flight.startX + flight.endX) / 2 + flight.ctrlOffsetX;
  let ctrlY = Math.max(8, Math.min(flight.startY, flight.endY) - flight.arcLift);
  const guard = getBismillahGuardRect();
  if (guard && ctrlX + BIRD_W > guard.left - 18 && ctrlX < guard.right + 18 && ctrlY < guard.bottom + 16) {
    ctrlY = guard.bottom + 26;
  }

  const liftCurve = Math.sin(Math.PI * rawT);
  const bobAmp = flight.species === 'bird' ? 10.5 : flight.species === 'raven' ? 3.5 : 5.5;
  const flapBob = -Math.abs(Math.sin(rawT * flight.wingBeats * Math.PI)) * bobAmp * liftCurve;
  const goofyX = flight.species === 'bird' ? Math.sin(rawT * 18) * 7 * liftCurve : 0;
  const x = inv * inv * flight.startX + 2 * inv * t * ctrlX + t * t * flight.endX + goofyX;
  const y = inv * inv * flight.startY + 2 * inv * t * ctrlY + t * t * flight.endY + flapBob;

  const vx = x - flight.prevX;
  const vy = y - flight.prevY;
  flight.prevX = x;
  flight.prevY = y;

  const dir = flight.endX < flight.startX ? -1 : 1;
  const velocityPitch = Math.atan2(vy, Math.max(2, Math.abs(vx))) * (180 / Math.PI);
  const bankDeg = clamp(dir * velocityPitch * 0.45 + dir * burstWindow * 8, -22, 22);
  const scale = 1 + liftCurve * 0.22 + burstWindow * 0.06;

  return { x, y, scale, bankDeg, progress: rawT, done: rawT >= 1 };
}
