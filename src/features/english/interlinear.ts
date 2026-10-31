import { state } from '../../app/state.ts';
import { escapeHtml } from '../../shared/escape.ts';
import { isEnglishQuestion } from '../../shared/english-utils.ts';
import type { Question } from '../../data/question.ts';
import { MEB_VOCAB_DICT, CONTRACTIONS_BREAKDOWN, enrichEnglishVocab } from './vocabulary.js';

/** Aktif olarak kelime meali açık olan soruların kimlikleri (modüle özel geçici durum) */
const activeMealQuestionIds = new Set<number>();

export function isQuestionMealActive(qid: number | string): boolean {
  return activeMealQuestionIds.has(Number(qid));
}

/** Kelime anlamını sadeleştirir (parantez içi açıklamaları ve çoklu alternatifleri kısaltır). */
export function cleanGloss(raw: string): string {
  if (!raw) return '';
  // İlk anlamı al (örn. "yapmak / etmek" -> "yapmak")
  let cleaned = raw.split('/')[0].trim();
  // Parantez içi açıklamaları temizle (örn. "saat (tam saat)" -> "saat")
  cleaned = cleaned.replace(/\s*\([^)]*\)\s*/g, ' ').trim();
  return cleaned;
}

/** Tek bir İngilizce kelimenin Türkçe meal karşılığını döner. */
export function getWordTurkishGloss(word: string): string | null {
  if (!word || word.length < 1) return null;
  const lower = word.toLowerCase();

  // 1. Kısaltmalar (I'm, don't, can't vb.)
  const contraction = (CONTRACTIONS_BREAKDOWN as Record<string, { tr: string }>)[lower];
  if (contraction && contraction.tr) {
    const gloss = cleanGloss(contraction.tr);
    if (gloss && gloss.toLowerCase() !== lower) return gloss;
  }

  // 2. MEB Kelime Sözlüğü
  const dict = MEB_VOCAB_DICT as Record<string, unknown>;
  if (dict[lower]) {
    const entry = dict[lower];
    const tr = Array.isArray(entry) ? String(entry[0] || '') : String(entry);
    const gloss = cleanGloss(tr);
    if (gloss && gloss.toLowerCase() !== lower) return gloss;
  }

  // 3. İyelik eki ('s) ile biten kelimeler
  if (lower.endsWith("'s") && lower.length > 2) {
    const base = lower.slice(0, -2);
    if (dict[base]) {
      const entry = dict[base];
      const tr = Array.isArray(entry) ? String(entry[0] || '') : String(entry);
      const gloss = cleanGloss(tr);
      if (gloss) return `${gloss} (-in)`;
    }
  }

  return null;
}

/**
 * İngilizce metni kelime meali (interlinear gloss) HTML'ine dönüştürür.
 * HTML etiketlerini ve özel karakterleri korur.
 */
export function renderInterlinearText(rawText: string): string {
  if (!rawText) return '';
  const TOKEN_REGEX = /(<[^>]+>)|([A-Za-z]+(?:'[A-Za-z]+)?)/g;

  return rawText.replace(TOKEN_REGEX, (_match, tag, word) => {
    if (tag) return tag;
    const gloss = getWordTurkishGloss(word);
    if (!gloss) {
      return escapeHtml(word);
    }
    const escapedWord = escapeHtml(word);
    const escapedGloss = escapeHtml(gloss);
    return `<ruby class="interlinear-word">${escapedWord}<rt class="interlinear-gloss">${escapedGloss}</rt></ruby>`;
  });
}

/**
 * Tek bir sorunun kartında kelime mealini açar veya kapatır (UI testi için).
 */
export function toggleQuestionMeal(qId: number | string, event?: Event): void {
  if (event) {
    event.stopPropagation();
    event.preventDefault();
  }
  const id = Number(qId);
  if (isNaN(id) || typeof document === 'undefined') return;

  const q = state.bookletQuestions.find(item => item.id === id) || state.allData.find(item => item.id === id);
  if (!q) return;

  const card = document.getElementById(`bq_${id}`);
  const btn = document.getElementById(`btnMeal_${id}`);
  const stem = document.getElementById(`stem_${id}`);
  if (!card) return;

  const isCurrentlyActive = activeMealQuestionIds.has(id);

  if (isCurrentlyActive) {
    activeMealQuestionIds.delete(id);
    card.classList.remove('has-interlinear');
    if (btn) {
      btn.classList.remove('active');
      btn.setAttribute('title', 'Kelime Meali (Alt Çeviri) Aç');
    }
    if (stem) {
      stem.innerHTML = enrichEnglishVocab(q.soru_xray || q.soru);
    }
    ['A', 'B', 'C', 'D', 'E'].forEach(letter => {
      const optChoice = (q.secenekler as Record<string, string>)[letter];
      if (optChoice) {
        const textContent = card.querySelector(`#opt_${id}_${letter} .choice-text-content`);
        if (textContent) {
          textContent.innerHTML = enrichEnglishVocab(optChoice);
        }
      }
    });
  } else {
    activeMealQuestionIds.add(id);
    card.classList.add('has-interlinear');
    if (btn) {
      btn.classList.add('active');
      btn.setAttribute('title', 'Kelime Mealini Kapat');
    }
    if (stem) {
      stem.innerHTML = renderInterlinearText(q.soru_xray || q.soru);
    }
    ['A', 'B', 'C', 'D', 'E'].forEach(letter => {
      const optChoice = (q.secenekler as Record<string, string>)[letter];
      if (optChoice) {
        const textContent = card.querySelector(`#opt_${id}_${letter} .choice-text-content`);
        if (textContent) {
          textContent.innerHTML = renderInterlinearText(optChoice);
        }
      }
    });
  }
}

/**
 * Yazdırma / PDF çıktısı için tüm kitapçıktaki İngilizce sorulara meali uygular veya geri alır.
 */
export function applyInterlinearToBooklet(enabled: boolean): void {
  if (typeof document === 'undefined') return;
  const container = document.getElementById('bookletPagesContainer');
  if (container) {
    container.classList.toggle('print-interlinear', enabled);
  }

  state.bookletQuestions.forEach(q => {
    if (!isEnglishQuestion(q)) return;
    const card = document.getElementById(`bq_${q.id}`);
    const stem = document.getElementById(`stem_${q.id}`);
    if (!card) return;

    if (enabled) {
      card.classList.add('has-interlinear');
      if (stem) {
        stem.innerHTML = renderInterlinearText(q.soru_xray || q.soru);
      }
      ['A', 'B', 'C', 'D', 'E'].forEach(letter => {
        const optChoice = (q.secenekler as Record<string, string>)[letter];
        if (optChoice) {
          const textContent = card.querySelector(`#opt_${q.id}_${letter} .choice-text-content`);
          if (textContent) {
            textContent.innerHTML = renderInterlinearText(optChoice);
          }
        }
      });
    } else {
      if (!activeMealQuestionIds.has(q.id)) {
        card.classList.remove('has-interlinear');
        if (stem) {
          stem.innerHTML = enrichEnglishVocab(q.soru_xray || q.soru);
        }
        ['A', 'B', 'C', 'D', 'E'].forEach(letter => {
          const optChoice = (q.secenekler as Record<string, string>)[letter];
          if (optChoice) {
            const textContent = card.querySelector(`#opt_${q.id}_${letter} .choice-text-content`);
            if (textContent) {
              textContent.innerHTML = enrichEnglishVocab(optChoice);
            }
          }
        });
      }
    }
  });
}
