export interface FormulaCard {
  id: string;
  title: string;
  category: string;
  keywords: string[];
  latex: string;
  explanation: string;
}

export const FORMULA_DICTIONARY: FormulaCard[] = [
  {
    id: 'diskriminant',
    title: 'Diskriminant ve Kök Formülü',
    category: 'İkinci Dereceden Denklemler',
    keywords: ['delta', 'Δ', 'diskriminant', 'kök', 'denklem', 'ax²'],
    latex: '\\Delta = b^2 - 4ac \\quad \\Longrightarrow \\quad x_{1,2} = \\frac{-b \\pm \\sqrt{\\Delta}}{2a}',
    explanation: 'Δ > 0 ise iki farklı reel kök, Δ = 0 ise çakışık (tek) kök, Δ < 0 ise karmaşık kök vardır.',
  },
  {
    id: 'kokler_bagintisi',
    title: 'Kökler Toplamı ve Çarpımı',
    category: 'İkinci Dereceden Denklemler',
    keywords: ['x1 + x2', 'x1 . x2', 'kökleri', 'kökler toplamı'],
    latex: 'x_1 + x_2 = -\\frac{b}{a}, \\quad x_1 \\cdot x_2 = \\frac{c}{a}',
    explanation: 'ax² + bx + c = 0 denkleminde kökleri ayrı ayrı bulmadan toplam ve çarpımını verir.',
  },
  {
    id: 'uslu_kurallar',
    title: 'Üslü Sayı Kuralları',
    category: 'Üslü İfadeler',
    keywords: ['üslü', 'kuvvet', 'a^n', 'x²', 'x³', 'taban'],
    latex: 'a^m \\cdot a^n = a^{m+n}, \\quad \\frac{a^m}{a^n} = a^{m-n}, \\quad (a^m)^n = a^{m \\cdot n}',
    explanation: 'Tabanlar aynıysa çarparken üsler toplanır, bölerken çıkarılır; üssün üssü çarpılır.',
  },
  {
    id: 'koklu_kurallar',
    title: 'Köklü Sayı Kuralları',
    category: 'Köklü İfadeler',
    keywords: ['kök', '√', '\\sqrt', 'karekök', 'köklü'],
    latex: '\\sqrt{a \\cdot b} = \\sqrt{a} \\cdot \\sqrt{b}, \\quad \\sqrt{\\frac{a}{b}} = \\frac{\\sqrt{a}}{\\sqrt{b}}, \\quad \\sqrt{x^2} = |x|',
    explanation: 'Çift dereceli kökün içi asla negatif olamaz. Kök dışına mutlak değerle çıkar.',
  },
  {
    id: 'mutlak_deger',
    title: 'Mutlak Değer Kuralları',
    category: 'Denklem ve Eşitsizlikler',
    keywords: ['mutlak', '|x|', '|a|', 'uzaklık'],
    latex: '|x| = a \\implies x = a \\text{ veya } x = -a \\quad (a \\ge 0)',
    explanation: '|x| < a ise -a < x < a; |x| > a ise x > a veya x < -a olarak açılır.',
  },
  {
    id: 'kume_bilesim',
    title: 'Küme Birleşim ve Eleman Sayısı',
    category: 'Mantık ve Kümeler',
    keywords: ['küme', 's(a∪b)', 's(a∩b)', 'kesişim', 'birleşim', '∪', '∩'],
    latex: 's(A \\cup B) = s(A) + s(B) - s(A \\cap B)',
    explanation: 'n elemanlı bir kümenin alt küme sayısı 2ⁿ, öz alt küme sayısı 2ⁿ - 1 dir.',
  },
  {
    id: 'pisagor_oklid',
    title: 'Pisagor ve Öklid Bağıntıları',
    category: 'Geometri',
    keywords: ['pisagor', 'öklid', 'dik üçgen', 'hipotenüs', 'h²', 'a² + b²'],
    latex: 'a^2 + b^2 = c^2, \\quad h^2 = p \\cdot k, \\quad b^2 = k \\cdot c',
    explanation: 'Özel dik üçgenler: 3-4-5, 5-12-13, 8-15-17, 7-24-25 ve katları.',
  },
  {
    id: 'olasilik_kombinasyon',
    title: 'Olasılık ve Kombinasyon',
    category: 'Sayma ve Olasılık',
    keywords: ['olasılık', 'kombinasyon', 'seçim', 'c(n,r)', 'p(a)'],
    latex: 'P(A) = \\frac{\\text{İstenen Durum}}{\\text{Tüm Durum}}, \\quad C(n, r) = \\frac{n!}{r!(n-r)!}',
    explanation: 'Sıralama varsa Permütasyon P(n,r), sadece grup seçimi varsa Kombinasyon C(n,r) kullanılır.',
  },
  {
    id: 'cokgen_acilar',
    title: 'Çokgenlerde Açı Formülleri',
    category: 'Çokgenler',
    keywords: ['çokgen', 'beşgen', 'altıgen', 'dış açı', 'iç açı', 'düzgün'],
    latex: '\\text{Bir Dış Açı} = \\frac{360^\\circ}{n}, \\quad \\text{İç Açılar Toplamı} = (n-2) \\cdot 180^\\circ',
    explanation: 'Tüm dışbükey çokgenlerin dış açıları toplamı her zaman 360 derecedir.',
  },
];

/**
 * Bir soru metnine ve konusuna uyan formül kartlarını döndürür.
 */
export function getFormulasForQuestion(stem: string, topic: string): FormulaCard[] {
  const text = `${stem} ${topic}`.toLowerCase();
  return FORMULA_DICTIONARY.filter(card => {
    return card.keywords.some(kw => text.includes(kw.toLowerCase()));
  });
}
