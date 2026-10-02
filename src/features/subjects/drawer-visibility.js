export function closeSubjectDrawer() {
  document.getElementById('drawerOverlay').classList.remove('open');
}

export function handleDrawerOverlayClick(e) {
  if (e.target.id === 'drawerOverlay') closeSubjectDrawer();
}
