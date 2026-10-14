import rawFormulas from '../../data/generated/MEB_FORMULAS.json';

export interface FormulaCard {
  id: string;
  title: string;
  category: string;
  keywords: string[];
  latex: string;
  explanation: string;
}

export const FORMULA_DICTIONARY = rawFormulas as FormulaCard[];

/**
 * Bir soru metnine ve konusuna uyan formül kartlarını döndürür.
 */
export function getFormulasForQuestion(stem: string, topic: string): FormulaCard[] {
  const text = `${stem} ${topic}`.toLowerCase();
  return FORMULA_DICTIONARY.filter(card => {
    return card.keywords.some(kw => text.includes(kw.toLowerCase()));
  });
}
