/**
 * Cloudflare Pages Serverless Function — /api/ask-ai
 * Sıfır Cevap Sızıntısı Garantisi (Zero-Knowledge Answer Architecture):
 * Bu uç noktaya dogru_cevap ve dogru_nedeni ASLA gönderilmez.
 */

export const SYSTEM_INSTRUCTION = `Sen İslam medeniyetinin büyük mekanik ve robotik dehası El-Cezerî'nin "Hiyel" (akıl dolu yöntem ve çözüm mekanizması) mirasından ilham alan "Numûne-i Hiyel"sin. Görevin öğrenciyi PASİF değil AKTİF DÜŞÜNME moduna sokmak, zihnindeki problem çözme çarklarını harekete geçirmektir.

🎯 KURAL 1: ASLA TÜM ŞIKLARI TEK TEK İNCELEYİP AÇIKLAMA! Hazır bilgi vermek, şıkları çözmek yasaktır.
🎯 KURAL 2: ÇOK KISA VE NOKTA ATIŞI OL (Maksimum 2-3 cümle veya 2 mini madde). Okuma süresi 15 saniyeyi geçmemeli. Asla uzun paragraflar yazma.
🎯 KURAL 3: SADECE KİLİT KAVRAMI VEYA DİKKAT ODAĞINI VER (🔑). ASLA doğrudan doğru şıkkı söyleme veya şıkları eleme. Öğrencinin kendisinin bulması için soru kökündeki can alıcı noktayı veya bilmesi gereken tek bir kilit kavramı fısılda.
🎯 KURAL 4: BİTİRİRKEN DÜŞÜNDÜRÜCÜ BİR SORU BIRAK (🤔). Öğrenci cevabı kendisi akıl etsin ve çözsün.
🎯 KURAL 5: Yanıta asla selamlama, unvan veya isim ('Numûne-i Hiyel:', 'Merhaba' vb.) ekleme; doğrudan soruya yönelik cevaba başla.`;

export interface AskAiRequestBody {
  readonly stem: string;
  readonly choices: Record<string, string>;
  readonly subject: string;
  readonly topic: string;
  readonly userQuery: string;
  readonly history?: ReadonlyArray<{ readonly query: string; readonly reply: string }>;
}

export interface ValidationResult {
  readonly ok: boolean;
  readonly error?: string;
  readonly data?: AskAiRequestBody;
}

const ALLOWED_ORIGIN_PATTERNS = [
  /^https?:\/\/localhost(:\d+)?$/i,
  /^https?:\/\/127\.0\.0\.1(:\d+)?$/i,
  /ortaklar/i,
  /\.pages\.dev$/i,
];

export function isOriginAllowed(originOrReferer: string | null): boolean {
  if (!originOrReferer) return true;
  return ALLOWED_ORIGIN_PATTERNS.some(pattern => pattern.test(originOrReferer));
}

export function validateAskAiPayload(raw: unknown): ValidationResult {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
    return { ok: false, error: 'Geçersiz istek gövdesi.' };
  }
  const obj = raw as Record<string, unknown>;

  // Sıfır Cevap Sızıntısı: İstemciden yanlışlıkla veya kasıtlı olarak cevap alanı gönderilirse reddet
  if ('dogru_cevap' in obj || 'dogru_nedeni' in obj) {
    return { ok: false, error: 'Güvenlik ihlali: Cevap anahtarı verisi kabul edilmez.' };
  }

  const userQuery = typeof obj.userQuery === 'string' ? obj.userQuery.trim() : '';
  if (userQuery.length < 2 || userQuery.length > 250) {
    return { ok: false, error: 'Sorunuz en az 2, en fazla 250 karakter olmalıdır.' };
  }

  const stem = typeof obj.stem === 'string' ? obj.stem.trim().slice(0, 2000) : '';
  if (!stem) {
    return { ok: false, error: 'Soru metni eksik.' };
  }

  const rawChoices = (obj.choices && typeof obj.choices === 'object' && !Array.isArray(obj.choices))
    ? (obj.choices as Record<string, unknown>)
    : {};
  const choices: Record<string, string> = {};
  for (const key of ['A', 'B', 'C', 'D', 'E']) {
    if (typeof rawChoices[key] === 'string' && rawChoices[key].trim()) {
      choices[key] = rawChoices[key].trim().slice(0, 500);
    }
  }

  const subject = typeof obj.subject === 'string' ? obj.subject.trim().slice(0, 120) : '';
  const topic = typeof obj.topic === 'string' ? obj.topic.trim().slice(0, 160) : '';

  const history: Array<{ query: string; reply: string }> = [];
  if (Array.isArray(obj.history)) {
    for (const item of obj.history.slice(-4)) {
      if (item && typeof item === 'object') {
        const q = typeof item.query === 'string' ? item.query.trim().slice(0, 250) : '';
        const r = typeof item.reply === 'string' ? item.reply.trim().slice(0, 500) : '';
        if (q && r) history.push({ query: q, reply: r });
      }
    }
  }

  return {
    ok: true,
    data: { stem, choices, subject, topic, userQuery, history: history.length > 0 ? history : undefined },
  };
}

export function buildTutorPrompt(data: AskAiRequestBody): string {
  const choicesText = Object.entries(data.choices)
    .map(([letter, text]) => `${letter}) ${text}`)
    .join('\n');

  const historySection = (data.history && data.history.length > 0)
    ? `Önceki İpuçları ve Talebe Soruları:\n${data.history.map(h => `Öğrenci: "${h.query}"\nSen: "${h.reply}"`).join('\n')}`
    : '';

  return [
    `Ders: ${data.subject || 'AÖL Ortak Ders'}`,
    data.topic ? `Konu: ${data.topic}` : '',
    `Soru Metni:\n${data.stem}`,
    choicesText ? `Seçenekler:\n${choicesText}` : '',
    historySection,
    `\nÖğrencinin Yeni Sorusu: "${data.userQuery}"`,
  ].filter(Boolean).join('\n\n');
}

function jsonResponse(payload: Record<string, unknown>, status = 200): Response {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
  });
}

export async function onRequestPost(context: {
  request: Request;
  env?: { GEMINI_API_KEY?: string; EVREN_API_KEY?: string; EVREN_BASE_URL?: string };
}): Promise<Response> {
  const { request, env } = context;

  const origin = request.headers.get('origin') || request.headers.get('referer');
  if (!isOriginAllowed(origin)) {
    return jsonResponse({ error: 'Yetkisiz kaynak (Origin).' }, 403);
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return jsonResponse({ error: 'Geçersiz JSON formatı.' }, 400);
  }

  const validation = validateAskAiPayload(body);
  if (!validation.ok || !validation.data) {
    return jsonResponse({ error: validation.error || 'Doğrulama hatası.' }, 400);
  }

  const { data } = validation;
  const procEnv = typeof process !== 'undefined' ? (process.env as Record<string, string | undefined>) : undefined;
  const evrenKey = env?.EVREN_API_KEY || procEnv?.EVREN_API_KEY;
  const evrenBase = (env?.EVREN_BASE_URL || procEnv?.EVREN_BASE_URL || 'https://evren-llmapi.ssyz.org.tr/v1').replace(/\/+$/, '');
  const apiKey = env?.GEMINI_API_KEY || procEnv?.GEMINI_API_KEY;

  if (!evrenKey && !apiKey) {
    return jsonResponse({
      reply: `⚠️ [API Anahtarı Tanımlanmamış]: Cloudflare Pages Settings > Environment Variables veya .env altına "EVREN_API_KEY" ya da "GEMINI_API_KEY" ekleyiniz.\n\nSorduğunuz "${data.userQuery}" sorusu için şu an şablon yanıt gösterilmektedir.`,
    });
  }

  // 1. Öncelik: EVREN (SSYZ) Egemen LLM Çıkarım Katmanı (15M token/gün ücretsiz kota)
  if (evrenKey) {
    const evrenModels = ['qwen3.8-flash-next', 'deepseek-v4.1-flash', 'auto'];
    for (const evModel of evrenModels) {
      try {
        const evRes = await fetch(`${evrenBase}/chat/completions`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${evrenKey}`,
            'X-API-Key': evrenKey,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: evModel,
            messages: [
              { role: 'system', content: SYSTEM_INSTRUCTION },
              { role: 'user', content: buildTutorPrompt(data) },
            ],
            temperature: 0.3,
            max_tokens: 2048,
            thinking: false,
          }),
        });
        if (evRes.ok) {
          const evJson = (await evRes.json()) as {
            choices?: Array<{ message?: { content?: string } }>;
          };
          const evReply = evJson.choices?.[0]?.message?.content?.trim();
          if (evReply) {
            return jsonResponse({ reply: evReply });
          }
        }
      } catch {
        continue;
      }
    }
  }

  if (!apiKey) {
    return jsonResponse({
      error: 'EVREN servisi yanıt vermedi ve yedek GEMINI_API_KEY tanımlı değil.',
      reply: '⚠️ Yapay zeka servisi şu an yanıt veremedi. Lütfen biraz sonra tekrar deneyiniz.',
    }, 502);
  }

  const candidateModels = ['gemini-3.1-flash-lite', 'gemini-3.5-flash-lite', 'gemini-flash-lite-latest', 'gemini-3.8-flash'];
  let lastErrStatus = 502;
  let lastErrText = '';

  for (const model of candidateModels) {
    try {
      const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(apiKey)}`;
      const upstreamRes = await fetch(geminiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          systemInstruction: {
            parts: [{ text: SYSTEM_INSTRUCTION }],
          },
          contents: [
            {
              role: 'user',
              parts: [{ text: buildTutorPrompt(data) }],
            },
          ],
          generationConfig: {
            temperature: 0.3,
            maxOutputTokens: 600,
          },
        }),
      });

      if (!upstreamRes.ok) {
        lastErrStatus = upstreamRes.status;
        lastErrText = (await upstreamRes.text().catch(() => '')).slice(0, 150);
        if (upstreamRes.status === 429 || upstreamRes.status === 404) {
          continue;
        }
        break;
      }

      const geminiJson = (await upstreamRes.json()) as {
        candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
      };
      const reply = geminiJson.candidates?.[0]?.content?.parts
        ?.map(p => p.text || '')
        .join('')
        .trim();

      if (reply) {
        return jsonResponse({ reply });
      }
    } catch {
      continue;
    }
  }

  if (lastErrStatus === 429 || lastErrStatus === 404 || lastErrStatus === 403) {
    const topicClue = data.topic ? `**${data.topic}**` : `**${data.subject || 'bu ders'}**`;
    return jsonResponse({
      reply: `Bu soru ${topicClue} konusuna aittir. Soru kökündeki anahtar ipuçlarına odaklanıp seçenekleri eleyerek çözmeyi deneyebilirsin!`,
    });
  }

  return jsonResponse({
    error: `Yapay zeka servisi yanıt vermedi (${lastErrStatus}): ${lastErrText}`,
    reply: `⚠️ Servis yanıt veremedi (${lastErrStatus}). API anahtarınızı veya kota durumunu kontrol ediniz.`,
  }, 502);
}

