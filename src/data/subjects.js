

export const AOIHL_SUBJECTS = [
  { id: 'COG', name: 'Coğrafya', shortName: 'COĞ', icon: '🗺️', cat: 'sozel', kredi: 2 },
  { id: 'TDE', name: 'Türk Dili ve Ed.', shortName: 'TDE', icon: '📚', cat: 'sozel', kredi: 5 },
  { id: 'MAT', name: 'Matematik', shortName: 'MAT', icon: '📐', cat: 'sayisal', kredi: 6 },
  { id: 'TAR', name: 'Tarih', shortName: 'TAR', icon: '🏺', cat: 'sozel', kredi: 2 },
  { id: 'INK', name: 'T.C. İnkılap Tar.', shortName: 'İNK', icon: '📜', cat: 'sozel', kredi: 2 },
  { id: 'KIM', name: 'Kimya', shortName: 'KİM', icon: '🧪', cat: 'sayisal', kredi: 2 },
  { id: 'FIZ', name: 'Fizik', shortName: 'FİZ', icon: '⚡', cat: 'sayisal', kredi: 2 },
  { id: 'BIO', name: 'Biyoloji', shortName: 'BİY', icon: '🧬', cat: 'sayisal', kredi: 2 },
  { id: 'FEL', name: 'Felsefe', shortName: 'FEL', icon: '🦉', cat: 'sozel', kredi: 2 },
  { id: 'DIN', name: 'Din Kültürü', shortName: 'DİN', icon: '🧎', cat: 'kultur', kredi: 2 },
  { id: 'SAG', name: 'Sağlık & Trafik', shortName: 'SAĞ', icon: '🚑', cat: 'kultur', kredi: 1 },
  { id: 'ING', name: 'İngilizce', shortName: 'İNG', icon: '🌐', cat: 'kultur', kredi: 4 }
];

export const AOF_SUBJECTS = [
  { id: 'AOF_HADIS', name: 'Hadis Tarihi ve Usulü', shortName: 'Hadis Tarihi', icon: '📜', cat: 'ilahiyat', kredi: 2 },
  { id: 'AOF_ITAR', name: 'İlk Dönem İslam Tarihi', shortName: 'İslam Tarihi', icon: '🏛️', cat: 'ilahiyat', kredi: 2 },
  { id: 'AOF_AHLAK', name: 'İslam Ahlak Esasları', shortName: 'Ahlak Esasları', icon: '🌸', cat: 'ilahiyat', kredi: 2 },
  { id: 'AOF_IBADET', name: 'İslam İbadet Esasları', shortName: 'İbadet Esasları', icon: '🕌', cat: 'ilahiyat', kredi: 2 },
  { id: 'AOF_INANC', name: 'İslam İnanç Esasları', shortName: 'İnanç Esasları', icon: '✨', cat: 'ilahiyat', kredi: 2 }
];

export const SUBJECTS = [...AOIHL_SUBJECTS, ...AOF_SUBJECTS];

export function matchesSubject(q, subj) {
  if (subj === 'COG') return q.ders.includes('COĞRAFYA');
  if (subj === 'TDE') return q.ders.includes('TÜRK DİLİ') || q.ders.includes('EDEBİYAT');
  if (subj === 'MAT') return q.ders.includes('MATEMATİK');
  if (subj === 'TAR') return q.ders.includes('TARİH') && !q.ders.includes('İNKILAP') && !q.ders.includes('İSLAM');
  if (subj === 'INK') return q.ders.includes('İNKILAP');
  if (subj === 'KIM') return q.ders.includes('KİMYA');
  if (subj === 'FIZ') return q.ders.includes('FİZİK');
  if (subj === 'BIO') return q.ders.includes('BİYOLOJİ');
  if (subj === 'FEL') return q.ders.includes('FELSEFE');
  if (subj === 'DIN') return q.ders.includes('DİN KÜLTÜRÜ');
  if (subj === 'SAG') return q.ders.includes('SAĞLIK');
  if (subj === 'ING') return q.ders.includes('İNGİLİZCE');
  if (subj === 'AOF_HADIS') return q.ders.includes('HADİS');
  if (subj === 'AOF_ITAR') return q.ders.includes('İLK DÖNEM İSLAM TARİHİ');
  if (subj === 'AOF_AHLAK') return q.ders.includes('AHLAK');
  if (subj === 'AOF_IBADET') return q.ders.includes('İBADET');
  if (subj === 'AOF_INANC') return q.ders.includes('İNANÇ');
  return true;
}

export function getShortCourseName(c) {
  return c.replace('HADİS TARİHİ VE USÜLÜ', 'HADİS')
          .replace('İLK DÖNEM İSLAM TARİHİ', 'İSLÂM TARİHİ')
          .replace('İSLAM AHLAK ESASLARI', 'AHLÂK')
          .replace('İSLAM İBADET ESASLARI', 'İBADET')
          .replace('İSLAM İNANÇ ESASLARI', 'İNANÇ')
          .replace('TÜRK DİLİ VE EDEBİYATI', 'TDE')
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
    'SAG': 'SAĞ',
    'AOF_HADIS': 'HADİS',
    'AOF_ITAR': 'İS.TAR',
    'AOF_AHLAK': 'AHLÂK',
    'AOF_IBADET': 'İBADET',
    'AOF_INANC': 'İNANÇ'
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
