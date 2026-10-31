import test from 'node:test';
import assert from 'node:assert/strict';
import { store, state } from '../src/app/state.ts';
import { StorageKeys } from '../src/shared/storage-keys.ts';
import { renderCardHeader, renderCardBanners } from '../src/features/booklet/question-card.ts';
import {
  buildZeroKnowledgePayload,
  loadSavedAiExplanations,
  renderInlineChatReply,
  deleteAiTurn,
  cleanAiReplyText,
} from '../src/features/ai-tutor/ai-tutor.ts';
import { formatAiMarkdown } from '../src/shared/simple-markdown.ts';
import {
  validateAskAiPayload,
  SYSTEM_INSTRUCTION,
  onRequestPost,
} from '../functions/api/ask-ai.ts';
import { sampleQuestion } from './fixtures/ai-question.ts';

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
    assert.ok(savedRaw, 'AI açıklamaları localStorage üzerinde kaydedilmeli');
    const parsed = JSON.parse(savedRaw);
    assert.deepEqual(parsed[String(sampleQuestion.id)], entry);
  } finally {
    Object.defineProperty(globalThis, 'localStorage', {
      value: prevStorage,
      configurable: true,
    });
  }
});

test('store.clearAiExplanation: state ve localStorage üzerinden kaydı siler', () => {
  store.setAiExplanations({}, false);
  store.setAiExplanation(sampleQuestion.id, { query: 'test', reply: 'yanıt', updatedAt: 123 }, false);
  assert.ok(state.aiExplanations[sampleQuestion.id]);
  store.clearAiExplanation(sampleQuestion.id, false);
  assert.equal(state.aiExplanations[sampleQuestion.id], undefined);
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

test('formatAiMarkdown: XSS koruması ve temel Markdown öğelerini güvenle dönüştürür', () => {
  // XSS script etiketi engellenmeli
  const xss = formatAiMarkdown('<script>alert("hack")</script>');
  assert.equal(xss.includes('<script>'), false);
  assert.ok(xss.includes('&lt;script&gt;'));

  // Kalın, italik ve kod
  const formatted = formatAiMarkdown('🔑 **Kilit:** `redif` kuralı *önemlidir*.');
  assert.ok(formatted.includes('<strong>Kilit:</strong>'));
  assert.ok(formatted.includes('<code class="ai-md-code">redif</code>'));
  assert.ok(formatted.includes('<em>önemlidir</em>'));

  // Madde imi listesi
  const listRaw = '* İlk ipucu\n* İkinci ipucu';
  const listHtml = formatAiMarkdown(listRaw);
  assert.ok(listHtml.includes('<ul class="ai-md-list">'));
  assert.ok(listHtml.includes('<li>İlk ipucu</li>'));
  assert.ok(listHtml.includes('<li>İkinci ipucu</li>'));

  // Numaralı liste
  const numRaw = '1. Birinci adım\n2. İkinci adım';
  const numHtml = formatAiMarkdown(numRaw);
  assert.ok(numHtml.includes('<ol class="ai-md-list">'));
  assert.ok(numHtml.includes('<li>Birinci adım</li>'));

  // Alıntı
  const quoteRaw = '> Önemli not';
  const quoteHtml = formatAiMarkdown(quoteRaw);
  assert.ok(quoteHtml.includes('<blockquote class="ai-md-quote">Önemli not</blockquote>'));
});

test('store.appendAiQuestionReply: Yeni soruları en üstte tutar, eskileri > akordeon için history dizisinde biriktirir', () => {
  const qid = 99912;
  store.setAiExplanations({}, false);

  // 1. Soru
  store.appendAiQuestionReply(qid, 'cevap ne', '🔑 İlk ipucu');
  const entry1 = state.aiExplanations[qid];
  assert.equal(entry1.query, 'cevap ne');
  assert.equal(entry1.reply, '🔑 İlk ipucu');
  assert.equal(entry1.history?.length || 0, 0);

  // 2. Soru
  store.appendAiQuestionReply(qid, 'kafiye nedir', '🔑 İkinci ipucu');
  const entry2 = state.aiExplanations[qid];
  assert.equal(entry2.query, 'kafiye nedir');
  assert.equal(entry2.reply, '🔑 İkinci ipucu');
  assert.equal(entry2.history?.length, 1);
  assert.equal(entry2.history[0].query, 'cevap ne');

  // 3. Soru
  store.appendAiQuestionReply(qid, 'redif nasıl bulunur', '🔑 Üçüncü ipucu');
  const entry3 = state.aiExplanations[qid];
  assert.equal(entry3.query, 'redif nasıl bulunur');
  assert.equal(entry3.reply, '🔑 Üçüncü ipucu');
  assert.equal(entry3.history?.length, 2);
  // Ters kronolojik: en son önceki soru (kafiye nedir) 0. indekste, en eski (cevap ne) 1. indekste
  assert.equal(entry3.history[0].query, 'kafiye nedir');
  assert.equal(entry3.history[1].query, 'cevap ne');
});

test('renderInlineChatReply: En yeni soruyu üstte gösterir, önceki soruları > akordeon detayında açılır yapar', () => {
  const qid = 99913;
  store.setAiExplanations({}, false);
  store.appendAiQuestionReply(qid, 'İlk soru', 'İlk cevap');
  store.appendAiQuestionReply(qid, 'İkinci soru', 'İkinci cevap');

  let mockCardHtml = '';
  const mockCard = {
    style: { display: '' },
    set innerHTML(val: string) { mockCardHtml = val; },
    get innerHTML() { return mockCardHtml; },
  };

  const prevDoc = globalThis.document;
  // @ts-expect-error Mock minimal DOM
  globalThis.document = {
    getElementById: (id: string) => (id === `aiChatReply_${qid}` ? mockCard : null),
  };

  try {
    renderInlineChatReply(qid);
    assert.equal(mockCard.style.display, 'flex');
    // En yeni soru sağda kullanıcı balonu ve cevabı solda olmalı
    assert.ok(mockCardHtml.includes('ai-bubble-user'));
    assert.ok(mockCardHtml.includes('İkinci soru'));
    assert.ok(mockCardHtml.includes('İkinci cevap'));
    // Önceki soru > akordeon detayında olmalı
    assert.ok(mockCardHtml.includes('ai-history-turn'));
    assert.ok(mockCardHtml.includes('İlk soru'));
    assert.ok(mockCardHtml.includes('İlk cevap'));
    assert.ok(mockCardHtml.includes('ai-bubble-chevron'));
  } finally {
    globalThis.document = prevDoc;
  }
});

test('deleteAiTurn: geçmişteki veya en üstteki belirli bir soruyu siler', () => {
  const qid = 99914;
  store.setAiExplanations({}, false);
  store.appendAiQuestionReply(qid, 'roman nedir', 'Roman cevabı');
  store.appendAiQuestionReply(qid, 'cümlede ne anlatıyor', 'Cümle cevabı');

  // 1. Geçmişteki soruyu sil (idx: 0 -> roman nedir)
  deleteAiTurn(qid, 0);
  const entry = state.aiExplanations[qid];
  assert.equal(entry?.query, 'cümlede ne anlatıyor');
  assert.equal(entry?.history, undefined);

  // 2. En üstteki soruyu sil (turnIdx: -1)
  deleteAiTurn(qid, -1);
  assert.equal(state.aiExplanations[qid], undefined);
});

test('cleanAiReplyText: yanıttaki Numûne-i Hiyel, AI Öğretmen ve benzeri ön ekleri temizler', () => {
  assert.equal(cleanAiReplyText('💡 *Numûne-i Hiyel:* Bu soru Roman konusuna aittir.'), 'Bu soru Roman konusuna aittir.');
  assert.equal(cleanAiReplyText('💡 Numûne-i Hiyel: Bu soru Roman konusuna aittir.'), 'Bu soru Roman konusuna aittir.');
  assert.equal(cleanAiReplyText('Numûne-i Hiyel: Tanzimat dönemi...'), 'Tanzimat dönemi...');
  assert.equal(cleanAiReplyText('Doğrudan yanıt metni.'), 'Doğrudan yanıt metni.');
});

