import type { LessonConcept } from '../../data/lesson.ts';
import { escapeHtml } from '../../shared/escape.ts';
import { renderMathFormula } from '../../shared/math-render.ts';

function applyInlineFormatting(safeText: string): string {
  return safeText
    .replace(/\*\*([^*]+?)\*\*/g, '<strong>$1</strong>')
    .replace(/(?<!\*)\*([^*\n]+?)\*(?!\*)/g, '<em>$1</em>')
    .replace(/`([^`\n]+?)`/g, '<code class="lesson-inline-code">$1</code>');
}

function tokenizeMath(raw: string): { text: string; tokens: string[] } {
  const tokens: string[] = [];
  let text = raw.replace(/\$\$([\s\S]+?)\$\$|\\\[([\s\S]+?)\\\]/g, (_m, g1, g2) => {
    const rendered = renderMathFormula(String(g1 || g2).trim(), true);
    const idx = tokens.length;
    tokens.push(`<span class="lesson-math-block">${rendered}</span>`);
    return `___LESSON_MATH_${idx}___`;
  });
  text = text.replace(/\$([^\$\n]+?)\$|\\\(([\s\S]+?)\\\)/g, (_m, g1, g2) => {
    const rendered = renderMathFormula(String(g1 || g2).trim(), false);
    const idx = tokens.length;
    tokens.push(rendered);
    return `___LESSON_MATH_${idx}___`;
  });
  return { text, tokens };
}

function restoreMath(html: string, tokens: readonly string[]): string {
  if (tokens.length === 0) return html;
  return html.replace(/___LESSON_MATH_(\d+)___/g, (_, idx) => tokens[Number(idx)] ?? '');
}

const TR_CHAR_CLASSES: Record<string, string> = {
  i: '[iİ]',
  'ı': '[ıI]',
  'ş': '[şŞ]',
  'ğ': '[ğĞ]',
  'ü': '[üÜ]',
  'ö': '[öÖ]',
  'ç': '[çÇ]',
};

function buildTurkishTermRegex(term: string): RegExp | null {
  const clean = term.trim();
  if (clean.length < 2) return null;
  const lower = clean.toLocaleLowerCase('tr-TR');
  let pattern = '';
  for (const ch of lower) {
    if (TR_CHAR_CLASSES[ch]) {
      pattern += TR_CHAR_CLASSES[ch];
    } else if (/\s/.test(ch)) {
      pattern += '\\s+';
    } else {
      pattern += ch.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    }
  }
  const suffix = clean.length >= 4 ? "(?:['’]?[a-zA-ZçğıöşüÇĞİÖŞÜ]{0,5})?" : '';
  const startBoundary = '(?<![A-Za-zÇĞİÖŞÜçğıöşü0-9])';
  const endBoundary = '(?![A-Za-zÇĞİÖŞÜçğıöşü0-9])';
  return new RegExp(`${startBoundary}(${pattern}${suffix})${endBoundary}`, 'i');
}

function renderConceptChip(matchedHtml: string, concept: LessonConcept): string {
  const termAttr = escapeHtml(concept.term);
  const defAttr = escapeHtml(concept.definition);
  const exampleAttr = concept.example ? ` data-lesson-example="${escapeHtml(concept.example)}"` : '';
  const emojiAttr = concept.emoji ? ` data-lesson-emoji="${escapeHtml(concept.emoji)}"` : '';
  return `<button type="button" class="vocab-word concept-word lesson-concept-word" data-lesson-term="${termAttr}" data-lesson-def="${defAttr}"${exampleAttr}${emojiAttr} aria-expanded="false">${matchedHtml}</button>`;
}

/** HTML etiketlerini ve KaTeX placeholder'larını koruyarak metin içi kavramları tıklanabilir yapar. */
function highlightInlineConcepts(html: string, concepts: readonly LessonConcept[]): string {
  if (!concepts.length) return html;
  const sorted = [...concepts].sort((a, b) => b.term.length - a.term.length);
  const matchedTerms = new Set<string>();
  let current = html;

  for (const concept of sorted) {
    const key = concept.term.toLocaleLowerCase('tr-TR');
    if (matchedTerms.has(key)) continue;
    const regex = buildTurkishTermRegex(concept.term);
    if (!regex) continue;

    // Etiketleri, mevcut kavram butonlarını ve math placeholder'larını koru
    const segments = current.split(/(<button\b[^>]*>[\s\S]*?<\/button>|<[^>]+>|___LESSON_MATH_\d+___)/g);
    let replaced = false;
    for (let i = 0; i < segments.length; i++) {
      const seg = segments[i];
      if (!seg || seg.startsWith('<') || seg.startsWith('___LESSON_MATH_')) continue;
      if (regex.test(seg)) {
        segments[i] = seg.replace(regex, (match) => renderConceptChip(match, concept));
        replaced = true;
        matchedTerms.add(key);
        break;
      }
    }
    if (replaced) current = segments.join('');
  }
  return current;
}

/** Tek satırlık başlık/tanım metinlerini KaTeX ve güvenli vurguyla HTML'e çevirir. */
export function renderLessonInline(raw: string | null | undefined): string {
  if (!raw) return '';
  const { text, tokens } = tokenizeMath(raw.trim());
  const safe = applyInlineFormatting(escapeHtml(text)).replace(/\r?\n/g, '<br>');
  return restoreMath(safe, tokens);
}

/** Çok paragraflı anlatım metinlerini XSS-güvenli paragraf, KaTeX ve tıklanabilir kavramlarla çizer. */
export function renderLessonRichText(
  raw: string | null | undefined,
  concepts?: readonly LessonConcept[],
): string {
  if (!raw) return '';
  const { text, tokens } = tokenizeMath(raw.trim());
  const paragraphs = text
    .split(/\r?\n\s*\r?\n/)
    .map(part => part.trim())
    .filter(Boolean);

  if (paragraphs.length === 0) return '';

  let html = paragraphs
    .map(part => {
      const safe = applyInlineFormatting(escapeHtml(part)).replace(/\r?\n/g, '<br>');
      return `<p class="lesson-prose">${safe}</p>`;
    })
    .join('');

  if (concepts && concepts.length > 0) {
    html = highlightInlineConcepts(html, concepts);
  }

  return restoreMath(html, tokens);
}
