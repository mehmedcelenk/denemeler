import { getCourseCatalogBySubject, resolveSelectedCourseEntries, type CourseCatalogEntry } from '../../data/course-catalog.ts';
import { escapeHtml } from '../../shared/escape.ts';
import { formatStars, getSkyRank, renderSkyIconSvg, renderWhiteStarSvg } from '../../shared/sky-rank.ts';
import { state } from '../../app/state.ts';
import { MASCOT_OPTIONS, type MascotId } from '../../shared/mascot-types.ts';
import { MASCOT_ENABLED } from '../../shared/mascot-config.ts';
import { renderMascotOptionSvg } from '../../shared/mascot-svgs.ts';
import { extractCourseTerm } from '../../shared/study-metrics.ts';
import type { AppState } from '../../app/state-types.ts';
import { getActiveSession, isGuest } from './study-session.ts';

export type ProgramMode = AppState['programMode'];

export const PROGRAM_OPTIONS: readonly { readonly id: ProgramMode; readonly label: string }[] = [
  { id: 'AOIHL', label: 'AOİHL' },
  { id: 'AOO', label: 'AÖO' },
  { id: 'AOF', label: 'AÖF' },
  { id: 'TYT', label: 'TYT' },
  { id: 'AYT', label: 'AYT' },
  { id: 'YDT', label: 'YDT' },
  { id: 'ILMIHAL', label: 'İlmihal' },
  { id: 'GIRISIMCILIK', label: 'Girişimcilik' },
];

export interface ProfileSubjectItem {
  readonly id: string;
  readonly name: string;
}

export interface ProfileViewRenderInput {
  readonly isEditMode: boolean;
  readonly mode: ProgramMode;
  readonly mascotId: MascotId;
  readonly subjects: readonly ProfileSubjectItem[];
  readonly selectedSet: ReadonlySet<string>;
  readonly countByProgram: Readonly<Record<string, number>>;
  readonly selectedCount: number;
  readonly selectedCredits: number;
}

function getProgramLabel(mode: ProgramMode): string {
  return PROGRAM_OPTIONS.find(o => o.id === mode)?.label ?? mode;
}

function renderCourseButton(entry: CourseCatalogEntry, isSingle: boolean, selectedSet: ReadonlySet<string>): string {
  const selected = selectedSet.has(entry.ders);
  const term = extractCourseTerm(entry.ders, entry.subjectId);
  const label = isSingle ? entry.shortName : term ? String(term.order) : entry.shortName;
  const title = `${entry.ders} (${entry.kredi} kredi • ${entry.questionCount} soru)`;
  return `
    <button
      type="button"
      class="rp-chip ${isSingle ? 'is-wide' : ''} ${selected ? 'is-selected' : ''}"
      data-action="toggle-responsible-course"
      data-ders="${escapeHtml(entry.ders)}"
      aria-pressed="${selected}"
      title="${escapeHtml(title)}"
    >${escapeHtml(label)}</button>
  `;
}

function renderIdentitySection(isEditMode: boolean): string {
  const session = getActiveSession();
  const guest = isGuest() || !session;
  if (guest) {
    return `
      <div class="ps-section">
        <span class="ps-section-label">HESAP</span>
        <div class="ps-identity-row">
          <span class="ps-identity-name" id="profileUserNameDisplay">Misafir</span>
          <button type="button" class="ps-link-btn" data-action="welcome-open-auth">Hesabımla Giriş Yap →</button>
        </div>
      </div>
    `;
  }
  const displayName = session.user.displayName || session.user.username || 'Kullanıcı';
  const rank = getSkyRank(state.waterStreak);
  if (!isEditMode) {
    return `
      <div class="ps-section">
        <span class="ps-section-label">GÖRÜNEN AD</span>
        <div class="ps-identity-row">
          <span class="ps-identity-name" id="profileUserNameDisplay">${escapeHtml(displayName)}</span>
          <button type="button" class="ps-sky-badge" data-sky-layer="${rank.layer}" data-action="toggle-sky-rank-popover" title="Sema Derecesi">
            ${renderSkyIconSvg(rank.layer, 18)}
            <span class="ps-sky-label">${escapeHtml(rank.label)}</span>
            <span class="ps-sky-star-val">${renderWhiteStarSvg(11)}<span>${formatStars(rank.stars)}</span></span>
          </button>
        </div>
      </div>
    `;
  }
  return `
    <div class="ps-section">
      <span class="ps-section-label">GÖRÜNEN AD</span>
      <div class="ps-identity-row">
        <span class="ps-identity-name" id="profileUserNameDisplay">${escapeHtml(displayName)}</span>
        <div class="ps-name-inline-wrap" id="displayNameEditor" hidden>
          <input id="displayNameInput" type="text" maxlength="80" autocomplete="name" class="ps-name-input" placeholder="Adınız">
          <button type="button" class="ps-name-save-btn" id="displayNameSave" data-action="welcome-save-name">Tamam</button>
          <p class="welcome-name-error" id="displayNameError" role="alert"></p>
        </div>
        <button type="button" class="ps-edit-name-btn" id="btnHeaderEditName" data-action="welcome-edit-name" title="Adı Değiştir" aria-label="Adı Değiştir">
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/></svg>
          <span>Adı Değiştir</span>
        </button>
      </div>
    </div>
  `;
}

function renderMascotSection(activeMascot: MascotId): string {
  if (!MASCOT_ENABLED) return '';
  const session = getActiveSession();
  if (isGuest() || !session) return '';
  const itemsHtml = MASCOT_OPTIONS.map(option => {
    const selected = option.id === activeMascot;
    return `
      <button
        type="button"
        class="ps-mascot-card ${selected ? 'is-selected' : ''}"
        data-action="select-mascot"
        data-mascot="${option.id}"
        aria-pressed="${selected}"
      >
        <span class="ps-mascot-preview" aria-hidden="true">${renderMascotOptionSvg(option.id)}</span>
        <span class="ps-mascot-label">${escapeHtml(option.label)}</span>
      </button>
    `;
  }).join('');

  return `
    <div class="ps-section" data-role="profile-mascot-section">
      <span class="ps-section-label">MASKOT</span>
      <div class="ps-mascot-grid" role="group" aria-label="Maskot seçimi">
        ${itemsHtml}
      </div>
    </div>
  `;
}

export function renderProfileReadOnlyHtml(input: ProfileViewRenderInput): string {
  const { mode, mascotId, subjects, selectedSet, selectedCount, selectedCredits } = input;
  const showCredits = mode === 'AOIHL' || mode === 'AOO' || mode === 'AOF';
  const allowedIds = new Set(subjects.map(s => s.id));
  const selectedEntries = resolveSelectedCourseEntries(Array.from(selectedSet), allowedIds);
  const summaryText = showCredits ? `${selectedCount} ders · ${selectedCredits} kredi` : `${selectedCount} ders seçili`;

  const coursesContent = selectedEntries.length > 0
    ? `<ul class="ps-readonly-list">${selectedEntries.map(entry => {
      const creditMeta = showCredits ? `<span class="rp-group-credit">${entry.kredi} kr</span>` : '';
      return `<li class="ps-readonly-item"><span>${escapeHtml(entry.shortName)}</span>${creditMeta}</li>`;
    }).join('')}</ul>`
    : `<p class="ps-lead">Henüz sorumlu ders seçilmedi. Sağ üstten <strong>Düzenle</strong> diyerek programını ve derslerini belirleyebilirsin.</p>`;

  return `
    <div class="ps-container">
      <header class="ps-topbar">
        <button type="button" class="ps-back-btn" id="btnCloseProfileScreen" data-action="close-profile-screen" aria-label="Geri dön">← Geri</button>
        <h1 class="ps-title">Profil</h1>
        <button type="button" class="ps-edit-toggle-btn" id="btnProfileEditMode" data-action="enter-profile-edit-mode">Düzenle</button>
      </header>

      ${renderIdentitySection(false)}
      ${renderMascotSection(mascotId)}

      <div class="ps-section">
        <span class="ps-section-label">SINAV PROGRAMI</span>
        <div class="ps-identity-row">
          <span class="ps-program-pill" id="profileActiveProgramLabel">${escapeHtml(getProgramLabel(mode))}</span>
        </div>
      </div>

      <div class="ps-section ps-courses-section">
        <div class="ps-courses-head">
          <span class="ps-section-label">SORUMLU OLDUĞUN DERSLER</span>
          <span class="rp-summary" id="rpSelectionSummary">${escapeHtml(summaryText)}</span>
        </div>
        ${coursesContent}
      </div>
    </div>
  `;
}

export function renderProfileEditHtml(input: ProfileViewRenderInput): string {
  const { mode, mascotId, subjects, selectedSet, countByProgram, selectedCount, selectedCredits } = input;
  const showCredits = mode === 'AOIHL' || mode === 'AOO' || mode === 'AOF';
  const summaryText = showCredits ? `${selectedCount} ders · ${selectedCredits} kredi` : `${selectedCount} ders seçili`;

  const programBarHtml = PROGRAM_OPTIONS.map(opt => {
    const active = opt.id === mode;
    const progCount = countByProgram[opt.id] ?? 0;
    const countDot = progCount > 0 ? `<span class="rp-program-count">${progCount}</span>` : '';
    return `
      <button
        type="button"
        class="rp-program-btn ${active ? 'active is-active' : ''}"
        data-action="select-profile-program"
        data-program="${opt.id}"
        aria-pressed="${active}"
      ><span>${escapeHtml(opt.label)}</span>${countDot}</button>
    `;
  }).join('');

  const groupsHtml = subjects.map(subj => {
    const entries = getCourseCatalogBySubject(subj.id);
    if (entries.length === 0) return '';
    const isSingle = entries.length === 1;
    const creditNote = showCredits && entries[0] ? `<span class="rp-group-credit">${entries[0].kredi} kr</span>` : '';
    return `
      <div class="rp-group ${isSingle ? 'is-single' : ''}">
        <div class="rp-group-head">
          <span class="rp-group-name">${escapeHtml(subj.name)}</span>
          ${creditNote}
        </div>
        <div class="rp-chip-row">${entries.map(e => renderCourseButton(e, isSingle, selectedSet)).join('')}</div>
      </div>
    `;
  }).join('');

  return `
    <div class="ps-container">
      <header class="ps-topbar">
        <button type="button" class="ps-back-btn" id="btnCancelProfileEdit" data-action="cancel-profile-edit-mode">Vazgeç</button>
        <h1 class="ps-title">Profili Düzenle</h1>
      </header>

      ${renderIdentitySection(true)}
      ${renderMascotSection(mascotId)}

      <div class="ps-section">
        <span class="ps-section-label">SINAV PROGRAMI</span>
        <div class="rp-program-bar" id="profileProgramSelector" role="group" aria-label="Sınav programları">
          ${programBarHtml}
        </div>
      </div>

      <div class="ps-section ps-courses-section">
        <div class="ps-courses-head">
          <span class="ps-section-label">SORUMLU OLDUĞUN DERSLER</span>
          <span class="rp-summary" id="rpSelectionSummary">${escapeHtml(summaryText)}</span>
        </div>
        <p class="ps-lead">Bu dönem sınava gireceğin dersleri işaretle; ana sayfadaki başarı analizin yalnızca bu dersler üzerinden hesaplanır.</p>
        <div class="rp-list">${groupsHtml}</div>
      </div>

      <footer class="ps-footer">
        ${selectedCount === 0
          ? '<button type="button" class="rp-clear-btn" data-action="close-profile-screen">Sonra</button>'
          : '<button type="button" class="rp-clear-btn" data-action="clear-responsible-courses">Temizle</button>'}
        <button type="button" class="rp-save-btn" id="btnSaveResponsibleCourses" data-action="save-responsible-courses">Kaydet</button>
      </footer>
    </div>
  `;
}
