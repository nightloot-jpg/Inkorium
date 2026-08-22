import './profile-music-diary-view.css';

function findLayout(): HTMLElement | null {
  return document.querySelector<HTMLElement>('.profile-view-page .profile-music-final');
}

function setMode(mode: 'library' | 'diary') {
  const layout = findLayout();
  if (!layout) return;
  layout.classList.toggle('music-diary-view', mode === 'diary');
  layout.classList.toggle('music-library-view', mode === 'library');
  layout.dataset.musicView = mode;
}

function bind() {
  setMode('library');
  document.addEventListener('click', event => {
    const button = (event.target as HTMLElement).closest<HTMLButtonElement>('[data-daily-view]');
    if (!button) return;
    const mode = button.dataset.dailyView === 'diary' ? 'diary' : 'library';
    window.setTimeout(() => setMode(mode), 0);
  }, true);
}

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', bind, { once: true });
else bind();
