import rawEserDict from '../../data/generated/MEB_ESER_DICT.json';
import rawYazarDict from '../../data/generated/MEB_YAZAR_DICT.json';
import rawDivanDict from '../../data/generated/MEB_DIVAN_GLOSAR.json';

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

export const MEB_ESER_DICT = rawEserDict as Record<string, EserInfo>;
export const MEB_YAZAR_DICT = rawYazarDict as Record<string, YazarInfo>;
export const MEB_DIVAN_GLOSAR = rawDivanDict as Record<string, DivanWordEntry>;

export type EdebiyatEntity = EserInfo | YazarInfo;
