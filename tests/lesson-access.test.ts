import test from 'node:test';
import assert from 'node:assert/strict';
import { state, store } from '../src/app/state.ts';
import { renderToolbarExtraHooks } from '../src/features/booklet/card-hooks.ts';
import { initLessons, openQuestionLesson } from '../src/features/lessons/init.ts';
import type { Question } from '../src/data/question.ts';

const question: Question = {
  id: 981234, ders: 'MATEMATİK', soru: 'Soru',
  secenekler: { A: '1', B: '2', C: '3', D: '4' }, dogru_cevap: 'B',
};

test('İHÖ yalnız kesin veya kayıtlı cevapla kullanılabilir, taslak yeterli değildir', async () => {
  initLessons();
  store.clearAllUserMarkedChoices(false);
  store.clearAllPendingChoices();
  store.setPendingChoice(question.id, 'A');
  assert.equal(renderToolbarExtraHooks(question), '');
  await openQuestionLesson(question.id);
  assert.equal(state.userMarkedChoices[question.id], undefined);
  store.setUserMarkedChoice(question.id, 'A', false);
  assert.match(renderToolbarExtraHooks(question), /İHÖ/);
  store.removeUserMarkedChoice(question.id, false);
  assert.equal(renderToolbarExtraHooks(question), '');
  store.clearAllPendingChoices();
});
