import type { ActiveMascotId, MascotMood } from './mascot-types.ts';

export type TalkMood = Exclude<MascotMood, 'idle'>;

interface MascotPersonality {
  readonly talkChance: Readonly<Record<TalkMood, number>>;
  readonly lines: Readonly<Record<TalkMood, readonly string[]>>;
}

/**
 * Üst HUD maskot rozeti için kısa Clash Royale tarzı emote replikleri.
 * Saf veri modülüdür; DOM veya ağ çağrısı yapmaz.
 */
const PERSONALITIES: Readonly<Record<ActiveMascotId, MascotPersonality>> = {
  cat: {
    talkChance: { welcome: 0.85, correct: 0.78, wrong: 0.72 },
    lines: {
      welcome: ['Miyav. Hazırım.', 'Mırrr, başla.'],
      correct: ['Mırrr, temiz!', 'Miyav! İşte bu.', 'Pati gibi oturdu.', 'Refleks jilet.'],
      wrong: ['Mıııv?! Tuzakmış.', 'Pati kaydı.', 'O şık bait’ti.'],
    },
  },
  dog: {
    talkChance: { welcome: 0.85, correct: 0.8, wrong: 0.72 },
    lines: {
      welcome: ['Hav! Hazırım!', 'Hadi başlayalım!'],
      correct: ['Hav hav! İsabet!', 'Hav! GG!', 'İşte kombo!'],
      wrong: ['Hav?! Ters köşe!', 'Fren tutmadı!', 'Sonraki bizim!'],
    },
  },
  fish: {
    talkChance: { welcome: 0.85, correct: 0.82, wrong: 0.72 },
    lines: {
      welcome: ['Sonar açık.', 'Akıntı bizden yana.'],
      correct: ['Torpido isabet!', 'Tam isabet!', 'Deniz temiz.'],
      wrong: ['Akıntı terse vurdu.', 'Sonar şaştı.', 'Tuzak yemmiş.'],
    },
  },
  bird: {
    talkChance: { welcome: 0.85, correct: 0.82, wrong: 0.72 },
    lines: {
      welcome: ['Gıt gıt gıdak! Uçtum valla!', 'Gıdak, buradayım!'],
      correct: ['Bıdak! Doğru çıktı!', 'Gıt gıt! Süper!', 'Uçan tavuk şovu!'],
      wrong: ['Gıdak?! Yanlış yem!', 'Tüylerim kabardı!', 'Bi daha gagalayalım.'],
    },
  },
  owl: {
    talkChance: { welcome: 0.85, correct: 0.82, wrong: 0.72 },
    lines: {
      welcome: ['Huu... gece görüşü açık.', 'Analiz başlıyor.'],
      correct: ['Bilge hamle!', 'Huu! Kusursuz mantık.', 'Tam isabet.'],
      wrong: ['Huu? Tuzak şıkmış.', 'Tekrar tarayalım.', 'Detayı kaçırma.'],
    },
  },
  raven: {
    talkChance: { welcome: 0.85, correct: 0.82, wrong: 0.72 },
    lines: {
      welcome: ['Gak. Seni izliyorum.', 'Sakin ve net.'],
      correct: ['Gak. Bunu önceden gördüm.', 'Akıllıca.', 'Tertemiz hamle.'],
      wrong: ['Gak... tuzakmış.', 'Acele etme, tekrar oku.', 'Detayı kaçırdın.'],
    },
  },
};

export function pickMascotQuip(
  mascotId: ActiveMascotId,
  mood: TalkMood,
  chanceRoll = Math.random(),
  indexRoll = Math.random(),
): string | null {
  const personality = PERSONALITIES[mascotId];
  if (!personality) return null;
  if (chanceRoll > personality.talkChance[mood]) return null;
  const pool = personality.lines[mood];
  if (!pool.length) return null;
  const idx = Math.min(pool.length - 1, Math.floor(indexRoll * pool.length));
  return pool[idx];
}
