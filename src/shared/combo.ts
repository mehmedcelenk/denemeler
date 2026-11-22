import { renderWhiteStarSvg } from './sky-rank.ts';

export interface ComboState {
  currentStreak: number;
  hasGrace: boolean; // "Avans verdi" durumu aktif mi?
}

export type ComboResultType =
  | 'progress'      // 1. doğru (henüz unvan yok)
  | 'combo'         // 2'de 2, 3'te 3 ...
  | 'unstoppable'   // Durdurulamıyor
  | 'grace_given'   // Avans verdi
  | 'grace_saved'   // Devam ediyor / Durdurulamıyor
  | 'broken'        // Buraya kadar (sıfırlandı)
  | 'none';         // Öncesinde seri yokken yapılan yanlış

export type ComboBadgeClass =
  | 'combo-star'
  | 'combo-nova'
  | 'combo-orbit'
  | 'combo-broken'
  | 'combo-tier';

export interface ComboEvent {
  type: ComboResultType;
  title: string;
  subtitle?: string;
  icon: string;
  badgeClass: ComboBadgeClass;
  skyLayer?: number;
}

const COMBO_TITLES: Readonly<Record<number, string>> = {
  2: 'Temiz başlangıç',
  3: 'Aynen böyle',
  4: 'Gözünden kaçmıyor',
  5: 'Üstad',
};

function getComboTitle(streak: number, randomFn: () => number): string {
  return COMBO_TITLES[streak] ?? (randomFn() < 0.5 ? 'Durdurulamıyor' : 'Maşallah');
}

function renderNovaStarSvg(): string {
  return '<svg class="sky-star-svg" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M11 2L13.4 9L20.4 11.4L13.4 13.8L11 20.8L8.6 13.8L1.6 11.4L8.6 9Z" fill="currentColor"/><path d="M19.2 3.2L20 5.4L22.2 6.2L20 7L19.2 9.2L18.4 7L16.2 6.2L18.4 5.4Z" fill="currentColor" opacity="0.9"/><path d="M18.6 15.8L19.2 17.4L20.8 18L19.2 18.6L18.6 20.2L18 18.6L16.4 18L18 17.4Z" fill="currentColor" opacity="0.78"/></svg>';
}

function renderOrbitCrescentSvg(): string {
  return '<svg class="sky-star-svg" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M18.8 14.9A7.8 7.8 0 0 1 9.1 5.2a7.8 7.8 0 1 0 9.7 9.7Z" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/><circle cx="17.5" cy="6.5" r="1.5" fill="currentColor"/></svg>';
}

function renderFadedStarSvg(): string {
  return '<svg class="sky-star-svg" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M12 2.4L14.3 9.4L21.3 11.7L14.3 14L12 21L9.7 14L2.7 11.7L9.7 9.4Z" stroke="currentColor" stroke-width="1.65" stroke-linejoin="round" opacity="0.72"/></svg>';
}

/**
 * Verilen durum ve cevap sonucuna göre bir sonraki kombo durumunu hesaplar.
 * randomFn: Deterministik testler için isteğe bağlı rastgele sayı üreteci (varsayılan: Math.random)
 */
export function evaluateCombo(
  state: ComboState,
  isCorrect: boolean,
  randomFn: () => number = Math.random
): { nextState: ComboState; event: ComboEvent | null } {
  if (isCorrect) {
    const nextStreak = state.currentStreak + 1;
    const isNova = nextStreak >= 6;

    if (state.hasGrace) {
      return {
        nextState: { currentStreak: nextStreak, hasGrace: false },
        event: {
          type: 'grace_saved',
          title: getComboTitle(nextStreak, randomFn),
          subtitle: `${nextStreak}'de ${nextStreak}`,
          icon: isNova ? renderNovaStarSvg() : renderWhiteStarSvg(20),
          badgeClass: isNova ? 'combo-nova' : 'combo-star',
        },
      };
    }

    // 1. doğru -> sessiz başlangıç
    if (nextStreak === 1) {
      return {
        nextState: { currentStreak: 1, hasGrace: false },
        event: null,
      };
    }

    const title = getComboTitle(nextStreak, randomFn);
    return {
      nextState: { currentStreak: nextStreak, hasGrace: false },
      event: {
        type: isNova && title === 'Durdurulamıyor' ? 'unstoppable' : 'combo',
        title,
        subtitle: `${nextStreak}'de ${nextStreak}`,
        icon: isNova ? renderNovaStarSvg() : renderWhiteStarSvg(20),
        badgeClass: isNova ? 'combo-nova' : 'combo-star',
      },
    };
  }

  // Yanlış cevap durumu:
  if (state.hasGrace) {
    // "Avans verdi" durumundan sonra bir kez daha bilemedi -> "Buraya kadar" ve seri sıfırlanır
    return {
      nextState: { currentStreak: 0, hasGrace: false },
      event: {
        type: 'broken',
        title: 'Buraya Kadar!',
        subtitle: 'Seri Sıfırlandı',
        icon: renderFadedStarSvg(),
        badgeClass: 'combo-broken',
      },
    };
  }

  // Henüz avans verilmemişti: en az 2'lik seride avans hakkı tanınır
  if (state.currentStreak >= 2) {
    return {
      nextState: { currentStreak: state.currentStreak, hasGrace: true },
      event: {
        type: 'grace_given',
        title: 'Avans Verdi',
        subtitle: 'Sonraki soruda telafi et!',
        icon: renderOrbitCrescentSvg(),
        badgeClass: 'combo-orbit',
      },
    };
  }

  // Seri 0 veya 1 iken yapılan yanlışta avans olmaz, sıfırlanır ve toast çıkmaz
  return {
    nextState: { currentStreak: 0, hasGrace: false },
    event: null,
  };
}
