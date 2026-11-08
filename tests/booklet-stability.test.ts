import test from 'node:test';
import assert from 'node:assert/strict';
import { notifyStateChange, onStateChange, state, store } from '../src/app/state.ts';
import { handleSelectOpticalBubble, clearAllMarks } from '../src/features/answers/marking.ts';
import { renderQuestionCardHtml } from '../src/features/booklet/question-card.ts';
import { BOOKLET_CHUNK_SIZE } from '../src/features/booklet/pagination.ts';
import { initClassroomCardHook } from '../src/features/classroom/card-hook.ts';
import { roomService } from '../src/features/classroom/room-service.ts';
import { isQuestionMealActive } from '../src/features/english/interlinear.ts';
import '../src/features/booklet/selection.js';
import '../src/features/booklet/render.js';
import type { Question } from '../src/data/question.ts';

function makeQuestion(id: number): Question {
  return {
    id,
    ders: 'TÜRK DİLİ VE EDEBİYATI – 1',
    soru: `Örnek soru metni ${id}`,
    secenekler: { A: 'Bir', B: 'İki', C: 'Üç', D: 'Dört' },
    dogru_cevap: 'B',
    ana_konu: 'Test Konusu',
  };
}

test('pendingMarkedChoices state üzerinden yönetilir ve kart HTML şablonuna yansır', () => {
  const q = makeQuestion(95101);
  store.setAllData([q]);
  store.setBookletQuestions([q]);
  clearAllMarks();

  handleSelectOpticalBubble(q.id, 'C');
  assert.equal(state.pendingMarkedChoices[q.id], 'C');
  assert.equal(state.userMarkedChoices[q.id], undefined);

  const pendingHtml = renderQuestionCardHtml(q, 1);
  assert.match(pendingHtml, /data-user-mark="C"/);
  assert.match(pendingHtml, /optical-choice-row marked" data-letter="C"/);

  handleSelectOpticalBubble(q.id, 'C');
  assert.equal(state.pendingMarkedChoices[q.id], undefined);
  assert.equal(state.userMarkedChoices[q.id], 'C');
  clearAllMarks();
});

test('renderQuestionCardHtml tekil kart içi id üretmez ve veri özniteliklerini kullanır', () => {
  const q = makeQuestion(95102);
  const html = renderQuestionCardHtml(q, 1);
  assert.doesNotMatch(html, /\bid="(?:bq|stem|opt|banner|qnum|btn|formulaBanner)_/);
  assert.match(html, /class="booklet-question" data-qid="95102"/);
  assert.match(html, /data-role="stem"/);
  assert.match(html, /data-action="select-optical-choice" data-qid="95102" data-letter="A"/);
  assert.match(html, /data-role="toolbar-extras"/);
  assert.match(html, /data-role="answer-banner"/);
});

test('activeBoardQuestionId merkezi state üzerinde saklanır', () => {
  store.setActiveBoardQuestionId(95103);
  assert.equal(state.activeBoardQuestionId, 95103);
  store.setActiveBoardQuestionId(null);
  assert.equal(state.activeBoardQuestionId, null);
});

test('booklet:refresh ve booklet:updated çift render üretmez; layoutchange tam yeniden çizim yapmaz', () => {
  const prevDoc = globalThis.document;
  let containerWriteCount = 0;
  let bodyWriteCount = 0;
  let renderedChunkSize = 0;

  const pageBody = {
    classList: { remove() {}, add() {}, toggle() {} },
    set innerHTML(val: string) {
      bodyWriteCount += 1;
      renderedChunkSize = (val.match(/class="booklet-question"/g) || []).length;
    },
    querySelectorAll: () => [],
  };
  const sentinel = { textContent: '', onclick: null as null | (() => void), remove() {} };
  const container = {
    classList: { remove() {}, add() {} },
    set innerHTML(_val: string) {
      containerWriteCount += 1;
    },
  };

  const listeners = new Map<string, Array<() => void>>();
  Object.defineProperty(globalThis, 'document', {
    configurable: true,
    value: {
      getElementById(id: string) {
        if (id === 'bookletPagesContainer') return container;
        if (id === 'bookletQuestionBody_1') return pageBody;
        if (id === 'bookletLoadSentinel') return sentinel;
        return null;
      },
      querySelectorAll: () => [],
      addEventListener(type: string, cb: () => void) {
        const list = listeners.get(type) ?? [];
        list.push(cb);
        listeners.set(type, list);
      },
      dispatchEvent(ev: { type: string }) {
        for (const cb of listeners.get(ev.type) ?? []) cb();
        return true;
      },
    },
  });

  try {
    const manyQuestions = Array.from({ length: BOOKLET_CHUNK_SIZE + 12 }, (_, idx) => makeQuestion(96000 + idx));
    store.setAllData(manyQuestions);
    store.setCurrentSubject('TDE');
    store.clearSelectedCourses();
    store.clearSelectedTopicKeys();
    store.setSelectedExamPeriod(null);
    store.setBookletFilterMode('all');
    store.setContentViewMode('questions');

    notifyStateChange('booklet:refresh');
    assert.equal(containerWriteCount, 1, 'booklet:refresh yalnızca 1 kez kabuk çizmeli');
    assert.equal(bodyWriteCount, 1, 'booklet:refresh yalnızca 1 kez soru kümesi çizmeli');
    assert.equal(renderedChunkSize, BOOKLET_CHUNK_SIZE, 'ilk çizimde yalnızca ilk parça basılmalı');

    notifyStateChange('booklet:updated');
    assert.equal(containerWriteCount, 2, 'booklet:updated tam olarak +1 kez çizmeli');

    store.setColumnCount(3, false);
    for (const cb of listeners.get('booklet:layoutchange') ?? []) cb();
    assert.equal(containerWriteCount, 2, 'booklet:layoutchange tüm kitapçığı yeniden basmamalı');
  } finally {
    if (prevDoc === undefined) {
      delete (globalThis as { document?: Document }).document;
    } else {
      Object.defineProperty(globalThis, 'document', { configurable: true, value: prevDoc });
    }
  }
});

test('oda kurucu yetkisi değiştiğinde tüm kitapçığı değil yalnızca kanca alanlarını yeniler', () => {
  initClassroomCardHook();

  let hookRefreshCount = 0;
  let fullRefreshCount = 0;
  const unsubHook = onStateChange('booklet:refresh-hooks', () => { hookRefreshCount += 1; });
  const unsubFull = onStateChange('booklet:refresh', () => { fullRefreshCount += 1; }, -100);

  try {
    roomService.joinOrCreateRoom('ROOM9', 'Hoca', true);
    assert.equal(hookRefreshCount, 1, 'Host olunca yalnızca kanca yenilemesi tetiklenmeli');
    assert.equal(fullRefreshCount, 0, 'Host değişiminde tam booklet:refresh tetiklenmemeli');

    roomService.leaveRoom();
    assert.equal(hookRefreshCount, 2, 'Odadan çıkınca yalnızca kanca yenilemesi tetiklenmeli');
    assert.equal(fullRefreshCount, 0, 'Odadan çıkışta da tam booklet:refresh tetiklenmemeli');
  } finally {
    unsubHook();
    unsubFull();
    roomService.leaveRoom();
  }
});

test('activeMealQuestionIds merkezi state üzerinde tutulur ve meal durumu sorgulanabilir', () => {
  store.clearActiveQuestionMeals();
  assert.equal(isQuestionMealActive(95104), false);

  store.setQuestionMealActive(95104, true);
  assert.equal(state.activeMealQuestionIds.has(95104), true);
  assert.equal(isQuestionMealActive(95104), true);

  const toggledOff = store.toggleQuestionMealActive(95104);
  assert.equal(toggledOff, false);
  assert.equal(isQuestionMealActive(95104), false);

  const toggledOn = store.toggleQuestionMealActive(95104);
  assert.equal(toggledOn, true);
  assert.equal(isQuestionMealActive(95104), true);

  store.clearActiveQuestionMeals();
  assert.equal(state.activeMealQuestionIds.size, 0);
  assert.equal(isQuestionMealActive(95104), false);
});
