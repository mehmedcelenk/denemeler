import { loadSubjectData } from '../data/questions.js';
import { state } from './state.ts';
import { renderDrawerSubjects, setSubject } from '../features/subjects/selection.js';
import { updatePrayerCountdown } from '../features/prayer/prayer.js';
import { initBookletCanvasZoom, initTheme, initAccentColor, setColumnCount } from '../features/appearance/preferences.ts';
import { StorageKeys } from '../shared/storage-keys.ts';
import { loadSavedChoices } from '../features/answers/storage.js';

export async function startApp() {
  if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
    navigator.serviceWorker.register('./sw.js').catch(() => {});
  }
  loadSavedChoices();
  initTheme();
  initAccentColor();
  initBookletCanvasZoom();
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
  try {
    const savedCols = localStorage.getItem(StorageKeys.COLUMN_COUNT);
    if (savedCols) {
      state.currentColumnCount = parseInt(savedCols, 10) || 2;
    }
  } catch (e) {}
  setColumnCount(state.currentColumnCount);

  await loadSubjectData('TDE');
  renderDrawerSubjects();
  await setSubject('TDE');
}
