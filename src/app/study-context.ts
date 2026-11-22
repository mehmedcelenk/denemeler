import { state, notifyStateChange } from './state.ts';

/** Reconcile shared identity before acting, then reject work from the previous owner. */
export function isCurrentStudy(generation = state.studyGeneration): boolean {
  notifyStateChange('study:reconcile');
  return generation === state.studyGeneration && state.progressOwner !== 'locked' && state.progressReady;
}

/** Keep the historic scheduling interface while leaving cloud sync to its owner. */
export function scheduleCloudSync(delayMs?: number): void {
  notifyStateChange('progress:changed', { delayMs });
}
