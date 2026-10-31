import { state, notifyStateChange } from '../../app/state.ts';
import { readJson, writeJson } from '../../app/storage.ts';
import { StorageKeys } from '../../shared/storage-keys.ts';

interface SessionSnapshot {
  subject: string;
  questionId?: number;
  timestamp: number;
}

function isSessionSnapshot(value: unknown): value is SessionSnapshot {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false;
  const snapshot = value as Record<string, unknown>;
  return typeof snapshot.subject === 'string'
    && typeof snapshot.timestamp === 'number'
    && (snapshot.questionId === undefined || typeof snapshot.questionId === 'number');
}

export function saveSessionSnapshot(subject: string, questionId?: number): void {
  if (!subject) return;
  const snapshot: SessionSnapshot = { subject, questionId, timestamp: Date.now() };
  if (!writeJson(StorageKeys.RESUME_STATE, snapshot)) console.error('Oturum kaydedilemedi.');
}

export function loadSessionSnapshot(): SessionSnapshot | null {
  return readJson(StorageKeys.RESUME_STATE, isSessionSnapshot, null);
}

export function initResumeBanner(): void {
  if (typeof document === 'undefined') return;
  const snapshot = loadSessionSnapshot();
  const banner = document.getElementById('resumeSessionBanner');
  if (!banner) return;

  if (snapshot && snapshot.subject) {
    const textEl = document.getElementById('resumeSessionText');
    if (textEl) {
      textEl.textContent = `En son ${snapshot.subject} dersinde çalışıyordun. Kaldığın yerden devam et?`;
    }
    banner.style.display = 'flex';
  } else {
    banner.style.display = 'none';
  }
}

export async function resumeLastSession(): Promise<void> {
  const snapshot = loadSessionSnapshot();
  dismissResumeBanner();
  if (snapshot && snapshot.subject) {
    notifyStateChange('subject:select', { subject: snapshot.subject });
    if (snapshot.questionId && typeof document !== 'undefined') {
      setTimeout(() => {
        const el = document.getElementById(`bq_${snapshot.questionId}`);
        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 300);
    }
  }
}

export function dismissResumeBanner(): void {
  if (typeof document === 'undefined') return;
  const banner = document.getElementById('resumeSessionBanner');
  if (banner) banner.style.display = 'none';
}

