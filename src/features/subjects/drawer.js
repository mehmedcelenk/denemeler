import { state } from '../../app/state.ts';
import { updateCourseModeToggleVisibility } from './filters.js';
import { renderSearchResults } from '../search/search.js';
import { renderDrawerCourses } from './selection.js';
import { renderDrawerTopics } from './topics.js';

export function openSubjectDrawer() {
  document.getElementById('drawerOverlay').classList.add('open');
  updateCourseModeToggleVisibility();

  const input = document.getElementById('drawerSearchInput');
  const clearBtn = document.getElementById('drawerSearchClearBtn');
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

