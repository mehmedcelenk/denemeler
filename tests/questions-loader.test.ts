import test from 'node:test';
import assert from 'node:assert/strict';
import {
  loadSubjectData,
  loadedSubjects,
  subjectLoadPromises,
  subjectQuestionCache,
} from '../src/data/questions.js';
import { state, store } from '../src/app/state.ts';
import type { Question } from '../src/data/question.ts';

const subject = 'PHASE5_TEST';
const question: Question = {
  id: 95001,
  ders: 'TEST – 1',
  soru: 'Saf veri yükleyici testi',
  secenekler: { A: 'A', B: 'B', C: 'C', D: 'D' },
  dogru_cevap: 'A',
};

test('loadSubjectData eşzamanlı çağrılarda tek isteği paylaşır ve sonucu önbellekten döndürür', async () => {
  const originalFetch = globalThis.fetch;
  let fetchCount = 0;
  try {
    globalThis.fetch = async () => {
      fetchCount++;
      return new Response(JSON.stringify([question]), { status: 200 });
    };

    const firstRequest = loadSubjectData(subject);
    const secondRequest = loadSubjectData(subject);
    assert.equal(firstRequest, secondRequest);

    const firstResult = await firstRequest;
    const secondResult = await secondRequest;
    const cachedResult = await loadSubjectData(subject);
    assert.equal(fetchCount, 1);
    assert.equal(firstResult, secondResult);
    assert.equal(cachedResult, firstResult);
    assert.equal(firstResult[0].id, question.id);
  } finally {
    globalThis.fetch = originalFetch;
    loadedSubjects.delete(subject);
    subjectLoadPromises.delete(subject);
    subjectQuestionCache.delete(subject);
  }
});

test('store.appendQuestions önbellekten dönen soruları kimliğe göre tek kez ekler', () => {
  store.setAllData([]);
  store.appendQuestions([question]);
  store.appendQuestions([question]);
  assert.deepEqual(state.allData.map(item => item.id), [question.id]);
});
