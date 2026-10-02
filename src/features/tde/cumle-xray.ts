import { MEB_CUMLE_XRAY_MAP } from './cumle-xray-data.ts';

const COMPOUND_VERBS = new Set([
  'ortaya koydu',
  'ortaya cikar',
  'ortaya çıkar',
  'adini vermistir',
  'adını vermiştir',
  'yer alir',
  'yer alır',
  'yer almaktadir',
  'yer almaktadır',
  'kabul edilir',
  'tercih edilir',
  'taniklik etmistir',
  'tanıklık etmiştir',
  'getirilebilir',
  'bilinmektedir'
]);

/**
 * Tek bir Türkçe soru veya yargı cümlesini doğal olarak Özne, Yüklem, Nesne ve Tümleç ögelerine ayırıp
 * İngilizce Röntgen ile birebir aynı alt çizgi sınıflarıyla (.xray-sub, .xray-verb, .xray-obj, .xray-adv) sarmalar.
 */
export function parseTurkishSentenceElements(sent: string): string {
  sent = sent.trim();
  if (!sent) return '';

  // 1. MEB Soru Kökü Kalıpları (Aşağıdakilerden hangisi..., Hangisinde...)
  const qMatch = sent.match(/^(.*?)\b(aşağıdaki(?:ler)?(?:in|den|dan)?(?:\s+[a-zçğıöşüA-ZÇĞİÖŞÜ]+){0,3}\s+hangisi(?:nde|ne|ni|den)?|hangisi(?:nde|ne|ni|den)?)\b\s*(.*)$/i);
  if (qMatch) {
    const prefix = qMatch[1].trim();
    const sub = qMatch[2].trim();
    const suffix = qMatch[3].trim();

    let html = '';
    if (prefix) {
      const pTag = /(parça|metin|dörtlük|cümle|ilgili|göre|hakkında)/i.test(prefix) ? 'xray-adv' : 'xray-obj';
      html += `<span class="${pTag}" title="Tümleç / Zarf">${prefix}</span> `;
    }
    html += `<span class="xray-sub" title="Özne">${sub}</span>`;

    if (suffix) {
      const words = suffix.split(/\s+/);
      let verbCount = 1;
      const lastTwo = words.slice(-2).join(' ').toLowerCase().replace(/[.?!,;]/g, '');
      if (COMPOUND_VERBS.has(lastTwo)) verbCount = 2;

      if (words.length <= verbCount) {
        html += ` <span class="xray-verb" title="Yüklem">${suffix}</span>`;
      } else {
        const midWords = words.slice(0, -verbCount).join(' ');
        const verbWords = words.slice(-verbCount).join(' ');
        const mTag = /(durumla|parcada|metinde|numaralanmis|ilgili|olarak|gore|verilen|yansitil|iliski)\b/i.test(midWords) ? 'xray-adv' : 'xray-obj';
        html += ` <span class="${mTag}" title="Öge">${midWords}</span> <span class="xray-verb" title="Yüklem">${verbWords}</span>`;
      }
    }
    return html;
  }

  // 2. Virgülle Başlayan Standart SOV Cümleler (Örn: "Yazar, Anadolu romanının özelliklerini bu makalesinde ortaya koydu.")
  const commaIdx = sent.indexOf(',');
  if (commaIdx > 0 && commaIdx < 35) {
    const candidateSub = sent.substring(0, commaIdx).trim();
    const rest = sent.substring(commaIdx + 1).trim();
    const words = rest.split(/\s+/);
    if (words.length >= 2) {
      let verbCount = 1;
      const lastTwo = words.slice(-2).join(' ').toLowerCase().replace(/[.?!,;]/g, '');
      if (COMPOUND_VERBS.has(lastTwo)) verbCount = 2;

      const verbText = words.slice(-verbCount).join(' ');
      const midText = words.slice(0, -verbCount).join(' ');

      return `<span class="xray-sub" title="Özne">${candidateSub}</span>, <span class="xray-obj" title="Nesne / Tümleç">${midText}</span> <span class="xray-verb" title="Yüklem">${verbText}</span>`;
    }
  }

  // 3. Basit Cümleler (Örn: "Ahmet Cemil gördü.")
  const allWords = sent.split(/\s+/);
  if (allWords.length >= 2 && allWords.length <= 4) {
    const subWord = allWords[0];
    const verbWord = allWords[allWords.length - 1];
    const mid = allWords.slice(1, -1).join(' ');
    if (mid) {
      return `<span class="xray-sub" title="Özne">${subWord}</span> <span class="xray-obj" title="Nesne">${mid}</span> <span class="xray-verb" title="Yüklem">${verbWord}</span>`;
    }
    return `<span class="xray-sub" title="Özne">${subWord}</span> <span class="xray-verb" title="Yüklem">${verbWord}</span>`;
  }

  return sent;
}

/**
 * Türkçe metni pedagojik olarak ögelerine ayırır.
 * Önceden doğrulanmış soru kimlikleri (golden data) varsa doğrudan oradan alır,
 * yoksa cümle cümle ayrıştırıp altı çizili ögeleri döner.
 */
export function enrichTurkishSentenceXray(rawText: string, questionId?: number): string {
  if (!rawText) return '';

  if (questionId && MEB_CUMLE_XRAY_MAP[questionId]) {
    return MEB_CUMLE_XRAY_MAP[questionId];
  }

  // Paragrafı cümlelerine veya satırlarına böl
  const lines = rawText.split('\n');
  const processedLines = lines.map(line => {
    const trimmed = line.trim();
    if (!trimmed) return line;

    // Soru kökü ise (örneğin '...aşağıdakilerden hangisi... ?')
    if (/\b(hangisi|hangisinde|söylenemez|ilişkilendirilemez|yoktur|vardır)\b/i.test(trimmed)) {
      return parseTurkishSentenceElements(trimmed);
    }

    return trimmed;
  });

  return processedLines.join('\n');
}
