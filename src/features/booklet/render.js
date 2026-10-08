import { state } from '../../app/state.ts';
import { getCondensedCourseCode } from '../../data/subjects.js';
import { escapeHtml } from '../../shared/escape.ts';
import { renderQuestionCardHtml } from './question-card.js';

let fontLayoutRefreshScheduled = false;

if (typeof document !== 'undefined') {
  document.addEventListener('booklet:layoutchange', () => renderBookletPages());
}

export function renderBookletPages(_targetQuestionId = null) {
  if (typeof document === 'undefined') return;
  const container = document.getElementById('bookletPagesContainer');
  if (!container) return;

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
          <button class="btn-primary" onclick="setBookletFilter('all')" style="padding:9px 20px; font-size:12.5px; border-radius:10px; cursor:pointer; background:var(--brand-accent); color:#fff; border:none; font-weight:700;">📝 Klasik Moda Dön</button>
        </div>
      `;
    } else if (state.bookletFilterMode === 'starred') {
      container.innerHTML = `
        <div style="background:var(--paper-bg); border:1px dashed var(--paper-border); padding:50px 20px; text-align:center; border-radius:16px; color:var(--paper-text-muted); max-width:540px; margin:40px auto; box-shadow:0 8px 30px rgba(0,0,0,0.04);">
          <div style="font-size:36px; margin-bottom:12px;">⭐</div>
          <div style="font-size:16px; font-weight:800; color:var(--paper-text); margin-bottom:6px;">Henüz yıldızlı soru eklemediniz.</div>
          <div style="font-size:13px; line-height:1.5; margin-bottom:18px;">Soruların sağ üstündeki ⭐ ikonuna tıklayarak sınav öncesi tekrar etmek istediğiniz soruları buraya toplayabilirsiniz.</div>
          <button class="btn-primary" onclick="setBookletFilter('all')" style="padding:9px 20px; font-size:12.5px; border-radius:10px; cursor:pointer; background:var(--brand-accent); color:#fff; border:none; font-weight:700;">📝 Soruları Keşfet</button>
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
  const pageRanges = paginateQuestionRanges(container, badgeCode, columnClass);
  container.innerHTML = pageRanges.map(({ start, end }, pageIndex) => {
    const pageChunk = renderQuestionChunkHtml(start, end);
    return renderPageHtml(pageChunk, badgeCode, columnClass, pageIndex + 1, pageRanges.length);
  }).join('');

  if (!fontLayoutRefreshScheduled && document.fonts) {
    fontLayoutRefreshScheduled = true;
    document.fonts.ready.then(() => {
      if (container.isConnected) renderBookletPages();
    });
  }
}

function paginateQuestionRanges(container, badgeCode, columnClass) {
  const stagingPage = document.createElement('div');
  stagingPage.className = 'booklet-page booklet-page-measuring';
  stagingPage.setAttribute('aria-hidden', 'true');
  stagingPage.innerHTML = renderPageHtml({ questionsHtml: '', miniKeyHtml: '' }, badgeCode, columnClass, 1, 1);
  stagingPage.querySelectorAll('[id]').forEach(element => element.removeAttribute('id'));
  stagingPage.querySelector('.btn-page-key-toggle')?.removeAttribute('onclick');
  container.appendChild(stagingPage);

  const questionBody = stagingPage.querySelector('.page-columns-body');
  const ranges = [];
  let pageStart = 0;

  try {
    state.bookletQuestions.forEach((question, index) => {
      const questionHtml = renderQuestionCardHtml(question, index + 1);
      questionBody.insertAdjacentHTML('beforeend', questionHtml);
      const hasPreviousQuestion = index > pageStart;
      const bodyBounds = questionBody.getBoundingClientRect();
      const questionBounds = questionBody.lastElementChild.getBoundingClientRect();
      const isOverflowing = questionBounds.bottom > bodyBounds.bottom + 1
        || questionBounds.right > bodyBounds.right + 1;

      if (hasPreviousQuestion && isOverflowing) {
        ranges.push({ start: pageStart, end: index });
        pageStart = index;
        questionBody.replaceChildren();
        questionBody.insertAdjacentHTML('beforeend', questionHtml);
      }
    });
  } finally {
    stagingPage.remove();
  }

  ranges.push({ start: pageStart, end: state.bookletQuestions.length });
  return ranges;
}

function renderQuestionChunkHtml(startIdx, endIdx) {
  let questionsHtml = '';
  let miniKeyHtml = '';

  state.bookletQuestions.slice(startIdx, endIdx).forEach((q, idxInChunk) => {
    const globalIdx = startIdx + idxInChunk + 1;
    questionsHtml += renderQuestionCardHtml(q, globalIdx);

    if (q.sekilli) {
      miniKeyHtml += `
        <div class="mini-key-cell" style="opacity:0.55;" title="Şekilli Soru - Yakında">
          <span>${globalIdx}.</span> <strong style="font-size:9.5px; color:#b45309;">YAKINDA</strong>
        </div>
      `;
    } else {
      miniKeyHtml += `
        <div class="mini-key-cell">
          <span>${globalIdx}.</span> <strong>${q.dogru_cevap}</strong>
        </div>
      `;
    }
  });

  return { questionsHtml, miniKeyHtml };
}

function renderPageHtml(pageChunk, badgeCode, columnClass, pageNum, totalPages) {
  const lucidePageEyeSvg = `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2.062 12.348a1 1 0 0 1 0-.696 10.75 10.75 0 0 1 19.876 0 1 1 0 0 1 0-.696 10.75 10.75 0 0 1-19.876 0"/><circle cx="12" cy="12" r="3"/></svg>`;

  const hasTdeInPage = state.bookletQuestions.some(q => (state.currentSubject === 'TDE') || (q.ders && q.ders.includes('TÜRK DİLİ')));
  let pageLegendHtml = '';
  if (hasTdeInPage) {
    pageLegendHtml = `
      <div class="page-xray-footer-legend">
        <span class="xray-legend-item"><span class="xray-legend-line" style="background:#2563eb;"></span><strong>Özne</strong></span>
        <span class="xray-legend-item"><span class="xray-legend-line" style="background:#e11d48;"></span><strong>Yüklem</strong></span>
        <span class="xray-legend-item"><span class="xray-legend-line" style="background:#059669;"></span><strong>Nesne</strong></span>
        <span class="xray-legend-item"><span class="xray-legend-line" style="background:#d97706;"></span><strong>Tümleç / Zarf</strong></span>
      </div>
    `;
  }

  return `
    <div class="booklet-page" id="page_${pageNum}">
      <div class="page-header-band">
        <div class="page-header-left">
          <span class="institution-name">T.C. MİLLÎ EĞİTİM BAKANLIĞI • AÇIK ÖĞRETİM LİSESİ</span>
          <span class="exam-name-title">${escapeHtml(state.selectedTopicKey || (state.selectedCourses.size > 1 ? 'ORTAK KAZANIMLAR KESİŞİM TESTİ' : 'DÖNEM ÇIKMIŞ SINAV SORULARI'))}</span>
        </div>
        <div class="page-header-right">
          <span class="page-badge-code">${badgeCode} • SAYFA ${pageNum}</span>
        </div>
      </div>

      <div class="page-columns-body ${columnClass}" id="bookletQuestionBody_${pageNum}">
        ${pageChunk.questionsHtml}
      </div>

      <div>
        ${pageLegendHtml}
        <div class="page-bottom-answer-strip" id="pageBottomKey_${pageNum}">
          <span style="font-weight:800; font-size:10px; margin-right:4px;">🔑 SAYFA ${pageNum} CEVAPLARI:</span>
          ${pageChunk.miniKeyHtml}
        </div>
        <div class="page-footer-band">
          <button class="btn-page-key-toggle" onclick="togglePageKey(${pageNum})" title="Sayfa Cevaplarını Göster / Gizle">
            ${lucidePageEyeSvg}
            <span id="lblPageKey_${pageNum}">Cevaplar</span>
          </button>
          <span class="page-num-pill">— SAYFA ${pageNum} / ${totalPages} —</span>
          <span>AÖL KESİŞİM REHBERİ</span>
        </div>
      </div>
    </div>
  `;
}
