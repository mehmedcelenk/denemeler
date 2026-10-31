import { registerActions } from '../../app/actions.ts';
import {
  clearDrawerSearch,
  loadAllSearchResultsToBooklet,
  loadSingleSearchQuestion,
} from './search.js';

let initialized = false;

export function initSearch(): void {
  if (initialized) return;
  initialized = true;
  registerActions({
    'clear-drawer-search': () => clearDrawerSearch(),
    'load-all-search': () => loadAllSearchResultsToBooklet(),
  });
  if (typeof window !== 'undefined') Object.assign(window, { loadSingleSearchQuestion });
}
