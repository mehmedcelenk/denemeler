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
}
