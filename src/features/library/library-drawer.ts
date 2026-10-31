import { state, store, notifyStateChange, type LibraryTab } from '../../app/state.ts';
import { loadSubjectData } from '../../data/questions.js';
import { SUBJECTS } from '../../data/subjects.js';
import { toggleConsoleMenu } from '../appearance/preferences.ts';

export async function openLibraryView(tab: LibraryTab = 'rematch'): Promise<void> {
  const popup = document.getElementById('consoleMenuPopup');
  if (popup && popup.classList.contains('active')) {
    toggleConsoleMenu();
  }

  store.setLibraryMode(true, tab);

  notifyStateChange('filter:updated');

  const targetIds = tab === 'rematch' ? state.rematchQuestionIds : state.starredQuestionIds;
  const tabTitle = tab === 'rematch' ? 'Rövanşlar' : 'Yıldızlılar';

  if (targetIds.size === 0) {
    store.setBookletQuestions([]);
    notifyStateChange('booklet:updated');
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
  for (const subject of SUBJECTS) {
    try {
      const questions = await loadSubjectData(subject.id);
      store.appendQuestions(questions);
    } catch {}
  }

  const selectedQuestions = state.allData.filter(q => targetIds.has(q.id));
  store.setBookletQuestions(selectedQuestions);

  notifyStateChange('booklet:updated');
}

export function switchLibraryTab(tab: LibraryTab): void {
  openLibraryView(tab);
}

export function exitLibraryView(): void {
  store.setLibraryMode(false);
  notifyStateChange('filter:updated');
  notifyStateChange('drawer:topics-refresh');
  notifyStateChange('booklet:refresh');
}

