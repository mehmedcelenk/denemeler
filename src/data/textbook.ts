import type { SubjectId } from './question.ts';

export const calloutTypes = [
  'bilgi_kutusu',
  'not_edelim',
  'kavram',
  'okuma_metni',
  'etkinlik',
  'uyari',
] as const;

export type CalloutType = typeof calloutTypes[number];

export interface TextbookCalloutBox {
  tip: CalloutType;
  baslik?: string;
  icerik: string;
  sayfa: number;
}

export interface TextbookSection {
  baslik: string;
  seviye: 1 | 2 | 3;
  sayfa_baslangic: number;
  sayfa_bitis: number;
  paragraflar: string[];
  kutular: TextbookCalloutBox[];
}

export interface TextbookUnit {
  unite_no: number;
  unite_adi: string;
  donem: number;
  ders: string;
  ders_kodu?: number;
  sayfa_araligi: [number, number];
  bolumler: TextbookSection[];
}

/**
 * Döneme (kademeye) özel ıstılah / kavram sözleşmesi.
 * X ıstılahı Dönem 1'de ve Dönem 2'de sadece kendi PDF kitabındaki kapsamıyla tanımlanır.
 */
export interface ScopedConceptEntry {
  id: string;
  term: string;
  subject: SubjectId;
  ders: string;
  ders_kodu?: number;
  donem: number;
  unite_no?: number;
  sayfa?: number;
  tanim: string;
  baglam_farki?: string;
  sinav_ipucu?: string;
  aliases?: string[];
}

export interface DigitalTextbook {
  kitap_kodu: string;
  kitap_adi: string;
  subject: SubjectId;
  donemler: number[];
  toplam_sayfa: number;
  uniteler: TextbookUnit[];
  istilahlar: ScopedConceptEntry[];
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

export function parseScopedConcepts(value: unknown): ScopedConceptEntry[] {
  if (!Array.isArray(value)) {
    throw new Error('Istılah verisi bir dizi olmalı.');
  }
  const seen = new Set<string>();
  for (const [idx, item] of value.entries()) {
    if (
      !isRecord(item) ||
      typeof item.id !== 'string' ||
      !item.id.trim() ||
      typeof item.term !== 'string' ||
      !item.term.trim() ||
      typeof item.subject !== 'string' ||
      typeof item.ders !== 'string' ||
      typeof item.donem !== 'number' ||
      !Number.isInteger(item.donem) ||
      item.donem < 1 ||
      typeof item.tanim !== 'string' ||
      !item.tanim.trim()
    ) {
      throw new Error(`${idx + 1}. ıstılah kaydının veri biçimi geçersiz.`);
    }
    const scopedKey = `${item.ders}::${item.id}`;
    if (seen.has(scopedKey)) {
      throw new Error(`Aynı ders/dönem içinde tekrarlanan ıstılah kimliği: ${scopedKey}`);
    }
    seen.add(scopedKey);
  }
  return value as ScopedConceptEntry[];
}

export function parseDigitalTextbook(value: unknown): DigitalTextbook {
  if (!isRecord(value)) {
    throw new Error('Dijital kitap verisi bir nesne olmalı.');
  }
  if (
    typeof value.kitap_kodu !== 'string' ||
    !value.kitap_kodu.trim() ||
    typeof value.kitap_adi !== 'string' ||
    typeof value.subject !== 'string' ||
    !Array.isArray(value.donemler) ||
    typeof value.toplam_sayfa !== 'number' ||
    !Array.isArray(value.uniteler)
  ) {
    throw new Error('Dijital kitap üst veri (metadata) alanları geçersiz.');
  }
  for (const [uIdx, unit] of value.uniteler.entries()) {
    if (
      !isRecord(unit) ||
      typeof unit.unite_no !== 'number' ||
      typeof unit.unite_adi !== 'string' ||
      typeof unit.donem !== 'number' ||
      typeof unit.ders !== 'string' ||
      !Array.isArray(unit.sayfa_araligi) ||
      unit.sayfa_araligi.length !== 2 ||
      !Array.isArray(unit.bolumler)
    ) {
      throw new Error(`${uIdx + 1}. ünite yapısı geçersiz.`);
    }
  }
  const istilahlar = value.istilahlar !== undefined ? parseScopedConcepts(value.istilahlar) : [];
  return {
    ...(value as unknown as DigitalTextbook),
    istilahlar,
  };
}

