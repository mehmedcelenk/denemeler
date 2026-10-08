

export const ACCENT_COLORS = {
  'blue':    { light: '#0284c7', dark: '#38bdf8' },
  'emerald': { light: '#059669', dark: '#34d399' },
  'indigo':  { light: '#6366f1', dark: '#818cf8' },
  'amber':   { light: '#d97706', dark: '#fbbf24' },
  'rose':    { light: '#e11d48', dark: '#fb7185' },
  'slate':   { light: '#475569', dark: '#94a3b8' }
};

export const ACCENT_KEYS = ['blue', 'emerald', 'indigo', 'amber', 'rose', 'slate'];
export let currentAccent = 'blue';

export function cycleAccentColor() {
  const currentIdx = ACCENT_KEYS.indexOf(currentAccent);
  const nextIdx = (currentIdx + 1) % ACCENT_KEYS.length;
  setAccentColor(ACCENT_KEYS[nextIdx]);
}

export function setAccentColor(colorKey) {
  if (!ACCENT_COLORS[colorKey]) colorKey = 'blue';
  currentAccent = colorKey;
  try {
    localStorage.setItem('aol_accent_color', colorKey);
  } catch (e) {}

  const cfg = ACCENT_COLORS[colorKey];
  document.documentElement.style.setProperty('--user-accent', cfg.light);
  document.documentElement.style.setProperty('--user-accent-dark', cfg.dark);

  const btn = document.getElementById('btnConsoleColorCycle');
  if (btn) {
    const hex = cfg.light;
    btn.innerHTML = `<span style="display:inline-block; width:14px; height:14px; border-radius:50%; background:${hex}; border:1.5px solid rgba(255,255,255,0.7); box-shadow:0 0 4px ${hex};"></span>`;
    btn.title = `Vurgu Rengi: ${colorKey} (Değiştirmek için tıkla)`;
  }
}

export function initAccentColor() {
  let color = 'blue';
  try {
    const saved = localStorage.getItem('aol_accent_color');
    if (saved && ACCENT_COLORS[saved]) color = saved;
  } catch (e) {}
  setAccentColor(color);
}
