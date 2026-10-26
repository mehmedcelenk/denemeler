/**
 * Cloudflare Pages Function & Dev API: /api/tts
 * Metni yüksek kaliteli, gerçekçi MP3 ses akışına dönüştürür.
 * ElevenLabs API anahtarı varsa ElevenLabs kullanır, yoksa yüksek kaliteli yedek motorla çalışır.
 */

export interface TtsEnv {
  ELEVENLABS_API_KEY?: string;
  ELEVENLABS_VOICE_ID?: string;
  ELEVENLABS_VOICE_ID_MALE?: string;
  OPENAI_API_KEY?: string;
  GEMINI_API_KEY?: string;
}

/**
 * Uzun metinleri cümle/kelime sınırlarından bölerek güvenli parçalara ayırır (max ~180 karakter).
 */
export function splitTextForTts(text: string, maxLen = 175): string[] {
  if (!text || text.trim().length === 0) return [];
  const normalized = text.replace(/\s+/g, ' ').trim();
  if (normalized.length <= maxLen) return [normalized];

  const sentences = normalized.split(/(?<=[.?!:])\s+/);
  const chunks: string[] = [];
  let current = '';

  for (const sentence of sentences) {
    if ((current + ' ' + sentence).trim().length <= maxLen) {
      current = (current ? current + ' ' + sentence : sentence).trim();
    } else {
      if (current) chunks.push(current);
      if (sentence.length <= maxLen) {
        current = sentence;
      } else {
        // Cümle tek başına maxLen'den uzunsa virgül veya kelimelerden böl
        const words = sentence.split(' ');
        let wordChunk = '';
        for (const w of words) {
          if ((wordChunk + ' ' + w).trim().length <= maxLen) {
            wordChunk = (wordChunk ? wordChunk + ' ' + w : w).trim();
          } else {
            if (wordChunk) chunks.push(wordChunk);
            wordChunk = w;
          }
        }
        current = wordChunk;
      }
    }
  }

  if (current) chunks.push(current);
  return chunks;
}

/**
 * ElevenLabs API üzerinden konuşma üretir.
 */
async function fetchElevenLabsTts(text: string, apiKey: string, voiceId?: string): Promise<ArrayBuffer> {
  const vId = voiceId || '21m00Tcm4TlvDq8ikWAM'; // Varsayılan doğal ses
  const url = `https://api.elevenlabs.io/v1/text-to-speech/${vId}`;
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'xi-api-key': apiKey,
      'Content-Type': 'application/json',
      'Accept': 'audio/mpeg',
    },
    body: JSON.stringify({
      text,
      model_id: 'eleven_multilingual_v2',
      voice_settings: {
        stability: 0.5,
        similarity_boost: 0.75,
      },
    }),
  });

  if (!res.ok) {
    throw new Error(`ElevenLabs error: ${res.status}`);
  }

  return res.arrayBuffer();
}

/**
 * OpenAI Audio API (tts-1) üzerinden doğal konuşma üretir (Kadın: nova, Erkek: onyx).
 */
async function fetchOpenAiTts(text: string, apiKey: string, gender: string): Promise<ArrayBuffer> {
  const voice = (gender === 'male') ? 'onyx' : 'nova';
  const res = await fetch('https://api.openai.com/v1/audio/speech', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'tts-1',
      input: text,
      voice,
      speed: 1.15,
    }),
  });

  if (!res.ok) {
    throw new Error(`OpenAI TTS error: ${res.status}`);
  }

  return res.arrayBuffer();
}

/**
 * Raw PCM 16-bit 24kHz ses verisini standart 44-baytlık RIFF WAV formatına dönüştürür.
 * Tüm tarayıcıların (<audio> etiketi) sorunsuz çalabilmesi için gereklidir.
 */
export function pcmToWav(pcmBuffer: ArrayBuffer, sampleRate = 24000, numChannels = 1, bitDepth = 16): ArrayBuffer {
  const byteRate = (sampleRate * numChannels * bitDepth) / 8;
  const blockAlign = (numChannels * bitDepth) / 8;
  const dataSize = pcmBuffer.byteLength;
  const buffer = new ArrayBuffer(44 + dataSize);
  const view = new DataView(buffer);

  view.setUint32(0, 0x52494646, false); // "RIFF"
  view.setUint32(4, 36 + dataSize, true); // chunkSize
  view.setUint32(8, 0x57415645, false); // "WAVE"

  view.setUint32(12, 0x666d7420, false); // "fmt "
  view.setUint32(16, 16, true); // subchunk1Size (16 for PCM)
  view.setUint16(20, 1, true); // audioFormat (1 for PCM)
  view.setUint16(22, numChannels, true); // numChannels
  view.setUint32(24, sampleRate, true); // sampleRate
  view.setUint32(28, byteRate, true); // byteRate
  view.setUint16(32, blockAlign, true); // blockAlign
  view.setUint16(34, bitDepth, true); // bitsPerSample

  view.setUint32(36, 0x64617461, false); // "data"
  view.setUint32(40, dataSize, true); // subchunk2Size

  new Uint8Array(buffer, 44).set(new Uint8Array(pcmBuffer));
  return buffer;
}

const GEMINI_MODELS = [
  'gemini-2.5-flash-preview-tts',
  'gemini-3.8-flash-lite-tts',
  'gemini-3.1-flash-tts-preview',
  'gemini-3.8-flash-tts',
];

/**
 * Gemini Flash Audio API üzerinden stüdyo kalitesinde doğal ses üretir.
 * Kotayı korumak için 2.5-flash-preview, 3.8-flash-lite ve 3.1-flash modelleri arasında otomatik geçiş yapar.
 */
async function fetchGeminiTts(
  text: string,
  apiKey: string,
  gender: string,
  profile = 'balanced'
): Promise<{ buffer: ArrayBuffer; mimeType: string }> {
  let voiceName = 'Fenrir';
  if (profile === 'dynamic') {
    voiceName = (gender === 'male') ? 'Charon' : 'Kore';
  } else {
    voiceName = (gender === 'male') ? 'Fenrir' : 'Aoede';
  }

  let lastError: Error | null = null;

  for (const model of GEMINI_MODELS) {
    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(apiKey)}`;
      const payload = {
        contents: [{ parts: [{ text }] }],
        generationConfig: {
          responseModalities: ['AUDIO'],
          speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: { voiceName },
            },
          },
        },
      };

      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        lastError = new Error(`Gemini ${model} HTTP ${res.status}`);
        continue;
      }

      const data = await res.json() as {
        candidates?: Array<{
          content?: {
            parts?: Array<{
              inlineData?: {
                mimeType: string;
                data: string;
              };
            }>;
          };
        }>;
      };

      const part = data.candidates?.[0]?.content?.parts?.find(p => p.inlineData);
      if (!part?.inlineData?.data) {
        lastError = new Error(`Gemini ${model} empty data`);
        continue;
      }

      const binaryString = atob(part.inlineData.data);
      const len = binaryString.length;
      const bytes = new Uint8Array(len);
      for (let i = 0; i < len; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }

      const rawPcm = bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength);
      const isPcm = (part.inlineData.mimeType || '').includes('pcm') || (part.inlineData.mimeType || '').includes('L16');
      const finalBuffer = isPcm ? pcmToWav(rawPcm, 24000) : rawPcm;
      const finalMime = isPcm ? 'audio/wav' : (part.inlineData.mimeType || 'audio/wav');

      return { buffer: finalBuffer, mimeType: finalMime };
    } catch (err) {
      lastError = err instanceof Error ? err : new Error(String(err));
    }
  }

  throw lastError || new Error('Tüm Gemini TTS modelleri kota veya hata verdi');
}

export async function handleTtsRequest(request: Request, env?: TtsEnv): Promise<Response> {
  let text = '';
  let lang = 'tr';
  let gender = 'female';
  let profile = 'balanced';

  if (request.method === 'POST') {
    try {
      const body = await request.json() as { text?: string; lang?: string; gender?: string; profile?: string };
      text = body.text || '';
      lang = body.lang || 'tr';
      gender = body.gender || 'female';
      profile = body.profile || 'balanced';
    } catch {
      return new Response(JSON.stringify({ error: 'Geçersiz JSON' }), { status: 400 });
    }
  } else {
    const url = new URL(request.url);
    text = url.searchParams.get('text') || '';
    lang = url.searchParams.get('lang') || 'tr';
    gender = url.searchParams.get('gender') || 'female';
    profile = url.searchParams.get('profile') || 'balanced';
  }

  if (!text || text.trim().length === 0) {
    return new Response(JSON.stringify({ error: 'Metin parametresi zorunludur' }), { status: 400 });
  }

  try {
    const elevenKey = env?.ELEVENLABS_API_KEY || (typeof process !== 'undefined' ? process.env?.ELEVENLABS_API_KEY : undefined);
    const openAiKey = env?.OPENAI_API_KEY || (typeof process !== 'undefined' ? process.env?.OPENAI_API_KEY : undefined);
    const geminiKey = env?.GEMINI_API_KEY || (typeof process !== 'undefined' ? process.env?.GEMINI_API_KEY : undefined);

    // 1. ElevenLabs API anahtarı varsa doğrudan ElevenLabs'e danış
    if (elevenKey) {
      try {
        const maleVoiceId = env?.ELEVENLABS_VOICE_ID_MALE || (typeof process !== 'undefined' ? process.env?.ELEVENLABS_VOICE_ID_MALE : undefined) || 'VR6AewLTigWG4xSOukaG';
        const femaleVoiceId = env?.ELEVENLABS_VOICE_ID || (typeof process !== 'undefined' ? process.env?.ELEVENLABS_VOICE_ID : undefined) || '21m00Tcm4TlvDq8ikWAM';
        const voiceId = (gender === 'male') ? maleVoiceId : femaleVoiceId;
        const audioBuffer = await fetchElevenLabsTts(text, elevenKey, voiceId);
        return new Response(audioBuffer, {
          status: 200,
          headers: {
            'Content-Type': 'audio/mpeg',
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Access-Control-Allow-Origin': '*',
          },
        });
      } catch (e) {
        console.warn('ElevenLabs hatası, OpenAI veya yedek motora geçiliyor:', e);
      }
    }

    // 2. OpenAI API anahtarı varsa OpenAI tts-1 (nova / onyx) kullan
    if (openAiKey) {
      try {
        const audioBuffer = await fetchOpenAiTts(text, openAiKey, gender);
        return new Response(audioBuffer, {
          status: 200,
          headers: {
            'Content-Type': 'audio/mpeg',
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Access-Control-Allow-Origin': '*',
          },
        });
      } catch (e) {
        console.warn('OpenAI TTS hatası, yedek motora geçiliyor:', e);
      }
    }

    // 3. Gemini API anahtarı varsa Gemini 3.8 Flash TTS (Aoede & Fenrir / Kore & Charon) kullan
    if (geminiKey) {
      try {
        const { buffer, mimeType } = await fetchGeminiTts(text, geminiKey, gender, profile);
        return new Response(buffer, {
          status: 200,
          headers: {
            'Content-Type': mimeType,
            'Cache-Control': 'public, max-age=604800, s-maxage=2592000, immutable',
            'Access-Control-Allow-Origin': '*',
          },
        });
      } catch (e) {
        console.warn('Gemini TTS hatası:', e);
      }
    }

    // Harici API yoksa veya başarısızsa temiz hata dön (asla eski robot sesine düşme)
    return new Response(JSON.stringify({ error: 'Ses motoru yanıt vermedi veya kota aşıldı' }), {
      status: 503,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: 'TTS üretilemedi', detail: String(err) }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}

export async function onRequestGet(context: { request: Request; env: TtsEnv }): Promise<Response> {
  return handleTtsRequest(context.request, context.env);
}

export async function onRequestPost(context: { request: Request; env: TtsEnv }): Promise<Response> {
  return handleTtsRequest(context.request, context.env);
}
