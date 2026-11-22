import { onStateChange, state } from '../../app/state.ts';
import { resolveSelectedCourseEntries } from '../../data/course-catalog.ts';
import { loadSubjectData, loadedSubjects, subjectQuestionCache } from '../../data/questions.js';
import { SUBJECTS } from '../../data/subjects.js';
import { escapeHtml } from '../../shared/escape.ts';
import { renderSkyRankStripHtml } from '../../shared/sky-rank.ts';
import {
  buildStudyMetrics,
  CALIBRATION_THRESHOLD,
  type CourseMetric,
  type StudyMetrics,
  type SubjectMetric,
  type TermMetric,
} from '../../shared/study-metrics.ts';
import { getSubjectsForProgram, initProfileScreen } from './profile-screen.ts';

let backgroundLoadPromise: Promise<void> | null = null;
let arenaInitialized = false;

export function initArenaReport(): void {
  if (arenaInitialized) return;
  arenaInitialized = true;
  initProfileScreen(() => renderArenaReport());
  onStateChange('answer:marked', () => renderArenaReport());
  onStateChange('progress:changed', () => renderArenaReport());
  onStateChange('booklet:refresh', () => {
    if (typeof document !== 'undefined' && document.body.classList.contains('welcome-active')) {
      renderArenaReport();
    }
  });
}

function renderTermItem(term: TermMetric): string {
  const detail = term.isCalibrated ? `%${term.percentage}` : `%0 (${term.solved}/${CALIBRATION_THRESHOLD})`;
  return `<span class="arena-term-item">${escapeHtml(term.termLabel)} <strong>${detail}</strong></span>`;
}

function renderLegacySubjectRow(subject: SubjectMetric): string {
  const singleTerm = subject.terms.length === 1
    ? `<span class="arena-subject-term">· ${escapeHtml(subject.terms[0].termLabel)}</span>` : '';
  const multiTerms = subject.terms.length > 1
    ? `<span class="arena-subject-terms">${subject.terms.map(renderTermItem).join('<span class="arena-term-sep" aria-hidden="true">·</span>')}</span>` : '';
  const countText = !subject.isCalibrated ? `${subject.solved}/${CALIBRATION_THRESHOLD}` : `${subject.correct}/${subject.solved}`;
  const toneClass = !subject.isCalibrated ? 'is-locked' : subject.percentage >= 70 ? 'is-strong' : subject.percentage >= 45 ? 'is-mid' : 'is-weak';

  return `
    <li class="arena-subject-item">
      <button type="button" class="arena-subject-row ${toneClass}" data-action="welcome-open-subject" data-subject="${escapeHtml(subject.subjectId)}">
        <span class="arena-subject-main">
          <span class="arena-subject-top">
            <span class="arena-subject-name">${escapeHtml(subject.name)}</span>
            ${singleTerm}
          </span>
          ${multiTerms}
          <span class="arena-subject-line" aria-hidden="true"><span class="arena-subject-line-fill" style="width: ${subject.percentage}%"></span></span>
        </span>
        <span class="arena-subject-numbers">
          <span class="arena-subject-count">${countText}</span>
          <span class="arena-subject-pct">%${subject.percentage}</span>
        </span>
      </button>
    </li>
  `;
}

function renderResponsibleCourseRow(course: CourseMetric): string {
  const threshold = Math.min(CALIBRATION_THRESHOLD, Math.max(1, course.questionCount || CALIBRATION_THRESHOLD));
  const countText = course.solved === 0
    ? 'Başla →'
    : !course.isCalibrated
      ? `${course.solved}/${threshold}`
      : `${course.correct}/${course.solved}`;
  const toneClass = !course.isCalibrated
    ? 'is-locked'
    : course.percentage >= 70
      ? 'is-strong'
      : course.percentage >= 45
        ? 'is-mid'
        : 'is-weak';
  const termTag = course.termLabel ? `<span class="arena-subject-term">· ${escapeHtml(course.termLabel)}</span>` : '';
  const creditTag = (state.programMode === 'AOIHL' || state.programMode === 'AOO' || state.programMode === 'AOF')
    ? `<span class="arena-course-credit">${course.kredi} kr</span>`
    : '';

  return `
    <li class="arena-subject-item">
      <button type="button" class="arena-subject-row ${toneClass}" data-action="welcome-open-subject" data-subject="${escapeHtml(course.subjectId)}" data-ders="${escapeHtml(course.ders)}">
        <span class="arena-subject-main">
          <span class="arena-subject-top">
            <span class="arena-subject-name">${escapeHtml(course.subjectName)}</span>
            ${termTag}
            ${creditTag}
          </span>
          <span class="arena-subject-line" aria-hidden="true"><span class="arena-subject-line-fill" style="width: ${course.percentage}%"></span></span>
        </span>
        <span class="arena-subject-numbers">
          <span class="arena-subject-count">${countText}</span>
          <span class="arena-subject-pct">%${course.percentage}</span>
        </span>
      </button>
    </li>
  `;
}

function renderArenaCallout(metrics: StudyMetrics): string {
  if (!metrics.hasResponsibleCourses) {
    return `
      <div class="arena-strip is-setup">
        <div class="arena-strip-head">
          <span class="arena-strip-title">📋 Sorumlu Derslerini Seç</span>
        </div>
        <p class="arena-strip-desc">Gerçek başarı oranın, bu dönem sınava gireceğin tüm dersler üzerinden hesaplanır.</p>
        <button type="button" class="arena-cta-btn" id="btnOpenResponsiblePicker" data-action="open-profile-screen" data-edit="true">
          <span>Sorumlu Dersleri Seç</span>
          <span aria-hidden="true">→</span>
        </button>
      </div>
    `;
  }

  if (metrics.rematchCount > 0) {
    const hasBoost = metrics.isTotalCalibrated && metrics.potentialPercentage > metrics.totalPercentage;
    const desc = hasBoost
      ? `<strong>${metrics.rematchCount} rakip</strong> bekliyor — temizle, sorumlu başarını <strong>%${metrics.totalPercentage} → %${metrics.potentialPercentage}</strong>'e çıkar.`
      : `<strong>${metrics.rematchCount} rakip</strong> bekliyor — yanlışlarını devirip meydanı temizle.`;
    const clearedRatio = metrics.totalSolved > 0
      ? Math.max(6, Math.round(((metrics.totalSolved - metrics.rematchCount) / metrics.totalSolved) * 100))
      : 6;

    return `
      <div class="arena-strip is-active">
        <div class="arena-strip-head">
          <span class="arena-strip-title">⚔️ Rövanş Meydanı</span>
          <span class="arena-strip-count">${metrics.rematchCount} bekleyen</span>
        </div>
        <p class="arena-strip-desc">${desc}</p>
        <div class="arena-track" role="progressbar" aria-label="Rövanş Meydanı ilerlemesi" aria-valuenow="${clearedRatio}" aria-valuemin="0" aria-valuemax="100">
          <span class="arena-track-fill" style="width: ${clearedRatio}%"></span>
        </div>
        <button type="button" class="arena-cta-btn" data-action="welcome-start-rematch">
          <span>Rövanş Meydanına Gir</span>
          <span aria-hidden="true">→</span>
        </button>
      </div>
    `;
  }

  if (!metrics.isTotalCalibrated) {
    const remaining = metrics.responsibleCount - metrics.calibratedCourseCount;
    return `
      <div class="arena-strip is-empty">
        <div class="arena-strip-head">
          <span class="arena-strip-title">🧭 Kapsam Uyarısı</span>
          <span class="arena-strip-count">${metrics.calibratedCourseCount}/${metrics.responsibleCount} ders hazır</span>
        </div>
        <p class="arena-strip-desc">Sorumlu başarı yüzdesinin açılması için kalan <strong>${remaining} sorumlu dersin</strong> her birinden en az ${CALIBRATION_THRESHOLD} soru çöz.</p>
      </div>
    `;
  }

  if (metrics.totalSolved > 0) {
    return `
      <div class="arena-strip is-clean">
        <div class="arena-strip-head">
          <span class="arena-strip-title">🏆 Rövanş Meydanı</span>
          <span class="arena-strip-count">Temiz</span>
        </div>
        <p class="arena-strip-desc">Bekleyen yanlış soru kalmadı. Tüm sorumlu derslerde oranını koru.</p>
      </div>
    `;
  }

  return '';
}

function renderTotalHeader(metrics: StudyMetrics, isAnalyzing: boolean): string {
  const showCredits = state.programMode === 'AOIHL' || state.programMode === 'AOO' || state.programMode === 'AOF';
  const labelText = metrics.hasResponsibleCourses
    ? `SORUMLU BAŞARI · ${metrics.responsibleCount} DERS`
    : 'SORUMLU BAŞARI';

  let subtext: string;
  if (!metrics.hasResponsibleCourses) {
    subtext = metrics.totalSolved > 0
      ? `Önce sorumlu derslerini seç • ${metrics.totalSolved} soru çözüldü`
      : 'Önce sorumlu olduğun dersleri seç';
  } else if (isAnalyzing) {
    subtext = `${metrics.startedCourseCount}/${metrics.responsibleCount} ders • analiz ediliyor…`;
  } else {
    const parts = [
      metrics.startedCourseCount === 0
        ? `0/${metrics.responsibleCount} ders başlandı`
        : `${metrics.calibratedCourseCount}/${metrics.responsibleCount} ders hazır`,
    ];
    if (!metrics.isTotalCalibrated && metrics.startedCourseCount > 0) {
      parts.push(`Her dersten en az ${CALIBRATION_THRESHOLD} soru`);
    }
    if (metrics.isAttemptedCalibrated) parts.push(`Çözülenlerde %${metrics.attemptedPercentage}`);
    else if (metrics.totalSolved > 0) parts.push(`${metrics.totalSolved}/${CALIBRATION_THRESHOLD} soru`);
    if (showCredits && metrics.totalCredits > 0) parts.push(`${metrics.totalCredits} kredi`);
    subtext = parts.join(' · ');
  }

  const fillWidth = metrics.hasResponsibleCourses && metrics.isTotalCalibrated ? metrics.totalPercentage : 0;

  return `
    <div class="arena-total">
      <div class="arena-total-row">
        <div class="arena-total-meta">
          <span class="arena-section-label">${labelText}</span>
          <span class="arena-total-sub">${escapeHtml(subtext)}</span>
        </div>
        <span class="arena-total-pct ${metrics.isTotalCalibrated ? '' : 'is-locked'}">%${metrics.totalPercentage}</span>
      </div>
      <div class="arena-total-line ${metrics.isTotalCalibrated ? '' : 'is-calibrating'}" role="progressbar" aria-label="Sorumlu genel başarı oranı" aria-valuenow="${metrics.totalPercentage}" aria-valuemin="0" aria-valuemax="100">
        <span class="arena-total-line-fill" style="width: ${fillWidth}%"></span>
      </div>
    </div>
  `;
}

function triggerBackgroundResolution(generation: number, targetSubjectIds: readonly string[]): void {
  if (backgroundLoadPromise) return;
  const missing = targetSubjectIds.filter(id => !loadedSubjects.has(id));
  if (missing.length === 0) return;

  backgroundLoadPromise = Promise.allSettled(missing.map(id => loadSubjectData(id))).then(() => {
    backgroundLoadPromise = null;
    if (state.studyGeneration === generation) renderArenaReport(false);
  });
}

export function renderArenaReport(allowBackgroundLoad = true): void {
  const container = document.getElementById('welcomeArenaReport');
  if (!container) return;

  const programSubjects = getSubjectsForProgram(state.programMode);
  const allowedIds = new Set(programSubjects.map(s => s.id));
  const selectedDersList = state.responsibleCourses[state.programMode] ?? [];
  const responsibleEntries = resolveSelectedCourseEntries(selectedDersList, allowedIds);

  const metrics = buildStudyMetrics(
    state.userMarkedChoices,
    state.rematchQuestionIds,
    subjectQuestionCache,
    SUBJECTS,
    responsibleEntries,
  );

  const neededSubjects = responsibleEntries.length > 0
    ? [...new Set(responsibleEntries.map(e => e.subjectId))]
    : programSubjects.map(s => s.id);
  const hasMissingSubjects = neededSubjects.some(id => !loadedSubjects.has(id));
  const isAnalyzing = metrics.unresolvedCount > 0 && hasMissingSubjects;

  if (allowBackgroundLoad && isAnalyzing) {
    triggerBackgroundResolution(state.studyGeneration, neededSubjects);
  }

  let listHtml = '';
  if (metrics.hasResponsibleCourses) {
    const otherNote = metrics.otherSolvedCount > 0
      ? `<p class="arena-other-note">Sorumlu liste dışında ${metrics.otherSolvedCount} soru daha çözüldü.</p>`
      : '';
    listHtml = `
      <div class="arena-subjects">
        <span class="arena-section-label">SORUMLU DERSLERİN</span>
        <ul class="arena-subjects-list">
          ${metrics.courses.map(renderResponsibleCourseRow).join('')}
        </ul>
        ${otherNote}
      </div>
    `;
  } else if (metrics.subjects.length > 0) {
    listHtml = `
      <div class="arena-subjects">
        <span class="arena-section-label">ÇÖZÜLEN DERSLER</span>
        <ul class="arena-subjects-list">
          ${metrics.subjects.map(renderLegacySubjectRow).join('')}
        </ul>
      </div>
    `;
  }

  container.innerHTML = `
    <div class="arena-report">
      ${renderSkyRankStripHtml(state.waterStreak)}
      ${renderTotalHeader(metrics, isAnalyzing)}
      ${renderArenaCallout(metrics)}
    </div>
  `;

  const subjectsContainer = document.getElementById('welcomeArenaSubjects');
  if (subjectsContainer) {
    subjectsContainer.innerHTML = listHtml;
  }
}
