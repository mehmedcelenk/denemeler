

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

  document.querySelectorAll('#themeTogglePill .btn-segmented-pill').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.theme === mode);
  });
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
