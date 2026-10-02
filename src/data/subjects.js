

export const SUBJECTS = [
  { id: 'COG', name: 'Coğrafya', icon: '🗺️', cat: 'sozel', kredi: 2 },
  { id: 'TDE', name: 'Türk Dili ve Ed.', icon: '📚', cat: 'sozel', kredi: 5 },
  { id: 'MAT', name: 'Matematik', icon: '📐', cat: 'sayisal', kredi: 6 },
  { id: 'TAR', name: 'Tarih', icon: '🏺', cat: 'sozel', kredi: 2 },
  { id: 'INK', name: 'T.C. İnkılap Tar.', icon: '📜', cat: 'sozel', kredi: 2 },
  { id: 'KIM', name: 'Kimya', icon: '🧪', cat: 'sayisal', kredi: 2 },
  { id: 'FIZ', name: 'Fizik', icon: '⚡', cat: 'sayisal', kredi: 2 },
  { id: 'BIO', name: 'Biyoloji', icon: '🧬', cat: 'sayisal', kredi: 2 },
  { id: 'FEL', name: 'Felsefe', icon: '🦉', cat: 'sozel', kredi: 2 },
  { id: 'DIN', name: 'Din Kültürü', icon: '🧎', cat: 'kultur', kredi: 2 },
  { id: 'SAG', name: 'Sağlık & Trafik', icon: '🚑', cat: 'kultur', kredi: 1 },
  { id: 'ING', name: 'İngilizce', icon: '🌐', cat: 'kultur', kredi: 4 }
];

export function matchesSubject(q, subj) {
  if (subj === 'COG') return q.ders.includes('COĞRAFYA');
  if (subj === 'TDE') return q.ders.includes('TÜRK DİLİ') || q.ders.includes('EDEBİYAT');
  if (subj === 'MAT') return q.ders.includes('MATEMATİK');
  if (subj === 'TAR') return q.ders.includes('TARİH') && !q.ders.includes('İNKILAP');
  if (subj === 'INK') return q.ders.includes('İNKILAP');
  if (subj === 'KIM') return q.ders.includes('KİMYA');
  if (subj === 'FIZ') return q.ders.includes('FİZİK');
  if (subj === 'BIO') return q.ders.includes('BİYOLOJİ');
  if (subj === 'FEL') return q.ders.includes('FELSEFE');
  if (subj === 'DIN') return q.ders.includes('DİN KÜLTÜRÜ');
  if (subj === 'SAG') return q.ders.includes('SAĞLIK');
  if (subj === 'ING') return q.ders.includes('İNGİLİZCE');
  return true;
}

export function getShortCourseName(c) {
  return c.replace('TÜRK DİLİ VE EDEBİYATI', 'TDE')
          .replace('TÜRK DİLİ VE ED.', 'TDE')
          .replace('T.C. İNKILAP TARİHİ VE ATATÜRKÇÜLÜK', 'İNK')
          .replace('SAĞLIK BİLGİSİ VE TRAFİK KÜLTÜRÜ', 'SAĞ')
          .replace('DİN KÜLTÜRÜ VE AHLAK BİLGİSİ', 'DİN')
          .replace('İNGİLİZCE', 'İNG')
          .replace('COĞRAFYA', 'COĞ')
          .replace('MATEMATİK', 'MAT')
          .replace('TARİH', 'TAR')
          .replace('KİMYA', 'KİM')
          .replace('FİZİK', 'FİZ')
          .replace('BİYOLOJİ', 'BİY')
          .replace('FELSEFE', 'FEL')
          .replace(/\s*[–-]\s*/g, '-')
          .trim();
}

export function getCondensedCourseCode(coursesSet, subjId) {
  const list = Array.from(coursesSet);
  if (list.length === 0) return subjId;

  const prefixMap = {
    'MAT': 'MAT',
    'TDE': 'TDE',
    'TAR': 'TAR',
    'COG': 'COĞ',
    'FIZ': 'FİZ',
    'KIM': 'KİM',
    'BIO': 'BİY',
    'FEL': 'FEL',
    'DIN': 'DİN',
    'ING': 'İNG',
    'INK': 'İNK',
    'SAG': 'SAĞ'
  };

  const prefix = prefixMap[subjId] || subjId;
  
  const digits = list.map(c => {
    const m = c.match(/\d+$/);
    return m ? parseInt(m[0], 10) : 0;
  }).filter(n => n > 0).sort((a, b) => a - b);

  if (digits.length > 0) {
    return prefix + digits.join('');
  }
  return prefix;
}
