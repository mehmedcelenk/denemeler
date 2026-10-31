import { registerActions } from '../../app/actions.ts';
import {
  cycleAccentColor,
  cycleColumnCount,
  cycleZoomLevel,
  resetBookletCanvasZoom,
  setAccentColor,
  setColumnCount,
  setThemeMode,
  toggleConsoleMenu,
  toggleFullscreenFocusMode,
  toggleTheme,
  zoomIn,
  zoomOut,
} from './preferences.ts';

let initialized = false;

export function initAppearance(): void {
  if (initialized) return;
  initialized = true;
  registerActions({
    'reset-canvas-zoom': () => resetBookletCanvasZoom(),
    'zoom-out': () => zoomOut(),
    'zoom-in': () => zoomIn(),
    'cycle-column-count': () => cycleColumnCount(),
    'cycle-zoom-level': () => cycleZoomLevel(),
    'cycle-theme-mode': () => toggleTheme(),
    'cycle-accent-color': () => cycleAccentColor(),
    'toggle-fullscreen': () => { toggleFullscreenFocusMode(); },
    'toggle-console-menu': () => toggleConsoleMenu(),
    'set-column-count': el => {
      if (el.dataset.cols) setColumnCount(Number(el.dataset.cols));
    },
    'set-theme-mode': el => {
      const theme = el.dataset.theme;
      if (theme === 'light' || theme === 'dark') setThemeMode(theme);
    },
    'set-accent-color': el => {
      if (el.dataset.color) setAccentColor(el.dataset.color);
    },
  });
}
