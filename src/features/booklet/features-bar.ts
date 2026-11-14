import { state, store } from '../../app/state.ts';
import type { Choice } from '../../data/question.ts';
import { getExamPeriodKey } from '../subjects/exam-periods.ts';
import { getCardActionElements, getCardChoiceRow, getQuestionCards } from './card-query.ts';

/**
 * Tek bir sorunun özellik çubuğunu açar / kapatır.
 */
export function toggleQuestionFeatures(qId: number | string): void {
  const id = Number(qId);
  if (isNaN(id)) return;
  const isNowExpanded = store.toggleQuestionExpanded(id);

  // Hem kitapçıktaki hem tuvaldeki (akıllı tahta) ilgili kartları senkron güncelle
  getQuestionCards(id).forEach(card => {
    const drawer = card.querySelector('.q-features-drawer');
    const icon = card.querySelector('.btn-features-toggle .features-toggle-icon');
    if (drawer) drawer.classList.toggle('is-expanded', isNowExpanded);
    if (icon) icon.textContent = isNowExpanded ? '‹' : '›';
  });
}

/**
 * Tüm soru kartlarının özellik çubuklarını genel olarak açar / kapatır.
 */
export function toggleFeaturesBar(): void {
  store.toggleFeaturesExpanded();
  updateFeaturesBarUI();
}

/**
 * Sayfadaki tüm özellik çekmecelerini state.isFeaturesExpanded durumuna göre senkronlar.
 */
export function updateFeaturesBarUI(): void {
  if (typeof document === 'undefined') return;
  const isExpanded = Boolean(state.isFeaturesExpanded);
  document.querySelectorAll('.q-features-drawer').forEach(el => {
    el.classList.toggle('is-expanded', isExpanded);
  });
  document.querySelectorAll('.btn-features-toggle .features-toggle-icon').forEach(icon => {
    icon.textContent = isExpanded ? '‹' : '›';
  });
}

/**
 * Soru için bir yanlış şıkkı kırmızıyla (marked-incorrect) eler veya geri alır.
 */
export function eliminateOneWrongChoice(qId: number | string, event?: Event): void {
  if (event) {
    event.stopPropagation();
    event.preventDefault();
  }
  const id = Number(qId);
  if (isNaN(id)) return;

  const q = state.bookletQuestions.find(item => item.id === id) || state.allData.find(item => item.id === id);
  if (!q || q.sekilli) return;

  const hasDom = typeof document !== 'undefined';
  const currentEliminated = state.eliminatedWrongChoices[id];

  // Zaten bir yanlış şık elenmişse, butona tekrar tıklamak elemeyi geri alır (toggle)
  if (currentEliminated) {
    store.removeEliminatedWrongChoice(id);
    if (hasDom) {
      getQuestionCards(id).forEach(card => {
        const row = getCardChoiceRow(card, currentEliminated);
        if (row && state.userMarkedChoices[id] !== currentEliminated) {
          row.classList.remove('marked-incorrect');
        }
        getCardActionElements(card, 'eliminate-wrong-choice').forEach(btn => {
          btn.classList.remove('active');
          btn.setAttribute('title', 'Bir Yanlış Şıkkı Ele');
        });
      });
    }
    return;
  }

  // Sorunun mevcut şıkları
  const availableChoices: Choice[] = (q.secenekler && q.secenekler['E'])
    ? ['A', 'B', 'C', 'D', 'E']
    : ['A', 'B', 'C', 'D'];

  // Doğru cevap ve kullanıcının seçtiği şık dışındaki yanlış şıklar
  const wrongChoices = availableChoices.filter(c => c !== q.dogru_cevap && state.userMarkedChoices[id] !== c);
  if (wrongChoices.length === 0) return;

  // İlk uygun yanlış şıkkı seç (kullanıcının long-press ile elediklerinden farklı olanı önceliklendir)
  const userEliminated = state.eliminatedChoices[id] || [];
  const choiceToEliminate = wrongChoices.find(c => !userEliminated.includes(c)) || wrongChoices[0];

  store.setEliminatedWrongChoice(id, choiceToEliminate);

  if (hasDom) {
    getQuestionCards(id).forEach(card => {
      getCardChoiceRow(card, choiceToEliminate)?.classList.add('marked-incorrect');
      getCardActionElements(card, 'eliminate-wrong-choice').forEach(btn => {
        btn.classList.add('active');
        btn.setAttribute('title', `Elenen Yanlış Şık: ${choiceToEliminate} (Geri almak için tıkla)`);
      });
    });
  }
}

/**
 * Soru metnini ve şıklarını temiz metin olarak panoya kopyalar.
 */
export async function copyQuestionText(qId: number | string, event?: Event): Promise<boolean> {
  if (event) {
    event.stopPropagation();
    event.preventDefault();
  }
  const id = Number(qId);
  if (isNaN(id)) return false;

  const q = state.bookletQuestions.find(item => item.id === id) || state.allData.find(item => item.id === id);
  if (!q) return false;

  const lines: string[] = [];
  const course = q.ders ? q.ders.trim() : 'AÖL';
  const examInfo = getExamPeriodKey(q);
  lines.push(`📖 ${course}${examInfo ? ` (${examInfo})` : ''} - Soru #${id}:`);
  lines.push('');
  lines.push(q.soru.trim());
  lines.push('');

  const choices: Choice[] = (q.secenekler && q.secenekler['E'])
    ? ['A', 'B', 'C', 'D', 'E']
    : ['A', 'B', 'C', 'D'];

  choices.forEach(letter => {
    if (q.secenekler && q.secenekler[letter]) {
      lines.push(`${letter}) ${q.secenekler[letter].trim()}`);
    }
  });

  const fullText = lines.join('\n');
  let success = false;

  if (typeof navigator !== 'undefined' && navigator.clipboard && navigator.clipboard.writeText) {
    try {
      await navigator.clipboard.writeText(fullText);
      success = true;
    } catch {
      success = false;
    }
  }

  getQuestionCards(id).forEach(card => {
    getCardActionElements(card, 'copy-question-text').forEach(btn => {
      const originalTitle = btn.getAttribute('title') || 'Soruyu Kopyala';
      btn.classList.add('copied');
      btn.setAttribute('title', success ? 'Kopyalandı! ✓' : 'Kopyalanamadı');
      setTimeout(() => {
        btn.classList.remove('copied');
        btn.setAttribute('title', originalTitle);
      }, 1600);
    });
  });

  return success;
}

export const svgXraySoundOn = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 13a2 2 0 0 0 2-2V7a2 2 0 0 1 4 0v13a2 2 0 0 0 4 0V4a2 2 0 0 1 4 0v13a2 2 0 0 0 4 0v-4a2 2 0 0 1 2-2"/></svg>`;
export const svgXraySoundOff = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 13a2 2 0 0 0 2-2V7a2 2 0 0 1 4 0v13a2 2 0 0 0 4 0V4a2 2 0 0 1 4 0v13a2 2 0 0 0 4 0v-4a2 2 0 0 1 2-2" opacity="0.45"/><line x1="2" x2="22" y1="2" y2="22"/></svg>`;

/**
 * Ses olayları (ünlü/ünsüz) katmanını tüm sorularda global olarak açar / kapatır.
 */
export function toggleGrammarLayer(_qId?: number | string, layer: 'syntax' | 'pos' | 'sound' = 'sound', event?: Event): void {
  if (event) {
    event.stopPropagation();
    event.preventDefault();
  }
  if (layer !== 'sound') return;

  const isEnabled = store.toggleXraySound();
  if (typeof document === 'undefined') return;

  document.querySelectorAll<HTMLElement>('.booklet-question').forEach(card => {
    card.classList.toggle('hide-sound', !isEnabled);
  });
  document.querySelectorAll<HTMLElement>('[data-action="toggle-xray-sound"]').forEach(btn => {
    btn.classList.toggle('active', isEnabled);
    btn.innerHTML = isEnabled ? svgXraySoundOn : svgXraySoundOff;
    btn.setAttribute(
      'title',
      isEnabled
        ? 'Ses Olayları (Ünlü/Ünsüz) Açık — Tüm sorularda kapatmak için tıkla'
        : 'Ses Olayları (Ünlü/Ünsüz) Kapalı — Tüm sorularda açmak için tıkla'
    );
  });
}


