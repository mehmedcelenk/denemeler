import { choices, type Choice } from '../data/question.ts';

/** Kısmen bozuk kayıtların içindeki geçerli cevapları korur. */
export function parseSavedChoices(raw: string | null): Record<number, Choice> {
  if (!raw) return {};
  try {
    const value: unknown = JSON.parse(raw);
    if (!value || typeof value !== 'object' || Array.isArray(value)) return {};
    const result: Record<number, Choice> = {};
    for (const [id, choice] of Object.entries(value)) {
      if (/^\d+$/.test(id) && Number.isSafeInteger(Number(id)) && choices.includes(choice as Choice)) {
        result[Number(id)] = choice as Choice;
      }
    }
    return result;
  } catch {
    return {};
  }
}
