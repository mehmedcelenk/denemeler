import type { Question } from '../../data/question.ts';
import type { QuestionLesson } from '../../data/lesson.ts';
import { escapeHtml } from '../../shared/escape.ts';
import { renderLessonInline, renderLessonRichText } from './rich-text.ts';

const svgTeacherIcon = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c3 3 9 3 12 0v-5"/></svg>`;

const ACTIVE_LEARNING_TRICK_TEXT = 'Okuyarak öğrenmek okuduğunun %5’i kadarını hatırlamanı sağlar, aktif öğrenme ise %70’e kadar. Şimdi sana aktif öğrenme yöntemlerinden küçük bir hile önereceğim; bunu uygularsan daha az çalışarak daha çok yol katetmiş olacaksın inşallah: Lütfen bana bu sorunun bir kopyasını — biraz daha kolay olabilir — kendi sınav sorun olarak hazırla. Soruyu hazırlarken zorlanabilirsin; işte bu, ağırlık kaldırırken yaşadığın zorlanma gibidir. Kaçma ve ağırlığı basmaya devam et, kazanan sen olacaksın.';

/** Soru kartının özellik çubuğundaki "İHÖ" butonunu üretir. */
export function renderLessonToolbarButton(q: Question, isReady: boolean, isOpen = false): string {
  if (q.sekilli) return '';
  const readyClass = isReady ? ' is-ready' : '';
  const openClass = isOpen ? ' is-open' : '';
  const title = isReady
    ? 'Hocadan Öğren — Konu Anlatımı Hazır'
    : 'Hocadan Öğren — Konu Anlatımını Aç';
  const dotHtml = isReady ? '<span class="lesson-ready-dot" aria-hidden="true"></span>' : '';
  return `<button type="button" class="btn-companion-icon btn-lesson-guide${readyClass}${openClass}" data-action="open-question-lesson" data-qid="${q.id}" data-lesson-ready="${isReady ? 'true' : 'false'}" aria-expanded="${isOpen ? 'true' : 'false'}" title="${title}" aria-label="${title}">${svgTeacherIcon}<span class="lesson-btn-label">İHÖ</span>${dotHtml}</button>`;
}

/** Soru kartının hemen altında açılacak inline anlatım yuvası (tekil ID kullanmaz). */
export function renderLessonInlineHost(q: Question): string {
  if (q.sekilli) return '';
  return `<div class="lesson-inline-host" data-role="lesson-inline-host" data-qid="${q.id}" hidden></div>`;
}

export function renderLessonLoadingMarkup(q?: Question): string {
  const title = q?.soru_no ? `Soru ${q.soru_no} — Hoca Anlatımı` : 'Hoca Anlatımı';
  return `
    <div class="lesson-inline-panel" data-role="lesson-inline-panel">
      <div class="lesson-inline-head">
        <div class="lesson-inline-title">${escapeHtml(title)}</div>
        <button type="button" class="lesson-inline-close" data-lesson-close aria-label="Anlatımı kapat" title="Kapat">✕</button>
      </div>
      <div class="lesson-state-inline" role="status" aria-live="polite">
        <span class="lesson-spinner" aria-hidden="true"></span>
        <span>Hoca anlatımı yükleniyor…</span>
      </div>
    </div>
  `;
}

export function renderLessonEmptyMarkup(q?: Question): string {
  const title = q?.soru_no ? `Soru ${q.soru_no} için anlatım hazırlanıyor` : 'Bu soru için anlatım hazırlanıyor';
  return `
    <div class="lesson-inline-panel" data-role="lesson-inline-panel">
      <div class="lesson-inline-head">
        <div class="lesson-inline-title">${escapeHtml(title)}</div>
        <button type="button" class="lesson-inline-close" data-lesson-close aria-label="Anlatımı kapat" title="Kapat">✕</button>
      </div>
      <p class="lesson-empty-text">Ön-üretilmiş hoca anlatımları şu an <strong>Matematik</strong>, <strong>Türk Dili ve Edebiyatı</strong> ve <strong>Tarih</strong> pilot sorularında yayında. Diğer sorular adım adım ekleniyor.</p>
    </div>
  `;
}

/** Soru altında açılan Pareto odaklı, altın oran ritimli sade öğretmen anlatımı. */
export function renderLessonInlineMarkup(lesson: QuestionLesson): string {
  return `
    <div class="lesson-inline-panel" data-role="lesson-inline-panel" data-qid="${lesson.questionId}">
      <div class="lesson-inline-head">
        <div class="lesson-inline-title">${renderLessonInline(lesson.title)}</div>
        <button type="button" class="lesson-inline-close" data-lesson-close aria-label="Anlatımı kapat" title="Kapat">✕</button>
      </div>

      <div class="lesson-inline-body">
        <section class="lesson-block lesson-explanation-block" data-lesson-section="explanation" aria-label="Konu Anlatımı">
          ${renderLessonRichText(lesson.explanation, lesson.concepts)}
        </section>

        <section class="lesson-block lesson-trick-card" data-lesson-section="learning-trick" aria-label="Öğrenmenin Küçük Bir Hilesi">
          <div class="lesson-trick-kicker">Öğrenmenin Küçük Bir Hilesi</div>
          <p class="lesson-trick-text">${escapeHtml(ACTIVE_LEARNING_TRICK_TEXT)}</p>
        </section>
      </div>
    </div>
  `;
}
