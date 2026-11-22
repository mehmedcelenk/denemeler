import test from 'node:test';
import assert from 'node:assert/strict';
import { onStateChange, state, store } from '../src/app/state.ts';
import { handleSelectOpticalBubble } from '../src/features/answers/marking.ts';
import type { Choice, Question } from '../src/data/question.ts';

const question: Question = {
  id: 98761, ders: 'MATEMATİK – 1', soru: '2 + 2?',
  secenekler: { A: '3', B: '4', C: '5', D: '6' }, dogru_cevap: 'B',
};

for (const first of ['A', 'B'] as const) {
  test(`onaylanmış ${first} cevabı aynı/farklı şıkla kaldırılamaz veya değiştirilemez`, () => {
    store.setProgressOwner('legacy');
    store.setAllData([question]);
    store.setBookletQuestions([question]);
    store.clearAllUserMarkedChoices(false);
    store.clearAllPendingChoices();
    let marked = 0;
    let revoked = 0;
    const offMarked = onStateChange('answer:marked', () => { marked++; });
    const offRevoked = onStateChange('answer:revoked', () => { revoked++; });
    try {
      handleSelectOpticalBubble(question.id, first);
      assert.equal(state.pendingMarkedChoices[question.id], first);
      assert.equal(state.userMarkedChoices[question.id], undefined);
      handleSelectOpticalBubble(question.id, first);
      assert.equal(state.userMarkedChoices[question.id], first);
      for (const choice of [first, 'C', 'C', first] as Choice[]) {
        handleSelectOpticalBubble(question.id, choice);
        assert.equal(state.userMarkedChoices[question.id], first);
        assert.equal(state.pendingMarkedChoices[question.id], undefined);
      }
      assert.equal(marked, 1);
      assert.equal(revoked, 0);
    } finally { offMarked(); offRevoked(); }
  });
}

test('depolamadan yüklenen cevap da kilitlidir; onay öncesi taslak değişebilir', () => {
  store.clearAllUserMarkedChoices(false);
  store.clearAllPendingChoices();
  handleSelectOpticalBubble(question.id, 'A');
  handleSelectOpticalBubble(question.id, 'B');
  assert.equal(state.pendingMarkedChoices[question.id], 'B');
  assert.equal(state.userMarkedChoices[question.id], undefined);
  store.clearAllPendingChoices();
  store.setUserMarkedChoices({ [question.id]: 'A' }, false);
  handleSelectOpticalBubble(question.id, 'A');
  handleSelectOpticalBubble(question.id, 'B');
  handleSelectOpticalBubble(question.id, 'B');
  assert.equal(state.userMarkedChoices[question.id], 'A');
  assert.equal(state.pendingMarkedChoices[question.id], undefined);
});
