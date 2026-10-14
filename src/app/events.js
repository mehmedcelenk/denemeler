import {
  clearAllMarks,
  handleSelectOpticalBubble,
  togglePageKey,
  toggleSingleAnswerReveal,
  toggleSingleHint,
} from '../features/answers/marking.ts';
import { clearDrawerSearch, loadAllSearchResultsToBooklet, loadSingleSearchQuestion } from '../features/search/search.js';
import { closePdfDialog, executePdfPrint, openPdfDialog } from '../features/print/print.js';
import { closeSubjectDrawer, openSubjectDrawer } from '../features/subjects/drawer.ts';
import { loadAllTopicsToBooklet } from '../features/subjects/topics.js';
import {
  setAccentColor,
  cycleAccentColor,
  resetBookletCanvasZoom,
  setColumnCount,
  cycleColumnCount,
  cycleZoomLevel,
  toggleConsoleMenu,
  toggleFeaturesBar,
  toggleQuestionFeatures,
  toggleFullscreenFocusMode,
  zoomIn,
  zoomOut,
  setThemeMode,
  toggleTheme,
} from '../features/appearance/preferences.ts';
import { showVocabBubble } from '../features/english/vocabulary.js';
import { toggleSubjectDropdown, selectSubjectFromDropdown, handleDropdownItemSelect, handleIntersectionToggle, toggleCourseLevel, setProgramMode, addSubjectRow, removeSubjectRow } from '../features/subjects/selection.js';
import { toggleCümleRöntgeni, toggleQuestionTranslation, toggleTrapExplanation } from '../features/english/translations.js';
import { showAnswerExplanationBubble } from '../features/answers/explanation.ts';
import { toggleFormulaNote } from '../features/formulas/formula-modal.ts';
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
    toggleCümleRöntgeni,
    toggleFormulaNote,
    togglePageKey,
    toggleQuestionTranslation,
    toggleSingleAnswerReveal,
    toggleSingleHint,
    toggleStarQuestionUI,
    toggleTrapExplanation,
  });

  // E2E test kancaları
  window.clearAllMarks = clearAllMarks;
  window.toggleFeaturesBar = toggleFeaturesBar;
  window.setThemeMode = setThemeMode;
  window.setColumnCount = setColumnCount;
  window.openPdfDialog = openPdfDialog;

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


