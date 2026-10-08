import { state } from '../../app/state.ts';

export let ttsVoiceGender = 'male';

try {
  ttsVoiceGender = localStorage.getItem('aol_tts_gender') || 'male';
} catch (e) {}

if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
  window.speechSynthesis.onvoiceschanged = () => {
    window.speechSynthesis.getVoices();
  };
}

export function setTTSVoiceGender(gender) {
  ttsVoiceGender = gender;
  try {
    localStorage.setItem('aol_tts_gender', gender);
  } catch (e) {}
  updateTTSGenderUI();
  stopAllAudio();
}

export function updateTTSGenderUI() {
  const btnMale = document.getElementById('btnTTSVoiceMale');
  const btnFemale = document.getElementById('btnTTSVoiceFemale');
  if (btnMale && btnFemale) {
    btnMale.classList.toggle('active', ttsVoiceGender === 'male');
    btnFemale.classList.toggle('active', ttsVoiceGender === 'female');
  }
  document.querySelectorAll('.btn-tts-icon:not(.tts-playing)').forEach(btn => {
    const genderLabel = (ttsVoiceGender === 'male') ? 'Erkek Sesi' : 'Kadın Sesi';
    btn.title = `Soruyu Seslendir (${genderLabel} • Yavaş & Net) [Sağ Tık: Sesi Değiştir]`;
  });
  updateTTSVoiceControlVisibility();
}

export function updateTTSVoiceControlVisibility() {
  if (typeof document === 'undefined') return;
  const row = document.getElementById('ttsVoiceControlGroup');
  if (!row) return;

  const isEnglishSubject = state.currentSubject === 'ING';
  const hasEnglishQuestions = state.bookletQuestions.some(q => q.ders && q.ders.includes('İNGİLİZCE'));
  const isVisible = isEnglishSubject || hasEnglishQuestions;

  row.style.display = isVisible ? 'flex' : 'none';
}

export function toggleTTSVoiceGenderQuick(event) {
  if (event) {
    event.preventDefault();
    event.stopPropagation();
  }
  const next = (ttsVoiceGender === 'male') ? 'female' : 'male';
  setTTSVoiceGender(next);

  const existingBubble = document.getElementById('activeVocabBubble');
  if (existingBubble) existingBubble.remove();

  const bubble = document.createElement('div');
  bubble.id = 'activeVocabBubble';
  bubble.className = 'vocab-bubble';
  bubble.innerHTML = `<span>Ses: <strong>${next === 'male' ? '👨🏽 Erkek Sesi' : '🧕🏽 Kadın Sesi'}</strong></span>`;
  document.body.appendChild(bubble);

  const mouseX = event ? (event.pageX || window.innerWidth / 2) : window.innerWidth / 2;
  const mouseY = event ? (event.pageY || window.innerHeight / 2) : window.innerHeight / 2;
  bubble.style.left = mouseX + 'px';
  bubble.style.top = (mouseY - 18) + 'px';

  setTimeout(() => {
    bubble.style.animation = 'vocabPopOut 0.2s cubic-bezier(0.16, 1, 0.3, 1) forwards';
    setTimeout(() => {
      if (bubble.parentNode) bubble.remove();
    }, 180);
  }, 1400);
}

export function getEnglishTTSVoice(gender = ttsVoiceGender) {
  if (!('speechSynthesis' in window)) return null;
  const voices = window.speechSynthesis.getVoices();
  if (!voices || voices.length === 0) return null;

  const enVoices = voices.filter(v => v.lang && (v.lang === 'en-US' || v.lang === 'en-GB' || v.lang.startsWith('en')));
  if (enVoices.length === 0) return voices[0] || null;

  if (gender === 'male') {
    const maleKeywords = ['david', 'guy', 'ryan', 'alex', 'mark', 'george', 'google uk english male', 'daniel', 'oliver', 'fred', 'arthur', 'james', 'male'];
    for (const kw of maleKeywords) {
      const found = enVoices.find(v => v.name.toLowerCase().includes(kw));
      if (found) return found;
    }
    const femaleKeywords = ['female', 'samantha', 'victoria', 'zira', 'jenny', 'aria', 'karen', 'moira', 'fiona', 'hazel', 'susan', 'google us english', 'google uk english female'];
    const nonFemale = enVoices.find(v => !femaleKeywords.some(f => v.name.toLowerCase().includes(f)));
    if (nonFemale) return nonFemale;
  } else {
    const femaleKeywords = ['google us english', 'google uk english female', 'samantha', 'zira', 'jenny', 'aria', 'victoria', 'female'];
    for (const kw of femaleKeywords) {
      const found = enVoices.find(v => v.name.toLowerCase().includes(kw));
      if (found) return found;
    }
  }

  return enVoices[0];
}

export let currentAudioObj = null;

export let currentSpeakingQid = null;

export function stopAllAudio() {
  if (currentAudioObj) {
    try {
      currentAudioObj.pause();
      currentAudioObj.currentTime = 0;
    } catch (e) {}
    currentAudioObj = null;
  }
  if ('speechSynthesis' in window) {
    try {
      window.speechSynthesis.cancel();
    } catch (e) {}
  }
  if (currentSpeakingQid !== null) {
    updateTTSButtonState(currentSpeakingQid, false);
    currentSpeakingQid = null;
  }
}

export function toggleSpeakQuestion(qid, event) {
  if (event) {
    event.stopPropagation();
    event.preventDefault();
  }

  if (currentSpeakingQid === qid) {
    stopAllAudio();
    return;
  }

  stopAllAudio();

  const q = state.allData.find(item => item.id === qid) || state.bookletQuestions.find(item => item.id === qid);
  if (!q) return;

  currentSpeakingQid = qid;
  updateTTSButtonState(qid, true);

  // 1. Önce Stüdyo Kalitesindeki Neural MP3 ses dosyasını dene (audio/tts/gender/qid.mp3)
  const gender = (ttsVoiceGender === 'female') ? 'female' : 'male';
  const audioUrl = `audio/tts/${gender}/${qid}.mp3`;

  const audio = new Audio();
  audio.src = audioUrl;
  currentAudioObj = audio;

  audio.onended = () => {
    updateTTSButtonState(qid, false);
    if (currentSpeakingQid === qid) currentSpeakingQid = null;
    currentAudioObj = null;
  };

  audio.onerror = () => {
    currentAudioObj = null;
    playBrowserTTS(q, qid);
  };

  const playPromise = audio.play();
  if (playPromise !== undefined) {
    playPromise.catch(_err => {
      currentAudioObj = null;
      playBrowserTTS(q, qid);
    });
  }
}

export function playBrowserTTS(q, qid) {
  if (!('speechSynthesis' in window)) {
    updateTTSButtonState(qid, false);
    currentSpeakingQid = null;
    return;
  }

  try {
    if (window.speechSynthesis.paused) {
      window.speechSynthesis.resume();
    }
    window.speechSynthesis.cancel();
  } catch (e) {}

  let textToSpeak = (q.soru || '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/(?:[-\u2013\u2014_]\s*)(2,)/g, ' blank ')
    .replace(/(?:Bu metne|Bu parçaya|Bu diyaloğa|Metne|Diyaloğa|Parçaya|Aşağıdakilerden|Cümlesini|Boşluğa)[\s\S]*$/i, '')
    .replace(/\s+\?/g, '?')
    .replace(/\s+\./g, '.')
    .replace(/\s+,/g, ',')
    .replace(/\s+/g, ' ')
    .trim();

  if (!textToSpeak) {
    textToSpeak = (q.soru || '').replace(/<[^>]+>/g, ' ').replace(/(?:[-\u2013\u2014_]\s*)(2,)/g, ' blank ');
  }

  const isMale = (ttsVoiceGender === 'male');
  const utterance = new SpeechSynthesisUtterance(textToSpeak);
  utterance.lang = 'en-US';
  utterance.rate = 0.82;
  utterance.pitch = isMale ? 0.92 : 1.02;

  const selectedVoice = getEnglishTTSVoice(ttsVoiceGender);
  if (selectedVoice) {
    utterance.voice = selectedVoice;
    utterance.lang = selectedVoice.lang || utterance.lang;
  }

  utterance.onend = () => {
    updateTTSButtonState(qid, false);
    if (currentSpeakingQid === qid) currentSpeakingQid = null;
  };

  utterance.onerror = (_e) => {
    updateTTSButtonState(qid, false);
    if (currentSpeakingQid === qid) currentSpeakingQid = null;
  };

  window.speechSynthesis.speak(utterance);
}

export function speakSingleOption(qid, letter, event) {
  if (event) {
    event.stopPropagation();
    event.preventDefault();
  }
  stopAllAudio();

  const q = state.allData.find(item => item.id === qid) || state.bookletQuestions.find(item => item.id === qid);
  if (!q || !q.secenekler) return;
  const text = q.secenekler[letter] || '';
  if (!text.trim()) return;

  if (!('speechSynthesis' in window)) return;

  try {
    if (window.speechSynthesis.paused) {
      window.speechSynthesis.resume();
    }
    window.speechSynthesis.cancel();
  } catch (e) {}

  const cleanText = text.replace(/<[^>]+>/g, ' ').replace(/(?:[-\u2013\u2014_]\s*)(2,)/g, ' blank ').trim();
  const isMale = (ttsVoiceGender === 'male');
  const utterance = new SpeechSynthesisUtterance(cleanText);
  utterance.lang = 'en-US';
  utterance.rate = 0.82;
  utterance.pitch = isMale ? 0.92 : 1.02;

  const selectedVoice = getEnglishTTSVoice(ttsVoiceGender);
  if (selectedVoice) {
    utterance.voice = selectedVoice;
    utterance.lang = selectedVoice.lang || utterance.lang;
  }

  window.speechSynthesis.speak(utterance);
}

export function updateTTSButtonState(qid, isSpeaking) {
  const btn = document.getElementById(`btnTTS_${qid}`);
  if (!btn) return;
  if (isSpeaking) {
    btn.classList.add('tts-playing');
    btn.innerHTML = `<svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><rect x="4" y="4" width="16" height="16" rx="2.5"/></svg>`;
    btn.title = "Seslendirmeyi Durdur (Stop)";
  } else {
    btn.classList.remove('tts-playing');
    btn.innerHTML = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M15.54 8.46a5 5 0 0 1 0 7.07"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14"/></svg>`;
    const genderLabel = (ttsVoiceGender === 'male') ? 'Erkek Sesi' : 'Kadın Sesi';
    btn.title = `Soruyu Seslendir (${genderLabel} • Yavaş & Net) [Sağ Tık: Sesi Değiştir]`;
  }
}
