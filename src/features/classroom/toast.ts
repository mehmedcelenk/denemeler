let toastContainer: HTMLElement | null = null;

function ensureToastContainer(): HTMLElement {
  if (!toastContainer || !document.body.contains(toastContainer)) {
    toastContainer = document.getElementById('roomToastContainer');
    if (!toastContainer) {
      toastContainer = document.createElement('div');
      toastContainer.id = 'roomToastContainer';
      toastContainer.className = 'room-toast-container';
      document.body.appendChild(toastContainer);
    }
  }
  return toastContainer;
}

export function showRoomToast(title: string, message: string, icon: string = '📢'): void {
  if (typeof document === 'undefined') return;

  const container = ensureToastContainer();
  const toast = document.createElement('div');
  toast.className = 'room-toast-card';
  toast.innerHTML = `
    <div class="room-toast-icon">${icon}</div>
    <div class="room-toast-content">
      <div class="room-toast-title">${escapeHtml(title)}</div>
      <div class="room-toast-msg">${escapeHtml(message)}</div>
    </div>
  `;

  container.appendChild(toast);

  // Vibrate if supported
  if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
    try {
      navigator.vibrate([80, 40, 80]);
    } catch {}
  }

  setTimeout(() => {
    toast.classList.add('hide');
    setTimeout(() => {
      toast.remove();
    }, 280);
  }, 4500);
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
