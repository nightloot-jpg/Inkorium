import './profile-music-diary-view.css';

const ROOT_SELECTOR = '.profile-view-page .profile-music-final';
const SWITCHER_CLASS = 'profile-music-diary-view-switcher';
let currentView: 'library' | 'diary' = 'library';
let syncing = false;

function findLayout(): HTMLElement | null {
  return document.querySelector<HTMLElement>(ROOT_SELECTOR);
}

function findSwitcher(): HTMLElement | null {
  return document.querySelector<HTMLElement>(`.profile-view-page .${SWITCHER_CLASS}`);
}

function createSwitcher(layout: HTMLElement): HTMLElement {
  const existing = findSwitcher();
  if (existing) return existing;

  const switcher = document.createElement('div');
  switcher.className = SWITCHER_CLASS;
  switcher.setAttribute('role', 'tablist');
  switcher.innerHTML = `
    <div class="profile-music-diary-view-copy">
      <span>ESPACIO MUSICAL</span>
      <strong>Música</strong>
    </div>
    <div class="profile-music-diary-view-actions">
      <button type="button" role="tab" aria-selected="true" data-diary-view="library">Mi música</button>
      <button type="button" role="tab" aria-selected="false" data-diary-view="diary">Diario musical</button>
    </div>`;

  layout.parentElement?.insertBefore(switcher, layout);
  switcher.addEventListener('click', event => {
    const button = (event.target as HTMLElement).closest<HTMLButtonElement>('[data-diary-view]');
    if (!button) return;
    currentView = button.dataset.diaryView === 'diary' ? 'diary' : 'library';
    applyView();
  });
  return switcher;
}

function removeDiaryAddMusicActions(layout: HTMLElement) {
  if (currentView !== 'diary') return;

  const candidates = Array.from(layout.querySelectorAll<HTMLElement>('button, a, [role="button"]'));
  candidates.forEach(element => {
    const text = element.textContent?.replace(/\s+/g, ' ').trim().toLowerCase() || '';
    if (text === 'añadir música' || text === '＋ añadir música' || text === '+ añadir música') {
      element.remove();
    }
  });

  layout.querySelectorAll<HTMLElement>('[data-music-action="add"], [data-music-action="save"]')
    .forEach(element => element.remove());
}

function applyView() {
  const layout = findLayout();
  if (!layout) return;
  const switcher = createSwitcher(layout);
  const main = layout.querySelector<HTMLElement>('.profile-music-final-main');
  const side = layout.querySelector<HTMLElement>('.profile-music-final-side');
  const cards = side ? Array.from(side.querySelectorAll<HTMLElement>(':scope > .profile-music-final-card')) : [];
  const diaryCard = cards.find(card => card.querySelector('h2')?.textContent?.includes('Diario musical')) || null;
  const dailySongCard = cards.find(card => card.querySelector('h2')?.textContent?.includes('Canción del día')) || null;

  layout.classList.toggle('music-diary-view', currentView === 'diary');
  layout.classList.toggle('music-library-view', currentView === 'library');
  layout.dataset.musicView = currentView;

  main?.classList.toggle('profile-music-diary-view-hidden', currentView === 'diary');
  if (side) side.style.display = currentView === 'diary' ? 'block' : '';
  if (diaryCard) diaryCard.style.display = currentView === 'diary' ? 'block' : 'none';
  if (dailySongCard) dailySongCard.style.display = currentView === 'diary' ? 'none' : '';

  removeDiaryAddMusicActions(layout);

  switcher.querySelectorAll<HTMLButtonElement>('[data-diary-view]').forEach(button => {
    const active = button.dataset.diaryView === currentView;
    button.classList.toggle('active', active);
    button.setAttribute('aria-selected', String(active));
  });
}

function scheduleApply() {
  if (syncing) return;
  syncing = true;
  requestAnimationFrame(() => {
    syncing = false;
    const layout = findLayout();
    if (!layout) return;
    createSwitcher(layout);
    applyView();
  });
}

function boot() {
  const observer = new MutationObserver(() => {
    scheduleApply();
  });
  observer.observe(document.body, { childList: true, subtree: true });

  window.addEventListener('inkorium:daily-song-changed', () => scheduleApply());
  scheduleApply();
  window.setTimeout(scheduleApply, 250);
  window.setTimeout(scheduleApply, 1000);
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', boot, { once: true });
} else {
  boot();
}