import { state, onStateChange } from '../../app/state.ts';
import { renderSearchResults } from '../search/search.js';
import { renderDrawerCourses } from './selection.js';
import { renderDrawerTopics } from './topics.js';

export function closeSubjectDrawer(): void {
  const overlay = document.getElementById('drawerOverlay');
  if (overlay) overlay.classList.remove('open');
}

export function handleDrawerOverlayClick(e: Event): void {
  const target = e.target as HTMLElement | null;
  if (target && target.id === 'drawerOverlay') {
    closeSubjectDrawer();
  }
}

import { setCourseFilterMode, updateCourseModeToggleVisibility } from './filters.ts';
export { setCourseFilterMode, updateCourseModeToggleVisibility };

export function openSubjectDrawer(): void {
  const overlay = document.getElementById('drawerOverlay');
  if (overlay) overlay.classList.add('open');
  updateCourseModeToggleVisibility();

  const input = document.getElementById('drawerSearchInput') as HTMLInputElement | null;
  const clearBtn = document.getElementById('drawerSearchClearBtn') as HTMLElement | null;
  if (input) {
    input.value = state.activeSearchFilter || '';
    state.drawerSearchTerm = state.activeSearchFilter || '';
  }
  if (clearBtn) {
    clearBtn.style.display = state.drawerSearchTerm ? 'flex' : 'none';
  }

  const resultsContainer = document.getElementById('drawerSearchResultsContainer');
  const normalContainer = document.getElementById('drawerNormalSelectorContainer');

  if (state.drawerSearchTerm) {
    if (resultsContainer) resultsContainer.style.display = 'block';
    if (normalContainer) normalContainer.style.display = 'none';
    renderSearchResults();
  } else {
    if (resultsContainer) resultsContainer.style.display = 'none';
    if (normalContainer) normalContainer.style.display = 'block';
    renderDrawerCourses();
    renderDrawerTopics();
  }
}

onStateChange('drawer:close', () => {
  closeSubjectDrawer();
});
