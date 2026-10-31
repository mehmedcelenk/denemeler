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
