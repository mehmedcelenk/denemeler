import type { AnyMascotId, MascotMood } from './mascot-types.ts';

export type TalkMood = Exclude<MascotMood, 'idle'>;

interface MascotPersonality {
  readonly talkChance: Readonly<Record<TalkMood, number>>;
  readonly lines: Readonly<Record<TalkMood, readonly string[]>>;
}

/**
 * Maskotların kendine has kısa yansıma sesleri (konuşma balonu içeriği).
 * Saf veri modülüdür; DOM veya ağ çağrısı yapmaz.
 */
const PERSONALITIES: Readonly<Record<AnyMascotId, MascotPersonality>> = {
  cat: {
    talkChance: { welcome: 0.85, correct: 0.78, wrong: 0.72 },
    lines: {
      welcome: ['Miyav.', 'Mırrr...'],
      correct: ['Mırrr!', 'Miyav!', 'Pırrr!'],
      wrong: ['Mıııv?!', 'Fısss!', 'Miv...'],
    },
  },
  dog: {
    talkChance: { welcome: 0.85, correct: 0.8, wrong: 0.72 },
    lines: {
      welcome: ['Hav!', 'Hav hav!'],
      correct: ['Hav hav!', 'Haaav!', 'Vuuuf!'],
      wrong: ['Hav?!', 'Hırrr...', 'Vıyk...'],
    },
  },
  fish: {
    talkChance: { welcome: 0.85, correct: 0.82, wrong: 0.72 },
    lines: {
      welcome: ['Blup.', 'Blup blup.'],
      correct: ['Blup blup!', 'Şılap!', 'Fıış!'],
      wrong: ['Blup?!', 'Gluk...', 'Bloooup...'],
    },
  },
  bird: {
    talkChance: { welcome: 0.85, correct: 0.82, wrong: 0.72 },
    lines: {
      welcome: ['Gıt gıt gıdak!', 'Bıdaak!'],
      correct: ['Bıdaak bıdaak!', 'Gıt gıt gıdaaak!', 'Gıdak!'],
      wrong: ['Gıdak?!', 'Bıdak?!', 'Gııııt...'],
    },
  },
  owl: {
    talkChance: { welcome: 0.85, correct: 0.82, wrong: 0.72 },
    lines: {
      welcome: ['Biiip.', 'Vzzz-tık.'],
      correct: ['Bip-bip!', 'Tıng!', 'Vzzz-bip!'],
      wrong: ['Bzzzt!', 'Krrt...', 'Dıııt!'],
    },
  },
  drone: {
    talkChance: { welcome: 0.85, correct: 0.82, wrong: 0.72 },
    lines: {
      welcome: ['Vzzzz...', 'Fırrr...'],
      correct: ['Vzzzt-bip!', 'Fııırr!', 'Bip-biiip!'],
      wrong: ['Bzzzt?!', 'Vrrr-krrt...', 'Dıııt!'],
    },
  },
  raven: {
    talkChance: { welcome: 0.85, correct: 0.82, wrong: 0.72 },
    lines: {
      welcome: ['Gak.', 'Gaaak.'],
      correct: ['Gak gak!', 'Gaaak!', 'Krak!'],
      wrong: ['Gak?!', 'Gaaak...', 'Krrr...'],
    },
  },
  none: {
    talkChance: { welcome: 0, correct: 0, wrong: 0 },
    lines: {
      welcome: [],
      correct: [],
      wrong: [],
    },
  },
};

export function pickMascotQuip(
  mascotId: AnyMascotId,
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
