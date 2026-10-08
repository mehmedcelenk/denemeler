import { getTopicKey } from '../../shared/topic.ts';
import { state, onStateChange } from '../../app/state.ts';
import { SUBJECTS, matchesSubject } from '../../data/subjects.js';
import { questionMatchesSearch } from '../../shared/search.ts';
import { getAggregatedTopics } from '../subjects/topic-model.js';
import { renderBookletPages } from './render.js';
import { filterQuestionsByMode } from '../../shared/question-filter.ts';

export function updateBookletQuestions() {
  if (!state.currentSubject) {
    const base = state.activeSearchFilter
      ? state.allData.filter(q => questionMatchesSearch(q, state.activeSearchFilter))
      : state.allData;
    state.bookletQuestions = filterQuestionsByMode(
      base,
      state.bookletFilterMode,
      state.userMarkedChoices,
      state.rematchQuestionIds,
      state.starredQuestionIds
    );
    updateTopBadge();
    renderBookletPages();
    return;
  }

  const validTopicKeys = new Set(getAggregatedTopics().map(t => t.key));

  const filtered = state.allData.filter(q => {
    if (!matchesSubject(q, state.currentSubject)) return false;
    if (!state.selectedCourses.has(q.ders)) return false;
    const qKey = getTopicKey(q);
    if (!validTopicKeys.has(qKey)) return false;
    if (state.selectedTopicKey && qKey !== state.selectedTopicKey) return false;
    if (state.activeSearchFilter && !questionMatchesSearch(q, state.activeSearchFilter)) return false;
    return true;
  });

  state.bookletQuestions = filterQuestionsByMode(
    filtered,
    state.bookletFilterMode,
    state.userMarkedChoices,
    state.rematchQuestionIds,
    state.starredQuestionIds
  );

  updateTopBadge();
  renderBookletPages();
}

import { updateTTSVoiceControlVisibility } from '../audio/audio.js';

export function updateTopBadge(customTitle) {
  const emojiEl = document.getElementById('badgeEmoji');
  const textEl = document.getElementById('badgeMainText');
  const badgeBtn = document.getElementById('topCenterBadge');

  if (state.isLibraryMode) {
    if (emojiEl) emojiEl.textContent = state.libraryTab === 'rematch' ? '⚔️' : '⭐';
    if (textEl) textEl.textContent = state.libraryTab === 'rematch' ? 'Rövanşlar' : 'Yıldızlılar';
    if (badgeBtn) {
      badgeBtn.title = state.libraryTab === 'rematch' ? 'Rövanşlar (Tüm Dersler)' : 'Yıldızlılar';
    }
    return;
  }

  if (state.activeSearchFilter) {
    if (emojiEl) emojiEl.textContent = '🔍';
    if (textEl) textEl.textContent = `Arama: "${state.activeSearchFilter}"`;
    if (badgeBtn) {
      badgeBtn.title = `Arama: "${state.activeSearchFilter}" • Toplam ${state.bookletQuestions.length} Soru`;
    }
    return;
  }

  if (customTitle) {
    if (emojiEl) emojiEl.textContent = '🔀';
    if (textEl) textEl.textContent = customTitle;
    return;
  }

  let badgeEmoji = '📚';
  let titleStr = 'Tüm Dersler';

  if (state.currentSubject) {
    const subjDef = SUBJECTS.find(s => s.id === state.currentSubject) || SUBJECTS[1];
    badgeEmoji = subjDef.icon;
    titleStr = subjDef.shortName || subjDef.id;
  } else {
    badgeEmoji = '🌐';
    titleStr = 'Tüm Branşlar';
  }

  if (badgeBtn) {
    const topicLabel = state.selectedTopicKey || 'Tüm Konular';
    badgeBtn.title = `${titleStr} • ${topicLabel} • Toplam ${state.bookletQuestions.length} Soru`;
  }

  if (emojiEl) emojiEl.textContent = badgeEmoji;
  if (textEl) textEl.textContent = titleStr;
  updateTTSVoiceControlVisibility();
}

onStateChange('booklet:refresh', () => {
  updateBookletQuestions();
});

onStateChange('booklet:updated', (payload) => {
  const customTitle = (payload && typeof payload === 'object' && 'customTitle' in payload)
    ? payload.customTitle
    : undefined;
  updateTopBadge(customTitle);
  const targetQid = (payload && typeof payload === 'object' && 'targetQid' in payload)
    ? payload.targetQid
    : undefined;
  renderBookletPages(targetQid);
});

