import test from 'node:test';
import assert from 'node:assert/strict';
import { buildQuestionSpeechText, SpeechService } from '../src/features/audio/speech-service.ts';
import {
  selectBestTurkishVoice,
  WebSpeechProvider,
  AudioApiSpeechProvider,
  ElevenLabsSpeechProvider,
  type SpeechProvider,
  type SpeechOptions,
} from '../src/features/audio/speech-provider.ts';
import { splitTextForTts, pcmToWav } from '../functions/api/tts.ts';
import {
  setVoiceGender,
  cycleVoiceGender,
  setVoiceEngine,
  cycleVoiceEngine,
  VOICE_ENGINES,
} from '../src/features/audio/voice-gender.ts';
import { state } from '../src/app/state.ts';
import type { Question } from '../src/data/question.ts';

const mockQuestion: Question = {
  id: 101,
  ders: 'TARİH 1',
  yil: '2024',
  donem: 2,
  soru: '<b>Aşağıdakilerden hangisi</b> ilk Türk devletlerinde hükümdarın yetkilerini kısıtlayan meclistir?',
  secenekler: {
    A: 'Kurultay',
    B: 'Divan',
    C: 'Şura',
    D: 'Meclis-i Mebusan',
  },
  dogru_cevap: 'A',
  ana_konu: 'İlk Türk Devletleri',
};

test('buildQuestionSpeechText: soru kökünü HTML temizleyerek şıklarla birlikte akıcı Türkçe metne dönüştürür', () => {
  const speechText = buildQuestionSpeechText(mockQuestion);

  // Ders bilgisi içermeli
  assert.ok(speechText.includes('TARİH 1.'));

  // HTML tagleri (<b> vb.) temizlenmiş olmalı
  assert.ok(!speechText.includes('<b>'));
  assert.ok(speechText.includes('Aşağıdakilerden hangisi ilk Türk devletlerinde hükümdarın yetkilerini kısıtlayan meclistir?'));

  // Şıklar Türkçe formatta (A şıkkı: Kurultay.) eklenmiş olmalı
  assert.ok(speechText.includes('A şıkkı: Kurultay.'));
  assert.ok(speechText.includes('B şıkkı: Divan.'));
  assert.ok(speechText.includes('C şıkkı: Şura.'));
  assert.ok(speechText.includes('D şıkkı: Meclis-i Mebusan.'));
});

test('selectBestTurkishVoice: en doğal/neural Türkçe sesleri standart seslere göre önceliklendirir', () => {
  const mockVoices = [
    { name: 'English United States', lang: 'en-US', default: false } as SpeechSynthesisVoice,
    { name: 'Yelda Standard', lang: 'tr-TR', default: true } as SpeechSynthesisVoice,
    { name: 'Microsoft Ahmet Online (Natural) - Turkish', lang: 'tr-TR', default: false } as SpeechSynthesisVoice,
    { name: 'Google Türkçe', lang: 'tr-TR', default: false } as SpeechSynthesisVoice,
  ];

  const bestVoice = selectBestTurkishVoice(mockVoices);
  assert.ok(bestVoice, 'Bir Türkçe ses seçilmeli');
  // Microsoft Natural / Online sesi en yüksek puanı almalı
  assert.equal(bestVoice.name, 'Microsoft Ahmet Online (Natural) - Turkish');

  // Microsoft Natural yoksa Google Türkçe veya Apple Enhanced seçilmeli
  const voicesWithoutNatural = [
    { name: 'Yelda Standard', lang: 'tr-TR', default: true } as SpeechSynthesisVoice,
    { name: 'Google Türkçe', lang: 'tr-TR', default: false } as SpeechSynthesisVoice,
  ];
  const secondBest = selectBestTurkishVoice(voicesWithoutNatural);
  assert.equal(secondBest?.name, 'Google Türkçe');

  // Türkçe ses yoksa null dönmeli
  const noTrVoices = [
    { name: 'English United States', lang: 'en-US', default: false } as SpeechSynthesisVoice,
  ];
  assert.equal(selectBestTurkishVoice(noTrVoices), null);
});

test('SpeechService: toggle ve soru geçişi yaşam döngüsü', async () => {
  let spokenText = '';
  let stoppedCount = 0;
  let isPlayingState = false;

  const mockProvider: SpeechProvider = {
    id: 'mock-provider',
    name: 'Mock Speech Provider',
    speak: async (text: string, options?: SpeechOptions) => {
      spokenText = text;
      isPlayingState = true;
      if (options?.onStart) options.onStart();
    },
    stop: () => {
      stoppedCount++;
      isPlayingState = false;
    },
    isPlaying: () => isPlayingState,
  };

  const service = new SpeechService(mockProvider);

  // 1. Soruyu başlat
  const started = await service.toggleQuestion(mockQuestion);
  assert.equal(started, true);
  assert.equal(service.getActiveQuestionId(), 101);
  assert.ok(spokenText.includes('TARİH 1'));

  // 2. Aynı soruda tekrar toggle -> durdurmalı
  const stopped = await service.toggleQuestion(mockQuestion);
  assert.equal(stopped, false);
  assert.equal(service.getActiveQuestionId(), null);
  assert.equal(stoppedCount, 1);

  // 3. Başka bir soruya geçiş -> önceki durdurulup yenisi başlamalı
  const otherQuestion: Question = { ...mockQuestion, id: 102, ders: 'FELSEFE 1' };
  await service.toggleQuestion(mockQuestion);
  assert.equal(service.getActiveQuestionId(), 101);

  await service.toggleQuestion(otherQuestion);
  assert.equal(service.getActiveQuestionId(), 102);
  assert.ok(spokenText.includes('FELSEFE 1'));
  assert.ok(stoppedCount >= 2);

  service.stop();
  assert.equal(service.getActiveQuestionId(), null);
});

test('ElevenLabsSpeechProvider, AudioApiSpeechProvider ve WebSpeechProvider kontrat uyumluluğu', () => {
  const webProvider = new WebSpeechProvider();
  assert.equal(webProvider.id, 'web-speech');
  assert.equal(typeof webProvider.speak, 'function');
  assert.equal(typeof webProvider.stop, 'function');

  const audioApiProvider = new AudioApiSpeechProvider('/api/tts');
  assert.equal(audioApiProvider.id, 'audio-api');
  assert.equal(audioApiProvider.isPlaying(), false);
  assert.equal(typeof audioApiProvider.speak, 'function');
  assert.equal(typeof audioApiProvider.stop, 'function');

  const elevenProvider = new ElevenLabsSpeechProvider({ voiceId: 'adam_test' });
  assert.equal(elevenProvider.id, 'elevenlabs');
  assert.equal(elevenProvider.isPlaying(), false);
  assert.equal(typeof elevenProvider.speak, 'function');
  assert.equal(typeof elevenProvider.stop, 'function');
});

test('splitTextForTts: uzun metinleri mantıklı cümle ve kelime sınırlarından böler', () => {
  const shortText = 'Kısa metin.';
  assert.deepEqual(splitTextForTts(shortText, 50), ['Kısa metin.']);

  const longText = 'Bu birinci cümledir. Bu ikinci ve biraz daha uzun bir cümledir. Bu da üçüncü cümledir.';
  const chunks = splitTextForTts(longText, 40);
  assert.ok(chunks.length >= 2, 'Metin birden fazla parçaya bölünmeli');
  for (const chunk of chunks) {
    assert.ok(chunk.length <= 40, `Her parça maksimum sınırdan küçük olmalı: "${chunk}"`);
  }
});

test('cycleVoiceGender: kadın ve erkek sesleri arasında geçiş yapar ve state günceller', () => {
  setVoiceGender('female', false);
  assert.equal(state.ttsVoiceGender, 'female');

  const next1 = cycleVoiceGender();
  assert.equal(next1, 'male');
  assert.equal(state.ttsVoiceGender, 'male');

  const next2 = cycleVoiceGender();
  assert.equal(next2, 'female');
  assert.equal(state.ttsVoiceGender, 'female');
});

test('selectBestTurkishVoice: cinsiyete (female/male) göre uygun sesi önceliklendirir', () => {
  const mockVoices = [
    { name: 'Microsoft Ahmet Online (Natural) - Turkish', lang: 'tr-TR', default: false } as SpeechSynthesisVoice,
    { name: 'Microsoft Yelda Online (Natural) - Turkish', lang: 'tr-TR', default: false } as SpeechSynthesisVoice,
  ];

  const femaleVoice = selectBestTurkishVoice(mockVoices, 'female');
  assert.ok(femaleVoice);
  assert.equal(femaleVoice.name, 'Microsoft Yelda Online (Natural) - Turkish');

  const maleVoice = selectBestTurkishVoice(mockVoices, 'male');
  assert.ok(maleVoice);
  assert.equal(maleVoice.name, 'Microsoft Ahmet Online (Natural) - Turkish');
});

test('cycleVoiceEngine: ses motorları (1 -> 2 -> 3 -> 1) arasında döngüsel geçiş yapar', () => {
  setVoiceEngine(1, false);
  assert.equal(state.ttsVoiceEngine, 1);
  assert.equal(VOICE_ENGINES[1].badge, '1');

  const engine2 = cycleVoiceEngine();
  assert.equal(engine2, 2);
  assert.equal(state.ttsVoiceEngine, 2);

  const engine3 = cycleVoiceEngine();
  assert.equal(engine3, 3);
  assert.equal(state.ttsVoiceEngine, 3);

  const engine1 = cycleVoiceEngine();
  assert.equal(engine1, 1);
  assert.equal(state.ttsVoiceEngine, 1);
});

test('pcmToWav: raw PCM verisini standart 44-baytlık RIFF/WAVE kapsayıcısına dönüştürür', () => {
  const dummyPcm = new Uint8Array([0x01, 0x02, 0x03, 0x04]);
  const wavBuffer = pcmToWav(dummyPcm.buffer, 24000);
  assert.equal(wavBuffer.byteLength, 44 + dummyPcm.byteLength);

  const uint8 = new Uint8Array(wavBuffer);
  // RIFF
  assert.equal(String.fromCharCode(uint8[0], uint8[1], uint8[2], uint8[3]), 'RIFF');
  // WAVE
  assert.equal(String.fromCharCode(uint8[8], uint8[9], uint8[10], uint8[11]), 'WAVE');
  // fmt
  assert.equal(String.fromCharCode(uint8[12], uint8[13], uint8[14], uint8[15]), 'fmt ');
  // data
  assert.equal(String.fromCharCode(uint8[36], uint8[37], uint8[38], uint8[39]), 'data');
});


