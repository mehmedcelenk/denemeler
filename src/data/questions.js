import { store } from '../app/state.ts';
import { SUBJECTS } from './subjects.js';
import { fetchQuestionsWithFallback } from './supabase-client.ts';

import subjectManifest from './generated/subjectManifest.json';
export { subjectManifest };

export const loadedSubjects = new Set();
export const subjectLoadPromises = new Map();

export async function loadSubjectData(subj) {
  if (loadedSubjects.has(subj)) return;
  if (subjectLoadPromises.has(subj)) return subjectLoadPromises.get(subj);

  const request = fetchQuestionsWithFallback(subj)
    .then(questions => {
      store.appendQuestions(questions);
      loadedSubjects.add(subj);
    })
    .finally(() => subjectLoadPromises.delete(subj));

  subjectLoadPromises.set(subj, request);
  return request;
}

export async function loadAllSubjectData() {
  await Promise.all(SUBJECTS.map(subject => loadSubjectData(subject.id)));
}
