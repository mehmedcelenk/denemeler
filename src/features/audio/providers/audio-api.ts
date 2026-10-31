import type { SpeechOptions, SpeechProvider } from './types.ts';

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
