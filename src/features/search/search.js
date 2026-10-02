import { state } from '../../app/state.ts';
import { loadAllSubjectData } from '../../data/questions.js';
import { SUBJECTS, getShortCourseName, matchesSubject } from '../../data/subjects.js';
import { trNormalize } from '../../shared/search.ts';
import { renderDrawerTopics } from '../subjects/topics.js';
import { updateTopBadge } from '../booklet/selection.js';
import { renderBookletPages } from '../booklet/render.js';
import { closeSubjectDrawer } from '../subjects/drawer-visibility.js';
import { escapeHtml } from '../../shared/escape.ts';

export function highlightKeyword(text, term) {
  if (!text || !term) return escapeHtml(text || '');
  const str = String(text);
  const nText = trNormalize(str);
  const nTerm = trNormalize(term);
  const idx = nText.indexOf(nTerm);
  if (idx !== -1) {
    const before = str.substring(0, idx);
    const match = str.substring(idx, idx + term.length);
    const after = str.substring(idx + term.length);
    return escapeHtml(before) + '<mark class="search-highlight">' + escapeHtml(match) + '</mark>' + escapeHtml(after);
  }
  const tokens = nTerm.split(/\s+/).filter(t => t.length >= 3 && t !== 'ile' && t !== 'icin');
  if (tokens.length > 1) {
    let result = escapeHtml(str);
    tokens.forEach(tok => {
      const reg = new RegExp(`(${tok})`, 'gi');
      result = result.replace(reg, '<mark class="search-highlight">$1</mark>');
    });
    return result;
  }
  return escapeHtml(str);
}

let searchVersion = 0;

export async function handleDrawerSearch(val) {
  const version = ++searchVersion;
  const subject = state.currentSubject;
  const term = val.trim();
  const isCurrent = () => version === searchVersion
    && state.currentSubject === subject && state.drawerSearchTerm === term;
  state.drawerSearchTerm = term;
  state.currentSearchResults = [];
  const clearBtn = document.getElementById('drawerSearchClearBtn');
  if (clearBtn) clearBtn.style.display = state.drawerSearchTerm ? 'flex' : 'none';

  const resultsContainer = document.getElementById('drawerSearchResultsContainer');
  const normalContainer = document.getElementById('drawerNormalSelectorContainer');

  if (state.drawerSearchTerm) {
    // Branş seçimi kaldırıldıysa arama tüm branşları kapsar; bu durumda
    // eksik branşları yalnızca arama gerektiğinde indir.
    const list = document.getElementById('drawerSearchResultsList');
    const button = document.getElementById('btnLoadAllSearchResults');
    if (button) button.disabled = true;
    if (resultsContainer) resultsContainer.style.display = 'block';
    if (normalContainer) normalContainer.style.display = 'none';
    if (list) list.textContent = 'Sorular yükleniyor…';
    try {
      if (!subject) await loadAllSubjectData();
    } catch {
      if (isCurrent() && list) list.textContent = 'Sorular yüklenemedi. Bağlantınızı kontrol edip aramayı yeniden deneyin.';
      return;
    }
    if (!isCurrent()) return;
    if (resultsContainer) resultsContainer.style.display = 'block';
    if (normalContainer) normalContainer.style.display = 'none';
    renderSearchResults();
  } else {
    if (resultsContainer) resultsContainer.style.display = 'none';
    if (normalContainer) normalContainer.style.display = 'block';
    renderDrawerTopics();
  }
}

export function clearDrawerSearch() {
  searchVersion++;
  state.currentSearchResults = [];
  state.drawerSearchTerm = '';
  const input = document.getElementById('drawerSearchInput');
  if (input) {
    input.value = '';
    input.focus();
  }
  const clearBtn = document.getElementById('drawerSearchClearBtn');
  if (clearBtn) clearBtn.style.display = 'none';

  const resultsContainer = document.getElementById('drawerSearchResultsContainer');
  const normalContainer = document.getElementById('drawerNormalSelectorContainer');
  if (resultsContainer) resultsContainer.style.display = 'none';
  if (normalContainer) normalContainer.style.display = 'block';

  renderDrawerTopics();
}

export function renderSearchResults() {
  const listEl = document.getElementById('drawerSearchResultsList');
  const headerEl = document.getElementById('lblSearchResultsHeader');
  const btnAll = document.getElementById('btnLoadAllSearchResults');
  if (!listEl) return;

  const nTerm = trNormalize(state.drawerSearchTerm);
  const matched = [];

  state.allData.forEach(q => {
    // Kişi bir ders seçmişse sadece o derste ve seçili kademelerde ara, seçmemişse külli ara
    if (state.currentSubject) {
      if (!matchesSubject(q, state.currentSubject)) return;
      if (state.selectedCourses.size > 0 && !state.selectedCourses.has(q.ders)) return;
    }

    const stemNorm = trNormalize(q.soru || '');
    const topicNorm = trNormalize(`${q.ana_konu || ''} ${q.alt_konu || ''}`);
    const tokens = nTerm.split(/\s+/).filter(t => t.length >= 3 && t !== 'ile' && t !== 'icin');
    const matchedTokens = tokens.length > 1 && tokens.every(tok => stemNorm.includes(tok) || topicNorm.includes(tok));
    let matchedInStem = stemNorm.includes(nTerm) || topicNorm.includes(nTerm) || String(q.id) === nTerm || matchedTokens;
    let matchedOption = null;

    if (q.secenekler) {
      for (let optKey in q.secenekler) {
        const optVal = q.secenekler[optKey] || '';
        const optNorm = trNormalize(optVal);
        if (optNorm.includes(nTerm) || (tokens.length > 1 && tokens.every(tok => optNorm.includes(tok)))) {
          matchedOption = { key: optKey, text: optVal };
          break;
        }
      }
    }

    if (matchedInStem || matchedOption) {
      matched.push({ q: q, matchedOption: matchedOption });
    }
  });

  state.currentSearchResults = matched;

  let scopeDesc = 'Tüm Branşlar';
  if (state.currentSubject) {
    const sObj = SUBJECTS.find(s => s.id === state.currentSubject);
    scopeDesc = sObj ? sObj.name : state.currentSubject;
  }

  if (headerEl) {
    headerEl.innerHTML = `Arama: <strong>"${escapeHtml(state.drawerSearchTerm)}"</strong> <span style="font-size:11px; opacity:0.8; font-weight:normal;">[${scopeDesc}]</span> (${matched.length} Soru)`;
  }
  if (btnAll) {
    btnAll.disabled = matched.length === 0;
    btnAll.textContent = `Arama Testini Başlat (${matched.length} Soru) →`;
  }

  if (matched.length === 0) {
    listEl.innerHTML = `
      <div style="padding:22px; text-align:center; color:var(--paper-text-muted); font-size:12.5px;">
        <strong>"${escapeHtml(state.drawerSearchTerm)}"</strong> ile eşleşen soru veya şık bulunamadı.<br>
        <span style="font-size:11px; opacity:0.8;">Farklı bir arama terimi deneyebilir veya ders seçimini değiştirebilirsiniz.</span>
      </div>
    `;
    return;
  }

  let html = '';
  const displaySlice = matched.slice(0, 50);
  displaySlice.forEach(({ q, matchedOption }) => {
    const snippet = (q.soru || '').replace(/\s+/g, ' ').trim();
    const shortSnippet = snippet.length > 130 ? snippet.substring(0, 128) + '...' : snippet;
    
    let optHtml = '';
    if (matchedOption) {
      optHtml = `
        <div class="result-matched-choice">
          💡 Şıkta Geçiyor: <strong>${matchedOption.key})</strong> ${highlightKeyword(matchedOption.text, state.drawerSearchTerm)}
        </div>
      `;
    }

    const ak = q.ana_konu || '';
    const sub = q.alt_konu || '';
    const topicLabel = (ak && sub && ak !== sub)
      ? `<span class="topic-ak">${escapeHtml(ak)}</span> <span class="topic-slash">/</span> <span class="topic-sub">${escapeHtml(sub)}</span>`
      : `<span class="topic-sub">${escapeHtml(sub || ak || 'Genel')}</span>`;

    const soonPill = q.sekilli ? '<span class="q-soon-badge" style="font-size:9.5px; padding:1px 6px; margin-left:2px;">🔒 Yakında</span>' : '';

    html += `
      <div class="drawer-search-result-card" onclick="loadSingleSearchQuestion(${q.id})">
        <div class="result-card-header">
          <span class="result-badge-course">${escapeHtml(getShortCourseName(q.ders))}</span>
          ${soonPill}
          <span class="result-badge-topic">${topicLabel}</span>
          <span class="result-badge-point">+${q.puan || 0} Puan</span>
        </div>
        <div class="result-card-stem">
          ${highlightKeyword(shortSnippet, state.drawerSearchTerm)}
        </div>
        ${optHtml}
      </div>
    `;
  });

  if (matched.length > 50) {
    html += `<div style="text-align:center; padding:10px; font-size:11.5px; color:var(--paper-text-muted); font-weight:600;">... ve ${matched.length - 50} soru daha. Tümünü kitapçığa aktarmak için "Arama Testini Başlat" butonuna tıklayınız.</div>`;
  }

  listEl.innerHTML = html;
}

export function loadAllSearchResultsToBooklet() {
  if (state.currentSearchResults.length === 0) return;
  state.bookletQuestions = state.currentSearchResults.map(m => m.q);
  state.activeSearchFilter = state.drawerSearchTerm;
  closeSubjectDrawer();
  updateTopBadge();
  renderBookletPages();
}

export function loadSingleSearchQuestion(qid) {
  const targetQ = state.allData.find(q => q.id === qid);
  if (!targetQ) return;
  
  state.bookletQuestions = state.currentSearchResults.map(m => m.q);
  if (state.bookletQuestions.length === 0) {
    state.bookletQuestions = [targetQ];
  }
  state.activeSearchFilter = state.drawerSearchTerm;
  closeSubjectDrawer();
  updateTopBadge();
  renderBookletPages(qid);

  setTimeout(() => {
    const card = document.getElementById(`bq_${qid}`);
    if (card) {
      card.scrollIntoView({ behavior: 'smooth', block: 'center' });
      card.style.outline = '3px solid var(--brand-accent)';
      setTimeout(() => { card.style.outline = 'none'; }, 2500);
    }
  }, 180);
}
