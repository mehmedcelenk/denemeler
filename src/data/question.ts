/** Frontend'in Python çıktısından beklediği veri sözleşmesi. */
export const choices = ['A', 'B', 'C', 'D'] as const;
export type Choice = typeof choices[number];
export type SubjectId = 'COG' | 'TDE' | 'MAT' | 'TAR' | 'INK' | 'KIM' | 'FIZ' | 'BIO' | 'FEL' | 'DIN' | 'SAG' | 'ING';

export interface Question {
  id: number;
  ders: string;
  soru: string;
  secenekler: Record<Choice, string>;
  dogru_cevap: Choice;
  ana_konu?: string;
  alt_konu?: string;
  yil?: string;
  donem?: string | number;
  puan?: number;
  kredi?: number;
  sinav_soru_sayisi?: number;
  ipucu?: string;
  sekilli?: boolean;
  zorluk?: 'kek' | 'orta' | 'boss';
  soru_tr?: string;
  soru_ar?: string;
  soru_xray?: string;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/** JSON tipi çalışma anında bilinmez; hatalı veri state'e girmeden reddedilir. */
export function parseQuestions(value: unknown): Question[] {
  if (!Array.isArray(value)) throw new Error('Soru verisi bir liste olmalı.');
  const seen = new Set<number>();
  for (const [index, question] of value.entries()) {
    if (!isRecord(question) || !Number.isSafeInteger(question.id)
      || typeof question.ders !== 'string' || typeof question.soru !== 'string'
      || !isRecord(question.secenekler)
      || !choices.every(choice => typeof (question.secenekler as Record<string, unknown>)[choice] === 'string')
      || !choices.includes(question.dogru_cevap as Choice)) {
      throw new Error(`${index + 1}. sorunun veri biçimi geçersiz.`);
    }
    if (question.sekilli !== undefined && typeof question.sekilli !== 'boolean') {
      throw new Error(`${index + 1}. sorunun sekilli alanı boolean olmalı.`);
    }
    if (question.donem !== undefined && typeof question.donem !== 'string' && typeof question.donem !== 'number') {
      throw new Error(`${index + 1}. sorunun donem alanı geçersiz.`);
    }
    const id = question.id as number;
    if (seen.has(id)) throw new Error(`Tekrarlanan soru kimliği: ${id}`);
    seen.add(id);
    for (const key of ['ana_konu', 'alt_konu', 'ipucu', 'soru_tr', 'soru_ar', 'soru_xray', 'yil']) {
      if (question[key] !== undefined && typeof question[key] !== 'string') {
        throw new Error(`${id}: ${key} metin olmalı.`);
      }
    }
    if (question.zorluk !== undefined && !['kek', 'orta', 'boss'].includes(question.zorluk as string)) {
      throw new Error(`${id}: zorluk değeri geçersiz.`);
    }
    for (const key of ['puan', 'kredi', 'sinav_soru_sayisi']) {
      if (question[key] !== undefined && (typeof question[key] !== 'number' || !Number.isFinite(question[key]))) {
        throw new Error(`${id}: ${key} sonlu bir sayı olmalı.`);
      }
    }
  }
  return value as Question[];
}
