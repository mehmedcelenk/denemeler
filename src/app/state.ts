import type { Choice, Question, SubjectId } from '../data/question.ts';
import type { BookletFilterMode } from '../shared/question-filter.ts';

export type { Choice, Question, SubjectId, BookletFilterMode };
export type ConfidenceLevel = 'high' | 'mid' | 'low';
export type LibraryTab = 'starred' | 'rematch';

export interface AppState {
  allData: Question[];
  currentSubject: SubjectId | null;
  selectedCourses: Set<string>;
  courseFilterMode: 'AND' | 'OR';
  selectedTopicKey: string | null;
  bookletQuestions: Question[];
  bookletFilterMode: BookletFilterMode;
  drawerSearchTerm: string;
  activeSearchFilter: string;
  userMarkedChoices: Record<number, Choice>;
  userConfidences: Record<number, ConfidenceLevel>;
  undoHistoryStack: Record<number, Choice>[];
  revealedAnswers: Set<number>;
  revealedHints: Set<number>;
  currentColumnCount: number;
  zoomLevelIndex: number;
  currentSearchResults: { q: Question; matchedOption: { key: string; text: string } | null }[];
  waterStreak: number;
  starredQuestionIds: Set<number>;
  rematchQuestionIds: Set<number>;
  isLibraryMode: boolean;
  libraryTab: LibraryTab;
}

/** Paylaşılan uygulama durumu. Özelliğe özel geçici durum ilgili modülde tutulur. */
export const state: AppState = {
  allData: [],
  currentSubject: 'TDE',
  selectedCourses: new Set(),
  courseFilterMode: 'OR',
  selectedTopicKey: null,
  bookletQuestions: [],
  bookletFilterMode: 'all',
  drawerSearchTerm: '',
  activeSearchFilter: '',
  userMarkedChoices: {},
  userConfidences: {},
  undoHistoryStack: [],
  revealedAnswers: new Set(),
  revealedHints: new Set(),
  currentColumnCount: 2,
  zoomLevelIndex: 1,
  currentSearchResults: [],
  waterStreak: 0,
  starredQuestionIds: new Set(),
  rematchQuestionIds: new Set(),
  isLibraryMode: false,
  libraryTab: 'rematch',
};

export type StateEventType =
  | 'booklet:updated'
  | 'booklet:refresh'
  | 'drawer:close'
  | 'drawer:topics-refresh'
  | 'filter:updated'
  | 'subject:select'
  | 'answer:reveal';

type StateListener = (payload?: unknown) => void;
const eventListeners = new Map<StateEventType, Set<StateListener>>();

/** Belirli bir durum olayını dinler. Aboneliği iptal eden fonksiyon döner. */
export function onStateChange(event: StateEventType, listener: StateListener): () => void {
  let set = eventListeners.get(event);
  if (!set) {
    set = new Set();
    eventListeners.set(event, set);
  }
  set.add(listener);
  return () => {
    set?.delete(listener);
  };
}

/** Uygulama bileşenlerine durum değişikliği bildirimi gönderir. */
export function notifyStateChange(event: StateEventType, payload?: unknown): void {
  const set = eventListeners.get(event);
  if (set) {
    for (const listener of set) {
      try {
        listener(payload);
      } catch (err) {
        console.error(`[StateEvent:${event}]`, err);
      }
    }
  }
}

