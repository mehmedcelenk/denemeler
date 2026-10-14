import { state } from '../../app/state.ts';
import { StorageKeys } from '../../shared/storage-keys.ts';

export const ACCENT_COLORS: Record<string, { light: string; dark: string }> = {
  blue:    { light: '#0284c7', dark: '#38bdf8' },
  emerald: { light: '#059669', dark: '#34d399' },
  indigo:  { light: '#6366f1', dark: '#818cf8' },
  amber:   { light: '#d97706', dark: '#fbbf24' },
  rose:    { light: '#e11d48', dark: '#fb7185' },
  slate:   { light: '#475569', dark: '#94a3b8' },
};

export const ACCENT_KEYS = ['blue', 'emerald', 'indigo', 'amber', 'rose', 'slate'];
export let currentAccent = 'blue';

export const zoomScales = ['12px', '13.5px', '15px', '17px', '19.5px', '22.5px', '26px'];

let panX = 0;
let panY = 0;
let pinchStartDist = 0;
let pinchStartScale = 1.0;
let pinchStartCenter = { x: 0, y: 0 };
let pinchStartPan = { x: 0, y: 0 };
let lastTapTime = 0;

function notifyBookletLayoutChange() {
  document.dispatchEvent(new Event('booklet:layoutchange'));
}

/* ==================== VURGU RENGİ (ACCENT) ==================== */
export function cycleAccentColor() {
  const currentIdx = ACCENT_KEYS.indexOf(currentAccent);
  const nextIdx = (currentIdx + 1) % ACCENT_KEYS.length;
  setAccentColor(ACCENT_KEYS[nextIdx]);
}

export function setAccentColor(colorKey: string) {
  if (!ACCENT_COLORS[colorKey]) colorKey = 'blue';
  currentAccent = colorKey;
  try {
    localStorage.setItem(StorageKeys.ACCENT_COLOR, colorKey);
  } catch {}

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
    const saved = localStorage.getItem(StorageKeys.ACCENT_COLOR);
    if (saved && ACCENT_COLORS[saved]) color = saved;
  } catch {}
  setAccentColor(color);
}

/* ==================== TEMA (THEME) ==================== */
export function setThemeMode(mode: 'dark' | 'light') {
  const isDark = mode === 'dark';
  if (isDark) {
    document.body.classList.add('dark-mode');
  } else {
    document.body.classList.remove('dark-mode');
  }
  try {
    localStorage.setItem(StorageKeys.THEME, isDark ? 'dark' : 'light');
  } catch {}

  const btn = document.getElementById('btnConsoleThemeCycle');
  if (btn) {
    btn.innerHTML = isDark
      ? `<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/></svg>`
      : `<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="4"/><path d="M12 2v2"/><path d="M12 20v2"/><path d="m4.93 4.93 1.41 1.41"/><path d="m17.66 17.66 1.41 1.41"/><path d="M2 12h2"/><path d="M20 12h2"/><path d="m6.34 17.66-1.41 1.41"/><path d="m19.07 4.93-1.41 1.41"/></svg>`;
    btn.title = isDark ? 'Koyu Tema (Açık Temaya Geç)' : 'Açık Tema (Koyu Temaya Geç)';
  }
}

export function initTheme() {
  let theme: 'dark' | 'light' = 'light';
  try {
    const saved = localStorage.getItem(StorageKeys.THEME);
    if (saved === 'dark') theme = 'dark';
  } catch {}
  setThemeMode(theme);
}

export function toggleTheme() {
  const isDark = document.body.classList.contains('dark-mode');
  setThemeMode(isDark ? 'light' : 'dark');
}

/* ==================== ZOOM & CANVAS ==================== */
function updateContainerTransform() {
  const container = document.getElementById('bookletPagesContainer');
  if (!container) return;

  if (Math.abs(state.canvasZoomScale - 1.0) < 0.02 && Math.abs(panX) < 1 && Math.abs(panY) < 1) {
    container.style.transform = '';
  } else {
    container.style.transform = `translate(${Math.round(panX)}px, ${Math.round(panY)}px) scale(${state.canvasZoomScale})`;
  }

  const indicator = document.getElementById('bookletZoomIndicator');
  if (indicator) {
    if (Math.abs(state.canvasZoomScale - 1.0) < 0.02 && Math.abs(panX) < 1 && Math.abs(panY) < 1) {
      indicator.classList.remove('active');
    } else {
      indicator.classList.add('active');
      const textSpan = indicator.querySelector('span:first-child');
      if (textSpan) {
        textSpan.textContent = `🔍 %${Math.round(state.canvasZoomScale * 100)}`;
      }
    }
  }
}

export function resetBookletCanvasZoom() {
  state.canvasZoomScale = 1.0;
  panX = 0;
  panY = 0;
  updateContainerTransform();
}

export function setBookletCanvasScale(scale: number) {
  state.canvasZoomScale = Math.min(2.5, Math.max(0.85, scale));
  updateContainerTransform();
}

export function initBookletCanvasZoom() {
  const container = document.getElementById('bookletPagesContainer');
  if (!container) return;

  window.addEventListener('wheel', (e) => {
    if (!e.ctrlKey && !e.metaKey) return;
    const target = e.target as HTMLElement;
    if (!container.contains(target) && target !== container) return;

    e.preventDefault();
    const mouseX = e.clientX;
    const mouseY = e.clientY;
    const delta = -e.deltaY * 0.002;
    const newScale = Math.min(2.5, Math.max(0.85, state.canvasZoomScale + delta));
    if (Math.abs(newScale - state.canvasZoomScale) < 0.001) return;

    const scaleRatio = newScale / state.canvasZoomScale;
    panX = mouseX - scaleRatio * (mouseX - panX);
    panY = mouseY - scaleRatio * (mouseY - panY);
    state.canvasZoomScale = newScale;
    updateContainerTransform();
  }, { passive: false });

  container.addEventListener('touchstart', (e) => {
    if (e.touches.length === 2) {
      const p1 = e.touches[0];
      const p2 = e.touches[1];
      pinchStartDist = Math.hypot(p1.clientX - p2.clientX, p1.clientY - p2.clientY);
      pinchStartScale = state.canvasZoomScale;
      pinchStartCenter = { x: (p1.clientX + p2.clientX) / 2, y: (p1.clientY + p2.clientY) / 2 };
      pinchStartPan = { x: panX, y: panY };
    } else if (e.touches.length === 1) {
      const now = Date.now();
      if (now - lastTapTime < 300) {
        e.preventDefault();
        resetBookletCanvasZoom();
      }
      lastTapTime = now;
    }
  }, { passive: false });

  container.addEventListener('touchmove', (e) => {
    if (e.touches.length === 2 && pinchStartDist > 0) {
      e.preventDefault();
      const p1 = e.touches[0];
      const p2 = e.touches[1];
      const dist = Math.hypot(p1.clientX - p2.clientX, p1.clientY - p2.clientY);
      const ratio = dist / pinchStartDist;
      const targetScale = Math.min(2.5, Math.max(0.85, pinchStartScale * ratio));

      const currentCenter = { x: (p1.clientX + p2.clientX) / 2, y: (p1.clientY + p2.clientY) / 2 };
      const panDx = currentCenter.x - pinchStartCenter.x;
      const panDy = currentCenter.y - pinchStartCenter.y;

      const scaleRatio = targetScale / pinchStartScale;
      panX = pinchStartCenter.x - scaleRatio * (pinchStartCenter.x - pinchStartPan.x) + panDx;
      panY = pinchStartCenter.y - scaleRatio * (pinchStartCenter.y - pinchStartPan.y) + panDy;
      state.canvasZoomScale = targetScale;
      updateContainerTransform();
    }
  }, { passive: false });
}

/* ==================== SÜTUN & FONT AYARLARI ==================== */
export function cycleColumnCount() {
  const current = state.currentColumnCount || 2;
  const next = (current % 4) + 1;
  setColumnCount(next);
}

export function setColumnCount(n: number) {
  if (![1, 2, 3, 4].includes(n)) n = 2;
  state.currentColumnCount = n;
  try {
    localStorage.setItem(StorageKeys.COLUMN_COUNT, String(n));
  } catch {}

  const cycleBtn = document.getElementById('btnConsoleColumnCycle');
  if (cycleBtn) {
    const bars = '|'.repeat(n);
    cycleBtn.innerHTML = `<span style="font-family:'JetBrains Mono',monospace; font-weight:800; font-size:12px; letter-spacing:-1px;">${bars}</span>`;
    cycleBtn.title = `Sütun Düzeni: ${n} Sütun (Artırmak için tıkla)`;
  }

  const container = document.getElementById('bookletPagesContainer');
  if (container) {
    container.classList.remove('wide-3', 'wide-4');
    if (n === 3) container.classList.add('wide-3');
    if (n === 4) container.classList.add('wide-4');
  }

  document.querySelectorAll('.page-columns-body').forEach(el => {
    el.classList.remove('cols-1', 'cols-2', 'cols-3', 'cols-4');
    el.classList.add(`cols-${n}`);
  });
  notifyBookletLayoutChange();
}

export function cycleZoomLevel() {
  state.zoomLevelIndex = (state.zoomLevelIndex + 1) % zoomScales.length;
  document.documentElement.style.setProperty('--booklet-font-size', zoomScales[state.zoomLevelIndex]);
  updateZoomCycleUI();
  notifyBookletLayoutChange();
}

export function updateZoomCycleUI() {
  const zoomBtn = document.getElementById('btnConsoleZoomCycle');
  if (zoomBtn) {
    const scalePx = 11 + (state.zoomLevelIndex * 1.5);
    zoomBtn.innerHTML = `<span style="font-family:'Plus Jakarta Sans',sans-serif; font-weight:800; font-size:${scalePx}px; line-height:1;">A</span>`;
    zoomBtn.title = `Yazı Boyutu: ${zoomScales[state.zoomLevelIndex]} (Değiştirmek için tıkla)`;
  }
}

export function zoomIn() {
  if (state.zoomLevelIndex < zoomScales.length - 1) {
    state.zoomLevelIndex++;
    document.documentElement.style.setProperty('--booklet-font-size', zoomScales[state.zoomLevelIndex]);
    updateZoomCycleUI();
    notifyBookletLayoutChange();
  }
}

export function zoomOut() {
  if (state.zoomLevelIndex > 0) {
    state.zoomLevelIndex--;
    document.documentElement.style.setProperty('--booklet-font-size', zoomScales[state.zoomLevelIndex]);
    updateZoomCycleUI();
    notifyBookletLayoutChange();
  }
}

/* ==================== KONSOL MENÜSÜ & FULLSCREEN ==================== */
export function toggleConsoleMenu() {
  const popup = document.getElementById('consoleMenuPopup');
  popup?.classList.toggle('open');
}

export function toggleFullscreenFocusMode() {
  const isFull = document.body.classList.toggle('fullscreen-focus-mode');
  const iconSvg = document.getElementById('iconFullscreenSvg');
  if (iconSvg) {
    if (isFull) {
      iconSvg.innerHTML = `<path d="M4 14h6m0 0v6m0-6-7 7"/><path d="M20 10h-6m0 0V4m0 6 7-7"/><path d="M14 20v-6m0 0h6m-6 0 7 7"/><path d="M10 4v6m0 0H4m0 0 7-7"/>`;
    } else {
      iconSvg.innerHTML = `<path d="M8 3H5a2 2 0 0 0-2 2v3"/><path d="M21 8V5a2 2 0 0 0-2-2h-3"/><path d="M3 16v3a2 2 0 0 0 2 2h3"/><path d="M16 21h3a2 2 0 0 0 2-2v-3"/>`;
    }
  }

  if (isFull) {
    if (document.documentElement.requestFullscreen && !document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
    }
  } else {
    if (document.exitFullscreen && document.fullscreenElement) {
      document.exitFullscreen().catch(() => {});
    }
  }
}

export function toggleQuestionFeatures(qId: number | string) {
  const id = Number(qId);
  if (isNaN(id)) return;
  if (!state.expandedQuestionIds) state.expandedQuestionIds = new Set();
  const currentlyExpanded = state.expandedQuestionIds.has(id);
  if (currentlyExpanded) {
    state.expandedQuestionIds.delete(id);
  } else {
    state.expandedQuestionIds.add(id);
  }
  const isNowExpanded = !currentlyExpanded;
  const card = document.getElementById(`bq_${id}`);
  if (card) {
    const drawer = card.querySelector('.q-features-drawer');
    const icon = card.querySelector('.btn-features-toggle .features-toggle-icon');
    if (drawer) drawer.classList.toggle('is-expanded', isNowExpanded);
    if (icon) icon.textContent = isNowExpanded ? '‹' : '›';
  }
}

export function toggleFeaturesBar() {
  state.isFeaturesExpanded = !state.isFeaturesExpanded;
  updateFeaturesBarUI();
}

export function updateFeaturesBarUI() {
  if (typeof document === 'undefined') return;
  const isExpanded = Boolean(state.isFeaturesExpanded);
  document.querySelectorAll('.q-features-drawer').forEach(el => {
    el.classList.toggle('is-expanded', isExpanded);
  });
  document.querySelectorAll('.btn-features-toggle .features-toggle-icon').forEach(icon => {
    icon.textContent = isExpanded ? '‹' : '›';
  });
}

