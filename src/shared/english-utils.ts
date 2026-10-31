import type { Question } from '../data/question.ts';

export function isEnglishQuestion(q: Question): boolean {
  const course = q.ders.toLocaleUpperCase('tr-TR');
  return course.includes('İNGİLİZCE') || course.includes('INGILIZCE');
}
