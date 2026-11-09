import { remove } from '../../app/storage.ts';
import { StorageKeys } from '../../shared/storage-keys.ts';

const DEBOUNCE_MS = 300; // Kazara ardışık çift tıklamaları önleme eşiği
let lastInteractionAt = 0;

export function canMarkAnswer(_qid: number, _sourceEl?: Element | null): boolean {
  if (typeof document === 'undefined') return true;
  const now = Date.now();

  // 300ms içindeki kazara ardışık çift tıklamaları engelle
  if (now - lastInteractionAt < DEBOUNCE_MS) {
    return false;
  }

  lastInteractionAt = now;
  return true;
}

export function initAnswerRateLimit(): void {
  if (typeof document === 'undefined') return;
  // Varsa eski kilit uyarısını ve depolama kaydını temizle
  remove(StorageKeys.ANSWER_LOCK_UNTIL);
  document.getElementById('answerRateWarning')?.remove();
}
