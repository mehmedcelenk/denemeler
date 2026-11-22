import { state, store, notifyStateChange, onStateChange, BookletFilterMode } from '../../app/state.ts';
import { matchesSubject } from '../../data/subjects.js';
import { Question } from '../../data/question.ts';
import { getQuestionInstitutionMetrics, getQuestionRoomMetrics } from '../../shared/question-filter.ts';
import { updateBookletQuestions } from './selection.js';
import { renderBookletPages } from './render.js';

export type UnifiedMode = 'all' | 'rematch' | 'review' | 'starred' | 'notes' | 'institution' | 'room';

const MODE_META: Record<UnifiedMode, { label: string; icon: string; title: string }> = {
  all: {
    label: 'Sorular',
    title: 'Tüm Sorular (Test Modu)',
    icon: `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>`
  },
  rematch: {
    label: 'Rövanş',
    title: 'Rövanşlar (Yanlışlar & Şüpheliler)',
    icon: `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M14.5 17.5 3 6V3h3l11.5 11.5"/><path d="m13 19 6-6"/><path d="m16 16 4 4"/><path d="m19 21 2-2"/><path d="M14.5 6.5 18 3h3v3l-3.5 3.5"/><path d="m5 14 4 4"/><path d="m7 17-3 3"/><path d="m3 19 2 2"/></svg>`
  },
  review: {
    label: 'Tekrar',
    title: 'Tekrar (Doğru Çözülenleri Yeniden Dene)',
    icon: `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/></svg>`
  },
  starred: {
    label: 'Kayıtlı',
    title: 'Kaydedilen Sorular',
    icon: `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/></svg>`
  },
  institution: {
    label: 'Kurs',
    title: 'Kurs Yanlışları (En Çok Hata Yapılanlar)',
    icon: `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z"/></svg>`
  },
  room: {
    label: 'Oda',
    title: 'Oda Yanlışları (Canlı Sınıf Hataları)',
    icon: `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>`
  },
  notes: {
    label: 'Notlar',
    title: 'Ders Notları',
    icon: `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>`
  }
};

let isDropdownOpen = false;

export function toggleUnifiedDropdown(force?: boolean): void {
  isDropdownOpen = typeof force === 'boolean' ? force : !isDropdownOpen;
  const menu = document.getElementById('unifiedDropdownMenu');
  const trigger = document.getElementById('btnUnifiedTrigger');
  if (menu) menu.classList.toggle('is-open', isDropdownOpen);
  if (trigger) {
    trigger.classList.toggle('is-expanded', isDropdownOpen);
    trigger.setAttribute('aria-expanded', String(isDropdownOpen));
  }
}

export function closeUnifiedDropdown(): void {
  if (!isDropdownOpen) return;
  toggleUnifiedDropdown(false);
}

if (typeof document !== 'undefined') {
  document.addEventListener('click', (event) => {
    if (!isDropdownOpen) return;
    const target = event.target as HTMLElement | null;
    if (!target?.closest('#topUnifiedPill')) {
      closeUnifiedDropdown();
    }
  });

  window.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && isDropdownOpen) {
      closeUnifiedDropdown();
    }
  });
}

export function setUnifiedMode(mode: UnifiedMode): void {
  closeUnifiedDropdown();
  if (mode !== 'all' && typeof document !== 'undefined' && document.body.classList.contains('welcome-active')) {
    notifyStateChange('subjects:drawer-opened');
  }
  if (mode === 'notes') {
    store.setContentViewMode('notes');
    updateUnifiedToggleUI();
    notifyStateChange('view-mode:updated', 'notes');
    renderBookletPages();
  } else {
    store.setBookletFilterMode(mode);
    store.setLibraryMode(false);
    const viewChanged = state.contentViewMode !== 'questions';
    store.setContentViewMode('questions');
    updateUnifiedToggleUI();
    if (viewChanged) {
      notifyStateChange('view-mode:updated', 'questions');
      renderBookletPages();
    } else {
      updateBookletQuestions();
    }
  }
}

export function setBookletFilter(mode: BookletFilterMode): void {
  store.setBookletFilterMode(mode);
  store.setLibraryMode(false);
  if (state.contentViewMode === 'notes') {
    store.setContentViewMode('questions');
    notifyStateChange('view-mode:updated', 'questions');
  }
  updateUnifiedToggleUI();
  updateBookletQuestions();
}

export function getFilterCounts(): { rematch: number; review: number; starred: number; institution: number; room: number } {
  let rematch = 0;
  let review = 0;
  let starred = 0;
  let institution = 0;
  let room = 0;

  const dataset = state.allData;
  dataset.forEach((q: Question) => {
    if (state.currentSubject && !matchesSubject(q, state.currentSubject)) return;
    if (state.currentSubject && state.selectedCourses.size > 0 && !state.selectedCourses.has(q.ders)) return;

    const userMark = state.userMarkedChoices[q.id];
    const isWrong = Boolean(userMark && userMark !== q.dogru_cevap);
    const isCorrect = Boolean(userMark && userMark === q.dogru_cevap);
    const inQueue = state.rematchQuestionIds.has(q.id);
    if (isWrong || inQueue) rematch++;
    if (isCorrect && !inQueue) review++;
    if (state.starredQuestionIds.has(q.id)) starred++;

    const inst = getQuestionInstitutionMetrics(q, state.institutionStats[q.id]);
    if (inst.wrong > 0) institution++;

    const rm = getQuestionRoomMetrics(state.roomQuestionStats[q.id]);
    if (rm.wrong > 0) room++;
  });

  return { rematch, review, starred, institution, room };
}

export function updateUnifiedToggleUI(): void {
  if (typeof document === 'undefined') return;
  const pill = document.getElementById('topUnifiedPill');
  const counts = getFilterCounts();

  const currentView = state.contentViewMode || 'questions';
  let currentFilter = state.bookletFilterMode || 'all';

  if (!state.isRoomActive && currentFilter === 'room') {
    store.setBookletFilterMode('all');
    currentFilter = 'all';
  }

  const activeMode: UnifiedMode = (currentView === 'notes')
    ? 'notes'
    : (currentFilter === 'rematch'
      ? 'rematch'
      : (currentFilter === 'review'
        ? 'review'
        : (currentFilter === 'starred'
          ? 'starred'
          : (currentFilter === 'institution'
            ? 'institution'
            : (currentFilter === 'room' ? 'room' : 'all')))));

  const rematchBadge = counts.rematch > 0
    ? `<span class="filter-count-badge">${counts.rematch}</span>`
    : '';

  const reviewBadge = counts.review > 0
    ? `<span class="filter-count-badge">${counts.review}</span>`
    : '';

  const starredBadge = counts.starred > 0
    ? `<span class="filter-count-badge">${counts.starred}</span>`
    : '';

  const instBadge = counts.institution > 0
    ? `<span class="filter-count-badge">${counts.institution}</span>`
    : '';

  const roomBadge = counts.room > 0
    ? `<span class="filter-count-badge">${counts.room}</span>`
    : '';

  const isLibraryActive = activeMode !== 'all';
  let activeBadge = '';
  if (activeMode === 'rematch') activeBadge = rematchBadge;
  else if (activeMode === 'review') activeBadge = reviewBadge;
  else if (activeMode === 'starred') activeBadge = starredBadge;
  else if (activeMode === 'institution') activeBadge = instBadge;
  else if (activeMode === 'room') activeBadge = roomBadge;

  const questionsBtn = document.getElementById('btnBottomQuestions');
  questionsBtn?.classList.toggle('is-active-tab', !isLibraryActive);

  const KAYITLAR_ICON = `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m19 21-7-4-7 4V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/></svg>`;

  const roomItemHtml = state.isRoomActive ? `
        <button type="button" class="unified-dropdown-item ${activeMode === 'room' ? 'is-selected' : ''}" id="btnUnifiedRoom" data-action="set-unified-mode" data-mode="room" role="menuitem">
          ${MODE_META.room.icon}
          <span class="top-unified-label">Oda</span>
          ${roomBadge}
        </button>` : '';

  if (pill) {
    pill.innerHTML = `
      <button type="button" class="btn-top-unified btn-top-unified-trigger ${isLibraryActive ? 'is-active-tab active' : ''} ${isDropdownOpen ? 'is-expanded' : ''}" id="btnUnifiedTrigger" data-action="toggle-unified-dropdown" data-mode="${activeMode}" title="Kayıtlar: Rövanş, Tekrar, Kayıtlı, Kurs ve Notlar" aria-expanded="${isDropdownOpen}" aria-haspopup="menu">
        ${KAYITLAR_ICON}
        <span class="top-unified-label">Kayıtlar</span>
        ${activeBadge}
      </button>
      <div class="unified-dropdown-menu ${isDropdownOpen ? 'is-open' : ''}" id="unifiedDropdownMenu" role="menu">
        <button type="button" class="unified-dropdown-item ${activeMode === 'rematch' ? 'is-selected' : ''}" id="btnUnifiedRematch" data-action="set-unified-mode" data-mode="rematch" role="menuitem">
          ${MODE_META.rematch.icon}
          <span class="top-unified-label">Rövanş</span>
          ${rematchBadge}
        </button>
        <button type="button" class="unified-dropdown-item ${activeMode === 'review' ? 'is-selected' : ''}" id="btnUnifiedReview" data-action="set-unified-mode" data-mode="review" role="menuitem">
          ${MODE_META.review.icon}
          <span class="top-unified-label">Tekrar</span>
          ${reviewBadge}
        </button>
        <button type="button" class="unified-dropdown-item ${activeMode === 'starred' ? 'is-selected' : ''}" id="btnUnifiedStarred" data-action="set-unified-mode" data-mode="starred" role="menuitem">
          ${MODE_META.starred.icon}
          <span class="top-unified-label">Kayıtlı</span>
          ${starredBadge}
        </button>
        <button type="button" class="unified-dropdown-item ${activeMode === 'institution' ? 'is-selected' : ''}" id="btnUnifiedInstitution" data-action="set-unified-mode" data-mode="institution" role="menuitem">
          ${MODE_META.institution.icon}
          <span class="top-unified-label">Kurs</span>
          ${instBadge}
        </button>
        ${roomItemHtml}
        <button type="button" class="unified-dropdown-item ${activeMode === 'notes' ? 'is-selected' : ''}" id="btnUnifiedNotes" data-action="set-unified-mode" data-mode="notes" role="menuitem">
          ${MODE_META.notes.icon}
          <span class="top-unified-label">Notlar</span>
        </button>
      </div>
    `;
  }

  const chipsBar = document.getElementById('studyModeChipsBar');
  if (chipsBar) {
    chipsBar.hidden = true;
    chipsBar.innerHTML = '';
    document.body?.classList?.remove?.('study-chips-open');
  }
}

export function updateFilterButtonsUI(): void {
  updateUnifiedToggleUI();
}

onStateChange('filter:updated', () => {
  updateUnifiedToggleUI();
});



