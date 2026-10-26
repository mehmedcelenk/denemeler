/**
 * Soru seslendirme servisi ve metin dönüştürücü.
 * Aktif konuşma durumunu yönetir ve sağlayıcılar (Audio API / ElevenLabs / Web Speech) ile UI arasında köprü kurar.
 */

import type { Question, Choice } from '../../data/question.ts';
import { SpeechProvider, AudioApiSpeechProvider, WebSpeechProvider } from './speech-provider.ts';
import { state } from '../../app/state.ts';

/**
 * Bir soru nesnesini doğal akışlı, seslendirmeye hazır Türkçe metne dönüştürür.
 * HTML etiketlerini ve özel karakterleri temizler.
 */
export function buildQuestionSpeechText(q: Question): string {
  if (!q) return '';

  const clean = (text?: string): string => {
    if (!text) return '';
    return text
      .replace(/<[^>]*>/g, ' ')
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/\s+/g, ' ')
      .trim();
  };

  const parts: string[] = [];

  // Ders bilgisi
  if (q.ders) {
    const dersName = clean(q.ders);
    if (dersName) parts.push(`${dersName}.`);
  }

  // Soru kökü
  const stem = clean(q.soru);
  if (stem) {
    const hasPunctuation = /[.?!:]$/.test(stem);
    parts.push(hasPunctuation ? stem : `${stem}.`);
  }

  // Şıklar (A, B, C, D veya E)
  const choices: Choice[] = (q.secenekler && q.secenekler['E'])
    ? ['A', 'B', 'C', 'D', 'E']
    : ['A', 'B', 'C', 'D'];

  choices.forEach(letter => {
    if (q.secenekler && q.secenekler[letter]) {
      const optText = clean(q.secenekler[letter]);
      if (optText) {
        parts.push(`${letter} şıkkı: ${optText}.`);
      }
    }
  });

  return parts.join('\n');
}

/**
 * Tekil ses yönetim servisi.
 */
export class SpeechService {
  private provider: SpeechProvider;
  private fallbackProvider: SpeechProvider;
  private activeQId: number | null = null;

  constructor(defaultProvider?: SpeechProvider, fallbackProvider?: SpeechProvider) {
    // Stüdyo Kalitesinde Doğal Ses Motoru (Gemini Flash TTS / ElevenLabs / OpenAI) birinci öncelik;
    // yedek olarak tarayıcı Web Speech kullanılır
    this.provider = defaultProvider || new AudioApiSpeechProvider();
    this.fallbackProvider = fallbackProvider || (defaultProvider || new WebSpeechProvider());
  }

  /**
   * Özel bir sağlayıcıya geçiş için kullanılır.
   */
  setProvider(provider: SpeechProvider): void {
    this.stop();
    this.provider = provider;
  }

  getProvider(): SpeechProvider {
    return this.provider;
  }

  getActiveQuestionId(): number | null {
    return this.activeQId;
  }

  isPlayingQuestion(qId: number): boolean {
    return this.activeQId === qId && (this.provider.isPlaying() || this.fallbackProvider.isPlaying());
  }

  /**
   * Soru seslendirmesini başlatır veya devam eden aynı soruyu durdurur (toggle).
   */
  async toggleQuestion(q: Question): Promise<boolean> {
    if (!q || typeof q.id !== 'number') return false;

    // Halihazırda bu soru çalıyorsa durdur
    if (this.activeQId === q.id) {
      this.stop();
      return false;
    }

    // Başka bir soru çalıyorsa önce onu durdur
    if (this.activeQId !== null) {
      this.stop();
    }

    const text = buildQuestionSpeechText(q);
    if (!text) return false;

    const dersUpper = (q.ders || '').toUpperCase();
    const isEnglish = dersUpper.includes('İNGİLİZCE') || dersUpper.includes('INGILIZCE');
    const lang = isEnglish ? 'en' : 'tr';

    this.activeQId = q.id;
    this.updateButtonUI(q.id, 'loading');

    const onStart = () => {
      if (this.activeQId === q.id) this.updateButtonUI(q.id, 'speaking');
    };
    const onEnd = () => {
      if (this.activeQId === q.id) {
        this.activeQId = null;
        this.updateButtonUI(q.id, 'idle');
      }
    };
    const onError = () => {
      if (this.activeQId === q.id) {
        this.activeQId = null;
        this.updateButtonUI(q.id, 'idle');
      }
    };

    const gender = state.ttsVoiceGender || 'female';
    const engine = state.ttsVoiceEngine || 1;
    const profile: 'balanced' | 'dynamic' = engine === 3 ? 'dynamic' : 'balanced';

    if (engine === 1) {
      // Motor 1: Cihazın Kendi Doğal Sesi (Web Speech API) öncelikli
      try {
        await this.fallbackProvider.speak(text, { lang, gender, profile, onStart, onEnd, onError });
        return true;
      } catch {
        try {
          await this.provider.speak(text, { lang, gender, profile, onStart, onEnd, onError });
          return true;
        } catch {
          this.activeQId = null;
          this.updateButtonUI(q.id, 'idle');
          return false;
        }
      }
    } else {
      // Motor 2 (Gemini Dengeli) veya Motor 3 (Gemini Dinamik)
      try {
        await this.provider.speak(text, { lang, gender, profile, onStart, onEnd, onError });
        return true;
      } catch {
        try {
          await this.fallbackProvider.speak(text, { lang, gender, profile, onStart, onEnd, onError });
          return true;
        } catch {
          this.activeQId = null;
          this.updateButtonUI(q.id, 'idle');
          return false;
        }
      }
    }
  }

  /**
   * Tüm seslendirmeyi durdurur.
   */
  stop(): void {
    const prevQId = this.activeQId;
    this.activeQId = null;
    this.provider.stop();
    if (this.fallbackProvider !== this.provider) {
      this.fallbackProvider.stop();
    }
    if (prevQId !== null) {
      this.updateButtonUI(prevQId, 'idle');
    }
  }

  private updateButtonUI(qId: number, status: 'idle' | 'loading' | 'speaking'): void {
    if (typeof document === 'undefined') return;
    const btn = document.getElementById(`btnSpeech_${qId}`);
    if (btn) {
      btn.classList.remove('is-loading', 'is-speaking');
      if (status === 'loading') {
        btn.classList.add('is-loading');
        btn.setAttribute('title', 'Ses hazırlanıyor...');
      } else if (status === 'speaking') {
        btn.classList.add('is-speaking');
        btn.setAttribute('title', 'Seslendirmeyi Durdur');
      } else {
        btn.setAttribute('title', 'Sesli Dinle');
      }
    }
  }
}

export const speechService = new SpeechService();
