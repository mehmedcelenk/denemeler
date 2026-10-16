let actionBubble: HTMLElement | null = null;
let currentRange: Range | null = null;

function removeActionBubble(): void {
  if (actionBubble && actionBubble.parentNode) {
    actionBubble.parentNode.removeChild(actionBubble);
  }
  actionBubble = null;
  currentRange = null;
}

export type HighlightColor = 'yellow' | 'red';

/** Seçili alana fosfor uygular */
export function applyHighlightToSelection(color: HighlightColor = 'yellow'): void {
  const selection = window.getSelection();
  const range = currentRange || (selection && selection.rangeCount > 0 ? selection.getRangeAt(0) : null);
  if (!range || range.collapsed) {
    removeActionBubble();
    return;
  }

  // Seçilen metin soru kökü veya şık içinde mi kontrol et
  const container = range.commonAncestorContainer;
  const parentEl = (container.nodeType === Node.ELEMENT_NODE ? container : container.parentElement) as HTMLElement | null;
  const validHost = parentEl?.closest('.q-stem-text, .choice-text-content, .stem-card, .booklet-question');
  if (!validHost) {
    removeActionBubble();
    return;
  }

  try {
    const mark = document.createElement('mark');
    mark.className = `user-highlight hl-${color}`;
    mark.title = 'Vurguyu kaldırmak için tıkla';

    // Surround or extract content into mark
    const content = range.extractContents();
    mark.appendChild(content);
    range.insertNode(mark);
  } catch (err) {
    console.warn('[Highlighter] Metin sarmalanamadı:', err);
  }

  if (selection) {
    selection.removeAllRanges();
  }
  removeActionBubble();
}

/** Tıklanan fosforlu metnin vurgusunu kaldırır */
function handleHighlightClick(e: MouseEvent): void {
  const target = (e.target as HTMLElement | null)?.closest<HTMLElement>('.user-highlight');
  if (!target) return;

  e.preventDefault();
  e.stopPropagation();

  // Mark etiketini kaldırıp içindeki düğümleri ebeveynine taşı
  const parent = target.parentNode;
  if (!parent) return;

  while (target.firstChild) {
    parent.insertBefore(target.firstChild, target);
  }
  parent.removeChild(target);
  parent.normalize();
}

/** Seçim yapıldığında mini butonları konumlandırır */
function handleSelectionChange(): void {
  const selection = window.getSelection();
  if (!selection || selection.rangeCount === 0 || selection.isCollapsed) {
    // Seçim yoksa ve kullanıcı menüye tıklamıyorsa kapat
    setTimeout(() => {
      const activeSel = window.getSelection();
      if (!activeSel || activeSel.isCollapsed) {
        removeActionBubble();
      }
    }, 150);
    return;
  }

  const range = selection.getRangeAt(0);
  const text = selection.toString().trim();
  if (!text) {
    removeActionBubble();
    return;
  }

  const container = range.commonAncestorContainer;
  const parentEl = (container.nodeType === Node.ELEMENT_NODE ? container : container.parentElement) as HTMLElement | null;
  const validHost = parentEl?.closest('.q-stem-text, .choice-text-content, .stem-card, .booklet-question');
  if (!validHost) {
    removeActionBubble();
    return;
  }

  currentRange = range.cloneRange();
  const rect = range.getBoundingClientRect();
  if (rect.width === 0 || rect.height === 0) {
    removeActionBubble();
    return;
  }

  if (!actionBubble) {
    actionBubble = document.createElement('div');
    actionBubble.className = 'selection-action-bubble';
    document.body.appendChild(actionBubble);
  }

  actionBubble.innerHTML = `
    <button class="btn-highlight-action btn-hl-yellow" type="button" data-color="yellow">
      <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
        <path d="m9 11-6 6v3h3l6-6"/>
        <path d="m22 12-4.6 4.6a2 2 0 0 1-2.8 0l-5.2-5.2a2 2 0 0 1 0-2.8L14 4"/>
      </svg>
      <span>Sarı</span>
    </button>
    <button class="btn-highlight-action btn-hl-red" type="button" data-color="red">
      <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
        <path d="m9 11-6 6v3h3l6-6"/>
        <path d="m22 12-4.6 4.6a2 2 0 0 1-2.8 0l-5.2-5.2a2 2 0 0 1 0-2.8L14 4"/>
      </svg>
      <span>Kırmızı</span>
    </button>
  `;

  actionBubble.querySelectorAll<HTMLElement>('.btn-highlight-action').forEach(btn => {
    const handleAction = (e: Event) => {
      e.preventDefault();
      e.stopPropagation();
      const color = (btn.dataset.color as HighlightColor) || 'yellow';
      applyHighlightToSelection(color);
    };
    btn.addEventListener('pointerdown', handleAction);
    btn.addEventListener('click', handleAction);
  });

  const bubbleWidth = 145;
  const scrollX = window.scrollX || document.documentElement.scrollLeft;
  const scrollY = window.scrollY || document.documentElement.scrollTop;

  let left = rect.left + rect.width / 2 + scrollX;
  left = Math.max(bubbleWidth / 2 + 8, Math.min(window.innerWidth - bubbleWidth / 2 - 8, left));

  let top = rect.top + scrollY;
  if (rect.top < 50) {
    actionBubble.classList.add('bubble-below');
    top = rect.bottom + scrollY;
  } else {
    actionBubble.classList.remove('bubble-below');
  }

  actionBubble.style.left = `${left}px`;
  actionBubble.style.top = `${top}px`;
}

let isInitialized = false;

/** Metin seçimi ve sarı fosforlama özelliğini başlatır */
export function initTextHighlighter(): void {
  if (isInitialized || typeof document === 'undefined') return;
  isInitialized = true;

  document.addEventListener('selectionchange', () => {
    // Mobil klavye/scroll debounce
    requestAnimationFrame(handleSelectionChange);
  });

  document.addEventListener('click', handleHighlightClick);
  
  // Sayfa kaydırıldığında veya dışarı tıklandığında menüyü gizleme
  document.addEventListener('scroll', () => {
    if (actionBubble && (!window.getSelection() || window.getSelection()?.isCollapsed)) {
      removeActionBubble();
    }
  }, { passive: true });
}
