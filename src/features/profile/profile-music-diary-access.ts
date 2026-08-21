const PROFILE_MUSIC_SELECTOR = '.profile-view-page .profile-view-tabs button';
const MUSIC_ROOT_SELECTOR = '.profile-view-page .profile-music-tab';

function clickProfileMusicTab() {
  const tab = Array.from(document.querySelectorAll<HTMLButtonElement>(PROFILE_MUSIC_SELECTOR))
    .find((button) => button.textContent?.trim() === 'Música');
  tab?.click();
}

function addDiaryAccess(root: HTMLElement) {
  if (root.querySelector('.profile-music-diary-switcher')) return;

  const switcher = document.createElement('div');
  switcher.className = 'profile-music-diary-switcher';
  switcher.innerHTML = `
    <div class="profile-music-diary-switcher-copy">
      <span class="profile-music-diary-switcher-eyebrow">TU ESPACIO MUSICAL</span>
      <strong>Música</strong>
    </div>
    <div class="profile-music-diary-switcher-actions">
      <button type="button" class="profile-music-diary-switcher-btn active" data-music-view>Mi música</button>
      <button type="button" class="profile-music-diary-switcher-btn" data-diary-view>Diario musical</button>
    </div>`;

  root.prepend(switcher);

  switcher.querySelector<HTMLButtonElement>('[data-music-view]')?.addEventListener('click', () => {
    clickProfileMusicTab();
  });

  switcher.querySelector<HTMLButtonElement>('[data-diary-view]')?.addEventListener('click', () => {
    clickProfileMusicTab();
    window.setTimeout(() => {
      const diary = document.querySelector<HTMLElement>('.profile-music-diary');
      diary?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 120);
  });
}

function addDiaryBackLink() {
  const header = document.querySelector<HTMLElement>('.profile-music-diary-header');
  if (!header || header.querySelector('[data-back-to-profile-music]')) return;

  const actions = header.querySelector<HTMLElement>('.profile-music-diary-actions');
  if (!actions) return;

  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'profile-music-diary-btn';
  button.dataset.backToProfileMusic = 'true';
  button.textContent = '← Mi música';
  button.addEventListener('click', clickProfileMusicTab);
  actions.prepend(button);
}

function boot() {
  const observer = new MutationObserver(() => {
    const root = document.querySelector<HTMLElement>(MUSIC_ROOT_SELECTOR);
    if (root) addDiaryAccess(root);
    addDiaryBackLink();
  });

  observer.observe(document.body, { childList: true, subtree: true });

  const root = document.querySelector<HTMLElement>(MUSIC_ROOT_SELECTOR);
  if (root) addDiaryAccess(root);
  addDiaryBackLink();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', boot, { once: true });
} else {
  boot();
}
