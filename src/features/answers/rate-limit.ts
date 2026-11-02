import { readString, remove, writeString } from '../../app/storage.ts';
import { StorageKeys } from '../../shared/storage-keys.ts';

const MIN_READ_MS = 1000; // Soru ekrana geldikten sonra minimum insan algı eşiği (1 saniye)
const MIN_QUESTION_GAP_MS = 600; // Farklı sorular arasındaki seri spam eşiği (0.6 saniye)
const BAN_MS = 1 * 60 * 1000; // 1 dakika ceza süresi
let lastInteractedQid: number | null = null;
let lastInteractionAt = 0;
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

function applyPenalty(now: number): void {
  const nextLockUntil = now + BAN_MS;
  writeString(StorageKeys.ANSWER_LOCK_UNTIL, String(nextLockUntil));
  showLockNotice(nextLockUntil);
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

  // 1. Soru kartı ekranda henüz MIN_READ_MS kadar durmadıysa (okumadan çok hızlı tıklama)
  if (openedAt > 0 && now - openedAt < MIN_READ_MS) {
    applyPenalty(now);
    return false;
  }

  // 2. Farklı bir sorudan bu soruya seri spam geçiş kontrolü (insanüstü seri tıklama)
  if (lastInteractedQid !== null && lastInteractedQid !== qid) {
    if (now - lastInteractionAt < MIN_QUESTION_GAP_MS) {
      applyPenalty(now);
      return false;
    }
  }

  // Aynı soru içinde çift tıklama (onaylama), şık değiştirme veya seçim düzeltme serbesttir
  lastInteractedQid = qid;
  lastInteractionAt = now;
  return true;
}

export function initAnswerRateLimit(): void {
  if (typeof document === 'undefined') return;
  const lockUntil = getLockUntil();
  if (lockUntil > Date.now()) showLockNotice(lockUntil);
  else if (lockUntil) remove(StorageKeys.ANSWER_LOCK_UNTIL);
}
