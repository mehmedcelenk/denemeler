

export function setThemeMode(mode) {
  const isDark = (mode === 'dark');
  if (isDark) {
    document.body.classList.add('dark-mode');
  } else {
    document.body.classList.remove('dark-mode');
  }
  try {
    localStorage.setItem('aol_theme', isDark ? 'dark' : 'light');
  } catch (e) {}

  const btn = document.getElementById('btnConsoleThemeCycle');
  if (btn) {
    btn.innerHTML = isDark
      ? `<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/></svg>`
      : `<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="4"/><path d="M12 2v2"/><path d="M12 20v2"/><path d="m4.93 4.93 1.41 1.41"/><path d="m17.66 17.66 1.41 1.41"/><path d="M2 12h2"/><path d="M20 12h2"/><path d="m6.34 17.66-1.41 1.41"/><path d="m19.07 4.93-1.41 1.41"/></svg>`;
    btn.title = isDark ? 'Koyu Tema (Açık Temaya Geç)' : 'Açık Tema (Koyu Temaya Geç)';
  }
}

export function initTheme() {
  let theme = 'light';
  try {
    const saved = localStorage.getItem('aol_theme');
    if (saved === 'dark') theme = 'dark';
  } catch (e) {}
  setThemeMode(theme);
}

export function toggleTheme() {
  const isDark = document.body.classList.contains('dark-mode');
  setThemeMode(isDark ? 'light' : 'dark');
}
