import { onStateChange, state } from '../../app/state.ts';
import { renderDrawerCourses } from './selection.js';
import { renderDrawerTopics } from './topics.js';

export function syncDrawerProgramButtons(mode: string = state.programMode): void {
  document.querySelectorAll<HTMLButtonElement>('[data-program]').forEach(button => {
    const isActive = button.dataset.program === mode;
    button.classList.toggle('active', isActive);
    button.setAttribute('aria-pressed', String(isActive));
  });
}

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
  syncDrawerProgramButtons();
  updateCourseModeToggleVisibility();

  const normalContainer = document.getElementById('drawerNormalSelectorContainer');
  if (normalContainer) normalContainer.style.display = 'block';

  renderDrawerCourses();
  renderDrawerTopics();
}

onStateChange('drawer:close', () => {
  closeSubjectDrawer();
});
