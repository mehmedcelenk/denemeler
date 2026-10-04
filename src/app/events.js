import { calcAction } from '../features/calculator/calculator.js';
import { clearAllMarks, undoClearMarks, handleSelectOpticalBubble } from '../features/answers/marking.js';
import { clearDrawerSearch, handleDrawerSearch, loadAllSearchResultsToBooklet, loadSingleSearchQuestion } from '../features/search/search.js';
import { closePdfDialog, executePdfPrint, openPdfDialog } from '../features/print/print.js';
import { closeSubjectDrawer, handleDrawerOverlayClick } from '../features/subjects/drawer-visibility.js';
import { loadAllTopicsToBooklet, selectTopicFromDrawer } from '../features/subjects/topics.js';
import { openSubjectDrawer } from '../features/subjects/drawer.js';
import { setAccentColor } from '../features/appearance/accent.js';
import { resetBookletCanvasZoom, setColumnCount, toggleConsoleMenu, toggleFullscreenFocusMode, zoomIn, zoomOut } from '../features/appearance/layout.js';
import { setCourseFilterMode } from '../features/subjects/filters.js';
import { setTTSVoiceGender, speakSingleOption, toggleSpeakQuestion, toggleTTSVoiceGenderQuick } from '../features/audio/audio.js';
import { setThemeMode } from '../features/appearance/theme.js';
import { showVocabBubble } from '../features/english/vocabulary.js';
import { switchSubjectFromDrawer, toggleCourseInDrawer, toggleSubjectDropdown, selectSubjectFromDropdown, toggleLevelDropdown, selectLevelFromDropdown, handleIntersectionToggle, toggleCourseLevel } from '../features/subjects/selection.js';
import { toggleCalcMode, toggleMiniCalculator } from '../features/calculator/calculator.js';
import { toggleCümleRöntgeni, toggleQuestionTranslation, toggleTrapExplanation } from '../features/english/translations.js';
import { togglePageKey, toggleSingleAnswerReveal, toggleSingleHint } from '../features/answers/reveal.js';
import { toggleFormulaNote } from '../features/formulas/formula-modal.ts';
import { confirmConfidence, cancelConfidencePrompt } from '../features/answers/confidence.ts';
import { setBookletFilter } from '../features/booklet/filter.ts';
import { resumeLastSession, dismissResumeBanner } from '../features/booklet/resume.ts';
import { openLibraryView, switchLibraryTab, exitLibraryView } from '../features/library/library-drawer.ts';
import { startInterleavedExam } from '../features/subjects/exam-mode.ts';
import { toggleStarQuestionUI, handleRematchDontKnow } from '../features/library/library-actions.ts';
import { openBoardFocusMode, closeBoardFocusMode, navigateBoardQuestion, handleBoardOverlayClick, resetBoardPan } from '../features/board/board-mode.ts';
import { showEdebiKimlikKarti, showDivanBubble, hideTdePopups } from '../features/tde/edebiyat-pusulasi.ts';

/** Eski HTML ve soru şablonlarındaki inline olayların tek bağlantı noktası. */
export function registerLegacyHandlers() {
  Object.assign(window, {
    calcAction,
    cancelConfidencePrompt,
    clearAllMarks,
    clearDrawerSearch,
    closeBoardFocusMode,
    closePdfDialog,
    closeSubjectDrawer,
    confirmConfidence,
    dismissResumeBanner,
    executePdfPrint,
    exitLibraryView,
    handleBoardOverlayClick,
    handleDrawerOverlayClick,
    handleDrawerSearch,
    handleIntersectionToggle,
    handleRematchDontKnow,
    handleSelectOpticalBubble,
    loadAllSearchResultsToBooklet,
    loadAllTopicsToBooklet,
    loadSingleSearchQuestion,
    navigateBoardQuestion,
    hideTdePopups,
    openBoardFocusMode,
    openExamModal: startInterleavedExam,
    openLibraryView,
    openPdfDialog,
    openSubjectDrawer,
    resetBoardPan,
    resetBookletCanvasZoom,
    resumeLastSession,
    selectLevelFromDropdown,
    selectSubjectFromDropdown,
    selectTopicFromDrawer,
    setAccentColor,
    setBookletFilter,
    setColumnCount,
    setCourseFilterMode,
    setTTSVoiceGender,
    setThemeMode,
    showDivanBubble,
    showEdebiKimlikKarti,
    showVocabBubble,
    speakSingleOption,
    startInterleavedExam,
    switchLibraryTab,
    switchSubjectFromDrawer,
    toggleCalcMode,
    toggleConsoleMenu,
    toggleCourseInDrawer,
    toggleCourseLevel,
    toggleCümleRöntgeni,
    toggleFormulaNote,
    toggleFullscreenFocusMode,
    toggleLevelDropdown,
    toggleMiniCalculator,
    togglePageKey,
    toggleQuestionTranslation,
    toggleSingleAnswerReveal,
    toggleSingleHint,
    toggleSpeakQuestion,
    toggleStarQuestionUI,
    toggleSubjectDropdown,
    toggleTTSVoiceGenderQuick,
    toggleTrapExplanation,
    undoClearMarks,
    zoomIn,
    zoomOut,
  });
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
      case 'undo-clear-marks':
        undoClearMarks();
        break;
      case 'zoom-out':
        zoomOut();
        break;
      case 'zoom-in':
        zoomIn();
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
      case 'set-tts-gender':
        if (el.dataset.gender) setTTSVoiceGender(el.dataset.gender);
        break;
      case 'set-accent-color':
        if (el.dataset.color) setAccentColor(el.dataset.color);
        break;
      case 'toggle-calculator':
        toggleMiniCalculator();
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
      default:
        break;
    }
  });

  document.addEventListener('input', (event) => {
    if (event.target && event.target.id === 'drawerSearchInput') {
      handleDrawerSearch(event.target.value);
    }
  });

  document.addEventListener('change', (event) => {
    if (event.target && event.target.id === 'chkIntersectionSwitch') {
      handleIntersectionToggle(event.target.checked);
    }
  });
}


