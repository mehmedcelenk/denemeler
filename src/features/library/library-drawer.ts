import { state, type LibraryTab } from '../../app/state.ts';
import { loadSubjectData } from '../../data/questions.js';
import { SUBJECTS } from '../../data/subjects.js';
import { renderBookletPages } from '../booklet/render.js';
import { updateBookletQuestions, updateTopBadge } from '../booklet/selection.js';
import { toggleConsoleMenu } from '../appearance/layout.js';
import { updateFilterButtonsUI } from '../booklet/filter.ts';
import { renderDrawerSelectorBar } from '../subjects/selection.js';
import { renderDrawerTopics } from '../subjects/topics.js';

export async function openLibraryView(tab: LibraryTab = 'rematch'): Promise<void> {
  const popup = document.getElementById('consoleMenuPopup');
  if (popup && popup.classList.contains('active')) {
    toggleConsoleMenu();
  }

  state.isLibraryMode = true;
  state.libraryTab = tab;

  updateFilterButtonsUI();

  const targetIds = tab === 'rematch' ? state.rematchQuestionIds : state.starredQuestionIds;
  const tabTitle = tab === 'rematch' ? 'Rövanşlar' : 'Yıldızlılar';

  if (targetIds.size === 0) {
    state.bookletQuestions = [];
    updateTopBadge();
    const container = document.getElementById('bookletPagesContainer');
    if (container) {
      const msg = tab === 'rematch'
        ? 'Tebrikler! Şu an bekleyen bir rövanş sorunuz bulunmuyor. Yanlış yaptığınız veya tahminle çözdüğünüz sorular otomatik olarak buraya eklenir.'
        : 'Henüz yıldızladığınız soru bulunmuyor.';
      container.innerHTML = `
        <div style="background:var(--paper-bg); border:1px dashed var(--paper-border); padding:60px 20px; text-align:center; border-radius:12px; color:var(--paper-text-muted); max-width:620px; margin:40px auto;">
          <div style="font-size:32px; margin-bottom:12px;">${tab === 'rematch' ? '🏆' : '⭐'}</div>
          <div style="font-size:14px; font-weight:700; margin-bottom:6px; color:var(--paper-text);">${tabTitle}</div>
          <div style="font-size:12px; line-height:1.5;">${msg}</div>
        </div>
      `;
    }
    return;
  }

  // Tüm derslerin verilerini yükle (Gerekiyorsa)
  for (const s of Object.keys(SUBJECTS)) {
    try {
      await loadSubjectData(s);
    } catch {}
  }

  const selectedQuestions = state.allData.filter(q => targetIds.has(q.id));
  state.bookletQuestions = selectedQuestions;

  updateTopBadge();
  renderBookletPages();
}

export function switchLibraryTab(tab: LibraryTab): void {
  openLibraryView(tab);
}

export function exitLibraryView(): void {
  state.isLibraryMode = false;
  updateFilterButtonsUI();
  renderDrawerSelectorBar();
  renderDrawerTopics();
  updateBookletQuestions();
}

