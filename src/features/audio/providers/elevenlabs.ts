import type { SpeechOptions, SpeechProvider } from './types.ts';
import { AudioApiSpeechProvider } from './audio-api.ts';

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
