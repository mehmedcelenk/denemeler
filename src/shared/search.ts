import type { Choice, Question } from '../data/question.ts';


export function trNormalize(text: unknown): string {
  if (!text) return '';
  return text
    .toString()
    .replace(/İ/g, 'i')
    .replace(/I/g, 'ı')
    .replace(/Ğ/g, 'ğ')
    .replace(/Ü/g, 'ü')
    .replace(/Ş/g, 'ş')
    .replace(/Ö/g, 'ö')
    .replace(/Ç/g, 'ç')
    .toLowerCase()
    .trim();
}

export function questionMatchesSearch(q: Question, term: string): boolean {
  if (!term) return true;
  const nTerm = trNormalize(term);
  if (!nTerm) return true;

  if (trNormalize(q.alt_konu || '').includes(nTerm)) return true;
  if (trNormalize(q.ana_konu || '').includes(nTerm)) return true;
  if (trNormalize(q.soru || '').includes(nTerm)) return true;
  if (q.secenekler) {
    for (const opt of Object.keys(q.secenekler) as Choice[]) {
      if (trNormalize(q.secenekler[opt] || '').includes(nTerm)) return true;
    }
  }
  return false;
}
