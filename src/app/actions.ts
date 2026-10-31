export type ActionHandler = (el: HTMLElement, ev: Event) => void | Promise<void>;

const actions = new Map<string, ActionHandler>();

export function registerActions(map: Readonly<Record<string, ActionHandler>>): void {
  for (const [name, handler] of Object.entries(map)) {
    if (actions.has(name)) {
      console.error(`[ActionRegistry] Duplicate action: ${name}`);
      continue;
    }
    actions.set(name, handler);
  }
}

export function runAction(name: string, el: HTMLElement, ev: Event): boolean {
  const handler = actions.get(name);
  if (!handler) return false;
  try {
    const result = handler(el, ev);
    if (result) {
      void result.catch(error => console.error(`[Action:${name}]`, error));
    }
  } catch (error) {
    console.error(`[Action:${name}]`, error);
  }
  return true;
}
