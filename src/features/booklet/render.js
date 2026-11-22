import { state, onStateChange } from '../../app/state.ts';
import { getCondensedCourseCode } from '../../data/subjects.js';
import { escapeHtml } from '../../shared/escape.ts';
import {
  disconnectBookletPagination,
  ensureQuestionRendered,
  mountPaginatedBooklet,
  renderAllRemainingQuestions,
} from './pagination.ts';

function syncBookletLayoutClasses() {
  if (typeof document === 'undefined') return;
  const cols = state.currentColumnCount || 2;
  const container = document.getElementById('bookletPagesContainer');
  if (container) {
    container.classList.remove('wide-3', 'wide-4');
    if (cols === 3) container.classList.add('wide-3');
    if (cols === 4) container.classList.add('wide-4');
  }
  document.querySelectorAll('.page-columns-body').forEach(el => {
    el.classList.remove('cols-1', 'cols-2', 'cols-3', 'cols-4');
    el.classList.add(`cols-${cols}`);
  });
}

if (typeof document !== 'undefined') {
  document.addEventListener('booklet:layoutchange', () => syncBookletLayoutClasses());
}

onStateChange('print:before', () => {
  renderAllRemainingQuestions();
}, -10);

onStateChange('booklet:ensure-question', (payload) => {
  if (!payload || typeof payload !== 'object' || !('qid' in payload)) return;
  const qid = Number(payload.qid);
  if (Number.isNaN(qid)) return;
  const card = ensureQuestionRendered(qid);
  if (card && 'scroll' in payload && payload.scroll) {
    card.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }
});

function getBookletHeaderMeta(programMode, selectedCoursesSize, selectedTopicKeys) {
  let institution = 'T.C. MİLLÎ EĞİTİM BAKANLIĞI • AÇIK ÖĞRETİM LİSESİ';
  let defaultTitle = 'DÖNEM ÇIKMIŞ SINAV SORULARI';
  let footerName = 'AÖL KESİŞİM REHBERİ';

  if (programMode === 'AOIHL') {
    institution = 'T.C. MİLLÎ EĞİTİM BAKANLIĞI • AÇIK ÖĞRETİM İMAM HATİP LİSESİ';
    defaultTitle = 'DÖNEM ÇIKMIŞ SINAV SORULARI';
    footerName = 'AÖİHL KESİŞİM REHBERİ';
  } else if (programMode === 'AOO') {
    institution = 'T.C. MİLLÎ EĞİTİM BAKANLIĞI • AÇIK ÖĞRETİM ORTAOKULU';
    defaultTitle = 'AÖO ÇIKMIŞ SINAV SORULARI';
    footerName = 'ANLATAN SORULAR AÖO REHBERİ';
  } else if (programMode === 'AOF') {
    institution = 'ANADOLU ÜNİVERSİTESİ • AÇIKÖĞRETİM FAKÜLTESİ';
    defaultTitle = 'AÖF ÇIKMIŞ SINAV SORULARI';
    footerName = 'AÖF İLAHİYAT REHBERİ';
  } else if (programMode === 'ILMIHAL') {
    institution = 'DİYANET İŞLERİ BAŞKANLIĞI • EĞİTİM MERKEZİ';
    defaultTitle = 'İLMİHAL ÇALIŞMA SORULARI';
    footerName = 'ANLATAN SORULAR İLMİHAL REHBERİ';
  } else if (programMode === 'GIRISIMCILIK') {
    institution = 'T.C. MİLLÎ EĞİTİM BAKANLIĞI • AÇIK ÖĞRETİM LİSESİ';
    defaultTitle = 'GİRİŞİMCİLİK ÇALIŞMA SORULARI';
    footerName = 'ANLATAN SORULAR GİRİŞİMCİLİK REHBERİ';
  } else if (['TYT', 'AYT', 'YDT'].includes(programMode)) {
    institution = 'ÖSYM • YÜKSEKÖĞRETİM KURUMLARI SINAVI';
    defaultTitle = `${programMode} ÇIKMIŞ SINAV SORULARI`;
    footerName = `ANLATAN SORULAR ${programMode} REHBERİ`;
  }

  const topicTitle = selectedTopicKeys.size === 1 ? Array.from(selectedTopicKeys)[0] : '';
  const examTitle = topicTitle || (selectedCoursesSize > 1 ? 'ORTAK KAZANIMLAR KESİŞİM TESTİ' : defaultTitle);

  return { institution, examTitle, footerName };
}

export function renderBookletPages(targetQuestionId = null) {
  if (typeof document === 'undefined') return;
  const container = document.getElementById('bookletPagesContainer');
  if (!container) return;

  disconnectBookletPagination();

  if (state.contentViewMode === 'notes') {
    container.innerHTML = `
      <div style="background:var(--paper-bg); border:1px dashed var(--paper-border); padding:50px 20px; text-align:center; border-radius:16px; color:var(--paper-text-muted); max-width:540px; margin:40px auto; box-shadow:0 8px 30px rgba(0,0,0,0.04);">
        <div style="font-size:38px; margin-bottom:12px;">📝</div>
        <div style="font-size:17px; font-weight:800; color:var(--paper-text); margin-bottom:8px;">Ders Notları</div>
        <div style="font-size:13px; line-height:1.6; margin-bottom:18px; color:var(--paper-text-muted);">Bu ders için özet konu notları hazırlanıyor. Çok yakında burada ders notları yer alacaktır.</div>
        <button class="btn-primary" data-action="set-content-view" data-view="questions" style="padding:9px 20px; font-size:12.5px; border-radius:10px; cursor:pointer; background:var(--brand-accent); color:#fff; border:none; font-weight:700;">❓ Sorulara Dön</button>
      </div>
    `;
    return;
  }

  if (state.bookletQuestions.length === 0) {
    if (state.bookletFilterMode === 'rematch' || state.bookletFilterMode === 'incorrect') {
      container.innerHTML = `
        <div style="background:var(--paper-bg); border:1px dashed var(--paper-border); padding:50px 20px; text-align:center; border-radius:16px; color:var(--paper-text-muted); max-width:540px; margin:40px auto; box-shadow:0 8px 30px rgba(0,0,0,0.04);">
          <div style="font-size:36px; margin-bottom:12px;">🏆</div>
          <div style="font-size:16px; font-weight:800; color:var(--paper-text); margin-bottom:6px;">Tebrikler! Bu derste rövanş bekleyen soru yok.</div>
          <div style="font-size:13px; line-height:1.5; margin-bottom:18px;">Yanlış yaptığınız veya tahminle bildiğiniz tüm soruları fethettiniz. Klasik modda yeni sorular çözebilirsiniz.</div>
          <button class="btn-primary" data-action="set-booklet-filter" data-filter="all" style="padding:9px 20px; font-size:12.5px; border-radius:10px; cursor:pointer; background:var(--brand-accent); color:#fff; border:none; font-weight:700;">📝 Klasik Moda Dön</button>
        </div>
      `;
    } else if (state.bookletFilterMode === 'review') {
      container.innerHTML = `
        <div style="background:var(--paper-bg); border:1px dashed var(--paper-border); padding:50px 20px; text-align:center; border-radius:16px; color:var(--paper-text-muted); max-width:540px; margin:40px auto; box-shadow:0 8px 30px rgba(0,0,0,0.04);">
          <div style="font-size:36px; margin-bottom:12px;">🔄</div>
          <div style="font-size:16px; font-weight:800; color:var(--paper-text); margin-bottom:6px;">Henüz tekrar edilecek soru yok.</div>
          <div style="font-size:13px; line-height:1.5; margin-bottom:18px;">Doğru çözdüğünüz sorular burada birikir; şıkları gizli şekilde yeniden çözüp bilginizi sınayabilirsiniz.</div>
          <button class="btn-primary" data-action="set-booklet-filter" data-filter="all" style="padding:9px 20px; font-size:12.5px; border-radius:10px; cursor:pointer; background:var(--brand-accent); color:#fff; border:none; font-weight:700;">📝 Sorulara Dön</button>
        </div>
      `;
    } else if (state.bookletFilterMode === 'starred') {
      container.innerHTML = `
        <div style="background:var(--paper-bg); border:1px dashed var(--paper-border); padding:50px 20px; text-align:center; border-radius:16px; color:var(--paper-text-muted); max-width:540px; margin:40px auto; box-shadow:0 8px 30px rgba(0,0,0,0.04);">
          <div style="font-size:36px; margin-bottom:12px;">🔖</div>
          <div style="font-size:16px; font-weight:800; color:var(--paper-text); margin-bottom:6px;">Henüz soru kaydetmediniz.</div>
          <div style="font-size:13px; line-height:1.5; margin-bottom:18px;">Soruların sağ üstündeki kaydet ikonuna tıklayarak sınav öncesi tekrar etmek istediğiniz soruları buraya toplayabilirsiniz.</div>
          <button class="btn-primary" data-action="set-booklet-filter" data-filter="all" style="padding:9px 20px; font-size:12.5px; border-radius:10px; cursor:pointer; background:var(--brand-accent); color:#fff; border:none; font-weight:700;">📝 Soruları Keşfet</button>
        </div>
      `;
    } else {
      container.innerHTML = `
        <div style="background:var(--paper-bg); border:1px dashed var(--paper-border); padding:60px 20px; text-align:center; border-radius:12px; color:var(--paper-text-muted);">
          Seçilen kriterlere uygun soru bulunamadı. Lütfen üstteki başlığa tıklayarak başka kademe veya konu seçin.
        </div>
      `;
    }
    return;
  }

  const columnClass = `cols-${state.currentColumnCount}`;
  const badgeCode = getCondensedCourseCode(state.selectedCourses, state.currentSubject);
  const headerMeta = getBookletHeaderMeta(state.programMode, state.selectedCourses.size, state.selectedTopicKeys);

  container.innerHTML = `
    <div class="booklet-page" id="page_1">
      <div class="page-header-band">
        <div class="page-header-left">
          <span class="institution-name">${escapeHtml(headerMeta.institution)}</span>
          <span class="exam-name-title">${escapeHtml(headerMeta.examTitle)}</span>
        </div>
        <div class="page-header-right">
          <span class="page-badge-code">${badgeCode} • ${state.bookletQuestions.length} SORU</span>
        </div>
      </div>

      <div class="page-columns-body ${columnClass}" id="bookletQuestionBody_1"></div>
      <div class="booklet-load-sentinel" id="bookletLoadSentinel"></div>

      <div>
        <div class="page-footer-band">
          <span class="page-num-pill">— TOPLAM ${state.bookletQuestions.length} SORU —</span>
          <span>${escapeHtml(headerMeta.footerName)}</span>
        </div>
      </div>
    </div>
  `;

  const bodyEl = document.getElementById('bookletQuestionBody_1');
  const sentinelEl = document.getElementById('bookletLoadSentinel');
  if (bodyEl) {
    mountPaginatedBooklet(state.bookletQuestions, bodyEl, sentinelEl, targetQuestionId);
  }
}
