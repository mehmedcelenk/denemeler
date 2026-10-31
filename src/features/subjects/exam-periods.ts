import { state, store, notifyStateChange } from '../../app/state.ts';
import { matchesSubject } from '../../data/subjects.js';
import { escapeHtml, escapeJs } from '../../shared/escape.ts';

export interface ExamPeriodInfo {
  key: string;
  label: string;
  count: number;
}

export function getExamPeriodsForSelection(): ExamPeriodInfo[] {
  const map = new Map<string, number>();

  state.allData.forEach(q => {
    if (state.selectedCourses.size > 0) {
      if (!state.selectedCourses.has(q.ders)) return;
    } else if (state.currentSubject) {
      if (!matchesSubject(q, state.currentSubject)) return;
    }

    const key = `${q.yil || ''} ${q.donem ? `${q.donem}. Dönem` : ''}`.trim();
    if (!key) return;
    map.set(key, (map.get(key) || 0) + 1);
  });

  const list: ExamPeriodInfo[] = [];
  map.forEach((count, key) => {
    list.push({ key, label: key, count });
  });

  list.sort((a, b) => {
    const partsA = a.key.split(' ');
    const partsB = b.key.split(' ');
    const yilA = partsA[0] || '';
    const yilB = partsB[0] || '';
    if (yilA !== yilB) return yilB.localeCompare(yilA);
    const donemA = parseInt(partsA[1] || '0', 10);
    const donemB = parseInt(partsB[1] || '0', 10);
    return donemB - donemA;
  });

  return list;
}

export function selectExamPeriodFromDrawer(periodKey: string | null): void {
  store.setSelectedExamPeriod(periodKey);
  store.clearSelectedTopicKeys();
  store.setActiveSearchFilter('');
  store.setBookletFilterMode('all');
  notifyStateChange('drawer:close');
  notifyStateChange('filter:updated');
  notifyStateChange('booklet:refresh');
}

export function renderExamPeriodsHtml(periods: ExamPeriodInfo[]): string {
  const isAll = !state.selectedExamPeriod;
  const totalCount = periods.reduce((sum, p) => sum + p.count, 0);

  let html = `
    <div class="drawer-exam-period-item ${isAll ? 'selected' : ''}" data-select-exam-period="">
      <span class="exam-period-radio ${isAll ? 'checked' : ''}" aria-hidden="true">${isAll ? '●' : '○'}</span>
      <span class="drawer-exam-period-name">Tüm Dönemler (Karma)</span>
      <span class="drawer-exam-period-count">${totalCount} soru</span>
    </div>
  `;

  periods.forEach(p => {
    const isSel = (state.selectedExamPeriod === p.key);
    html += `
      <div class="drawer-exam-period-item ${isSel ? 'selected' : ''}" data-select-exam-period="${escapeJs(p.key)}">
        <span class="exam-period-radio ${isSel ? 'checked' : ''}" aria-hidden="true">${isSel ? '●' : '○'}</span>
        <span class="drawer-exam-period-name">${escapeHtml(p.label)}</span>
        <span class="drawer-exam-period-count">${p.count} soru</span>
      </div>
    `;
  });

  return html;
}
