import { state, notifyStateChange } from '../../app/state.ts';
import { getCardActionElements, getCardStem, getQuestionCards } from '../booklet/card-query.ts';
import { isQuestionMealActive, renderInterlinearText } from './interlinear.ts';
import { enrichEnglishVocab } from './vocabulary.js';

export const stemRevertTimers = {};

function getTranslationButtons(qid) {
  const cards = getQuestionCards(qid);
  return {
    cards,
    btnTRs: cards.flatMap(c => getCardActionElements(c, 'toggle-question-translation', '[data-lang="tr"]')),
    btnARs: cards.flatMap(c => getCardActionElements(c, 'toggle-question-translation', '[data-lang="ar"]')),
  };
}

export function toggleQuestionTranslation(qid, lang, event) {
  if (event) {
    event.stopPropagation();
    event.preventDefault();
  }

  const { cards, btnTRs, btnARs } = getTranslationButtons(qid);
  const stems = cards.map(card => getCardStem(card)).filter(Boolean);
  if (stems.length === 0) return;

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
    const active = getTranslationButtons(qid);
    const activeStems = active.cards.map(card => getCardStem(card)).filter(Boolean);
    activeStems.forEach(stemEl => {
      if (lang === 'ar') {
        stemEl.classList.add('stem-ar-text');
      } else {
        stemEl.classList.remove('stem-ar-text');
      }
      stemEl.setAttribute('data-trans-lang', lang);
      stemEl.textContent = translatedText;
      stemEl.classList.remove('stem-fading');
    });

    active.btnTRs.forEach(btn => btn.classList.toggle('active', lang === 'tr'));
    active.btnARs.forEach(btn => btn.classList.toggle('active', lang === 'ar'));

    // Otomatik geri dönme: 7 saniye sonra sessizce ve pürüzsüzce aslına döner (ekranda sayaç yazısı olmadan)
    stemRevertTimers[qid] = setTimeout(() => {
      const latest = getTranslationButtons(qid);
      const latestStems = latest.cards.map(card => getCardStem(card)).filter(Boolean);
      latestStems.forEach(stemEl => revertStemToOriginal(stemEl, q, qid, latest.btnTRs, latest.btnARs));
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
    const mealActive = isQuestionMealActive(qid);
    const rawHtml = q.soru_xray || q.soru;
    stemEl.classList.remove('stem-ar-text');
    stemEl.removeAttribute('data-trans-lang');
    stemEl.innerHTML = mealActive
      ? renderInterlinearText(rawHtml)
      : enrichEnglishVocab(rawHtml);

    const card = stemEl.closest('.booklet-question');
    if (card) {
      card.classList.toggle('has-interlinear', mealActive);
      notifyStateChange('booklet:rendered', { cards: [card] });
    }

    const trList = btnTRs ? Array.from(btnTRs) : [];
    const arList = btnARs ? Array.from(btnARs) : [];
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
  const cards = getQuestionCards(qid);
  if (cards.length === 0) return;

  const isHidden = cards[0].classList.contains('no-xray-underlines');
  cards.forEach(card => {
    card.classList.toggle('no-xray-underlines', !isHidden);
    getCardActionElements(card, 'toggle-xray').forEach(btn => {
      btn.classList.toggle('active', isHidden);
      btn.title = !isHidden ? 'Cümle Röntgenini Göster' : 'Cümle Röntgenini Gizle (Özne • Yüklem • Nesne)';
    });
  });
}

export function toggleTrapExplanation(qid, event) {
  if (event) {
    event.stopPropagation();
    event.preventDefault();
  }
  const cards = getQuestionCards(qid);
  const banners = cards.flatMap(card => Array.from(card.querySelectorAll('[data-role="trap-banner"]')));
  if (banners.length === 0) return;

  const isOpen = (banners[0].style.display !== 'none');
  banners.forEach(b => { b.style.display = isOpen ? 'none' : 'block'; });
  cards.forEach(card => {
    getCardActionElements(card, 'toggle-trap').forEach(btn => btn.classList.toggle('active', !isOpen));
  });
}
