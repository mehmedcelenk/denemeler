/**
 * Speech provider arayüzü ve ses sağlayıcı implementasyonları.
 * Web Speech API ve ElevenLabs / Harici AI TTS entegrasyonu için modüler sözleşme.
 */

export interface SpeechOptions {
  rate?: number;
  pitch?: number;
  volume?: number;
  lang?: string;
  gender?: 'female' | 'male';
  profile?: 'balanced' | 'dynamic';
  onStart?: () => void;
  onEnd?: () => void;
  onError?: (error: unknown) => void;
}

export interface SpeechProvider {
  readonly id: string;
  readonly name: string;
  speak(text: string, options?: SpeechOptions): Promise<void>;
  stop(): void;
  pause?(): void;
  resume?(): void;
  isPlaying(): boolean;
}

/**
 * Tarayıcıdaki sesler arasından en doğal Türkçe sesi cinsiyete göre seçer.
 */
export function selectBestTurkishVoice(voices: SpeechSynthesisVoice[], gender?: 'female' | 'male'): SpeechSynthesisVoice | null {
  if (!voices || voices.length === 0) return null;

  const trVoices = voices.filter(v => {
    const lang = (v.lang || '').toLowerCase();
    return lang.startsWith('tr') || lang.includes('tr-tr') || lang.includes('tr_tr');
  });

  if (trVoices.length === 0) return null;

  const scoreVoice = (v: SpeechSynthesisVoice): number => {
    const name = (v.name || '').toLowerCase();
    let score = 10;
    if (name.includes('natural') || name.includes('neural')) score += 50;
    if (name.includes('online')) score += 30;
    if (name.includes('google')) score += 25;
    if (name.includes('premium') || name.includes('enhanced')) score += 20;

    const isM = (t: string) => name.includes(t);
    if (gender === 'male') {
      if (['ahmet', 'tolga', 'cem', 'male', 'erkek'].some(isM)) score += 40;
      if (['emel', 'yelda', 'filiz', 'female', 'kadın'].some(isM)) score -= 30;
    } else if (gender === 'female') {
      if (['emel', 'yelda', 'filiz', 'female', 'kadın'].some(isM)) score += 40;
      if (['ahmet', 'tolga', 'cem', 'male', 'erkek'].some(isM)) score -= 30;
    }

    if (v.default) score += 2;
    return score;
  };

  return trVoices.slice().sort((a, b) => scoreVoice(b) - scoreVoice(a))[0] || trVoices[0];
}

/**
 * Yüksek kaliteli, doğal MP3 ses akışı sağlayıcısı (/api/tts üzerinden).
 * Web Speech API'nin ses motorunun bulunmadığı veya 'synthesis-failed' verdiği ortamlarda
 * (Linux/Flatpak Chrome, sandbox vb.) %100 garantili ve en doğal sesle çalışır.
 * ElevenLabs API anahtarı girildiğinde doğrudan ElevenLabs ses akışını çalar.
 */
export class AudioApiSpeechProvider implements SpeechProvider {
  readonly id = 'audio-api';
  readonly name = 'Doğal Ses Akışı (Neural / ElevenLabs)';

  private static audioCache = new Map<string, Blob>();
  private audio: HTMLAudioElement | null = null;
  private currentObjectUrl: string | null = null;
  private _isPlaying = false;

  constructor(private endpoint?: string) {}

  private resolveEndpoint(): string {
    if (this.endpoint) return this.endpoint;
    if (typeof window !== 'undefined') {
      const port = window.location.port;
      if (port !== '5174' || window.location.protocol === 'file:') return 'http://127.0.0.1:5174/api/tts';
    }
    return './api/tts';
  }

  isPlaying(): boolean { return this._isPlaying; }

  private cleanup(): void {
    if (this.currentObjectUrl && typeof URL !== 'undefined' && URL.revokeObjectURL) {
      try { URL.revokeObjectURL(this.currentObjectUrl); } catch {}
      this.currentObjectUrl = null;
    }
    if (this.audio) {
      try {
        this.audio.pause();
        this.audio.currentTime = 0;
        this.audio.onended = null;
        this.audio.onerror = null;
        this.audio.src = '';
      } catch {}
      this.audio = null;
    }
  }

  speak(text: string, options?: SpeechOptions): Promise<void> {
    return new Promise((resolve, reject) => {
      this.stop();

      const lang = options?.lang || 'tr';
      const gender = options?.gender || 'female';
      const profile = options?.profile || 'balanced';
      const cleanEndpoint = this.resolveEndpoint().replace(/\/+$/, '');
      const url = `${cleanEndpoint}?lang=${encodeURIComponent(lang)}&gender=${encodeURIComponent(gender)}&profile=${encodeURIComponent(profile)}&text=${encodeURIComponent(text)}`;
      const cacheKey = `${lang}:${gender}:${profile}:${text}`;

      const playBlob = (blob: Blob) => {
        const objectUrl = URL.createObjectURL(blob);
        this.currentObjectUrl = objectUrl;
        const audio = new Audio();
        this.audio = audio;
        audio.preload = 'auto';
        audio.playbackRate = options?.rate ?? 1.15;

        audio.onplay = () => {
          this._isPlaying = true;
          if (options?.onStart) options.onStart();
        };

        audio.onended = () => {
          this._isPlaying = false;
          this.cleanup();
          if (options?.onEnd) options.onEnd();
          resolve();
        };

        audio.onerror = (e) => {
          console.error('[Speech] Ses çalma hatası:', audio.error, e);
          this._isPlaying = false;
          this.cleanup();
          if (options?.onError) options.onError(e);
          reject(new Error('Ses akışı oynatılamadı'));
        };

        audio.src = objectUrl;
        const playPromise = audio.play();
        if (playPromise !== undefined) {
          playPromise.catch((err) => {
            this._isPlaying = false;
            this.cleanup();
            if (options?.onError) options.onError(err);
            reject(err);
          });
        }
      };

      const cached = AudioApiSpeechProvider.audioCache.get(cacheKey);
      if (cached) {
        playBlob(cached);
        return;
      }

      fetch(url)
        .then(async (res) => {
          if (!res.ok) throw new Error(`TTS API HTTP ${res.status}`);
          const blob = await res.blob();
          if (AudioApiSpeechProvider.audioCache.size > 80) {
            const firstKey = AudioApiSpeechProvider.audioCache.keys().next().value;
            if (firstKey) AudioApiSpeechProvider.audioCache.delete(firstKey);
          }
          AudioApiSpeechProvider.audioCache.set(cacheKey, blob);
          playBlob(blob);
        })
        .catch((err) => {
          console.error('[Speech] Ses yükleme hatası:', err);
          this._isPlaying = false;
          this.cleanup();
          if (options?.onError) options.onError(err);
          reject(err);
        });
    });
  }

  stop(): void {
    this.cleanup();
    this._isPlaying = false;
  }

  pause(): void {
    if (this.audio) {
      this.audio.pause();
      this._isPlaying = false;
    }
  }

  resume(): void {
    if (this.audio) {
      this.audio.play().catch(() => {});
      this._isPlaying = true;
    }
  }
}

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

/** Gelecekte doğrudan istemciden ElevenLabs bağlantısı için opsiyonel sağlayıcı. */
export class ElevenLabsSpeechProvider implements SpeechProvider {
  readonly id = 'elevenlabs';
  readonly name = 'ElevenLabs AI';
  private fallback = new AudioApiSpeechProvider();

  constructor(private config?: { apiKey?: string; voiceId?: string; modelId?: string; endpoint?: string }) {}

  isPlaying(): boolean { return this.fallback.isPlaying(); }
  speak(text: string, options?: SpeechOptions): Promise<void> { return this.fallback.speak(text, options); }
  stop(): void { this.fallback.stop(); }
}
