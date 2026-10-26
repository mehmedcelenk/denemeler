import { escapeHtml, escapeJs } from '../../shared/escape.ts';
import { matchesSubject } from '../../data/subjects.js';

export interface AggregatedTopic {
  key: string;
  ana_konu?: string;
  alt_konu?: string;
  count: number;
  courses: Record<string, number>;
  avg_per_exam?: number;
  period_count?: number;
}

export interface SubjectFolderInfo {
  id: string;
  name: string;
  icon: string;
}

export function renderTopicsTreeHtml(
  topics: AggregatedTopic[],
  activeSubjects: SubjectFolderInfo[],
  selectedTopicKeys: ReadonlySet<string>
): string {
  const groupedBySubject = new Map<SubjectFolderInfo, AggregatedTopic[]>();

  activeSubjects.forEach(s => {
    const subjTopics = topics.filter(t => Object.keys(t.courses).some(c => matchesSubject({ ders: c }, s.id)));
    if (subjTopics.length > 0) {
      groupedBySubject.set(s, subjTopics);
    }
  });

  let html = '';
  groupedBySubject.forEach((subjTopics, s) => {
    const subjTotal = subjTopics.reduce((sum, t) => sum + t.count, 0);

    const groupedTopics = new Map<string, AggregatedTopic[]>();
    subjTopics.forEach(t => {
      const parentKey = (t.ana_konu && t.alt_konu && t.ana_konu !== t.alt_konu)
        ? t.ana_konu
        : (t.ana_konu || t.alt_konu || 'Genel');
      const group = groupedTopics.get(parentKey) || [];
      group.push(t);
      groupedTopics.set(parentKey, group);
    });

    let innerHtml = '';
    groupedTopics.forEach((group, parentKey) => {
      const allGroupKeys = group.map(t => t.key);
      const isAllGroupSelected = allGroupKeys.length > 0 && allGroupKeys.every(k => selectedTopicKeys.has(k));
      const isPartialGroupSelected = !isAllGroupSelected && allGroupKeys.some(k => selectedTopicKeys.has(k));

      if (group.length > 1) {
        const hasSelectedChild = isAllGroupSelected || isPartialGroupSelected;
        const expanded = hasSelectedChild;
        const parentLabel = parentKey || 'Genel';
        const totalGroupQuestions = group.reduce((sum, item) => sum + item.count, 0);

        const nestedHtml = group.map(t => {
          const isSelected = selectedTopicKeys.has(t.key);
          return `
            <div class="drawer-topic-item child-item ${isSelected ? 'selected' : ''}" data-select-topic="${escapeJs(t.key)}">
              <span class="tree-checkbox ${isSelected ? 'checked' : ''}" aria-hidden="true">${isSelected ? '✓' : ''}</span>
              <span class="drawer-topic-name">${escapeHtml(t.alt_konu || t.ana_konu || 'Genel')}</span>
              <span class="drawer-topic-count-num">${t.count} soru</span>
            </div>
          `;
        }).join('');

        innerHtml += `
          <div class="drawer-topic-group ${expanded ? 'open' : ''}" data-topic-group="${escapeJs(parentKey)}">
            <button type="button" class="drawer-topic-group-header" data-topic-toggle-group="${escapeJs(parentKey)}" aria-expanded="${expanded ? 'true' : 'false'}">
              <span class="drawer-topic-group-title">
                <span class="tree-checkbox ${isAllGroupSelected ? 'checked' : (isPartialGroupSelected ? 'partial' : '')}" 
                      data-group-checkbox="${escapeJs(parentKey)}" aria-hidden="true">
                  ${isAllGroupSelected ? '✓' : (isPartialGroupSelected ? '–' : '')}
                </span>
                <span class="drawer-topic-group-name">${escapeHtml(parentLabel)}</span>
              </span>
              <div class="drawer-topic-group-meta">
                <span class="drawer-topic-count-num group-count">${totalGroupQuestions} soru</span>
                <span class="drawer-topic-dropdown-caret" aria-hidden="true">${expanded ? '⌄' : '›'}</span>
              </div>
            </button>
            <div class="drawer-topic-group-body">
              ${nestedHtml}
            </div>
          </div>
        `;
        return;
      }

      const t = group[0];
      const isSelected = selectedTopicKeys.has(t.key);
      let topicLabelHtml = '';
      if (t.ana_konu && t.alt_konu && t.ana_konu !== t.alt_konu) {
        topicLabelHtml = `<span class="topic-ak">${escapeHtml(t.ana_konu)}</span><span class="topic-slash">/</span><span class="topic-sub">${escapeHtml(t.alt_konu)}</span>`;
      } else {
        topicLabelHtml = `<span class="topic-sub">${escapeHtml(t.alt_konu || t.ana_konu)}</span>`;
      }

      innerHtml += `
        <div class="drawer-topic-item ${isSelected ? 'selected' : ''}" data-select-topic="${escapeJs(t.key)}">
          <span class="tree-checkbox ${isSelected ? 'checked' : ''}" aria-hidden="true">${isSelected ? '✓' : ''}</span>
          <span class="drawer-topic-name">${topicLabelHtml}</span>
          <span class="drawer-topic-count-num">${t.count} soru</span>
        </div>
      `;
    });

    const allSubjKeys = subjTopics.map(t => t.key);
    const isAllSubjSelected = allSubjKeys.length > 0 && allSubjKeys.every(k => selectedTopicKeys.has(k));
    const isPartialSubjSelected = !isAllSubjSelected && allSubjKeys.some(k => selectedTopicKeys.has(k));

    html += `
      <div class="drawer-subject-folder open" data-subject-folder="${s.id}">
        <button type="button" class="drawer-subject-folder-header" data-toggle-subject-folder="${s.id}">
          <div class="folder-header-left">
            <span class="tree-checkbox ${isAllSubjSelected ? 'checked' : (isPartialSubjSelected ? 'partial' : '')}"
                  data-folder-checkbox="${s.id}" aria-hidden="true">
              ${isAllSubjSelected ? '✓' : (isPartialSubjSelected ? '–' : '')}
            </span>
            <span>${s.icon}</span>
            <span>${escapeHtml(s.name)}</span>
          </div>
          <div class="folder-header-right">
            <span class="folder-count">${subjTotal} soru</span>
            <span class="folder-caret">⌄</span>
          </div>
        </button>
        <div class="drawer-subject-folder-body">
          ${innerHtml}
        </div>
      </div>
    `;
  });

  return html;
}
