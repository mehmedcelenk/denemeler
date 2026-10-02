import { state } from '../../app/state.ts';
import { setSubject } from '../subjects/selection.js';

interface SessionSnapshot {
  subject: string;
  questionId?: number;
  timestamp: number;
}

const STORAGE_KEY = 'aol_last_session';

export function saveSessionSnapshot(subject: string, questionId?: number): void {
  if (!subject) return;
  try {
    const snapshot: SessionSnapshot = {
      subject,
      questionId,
      timestamp: Date.now(),
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(snapshot));
  } catch (e) {
    console.error('Oturum kaydedilemedi:', e);
  }
}

export function loadSessionSnapshot(): SessionSnapshot | null {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    if (!data) return null;
    return JSON.parse(data) as SessionSnapshot;
  } catch (e) {
    return null;
  }
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
    await setSubject(snapshot.subject);
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

