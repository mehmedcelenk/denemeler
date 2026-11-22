import test from 'node:test';
import assert from 'node:assert/strict';
import {
  isSupabaseAvailable,
  getSupabaseConfig,
  setSupabaseConfigOverride,
  fetchQuestionsWithFallback,
  fetchLocalSubjectJson,
  fetchQuestionLessonFromSupabase,
  normalizePostgrestQuestions,
} from '../src/data/supabase-client.ts';
import type { Question } from '../src/data/question.ts';
import { parseQuestions } from '../src/data/question.ts';
import { parseScopedConcepts } from '../src/data/textbook.ts';

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

test('fetchQuestionLessonFromSupabase: soru kimliği için ön-üretilmiş ders anlatımını döner veya null döner', async () => {
  setSupabaseConfigOverride({
    url: 'https://mock.supabase.co',
    anonKey: 'mock-key',
  });

  const samplePayload = {
    questionId: 474,
    subject: 'MAT',
    title: 'Üslü Sayılar Hızlı Özet',
    explanation: 'Aynı tabanda çarpma yaparken üslü ifade kuralı gereği üsler toplanır; sonuç B şıkkıdır.',
    ezber: {
      rhyme: 'Taban birse durur saf,\nÜsler toplanır, netleşir taraf.',
    },
    concepts: [
      { term: 'Üslü İfade', definition: 'Aynı sayının kendisiyle tekrarlı çarpımının kısa yazılışı.' },
    ],
    model: 'deepseek-v4.1-flash',
    version: 3,
  };

  const originalFetch = globalThis.fetch;
  try {
    globalThis.fetch = async (url: string | URL | Request) => {
      const urlStr = String(url);
      if (urlStr.includes('/rest/v1/question_lessons') && urlStr.includes('question_id=eq.474')) {
        return new Response(JSON.stringify([{ payload: samplePayload }]), { status: 200 });
      }
      if (urlStr.includes('question_id=eq.475')) {
        return new Response(JSON.stringify([{ payload: { broken: true } }]), { status: 200 });
      }
      return new Response('[]', { status: 200 });
    };

    const lesson = await fetchQuestionLessonFromSupabase(474);
    assert.ok(lesson);
    assert.equal(lesson.questionId, 474);
    assert.equal(lesson.title, 'Üslü Sayılar Hızlı Özet');
    assert.equal(lesson.concepts.length, 1);

    const invalid = await fetchQuestionLessonFromSupabase(475);
    assert.equal(invalid, null);

    const notFound = await fetchQuestionLessonFromSupabase(999);
    assert.equal(notFound, null);
  } finally {
    setSupabaseConfigOverride(null);
    globalThis.fetch = originalFetch;
  }
});

test('parseQuestions ve parseScopedConcepts: PostgREST null ve string numeric alanlarını güvenle normalize eder', () => {
  const rawPostgrestQuestions = [
    {
      id: 101,
      subject: 'KLM',
      ders: 'KELAM – 1',
      soru: 'PostgREST test sorusu?',
      secenekler: { A: 'A', B: 'B', C: 'C', D: 'D' },
      dogru_cevap: 'A',
      puan: '0.20',
      sinav_adi: null,
      sinav_kodu: null,
      ipucu: null,
      zorluk: null,
      alt_konu: null,
      soru_xray: null,
      secenekler_xray: null,
      dogru_nedeni: null,
    },
  ];

  const parsed = parseQuestions(normalizePostgrestQuestions(rawPostgrestQuestions));
  assert.equal(parsed.length, 1);
  assert.equal(parsed[0].id, 101);
  assert.equal(parsed[0].puan, 0.2);
  assert.equal(parsed[0].ipucu, undefined);
  assert.equal(parsed[0].alt_konu, undefined);
});
