import { readString, remove, writeString } from '../../app/storage.ts';
import { StorageKeys } from '../../shared/storage-keys.ts';

const MIN_READ_MS = 3500;
const BAN_MS = 5 * 60 * 1000;
let lastMarkAt = 0;
let displayedLockUntil = 0;
let countdownTimer: ReturnType<typeof setInterval> | null = null;

function clearLockNotice(): void {
  document.getElementById('answerRateWarning')?.remove();
  if (countdownTimer) clearInterval(countdownTimer);
  countdownTimer = null;
  displayedLockUntil = 0;
}

function updateLockNotice(lockUntil: number): void {
  const remainingSeconds = Math.ceil((lockUntil - Date.now()) / 1000);
  if (remainingSeconds <= 0) {
    remove(StorageKeys.ANSWER_LOCK_UNTIL);
    clearLockNotice();
    return;
  }
  let notice = document.getElementById('answerRateWarning');
  if (!notice) {
    notice = document.createElement('div');
    notice.id = 'answerRateWarning';
    notice.className = 'answer-rate-warning';
    document.body.appendChild(notice);
  }
  const minutes = Math.floor(remainingSeconds / 60);
  const seconds = String(remainingSeconds % 60).padStart(2, '0');
  notice.textContent = `Yakalandın. ${minutes}:${seconds} sonra tekrar deneyebilirsin.`;
  notice.classList.add('is-visible');
}

function showLockNotice(lockUntil: number): void {
  if (displayedLockUntil === lockUntil && countdownTimer) return;
  clearLockNotice();
  displayedLockUntil = lockUntil;
  updateLockNotice(lockUntil);
  countdownTimer = setInterval(() => updateLockNotice(lockUntil), 1000);
}

function getLockUntil(): number {
  const value = Number(readString(StorageKeys.ANSWER_LOCK_UNTIL) ?? 0);
  return Number.isFinite(value) ? value : 0;
}

export function canMarkAnswer(qid: number): boolean {
  if (typeof document === 'undefined') return true;
  const now = Date.now();
  const lockUntil = getLockUntil();
  if (lockUntil > now) {
    showLockNotice(lockUntil);
    return false;
  }
  if (lockUntil) remove(StorageKeys.ANSWER_LOCK_UNTIL);
  if (displayedLockUntil) clearLockNotice();

  const card = document.getElementById(`bq_${qid}`);
  const openedAt = Number(card?.dataset.openedAt ?? 0);
  if (now - Math.max(openedAt, lastMarkAt) < MIN_READ_MS) {
    const nextLockUntil = now + BAN_MS;
    writeString(StorageKeys.ANSWER_LOCK_UNTIL, String(nextLockUntil));
    showLockNotice(nextLockUntil);
    return false;
  }
  lastMarkAt = now;
  return true;
}

export function initAnswerRateLimit(): void {
  if (typeof document === 'undefined') return;
  const lockUntil = getLockUntil();
  if (lockUntil > Date.now()) showLockNotice(lockUntil);
  else if (lockUntil) remove(StorageKeys.ANSWER_LOCK_UNTIL);
}
