import test from 'node:test';
import assert from 'node:assert/strict';
import { store, state } from '../src/app/state.ts';
import { StorageKeys } from '../src/shared/storage-keys.ts';
import { renderCardHeader, renderCardBanners } from '../src/features/booklet/question-card.ts';
import {
  buildZeroKnowledgePayload,
  loadSavedAiExplanations,
} from '../src/features/ai-tutor/ai-tutor.ts';
import {
  validateAskAiPayload,
  SYSTEM_INSTRUCTION,
  onRequestPost,
} from '../functions/api/ask-ai.ts';
import type { Question } from '../src/data/question.ts';

const sampleQuestion: Question = {
  id: 88801,
  ders: 'TÜRK DİLİ VE EDEBİYATI 1',
  yil: '2024',
  donem: 1,
  soru_no: 1,
  soru: 'Aşağıdakilerden hangisi Tanzimat Dönemi edebiyatının özelliklerinden biridir?',
  secenekler: {
    A: 'Divan edebiyatı nazım biçimlerinin tamamen terk edilmesi',
    B: 'Roman, hikâye ve tiyatro gibi Batılı türlerin ilk örneklerinin verilmesi',
    C: 'Sadece bireysel konuların işlenmesi',
    D: 'Aruz ölçüsünün tamamen bırakılıp yalnızca hece ölçüsü kullanılması',
  },
  dogru_cevap: 'B',
  dogru_nedeni: 'Tanzimat edebiyatında Batılı anlamda ilk roman, hikâye ve tiyatro örnekleri verilmiştir.',
  ana_konu: 'Tanzimat Edebiyatı',
  alt_konu: 'Tanzimat Dönemi Özellikleri',
};

test('store.setAiExplanation: state.aiExplanations ve localStorage güncellenir', () => {
  const storageMap = new Map<string, string>();
  const prevStorage = globalThis.localStorage;
  Object.defineProperty(globalThis, 'localStorage', {
    value: {
      getItem: (k: string) => storageMap.get(k) ?? null,
      setItem: (k: string, v: string) => { storageMap.set(k, v); },
      removeItem: (k: string) => { storageMap.delete(k); },
    },
    configurable: true,
  });

  try {
    store.setAiExplanations({}, false);
    const entry = {
      query: 'Tanzimat ne demek?',
      reply: 'Tanzimat, Osmanlı Devleti\'nde 1839 yılında başlayan Batılılaşma ve yenileşme dönemidir.',
      updatedAt: 1700000000000,
    };

    store.setAiExplanation(sampleQuestion.id, entry, true);
    assert.deepEqual(state.aiExplanations[sampleQuestion.id], entry);

    const savedRaw = storageMap.get(StorageKeys.AI_EXPLANATIONS);
    assert.ok(savedRaw, 'localStorage üzerinde aol_ai_explanations kaydedilmeli');
    const parsed = JSON.parse(savedRaw);
    assert.deepEqual(parsed[String(sampleQuestion.id)], entry);
  } finally {
    Object.defineProperty(globalThis, 'localStorage', {
      value: prevStorage,
      configurable: true,
    });
  }
});

test('loadSavedAiExplanations: bozuk JSON veya geçersiz kayıtları güvenle filtreler ve geçerlileri yükler', () => {
  const storageMap = new Map<string, string>();
  const prevStorage = globalThis.localStorage;
  Object.defineProperty(globalThis, 'localStorage', {
    value: {
      getItem: (k: string) => storageMap.get(k) ?? null,
      setItem: (k: string, v: string) => { storageMap.set(k, v); },
      removeItem: (k: string) => { storageMap.delete(k); },
    },
    configurable: true,
  });

  try {
    store.setAiExplanations({}, false);

    // 1. Bozuk JSON durumunda çökmez
    storageMap.set(StorageKeys.AI_EXPLANATIONS, '{bozuk_json');
    loadSavedAiExplanations();
    assert.deepEqual(state.aiExplanations, {});

    // 2. Karışık (geçerli + geçersiz) kayıtları filtreler
    storageMap.set(
      StorageKeys.AI_EXPLANATIONS,
      JSON.stringify({
        '88801': { query: 'Batılı türler nelerdir?', reply: 'Roman, hikâye, tiyatro ve makaledir.', updatedAt: 12345 },
        '-5': { query: 'Geçersiz ID', reply: 'Reddedilmeli', updatedAt: 12345 },
        '88802': { query: '', reply: 'Boş soru reddedilmeli', updatedAt: 12345 },
      })
    );
    loadSavedAiExplanations();
    assert.ok(state.aiExplanations[88801]);
    assert.equal(state.aiExplanations[88801].query, 'Batılı türler nelerdir?');
    assert.equal(state.aiExplanations[-5], undefined);
    assert.equal(state.aiExplanations[88802], undefined);
  } finally {
    Object.defineProperty(globalThis, 'localStorage', {
      value: prevStorage,
      configurable: true,
    });
  }
});

test('Zero-Knowledge Answer Architecture: buildZeroKnowledgePayload ve validateAskAiPayload dogru_cevap sızdırmaz', () => {
  const payload = buildZeroKnowledgePayload(sampleQuestion, 'Bu soruda neye dikkat etmeliyim?', 'TDE');
  const rawKeys = Object.keys(payload);

  assert.equal(rawKeys.includes('dogru_cevap'), false);
  assert.equal(rawKeys.includes('dogru_nedeni'), false);
  assert.equal('dogru_cevap' in payload, false);
  assert.equal('dogru_nedeni' in payload, false);
  assert.equal(payload.userQuery, 'Bu soruda neye dikkat etmeliyim?');

  // Doğrulayıcı dogru_cevap içeren kötü niyetli yükü reddeder
  const leakAttempt = validateAskAiPayload({
    ...payload,
    dogru_cevap: 'B',
  });
  assert.equal(leakAttempt.ok, false);

  // Sistem talimatı doğrudan şık vermeyi açıkça yasaklar
  assert.ok(SYSTEM_INSTRUCTION.includes('ASLA doğrudan doğru şıkkı'));
});

test('renderCardHeader ve renderCardBanners: AI yanıtı olan soru için .has-ai-reply, .q-ai-notify-dot ve sorma kutusu üretir', () => {
  store.setAiExplanations({}, false);
  store.setPendingAiQuestion(sampleQuestion.id, false);

  // Yanıt yokken has-ai-reply sınıfı olmamalı
  const htmlBefore = renderCardHeader(sampleQuestion, 1, false);
  assert.equal(htmlBefore.includes('has-ai-reply'), false);
  assert.equal(htmlBefore.includes(`id="aidot_${sampleQuestion.id}"`), true);
  assert.equal(htmlBefore.includes('data-action="toggle-ai-ask"'), true);

  // Pending durumunda is-ai-pending sınıfı eklenmeli
  store.setPendingAiQuestion(sampleQuestion.id, true);
  const htmlPending = renderCardHeader(sampleQuestion, 1, false);
  assert.equal(htmlPending.includes('is-ai-pending'), true);

  // Yanıt kaydedildiğinde has-ai-reply sınıfı eklenmeli
  store.setPendingAiQuestion(sampleQuestion.id, false);
  store.setAiExplanation(
    sampleQuestion.id,
    { query: 'Tanzimat nedir?', reply: 'Batılılaşma dönemidir.', updatedAt: Date.now() },
    false
  );
  const htmlAfter = renderCardHeader(sampleQuestion, 1, false);
  assert.equal(htmlAfter.includes('has-ai-reply'), true);
  assert.equal(htmlAfter.includes('q-ai-notify-dot'), true);

  // Sorma kutusu renderCardBanners içinde üretilmeli
  const bannersHtml = renderCardBanners(sampleQuestion, false);
  assert.equal(bannersHtml.includes(`id="aiAskBox_${sampleQuestion.id}"`), true);
  assert.equal(bannersHtml.includes('data-action="submit-ai-ask"'), true);
});

test('onRequestPost: geçerli Zero-Knowledge isteğine 200 OK ve pedagojik yanıt döner', async () => {
  const payload = buildZeroKnowledgePayload(sampleQuestion, 'Tanzimat ne demek?', 'TDE');
  const req = new Request('http://localhost:5173/api/ask-ai', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Origin: 'http://localhost:5173',
    },
    body: JSON.stringify(payload),
  });

  const res = await onRequestPost({ request: req, env: {} });
  assert.equal(res.status, 200);
  const data = (await res.json()) as { reply?: string };
  assert.equal(typeof data.reply, 'string');
  assert.ok((data.reply || '').length > 10);
});

