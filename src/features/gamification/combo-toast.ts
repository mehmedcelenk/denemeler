import { evaluateCombo, type ComboState, type ComboEvent } from '../../shared/combo.ts';

let comboState: ComboState = {
  currentStreak: 0,
  hasGrace: false,
};

let toastTimeout: ReturnType<typeof setTimeout> | null = null;

export function getComboState(): Readonly<ComboState> {
  return comboState;
}

export function resetComboState(): void {
  comboState = { currentStreak: 0, hasGrace: false };
}

/**
 * Kullanıcı bir soruya cevap verdiğinde çağrılır.
 */
export function recordAnswerForCombo(isCorrect: boolean): ComboEvent | null {
  const result = evaluateCombo(comboState, isCorrect);
  comboState = result.nextState;

  if (result.event) {
    showComboToast(result.event);
  }

  return result.event;
}

/**
 * Ekranın üst-orta kısmında gösterişli bir rozet / toast bildirimi patlatır.
 */
export function showComboToast(event: ComboEvent): void {
  if (typeof document === 'undefined') return;

  let toast = document.getElementById('comboToastContainer');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'comboToastContainer';
    toast.className = 'combo-toast-container';
    document.body.appendChild(toast);
  }

  if (toastTimeout) {
    clearTimeout(toastTimeout);
    toastTimeout = null;
  }

  toast.className = `combo-toast-container ${event.badgeClass}`;
  toast.innerHTML = `
    <div class="combo-toast-inner">
      <div class="combo-toast-icon">${event.icon}</div>
      <div class="combo-toast-content">
        <span class="combo-toast-title">${event.title}</span>
        ${event.subtitle ? `<span class="combo-toast-subtitle">${event.subtitle}</span>` : ''}
      </div>
    </div>
  `;

  // Reflow tetikle ve görünür yap
  void toast.offsetWidth;
  toast.classList.add('combo-toast-visible');

  toastTimeout = setTimeout(() => {
    if (toast) {
      toast.classList.remove('combo-toast-visible');
    }
    toastTimeout = null;
  }, 2200);
}

