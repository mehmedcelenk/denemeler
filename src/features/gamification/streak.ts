import { state, store } from '../../app/state.ts';
import { readString } from '../../app/storage.ts';
import { StorageKeys } from '../../shared/storage-keys.ts';

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
  const display = document.getElementById('streakCountDisplay');
  const pill = document.getElementById('topStreakPill');
  if (display) {
    display.textContent = String(state.waterStreak);
  }
  if (pill && animate) {
    pill.classList.remove('streak-pulse');
    void pill.offsetWidth; // Force reflow
    pill.classList.add('streak-pulse');
  }
}
