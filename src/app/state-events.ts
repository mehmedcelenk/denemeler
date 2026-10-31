export type StateEventType =
  | 'booklet:updated'
  | 'booklet:refresh'
  | 'drawer:close'
  | 'drawer:topics-refresh'
  | 'filter:updated'
  | 'subject:select'
  | 'answer:marked'
  | 'answer:revoked'
  | 'answer:reveal'
  | 'print:before'
  | 'print:after'
  | 'view-mode:updated'
  | 'board:render-question';

type StateListener = (payload?: unknown) => void;

interface ListenerEntry {
  readonly listener: StateListener;
  readonly priority: number;
  readonly sequence: number;
}

const eventListeners = new Map<StateEventType, ListenerEntry[]>();
let nextSequence = 0;

export function onStateChange(
  event: StateEventType,
  listener: StateListener,
  priority = 0,
): () => void {
  const entries = eventListeners.get(event) ?? [];
  const entry = { listener, priority, sequence: nextSequence++ };
  entries.push(entry);
  entries.sort((a, b) => a.priority - b.priority || a.sequence - b.sequence);
  eventListeners.set(event, entries);
  return () => {
    const index = entries.indexOf(entry);
    if (index >= 0) entries.splice(index, 1);
  };
}

export function notifyStateChange(event: StateEventType, payload?: unknown): void {
  for (const { listener } of eventListeners.get(event) ?? []) {
    try {
      listener(payload);
    } catch (error) {
      console.error(`[StateEvent:${event}]`, error);
    }
  }
}
