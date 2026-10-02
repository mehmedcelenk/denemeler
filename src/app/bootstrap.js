import { loadSubjectData } from '../data/questions.js';
import { state } from './state.ts';
import { renderDrawerSubjects, setSubject } from '../features/subjects/selection.js';
import { updatePrayerCountdown } from '../features/prayer/prayer.js';
import { updateTTSGenderUI } from '../features/audio/audio.js';
import { initBookletCanvasZoom, setColumnCount } from '../features/appearance/layout.js';
import { initDraggableCalculator } from '../features/calculator/calculator.js';
import { loadSavedChoices } from '../features/answers/storage.js';
import { initTheme } from '../features/appearance/theme.js';
import { initAccentColor } from '../features/appearance/accent.js';

export async function startApp() {
  loadSavedChoices();
  initTheme();
  initAccentColor();
  updateTTSGenderUI();
  initBookletCanvasZoom();
  try {
    await initApp();
  } catch (error) {
    console.error(error);
    const container = document.getElementById('bookletPagesContainer');
    if (container) container.innerHTML = '<div style="max-width:620px; margin:60px auto; padding:28px; text-align:center; background:var(--paper-bg); border:1px solid var(--paper-border); border-radius:18px;"><strong>Veriler yüklenemedi.</strong><br><span style="display:block; margin-top:8px; color:var(--paper-text-muted);">Bağlantıyı kontrol edip sayfayı yeniden deneyin.</span></div>';
  }
  initDraggableCalculator();
  updatePrayerCountdown();
  setInterval(updatePrayerCountdown, 1000);
}

export async function initApp() {
  try {
    const savedCols = localStorage.getItem('aol_column_count');
    if (savedCols) {
      state.currentColumnCount = parseInt(savedCols, 10) || 2;
    }
  } catch (e) {}
  setColumnCount(state.currentColumnCount);

  await loadSubjectData('TDE');
  renderDrawerSubjects();
  await setSubject('TDE');
}
