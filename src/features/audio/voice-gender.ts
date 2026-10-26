/**
 * Seslendirici cinsiyeti (Kadın / Erkek) ve ses motoru (1, 2, 3) seçimi ile konsol menüsü butonları yönetimi.
 * Lucide ikonları ile görselleştirilmiştir.
 */

import { state, store } from '../../app/state.ts';
import { StorageKeys } from '../../shared/storage-keys.ts';
import { speechService } from './speech-service.ts';

/** Lucide Venus (Kadın) İkonu */
export const svgVenus = `<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="9" r="6"/><path d="M12 15v7"/><path d="M9 19h6"/></svg>`;

/** Lucide Mars (Erkek) İkonu */
export const svgMars = `<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="10" cy="14" r="6"/><path d="m14.5 9.5 6.5-6.5"/><path d="M15 3h6v6"/></svg>`;

/** Lucide Audio Waveform İkonu (Motor Seçici) */
export const svgWaveform = `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M2 10v3"/><path d="M6 6v11"/><path d="M10 3v18"/><path d="M14 8v7"/><path d="M18 5v13"/><path d="M22 10v3"/></svg>`;

export type VoiceEngineId = 1 | 2 | 3;

export interface VoiceEngineMeta {
  id: VoiceEngineId;
  label: string;
  badge: string;
  desc: string;
  color: string;
}

export const VOICE_ENGINES: Record<VoiceEngineId, VoiceEngineMeta> = {
  1: {
    id: 1,
    label: 'Cihaz Doğal Sesi',
    badge: '1',
    desc: 'Cihazın Doğal Sesi (Ücretsiz & Sınırsız)',
    color: '#10b981',
  },
  2: {
    id: 2,
    label: 'Gemini Dengeli',
    badge: '2',
    desc: 'Gemini AI Dengeli (Kadın: Aoede / Erkek: Fenrir)',
    color: '#8b5cf6',
  },
  3: {
    id: 3,
    label: 'Gemini Alternatif',
    badge: '3',
    desc: 'Gemini AI Dinamik (Kadın: Kore / Erkek: Charon)',
    color: '#f59e0b',
  },
};

/**
 * Seslendirici cinsiyetini belirler ve konsol butonunu günceller.
 */
export function setVoiceGender(gender: 'female' | 'male', persist = true): void {
  const finalGender = (gender === 'male') ? 'male' : 'female';
  store.setTtsVoiceGender(finalGender, persist);

  if (typeof document === 'undefined') return;
  const btn = document.getElementById('btnConsoleVoiceGenderCycle');
  if (btn) {
    if (finalGender === 'female') {
      btn.innerHTML = svgVenus;
      btn.style.color = '#ec4899';
      btn.title = 'Seslendirici: Kadın Sesi (Erkek sesine geçmek için tıkla)';
      btn.setAttribute('aria-label', 'Seslendirici Cinsiyeti: Kadın');
    } else {
      btn.innerHTML = svgMars;
      btn.style.color = '#3b82f6';
      btn.title = 'Seslendirici: Erkek Sesi (Kadın sesine geçmek için tıkla)';
      btn.setAttribute('aria-label', 'Seslendirici Cinsiyeti: Erkek');
    }
  }
}

/**
 * Tıklandıkça kadın ve erkek sesleri arasında geçiş yapar (toggle).
 */
export function cycleVoiceGender(): 'female' | 'male' {
  speechService.stop();
  const current = state.ttsVoiceGender || 'female';
  const next = current === 'female' ? 'male' : 'female';
  setVoiceGender(next, true);
  return next;
}

/**
 * Kayıtlı tercihi localStorage'dan yükler ve butonu ilk durumuna getirir.
 */
export function initVoiceGender(): void {
  let savedGender: 'female' | 'male' = 'female';
  try {
    if (typeof localStorage !== 'undefined') {
      const val = localStorage.getItem(StorageKeys.TTS_GENDER);
      if (val === 'male' || val === 'female') {
        savedGender = val;
      }
    }
  } catch {}
  setVoiceGender(savedGender, false);
}

/**
 * Ses motorunu (1, 2 veya 3) belirler ve konsol butonunu/rozeti günceller.
 */
export function setVoiceEngine(engine: VoiceEngineId, persist = true): void {
  const finalEngine: VoiceEngineId = (engine === 2 || engine === 3) ? engine : 1;
  store.setTtsVoiceEngine(finalEngine, persist);

  if (typeof document === 'undefined') return;
  const meta = VOICE_ENGINES[finalEngine];
  const badge = document.getElementById('consoleVoiceEngineBadge');
  if (badge) {
    badge.textContent = String(finalEngine);
  }
  const btn = document.getElementById('btnConsoleVoiceEngineCycle');
  if (btn) {
    btn.style.color = meta.color;
    btn.title = `Ses Motoru ${finalEngine}: ${meta.desc} (Değiştirmek için tıkla)`;
    btn.setAttribute('aria-label', `Ses Motoru: ${meta.label}`);
  }
}

/**
 * Tıklandıkça ses motorları (1 -> 2 -> 3 -> 1) arasında geçiş yapar.
 */
export function cycleVoiceEngine(): VoiceEngineId {
  speechService.stop();
  const current = (state.ttsVoiceEngine || 1) as VoiceEngineId;
  const next: VoiceEngineId = current === 1 ? 2 : (current === 2 ? 3 : 1);
  setVoiceEngine(next, true);
  return next;
}

/**
 * Kayıtlı motor tercihini localStorage'dan yükler ve butonu ilk durumuna getirir.
 */
export function initVoiceEngine(): void {
  let savedEngine: VoiceEngineId = 1;
  try {
    if (typeof localStorage !== 'undefined') {
      const val = Number(localStorage.getItem(StorageKeys.TTS_ENGINE));
      if (val === 1 || val === 2 || val === 3) {
        savedEngine = val as VoiceEngineId;
      }
    }
  } catch {}
  setVoiceEngine(savedEngine, false);
}
