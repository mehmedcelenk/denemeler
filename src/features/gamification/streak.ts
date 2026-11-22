import { state, store } from '../../app/state.ts';
import { readString } from '../../app/storage.ts';
import { StorageKeys } from '../../shared/storage-keys.ts';
import { formatStars, getSkyRank, renderWhiteStarSvg } from '../../shared/sky-rank.ts';

export function loadStreak(): number {
  const raw = readString(StorageKeys.WATER_STREAK);
  const count = raw ? parseInt(raw, 10) || 0 : 0;
  store.setWaterStreak(count, false);
  updateStreakUI();
  return count;
}

export function saveStreak(): void {
  store.setWaterStreak(state.waterStreak, true);
}

export function addStreakPoints(points: number): void {
  store.addWaterStreak(points, true);
  updateStreakUI(true);
}

export function resetOrDeductStreak(deduct = 1): void {
  store.deductWaterStreak(deduct, true);
  updateStreakUI(false);
}

export function updateStreakUI(animate = false): void {
  if (typeof document === 'undefined') return;
  const rank = getSkyRank(state.waterStreak);
  const display = document.getElementById('streakCountDisplay');
  const icon = document.getElementById('streakIconDisplay');
  const pill = document.getElementById('topStreakPill');

  if (display) {
    display.textContent = formatStars(rank.stars);
  }
  if (icon) {
    icon.innerHTML = renderWhiteStarSvg(14);
  }
  if (pill) {
    pill.dataset.skyLayer = String(rank.layer);
    pill.classList.toggle('has-streak', rank.stars > 0);
    pill.title = rank.isMax
      ? `${rank.label} • ${formatStars(rank.stars)} yıldız (Zirve)`
      : `${rank.label} • ${formatStars(rank.stars)} yıldız (${rank.nextLabel} için ${formatStars(rank.remainingToNext)} kaldı)`;
    pill.setAttribute('aria-label', pill.title);
    if (animate) {
      pill.classList.remove('streak-pulse');
      void pill.offsetWidth;
      pill.classList.add('streak-pulse');
    }
  }
}
