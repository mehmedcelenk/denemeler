import test from 'node:test';
import assert from 'node:assert/strict';
import { store, state } from '../src/app/state.ts';
import { toggleEliminateChoice } from '../src/features/annotations/eliminate-choice.ts';

test('toggleEliminateChoice: şıkkı eler ve tekrar çağrılınca eleme durumunu kaldırır', () => {
  store.clearAllEliminatedChoices(false);
  const qid = 99991;

  // 1. A şıkkını ele
  const isEliminated = toggleEliminateChoice(qid, 'A');
  assert.equal(isEliminated, true);
  assert.deepEqual(state.eliminatedChoices[qid], ['A']);

  // 2. B şıkkını da ele
  toggleEliminateChoice(qid, 'B');
  assert.deepEqual(state.eliminatedChoices[qid], ['A', 'B']);

  // 3. A şıkkına tekrar uzun basılırsa eleme kalkar
  const isStillEliminated = toggleEliminateChoice(qid, 'A');
  assert.equal(isStillEliminated, false);
  assert.deepEqual(state.eliminatedChoices[qid], ['B']);

  // 4. B şıkkının da elemesi kalkınca kayıt temizlenir
  toggleEliminateChoice(qid, 'B');
  assert.equal(state.eliminatedChoices[qid], undefined);
});
