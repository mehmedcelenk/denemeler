import { state } from '../../app/state.ts';
import { renderDrawerTopics } from './topics.js';

export function setCourseFilterMode(mode) {
  state.courseFilterMode = mode;
  const chk = document.getElementById('chkIntersectionSwitch');
  if (chk) {
    chk.checked = (mode === 'AND');
  }
  renderDrawerTopics();
}

export function updateCourseModeToggleVisibility() {
  const wrapper = document.getElementById('intersectionSwitchWrapper');
  if (wrapper) {
    const isMulti = state.selectedCourses.size >= 2;
    wrapper.style.opacity = isMulti ? '1' : '0.45';
    wrapper.style.pointerEvents = isMulti ? 'auto' : 'none';
  }
}
