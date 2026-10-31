import { choices, type Choice } from '../data/question.ts';

export function isSavedChoicesContainer(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

/** Kısmen bozuk kayıtların içindeki geçerli cevapları korur. */
export function parseSavedChoicesValue(value: unknown): Record<number, Choice> {
  if (!isSavedChoicesContainer(value)) return {};
  const result: Record<number, Choice> = {};
  for (const [id, choice] of Object.entries(value)) {
    const validChoice = choices.find(candidate => candidate === choice);
    if (/^\d+$/.test(id) && Number.isSafeInteger(Number(id)) && validChoice) {
      result[Number(id)] = validChoice;
    }
  }
  return result;
}

export function parseSavedChoices(raw: string | null): Record<number, Choice> {
  if (!raw) return {};
  try {
    return parseSavedChoicesValue(JSON.parse(raw) as unknown);
  } catch {
    return {};
  }
}
