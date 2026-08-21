import { usePlayerStore } from '../../lib/store';
import './profile-music-final-fixes.css';

const MUSIC_ROOT = '.profile-view-page .profile-music-final';
const MUSIC_TAB = '.profile-view-page .profile-view-tabs button';

const player = () => usePlayerStore.getState();

function musicTab(): HTMLButtonElement | null {
  return Array.from(document.querySelectorAll<HTMLButtonElement>(MUSIC_TAB))
    .find((button) => button.textContent?.trim() === 'Música') || null;
}

function diaryCard(): HTMLElement | null {
  return Array.from(document.querySelectorAll<HTMLElement>(`${MUSIC_ROOT} .profile-music-final-side .profile-music-final-card`))
    .find((card) => card.querySelector('h2')?.textContent?.includes('Diario musical')) || null;
}

function addSwitcher() {
  const root = document.querySelector<HTMLElement>(MUSIC_ROOT);
  if (!root || root.querySelector('.profile-music-final-switcher')) return;

  const switcher = document.createElement('div');
  switcher.className = 'profile-music-final-switcher';
  switcher.innerHTML = `
    <div class="profile-music-final-switcher-copy">
      <span>ESPACIO MUSICAL</span>
      <strong>Música</strong>
    </div>
    <div class="profile-music-final-switcher-actions" role="tablist" aria-label="Secciones musicales">
      <button type="button" class="active" data-music-view="library">Mi música</button>
      <button type="button" data-music-view="diary">Diario musical</button>
    </div>`;

  root.prepend(switcher);

  const libraryButton = switcher.querySelector<HTMLButtonElement>('[data-music-view="library"]');
  const diaryButton = switcher.querySelector<HTMLButtonElement>('[data-music-view="diary"]');
  const setActive = (button: HTMLButtonElement | null) => {
    switcher.querySelectorAll('[data-music-view]').forEach((item) => item.classList.remove('active'));
    button?.classList.add('active');
  };

  libraryButton?.addEventListener('click', () => {
    setActive(libraryButton);
    root.scrollIntoView({ behavior: 'smooth', block: 'start' });
  });

  diaryButton?.addEventListener('click', () => {
    setActive(diaryButton);
    diaryCard()?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  });
}

function syncDailySong() {
  const tabRoot = document.querySelector<HTMLElement>('.profile-view-page .profile-music-tab');
  if (!tabRoot) return;
  tabRoot.removeAttribute('data-finalized');
  musicTab()?.click();
}

function playDailyCard(event: Event) {
  const target = event.target as HTMLElement;
  const card = target.closest<HTMLElement>('.profile-music-final-side .profile-music-final-card');
  if (!card || !card.querySelector('h2')?.textContent?.includes('Canción del día')) return;
  if (target.closest('button,a,input,select,textarea')) return;

  const playButton = card.querySelector<HTMLButtonElement>('[data-diary-play]');
  if (playButton) {
    event.preventDefault();
    playButton.click();
  }
}

function bindClicks() {
  const root = document.querySelector<HTMLElement>(MUSIC_ROOT);
  if (!root || root.dataset.finalFixesBound === '1') return;
  root.dataset.finalFixesBound = '1';
  root.addEventListener('click', playDailyCard, true);
}

function boot() {
  const observer = new MutationObserver(() => {
    addSwitcher();
    bindClicks();
  });

  observer.observe(document.body, { childList: true, subtree: true });
  addSwitcher();
  bindClicks();

  window.addEventListener('inkorium:daily-song-changed', syncDailySong);
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', boot, { once: true });
} else {
  boot();
}
