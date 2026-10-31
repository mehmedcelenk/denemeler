import { fetchElevenLabsTts, fetchOpenAiTts, fetchGeminiTts } from '../../edge/tts-providers.ts';
export { splitTextForTts, pcmToWav } from '../../edge/tts-providers.ts';

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
