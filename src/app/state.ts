import type { Choice, Question, SubjectId } from '../data/question.ts';
import type { BookletFilterMode } from '../shared/question-filter.ts';
import { StorageKeys } from '../shared/storage-keys.ts';
import * as storage from './storage.ts';

export type * from './state-types.ts';
import type { AppState, MutableAppState, LibraryTab, ContentViewMode, AiExplanationEntry, AiExplanationMessage } from './state-types.ts';
export { onStateChange, notifyStateChange } from './state-events.ts';
export type { StateEventType } from './state-events.ts';

const _state: MutableAppState = {
  allData: [],
  currentSubject: 'TDE',
  programMode: 'AOIHL',
  selectedCourses: new Set(),
  courseFilterMode: 'OR',
  selectedTopicKeys: new Set(),
  selectedExamPeriod: null,
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
  eliminatedWrongChoices: {},
  aiExplanations: {},
  pendingAiQuestions: new Set(),
  ttsVoiceGender: 'female',
  ttsVoiceEngine: 1,
};

/** Dışarıya açılan salt-okunur (Compile-Time Zırhlı) durum nesnesi */
export const state: AppState = _state;

/** Micro-Store: State mutasyonlarını tek merkezden yönetir ve kalıcı depolarla eşitler. */
export const store = {
  setProgramMode(mode: 'AOIHL' | 'AOF'): void { _state.programMode = mode; },
  setCurrentSubject(subject: SubjectId | null): void { _state.currentSubject = subject; },
  setSelectedCourses(courses: Iterable<string>): void { _state.selectedCourses = new Set(courses); },
  addSelectedCourse(course: string): void { _state.selectedCourses.add(course); },
  removeSelectedCourse(course: string): void { _state.selectedCourses.delete(course); },
  clearSelectedCourses(): void { _state.selectedCourses.clear(); },
  setCourseFilterMode(mode: 'AND' | 'OR'): void { _state.courseFilterMode = mode; },
  setSelectedTopicKeys(keys: Iterable<string>): void { _state.selectedTopicKeys = new Set(keys); },
  toggleTopicKey(topicKey: string): void {
    if (_state.selectedTopicKeys.has(topicKey)) {
      _state.selectedTopicKeys.delete(topicKey);
    } else {
      _state.selectedTopicKeys.add(topicKey);
    }
  },
  clearSelectedTopicKeys(): void { _state.selectedTopicKeys.clear(); },
  setSelectedExamPeriod(period: string | null): void { _state.selectedExamPeriod = period; },
  setBookletQuestions(questions: readonly Question[]): void { _state.bookletQuestions = [...questions]; },
  setBookletFilterMode(mode: BookletFilterMode): void { _state.bookletFilterMode = mode; },
  setContentViewMode(mode: ContentViewMode): void { _state.contentViewMode = mode; },
  setActiveSearchFilter(term: string): void { _state.activeSearchFilter = term; },
  setUserMarkedChoice(qid: number, choice: Choice, persist = true): void {
    _state.userMarkedChoices[qid] = choice;
    if (persist) storage.writeJson(StorageKeys.USER_CHOICES, _state.userMarkedChoices);
  },
  removeUserMarkedChoice(qid: number, persist = true): void {
    delete _state.userMarkedChoices[qid];
    if (persist) storage.writeJson(StorageKeys.USER_CHOICES, _state.userMarkedChoices);
  },
  clearAllUserMarkedChoices(persist = true): void {
    _state.userMarkedChoices = {};
    if (persist) storage.writeJson(StorageKeys.USER_CHOICES, _state.userMarkedChoices);
  },
  setUserMarkedChoices(choices: Record<number, Choice>, persist = true): void {
    _state.userMarkedChoices = { ...choices };
    if (persist) storage.writeJson(StorageKeys.USER_CHOICES, _state.userMarkedChoices);
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
    if (persist) storage.writeJson(StorageKeys.ELIMINATED_CHOICES, _state.eliminatedChoices);
    return isNowEliminated;
  },
  setEliminatedChoices(eliminated: Record<number, Choice[]>, persist = true): void {
    _state.eliminatedChoices = { ...eliminated };
    if (persist) storage.writeJson(StorageKeys.ELIMINATED_CHOICES, _state.eliminatedChoices);
  },
  clearAllEliminatedChoices(persist = true): void {
    _state.eliminatedChoices = {};
    if (persist) storage.writeJson(StorageKeys.ELIMINATED_CHOICES, _state.eliminatedChoices);
  },
  setEliminatedWrongChoice(qid: number, choice: Choice, persist = true): void {
    _state.eliminatedWrongChoices[qid] = choice;
    if (persist) storage.writeJson(StorageKeys.ELIMINATED_WRONG_CHOICES, _state.eliminatedWrongChoices);
  },
  removeEliminatedWrongChoice(qid: number, persist = true): void {
    delete _state.eliminatedWrongChoices[qid];
    if (persist) storage.writeJson(StorageKeys.ELIMINATED_WRONG_CHOICES, _state.eliminatedWrongChoices);
  },
  setEliminatedWrongChoices(map: Record<number, Choice>, persist = true): void {
    _state.eliminatedWrongChoices = { ...map };
    if (persist) storage.writeJson(StorageKeys.ELIMINATED_WRONG_CHOICES, _state.eliminatedWrongChoices);
  },
  clearAllEliminatedWrongChoices(persist = true): void {
    _state.eliminatedWrongChoices = {};
    if (persist) storage.writeJson(StorageKeys.ELIMINATED_WRONG_CHOICES, _state.eliminatedWrongChoices);
  },
  setStarredQuestionIds(ids: Iterable<number>, persist = true): void {
    _state.starredQuestionIds = new Set(ids);
    if (persist) storage.writeJson(StorageKeys.STARRED_QUESTIONS, Array.from(_state.starredQuestionIds));
  },
  toggleStarredQuestion(id: number, persist = true): boolean {
    const isNowStarred = !_state.starredQuestionIds.has(id);
    if (isNowStarred) {
      _state.starredQuestionIds.add(id);
    } else {
      _state.starredQuestionIds.delete(id);
    }
    if (persist) storage.writeJson(StorageKeys.STARRED_QUESTIONS, Array.from(_state.starredQuestionIds));
    return isNowStarred;
  },
  setRematchQuestionIds(ids: Iterable<number>, persist = true): void {
    _state.rematchQuestionIds = new Set(ids);
    if (persist) storage.writeJson(StorageKeys.REMATCH_QUESTIONS, Array.from(_state.rematchQuestionIds));
  },
  addRematchQuestion(id: number, persist = true): void {
    _state.rematchQuestionIds.add(id);
    if (persist) storage.writeJson(StorageKeys.REMATCH_QUESTIONS, Array.from(_state.rematchQuestionIds));
  },
  removeRematchQuestion(id: number, persist = true): void {
    _state.rematchQuestionIds.delete(id);
    if (persist) storage.writeJson(StorageKeys.REMATCH_QUESTIONS, Array.from(_state.rematchQuestionIds));
  },
  setLibraryMode(isLibrary: boolean, tab: LibraryTab = 'rematch'): void {
    _state.isLibraryMode = isLibrary;
    _state.libraryTab = tab;
  },
  setWaterStreak(streak: number, persist = true): void {
    _state.waterStreak = Math.max(0, streak);
    if (persist) {
      storage.writeString(StorageKeys.WATER_STREAK, String(_state.waterStreak));
      storage.writeString(StorageKeys.LAST_STREAK_DATE, new Date().toISOString().split('T')[0]);
    }
  },
  addWaterStreak(points: number, persist = true): void { this.setWaterStreak(_state.waterStreak + points, persist); },
  deductWaterStreak(deduct = 1, persist = true): void { this.setWaterStreak(_state.waterStreak - deduct, persist); },
  setColumnCount(n: number, persist = true): void {
    const valid = [1, 2, 3, 4].includes(n) ? n : 2;
    _state.currentColumnCount = valid;
    if (persist) storage.writeString(StorageKeys.COLUMN_COUNT, String(valid));
  },
  setZoomLevelIndex(idx: number): void { _state.zoomLevelIndex = idx; },
  setCanvasZoomScale(scale: number): void { _state.canvasZoomScale = Math.min(2.5, Math.max(0.85, scale)); },
  toggleFeaturesExpanded(): boolean {
    _state.isFeaturesExpanded = !_state.isFeaturesExpanded;
    return _state.isFeaturesExpanded;
  },
  toggleQuestionExpanded(id: number): boolean {
    const isNow = !_state.expandedQuestionIds.has(id);
    if (isNow) _state.expandedQuestionIds.add(id); else _state.expandedQuestionIds.delete(id);
    return isNow;
  },
  toggleAnswerReveal(qid: number): boolean {
    const isNow = !_state.revealedAnswers.has(qid);
    if (isNow) _state.revealedAnswers.add(qid); else _state.revealedAnswers.delete(qid);
    return isNow;
  },
  toggleHintReveal(qid: number): boolean {
    const isNow = !_state.revealedHints.has(qid);
    if (isNow) _state.revealedHints.add(qid); else _state.revealedHints.delete(qid);
    return isNow;
  },
  appendQuestions(questions: readonly Question[]): void {
    const knownIds = new Set(_state.allData.map(question => question.id));
    for (const question of questions) {
      if (knownIds.has(question.id)) continue;
      _state.allData.push(question);
      knownIds.add(question.id);
    }
  },
  setAllData(questions: readonly Question[]): void { _state.allData = [...questions]; },
  setAiExplanation(qid: number, entry: AiExplanationEntry, persist = true): void {
    _state.aiExplanations[qid] = entry;
    if (persist) storage.writeJson(StorageKeys.AI_EXPLANATIONS, _state.aiExplanations);
  },
  appendAiQuestionReply(qid: number, query: string, reply: string): void {
    const prev = _state.aiExplanations[qid];
    const past: AiExplanationMessage[] = [];
    if (prev?.query && prev?.reply) {
      past.push({ query: prev.query, reply: prev.reply, updatedAt: prev.updatedAt });
      if (prev.history && Array.isArray(prev.history)) past.push(...prev.history);
    }
    _state.aiExplanations[qid] = { query, reply, updatedAt: Date.now(), history: past };
    storage.writeJson(StorageKeys.AI_EXPLANATIONS, _state.aiExplanations);
  },
  clearAiExplanation(qid: number, persist = true): void {
    delete _state.aiExplanations[qid];
    if (persist) storage.writeJson(StorageKeys.AI_EXPLANATIONS, _state.aiExplanations);
  },
  setAiExplanations(map: Record<number, AiExplanationEntry>, persist = true): void {
    _state.aiExplanations = { ...map };
    if (persist) storage.writeJson(StorageKeys.AI_EXPLANATIONS, _state.aiExplanations);
  },
  setPendingAiQuestion(qid: number, isPending: boolean): void {
    if (isPending) _state.pendingAiQuestions.add(qid); else _state.pendingAiQuestions.delete(qid);
  },
  setTtsVoiceGender(gender: 'female' | 'male', persist = true): void {
    _state.ttsVoiceGender = gender;
    if (persist) storage.writeString(StorageKeys.TTS_GENDER, gender);
  },
  setTtsVoiceEngine(engine: 1 | 2 | 3, persist = true): void {
    _state.ttsVoiceEngine = engine;
    if (persist) storage.writeString(StorageKeys.TTS_ENGINE, String(engine));
  },
};
