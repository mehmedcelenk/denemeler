import type { BirdMascotId } from '../../shared/mascot-types.ts';

export const BIRD_ID = 'mascotBird';
export const BIRD_W = 62;
export const BIRD_H = 62;

export type BirdPerchState = 'welcome' | 'bar' | 'question' | 'bubble';
export type ScreenKind = 'welcome' | 'questions' | 'profile';
export type WelcomePerchKind = 'rematch' | 'title' | 'bar';

export function clamp(v: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, v));
}

export function detectBirdScreen(): ScreenKind {
  if (typeof document === 'undefined') return 'welcome';
  const cls = document.body.classList;
  if (cls.contains('profile-active')) return 'profile';
  if (cls.contains('welcome-active')) return 'welcome';
  return 'questions';
}

/** Besmele öğesinin ekrandaki koruma alanını döndürür; kuş bu alana asla girmez. */
export function getBismillahGuardRect(): DOMRect | null {
  const el = document.querySelector<HTMLElement>('.welcome-bismillah');
  if (!el) return null;
  const r = el.getBoundingClientRect();
  return r.width > 0 && r.height > 0 ? r : null;
}

export function getBottomBarPerch(barRatio = 0.82, _species: BirdMascotId = 'bird'): { x: number; y: number } {
  const vw = window.innerWidth || 420;
  const vh = window.innerHeight || 800;
  const r = document.querySelector<HTMLElement>('.bottom-navigation')?.getBoundingClientRect();
  if (r && r.width > 80 && r.height > 20) {
    const minX = Math.max(10, r.left + 12);
    const maxX = Math.min(vw - BIRD_W - 10, r.right - BIRD_W - 12);
    const x = minX + (maxX - minX) * clamp(barRatio, 0.08, 0.92);
    return { x: Math.round(x), y: Math.round(clamp(r.top - BIRD_H + 10, 12, vh - BIRD_H - 6)) };
  }
  return { x: Math.round(vw - BIRD_W - 22), y: Math.round(vh - BIRD_H - 70) };
}

/** Ana sayfada "Rövanş Meydanına Gir" varsa üstüne, yoksa Besmele'den uzak başlığa konar. */
export function getWelcomePerch(
  spotRatio = 0.78,
  barRatio = 0.82,
  species: BirdMascotId = 'bird',
): { x: number; y: number; inView: boolean; kind: WelcomePerchKind } {
  const vw = window.innerWidth || 420;
  const vh = window.innerHeight || 800;

  const rematchBtn = document.querySelector<HTMLElement>('[data-action="welcome-start-rematch"]');
  if (rematchBtn) {
    const r = rematchBtn.getBoundingClientRect();
    if (r.width > 20 && r.height > 16 && r.bottom > 44 && r.top < vh - 72) {
      const minX = Math.max(10, r.left + 10);
      const maxX = Math.min(vw - BIRD_W - 10, r.right - BIRD_W - 10);
      const x = minX + (maxX - minX) * clamp(spotRatio, 0.1, 0.9);
      const y = clamp(r.top - BIRD_H + 10, 8, vh - BIRD_H - 12);
      return { x: Math.round(x), y: Math.round(y), inView: true, kind: 'rematch' };
    }
  }

  const titleEl = document.querySelector<HTMLElement>('#welcomePortal h1');
  if (titleEl) {
    const r = titleEl.getBoundingClientRect();
    if (r.width > 40 && r.height > 12 && r.bottom > 24 && r.top < vh - 72) {
      const guard = getBismillahGuardRect();
      const y = Math.round(clamp(r.top - BIRD_H + 14, 4, vh - BIRD_H - 12));
      let x = r.left + r.width * clamp(spotRatio, 0.08, 0.92) - BIRD_W / 2;
      if (guard && y + BIRD_H > guard.top - 12 && y < guard.bottom + 14) {
        const leftSafeMax = guard.left - BIRD_W - 14;
        const rightSafeMin = guard.right + 14;
        if (spotRatio < 0.5 && leftSafeMax >= 8) {
          x = clamp(r.left + (leftSafeMax - r.left) * Math.min(1, spotRatio * 2), 8, leftSafeMax);
        } else {
          x = clamp(rightSafeMin + Math.max(0, r.right - BIRD_W - rightSafeMin) * Math.max(0, (spotRatio - 0.5) * 2), rightSafeMin, vw - BIRD_W - 8);
        }
      }
      return { x: Math.round(clamp(x, 8, vw - BIRD_W - 8)), y, inView: true, kind: 'title' };
    }
  }

  return { ...getBottomBarPerch(barRatio, species), inView: false, kind: 'bar' };
}

export function getQnumPerch(qnumEl: HTMLElement, _species: BirdMascotId = 'bird'): { x: number; y: number; inView: boolean } {
  const r = qnumEl.getBoundingClientRect();
  const vw = window.innerWidth || 420;
  const vh = window.innerHeight || 800;
  const numCenterX = r.left + Math.min(r.width, 28) / 2;
  const y = clamp(r.top - BIRD_H + 8, 4, vh - BIRD_H - 12);
  return {
    x: Math.round(clamp(numCenterX - BIRD_W / 2, 4, vw - BIRD_W - 4)),
    y: Math.round(y),
    inView: r.width > 0 && r.height > 0 && r.top >= 52 && r.bottom <= vh - 82,
  };
}

/** Açık kavram balonunu veya ekranda görünür Hoca ders panelini (öncelik: kavram balonu → Hoca paneli) bulur. */
export function findActiveConceptBubble(): HTMLElement | null {
  if (typeof document === 'undefined') return null;
  const bubble = document.querySelector<HTMLElement>('.vocab-bubble, .lesson-concept-bubble');
  if (bubble) {
    const r = bubble.getBoundingClientRect();
    if (r.width > 20 && r.height > 16) return bubble;
  }
  const vh = window.innerHeight || 800;
  const panels = document.querySelectorAll<HTMLElement>('[data-role="lesson-inline-host"]:not([hidden]) [data-role="lesson-inline-panel"]');
  for (const panel of panels) {
    const r = panel.getBoundingClientRect();
    if (r.width > 40 && r.height > 40 && r.top >= 46 && r.top < vh - 90) return panel;
  }
  return null;
}

export function getBubblePerch(
  bubbleEl: HTMLElement,
  spotRatio = 0.78,
  _species: BirdMascotId = 'bird',
): { x: number; y: number; inView: boolean } {
  const r = bubbleEl.getBoundingClientRect();
  const vw = window.innerWidth || 420;
  const vh = window.innerHeight || 800;
  const minX = Math.max(8, r.left + 12);
  const maxX = Math.min(vw - BIRD_W - 8, r.right - BIRD_W - 12);
  const x = maxX > minX ? minX + (maxX - minX) * clamp(spotRatio, 0.12, 0.88) : r.left + r.width / 2 - BIRD_W / 2;
  const y = clamp(r.top - BIRD_H + 12, 4, vh - BIRD_H - 12);
  return {
    x: Math.round(clamp(x, 6, vw - BIRD_W - 6)),
    y: Math.round(y),
    inView: r.width > 20 && r.height > 16 && r.bottom > 44 && r.top < vh - 40,
  };
}

export function findNextQuestionQnum(): HTMLElement | null {
  if (typeof document === 'undefined') return null;
  const board = document.getElementById('boardSpaceOverlay');
  const boardVisible = Boolean(board && board.style.display !== 'none' && board.getBoundingClientRect().height > 0);
  const scope = boardVisible
    ? document.querySelectorAll<HTMLElement>('#boardQuestionStage .booklet-question')
    : document.querySelectorAll<HTMLElement>('#bookletPagesContainer .booklet-question');

  const vh = window.innerHeight || 800;
  const visible = Array.from(scope)
    .map(card => {
      const qnum = card.querySelector<HTMLElement>('[data-role="qnum"]');
      const rect = qnum?.getBoundingClientRect();
      return qnum && rect ? { card, qnum, rect } : null;
    })
    .filter((item): item is { card: HTMLElement; qnum: HTMLElement; rect: DOMRect } =>
      Boolean(item && item.rect.width > 0 && item.rect.height > 0 && item.rect.top >= 52 && item.rect.bottom <= vh - 82),
    )
    .sort((a, b) => a.rect.top - b.rect.top);

  if (!visible.length) return null;
  const nextUnsolved = visible.find(({ card }) => !card.querySelector('.optical-choice-row.marked'));
  return nextUnsolved ? nextUnsolved.qnum : null;
}

export function resolveScreenTarget(
  screen: ScreenKind,
  spotRatio = 0.78,
  barRatio = 0.82,
  species: BirdMascotId = 'bird',
): { x: number; y: number; stateName: BirdPerchState; qnumEl: HTMLElement | null; welcomeKind?: WelcomePerchKind } {
  const bubble = findActiveConceptBubble();
  if (bubble) {
    const bp = getBubblePerch(bubble, spotRatio, species);
    if (bp.inView) return { x: bp.x, y: bp.y, stateName: 'bubble', qnumEl: null };
  }
  if (screen === 'welcome') {
    const w = getWelcomePerch(spotRatio, barRatio, species);
    return { x: w.x, y: w.y, stateName: 'welcome', qnumEl: null, welcomeKind: w.kind };
  }
  const nextQnum = findNextQuestionQnum();
  if (nextQnum) {
    const pos = getQnumPerch(nextQnum, species);
    return { x: pos.x, y: pos.y, stateName: 'question', qnumEl: nextQnum };
  }
  const bar = getBottomBarPerch(barRatio, species);
  return { x: bar.x, y: bar.y, stateName: 'bar', qnumEl: null };
}
