import test from 'node:test';
import assert from 'node:assert/strict';
import { state } from '../src/app/state.ts';
import { toggleStarQuestion, addToRematch, removeFromRematch } from '../src/features/library/library-model.ts';
import { filterQuestionsByMode } from '../src/shared/question-filter.ts';
import type { Question } from '../src/data/question.ts';

test('toggleStarQuestion: Yıldız ekler ve kaldırır', () => {
  state.starredQuestionIds = new Set();
  toggleStarQuestion(101);
  assert.ok(state.starredQuestionIds.has(101), '101 yıldızlı olmalı');

  toggleStarQuestion(101);
  assert.ok(!state.starredQuestionIds.has(101), '101 yıldızdan çıkmalı');
});

test('addToRematch ve removeFromRematch: Rövanş sepetini yönetir', () => {
  state.rematchQuestionIds = new Set();
  addToRematch(202);
  assert.ok(state.rematchQuestionIds.has(202), '202 rövanşta olmalı');

  removeFromRematch(202);
  assert.ok(!state.rematchQuestionIds.has(202), '202 rövanştan silinmeli');
});

test('filterQuestionsByMode: Rövanşlar, Yıldızlılar ve Tümü oyun modları doğru çalışır', () => {
  const q1: Question = { id: 1, ders: 'MATEMATİK – 1', soru: 'S1', secenekler: { A: '1', B: '2', C: '3', D: '4' }, dogru_cevap: 'A' };
  const q2: Question = { id: 2, ders: 'MATEMATİK – 1', soru: 'S2', secenekler: { A: '1', B: '2', C: '3', D: '4' }, dogru_cevap: 'B' };
  const q3: Question = { id: 3, ders: 'MATEMATİK – 1', soru: 'S3', secenekler: { A: '1', B: '2', C: '3', D: '4' }, dogru_cevap: 'C' };

  const all = [q1, q2, q3];
  const userChoices: Record<number, string> = {
    1: 'A', // Doğru
    2: 'C', // Yanlış
    // 3: Çözülmedi ama rövanş sepetinde olabilir
  };
  const rematchIds = new Set([3]);
  const starredIds = new Set([1, 2]);

  // Rövanş modu: Yanlış yapılan (2) ve sepetteki (3) soruları getirmeli
  const rematch = filterQuestionsByMode(all, 'rematch', userChoices, rematchIds, starredIds);
  assert.equal(rematch.length, 2);
  assert.deepEqual(rematch.map(q => q.id), [2, 3]);

  // Yıldızlılar modu: Yıldızlanan soruları getirmeli
  const starred = filterQuestionsByMode(all, 'starred', userChoices, rematchIds, starredIds);
  assert.equal(starred.length, 2);
  assert.deepEqual(starred.map(q => q.id), [1, 2]);

  // Tümü modu: Bütün soruları getirmeli
  const allFiltered = filterQuestionsByMode(all, 'all', userChoices, rematchIds, starredIds);
  assert.equal(allFiltered.length, 3);
});

