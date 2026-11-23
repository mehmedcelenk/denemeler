import type { BirdMascotId } from '../../shared/mascot-types.ts';
import {
  detectBirdScreen,
  findActiveConceptBubble,
  getBubblePerch,
  getBottomBarPerch,
  getQnumPerch,
  getScrollArrivalEntry,
  getWelcomePerch,
  isQuestionSolved,
  resolveScreenTarget,
  useMobileBirdPerch,
  type BirdPerchState,
  type WelcomePerchKind,
} from './mascot-bird-perch.ts';

export interface BirdScrollHost {
  isActive: () => boolean;
  getRootEl: () => HTMLElement | null;
  getSpecies: () => BirdMascotId;
  isFlying: () => boolean;
  getFlightStateName: () => BirdPerchState | null;
  getPerchedQnum: () => HTMLElement | null;
  setPerchedQnum: (el: HTMLElement | null) => void;
  getPerchedBubble: () => HTMLElement | null;
  setPerchedBubble: (el: HTMLElement | null) => void;
  getWelcomeKind: () => WelcomePerchKind | null;
  setWelcomeKind: (kind: WelcomePerchKind | null) => void;
  getWelcomeSpotRatio: () => number;
  setWelcomeSpotRatio: (r: number) => void;
  getBarSpotRatio: () => number;
  rollBarSpotRatio: () => void;
  getCurrentCoords: () => { x: number; y: number };
  applyTransform: (x: number, y: number) => void;
  flyTo: (x: number, y: number, stateName: BirdPerchState) => void;
  cancelFlight: () => void;
}

export interface BirdScrollTracker {
  syncCurrentPerch: () => void;
  settleScrollPerch: () => void;
  advanceAfterAnswer: () => void;
  schedulePerchSync: () => void;
  reset: () => void;
}

export function createBirdScrollTracker(host: BirdScrollHost): BirdScrollTracker {
  let isOffscreen = false;
  let isScrolling = false;
  let lastScrollY = typeof window !== 'undefined' ? window.scrollY : 0;
  let lastScrollDir: 'down' | 'up' = 'down';
  let scrollSettleTimer: ReturnType<typeof setTimeout> | null = null;
  let syncRafId: number | null = null;

  function clearTimers(): void {
    if (scrollSettleTimer !== null) {
      clearTimeout(scrollSettleTimer);
      scrollSettleTimer = null;
    }
    if (syncRafId !== null) {
      cancelAnimationFrame(syncRafId);
      syncRafId = null;
    }
  }

  function syncCurrentPerch(): void {
    if (!host.isActive() || !host.getRootEl()) return;
    const screen = detectBirdScreen();
    if (screen === 'profile') return;

    if (useMobileBirdPerch()) {
      host.setPerchedQnum(null);
      host.setPerchedBubble(null);
      if (isScrolling) host.cancelFlight();
      if (!host.isFlying()) {
        const pos = getBottomBarPerch(host.getBarSpotRatio(), host.getSpecies());
        const root = host.getRootEl();
        if (root) root.dataset.state = screen === 'welcome' ? 'welcome' : 'bar';
        host.applyTransform(pos.x, pos.y);
      }
      return;
    }

    const bubble = findActiveConceptBubble();
    if (bubble) {
      const bp = getBubblePerch(bubble, host.getWelcomeSpotRatio(), host.getSpecies());
      if (bp.inView) {
        if (host.getPerchedBubble() !== bubble) {
          host.setPerchedBubble(bubble);
          host.setWelcomeSpotRatio(0.16 + Math.random() * 0.68);
          const f = getBubblePerch(bubble, host.getWelcomeSpotRatio(), host.getSpecies());
          host.flyTo(f.x, f.y, 'bubble');
        } else if (!host.isFlying()) {
          host.applyTransform(bp.x, bp.y);
        }
        return;
      }
    }
    const wasOnBubble = host.getPerchedBubble() !== null;
    host.setPerchedBubble(null);

    if (screen === 'welcome') {
      const pos = getWelcomePerch(host.getWelcomeSpotRatio(), host.getBarSpotRatio(), host.getSpecies());
      const root = host.getRootEl();
      if (root) root.dataset.state = 'welcome';
      const prevKind = host.getWelcomeKind();
      if (wasOnBubble || (prevKind !== null && pos.kind !== prevKind)) {
        host.setWelcomeKind(pos.kind);
        host.flyTo(pos.x, pos.y, 'welcome');
      } else if (!host.isFlying()) {
        host.setWelcomeKind(pos.kind);
        host.applyTransform(pos.x, pos.y);
      }
      return;
    }

    const perchedQnum = host.getPerchedQnum();
    if (perchedQnum && perchedQnum.isConnected) {
      const card = perchedQnum.closest<HTMLElement>('.booklet-question');
      const isSolved = card ? isQuestionSolved(card) : false;
      if (!isSolved) {
        const pos = getQnumPerch(perchedQnum, host.getSpecies(), false);
        if (pos.inView) {
          isOffscreen = false;
          if (wasOnBubble) host.flyTo(pos.x, pos.y, 'question');
          else if (!host.isFlying()) host.applyTransform(pos.x, pos.y);
          return;
        }
        if (isScrolling) {
          isOffscreen = true;
          host.applyTransform(pos.x, pos.y);
          return;
        }
      }
    }

    if (isScrolling) return;

    const root = host.getRootEl();
    const prevState = root?.dataset.state;
    const target = resolveScreenTarget('questions', host.getWelcomeSpotRatio(), host.getBarSpotRatio(), host.getSpecies());
    host.setPerchedQnum(target.qnumEl);
    if (target.qnumEl) {
      if (host.getFlightStateName() !== 'question' || host.getPerchedQnum() !== target.qnumEl) {
        host.flyTo(target.x, target.y, 'question');
      }
      return;
    }
    if (host.getFlightStateName() === 'bar') return;
    const coords = host.getCurrentCoords();
    if (prevState !== 'bar' || Math.hypot(target.x - coords.x, target.y - coords.y) > 22) {
      host.rollBarSpotRatio();
      const freshBar = resolveScreenTarget('questions', host.getWelcomeSpotRatio(), host.getBarSpotRatio(), host.getSpecies());
      host.flyTo(freshBar.x, freshBar.y, 'bar');
    } else if (!host.isFlying()) {
      host.applyTransform(target.x, target.y);
    }
  }

  function advanceAfterAnswer(): void {
    if (!host.isActive() || !host.getRootEl() || detectBirdScreen() !== 'questions') return;
    host.setPerchedQnum(null);
    const target = resolveScreenTarget('questions', host.getWelcomeSpotRatio(), host.getBarSpotRatio(), host.getSpecies());
    host.setPerchedQnum(target.qnumEl);
    if (!target.qnumEl) host.rollBarSpotRatio();
    const finalTarget = resolveScreenTarget('questions', host.getWelcomeSpotRatio(), host.getBarSpotRatio(), host.getSpecies());
    host.flyTo(finalTarget.x, finalTarget.y, finalTarget.stateName);
  }

  function settleScrollPerch(): void {
    scrollSettleTimer = null;
    isScrolling = false;
    if (!host.isActive() || !host.getRootEl() || detectBirdScreen() !== 'questions') return;
    if (useMobileBirdPerch()) { syncCurrentPerch(); return; }
    const target = resolveScreenTarget('questions', host.getWelcomeSpotRatio(), host.getBarSpotRatio(), host.getSpecies());
    if (target.stateName === 'bubble') return;

    if (isOffscreen) {
      isOffscreen = false;
      host.cancelFlight();
      const entry = getScrollArrivalEntry(target.x, lastScrollDir);
      host.applyTransform(entry.x, entry.y);
      host.setPerchedQnum(target.qnumEl);
      host.flyTo(target.x, target.y, target.stateName);
      return;
    }

    const currentPerched = host.getPerchedQnum();
    const card = currentPerched?.closest<HTMLElement>('.booklet-question');
    const isSolved = card ? isQuestionSolved(card) : false;
    const root = host.getRootEl();
    if (!isSolved && target.qnumEl === currentPerched && root?.dataset.state === target.stateName) {
      if (currentPerched) {
        const live = getQnumPerch(currentPerched, host.getSpecies(), true);
        if (live.inView) host.applyTransform(live.x, live.y);
      }
      return;
    }
    host.setPerchedQnum(target.qnumEl);
    if (!target.qnumEl) host.rollBarSpotRatio();
    const finalTarget = resolveScreenTarget('questions', host.getWelcomeSpotRatio(), host.getBarSpotRatio(), host.getSpecies());
    host.flyTo(finalTarget.x, finalTarget.y, finalTarget.stateName);
  }

  function schedulePerchSync(): void {
    if (!host.isActive()) return;
    const curY = typeof window !== 'undefined' ? window.scrollY : 0;
    if (Math.abs(curY - lastScrollY) > 2) {
      lastScrollDir = curY > lastScrollY ? 'down' : 'up';
      lastScrollY = curY;
      isScrolling = true;
    }
    if (syncRafId === null) {
      syncRafId = requestAnimationFrame(() => {
        syncRafId = null;
        syncCurrentPerch();
      });
    }
    if (scrollSettleTimer !== null) clearTimeout(scrollSettleTimer);
    scrollSettleTimer = setTimeout(settleScrollPerch, 190);
  }

  function reset(): void {
    isOffscreen = false;
    isScrolling = false;
    clearTimers();
  }

  return {
    syncCurrentPerch,
    settleScrollPerch,
    advanceAfterAnswer,
    schedulePerchSync,
    reset,
  };
}
