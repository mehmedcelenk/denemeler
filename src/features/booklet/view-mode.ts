import { state, notifyStateChange, onStateChange } from '../../app/state.ts';
import type { ContentViewMode } from '../../app/state.ts';
import { renderBookletPages } from './render.js';
import { updateUnifiedToggleUI } from './filter.ts';

export function setContentViewMode(mode: ContentViewMode): void {
  if (state.contentViewMode === mode) return;
  state.contentViewMode = mode;
  updateUnifiedToggleUI();
  notifyStateChange('view-mode:updated', mode);
  renderBookletPages();
}

export function updateViewModeButtonsUI(): void {
  updateUnifiedToggleUI();
}

onStateChange('view-mode:updated', () => {
  updateViewModeButtonsUI();
});
