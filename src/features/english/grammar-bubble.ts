import { escapeHtml } from '../../shared/escape.ts';

export interface GrammarLabels {
  posLabel: string;
  soundLabel: string;
}

export interface JunctionData {
  roleColor: string;
  html: string;
}

export function getGrammarColor(el: HTMLElement): string | null {
  if (el.classList.contains('pos-adj')) return 'var(--pos-adj)';
  if (el.classList.contains('pos-pron')) return 'var(--pos-pron)';
  if (el.classList.contains('pos-adv')) return 'var(--pos-adv)';
  if (el.classList.contains('pos-verbal')) return 'var(--pos-verbal)';
  if (el.classList.contains('pos-edat')) return 'var(--pos-edat)';
  if (el.classList.contains('pos-conj')) return 'var(--pos-conj)';
  if (el.classList.contains('pos-noun')) return 'var(--pos-noun)';
  if (el.classList.contains('pos-tamlama')) return 'var(--pos-tamlama)';
  if (el.classList.contains('sound-word')) return 'var(--pos-edat)';
  return null;
}

export function getPosColor(el: HTMLElement): string {
  return getGrammarColor(el) || 'currentColor';
}

export function extractGrammarLabels(
  el: HTMLElement,
  trText: string,
  noteText: string
): GrammarLabels | null {
  const isPos = el.classList.contains('pos-word');
  const isSound = el.classList.contains('sound-word') || el.classList.contains('has-sound');
  if (!isPos && !isSound) return null;

  let posLabel = '';
  let soundLabel = '';

  if (isPos) {
    if (noteText) {
      posLabel = noteText;
    } else {
      const match = trText.match(/(?:&lt;b&gt;|<b>)([\s\S]*?)(?:&lt;\/b&gt;|<\/b>)/);
      if (match && !match[1].startsWith('🔊')) {
        posLabel = match[1].replace(/:$/, '').trim();
      }
    }
  }

  if (isSound) {
    if (el.classList.contains('sound-word') && noteText) {
      soundLabel = noteText;
    } else {
      const soundMatch = trText.match(/🔊\s*(?:&lt;b&gt;|<b>)?([^<:]+)/);
      if (soundMatch) {
        soundLabel = soundMatch[1].replace(/&lt;\/b&gt;|<\/b>/gi, '').trim();
        soundLabel = soundLabel.replace(/\s*\([a-zçğıöşüA-ZÇĞİÖŞÜ\s'-]+\)$/i, (m) => {
          const lower = m.toLowerCase();
          if (
            lower.includes('sertleş') ||
            lower.includes('aşınma') ||
            lower.includes('hece') ||
            lower.includes('değişim')
          ) {
            return m;
          }
          return '';
        }).trim();
      }
    }

    if (soundLabel) {
      if (!soundLabel.startsWith('🔊') && !/[\u{1F300}-\u{1F9FF}]/u.test(soundLabel)) {
        let icon = '🔊';
        if (soundLabel.includes('Düşmesi')) icon = soundLabel.includes('Ünsüz') ? '🪂' : '🍂';
        else if (soundLabel.includes('Benzeşme') && soundLabel.includes('Yumuşama')) icon = '🪨☁️';
        else if (soundLabel.includes('Benzeşme')) icon = '🪨';
        else if (soundLabel.includes('Yumuşama')) icon = '☁️';
        else if (soundLabel.includes('Türeme')) icon = '🤰';
        else if (soundLabel.includes('Daralma')) icon = '🤏';
        else if (soundLabel.includes('N-M')) icon = '👄';
        soundLabel = `${icon} ${soundLabel}`;
      }
    }
  }

  if (!posLabel && !soundLabel) return null;
  return { posLabel, soundLabel };
}

/**
 * Ayraca (|) tıklandığında önceki kelime öbeğini ve ögenin adını kesir formatında üretir.
 */
export function renderJunctionFraction(el: HTMLElement, trText: string): JunctionData {
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
      prevText = (node.textContent || '') + prevText;
    } else if (node.nodeType === 1) {
      const elNode = node as HTMLElement;
      if (elNode.classList && elNode.classList.contains('xray-junction')) {
        break;
      }
      prevText = (elNode.textContent || '') + prevText;
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
