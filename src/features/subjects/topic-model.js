import { getTopicKey } from '../../shared/topic.ts';
import { state } from '../../app/state.ts';
import { matchesSubject } from '../../data/subjects.js';

export function getAggregatedTopics() {
  if (!state.currentSubject) return [];
  const map = {};
  const examPeriods = new Set();

  state.allData.forEach(q => {
    if (!matchesSubject(q, state.currentSubject)) return;
    if (!state.selectedCourses.has(q.ders)) return;

    if (q.yil && q.donem !== undefined) {
      examPeriods.add(`${q.yil}-D${q.donem}`);
    }

    const sub = q.alt_konu || 'Genel';
    const ak = q.ana_konu || 'Genel';
    const key = getTopicKey(q);
    if (!map[key]) {
      map[key] = { key: key, alt_konu: sub, ana_konu: ak, count: 0, courses: {} };
    }
    map[key].count++;
    map[key].courses[q.ders] = (map[key].courses[q.ders] || 0) + 1;
  });

  const periodCount = Math.max(1, examPeriods.size);
  let topics = Object.values(map).map(t => ({
    ...t,
    avg_per_exam: Number((t.count / periodCount).toFixed(1)),
    period_count: periodCount,
  }));

  // Çoklu ders seçilmişse ve AND (kesişim) modu aktifse kesişim uygula
  if (state.courseFilterMode === 'AND' && state.selectedCourses.size > 1) {
    const strictTopics = topics.filter(t => {
      const setC = new Set(Object.keys(t.courses));
      for (let req of state.selectedCourses) {
        if (!setC.has(req)) return false;
      }
      return true;
    });

    if (strictTopics.length > 0) {
      topics = strictTopics;
    } else {
      topics = topics.filter(t => Object.keys(t.courses).length >= 2);
    }
  }

  topics.sort((a, b) => {
    const aGen = (a.alt_konu && a.alt_konu.includes('Saptanamadı')) || (a.ana_konu && a.ana_konu.includes('Genel Dil'));
    const bGen = (b.alt_konu && b.alt_konu.includes('Saptanamadı')) || (b.ana_konu && b.ana_konu.includes('Genel Dil'));
    if (aGen && !bGen) return 1;
    if (!aGen && bGen) return -1;
    return b.count - a.count;
  });
  return topics;
}

