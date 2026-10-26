import test from 'node:test';
import assert from 'node:assert/strict';
import {
  isSupabaseAvailable,
  getSupabaseConfig,
  setSupabaseConfigOverride,
  fetchQuestionsWithFallback,
  fetchLocalSubjectJson,
  fetchAiExplanationFromSupabase,
} from '../src/data/supabase-client.ts';
import type { Question } from '../src/data/question.ts';

const dummyQuestion: Question = {
  id: 99999,
  subject: 'KLM',
  ders: 'KELAM – 1',
  soru: 'Test sorusu metni?',
  secenekler: { A: 'Şık A', B: 'Şık B', C: 'Şık C', D: 'Şık D' },
  dogru_cevap: 'B',
};

test('supabase-client: varsayılan ortamda Supabase pasiftir', () => {
  setSupabaseConfigOverride(null);
  assert.equal(isSupabaseAvailable(), false);
  assert.equal(getSupabaseConfig(), null);
});

test('supabase-client: setSupabaseConfigOverride ile geçici yapılandırma ayarlanır', () => {
  setSupabaseConfigOverride({
    url: 'https://test-project.supabase.co',
    anonKey: 'sample-anon-key-12345',
  });
  assert.equal(isSupabaseAvailable(), true);
  const cfg = getSupabaseConfig();
  assert.equal(cfg?.url, 'https://test-project.supabase.co');
  assert.equal(cfg?.anonKey, 'sample-anon-key-12345');
  setSupabaseConfigOverride(null);
});

test('fetchQuestionsWithFallback: Supabase yapılandırılmamışsa doğrudan yerel JSON yükler', async () => {
  setSupabaseConfigOverride(null);
  const originalFetch = globalThis.fetch;
  try {
    globalThis.fetch = async (url: string | URL | Request) => {
      assert.ok(String(url).includes('data/subjects/KLM.json'));
      return new Response(JSON.stringify([dummyQuestion]), { status: 200 });
    };

    const questions = await fetchQuestionsWithFallback('KLM');
    assert.equal(questions.length, 1);
    assert.equal(questions[0].id, 99999);
    assert.equal(questions[0].ders, 'KELAM – 1');
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test('fetchQuestionsWithFallback: Supabase aktifken başarılı yanıt gelirse Supabase verisini kullanır', async () => {
  setSupabaseConfigOverride({
    url: 'https://mock.supabase.co',
    anonKey: 'mock-key',
  });

  const originalFetch = globalThis.fetch;
  try {
    globalThis.fetch = async (url: string | URL | Request, init?: RequestInit) => {
      const urlStr = String(url);
      if (urlStr.includes('/rest/v1/questions')) {
        const headers = init?.headers as Record<string, string>;
        assert.equal(headers?.apikey, 'mock-key');
        assert.ok(urlStr.includes('subject=eq.KLM'));
        return new Response(JSON.stringify([dummyQuestion]), { status: 200 });
      }
      throw new Error(`Beklenmeyen çağrı: ${urlStr}`);
    };

    const questions = await fetchQuestionsWithFallback('KLM');
    assert.equal(questions.length, 1);
    assert.equal(questions[0].id, 99999);
  } finally {
    setSupabaseConfigOverride(null);
    globalThis.fetch = originalFetch;
  }
});

test('fetchQuestionsWithFallback: Supabase 500 hatası verdiğinde otomatik yerel JSON fallback devreye girer', async () => {
  setSupabaseConfigOverride({
    url: 'https://mock.supabase.co',
    anonKey: 'mock-key',
  });

  const originalFetch = globalThis.fetch;
  let fallbackInvoked = false;

  try {
    globalThis.fetch = async (url: string | URL | Request) => {
      const urlStr = String(url);
      if (urlStr.includes('/rest/v1/questions')) {
        // Supabase sunucu hatası simülasyonu
        return new Response('Database internal error', { status: 500, statusText: 'Internal Error' });
      }
      if (urlStr.includes('data/subjects/KLM.json')) {
        fallbackInvoked = true;
        return new Response(JSON.stringify([dummyQuestion]), { status: 200 });
      }
      throw new Error(`Beklenmeyen çağrı: ${urlStr}`);
    };

    const questions = await fetchQuestionsWithFallback('KLM');
    assert.ok(fallbackInvoked, 'Yerel JSON fallback çağrılmış olmalı');
    assert.equal(questions.length, 1);
    assert.equal(questions[0].id, 99999);
  } finally {
    setSupabaseConfigOverride(null);
    globalThis.fetch = originalFetch;
  }
});

test('fetchAiExplanationFromSupabase: soru kimliği için AI açıklamasını döner veya null döner', async () => {
  setSupabaseConfigOverride({
    url: 'https://mock.supabase.co',
    anonKey: 'mock-key',
  });

  const originalFetch = globalThis.fetch;
  try {
    globalThis.fetch = async (url: string | URL | Request) => {
      const urlStr = String(url);
      if (urlStr.includes('question_id=eq.474')) {
        return new Response(
          JSON.stringify([
            {
              question_id: 474,
              query: 'Açıklar mısın?',
              reply: 'Pedagojik çözüm',
              model: 'deepseek-v4.1-flash',
            },
          ]),
          { status: 200 }
        );
      }
      return new Response('[]', { status: 200 });
    };

    const explanation = await fetchAiExplanationFromSupabase(474);
    assert.ok(explanation);
    assert.equal(explanation.question_id, 474);
    assert.equal(explanation.reply, 'Pedagojik çözüm');

    const notFound = await fetchAiExplanationFromSupabase(999);
    assert.equal(notFound, null);
  } finally {
    setSupabaseConfigOverride(null);
    globalThis.fetch = originalFetch;
  }
});
