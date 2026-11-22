/**
 * Maskot sözleşmesi ve doğrulama yardımcıları (saf modül — DOM/storage bağımlılığı yok).
 */
export type BirdMascotId = 'bird' | 'owl' | 'raven' | 'drone';
export type LegacyMascotId = 'cat' | 'dog' | 'fish';
export type ActiveMascotId = BirdMascotId;
export type AnyMascotId = ActiveMascotId | LegacyMascotId | 'none';
export type MascotId = ActiveMascotId | 'none';
export type MascotMood = 'idle' | 'welcome' | 'correct' | 'wrong';

export interface MascotOption {
  readonly id: MascotId;
  readonly label: string;
}

export const DEFAULT_MASCOT_ID: ActiveMascotId = 'bird';

export const MASCOT_OPTIONS: readonly MascotOption[] = [
  { id: 'bird', label: 'Tavuk' },
  { id: 'owl', label: 'RoboBaykuş' },
  { id: 'drone', label: 'Drone' },
  { id: 'raven', label: 'Karga' },
  { id: 'none', label: 'Gizle' },
];

const VALID_MASCOT_IDS: ReadonlySet<string> = new Set(MASCOT_OPTIONS.map(option => option.id));
const BIRD_MASCOT_IDS: ReadonlySet<string> = new Set<BirdMascotId>(['bird', 'owl', 'raven', 'drone']);

export function isMascotId(value: unknown): value is MascotId {
  return typeof value === 'string' && VALID_MASCOT_IDS.has(value);
}

export function isActiveMascotId(value: unknown): value is ActiveMascotId {
  return isMascotId(value) && value !== 'none';
}

export function isBirdMascotId(value: unknown): value is BirdMascotId {
  return typeof value === 'string' && BIRD_MASCOT_IDS.has(value);
}

export function normalizeMascotId(value: unknown): MascotId {
  return isMascotId(value) ? value : DEFAULT_MASCOT_ID;
}
