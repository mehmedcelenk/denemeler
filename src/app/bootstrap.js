import { state, store } from './state.ts';
import { readString } from './storage.ts';
import { updatePrayerCountdown } from '../features/prayer/prayer.js';
import { initBookletCanvasZoom, initTheme, initAccentColor, setColumnCount } from '../features/appearance/preferences.ts';
import { StorageKeys } from '../shared/storage-keys.ts';
import { loadSavedChoices } from '../features/answers/marking.ts';
import { initChoiceElimination } from '../features/annotations/eliminate-choice.ts';
import { initTextHighlighter } from '../features/annotations/highlighter.ts';
import { initRoomFeature } from '../features/classroom/room-ui.ts';
import { initEnglish } from '../features/english/init.ts';
import { loadLibraryData } from '../features/library/library-model.ts';
import { initLibrary } from '../features/library/init.ts';
import { initAnswers } from '../features/answers/init.ts';
import { initAppearance } from '../features/appearance/init.ts';
import { initBooklet } from '../features/booklet/init.ts';
import { initSubjects } from '../features/subjects/init.ts';
import { initBoard } from '../features/board/init.ts';
import { initPrint } from '../features/print/init.ts';
import { initSearch } from '../features/search/init.ts';
import { initTde } from '../features/tde/init.ts';
import { initGamification } from '../features/gamification/init.ts';
import { loadStreak } from '../features/gamification/streak.ts';
import { dismissResumeBanner, initResumeBanner, loadSessionSnapshot } from '../features/booklet/resume.ts';
import { initWelcome } from '../features/welcome/init.ts';
import { setUnifiedMode } from '../features/booklet/filter.ts';
import { roomService } from '../features/classroom/room-service.ts';
import { loadRoomSession } from '../features/classroom/session-store.ts';
import { closeSubjectDrawer, openSubjectDrawer } from '../features/subjects/drawer.ts';
import { setSubject } from '../features/subjects/selection.js';

export async function startApp() {
  initAnswers();
  initAppearance();
  initBooklet();
  initSubjects();
  initBoard();
  initPrint();
  initSearch();
  initTde();
  if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
    navigator.serviceWorker.register('./sw.js').catch(() => {});
  }
  loadSavedChoices();
  loadLibraryData();
  loadStreak();
  initGamification();
  initResumeBanner();
  initTheme();
  initAccentColor();
  initEnglish();
  initBookletCanvasZoom();
  initChoiceElimination();
  initTextHighlighter();
  initRoomFeature();
  initLibrary();
  try {
    initApp();
    const activeRoom = loadRoomSession();
    const hasActiveRoom = Boolean(activeRoom && activeRoom.roomId);

    initWelcome({
      closeSubjectDrawer,
      dismissResumeBanner,
      getSavedSession: loadSessionSnapshot,
      joinRoom: (roomId, userName) => roomService.joinOrCreateRoom(roomId, userName, true),
      loadSubject: setSubject,
      openSubjectDrawer,
      setUnifiedMode,
    }, { autoShow: !hasActiveRoom });
  } catch (error) {
    console.error(error);
  }
  updatePrayerCountdown();
  setInterval(updatePrayerCountdown, 1000);
}

export function initApp() {
  const savedCols = readString(StorageKeys.COLUMN_COUNT);
  if (savedCols) store.setColumnCount(parseInt(savedCols, 10) || 2, false);
  setColumnCount(state.currentColumnCount);
}
