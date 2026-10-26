import { escapeHtml } from '../../shared/escape.ts';
import { formatConceptBubbleHtml } from '../../shared/math-render.ts';

export const MEB_TRAPS_DICT = {};

import rawVocabDict from '../../data/generated/vocab_dict.json';
export const MEB_VOCAB_DICT = rawVocabDict;

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

/**
 * Ayraca (|) tıklandığında önceki kelime öbeğini ve ögenin adını kesir formatında üretir.
 */
function renderJunctionFraction(el, trText) {
  const match = trText.match(/(?:⬅\s*(?:&lt;b&gt;|<b>)?Önceki:?(?:&lt;\/b&gt;|<\/b>)?\s*)([^<&]+)/i);
  let leftRole = match ? match[1].trim() : '';
  if (!leftRole) {
    const title = el.getAttribute('title') || '';
    const titleMatch = title.match(/Öge Sınırı:\s*([^|]+)/i);
    leftRole = titleMatch ? titleMatch[1].trim() : 'Öge';
  }

  let prevText = '';
  let node = el.previousSibling;
  while (node) {
    if (node.nodeType === 3) {
      prevText = node.textContent + prevText;
    } else if (node.nodeType === 1) {
      if (node.classList && node.classList.contains('xray-junction')) {
        break;
      }
      prevText = node.textContent + prevText;
    }
    node = node.previousSibling;
  }
  const sentParts = prevText.split(/(?<=[.?!•])\s+/);
  let segment = sentParts[sentParts.length - 1].trim();
  segment = segment.replace(/^[•\s]+/, '').replace(/[,;]+$/, '').trim();

  let roleColor = '#2563eb';
  if (leftRole.includes('Özne')) roleColor = '#2563eb';
  else if (leftRole.includes('Yüklem')) roleColor = '#e11d48';
  else if (leftRole.includes('Nesne')) roleColor = '#059669';
  else if (leftRole.includes('Zarf')) roleColor = '#d97706';
  else if (leftRole.includes('Dolaylı') || leftRole.includes('Tümleç') || leftRole.includes('Yer')) roleColor = '#4f46e5';

  return {
    roleColor,
    html: `
      <div class="xray-fraction-card">
        <div class="xray-fraction-phrase">${escapeHtml(segment || '...')}</div>
        <div class="xray-fraction-bar" style="background:${roleColor};"></div>
        <div class="xray-fraction-role" style="color:${roleColor};">${escapeHtml(leftRole)}</div>
      </div>
    `
  };
}

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

  const isJunction = el.classList.contains('xray-junction');
  let junctionData = null;
  let grammarColor = null;

  if (isJunction) {
    junctionData = renderJunctionFraction(el, trText);
    grammarColor = junctionData.roleColor;
  } else if (el.closest('.xray-sub')) grammarColor = '#2563eb';
  else if (el.closest('.xray-verb')) grammarColor = '#e11d48';
  else if (el.closest('.xray-obj')) grammarColor = '#059669';
  else if (el.closest('.xray-adv')) grammarColor = '#d97706';

  if (grammarColor) {
    bubble.style.borderColor = grammarColor;
    bubble.style.setProperty('--vocab-bubble-accent', grammarColor);
    bubble.style.boxShadow = `0 10px 28px -4px ${grammarColor}40, 0 3px 8px rgba(0,0,0,0.12)`;
  }

  let mainContent = '';
  let subContent = '';

  if (isJunction && junctionData) {
    mainContent = junctionData.html;
    subContent = ''; // Ayracın balonunda ampule veya alt notlara gerek yok
  } else if (trText && arText) {
    mainContent = `<span class="vocab-bubble-main"><span>${escapeHtml(trText)}</span> <span style="opacity:0.4; font-weight:400;">|</span> <span dir="rtl" style="font-family:'Amiri','Segoe UI',serif;">${escapeHtml(arText)}</span></span>`;
  } else {
    const rawVal = trText || arText;
    const parts = rawVal.split(/\s*---+\s*/);
    if (parts.length > 1) {
      const renderedParts = parts
        .map((p, idx) => {
          const isLatest = idx === parts.length - 1;
          const style = isLatest ? 'font-weight:600;' : 'opacity:0.85; font-size:0.92em; font-weight:500;';
          return `<div style="${style}">${formatConceptBubbleHtml(p.trim())}</div>`;
        })
        .join('<div class="vocab-bubble-divider" style="margin:5px 0; border-top:1px dashed color-mix(in srgb, currentColor 25%, transparent);"></div>');
      mainContent = `<span class="vocab-bubble-main">${renderedParts}</span>`;
    } else {
      mainContent = `<span class="vocab-bubble-main">${formatConceptBubbleHtml(rawVal)}</span>`;
    }
  }

  if (!isJunction && noteText) {
    subContent = `<span class="vocab-bubble-sub">${escapeHtml(noteText)}</span>`;
  }

  bubble.innerHTML = mainContent + subContent;
  document.body.appendChild(bubble);

  const rect = el.getBoundingClientRect();
  const scrollLeft = window.pageXOffset || document.documentElement.scrollLeft;
  const scrollTop = window.pageYOffset || document.documentElement.scrollTop;

  let top = rect.top + scrollTop;
  const targetCenterX = rect.left + scrollLeft + (rect.width / 2);

  if (rect.top < 65) {
    bubble.classList.add('bubble-below');
    top = rect.bottom + scrollTop;
  }

  bubble.style.top = top + 'px';

  // Kapsayıcı (Soru kartı veya sayfa sütunu) sınırlarına göre genişliği sınırla
  const questionCard = el.closest('.booklet-question');
  const containerRect = questionCard ? questionCard.getBoundingClientRect() : document.body.getBoundingClientRect();
  const containerLeft = containerRect.left + scrollLeft;
  const containerRight = containerRect.right + scrollLeft;
  const maxAllowedWidth = Math.min(380, Math.max(220, containerRect.width - 16));
  bubble.style.maxWidth = `${maxAllowedWidth}px`;

  const bubbleRect = bubble.getBoundingClientRect();
  const halfWidth = bubbleRect.width / 2;

  // Balon merkezini hedefin üstüne koy, ancak kart sınırlarında kenetle
  let adjustedLeft = targetCenterX;
  const minLeft = containerLeft + halfWidth + 8;
  const maxLeft = containerRight - halfWidth - 8;

  if (adjustedLeft < minLeft) {
    adjustedLeft = minLeft;
  } else if (adjustedLeft > maxLeft) {
    adjustedLeft = maxLeft;
  }
  bubble.style.left = adjustedLeft + 'px';

  // Sivri oku doğrudan tıklanan kelimenin merkezine kilitle
  const arrowPos = Math.max(14, Math.min(bubbleRect.width - 14, targetCenterX - (adjustedLeft - halfWidth)));
  bubble.style.setProperty('--arrow-left', `${arrowPos}px`);

  // Uzun kavramlar için daha geniş okuma süresi (9 saniye)
  const isLongText = (trText.length + noteText.length) > 30;
  const timeoutMs = isLongText ? 9000 : 2800;

  activeVocabTimeout = setTimeout(() => {
    bubble.style.animation = 'vocabPopOut 0.2s cubic-bezier(0.16, 1, 0.3, 1) forwards';
    setTimeout(() => {
      bubble.remove();
      if (activeVocabWordEl === el) {
        el.classList.remove('vocab-active');
        activeVocabWordEl = null;
      }
    }, 180);
  }, timeoutMs);
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
