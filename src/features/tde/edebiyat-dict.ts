
export interface EserInfo {
  type: 'eser';
  ad: string;
  yazar: string;
  donem: string;
  tur: string;
  ayristirici: string;
  karakterler?: string[];
}

export interface YazarInfo {
  type: 'yazar';
  ad: string;
  donem: string;
  akim?: string;
  unvan: string;
  kilitEserler: string[];
  ayristirici: string;
}

export interface DivanWordEntry {
  anlam: string;
  koken: string;
  osmanlica: string;
  mazmun?: string;
}

export const MEB_ESER_DICT: Record<string, EserInfo> = {};
export const MEB_YAZAR_DICT: Record<string, YazarInfo> = {};
export const MEB_DIVAN_GLOSAR: Record<string, DivanWordEntry> = {};

export type EdebiyatEntity = EserInfo | YazarInfo;
