import { state } from '../../app/state.ts';
import { SUBJECTS, matchesSubject } from '../../data/subjects.js';
import { loadAllSubjectData } from '../../data/questions.js';
import { renderBookletPages } from '../booklet/render.js';
import { updateTopBadge } from '../booklet/selection.js';
import type { Question } from '../../data/question.ts';

const selectedExamCourses = new Set<string>();

interface SubjectInfo {
  id: string;
  name: string;
  icon: string;
}

export async function openExamModal(): Promise<void> {
  if (typeof document === 'undefined') return;
  const modal = document.getElementById('mixedExamModal');
  if (!modal) return;

  modal.style.display = 'flex';

  const container = document.getElementById('examCoursesCheckboxContainer');
  if (container) {
    container.innerHTML = '<div style="padding:20px; text-align:center; color:var(--paper-text-muted);">Dersler yükleniyor...</div>';
  }

  await loadAllSubjectData();

  // Tüm derslerin alt kademelerini bul ve varsayılan olarak seçili yap
  selectedExamCourses.clear();
  const allCourses = Array.from(new Set(state.allData.map(q => q.ders)));
  allCourses.forEach(c => selectedExamCourses.add(c));

  renderExamCoursesList();
}

export function closeExamModal(): void {
  if (typeof document === 'undefined') return;
  const modal = document.getElementById('mixedExamModal');
  if (modal) modal.style.display = 'none';
}

export function toggleExamCourseSelection(courseName: string): void {
  if (selectedExamCourses.has(courseName)) {
    selectedExamCourses.delete(courseName);
  } else {
    selectedExamCourses.add(courseName);
  }
  renderExamCoursesList();
}

export function toggleExamSelectAll(): void {
  const allCourses = Array.from(new Set(state.allData.map(q => q.ders)));
  if (selectedExamCourses.size === allCourses.length) {
    selectedExamCourses.clear();
  } else {
    allCourses.forEach(c => selectedExamCourses.add(c));
  }
  renderExamCoursesList();
}

function renderExamCoursesList(): void {
  if (typeof document === 'undefined') return;
  const container = document.getElementById('examCoursesCheckboxContainer');
  if (!container) return;

  const subjectsList = SUBJECTS as SubjectInfo[];
  let html = '';

  subjectsList.forEach(s => {
    const courses = Array.from(new Set(state.allData.filter(q => matchesSubject(q, s.id)).map(q => q.ders)));
    if (courses.length === 0) return;

    courses.sort((a, b) => {
      const matchA = a.match(/\d+$/);
      const numA = matchA ? parseInt(matchA[0], 10) : 0;
      const matchB = b.match(/\d+$/);
      const numB = matchB ? parseInt(matchB[0], 10) : 0;
      return numA - numB;
    });

    html += `
      <div class="exam-subject-group" style="margin-bottom:12px;">
        <strong style="display:block; margin-bottom:6px; font-size:13px; color:var(--paper-text);">${s.icon} ${s.name}</strong>
        <div class="exam-course-chips" style="display:flex; flex-wrap:wrap; gap:6px;">
    `;

    courses.forEach(c => {
      const isChecked = selectedExamCourses.has(c);
      html += `
        <label class="exam-chip ${isChecked ? 'active' : ''}" style="cursor:pointer; font-size:12px; padding:4px 8px; border-radius:6px; background:${isChecked ? 'var(--brand-accent)' : 'var(--paper-subtle)'}; color:${isChecked ? '#fff' : 'var(--paper-text)'}; display:inline-flex; align-items:center; gap:4px;">
          <input type="checkbox" ${isChecked ? 'checked' : ''} onchange="toggleExamCourseSelection('${c}')" style="cursor:pointer;" />
          <span>${c}</span>
        </label>
      `;
    });

    html += `</div></div>`;
  });

  container.innerHTML = html;
}

export async function startInterleavedExam(): Promise<void> {
  if (selectedExamCourses.size === 0) {
    alert('Lütfen en az bir ders seçin.');
    return;
  }

  closeExamModal();

  // Sadece seçili derslerdeki ve şekilsiz soruları topla
  const pool: Question[] = state.allData.filter(q => selectedExamCourses.has(q.ders) && !q.sekilli);
  if (pool.length === 0) {
    alert('Seçilen derslerde çözülebilir soru bulunamadı.');
    return;
  }

  // Soruları karıştır (Fisher-Yates) ve ilk 20 tanesini al
  const shuffled = [...pool].sort(() => Math.random() - 0.5);
  const examQuestions = shuffled.slice(0, 20);

  state.currentSubject = null;
  state.selectedTopicKey = null;
  state.isLibraryMode = false;
  state.bookletQuestions = examQuestions;

  updateTopBadge('🔀 Karışık Deneme Sınavı');
  renderBookletPages();
}
