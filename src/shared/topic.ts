import type { Question } from '../data/question.ts';

/** Konu listesi ve kitapçık filtresi aynı anahtarı kullanmalıdır. */
export function getTopicKey(question: Pick<Question, 'ana_konu' | 'alt_konu'>): string {
  const main = question.ana_konu || 'Genel';
  const sub = question.alt_konu || 'Genel';
  if (main !== 'Genel' && sub !== 'Genel') return `${main} / ${sub}`;
  return sub !== 'Genel' ? sub : main;
}
