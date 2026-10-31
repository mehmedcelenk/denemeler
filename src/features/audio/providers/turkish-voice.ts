/**
 * Tarayıcıdaki sesler arasından en doğal Türkçe sesi cinsiyete göre seçer.
 */
export function selectBestTurkishVoice(voices: SpeechSynthesisVoice[], gender?: 'female' | 'male'): SpeechSynthesisVoice | null {
  if (!voices || voices.length === 0) return null;

  const trVoices = voices.filter(v => {
    const lang = (v.lang || '').toLowerCase();
    return lang.startsWith('tr') || lang.includes('tr-tr') || lang.includes('tr_tr');
  });

  if (trVoices.length === 0) return null;

  const scoreVoice = (v: SpeechSynthesisVoice): number => {
    const name = (v.name || '').toLowerCase();
    let score = 10;
    if (name.includes('natural') || name.includes('neural')) score += 50;
    if (name.includes('online')) score += 30;
    if (name.includes('google')) score += 25;
    if (name.includes('premium') || name.includes('enhanced')) score += 20;

    const isM = (t: string) => name.includes(t);
    if (gender === 'male') {
      if (['ahmet', 'tolga', 'cem', 'male', 'erkek'].some(isM)) score += 40;
      if (['emel', 'yelda', 'filiz', 'female', 'kadın'].some(isM)) score -= 30;
    } else if (gender === 'female') {
      if (['emel', 'yelda', 'filiz', 'female', 'kadın'].some(isM)) score += 40;
      if (['ahmet', 'tolga', 'cem', 'male', 'erkek'].some(isM)) score -= 30;
    }

    if (v.default) score += 2;
    return score;
  };

  return trVoices.slice().sort((a, b) => scoreVoice(b) - scoreVoice(a))[0] || trVoices[0];
}
