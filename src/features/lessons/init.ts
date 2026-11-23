import { registerActions } from '../../app/actions.ts';
import { notifyStateChange, onStateChange, state } from '../../app/state.ts';
import {
  cacheSingleLesson,
  getCachedLesson,
  hasCachedLesson,
  isSubjectLessonsLoaded,
  loadSubjectLessons,
} from '../../data/lesson.ts';
import type { Question } from '../../data/question.ts';
import { fetchQuestionLessonFromSupabase } from '../../data/supabase-client.ts';
import { registerCardHook, type CardHook } from '../booklet/card-hooks.ts';
import {
  bindLessonPanelListeners,
  closeLessonPanel,
  closeAllLessonPanelsForQuestion,
  hideLessonConceptBubble,
  isLessonPanelOpen,
  showLessonContent,
  showLessonEmpty,
  showLessonLoading,
} from './lesson-panel.ts';
import { renderLessonInlineHost, renderLessonToolbarButton } from './lesson-view.ts';

let initialized = false;
const openRequestSeqByQid = new Map<number, number>();

function findQuestionById(qid: number): Question | undefined {
  return state.bookletQuestions.find(item => item.id === qid)
    || state.allData.find(item => item.id === qid);
}

function resolveQuestionSubject(q?: Question): string | null {
  if (q?.subject) return String(q.subject);
  if (state.currentSubject) return String(state.currentSubject);
  return null;
}

function collectVisibleSubjects(): string[] {
  const subjects = new Set<string>();
  if (state.currentSubject) subjects.add(String(state.currentSubject));
  for (const q of state.bookletQuestions.slice(0, 40)) {
    if (q.subject) subjects.add(String(q.subject));
  }
  return Array.from(subjects);
}

function preloadLessonsForSubjects(subjects: readonly string[]): void {
  for (const subject of subjects) {
    if (!subject || isSubjectLessonsLoaded(subject)) continue;
    void loadSubjectLessons(subject).then(lessons => {
      if (lessons.length > 0) {
        notifyStateChange('booklet:refresh-hooks');
      }
    });
  }
}

export async function openQuestionLesson(
  qidInput: number | string,
  event?: Event,
  sourceEl?: Element | null,
): Promise<void> {
  if (event) {
    event.stopPropagation();
    event.preventDefault();
  }
  const qid = Number(qidInput);
  if (Number.isNaN(qid) || qid <= 0 || !state.userMarkedChoices[qid]) return;

  if (isLessonPanelOpen(qid, sourceEl)) {
    closeLessonPanel(qid, sourceEl);
    return;
  }

  const q = findQuestionById(qid);
  const cached = getCachedLesson(qid);
  if (cached) {
    showLessonContent(cached, sourceEl);
    return;
  }

  const requestId = (openRequestSeqByQid.get(qid) || 0) + 1;
  openRequestSeqByQid.set(qid, requestId);
  showLessonLoading(qid, q, sourceEl);

  const subject = resolveQuestionSubject(q);
  if (subject && !isSubjectLessonsLoaded(subject)) {
    const loaded = await loadSubjectLessons(subject);
    if (loaded.length > 0) notifyStateChange('booklet:refresh-hooks');
    if (!state.userMarkedChoices[qid] || openRequestSeqByQid.get(qid) !== requestId || !isLessonPanelOpen(qid, sourceEl)) return;
  }

  let lesson = getCachedLesson(qid);
  if (!lesson) {
    const fromCloud = await fetchQuestionLessonFromSupabase(qid);
    if (fromCloud) {
      cacheSingleLesson(fromCloud);
      lesson = fromCloud;
      notifyStateChange('booklet:refresh-hooks');
    }
    if (!state.userMarkedChoices[qid] || openRequestSeqByQid.get(qid) !== requestId || !isLessonPanelOpen(qid, sourceEl)) return;
  }

  if (lesson) {
    showLessonContent(lesson, sourceEl);
  } else {
    showLessonEmpty(qid, q, sourceEl);
  }
}

const lessonCardHook: CardHook = {
  toolbar(q) {
    return state.userMarkedChoices[q.id]
      ? renderLessonToolbarButton(q, hasCachedLesson(q.id), isLessonPanelOpen(q.id))
      : '';
  },
  below(q) {
    return renderLessonInlineHost(q);
  },
};

export function initLessons(): void {
  if (initialized) return;
  initialized = true;

  bindLessonPanelListeners();
  registerCardHook(lessonCardHook);
  registerActions({
    'open-question-lesson': (target, event) => {
      void openQuestionLesson(target.dataset.qid || '', event, target);
    },
  });

  onStateChange('answer:marked', (payload) => {
    if (!payload || typeof payload !== 'object' || !('qid' in payload)
      || typeof payload.qid !== 'number' || !('isCorrect' in payload)) return;
    notifyStateChange('booklet:refresh-hooks');
    if (payload.isCorrect === false) {
      const source = typeof Element !== 'undefined' && 'sourceEl' in payload && payload.sourceEl instanceof Element ? payload.sourceEl : null;
      if (!isLessonPanelOpen(payload.qid, source)) void openQuestionLesson(payload.qid, undefined, source);
    }
  });
  onStateChange('booklet:refresh-hooks', () => {
    if (typeof document === 'undefined') return;
    document.querySelectorAll<HTMLElement>('.booklet-question[data-qid]').forEach(card => {
      const qid = Number(card.dataset.qid);
      if (!state.userMarkedChoices[qid]) closeAllLessonPanelsForQuestion(qid);
    });
  });
  onStateChange('booklet:rendered', () => {
    hideLessonConceptBubble();
    preloadLessonsForSubjects(collectVisibleSubjects());
  });
  onStateChange('booklet:updated', () => {
    hideLessonConceptBubble();
    preloadLessonsForSubjects(collectVisibleSubjects());
  });
  onStateChange('board:render-question', () => hideLessonConceptBubble());
  onStateChange('booklet:ensure-question', () => hideLessonConceptBubble());
}
