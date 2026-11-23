const siteUrl = 'https://anlatansorular.surge.sh/';
const qrImageUrl = new URL('./site-qr.svg', import.meta.url).href;

export function showSiteQr(): void {
  let dialog = document.querySelector<HTMLDialogElement>('.site-qr-dialog');
  if (!dialog) {
    dialog = document.createElement('dialog');
    dialog.className = 'site-qr-dialog';
    dialog.setAttribute('aria-labelledby', 'site-qr-title');
    dialog.innerHTML = `
      <div class="site-qr-content">
        <button type="button" class="site-qr-close" aria-label="Karekodu kapat">×</button>
        <h2 id="site-qr-title">Karekod ile aç</h2>
        <p>Telefonunun kamerasını karekoda tut.</p>
        <img src="${qrImageUrl}" alt="Anlatan Sorular web sitesine giden karekod" width="370" height="370">
        <a href="${siteUrl}">anlatansorular.surge.sh</a>
      </div>`;
    const currentDialog = dialog;
    dialog.querySelector('button')?.addEventListener('click', () => currentDialog.close());
    dialog.addEventListener('click', event => {
      if (event.target === currentDialog) currentDialog.close();
    });
    document.body.append(dialog);
  }
  if (!dialog.open) dialog.showModal();
}
