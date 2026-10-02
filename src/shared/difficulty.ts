import type { Question } from '../data/question.ts';

export type DifficultyLevel = 'kek' | 'orta' | 'boss';

export interface DifficultyInfo {
  level: DifficultyLevel;
  label: string;
  badge: string;
  color: string;
  bg: string;
}

export const DIFFICULTY_CONFIG: Record<DifficultyLevel, DifficultyInfo> = {
  kek: {
    level: 'kek',
    label: 'Kek',
    badge: 'Kek',
    color: '#059669',
    bg: 'rgba(16, 185, 129, 0.12)',
  },
  orta: {
    level: 'orta',
    label: 'Orta',
    badge: 'Orta',
    color: '#0284c7',
    bg: 'rgba(2, 132, 199, 0.10)',
  },
  boss: {
    level: 'boss',
    label: 'Boss',
    badge: 'Boss',
    color: '#e11d48',
    bg: 'rgba(225, 29, 72, 0.12)',
  },
};

/**
 * Sorunun zorluk seviyesini hesaplar.
 */
export function getQuestionDifficulty(q: Question): DifficultyInfo {
  if (q.zorluk && DIFFICULTY_CONFIG[q.zorluk]) {
    return DIFFICULTY_CONFIG[q.zorluk];
  }

  const s = (q.soru || '').toLowerCase();
  const alt = (q.alt_konu || '').toLowerCase();
  const ders = (q.ders || '').toUpperCase();

  // Boss Seviyesi Göstergeleri
  const isBoss = (
    ders.includes('4') ||
    alt.includes('katı cisimler') ||
    alt.includes('karmaşık sayılar') ||
    alt.includes('kombinasyon') ||
    alt.includes('olasılık') ||
    alt.includes('özel dörtgenler') ||
    s.includes('cisim köşegen') ||
    s.includes('bire bir ve örten') ||
    s.includes('çarpanlarından biri değildir') ||
    s.includes('en büyük tam sayı değeri') ||
    (s.length > 280 && s.includes('grafik'))
  );

  if (isBoss) return DIFFICULTY_CONFIG.boss;

  // Kek Seviyesi Göstergeleri
  const isKek = (
    s.includes('önermesinin doğruluk değeri') ||
    s.includes('kümesinin eleman sayısı') ||
    s.includes('aşağıdakilerden hangisidir?') && s.length < 80 ||
    alt.includes('sayı kümeleri') ||
    alt.includes('önermeler') ||
    s.includes('modu') ||
    s.includes('doğrusal olduğuna göre')
  );

  if (isKek) return DIFFICULTY_CONFIG.kek;

  return DIFFICULTY_CONFIG.orta;
}
