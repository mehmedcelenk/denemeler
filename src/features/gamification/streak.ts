import { state } from '../../app/state.ts';

const STREAK_KEY = 'aol_water_streak';
const LAST_DATE_KEY = 'aol_last_streak_date';

export function loadStreak(): number {
  try {
    const raw = localStorage.getItem(STREAK_KEY);
    const count = raw ? parseInt(raw, 10) || 0 : 0;
    state.waterStreak = count;
    updateStreakUI();
    return count;
  } catch {
    state.waterStreak = 0;
    return 0;
  }
}

export function saveStreak(): void {
  try {
    localStorage.setItem(STREAK_KEY, String(state.waterStreak));
    const today = new Date().toISOString().split('T')[0];
    localStorage.setItem(LAST_DATE_KEY, today);
  } catch {}
}

export function addStreakPoints(points: number): void {
  state.waterStreak += points;
  saveStreak();
  updateStreakUI(true);
}

export function resetOrDeductStreak(deduct = 1): void {
  state.waterStreak = Math.max(0, state.waterStreak - deduct);
  saveStreak();
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
