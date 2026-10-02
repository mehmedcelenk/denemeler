import { escapeHtml } from '../../shared/escape.ts';

import MEB_TRAPS_DICT from '../../data/generated/MEB_TRAPS_DICT.json';
export { MEB_TRAPS_DICT };

import MEB_VOCAB_DICT from '../../data/generated/MEB_VOCAB_DICT.json';
export { MEB_VOCAB_DICT };

export const CONTRACTIONS_BREAKDOWN = {
  "isn't": { tr: "değil", ar: "ليس", note: "is (-dır) + n't (olumsuzluk)" },
  "aren't": { tr: "değiller", ar: "ليسوا", note: "are (-dırlar) + n't (olumsuzluk)" },
  "wasn't": { tr: "değildi", ar: "لم يكن", note: "was (-idi) + n't (olumsuzluk)" },
  "weren't": { tr: "değildiler", ar: "لم يكونوا", note: "were (-idiler) + n't (olumsuzluk)" },
  "don't": { tr: "yapmam/yapmaz", ar: "لا / لا يفعل", note: "do (yapmak) + n't (geniş zaman olumsuz)" },
  "doesn't": { tr: "yapmaz/etmez", ar: "لا يفعل", note: "does (yapar) + n't (olumsuzluk)" },
  "didn't": { tr: "yapmadı/etmedi", ar: "لم يفعل", note: "did (yaptı) + n't (geçmiş zaman olumsuz)" },
  "can't": { tr: "yapamaz/edemez", ar: "لا يستطيع", note: "can (-ebilmek) + n't (yetersizlik)" },
  "won't": { tr: "yapmayacak", ar: "لن يفعل", note: "will (gelecek zaman) + n't (olumsuzluk)" },
  "haven't": { tr: "yapmadı / sahip değil", ar: "لم يسبq له", note: "have + n't (olumsuzluk)" },
  "hasn't": { tr: "yapmadı / sahip değil", ar: "لم يسبق له", note: "has + n't (olumsuzluk)" },
  "hadn't": { tr: "yapmamıştı", ar: "لم يكن قد", note: "had (-mişti) + n't (olumsuzluk)" },
  "wouldn't": { tr: "yapmazdı / etmezdi", ar: "ما كان ليفعل", note: "would (-erdi) + n't (olumsuzluk)" },
  "shouldn't": { tr: "yapmamalı", ar: "لا ينبغي", note: "should (-meli) + n't (olumsuz tavsiye)" },
  "couldn't": { tr: "yapamadı / edemedi", ar: "لم يستطع", note: "could (-ebildi) + n't (olumsuzluk)" },
  "mustn't": { tr: "yapmamalı (kesin yasak)", ar: "ممنوع", note: "must (zorunluluk) + n't (kesin yasak)" },
  "i'm": { tr: "ben (-im)", ar: "أنا", note: "I (ben) + 'm (am kısaltması)" },
  "you're": { tr: "sen (-sin) / siz (-siniz)", ar: "أنت / أنتم", note: "you + 're (are kısaltması)" },
  "he's": { tr: "o (-dur)", ar: "هو", note: "he (erkek) + 's (is kısaltması)" },
  "she's": { tr: "o (-dur)", ar: "هي", note: "she (kadın) + 's (is kısaltması)" },
  "it's": { tr: "o (-dur)", ar: "هو/هي لغير العاقل", note: "it (nesne/hayvan) + 's (is kısaltması)" },
  "we're": { tr: "biz (-iz)", ar: "نحن", note: "we + 're (are kısaltması)" },
  "they're": { tr: "onlar (-dırlar)", ar: "هم", note: "they + 're (are kısaltması)" }
};

export function enrichEnglishVocab(rawText) {
  if (!rawText) return '';
  const TOKEN_REGEX = /(<[^>]+>)|([A-Za-z]+(?:'[A-Za-z]+)?)/g;
  return rawText.replace(TOKEN_REGEX, (match, tag, word) => {
    if (tag) return tag;
    const lower = word.toLowerCase();
    const contraction = CONTRACTIONS_BREAKDOWN[lower];
    let tr = '';
    let ar = '';
    let note = '';

    if (contraction) {
      tr = contraction.tr;
      ar = contraction.ar;
      note = contraction.note || '';
    } else if (MEB_VOCAB_DICT[lower]) {
      const entry = MEB_VOCAB_DICT[lower];
      if (Array.isArray(entry)) {
        tr = entry[0] || '';
        ar = entry[1] || '';
      } else {
        tr = String(entry);
      }
    } else if (lower.endsWith("'s") && MEB_VOCAB_DICT[lower.slice(0, -2)]) {
      const entry = MEB_VOCAB_DICT[lower.slice(0, -2)];
      tr = (Array.isArray(entry) ? entry[0] : entry) + " (-in eki)";
      ar = (Array.isArray(entry) ? entry[1] : '') + " (ملكية)";
    }

    if (!tr && !ar) return word;
    const trAttr = escapeHtml(tr);
    const arAttr = escapeHtml(ar);
    const noteAttr = escapeHtml(note);
    return `<span class="vocab-word" data-tr="${trAttr}" data-ar="${arAttr}" data-note="${noteAttr}" onclick="showVocabBubble(this, event)">${word}</span>`;
  });
}

export let activeVocabTimeout = null;

export let activeVocabWordEl = null;

export function showVocabBubble(el, event) {
  if (event) {
    event.stopPropagation();
    event.preventDefault();
  }

  const trText = el.getAttribute('data-tr') || '';
  const arText = el.getAttribute('data-ar') || '';
  const noteText = el.getAttribute('data-note') || '';
  if (!trText && !arText) return;

  const existingBubble = document.getElementById('activeVocabBubble');
  if (existingBubble) existingBubble.remove();
  if (activeVocabWordEl) activeVocabWordEl.classList.remove('vocab-active');
  if (activeVocabTimeout) clearTimeout(activeVocabTimeout);

  activeVocabWordEl = el;
  el.classList.add('vocab-active');

  const bubble = document.createElement('div');
  bubble.id = 'activeVocabBubble';
  bubble.className = 'vocab-bubble';

  let grammarColor = null;
  if (el.closest('.xray-sub')) grammarColor = '#2563eb';
  else if (el.closest('.xray-verb')) grammarColor = '#e11d48';
  else if (el.closest('.xray-obj')) grammarColor = '#059669';
  else if (el.closest('.xray-adv')) grammarColor = '#d97706';

  if (grammarColor) {
    bubble.style.borderColor = grammarColor;
    bubble.style.setProperty('--vocab-bubble-accent', grammarColor);
    bubble.style.boxShadow = `0 10px 28px -4px ${grammarColor}40, 0 3px 8px rgba(0,0,0,0.12)`;
  }

  let mainContent = '';
  if (trText && arText) {
    mainContent = `<span class="vocab-bubble-main"><span>${escapeHtml(trText)}</span> <span style="opacity:0.4; font-weight:400;">|</span> <span dir="rtl" style="font-family:'Amiri','Segoe UI',serif;">${escapeHtml(arText)}</span></span>`;
  } else {
    mainContent = `<span class="vocab-bubble-main"><span>${escapeHtml(trText || arText)}</span></span>`;
  }

  let subContent = '';
  if (noteText) {
    subContent = `<span class="vocab-bubble-sub">${escapeHtml(noteText)}</span>`;
  }

  bubble.innerHTML = mainContent + subContent;
  document.body.appendChild(bubble);

  const rect = el.getBoundingClientRect();
  const scrollLeft = window.pageXOffset || document.documentElement.scrollLeft;
  const scrollTop = window.pageYOffset || document.documentElement.scrollTop;

  let top = rect.top + scrollTop;
  let left = rect.left + scrollLeft + (rect.width / 2);

  if (rect.top < 50) {
    bubble.classList.add('bubble-below');
    top = rect.bottom + scrollTop;
  }

  bubble.style.top = top + 'px';
  bubble.style.left = left + 'px';

  const bubbleRect = bubble.getBoundingClientRect();
  const viewportWidth = window.innerWidth || document.documentElement.clientWidth;
  const halfWidth = bubbleRect.width / 2;
  let adjustedLeft = left;
  if (adjustedLeft - halfWidth < 12) {
    adjustedLeft = 12 + halfWidth;
  } else if (adjustedLeft + halfWidth > viewportWidth - 12) {
    adjustedLeft = viewportWidth - 12 - halfWidth;
  }
  bubble.style.left = adjustedLeft + 'px';

  activeVocabTimeout = setTimeout(() => {
    bubble.style.animation = 'vocabPopOut 0.2s cubic-bezier(0.16, 1, 0.3, 1) forwards';
    setTimeout(() => {
      bubble.remove();
      if (activeVocabWordEl === el) {
        el.classList.remove('vocab-active');
        activeVocabWordEl = null;
      }
    }, 180);
  }, 2600);
}

if (typeof document !== 'undefined') {
  document.addEventListener('click', (e) => {
    if (!e.target.closest('.vocab-word') && !e.target.closest('.vocab-bubble')) {
      const existingBubble = document.getElementById('activeVocabBubble');
      if (existingBubble) {
        existingBubble.remove();
        if (activeVocabWordEl) {
          activeVocabWordEl.classList.remove('vocab-active');
          activeVocabWordEl = null;
        }
        if (activeVocabTimeout) clearTimeout(activeVocabTimeout);
      }
    }
  });
}
