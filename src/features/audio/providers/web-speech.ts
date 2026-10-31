import type { SpeechOptions, SpeechProvider } from './types.ts';
import { AudioApiSpeechProvider } from './audio-api.ts';
import { selectBestTurkishVoice } from './turkish-voice.ts';

/**
 * Web Speech API (tarayıcı yerel ses sentezleyici) tabanlı sağlayıcı.
 * Tarayıcıda yerel ses yoksa veya sentez hatası verirse sessizce AudioApiSpeechProvider'a geçer.
 */
export class WebSpeechProvider implements SpeechProvider {
  readonly id = 'web-speech';
  readonly name = 'Tarayıcı Konuşma Motoru';

  private currentUtterance: SpeechSynthesisUtterance | null = null;
  private _isPlaying = false;
  private fallbackProvider = new AudioApiSpeechProvider();

  isPlaying(): boolean {
    return this._isPlaying || this.fallbackProvider.isPlaying();
  }

  private async getAvailableVoices(): Promise<SpeechSynthesisVoice[]> {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return [];
    let voices = window.speechSynthesis.getVoices();
    if (voices && voices.length > 0) return voices;

    return new Promise((resolve) => {
      let resolved = false;
      const done = () => {
        if (resolved) return;
        resolved = true;
        if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
          window.speechSynthesis.removeEventListener('voiceschanged', done);
          resolve(window.speechSynthesis.getVoices() || []);
        } else {
          resolve([]);
        }
      };
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.addEventListener('voiceschanged', done);
      }
      setTimeout(done, 200);
    });
  }

  async speak(text: string, options?: SpeechOptions): Promise<void> {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      return this.fallbackProvider.speak(text, options);
    }

    this.stop();

    const voices = await this.getAvailableVoices();
    const isTurkish = (options?.lang || 'tr').toLowerCase().startsWith('tr');
    const bestVoice = isTurkish ? selectBestTurkishVoice(voices, options?.gender) : null;

    // Tarayıcıda Türkçe ses motoru yoksa (örneğin Linux Chrome'da sadece İngilizce varsa),
    // İngilizce sesin Türkçe okumasına İZİN VERME! Doğrudan Audio API'ye aktar:
    if (isTurkish && !bestVoice) {
      return this.fallbackProvider.speak(text, options);
    }

    return new Promise((resolve, reject) => {
      const utterance = new SpeechSynthesisUtterance(text);
      this.currentUtterance = utterance;

      if (bestVoice) {
        utterance.voice = bestVoice;
        utterance.lang = bestVoice.lang;
      } else {
        utterance.lang = options?.lang || 'tr-TR';
      }

      const isMale = options?.gender === 'male';
      utterance.rate = options?.rate ?? 1.15;
      utterance.pitch = options?.pitch ?? (isMale ? 0.94 : 1.02);
      utterance.volume = options?.volume ?? 1.0;

      utterance.onstart = () => {
        this._isPlaying = true;
        if (options?.onStart) options.onStart();
      };

      utterance.onend = () => {
        this._isPlaying = false;
        this.currentUtterance = null;
        if (options?.onEnd) options.onEnd();
        resolve();
      };

      utterance.onerror = (e) => {
        this._isPlaying = false;
        this.currentUtterance = null;
        // Kullanıcı durdurduysa (interrupted / canceled), fallback çalıştırma
        if (e.error === 'interrupted' || e.error === 'canceled') {
          resolve();
          return;
        }
        this.fallbackProvider.speak(text, options).then(resolve).catch((err) => {
          if (options?.onError) options.onError(err);
          resolve();
        });
      };

      window.speechSynthesis.speak(utterance);
    });
  }

  stop(): void {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    this._isPlaying = false;
    this.currentUtterance = null;
    this.fallbackProvider.stop();
  }

  pause(): void {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.pause();
    }
    this.fallbackProvider.pause();
  }

  resume(): void {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.resume();
    }
    this.fallbackProvider.resume();
  }
}
