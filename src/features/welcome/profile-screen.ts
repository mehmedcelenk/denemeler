import { registerActions } from '../../app/actions.ts';
import { notifyStateChange, onStateChange, state, store } from '../../app/state.ts';
import { getCourseCatalogBySubject } from '../../data/course-catalog.ts';
import {
  AOIHL_SUBJECTS,
  AOO_SUBJECTS,
  AOF_SUBJECTS,
  TYT_SUBJECTS,
  AYT_ALL_SUBJECTS,
  YDT_SUBJECTS,
  ILMIHAL_SUBJECTS,
  GIRISIMCILIK_SUBJECTS,
} from '../../data/subjects.js';
import {
  PROGRAM_OPTIONS,
  renderProfileEditHtml,
  renderProfileReadOnlyHtml,
  type ProgramMode,
} from './profile-screen-view.ts';

function isProgramMode(value: string): value is ProgramMode {
  return PROGRAM_OPTIONS.some(opt => opt.id === value);
}

export function getSubjectsForProgram(mode: ProgramMode) {
  if (mode === 'AOO') return AOO_SUBJECTS;
  if (mode === 'AOF') return AOF_SUBJECTS;
  if (mode === 'ILMIHAL') return ILMIHAL_SUBJECTS;
  if (mode === 'GIRISIMCILIK') return GIRISIMCILIK_SUBJECTS;
  if (mode === 'TYT') return TYT_SUBJECTS;
  if (mode === 'AYT') return AYT_ALL_SUBJECTS;
  if (mode === 'YDT') return YDT_SUBJECTS;
  return AOIHL_SUBJECTS;
}

let screenInitialized = false;
let isEditMode = false;
let draftProgram: ProgramMode = 'AOIHL';
let draftByProgram: Record<string, Set<string>> = {};
let onSavedCallback: (() => void) | null = null;

function getDraftSet(mode: ProgramMode): Set<string> {
  if (!draftByProgram[mode]) draftByProgram[mode] = new Set();
  return draftByProgram[mode];
}

function resetDraftFromState(): void {
  draftProgram = state.programMode;
  draftByProgram = {};
  for (const [prog, list] of Object.entries(state.responsibleCourses)) {
    draftByProgram[prog] = new Set(list);
  }
}

function getScreenEl(): HTMLElement | null {
  if (typeof document === 'undefined') return null;
  let el = document.getElementById('profileScreen');
  if (!el && document.body) {
    el = document.createElement('section');
    el.id = 'profileScreen';
    el.className = 'profile-screen';
    el.hidden = true;
    document.body.appendChild(el);
  }
  return el;
}

function getSelectedSummary(mode: ProgramMode, selected: ReadonlySet<string>): { count: number; credits: number } {
  const subjects = getSubjectsForProgram(mode);
  let count = 0;
  let credits = 0;
  for (const subj of subjects) {
    for (const entry of getCourseCatalogBySubject(subj.id)) {
      if (selected.has(entry.ders)) {
        count++;
        credits += entry.kredi;
      }
    }
  }
  return { count, credits };
}

function renderProfileScreen(): void {
  const screen = getScreenEl();
  if (!screen) return;
  const mode = isEditMode ? draftProgram : state.programMode;
  const selectedSet = isEditMode ? getDraftSet(mode) : new Set(state.responsibleCourses[mode] ?? []);
  const subjects = getSubjectsForProgram(mode);
  const { count, credits } = getSelectedSummary(mode, selectedSet);
  const countByProgram: Record<string, number> = {};
  for (const opt of PROGRAM_OPTIONS) {
    countByProgram[opt.id] = isEditMode
      ? (draftByProgram[opt.id]?.size ?? 0)
      : (state.responsibleCourses[opt.id]?.length ?? 0);
  }

  const input = {
    isEditMode,
    mode,
    mascotId: state.mascotId,
    subjects,
    selectedSet,
    countByProgram,
    selectedCount: count,
    selectedCredits: credits,
  };
  screen.innerHTML = isEditMode ? renderProfileEditHtml(input) : renderProfileReadOnlyHtml(input);
}

export function openProfileScreen(edit = false): void {
  const screen = getScreenEl();
  if (!screen) return;
  document.getElementById('consoleMenuPopup')?.classList.remove('open');
  document.getElementById('btnMasterConsole')?.setAttribute('aria-expanded', 'false');
  isEditMode = edit;
  resetDraftFromState();
  renderProfileScreen();
  screen.hidden = false;
  document.body.classList.add('profile-active');
  window.scrollTo({ top: 0, behavior: 'auto' });
}

export function closeProfileScreen(): void {
  isEditMode = false;
  const screen = document.getElementById('profileScreen');
  if (screen) screen.hidden = true;
  if (typeof document !== 'undefined') {
    document.body.classList.remove('profile-active');
  }
}

export function initProfileScreen(onSaved: () => void): void {
  onSavedCallback = onSaved;
  if (screenInitialized) return;
  screenInitialized = true;

  if (typeof document !== 'undefined' && typeof document.addEventListener === 'function') {
    document.addEventListener('keydown', event => {
      if (event.key !== 'Escape') return;
      if (document.body.classList.contains('profile-active')) {
        event.preventDefault();
        if (isEditMode) {
          isEditMode = false;
          resetDraftFromState();
          renderProfileScreen();
        } else {
          closeProfileScreen();
        }
      }
    });
  }

  onStateChange('study:changed', () => {
    if (typeof document !== 'undefined' && document.body.classList.contains('profile-active')) {
      resetDraftFromState();
      renderProfileScreen();
    }
  });

  onStateChange('mascot:changed', () => {
    if (typeof document !== 'undefined' && document.body.classList.contains('profile-active')) {
      renderProfileScreen();
    }
  });

  registerActions({
    'open-profile-screen': (el) => openProfileScreen(el?.dataset.edit === 'true'),
    'close-profile-screen': () => closeProfileScreen(),
    'enter-profile-edit-mode': () => {
      isEditMode = true;
      resetDraftFromState();
      renderProfileScreen();
    },
    'cancel-profile-edit-mode': () => {
      isEditMode = false;
      resetDraftFromState();
      renderProfileScreen();
    },
    'select-profile-program': (el) => {
      const prog = el?.dataset.program;
      if (!prog || !isProgramMode(prog)) return;
      draftProgram = prog;
      store.setProgramMode(prog);
      renderProfileScreen();
      onSavedCallback?.();
    },
    'toggle-responsible-course': (el) => {
      const ders = el?.dataset.ders;
      if (!ders) return;
      const set = getDraftSet(draftProgram);
      if (set.has(ders)) set.delete(ders);
      else set.add(ders);
      renderProfileScreen();
    },
    'clear-responsible-courses': () => {
      getDraftSet(draftProgram).clear();
      renderProfileScreen();
    },
    'save-responsible-courses': () => {
      const nextMap: Record<string, string[]> = {};
      for (const [prog, set] of Object.entries(draftByProgram)) {
        nextMap[prog] = Array.from(set);
      }
      store.setProgramMode(draftProgram);
      store.setResponsibleCourses(nextMap, true);
      notifyStateChange('progress:changed', { delayMs: 250 });
      closeProfileScreen();
      onSavedCallback?.();
    },
  });
}
