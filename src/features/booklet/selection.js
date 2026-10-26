import { getTopicKey } from '../../shared/topic.ts';
import { state, store, onStateChange } from '../../app/state.ts';
import { SUBJECTS, matchesSubject } from '../../data/subjects.js';
import { questionMatchesSearch } from '../../shared/search.ts';
import { getAggregatedTopics } from '../subjects/topic-model.js';
import { renderBookletPages } from './render.js';
import { filterQuestionsByMode } from '../../shared/question-filter.ts';

export function updateBookletQuestions() {
  if (!state.currentSubject && state.selectedCourses.size === 0) {
    const base = state.activeSearchFilter
      ? state.allData.filter(q => questionMatchesSearch(q, state.activeSearchFilter))
      : state.allData;
    store.setBookletQuestions(filterQuestionsByMode(
      base,
      state.bookletFilterMode,
      state.userMarkedChoices,
      state.rematchQuestionIds,
      state.starredQuestionIds
    ));
    updateTopBadge();
    renderBookletPages();
    return;
  }

  const isTde = state.currentSubject === 'TDE' || Array.from(state.selectedCourses).some(c => c.includes('EDEBİYAT') || c.includes('TÜRK DİLİ'));
  const validTopicKeys = isTde ? new Set(getAggregatedTopics().map(t => t.key)) : null;

  const filtered = state.allData.filter(q => {
    if (state.selectedCourses.size > 0) {
      if (!state.selectedCourses.has(q.ders)) return false;
    } else if (state.currentSubject) {
      if (!matchesSubject(q, state.currentSubject)) return false;
    }
    if (state.selectedExamPeriod) {
      const qPeriod = `${q.yil || ''} ${q.donem ? `${q.donem}. Dönem` : ''}`.trim();
      if (qPeriod !== state.selectedExamPeriod) return false;
    }
    if (isTde && validTopicKeys) {
      const qKey = getTopicKey(q);
      if (!validTopicKeys.has(qKey)) return false;
      if (state.selectedTopicKeys.size > 0 && !state.selectedTopicKeys.has(qKey)) {
        return false;
      }
    }
    if (state.activeSearchFilter && !questionMatchesSearch(q, state.activeSearchFilter)) return false;
    return true;
  });

  if (state.selectedExamPeriod) {
    filtered.sort((a, b) => {
      const noA = Number(a.soru_no || 0);
      const noB = Number(b.soru_no || 0);
      return noA - noB;
    });
  }

  store.setBookletQuestions(filterQuestionsByMode(
    filtered,
    state.bookletFilterMode,
    state.userMarkedChoices,
    state.rematchQuestionIds,
    state.starredQuestionIds
  ));

  updateTopBadge();
  renderBookletPages();
}

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

  const activeSubjects = [];
  const seenSubjectIds = new Set();
  for (const c of state.selectedCourses) {
    const s = SUBJECTS.find(subj => matchesSubject({ ders: c }, subj.id));
    if (s && !seenSubjectIds.has(s.id)) {
      seenSubjectIds.add(s.id);
      activeSubjects.push(s);
    }
  }

  if (activeSubjects.length === 1) {
    badgeEmoji = activeSubjects[0].icon;
    titleStr = activeSubjects[0].shortName || activeSubjects[0].id;
  } else if (activeSubjects.length > 1) {
    badgeEmoji = '📚';
    titleStr = activeSubjects.map(s => s.shortName || s.id).join(' + ');
  } else if (state.currentSubject) {
    const subjDef = SUBJECTS.find(s => s.id === state.currentSubject) || SUBJECTS[1];
    badgeEmoji = subjDef.icon;
    titleStr = subjDef.shortName || subjDef.id;
  } else {
    badgeEmoji = '🌐';
    titleStr = 'Tüm Branşlar';
  }

  if (state.selectedExamPeriod) {
    titleStr += ` • ${state.selectedExamPeriod}`;
  } else if (state.selectedTopicKeys.size > 0) {
    titleStr += ` (${state.selectedTopicKeys.size} Konu)`;
  }

  if (badgeBtn) {
    const topicLabel = state.selectedTopicKeys.size > 0
      ? `${state.selectedTopicKeys.size} Konu`
      : 'Tüm Konular';
    badgeBtn.title = `${titleStr} • ${topicLabel} • Toplam ${state.bookletQuestions.length} Soru`;
  }

  if (emojiEl) emojiEl.textContent = badgeEmoji;
  if (textEl) textEl.textContent = titleStr;
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

