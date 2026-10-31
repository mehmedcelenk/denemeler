import { loadSubjectData } from '../data/questions.js';
import { state, store } from './state.ts';
import { readString } from './storage.ts';
import { renderDrawerSubjects, setSubject } from '../features/subjects/selection.js';
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
import { initResumeBanner } from '../features/booklet/resume.ts';

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
    await initApp();
  } catch (error) {
    console.error(error);
    const container = document.getElementById('bookletPagesContainer');
    if (container) container.innerHTML = '<div style="max-width:620px; margin:60px auto; padding:28px; text-align:center; background:var(--paper-bg); border:1px solid var(--paper-border); border-radius:18px;"><strong>Veriler yüklenemedi.</strong><br><span style="display:block; margin-top:8px; color:var(--paper-text-muted);">Bağlantıyı kontrol edip sayfayı yeniden deneyin.</span></div>';
  }
  updatePrayerCountdown();
  setInterval(updatePrayerCountdown, 1000);
}

export async function initApp() {
  const savedCols = readString(StorageKeys.COLUMN_COUNT);
  if (savedCols) store.setColumnCount(parseInt(savedCols, 10) || 2, false);
  setColumnCount(state.currentColumnCount);

  const questions = await loadSubjectData('TDE');
  store.appendQuestions(questions);
  renderDrawerSubjects();
  await setSubject('TDE');
}
