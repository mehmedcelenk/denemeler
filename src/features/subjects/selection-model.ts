import { state } from '../../app/state.ts';
import { AOIHL_SUBJECTS, AOF_SUBJECTS, matchesSubject } from '../../data/subjects.js';

export function getActiveSubjects() {
  const currentList = state.programMode === 'AOF' ? AOF_SUBJECTS : AOIHL_SUBJECTS;
  const list = [];
  const seen = new Set();

  for (const c of state.selectedCourses) {
    const s = currentList.find(subj => matchesSubject({ ders: c }, subj.id));
    if (s && !seen.has(s.id)) {
      seen.add(s.id);
      list.push(s);
    }
  }

  if (list.length === 0) {
    const fallback = currentList.find(s => s.id === state.currentSubject) || currentList[0];
    list.push(fallback);
  }

  return list;
}

export function getSubjectCourses(subject: string): string[] {
  const courses = Array.from(new Set(state.allData.filter(q => matchesSubject(q, subject)).map(q => q.ders)));
  return courses.sort((a, b) => {
    const numA = Number.parseInt(a.match(/\d+$/)?.[0] || '0', 10);
    const numB = Number.parseInt(b.match(/\d+$/)?.[0] || '0', 10);
    return numA - numB;
  });
}
