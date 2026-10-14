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
      // "Avans verdi" durumundayken doğru bildi:
      // Bazen "Devam Ediyor", bazen "Durdurulamıyor"
      const pickUnstoppable = nextStreak >= 5 ? randomFn() < 0.5 : false;
      const title = pickUnstoppable ? 'Durdurulamıyor! 🌊' : 'Devam Ediyor! 💧';
      const subtitle = `${nextStreak}'de ${nextStreak}`;

      return {
        nextState: { currentStreak: nextStreak, hasGrace: false },
        event: {
          type: 'grace_saved',
          title,
          subtitle,
          icon: pickUnstoppable ? '🌊' : '💧',
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

    // 2 .. 5 arası standart sayım: 2'de 2 ... 5'te 5
    if (nextStreak >= 2 && nextStreak <= 5) {
      const label = `${nextStreak}'de ${nextStreak}`;
      return {
        nextState: { currentStreak: nextStreak, hasGrace: false },
        event: {
          type: 'combo',
          title: label,
          subtitle: nextStreak >= 4 ? 'Su Gibi Akıyor! 💧' : 'Harika Seri! ✨',
          icon: nextStreak >= 4 ? '🌊' : '💧',
          badgeClass: 'combo-water',
        },
      };
    }

    // 6 ve 7 serisi: Bazen "6'da 6" / "7'de 7", bazen doğrudan "Durdurulamıyor!"
    if (nextStreak === 6 || nextStreak === 7) {
      const pickUnstoppable = randomFn() < 0.5;
      const title = pickUnstoppable ? 'Durdurulamıyor! 🌊' : `${nextStreak}'de ${nextStreak}`;
      return {
        nextState: { currentStreak: nextStreak, hasGrace: false },
        event: {
          type: pickUnstoppable ? 'unstoppable' : 'combo',
          title,
          subtitle: pickUnstoppable ? `${nextStreak}'de ${nextStreak} • Çağlayan Gibi!` : 'Durdurulamıyor! 🌊',
          icon: '🌊',
          badgeClass: 'combo-water',
        },
      };
    }

    // 8 ve üzeri: Kesin Durdurulamıyor
    return {
      nextState: { currentStreak: nextStreak, hasGrace: false },
      event: {
        type: 'unstoppable',
        title: 'Durdurulamıyor! 🌊',
        subtitle: `${nextStreak}'de ${nextStreak} • Tsunami Etkisi!`,
        icon: '🌊',
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
