import { state } from '../../app/state.ts';

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

function updateContainerTransform() {
  const container = document.getElementById('bookletPagesContainer');
  if (!container) return;

  if (Math.abs(state.canvasZoomScale - 1.0) < 0.02 && Math.abs(panX) < 1 && Math.abs(panY) < 1) {
    container.style.transform = '';
    container.style.webkitFontSmoothing = 'antialiased';
    container.style.mozOsxFontSmoothing = 'grayscale';
  } else {
    container.style.transform = `translate(${Math.round(panX)}px, ${Math.round(panY)}px) scale(${state.canvasZoomScale})`;
    container.style.webkitFontSmoothing = 'unset';
    container.style.mozOsxFontSmoothing = 'unset';
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

export function setBookletCanvasScale(scale) {
  state.canvasZoomScale = Math.min(2.5, Math.max(0.85, scale));
  updateContainerTransform();
}

export function initBookletCanvasZoom() {
  const container = document.getElementById('bookletPagesContainer');
  if (!container) return;

  // PC: Ctrl / Meta + Mouse Wheel (Pointer-Centered Zoom)
  window.addEventListener('wheel', (e) => {
    if (!e.ctrlKey && !e.metaKey) return;
    const target = e.target;
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

    if (Math.abs(state.canvasZoomScale - 1.0) < 0.02) {
      panX = 0;
      panY = 0;
      state.canvasZoomScale = 1.0;
    }

    updateContainerTransform();
  }, { passive: false });

  // Mobile: 2-finger pinch & pan
  container.addEventListener('touchstart', (e) => {
    if (e.touches.length === 2) {
      const t1 = e.touches[0];
      const t2 = e.touches[1];
      pinchStartDist = Math.hypot(t1.clientX - t2.clientX, t1.clientY - t2.clientY);
      pinchStartScale = state.canvasZoomScale;
      pinchStartCenter = {
        x: (t1.clientX + t2.clientX) / 2,
        y: (t1.clientY + t2.clientY) / 2
      };
      pinchStartPan = { x: panX, y: panY };
    }
  }, { passive: true });

  container.addEventListener('touchmove', (e) => {
    if (e.touches.length === 2 && pinchStartDist > 0) {
      e.preventDefault();
      const t1 = e.touches[0];
      const t2 = e.touches[1];
      const dist = Math.hypot(t1.clientX - t2.clientX, t1.clientY - t2.clientY);
      const center = {
        x: (t1.clientX + t2.clientX) / 2,
        y: (t1.clientY + t2.clientY) / 2
      };

      const ratio = dist / pinchStartDist;
      const newScale = Math.min(2.5, Math.max(0.85, pinchStartScale * ratio));

      const scaleRatio = newScale / pinchStartScale;
      const deltaX = center.x - pinchStartCenter.x;
      const deltaY = center.y - pinchStartCenter.y;

      panX = pinchStartPan.x + deltaX - (scaleRatio - 1) * (pinchStartCenter.x - pinchStartPan.x);
      panY = pinchStartPan.y + deltaY - (scaleRatio - 1) * (pinchStartCenter.y - pinchStartPan.y);
      state.canvasZoomScale = newScale;

      updateContainerTransform();
    }
  }, { passive: false });

  container.addEventListener('touchend', (e) => {
    if (e.touches.length < 2) {
      pinchStartDist = 0;
    }
    // Double-tap to reset
    if (e.touches.length === 0 && e.changedTouches.length === 1) {
      const now = Date.now();
      if (now - lastTapTime < 320) {
        resetBookletCanvasZoom();
        lastTapTime = 0;
      } else {
        lastTapTime = now;
      }
    }
  }, { passive: true });
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

  // Tarayıcı native fullscreen desteği
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

if (typeof document !== 'undefined') {
  document.addEventListener('fullscreenchange', () => {
    if (!document.fullscreenElement && document.body.classList.contains('fullscreen-focus-mode')) {
      document.body.classList.remove('fullscreen-focus-mode');
      const iconSvg = document.getElementById('iconFullscreenSvg');
      if (iconSvg) {
        iconSvg.innerHTML = `<path d="M8 3H5a2 2 0 0 0-2 2v3"/><path d="M21 8V5a2 2 0 0 0-2-2h-3"/><path d="M3 16v3a2 2 0 0 0 2 2h3"/><path d="M16 21h3a2 2 0 0 0 2-2v-3"/>`;
      }
    }
  });
}

export function toggleConsoleMenu() {
  const popup = document.getElementById('consoleMenuPopup');
  popup.classList.toggle('open');
}

export function setColumnCount(n) {
  if (![1, 2, 3, 4].includes(n)) n = 2;
  state.currentColumnCount = n;
  try {
    localStorage.setItem('aol_column_count', n);
  } catch (e) {}

  document.querySelectorAll('#columnTogglePill .btn-segmented-pill').forEach(btn => {
    btn.classList.toggle('active', parseInt(btn.dataset.cols, 10) === n);
  });

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

export function zoomIn() {
  if (state.zoomLevelIndex < zoomScales.length - 1) {
    state.zoomLevelIndex++;
    document.documentElement.style.setProperty('--booklet-font-size', zoomScales[state.zoomLevelIndex]);
    notifyBookletLayoutChange();
  }
}

export function zoomOut() {
  if (state.zoomLevelIndex > 0) {
    state.zoomLevelIndex--;
    document.documentElement.style.setProperty('--booklet-font-size', zoomScales[state.zoomLevelIndex]);
    notifyBookletLayoutChange();
  }
}

if (typeof document !== 'undefined') {
  document.addEventListener('click', (e) => {
    const popup = document.getElementById('consoleMenuPopup');
    const masterBtn = document.getElementById('btnMasterConsole');
    if (popup && popup.classList.contains('open')) {
      if (!popup.contains(e.target) && !masterBtn.contains(e.target)) {
        popup.classList.remove('open');
      }
    }
  });
}
