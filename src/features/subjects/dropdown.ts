import { state } from '../../app/state.ts';
import { escapeHtml } from '../../shared/escape.ts';
import { getProgramSubjectList } from './selection-model.ts';

export function closeAllSubjectDropdowns(): void {
  if (typeof document === 'undefined') return;
  document.querySelectorAll<HTMLElement>('.dropdown-menu-list').forEach(m => {
    m.style.display = 'none';
  });
}

export function toggleSubjectDropdown(menuIdOrSubjId?: string): void {
  if (typeof document === 'undefined') return;
  const menu = (typeof menuIdOrSubjId === 'string' && document.getElementById(menuIdOrSubjId))
    || (typeof menuIdOrSubjId === 'string' && document.getElementById(`subjectDropdownMenu_${menuIdOrSubjId}`))
    || document.getElementById('subjectDropdownMenu');
  if (!menu) return;

  if (menu.style.display === 'block') {
    menu.style.display = 'none';
    return;
  }

  closeAllSubjectDropdowns();

  const activeSubjId = (typeof menuIdOrSubjId === 'string' && !menuIdOrSubjId.startsWith('subjectDropdownMenu'))
    ? menuIdOrSubjId
    : (menu.id.startsWith('subjectDropdownMenu_') ? menu.id.replace('subjectDropdownMenu_', '') : state.currentSubject);

  const currentList = getProgramSubjectList();
  let html = '';
  currentList.forEach(s => {
    const isAct = (s.id === activeSubjId);
    html += `
      <div class="dropdown-menu-item ${isAct ? 'active' : ''}" 
           onclick="handleDropdownItemSelect('${s.id}', '${activeSubjId || ''}')">
        <span>${s.icon} ${escapeHtml(s.name)}</span>
        ${isAct ? '<span>✓</span>' : ''}
      </div>
    `;
  });
  menu.innerHTML = html;
  menu.style.display = 'block';
}

if (typeof document !== 'undefined') {
  document.addEventListener('click', e => {
    const target = e.target;
    if (target instanceof Element && !target.closest('.custom-dropdown')) {
      closeAllSubjectDropdowns();
    }
  });
}

