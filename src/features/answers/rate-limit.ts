import { remove } from '../../app/storage.ts';
import { StorageKeys } from '../../shared/storage-keys.ts';

const DEBOUNCE_MS = 300; // Kazara ardışık çift tıklamaları önleme eşiği
const CROSS_QUESTION_MS = 1200; // Farklı sorular arası seri spam tarama eşiği
let lastInteractionAt = 0;
let lastInteractedQid: number | null = null;

export function canMarkAnswer(qid: number, _sourceEl?: Element | null): boolean {
  if (typeof document === 'undefined') return true;
  const now = Date.now();
  const minGap = (lastInteractedQid !== null && lastInteractedQid !== qid) ? CROSS_QUESTION_MS : DEBOUNCE_MS;

  if (now - lastInteractionAt < minGap) {
    return false;
  }

  lastInteractedQid = qid;
  lastInteractionAt = now;
  return true;
}

export function initAnswerRateLimit(): void {
  if (typeof document === 'undefined') return;
  // Varsa eski kilit uyarısını ve depolama kaydını temizle
  remove(StorageKeys.ANSWER_LOCK_UNTIL);
  document.getElementById('answerRateWarning')?.remove();
}
