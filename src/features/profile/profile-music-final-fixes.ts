import { supabase } from '../../lib/supabase';
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

async function playDailyFromCard(card: HTMLElement) {
  const playButton = card.querySelector<HTMLElement>('[data-diary-play]');
  const trackId = playButton?.dataset.diaryPlay;
  if (!trackId) return;

  const { data, error } = await supabase
    .from('music_tracks')
    .select('id,title,artist,cover_url,youtube_id,source_type')
    .eq('id', trackId)
    .maybeSingle();

  if (error || !data) return;

  player().playSong({
    type: data.source_type === 'youtube' ? 'youtube_song' : 'local_song',
    video_id: data.youtube_id || undefined,
    title: data.title,
    artist: data.artist || undefined,
    channel_title: data.artist || undefined,
    thumbnail: data.cover_url || (data.youtube_id ? `https://i.ytimg.com/vi/${data.youtube_id}/hqdefault.jpg` : undefined),
  } as any, false);
}

function bindClicks() {
  const root = document.querySelector<HTMLElement>(MUSIC_ROOT);
  if (!root || root.dataset.finalFixesBound === '1') return;
  root.dataset.finalFixesBound = '1';
  root.addEventListener('click', (event) => {
    const target = event.target as HTMLElement;
    const card = target.closest<HTMLElement>('.profile-music-final-side .profile-music-final-card');
    if (!card || !card.querySelector('h2')?.textContent?.includes('Canción del día')) return;
    if (target.closest('button,a,input,select,textarea')) return;
    event.preventDefault();
    void playDailyFromCard(card);
  }, true);
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
