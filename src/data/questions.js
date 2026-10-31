import { SUBJECTS } from './subjects.js';
import { fetchQuestionsWithFallback } from './supabase-client.ts';

import subjectManifest from './generated/subjectManifest.json';
export { subjectManifest };

/** @typedef {import('./question.ts').Question} Question */
/** @type {Set<string>} */
export const loadedSubjects = new Set();
/** @type {Map<string, Promise<Question[]>>} */
export const subjectLoadPromises = new Map();
/** @type {Map<string, Question[]>} */
export const subjectQuestionCache = new Map();

/** @param {string} subj @returns {Promise<Question[]>} */
export function loadSubjectData(subj) {
  const cached = subjectQuestionCache.get(subj);
  if (cached) return Promise.resolve(cached);
  const pending = subjectLoadPromises.get(subj);
  if (pending) return pending;

  const request = fetchQuestionsWithFallback(subj)
    .then(questions => {
      subjectQuestionCache.set(subj, questions);
      loadedSubjects.add(subj);
      return questions;
    })
    .finally(() => subjectLoadPromises.delete(subj));

  subjectLoadPromises.set(subj, request);
  return request;
}

/** @returns {Promise<Question[]>} */
export async function loadAllSubjectData() {
  const questionGroups = await Promise.all(SUBJECTS.map(subject => loadSubjectData(subject.id)));
  return questionGroups.flat();
}
