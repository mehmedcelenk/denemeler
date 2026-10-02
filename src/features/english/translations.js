import { state } from '../../app/state.ts';
import { enrichEnglishVocab } from './vocabulary.js';

export const stemRevertTimers = {};

export function toggleQuestionTranslation(qid, lang, event) {
  if (event) {
    event.stopPropagation();
    event.preventDefault();
  }

  const stems = document.querySelectorAll(`#stem_${qid}`);
  if (stems.length === 0) return;

  const btnTRs = document.querySelectorAll(`#btnTransTR_${qid}`);
  const btnARs = document.querySelectorAll(`#btnTransAR_${qid}`);

  const q = state.allData.find(item => item.id === qid) || state.bookletQuestions.find(item => item.id === qid);
  if (!q) return;

  const currentLang = stems[0].getAttribute('data-trans-lang');
  if (currentLang === lang) {
    stems.forEach(stemEl => revertStemToOriginal(stemEl, q, qid, btnTRs, btnARs));
    return;
  }

  let translatedText = '';
  if (lang === 'tr') {
    translatedText = q.soru_tr || '';
  } else if (lang === 'ar') {
    translatedText = q.soru_ar || '';
  }
  if (!translatedText) return;

  if (stemRevertTimers[qid]) {
    clearTimeout(stemRevertTimers[qid]);
    delete stemRevertTimers[qid];
  }

  // Smooth cross-fade
  stems.forEach(stemEl => stemEl.classList.add('stem-fading'));
  setTimeout(() => {
    stems.forEach(stemEl => {
      if (lang === 'ar') {
        stemEl.classList.add('stem-ar-text');
      } else {
        stemEl.classList.remove('stem-ar-text');
      }
      stemEl.setAttribute('data-trans-lang', lang);
      stemEl.textContent = translatedText;
      stemEl.classList.remove('stem-fading');
    });

    btnTRs.forEach(btn => btn.classList.toggle('active', lang === 'tr'));
    btnARs.forEach(btn => btn.classList.toggle('active', lang === 'ar'));

    // Otomatik geri dönme: 7 saniye sonra sessizce ve pürüzsüzce aslına döner (ekranda sayaç yazısı olmadan)
    stemRevertTimers[qid] = setTimeout(() => {
      stems.forEach(stemEl => revertStemToOriginal(stemEl, q, qid, btnTRs, btnARs));
    }, 7000);
  }, 180);
}

export function revertStemToOriginal(stemEl, q, qid, btnTRs, btnARs) {
  if (stemRevertTimers[qid]) {
    clearTimeout(stemRevertTimers[qid]);
    delete stemRevertTimers[qid];
  }
  stemEl.classList.add('stem-fading');
  setTimeout(() => {
    stemEl.classList.remove('stem-ar-text');
    stemEl.removeAttribute('data-trans-lang');
    stemEl.innerHTML = enrichEnglishVocab(q.soru_xray || q.soru);

    const trList = btnTRs instanceof NodeList ? btnTRs : (btnTRs ? [btnTRs] : []);
    const arList = btnARs instanceof NodeList ? btnARs : (btnARs ? [btnARs] : []);
    trList.forEach(btn => btn.classList.remove('active'));
    arList.forEach(btn => btn.classList.remove('active'));

    stemEl.classList.remove('stem-fading');
  }, 180);
}

export function toggleCümleRöntgeni(qid, event) {
  if (event) {
    event.stopPropagation();
    event.preventDefault();
  }
  const cards = document.querySelectorAll(`#bq_${qid}`);
  const btns = document.querySelectorAll(`#btnXray_${qid}`);
  if (cards.length === 0) return;

  const isHidden = cards[0].classList.contains('no-xray-underlines');
  cards.forEach(card => card.classList.toggle('no-xray-underlines', !isHidden));
  btns.forEach(btn => {
    btn.classList.toggle('active', isHidden);
    btn.title = !isHidden ? "Cümle Röntgenini Göster" : "Cümle Röntgenini Gizle (Özne • Yüklem • Nesne)";
  });
}

export function toggleTrapExplanation(qid, event) {
  if (event) {
    event.stopPropagation();
    event.preventDefault();
  }
  const banners = document.querySelectorAll(`#trap_${qid}`);
  const btns = document.querySelectorAll(`#btnTrap_${qid}`);
  if (banners.length === 0) return;

  const isOpen = (banners[0].style.display !== 'none');
  banners.forEach(b => { b.style.display = isOpen ? 'none' : 'block'; });
  btns.forEach(btn => btn.classList.toggle('active', !isOpen));
}
