interface WakeLockSentinelLike {
  release: () => Promise<void>;
  addEventListener: (name: string, fn: () => void) => void;
}

interface NavigatorWithWakeLock {
  wakeLock?: {
    request: (type: string) => Promise<WakeLockSentinelLike>;
  };
}

let wakeLockSentinel: WakeLockSentinelLike | null = null;
let isRequested = false;

export async function requestScreenWakeLock(): Promise<void> {
  isRequested = true;
  if (typeof navigator === 'undefined') return;

  const nav = navigator as unknown as NavigatorWithWakeLock;
  if (!nav.wakeLock || typeof nav.wakeLock.request !== 'function') return;

  try {
    wakeLockSentinel = await nav.wakeLock.request('screen');
    wakeLockSentinel.addEventListener('release', () => {
      wakeLockSentinel = null;
    });
  } catch {}
}

export async function releaseScreenWakeLock(): Promise<void> {
  isRequested = false;
  if (wakeLockSentinel) {
    try {
      await wakeLockSentinel.release();
    } catch {}
    wakeLockSentinel = null;
  }
}

export function handleVisibilityChangeForWakeLock(): void {
  if (typeof document === 'undefined') return;
  if (isRequested && document.visibilityState === 'visible' && !wakeLockSentinel) {
    requestScreenWakeLock().catch(() => {});
  }
}

