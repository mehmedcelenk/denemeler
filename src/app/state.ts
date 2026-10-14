import type { Choice, Question, SubjectId } from '../data/question.ts';
import type { BookletFilterMode } from '../shared/question-filter.ts';

export type { Choice, Question, SubjectId, BookletFilterMode };
export type LibraryTab = 'starred' | 'rematch';
export type ContentViewMode = 'questions' | 'notes';

export interface AppState {
  allData: Question[];
  currentSubject: SubjectId | null;
  programMode: 'AOIHL' | 'AOF';
  selectedCourses: Set<string>;
  courseFilterMode: 'AND' | 'OR';
  selectedTopicKeys: Set<string>;
  bookletQuestions: Question[];
  bookletFilterMode: BookletFilterMode;
  contentViewMode: ContentViewMode;
  activeSearchFilter: string;
  userMarkedChoices: Record<number, Choice>;
  revealedAnswers: Set<number>;
  revealedHints: Set<number>;
  currentColumnCount: number;
  zoomLevelIndex: number;
  canvasZoomScale: number;
  waterStreak: number;
  starredQuestionIds: Set<number>;
  rematchQuestionIds: Set<number>;
  isLibraryMode: boolean;
  libraryTab: LibraryTab;
  isFeaturesExpanded: boolean;
  expandedQuestionIds: Set<number>;
}

/** Paylaşılan uygulama durumu. Özelliğe özel geçici durum ilgili modülde tutulur. */
export const state: AppState = {
  allData: [],
  currentSubject: 'TDE',
  programMode: 'AOIHL',
  selectedCourses: new Set(),
  courseFilterMode: 'OR',
  selectedTopicKeys: new Set(),
  bookletQuestions: [],
  bookletFilterMode: 'all',
  contentViewMode: 'questions',
  activeSearchFilter: '',
  userMarkedChoices: {},
  revealedAnswers: new Set(),
  revealedHints: new Set(),
  currentColumnCount: 2,
  zoomLevelIndex: 1,
  canvasZoomScale: 1,
  waterStreak: 0,
  starredQuestionIds: new Set(),
  rematchQuestionIds: new Set(),
  isLibraryMode: false,
  libraryTab: 'rematch',
  isFeaturesExpanded: false,
  expandedQuestionIds: new Set(),
};

export type StateEventType =
  | 'booklet:updated'
  | 'booklet:refresh'
  | 'drawer:close'
  | 'drawer:topics-refresh'
  | 'filter:updated'
  | 'subject:select'
  | 'answer:reveal'
  | 'view-mode:updated'
  | 'board:render-question';

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

/** Micro-Store Action Metotları: State mutasyonlarını tek merkezden yönetir. */
export const store = {
  setUserMarkedChoice(qid: number, choice: Choice): void {
    state.userMarkedChoices[qid] = choice;
  },

  removeUserMarkedChoice(qid: number): void {
    delete state.userMarkedChoices[qid];
  },

  clearAllUserMarkedChoices(): void {
    state.userMarkedChoices = {};
  },

  setSelectedCourses(courses: Iterable<string>): void {
    state.selectedCourses = new Set(courses);
  },

  toggleTopicKey(topicKey: string): void {
    if (state.selectedTopicKeys.has(topicKey)) {
      state.selectedTopicKeys.delete(topicKey);
    } else {
      state.selectedTopicKeys.add(topicKey);
    }
  },

  clearSelectedTopicKeys(): void {
    state.selectedTopicKeys.clear();
  },

  setProgramMode(mode: 'AOIHL' | 'AOF'): void {
    state.programMode = mode;
  },

  setCurrentSubject(subject: SubjectId | null): void {
    state.currentSubject = subject;
  },
};

