

export const CEFR_MAP = {
  'İNGİLİZCE – 1': { level: 'A1', label: 'Beginner', color: '#0284c7', bg: 'rgba(2, 132, 199, 0.1)' },
  'İNGİLİZCE – 2': { level: 'A1', label: 'Beginner', color: '#0284c7', bg: 'rgba(2, 132, 199, 0.1)' },
  'İNGİLİZCE – 3': { level: 'A2', label: 'Elementary', color: '#10b981', bg: 'rgba(16, 185, 129, 0.1)' },
  'İNGİLİZCE – 4': { level: 'A2', label: 'Elementary', color: '#10b981', bg: 'rgba(16, 185, 129, 0.1)' },
  'İNGİLİZCE – 5': { level: 'B1', label: 'Intermediate', color: '#d97706', bg: 'rgba(217, 119, 6, 0.1)' },
  'İNGİLİZCE – 6': { level: 'B1', label: 'Intermediate', color: '#d97706', bg: 'rgba(217, 119, 6, 0.1)' },
  'İNGİLİZCE – 7': { level: 'B2', label: 'Upper-Int', color: '#8b5cf6', bg: 'rgba(139, 92, 246, 0.1)' },
  'İNGİLİZCE – 8': { level: 'B2', label: 'Upper-Int', color: '#8b5cf6', bg: 'rgba(139, 92, 246, 0.1)' }
};

export function getCefrInfo(dersName) {
  if (!dersName) return null;
  const upper = dersName.toUpperCase();
  if (!upper.includes('İNG') && !upper.includes('ING')) return null;
  if (CEFR_MAP[dersName]) return CEFR_MAP[dersName];
  for (let i = 1; i <= 8; i++) {
    if (dersName.includes(String(i))) {
      if (i === 1 || i === 2) return { level: 'A1', label: 'Beginner', color: '#0284c7', bg: 'rgba(2, 132, 199, 0.1)' };
      if (i === 3 || i === 4) return { level: 'A2', label: 'Elementary', color: '#10b981', bg: 'rgba(16, 185, 129, 0.1)' };
      if (i === 5 || i === 6) return { level: 'B1', label: 'Intermediate', color: '#d97706', bg: 'rgba(217, 119, 6, 0.1)' };
      if (i === 7 || i === 8) return { level: 'B2', label: 'Upper-Int', color: '#8b5cf6', bg: 'rgba(139, 92, 246, 0.1)' };
    }
  }
  return null;
}
