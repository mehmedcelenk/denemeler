import type { Choice, Question, SubjectId } from '../data/question.ts';
import type { BookletFilterMode } from '../shared/question-filter.ts';
import { StorageKeys } from '../shared/storage-keys.ts';

export type { Choice, Question, SubjectId, BookletFilterMode };
export type LibraryTab = 'starred' | 'rematch';
export type ContentViewMode = 'questions' | 'notes';

const REMATCH_STORAGE_KEY = 'aol_rematch_queue';
const STREAK_DATE_KEY = 'aol_last_streak_date';

function safeStorageSet(key: string, value: string): void {
  try {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(key, value);
    }
  } catch {}
}

export interface AiExplanationEntry {
  readonly query: string;
  readonly reply: string;
  readonly updatedAt: number;
}

export interface AppState {
  readonly allData: readonly Question[];
  readonly currentSubject: SubjectId | null;
  readonly programMode: 'AOIHL' | 'AOF';
  readonly selectedCourses: ReadonlySet<string>;
  readonly courseFilterMode: 'AND' | 'OR';
  readonly selectedTopicKeys: ReadonlySet<string>;
  readonly bookletQuestions: readonly Question[];
  readonly bookletFilterMode: BookletFilterMode;
  readonly contentViewMode: ContentViewMode;
  readonly activeSearchFilter: string;
  readonly userMarkedChoices: Readonly<Record<number, Choice>>;
  readonly revealedAnswers: ReadonlySet<number>;
  readonly revealedHints: ReadonlySet<number>;
  readonly currentColumnCount: number;
  readonly zoomLevelIndex: number;
  readonly canvasZoomScale: number;
  readonly waterStreak: number;
  readonly starredQuestionIds: ReadonlySet<number>;
  readonly rematchQuestionIds: ReadonlySet<number>;
  readonly isLibraryMode: boolean;
  readonly libraryTab: LibraryTab;
  readonly isFeaturesExpanded: boolean;
  readonly expandedQuestionIds: ReadonlySet<number>;
  readonly eliminatedChoices: Readonly<Record<number, readonly Choice[]>>;
  readonly aiExplanations: Readonly<Record<number, AiExplanationEntry>>;
  readonly pendingAiQuestions: ReadonlySet<number>;
}

interface MutableAppState {
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
  eliminatedChoices: Record<number, Choice[]>;
  aiExplanations: Record<number, AiExplanationEntry>;
  pendingAiQuestions: Set<number>;
}

const _state: MutableAppState = {
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
  eliminatedChoices: {},
  aiExplanations: {},
  pendingAiQuestions: new Set(),
};

/** Dışarıya açılan salt-okunur (Compile-Time Zırhlı) durum nesnesi */
export const state: AppState = _state;

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

export function onStateChange(event: StateEventType, listener: StateListener): () => void {
  let set = eventListeners.get(event);
  if (!set) {
    set = new Set();
    eventListeners.set(event, set);
  }
  set.add(listener);
  return () => { set?.delete(listener); };
}

export function notifyStateChange(event: StateEventType, payload?: unknown): void {
  const set = eventListeners.get(event);
  if (!set) return;
  for (const listener of set) {
    try {
      listener(payload);
    } catch (err) {
      console.error(`[StateEvent:${event}]`, err);
    }
  }
}

/** Micro-Store: State mutasyonlarını tek merkezden yönetir ve kalıcı depolarla eşitler. */
export const store = {
  setProgramMode(mode: 'AOIHL' | 'AOF'): void {
    _state.programMode = mode;
  },
  setCurrentSubject(subject: SubjectId | null): void {
    _state.currentSubject = subject;
  },
  setSelectedCourses(courses: Iterable<string>): void {
    _state.selectedCourses = new Set(courses);
  },
  addSelectedCourse(course: string): void {
    _state.selectedCourses.add(course);
  },
  removeSelectedCourse(course: string): void {
    _state.selectedCourses.delete(course);
  },
  clearSelectedCourses(): void {
    _state.selectedCourses.clear();
  },
  setCourseFilterMode(mode: 'AND' | 'OR'): void {
    _state.courseFilterMode = mode;
  },
  setSelectedTopicKeys(keys: Iterable<string>): void {
    _state.selectedTopicKeys = new Set(keys);
  },
  toggleTopicKey(topicKey: string): void {
    if (_state.selectedTopicKeys.has(topicKey)) {
      _state.selectedTopicKeys.delete(topicKey);
    } else {
      _state.selectedTopicKeys.add(topicKey);
    }
  },
  clearSelectedTopicKeys(): void {
    _state.selectedTopicKeys.clear();
  },
  setBookletQuestions(questions: readonly Question[]): void {
    _state.bookletQuestions = [...questions];
  },
  setBookletFilterMode(mode: BookletFilterMode): void {
    _state.bookletFilterMode = mode;
  },
  setContentViewMode(mode: ContentViewMode): void {
    _state.contentViewMode = mode;
  },
  setActiveSearchFilter(term: string): void {
    _state.activeSearchFilter = term;
  },
  setUserMarkedChoice(qid: number, choice: Choice, persist = true): void {
    _state.userMarkedChoices[qid] = choice;
    if (persist) safeStorageSet(StorageKeys.USER_CHOICES, JSON.stringify(_state.userMarkedChoices));
  },
  removeUserMarkedChoice(qid: number, persist = true): void {
    delete _state.userMarkedChoices[qid];
    if (persist) safeStorageSet(StorageKeys.USER_CHOICES, JSON.stringify(_state.userMarkedChoices));
  },
  clearAllUserMarkedChoices(persist = true): void {
    _state.userMarkedChoices = {};
    if (persist) safeStorageSet(StorageKeys.USER_CHOICES, JSON.stringify(_state.userMarkedChoices));
  },
  setUserMarkedChoices(choices: Record<number, Choice>, persist = true): void {
    _state.userMarkedChoices = { ...choices };
    if (persist) safeStorageSet(StorageKeys.USER_CHOICES, JSON.stringify(_state.userMarkedChoices));
  },
  toggleEliminatedChoice(qid: number, choice: Choice, persist = true): boolean {
    const list = _state.eliminatedChoices[qid] || [];
    const idx = list.indexOf(choice);
    let isNowEliminated = false;
    if (idx > -1) {
      const updated = [...list];
      updated.splice(idx, 1);
      if (updated.length === 0) {
        delete _state.eliminatedChoices[qid];
      } else {
        _state.eliminatedChoices[qid] = updated;
      }
      isNowEliminated = false;
    } else {
      _state.eliminatedChoices[qid] = [...list, choice];
      isNowEliminated = true;
    }
    if (persist) safeStorageSet(StorageKeys.ELIMINATED_CHOICES, JSON.stringify(_state.eliminatedChoices));
    return isNowEliminated;
  },
  setEliminatedChoices(eliminated: Record<number, Choice[]>, persist = true): void {
    _state.eliminatedChoices = { ...eliminated };
    if (persist) safeStorageSet(StorageKeys.ELIMINATED_CHOICES, JSON.stringify(_state.eliminatedChoices));
  },
  clearAllEliminatedChoices(persist = true): void {
    _state.eliminatedChoices = {};
    if (persist) safeStorageSet(StorageKeys.ELIMINATED_CHOICES, JSON.stringify(_state.eliminatedChoices));
  },
  setStarredQuestionIds(ids: Iterable<number>, persist = true): void {
    _state.starredQuestionIds = new Set(ids);
    if (persist) safeStorageSet(StorageKeys.STARRED_QUESTIONS, JSON.stringify(Array.from(_state.starredQuestionIds)));
  },
  toggleStarredQuestion(id: number, persist = true): boolean {
    const isNowStarred = !_state.starredQuestionIds.has(id);
    if (isNowStarred) {
      _state.starredQuestionIds.add(id);
    } else {
      _state.starredQuestionIds.delete(id);
    }
    if (persist) safeStorageSet(StorageKeys.STARRED_QUESTIONS, JSON.stringify(Array.from(_state.starredQuestionIds)));
    return isNowStarred;
  },
  setRematchQuestionIds(ids: Iterable<number>, persist = true): void {
    _state.rematchQuestionIds = new Set(ids);
    if (persist) safeStorageSet(REMATCH_STORAGE_KEY, JSON.stringify(Array.from(_state.rematchQuestionIds)));
  },
  addRematchQuestion(id: number, persist = true): void {
    _state.rematchQuestionIds.add(id);
    if (persist) safeStorageSet(REMATCH_STORAGE_KEY, JSON.stringify(Array.from(_state.rematchQuestionIds)));
  },
  removeRematchQuestion(id: number, persist = true): void {
    _state.rematchQuestionIds.delete(id);
    if (persist) safeStorageSet(REMATCH_STORAGE_KEY, JSON.stringify(Array.from(_state.rematchQuestionIds)));
  },
  setLibraryMode(isLibrary: boolean, tab: LibraryTab = 'rematch'): void {
    _state.isLibraryMode = isLibrary;
    _state.libraryTab = tab;
  },
  setWaterStreak(streak: number, persist = true): void {
    _state.waterStreak = Math.max(0, streak);
    if (persist) {
      safeStorageSet(StorageKeys.WATER_STREAK, String(_state.waterStreak));
      safeStorageSet(STREAK_DATE_KEY, new Date().toISOString().split('T')[0]);
    }
  },
  addWaterStreak(points: number, persist = true): void {
    this.setWaterStreak(_state.waterStreak + points, persist);
  },
  deductWaterStreak(deduct = 1, persist = true): void {
    this.setWaterStreak(_state.waterStreak - deduct, persist);
  },
  setColumnCount(n: number, persist = true): void {
    const valid = [1, 2, 3, 4].includes(n) ? n : 2;
    _state.currentColumnCount = valid;
    if (persist) safeStorageSet(StorageKeys.COLUMN_COUNT, String(valid));
  },
  setZoomLevelIndex(idx: number): void {
    _state.zoomLevelIndex = idx;
  },
  setCanvasZoomScale(scale: number): void {
    _state.canvasZoomScale = Math.min(2.5, Math.max(0.85, scale));
  },
  toggleFeaturesExpanded(): boolean {
    _state.isFeaturesExpanded = !_state.isFeaturesExpanded;
    return _state.isFeaturesExpanded;
  },
  toggleQuestionExpanded(id: number): boolean {
    const isNowExpanded = !_state.expandedQuestionIds.has(id);
    if (isNowExpanded) {
      _state.expandedQuestionIds.add(id);
    } else {
      _state.expandedQuestionIds.delete(id);
    }
    return isNowExpanded;
  },
  toggleAnswerReveal(qid: number): boolean {
    const isNowRevealed = !_state.revealedAnswers.has(qid);
    if (isNowRevealed) {
      _state.revealedAnswers.add(qid);
    } else {
      _state.revealedAnswers.delete(qid);
    }
    return isNowRevealed;
  },
  toggleHintReveal(qid: number): boolean {
    const isNowRevealed = !_state.revealedHints.has(qid);
    if (isNowRevealed) {
      _state.revealedHints.add(qid);
    } else {
      _state.revealedHints.delete(qid);
    }
    return isNowRevealed;
  },
  appendQuestions(questions: readonly Question[]): void {
    _state.allData.push(...questions);
  },
  setAllData(questions: readonly Question[]): void {
    _state.allData = [...questions];
  },
  setAiExplanation(qid: number, entry: AiExplanationEntry, persist = true): void {
    _state.aiExplanations[qid] = entry;
    if (persist) safeStorageSet(StorageKeys.AI_EXPLANATIONS, JSON.stringify(_state.aiExplanations));
  },
  setAiExplanations(map: Record<number, AiExplanationEntry>, persist = true): void {
    _state.aiExplanations = { ...map };
    if (persist) safeStorageSet(StorageKeys.AI_EXPLANATIONS, JSON.stringify(_state.aiExplanations));
  },
  setPendingAiQuestion(qid: number, isPending: boolean): void {
    if (isPending) _state.pendingAiQuestions.add(qid);
    else _state.pendingAiQuestions.delete(qid);
  },
};
