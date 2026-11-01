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

export interface ComboEvent {
  type: ComboResultType;
  title: string;
  subtitle?: string;
  icon: string;
  badgeClass: 'combo-water' | 'combo-earth' | 'combo-broken';
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

    if (state.hasGrace) {
      return {
        nextState: { currentStreak: nextStreak, hasGrace: false },
        event: {
          type: 'grace_saved',
          title: getComboTitle(nextStreak, randomFn),
          subtitle: `${nextStreak}'de ${nextStreak}`,
          icon: nextStreak >= 6 ? '🌊' : '💧',
          badgeClass: 'combo-water',
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
        type: nextStreak >= 6 && title === 'Durdurulamıyor' ? 'unstoppable' : 'combo',
        title,
        subtitle: `${nextStreak}'de ${nextStreak}`,
        icon: nextStreak >= 6 ? '🌊' : '💧',
        badgeClass: 'combo-water',
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
        title: 'Buraya Kadar! 💧',
        subtitle: 'Seri Sıfırlandı',
        icon: '🫧',
        badgeClass: 'combo-broken',
      },
    };
  }

  // Henüz avans verilmemişti:
  // Eğer en az 2'lik bir serisi varsa avans hakkı tanınır (kalkan emojisi YOK)
  if (state.currentStreak >= 2) {
    return {
      nextState: { currentStreak: state.currentStreak, hasGrace: true },
      event: {
        type: 'grace_given',
        title: 'Avans Verdi',
        subtitle: 'Sonraki soruda telafi et!',
        icon: '🌱',
        badgeClass: 'combo-earth',
      },
    };
  }

  // Seri 0 veya 1 iken yapılan yanlışta avans olmaz, sıfırlanır ve toast çıkmaz
  return {
    nextState: { currentStreak: 0, hasGrace: false },
    event: null,
  };
}
