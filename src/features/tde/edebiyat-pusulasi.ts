import { escapeHtml } from '../../shared/escape.ts';
import { MEB_ESER_DICT, MEB_YAZAR_DICT, type EserInfo, type YazarInfo } from './edebiyat-dict.ts';
import { MEB_DIVAN_GLOSAR, type DivanWordEntry } from './divan-glosar.ts';

let activePopoverEl: HTMLElement | null = null;
const factIndexMap = new Map<string, number>();

export interface HapFact {
  label: string;
  icon: string;
  detail: string;
}

export function getEntityFacts(key: string): { title: string; type: 'eser' | 'yazar'; facts: HapFact[] } | null {
  const normKey = key.toLowerCase().trim();
  const eser: EserInfo | undefined = MEB_ESER_DICT[normKey];
  if (eser) {
    const facts: HapFact[] = [
      { label: 'Yazar & Dönem', icon: '👤', detail: `${eser.yazar} • ${eser.donem}` },
      { label: 'Edebî Tür', icon: '📜', detail: eser.tur },
      { label: 'Ayrıştırıcı Sınav Bilgisi', icon: '⚡', detail: eser.ayristirici }
    ];
    if (eser.karakterler && eser.karakterler.length > 0) {
      facts.push({ label: 'Kilit Karakterler', icon: '🎭', detail: eser.karakterler.join(', ') });
    }
    return { title: eser.ad, type: 'eser', facts };
  }

  const yazar: YazarInfo | undefined = MEB_YAZAR_DICT[normKey];
  if (yazar) {
    const facts: HapFact[] = [
      { label: 'Unvan / Lakap', icon: '👑', detail: yazar.unvan },
      { label: 'Dönem & Anlayış', icon: '⏳', detail: `${yazar.donem}${yazar.akim ? ' • ' + yazar.akim : ''}` },
      { label: 'Kilit Eserleri', icon: '📚', detail: yazar.kilitEserler.join(', ') },
      { label: 'Ayrıştırıcı Sınav Bilgisi', icon: '⚡', detail: yazar.ayristirici }
    ];
    return { title: yazar.ad, type: 'yazar', facts };
  }

  return null;
}

export function enrichTdeContent(rawText: string): string {
  if (!rawText) return '';

  const sortedEserKeys = Object.keys(MEB_ESER_DICT).sort((a, b) => b.length - a.length);
  const sortedYazarKeys = Object.keys(MEB_YAZAR_DICT).sort((a, b) => b.length - a.length);
  const sortedDivanKeys = Object.keys(MEB_DIVAN_GLOSAR).sort((a, b) => b.length - a.length);

  let enriched = rawText;

  // 1. Eserler (Örn: "Mai ve Siyah", "Kutadgu Bilig")
  sortedEserKeys.forEach(key => {
    const regex = new RegExp(`(?<![a-zA-ZçğıöşüÇĞİÖŞÜ])(${escapeRegExp(key)})(?![a-zA-ZçğıöşüÇĞİÖŞÜ])`, 'gi');
    enriched = enriched.replace(regex, (m) => `___ESER_${key.replace(/[\s\-']/g, '_')}___${m}___ENDESER___`);
  });

  // 2. Yazarlar (Örn: "Halit Ziya Uşaklıgil", "Namık Kemal")
  sortedYazarKeys.forEach(key => {
    const regex = new RegExp(`(?<![a-zA-ZçğıöşüÇĞİÖŞÜ])(${escapeRegExp(key)})(?![a-zA-ZçğıöşüÇĞİÖŞÜ])`, 'gi');
    enriched = enriched.replace(regex, (m) => {
      if (m.includes('___ESER_')) return m;
      return `___YAZAR_${key.replace(/[\s\-']/g, '_')}___${m}___ENDYAZAR___`;
    });
  });

  // 3. Divan ve Tanzimat Glosarı (Örn: "giryan", "tahassür")
  sortedDivanKeys.forEach(key => {
    const regex = new RegExp(`(?<![a-zA-ZçğıöşüÇĞİÖŞÜ])(${escapeRegExp(key)})(?![a-zA-ZçğıöşüÇĞİÖŞÜ])`, 'gi');
    enriched = enriched.replace(regex, (m) => {
      if (m.includes('___ESER_') || m.includes('___YAZAR_')) return m;
      return `___DIVAN_${key.replace(/[\s\-']/g, '_')}___${m}___ENDDIVAN___`;
    });
  });

  enriched = enriched.replace(/___ESER_(.+?)___(.*?)___ENDESER___/g, (_match, code, text) => {
    const foundKey = sortedEserKeys.find(k => k.replace(/[\s\-']/g, '_') === code);
    if (!foundKey) return text;
    return `<span class="edeb-entity-badge is-eser" data-key="${escapeHtml(foundKey)}" data-kind="eser" onclick="showEdebiKimlikKarti(this, event)">${text}</span>`;
  });

  enriched = enriched.replace(/___YAZAR_(.+?)___(.*?)___ENDYAZAR___/g, (_match, code, text) => {
    const foundKey = sortedYazarKeys.find(k => k.replace(/[\s\-']/g, '_') === code);
    if (!foundKey) return text;
    return `<span class="edeb-entity-badge is-yazar" data-key="${escapeHtml(foundKey)}" data-kind="yazar" onclick="showEdebiKimlikKarti(this, event)">${text}</span>`;
  });

  enriched = enriched.replace(/___DIVAN_(.+?)___(.*?)___ENDDIVAN___/g, (_match, code, text) => {
    const foundKey = sortedDivanKeys.find(k => k.replace(/[\s\-']/g, '_') === code);
    if (!foundKey) return text;
    return `<span class="divan-vocab-badge" data-divan-key="${escapeHtml(foundKey)}" onclick="showDivanBubble(this, event)">${text}</span>`;
  });

  return enriched;
}

function escapeRegExp(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export function showEdebiKimlikKarti(el: HTMLElement, event: Event): void {
  if (event) {
    event.stopPropagation();
    event.preventDefault();
  }

  const key = el.getAttribute('data-key') || el.getAttribute('data-eser-key') || el.getAttribute('data-yazar-key');
  if (!key) return;

  const entityData = getEntityFacts(key);
  if (!entityData || entityData.facts.length === 0) return;

  hideTdePopups();

  // Sıradaki veya rastgele hap bilgiyi seç
  const currentIdx = factIndexMap.get(key) || 0;
  const nextIdx = (currentIdx + 1) % entityData.facts.length;
  factIndexMap.set(key, nextIdx);

  const fact = entityData.facts[currentIdx % entityData.facts.length];
  const tagLabel = entityData.type === 'eser' ? '📖 ESER' : '👤 YAZAR';
  const tagClass = entityData.type === 'eser' ? 'tag-eser' : 'tag-yazar';

  const card = document.createElement('div');
  card.className = 'edebiyat-mini-bubble';

  card.innerHTML = `
    <div class="edeb-bubble-header">
      <span class="edeb-badge-tag ${tagClass}">${tagLabel}</span>
      <span class="edeb-bubble-title">${escapeHtml(entityData.title)}</span>
      <button class="edeb-btn-close" onclick="hideTdePopups(event)" title="Kapat">✕</button>
    </div>
    <div class="edeb-fact-box" onclick="showEdebiKimlikKarti(document.querySelector('[data-key=\\'${escapeHtml(key)}\\']') || this, event)" title="Diğer hap bilgiyi gör">
      <div class="edeb-fact-label">${fact.icon} ${escapeHtml(fact.label)}</div>
      <div class="edeb-fact-detail">${escapeHtml(fact.detail)}</div>
    </div>
    <div class="edeb-bubble-footer" onclick="showEdebiKimlikKarti(document.querySelector('[data-key=\\'${escapeHtml(key)}\\']') || this, event)">
      🎲 Başka bir MEB hap bilgisi görmek için dokunun (${(currentIdx % entityData.facts.length) + 1}/${entityData.facts.length})
    </div>
  `;

  document.body.appendChild(card);
  activePopoverEl = card;
  positionFloatingElement(el, card);
}

export function showDivanBubble(el: HTMLElement, event: Event): void {
  if (event) {
    event.stopPropagation();
    event.preventDefault();
  }

  hideTdePopups();

  const key = el.getAttribute('data-divan-key');
  if (!key) return;
  const entry: DivanWordEntry | undefined = MEB_DIVAN_GLOSAR[key];
  if (!entry) return;

  const bubble = document.createElement('div');
  bubble.className = 'divan-glass-bubble';

  const mazmunHtml = entry.mazmun
    ? `<div class="divan-bubble-mazmun">💡 <strong>Mazmun:</strong> ${escapeHtml(entry.mazmun)}</div>`
    : '';

  bubble.innerHTML = `
    <div class="divan-bubble-top">
      <span class="divan-word-title">${escapeHtml(key)}</span>
      <span class="divan-word-osmanlica" title="Osmanlıca / Orijinal İmla">${escapeHtml(entry.osmanlica)}</span>
      <span class="divan-badge-koken">${escapeHtml(entry.koken)}</span>
      <button class="edeb-btn-close" onclick="hideTdePopups(event)" title="Kapat">✕</button>
    </div>
    <div class="divan-bubble-anlam">📖 <strong>Güncel Türkçe:</strong> ${escapeHtml(entry.anlam)}</div>
    ${mazmunHtml}
  `;

  document.body.appendChild(bubble);
  activePopoverEl = bubble;
  positionFloatingElement(el, bubble);
}

export function hideTdePopups(_event?: Event): void {
  if (activePopoverEl) {
    activePopoverEl.remove();
    activePopoverEl = null;
  }
}

function positionFloatingElement(triggerEl: HTMLElement, popupEl: HTMLElement): void {
  const rect = triggerEl.getBoundingClientRect();
  const popupRect = popupEl.getBoundingClientRect();

  let left = rect.left + (rect.width / 2) - (popupRect.width / 2);
  let top = rect.bottom + 8;

  if (left < 12) left = 12;
  if (left + popupRect.width > window.innerWidth - 12) {
    left = window.innerWidth - popupRect.width - 12;
  }

  if (top + popupRect.height > window.innerHeight - 12) {
    top = rect.top - popupRect.height - 8;
    if (top < 12) top = 12;
  }

  popupEl.style.position = 'fixed';
  popupEl.style.left = `${left}px`;
  popupEl.style.top = `${top}px`;
  popupEl.style.zIndex = '1100';
}

if (typeof document !== 'undefined') {
  document.addEventListener('click', (e) => {
    const target = e.target as HTMLElement | null;
    if (!target) return;
    if (target.closest('.edeb-entity-badge, .divan-vocab-badge, .edebiyat-mini-bubble, .divan-glass-bubble')) {
      return;
    }
    hideTdePopups();
  });
}
