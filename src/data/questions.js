import { parseQuestions } from './question.ts';
import { state } from '../app/state.ts';
import { SUBJECTS } from './subjects.js';

import subjectManifest from './generated/subjectManifest.json';
export { subjectManifest };

export const loadedSubjects = new Set();

export const subjectLoadPromises = new Map();

export async function loadSubjectData(subj) {
  if (loadedSubjects.has(subj)) return;
  if (subjectLoadPromises.has(subj)) return subjectLoadPromises.get(subj);

  const baseUrl = (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.BASE_URL)
    ? import.meta.env.BASE_URL
    : './';
  const cleanBase = baseUrl.endsWith('/') ? baseUrl : `${baseUrl}/`;
  const dataUrl = `${cleanBase}data/subjects/${subj}.json`;

  const request = fetch(dataUrl, { cache: 'no-cache' })
    .then(async response => {
      if (!response.ok) throw new Error(`${subj} verisi yüklenemedi (${response.status})`);
      const text = await response.text();
      if (text.trim().startsWith('<')) {
        throw new Error(`${subj} verisi JSON yerine HTML olarak döndü (${dataUrl})`);
      }
      return JSON.parse(text);
    })
    .then(questions => {
      questions = parseQuestions(questions);
      state.allData.push(...questions);
      loadedSubjects.add(subj);
    })
    .finally(() => subjectLoadPromises.delete(subj));

  subjectLoadPromises.set(subj, request);
  return request;
}

export async function loadAllSubjectData() {
  await Promise.all(SUBJECTS.map(subject => loadSubjectData(subject.id)));
}
