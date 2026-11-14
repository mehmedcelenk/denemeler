import type { Choice, Question, SubjectId } from '../data/question.ts';
import type { BookletFilterMode } from '../shared/question-filter.ts';
import type { InstitutionQuestionStat } from '../data/institution-stats.ts';
export type { Choice, Question, SubjectId, BookletFilterMode, InstitutionQuestionStat };
export type LibraryTab = 'starred' | 'rematch';
export type ContentViewMode = 'questions' | 'notes';

export interface RoomQuestionStat {
  readonly correct: number;
  readonly wrong: number;
}

export interface AnswerMarkedPayload {
  readonly qid: number;
  readonly choice: Choice;
  readonly isCorrect: boolean;
}

export interface AnswerRevokedPayload {
  readonly qid: number;
}


export interface AiExplanationMessage { readonly query: string; readonly reply: string; readonly updatedAt: number; }
export interface AiExplanationEntry { readonly query: string; readonly reply: string; readonly updatedAt: number; readonly history?: readonly AiExplanationMessage[]; }

export interface AppState {
  readonly allData: readonly Question[];
  readonly currentSubject: SubjectId | null;
  readonly programMode: 'AOIHL' | 'AOO' | 'AOF' | 'TYT' | 'AYT' | 'YDT' | 'ILMIHAL' | 'GIRISIMCILIK';
  readonly selectedCourses: ReadonlySet<string>;
  readonly courseFilterMode: 'AND' | 'OR';
  readonly selectedTopicKeys: ReadonlySet<string>;
  readonly selectedExamPeriod: string | null;
  readonly bookletQuestions: readonly Question[];
  readonly bookletFilterMode: BookletFilterMode;
  readonly contentViewMode: ContentViewMode;
  readonly activeSearchFilter: string;
  readonly userMarkedChoices: Readonly<Record<number, Choice>>;
  readonly pendingMarkedChoices: Readonly<Record<number, Choice>>;
  readonly activeBoardQuestionId: number | null;
  readonly activeMealQuestionIds: ReadonlySet<number>;
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
  readonly eliminatedWrongChoices: Readonly<Record<number, Choice>>;
  readonly aiExplanations: Readonly<Record<number, AiExplanationEntry>>;
  readonly pendingAiQuestions: ReadonlySet<number>;
  readonly ttsVoiceGender: 'female' | 'male';
  readonly ttsVoiceEngine: 1 | 2 | 3;
  readonly institutionStats: Readonly<Record<number, InstitutionQuestionStat>>;
  readonly roomQuestionStats: Readonly<Record<number, RoomQuestionStat>>;
  readonly isRoomActive: boolean;
  readonly isXraySoundEnabled: boolean;
}
export interface MutableAppState {
  allData: Question[];
  currentSubject: SubjectId | null;
  programMode: 'AOIHL' | 'AOO' | 'AOF' | 'TYT' | 'AYT' | 'YDT' | 'ILMIHAL' | 'GIRISIMCILIK';
  selectedCourses: Set<string>;
  courseFilterMode: 'AND' | 'OR';
  selectedTopicKeys: Set<string>;
  selectedExamPeriod: string | null;
  bookletQuestions: Question[];
  bookletFilterMode: BookletFilterMode;
  contentViewMode: ContentViewMode;
  activeSearchFilter: string;
  userMarkedChoices: Record<number, Choice>;
  pendingMarkedChoices: Record<number, Choice>;
  activeBoardQuestionId: number | null;
  activeMealQuestionIds: Set<number>;
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
  eliminatedWrongChoices: Record<number, Choice>;
  aiExplanations: Record<number, AiExplanationEntry>;
  pendingAiQuestions: Set<number>;
  ttsVoiceGender: 'female' | 'male';
  ttsVoiceEngine: 1 | 2 | 3;
  institutionStats: Record<number, InstitutionQuestionStat>;
  roomQuestionStats: Record<number, RoomQuestionStat>;
  isRoomActive: boolean;
  isXraySoundEnabled: boolean;
}
