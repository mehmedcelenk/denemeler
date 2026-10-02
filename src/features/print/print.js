import { state } from '../../app/state.ts';
import { toggleConsoleMenu } from '../appearance/layout.js';

export function openPdfDialog() {
  toggleConsoleMenu();
  document.getElementById('pdfDialogOverlay').classList.add('open');
}

export function closePdfDialog() {
  document.getElementById('pdfDialogOverlay').classList.remove('open');
}

export function executePdfPrint() {
  const loc = document.querySelector('input[name="pdfKeyLocation"]:checked').value;
  closePdfDialog();

  const strips = document.querySelectorAll('.page-bottom-answer-strip');
  if (loc === 'bottom') {
    strips.forEach(s => s.style.display = 'flex');
  } else {
    strips.forEach(s => s.style.display = 'none');
  }

  const existingSeparate = document.getElementById('separateAnswerPage');
  if (existingSeparate) existingSeparate.remove();

  if (loc === 'separate') {
    const container = document.getElementById('bookletPagesContainer');
    const ansPage = document.createElement('div');
    ansPage.className = 'booklet-page';
    ansPage.id = 'separateAnswerPage';

    let gridCells = '';
    state.bookletQuestions.forEach((q, idx) => {
      gridCells += `
        <div class="mini-key-cell" style="padding:6px 10px; font-size:13px;">
          <span>${idx + 1}.</span> <strong style="color:var(--brand-accent);">${q.dogru_cevap}</strong>
        </div>
      `;
    });

    ansPage.innerHTML = `
      <div class="page-header-band">
        <span class="institution-name">T.C. MİLLÎ EĞİTİM BAKANLIĞI • AÖL KESİŞİM TESTİ</span>
        <span class="exam-name-title">🔑 CEVAP ANAHTARI SAYFASI</span>
      </div>
      <div style="display:grid; grid-template-columns:repeat(auto-fill, minmax(70px, 1fr)); gap:8px; padding:20px 0;">
        ${gridCells}
      </div>
      <div class="page-footer-band">
        <span>RESMÎ CEVAP ANAHTARI</span>
        <span class="page-num-pill">— SON SAYFA —</span>
        <span>AÖL KESİŞİM REHBERİ</span>
      </div>
    `;
    container.appendChild(ansPage);
  }

  window.print();

  setTimeout(() => {
    const sep = document.getElementById('separateAnswerPage');
    if (sep) sep.remove();
  }, 1000);
}
