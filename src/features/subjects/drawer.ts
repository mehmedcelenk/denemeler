import { onStateChange } from '../../app/state.ts';
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

  const normalContainer = document.getElementById('drawerNormalSelectorContainer');
  if (normalContainer) normalContainer.style.display = 'block';

  renderDrawerCourses();
  renderDrawerTopics();
}

onStateChange('drawer:close', () => {
  closeSubjectDrawer();
});
