import { state, store, notifyStateChange } from '../../app/state.ts';
import type { Choice } from '../../data/question.ts';

/**
 * Tek bir sorunun özellik çubuğunu açar / kapatır.
 */
export function toggleQuestionFeatures(qId: number | string): void {
  const id = Number(qId);
  if (isNaN(id)) return;
  const isNowExpanded = store.toggleQuestionExpanded(id);
  if (typeof document === 'undefined') return;
  const card = document.getElementById(`bq_${id}`);
  if (card) {
    const drawer = card.querySelector('.q-features-drawer');
    const icon = card.querySelector('.btn-features-toggle .features-toggle-icon');
    if (drawer) drawer.classList.toggle('is-expanded', isNowExpanded);
    if (icon) icon.textContent = isNowExpanded ? '‹' : '›';
  }
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
  const btn = hasDom ? document.getElementById(`btnEliminateWrong_${id}`) : null;
  const currentEliminated = state.eliminatedWrongChoices[id];

  // Zaten bir yanlış şık elenmişse, butona tekrar tıklamak elemeyi geri alır (toggle)
  if (currentEliminated) {
    store.removeEliminatedWrongChoice(id);
    const row = hasDom ? document.getElementById(`opt_${id}_${currentEliminated}`) : null;
    if (row && state.userMarkedChoices[id] !== currentEliminated) {
      row.classList.remove('marked-incorrect');
    }
    if (btn) {
      btn.classList.remove('active');
      btn.setAttribute('title', 'Bir Yanlış Şıkkı Ele');
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

  const row = hasDom ? document.getElementById(`opt_${id}_${choiceToEliminate}`) : null;
  if (row) {
    row.classList.add('marked-incorrect');
  }
  if (btn) {
    btn.classList.add('active');
    btn.setAttribute('title', `Elenen Yanlış Şık: ${choiceToEliminate} (Geri almak için tıkla)`);
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
  const examInfo = [q.yil ? `${q.yil}` : '', q.donem ? `${q.donem}. Dönem` : ''].filter(Boolean).join(' ');
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

  if (typeof document !== 'undefined') {
    const btn = document.getElementById(`btnCopy_${id}`);
    if (btn) {
      const originalTitle = btn.getAttribute('title') || 'Soruyu Kopyala';
      btn.classList.add('copied');
      btn.setAttribute('title', success ? 'Kopyalandı! ✓' : 'Kopyalanamadı');
      setTimeout(() => {
        btn.classList.remove('copied');
        btn.setAttribute('title', originalTitle);
      }, 1600);
    }
  }

  return success;
}

/**
 * Test: Türkçe dil bilgisi röntgen katmanlarını (syntax, pos, sound) bağımsız açar / kapatır.
 */
export function toggleGrammarLayer(qId: number | string, layer: 'syntax' | 'pos' | 'sound', event?: Event): void {
  if (event) {
    event.stopPropagation();
    event.preventDefault();
  }
  const id = Number(qId);
  if (isNaN(id) || typeof document === 'undefined') return;

  const card = document.getElementById(`bq_${id}`);
  if (!card) return;

  const className = `hide-${layer}`;
  const isNowHidden = card.classList.toggle(className);

  const btnId = layer === 'syntax' ? `btnXraySyntax_${id}` : layer === 'pos' ? `btnXrayPos_${id}` : `btnXraySound_${id}`;
  const btn = document.getElementById(btnId);
  if (btn) {
    btn.classList.toggle('active', !isNowHidden);
  }
}


