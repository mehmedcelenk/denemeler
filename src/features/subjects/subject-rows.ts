import { state } from '../../app/state.ts';
import { getShortCourseName, matchesSubject } from '../../data/subjects.js';
import { escapeHtml, escapeJs } from '../../shared/escape.ts';

export interface SubjectItem {
  id: string;
  name: string;
  shortName?: string;
  icon: string;
}

export function renderSubjectRowsHtml(activeSubjs: SubjectItem[]): string {
  let rowsHtml = '';
  activeSubjs.forEach((s, idx) => {
    const isPrimary = (idx === 0);
    const courses = Array.from(new Set(state.allData.filter(q => matchesSubject(q, s.id)).map(q => q.ders)));
    courses.sort((a, b) => {
      const numA = parseInt((a.match(/\d+$/) || ['0'])[0], 10);
      const numB = parseInt((b.match(/\d+$/) || ['0'])[0], 10);
      return numA - numB;
    });

    let levelChipsHtml = '';
    courses.forEach(c => {
      const isSel = state.selectedCourses.has(c);
      const m = c.match(/\d+$/);
      const num = m ? m[0] : c;
      const short = getShortCourseName(c);
      levelChipsHtml += `
        <button type="button" class="btn-level-chip ${isSel ? 'active' : ''}" 
                onclick="toggleCourseLevel('${escapeJs(c)}')" 
                title="${escapeHtml(short)}">
          ${escapeHtml(num)}
        </button>
      `;
    });

    const dropdownId = isPrimary ? 'subjectDropdownWrapper' : `subjectDropdownWrapper_${s.id}`;
    const triggerId = isPrimary ? 'btnSubjectDropdownTrigger' : `btnSubjectDropdownTrigger_${s.id}`;
    const iconId = isPrimary ? 'selectedSubjIcon' : '';
    const nameId = isPrimary ? 'selectedSubjShortName' : '';
    const menuId = isPrimary ? 'subjectDropdownMenu' : `subjectDropdownMenu_${s.id}`;
    const chipsContainerId = isPrimary ? 'levelChipsContainer' : `levelChipsContainer_${s.id}`;

    rowsHtml += `
      <div class="drawer-subject-row" data-subject-row="${s.id}">
        <div class="row-dropdown-wrap">
          <div class="custom-dropdown" id="${dropdownId}">
            <button type="button" class="dropdown-trigger-btn" id="${triggerId}" 
                    onclick="toggleSubjectDropdown('${s.id}')" title="Ders Seç">
              <span ${iconId ? `id="${iconId}"` : ''}>${s.icon}</span>
              <span ${nameId ? `id="${nameId}"` : ''}>${(s.shortName || s.name).toUpperCase()}</span>
              <span class="dropdown-arrow">▾</span>
            </button>
            <div class="dropdown-menu-list" id="${menuId}" style="display:none;"></div>
          </div>
        </div>

        <span class="row-slash">/</span>

        <div class="row-level-chips" id="${chipsContainerId}">
          ${levelChipsHtml}
        </div>

        ${activeSubjs.length > 1 ? `
          <button type="button" class="btn-remove-subject-row" 
                  onclick="removeSubjectRow('${s.id}')" title="Kaldır">✕</button>
        ` : ''}
      </div>
    `;
  });
  return rowsHtml;
}
