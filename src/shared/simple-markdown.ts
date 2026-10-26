import { escapeHtml } from './escape.ts';

function formatInline(text: string): string {
  return text
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*([^*\n]+?)\*/g, '<em>$1</em>')
    .replace(/_([_\n]+?)_/g, '<em>$1</em>')
    .replace(/`([^`\n]+?)`/g, '<code class="ai-md-code">$1</code>');
}

/**
 * AI yanıtları için XSS-güvenli, minimalist Markdown -> HTML çevirici.
 * Girdi önce HTML karakterlerinden arındırılır, ardından yalnızca güvenli
 * etiketler (strong, em, code, ul, ol, li, blockquote, p) üretilir.
 */
export function formatAiMarkdown(raw: string | null | undefined): string {
  if (!raw) return '';
  const safe = escapeHtml(raw).trim();
  if (!safe) return '';

  const lines = safe.split(/\r?\n/);
  const blocks: string[] = [];
  let currentListType: 'ul' | 'ol' | null = null;
  let currentParaLines: string[] = [];

  const flushParagraph = (): void => {
    if (currentParaLines.length > 0) {
      blocks.push(`<p class="ai-md-p">${currentParaLines.map(formatInline).join('<br>')}</p>`);
      currentParaLines = [];
    }
  };

  const flushList = (): void => {
    if (currentListType) {
      blocks.push(`</${currentListType}>`);
      currentListType = null;
    }
  };

  for (const rawLine of lines) {
    const line = rawLine.trim();

    if (!line) {
      flushParagraph();
      flushList();
      continue;
    }

    // Başlık (# Başlık)
    const hMatch = line.match(/^#{1,4}\s+(.+)$/);
    if (hMatch) {
      flushParagraph();
      flushList();
      blocks.push(`<h4 class="ai-md-h">${formatInline(hMatch[1])}</h4>`);
      continue;
    }

    // Alıntı (&gt; metin)
    if (line.startsWith('&gt;')) {
      flushParagraph();
      flushList();
      const quoteText = line.replace(/^&gt;\s*/, '');
      blocks.push(`<blockquote class="ai-md-quote">${formatInline(quoteText)}</blockquote>`);
      continue;
    }

    // Madde imi (* veya - veya •)
    const ulMatch = line.match(/^(\*|-|•)\s+(.+)$/);
    if (ulMatch) {
      flushParagraph();
      if (currentListType !== 'ul') {
        flushList();
        blocks.push('<ul class="ai-md-list">');
        currentListType = 'ul';
      }
      blocks.push(`<li>${formatInline(ulMatch[2])}</li>`);
      continue;
    }

    // Numaralı liste (1. veya 2.)
    const olMatch = line.match(/^(\d+)\.\s+(.+)$/);
    if (olMatch) {
      flushParagraph();
      if (currentListType !== 'ol') {
        flushList();
        blocks.push('<ol class="ai-md-list">');
        currentListType = 'ol';
      }
      blocks.push(`<li>${formatInline(olMatch[2])}</li>`);
      continue;
    }

    // Normal paragraf satırı
    flushList();
    currentParaLines.push(line);
  }

  flushParagraph();
  flushList();

  return blocks.join('');
}
