import { state, notifyStateChange } from '../../app/state.ts';

export function setCourseFilterMode(mode: 'OR' | 'AND'): void {
  state.courseFilterMode = mode;
  const chk = document.getElementById('chkIntersectionSwitch') as HTMLInputElement | null;
  if (chk) {
    chk.checked = (mode === 'AND');
  }
  notifyStateChange('drawer:topics-refresh');
}

export function updateCourseModeToggleVisibility(): void {
  const wrapper = document.getElementById('intersectionSwitchWrapper');
  if (wrapper) {
    const isMulti = state.selectedCourses.size >= 2;
    wrapper.style.opacity = isMulti ? '1' : '0.45';
    wrapper.style.pointerEvents = isMulti ? 'auto' : 'none';
  }
}
