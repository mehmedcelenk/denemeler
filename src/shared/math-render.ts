import katex from 'katex';
import { escapeHtml } from './escape.ts';

/**
 * LaTeX / KaTeX ifadelerini HTML'e dönüştürür.
 * Güvenlik: Matematik dışı metinler escapeHtml ile korunur.
 */
export function renderMathFormula(latex: string, displayMode = false): string {
  try {
    return katex.renderToString(latex, {
      displayMode,
      throwOnError: false,
      output: 'htmlAndMathml',
    });
  } catch {
    return escapeHtml(latex);
  }
}

/**
 * Matematik ve fen sorularında düz metin içindeki formülleri veya LaTeX bloklarını tespit edip render eder.
 */
export function renderMathText(rawText: string): string {
  if (!rawText) return '';

  // 1. $...$ veya \(...\) blokları varsa KaTeX ile render et
  let text = rawText;

  // Çift dolar ($$...$$) veya \[...\] - display mode
  text = text.replace(/\$\$([\s\S]+?)\$\$|\\\[([\s\S]+?)\\\]/g, (_match, g1, g2) => {
    const math = g1 || g2;
    return renderMathFormula(math.trim(), true);
  });

  // Tek dolar ($...$) veya \(...\) - inline mode
  text = text.replace(/\$([^\$\n]+?)\$|\\\(([\s\S]+?)\\\)/g, (_match, g1, g2) => {
    const math = g1 || g2;
    return renderMathFormula(math.trim(), false);
  });

  // Eğer zaten KaTeX span'leri içeriyorsa geri kalan metni işle
  if (text.includes('class="katex"')) {
    return text;
  }

  // Özel matematiksel sembol ve gösterimleri zenginleştir (örn: x² + 6x + 10 = 0, √12, Δ)
  return enrichCommonMathText(rawText);
}

/**
 * X-Ray (kavram balonlu HTML) içeren matematik sorularında hem <span class="vocab-word">
 * etiketlerini korur hem de etiket dışı metinlerde matematiksel sembolleri/formülleri işler.
 */
export function renderMathWithXray(rawText: string, xrayHtml?: string): string {
  if (!xrayHtml) return renderMathText(rawText);
  return xrayHtml
    .split(/(<[^>]+>)/g)
    .map((part) => {
      if (part.startsWith('<') && part.endsWith('>')) return part;
      return enrichPreEscapedMathSegment(part);
    })
    .join('');
}

function enrichPreEscapedMathSegment(escapedSegment: string): string {
  if (!escapedSegment) return '';
  let text = escapedSegment;

  text = text.replace(/\$\$([\s\S]+?)\$\$|\\\[([\s\S]+?)\\\]/g, (_m, g1, g2) => {
    const math = (g1 || g2).replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>');
    return renderMathFormula(math.trim(), true);
  });

  text = text.replace(/\$([^\$\n]+?)\$|\\\(([\s\S]+?)\\\)/g, (_m, g1, g2) => {
    const math = (g1 || g2).replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>');
    return renderMathFormula(math.trim(), false);
  });

  return applyCommonMathPatterns(text);
}

/**
 * LaTeX etiketi olmayan standart metin sorularındaki matematiksel sembolleri (derece, üs, kök) zenginleştirir.
 */
function enrichCommonMathText(raw: string): string {
  return applyCommonMathPatterns(escapeHtml(raw));
}

function applyCommonMathPatterns(safe: string): string {
  let out = safe.replace(/\n\n/g, '<br><br>').replace(/\n/g, '<br>');

  // Üslü sayı kalıpları (örn: x 2 -> x², x 3 -> x³, cm 2 -> cm², cm 3 -> cm³)
  out = out.replace(/\b([a-zA-Z0-9\)])\s*([23456789])\b(?=\s*(?:[+=−\-\*\/<>]|cm|birim|denklem|ifade|sayı|ve|ise|kök))/g, '$1<sup>$2</sup>');
  out = out.replace(/\b(cm|birim|m)\s*([23])\b/g, '$1<sup>$2</sup>');

  // Açı sembolü % m ( ABC ) -> m(∠ABC)
  out = out.replace(/%\s*m\s*\(\s*([A-Z]{3})\s*\)/g, 'm(∠$1)');
  out = out.replace(/%\s*m\s*\(\s*([A-Z]{1,2})\s*\)/g, 'm(∠$1)');
  out = out.replace(/&amp;\s*\)\s*=\s*/g, 'A(');

  // MEB PDF font bozulmalarını düzelt (örn: x ! R -> x ∈ R, # -> ≤)
  out = out.replace(/\b([a-zA-Z])\s*!\s*([RZNQ])\b/g, '$1 ∈ $2');
  out = out.replace(/(\s)#(\s)/g, '$1≤$2');

  return out;
}

function decodeHtmlEntities(str: string): string {
  return str
    .replace(/&#x27;|&#39;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&');
}

/**
 * Kavram balonu içindeki tek bir satırda $...$ KaTeX ifadelerini ve **kalın** Markdown vurgularını güvenli HTML'e çevirir.
 */
function formatInlineBubbleText(line: string): string {
  const decoded = decodeHtmlEntities(line);
  const mathPlaceholders: string[] = [];

  const textWithPlaceholders = decoded.replace(
    /(\$\$[\s\S]+?\$\$|\$[^\$\n]+?\$)/g,
    (match) => {
      let rendered = '';
      if (match.startsWith('$$') && match.endsWith('$$') && match.length > 4) {
        rendered = renderMathFormula(match.slice(2, -2).trim(), true);
      } else if (match.startsWith('$') && match.endsWith('$') && match.length > 2) {
        rendered = renderMathFormula(match.slice(1, -1).trim(), false);
      } else {
        rendered = escapeHtml(match);
      }
      const idx = mathPlaceholders.length;
      mathPlaceholders.push(rendered);
      return `___MATH_TOKEN_${idx}___`;
    }
  );

  let safe = escapeHtml(textWithPlaceholders);
  safe = safe.replace(/&lt;b&gt;(.*?)&lt;\/b&gt;/gi, '<strong>$1</strong>');
  safe = safe.replace(/&lt;strong&gt;(.*?)&lt;\/strong&gt;/gi, '<strong>$1</strong>');
  safe = safe.replace(/&lt;i&gt;(.*?)&lt;\/i&gt;/gi, '<em>$1</em>');
  safe = safe.replace(/&lt;em&gt;(.*?)&lt;\/em&gt;/gi, '<em>$1</em>');
  safe = safe.replace(/&lt;br\s*\/?&gt;/gi, '<br>');
  safe = safe.replace(/\*\*([^*]+?)\*\*/g, '<strong>$1</strong>');
  safe = safe.replace(/(?<!\*)\*([^*]+?)\*(?!\*)/g, '<em>$1</em>');
  safe = safe.replace(/___MATH_TOKEN_(\d+)___/g, (_, idx) => mathPlaceholders[Number(idx)]);
  return safe;
}

/**
 * Kavram balonundaki metni:
 * - 1-2 cümlelik düz metinse sade cümle olarak,
 * - Madde işaretleri (- veya •), 💡 formül/ipucu satırları ve $...$ matematiksel ifadeler varsa
 *   zenginleştirilmiş liste + KaTeX yapısıyla HTML'e dönüştürür.
 */
export function formatConceptBubbleHtml(rawSegment: string): string {
  if (!rawSegment) return '';
  const normalized = rawSegment
    .trim()
    .replace(/<br\s*\/?>|&lt;br\s*\/?&gt;/gi, '\n')
    .replace(/\s+•\s+/g, '\n• ');
  const lines = normalized
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);

  if (lines.length === 0) return '';

  const isSinglePlainLine =
    lines.length === 1 &&
    !/^(?:[-•*]\s+|💡)/.test(lines[0]);

  if (isSinglePlainLine) {
    return `<span>${formatInlineBubbleText(lines[0])}</span>`;
  }

  const blocks: string[] = [];
  let listItems: string[] = [];

  const flushList = () => {
    if (listItems.length > 0) {
      blocks.push(`<ul class="vocab-bubble-list">${listItems.join('')}</ul>`);
      listItems = [];
    }
  };

  for (const line of lines) {
    const bulletMatch = line.match(/^(?:[-•*])\s+([\s\S]+)$/);
    if (bulletMatch) {
      listItems.push(`<li>${formatInlineBubbleText(bulletMatch[1].trim())}</li>`);
    } else if (line.startsWith('💡')) {
      flushList();
      blocks.push(`<div class="vocab-bubble-tip">${formatInlineBubbleText(line)}</div>`);
    } else {
      flushList();
      blocks.push(`<div class="vocab-bubble-p">${formatInlineBubbleText(line)}</div>`);
    }
  }
  flushList();

  return blocks.join('');
}
