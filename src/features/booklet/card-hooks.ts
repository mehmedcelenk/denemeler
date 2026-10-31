import type { Question } from '../../data/question.ts';

export interface CardHook {
  stem?(q: Question, html: string): string;
  header?(q: Question): string;
  toolbar?(q: Question): string;
}

const hooks: CardHook[] = [];

export function registerCardHook(hook: CardHook): void {
  if (!hooks.includes(hook)) hooks.push(hook);
}

export function applyStemHooks(q: Question, html: string): string {
  return hooks.reduce(
    (currentHtml, hook) => hook.stem ? hook.stem(q, currentHtml) : currentHtml,
    html,
  );
}

export function renderHeaderExtraHooks(q: Question): string {
  return hooks
    .map(hook => hook.header?.(q) ?? '')
    .filter(Boolean)
    .join('');
}

export function renderToolbarExtraHooks(q: Question): string {
  return hooks
    .map(hook => hook.toolbar?.(q) ?? '')
    .filter(Boolean)
    .join('');
}
