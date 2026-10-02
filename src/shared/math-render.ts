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
 * LaTeX etiketi olmayan standart metin sorularındaki matematiksel sembolleri (derece, üs, kök) zenginleştirir.
 */
function enrichCommonMathText(raw: string): string {
  // Önce temel HTML kaçışı yap
  let safe = escapeHtml(raw);

  // Satır sonlarını br yap
  safe = safe.replace(/\n\n/g, '<br><br>').replace(/\n/g, '<br>');

  // Üslü sayı kalıpları (örn: x 2 -> x², x 3 -> x³, cm 2 -> cm², cm 3 -> cm³)
  safe = safe.replace(/\b([a-zA-Z0-9\)])\s*([23456789])\b(?=\s*(?:[+=−\-\*\/<>]|cm|birim|denklem|ifade|sayı|ve|ise|kök))/g, '$1<sup>$2</sup>');
  safe = safe.replace(/\b(cm|birim|m)\s*([23])\b/g, '$1<sup>$2</sup>');

  // Açı sembolü % m ( ABC ) -> m(ABĈ) veya m(∠ABC)
  safe = safe.replace(/%\s*m\s*\(\s*([A-Z]{3})\s*\)/g, 'm(∠$1)');
  safe = safe.replace(/%\s*m\s*\(\s*([A-Z]{1,2})\s*\)/g, 'm(∠$1)');
  safe = safe.replace(/&amp;\s*\)\s*=\s*/g, 'A(');

  // MEB PDF font bozulmalarını düzelt (örn: x ! R -> x ∈ R, # -> ≤)
  safe = safe.replace(/\b([a-zA-Z])\s*!\s*([RZNQ])\b/g, '$1 ∈ $2');
  safe = safe.replace(/(\s)#(\s)/g, '$1≤$2');

  return safe;
}
