import {
  clearAllMarks,
  handleSelectOpticalBubble,
  togglePageKey,
  toggleSingleAnswerReveal,
} from '../features/answers/marking.ts';
import { clearDrawerSearch, loadAllSearchResultsToBooklet, loadSingleSearchQuestion } from '../features/search/search.js';
import { closePdfDialog, executePdfPrint, openPdfDialog } from '../features/print/print.js';
import { closeSubjectDrawer, openSubjectDrawer } from '../features/subjects/drawer.ts';
import { loadAllTopicsToBooklet, setDrawerTab } from '../features/subjects/topics.js';
import {
  setAccentColor,
  cycleAccentColor,
  resetBookletCanvasZoom,
  setColumnCount,
  cycleColumnCount,
  cycleZoomLevel,
  toggleConsoleMenu,
  toggleFullscreenFocusMode,
  zoomIn,
  zoomOut,
  setThemeMode,
  toggleTheme,
} from '../features/appearance/preferences.ts';
import {
  toggleFeaturesBar,
  toggleQuestionFeatures,
  eliminateOneWrongChoice,
  copyQuestionText,
  toggleSpeakQuestion,
  toggleGrammarLayer,
} from '../features/booklet/features-bar.ts';
import { cycleVoiceGender, cycleVoiceEngine } from '../features/audio/voice-gender.ts';
import { showVocabBubble } from '../features/english/vocabulary.js';
import { toggleSubjectDropdown, selectSubjectFromDropdown, handleDropdownItemSelect, handleIntersectionToggle, toggleCourseLevel, setProgramMode, addSubjectRow, removeSubjectRow } from '../features/subjects/selection.js';
import { toggleQuestionTranslation } from '../features/english/translations.js';
import { toggleQuestionMeal } from '../features/english/interlinear.ts';
import { showAnswerExplanationBubble } from '../features/answers/explanation.ts';
import { setBookletFilter, setUnifiedMode } from '../features/booklet/filter.ts';
import { setContentViewMode } from '../features/booklet/view-mode.ts';
import { resumeLastSession, dismissResumeBanner } from '../features/booklet/resume.ts';
import { exitLibraryView } from '../features/library/library-drawer.ts';
import { startInterleavedExam } from '../features/subjects/exam-mode.ts';
import { toggleStarQuestionUI } from '../features/library/library-actions.ts';
import { openBoardFocusMode, closeBoardFocusMode, resetBoardPan } from '../features/board/board-mode.ts';
import { state } from '../app/state.ts';
import { showEdebiKimlikKarti, showDivanBubble, hideTdePopups } from '../features/tde/edebiyat-pusulasi.ts';

/** Eski HTML ve soru şablonlarındaki inline olayların tek bağlantı noktası. */
export function registerLegacyHandlers() {
  Object.assign(window, {
    handleDropdownItemSelect,
    handleSelectOpticalBubble,
    hideTdePopups,
    loadSingleSearchQuestion,
    openBoardFocusMode,
    selectSubjectFromDropdown,
    showAnswerExplanationBubble,
    showDivanBubble,
    showEdebiKimlikKarti,
    showVocabBubble,
    addSubjectRow,
    removeSubjectRow,
    toggleCourseLevel,
    toggleSubjectDropdown,
    togglePageKey,
    toggleQuestionTranslation,
    toggleQuestionMeal,
    toggleSingleAnswerReveal,
    toggleStarQuestionUI,
    eliminateOneWrongChoice,
    copyQuestionText,
    toggleSpeakQuestion,
    toggleGrammarLayer,
    cycleVoiceGender,
    cycleVoiceEngine,
    setDrawerTab,
  });

  // E2E test kancaları
  window.clearAllMarks = clearAllMarks;
  window.toggleFeaturesBar = toggleFeaturesBar;
  window.setThemeMode = setThemeMode;
  window.setColumnCount = setColumnCount;
  window.openPdfDialog = openPdfDialog;
  window.cycleVoiceEngine = cycleVoiceEngine;
  window.cycleVoiceGender = cycleVoiceGender;

  setupEventDelegation();
}

/** Statik HTML kontrolleri için merkezi tekil olay delegasyonu. */
export function setupEventDelegation() {
  if (typeof document === 'undefined') return;

  document.addEventListener('click', (event) => {
    if (event.target && event.target.id === 'drawerOverlay') {
      closeSubjectDrawer();
      return;
    }
    if (event.target && event.target.id === 'pdfDialogOverlay') {
      closePdfDialog();
      return;
    }

    const el = event.target && event.target.closest ? event.target.closest('[data-action]') : null;
    if (!el) return;

    const action = el.dataset.action;
    switch (action) {
      case 'open-subject-drawer':
        openSubjectDrawer();
        break;
      case 'close-subject-drawer':
        closeSubjectDrawer();
        break;
      case 'set-booklet-filter':
        if (el.dataset.filter) setBookletFilter(el.dataset.filter);
        break;
      case 'set-content-view':
        if (el.dataset.view) setContentViewMode(el.dataset.view);
        break;
      case 'resume-last-session':
        resumeLastSession();
        break;
      case 'dismiss-resume-banner':
        dismissResumeBanner();
        break;
      case 'reset-board-pan':
        resetBoardPan();
        break;
      case 'close-board-focus':
        closeBoardFocusMode();
        break;
      case 'reset-canvas-zoom':
        resetBookletCanvasZoom();
        break;
      case 'clear-all-marks':
        clearAllMarks();
        break;
      case 'zoom-out':
        zoomOut();
        break;
      case 'zoom-in':
        zoomIn();
        break;
      case 'cycle-column-count':
        cycleColumnCount();
        break;
      case 'cycle-zoom-level':
        cycleZoomLevel();
        break;
      case 'cycle-theme-mode':
        toggleTheme();
        break;
      case 'cycle-accent-color':
        cycleAccentColor();
        break;
      case 'cycle-tts-gender':
        cycleVoiceGender();
        break;
      case 'cycle-tts-engine':
        cycleVoiceEngine();
        break;
      case 'toggle-fullscreen':
        toggleFullscreenFocusMode();
        break;
      case 'set-column-count':
        if (el.dataset.cols) setColumnCount(Number(el.dataset.cols));
        break;
      case 'set-theme-mode':
        if (el.dataset.theme) setThemeMode(el.dataset.theme);
        break;
      case 'set-accent-color':
        if (el.dataset.color) setAccentColor(el.dataset.color);
        break;
      case 'open-pdf-dialog':
        openPdfDialog();
        break;
      case 'close-pdf-dialog':
        closePdfDialog();
        break;
      case 'execute-pdf-print':
        executePdfPrint();
        break;
      case 'toggle-console-menu':
        toggleConsoleMenu();
        break;
      case 'toggle-features-bar':
        toggleFeaturesBar();
        break;
      case 'toggle-question-features':
        if (el.dataset.qid) toggleQuestionFeatures(Number(el.dataset.qid));
        break;
      case 'toggle-question-meal':
        if (el.dataset.qid) toggleQuestionMeal(Number(el.dataset.qid), event);
        break;
      case 'toggle-xray-syntax':
        if (el.dataset.qid) toggleGrammarLayer(Number(el.dataset.qid), 'syntax', event);
        break;
      case 'toggle-xray-pos':
        if (el.dataset.qid) toggleGrammarLayer(Number(el.dataset.qid), 'pos', event);
        break;
      case 'toggle-xray-sound':
        if (el.dataset.qid) toggleGrammarLayer(Number(el.dataset.qid), 'sound', event);
        break;
      case 'toggle-question-translation':
        if (el.dataset.qid && el.dataset.lang) toggleQuestionTranslation(Number(el.dataset.qid), el.dataset.lang, event);
        break;
      case 'toggle-star-question':
        if (el.dataset.qid) toggleStarQuestionUI(Number(el.dataset.qid), event);
        break;
      case 'open-board-focus':
        if (el.dataset.qid) openBoardFocusMode(Number(el.dataset.qid), event);
        break;
      case 'toggle-answer-reveal':
        if (el.dataset.qid) toggleSingleAnswerReveal(Number(el.dataset.qid));
        break;
      case 'eliminate-wrong-choice':
        if (el.dataset.qid) eliminateOneWrongChoice(Number(el.dataset.qid));
        break;
      case 'copy-question-text':
        if (el.dataset.qid) copyQuestionText(Number(el.dataset.qid));
        break;
      case 'speak-question':
        if (el.dataset.qid) toggleSpeakQuestion(Number(el.dataset.qid), event);
        break;
      case 'set-unified-mode':
        if (el.dataset.mode) setUnifiedMode(el.dataset.mode);
        break;
      case 'clear-drawer-search':
        clearDrawerSearch();
        break;
      case 'load-all-search':
        loadAllSearchResultsToBooklet();
        break;
      case 'exit-library-and-close-drawer':
        exitLibraryView();
        closeSubjectDrawer();
        break;
      case 'toggle-subject-dropdown':
        toggleSubjectDropdown();
        break;
      case 'start-interleaved-exam':
        startInterleavedExam();
        break;
      case 'load-all-topics':
        loadAllTopicsToBooklet();
        break;
      case 'toggle-intersection':
        handleIntersectionToggle(state.courseFilterMode !== 'AND');
        break;
      case 'set-program-mode':
        if (el.dataset.program) setProgramMode(el.dataset.program);
        break;
      case 'set-drawer-tab':
        if (el.dataset.tab) setDrawerTab(el.dataset.tab);
        break;
      case 'add-subject-row':
        addSubjectRow();
        break;
      case 'remove-subject-row':
        if (el.dataset.subject) removeSubjectRow(el.dataset.subject);
        break;
      default:
        break;
    }
  });

  document.addEventListener('change', (event) => {
    if (event.target && event.target.id === 'chkIntersectionSwitch') {
      handleIntersectionToggle(event.target.checked);
    }
  });
}


