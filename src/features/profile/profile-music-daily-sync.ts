import { supabase } from '../../lib/supabase';
import { usePlayerStore } from '../../lib/store';
import './profile-music-daily-sync.css';

type Track = {
  id: string;
  title: string;
  artist: string | null;
  cover_url: string | null;
  youtube_id: string | null;
  source_type: string;
};

const dailyDate = () => {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
};

const coverFor = (track: Track) => track.cover_url || (track.youtube_id ? `https://i.ytimg.com/vi/${track.youtube_id}/hqdefault.jpg` : '');
const esc = (value: unknown) => String(value ?? '').replace(/[&<>\"']/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '\"': '&quot;', "'": '&#39;' }[ch] || ch));
const player = () => usePlayerStore.getState();

async function resolveProfile(root: HTMLElement) {
  const handle = root.querySelector('.profile-view-handle')?.textContent?.trim().replace(/^@/, '') || '';
  const session = await supabase.auth.getSession();
  const ownId = session.data.session?.user?.id || '';
  if (!handle) return { id: ownId };
  const { data } = await supabase.from('profiles').select('id').eq('username', handle).maybeSingle();
  return { id: data?.id || '' };
}

async function loadTodayTrack(root: HTMLElement): Promise<Track | null> {
  const profile = await resolveProfile(root);
  if (!profile.id) return null;

  const { data, error } = await supabase
    .from('profile_music_diary')
    .select('track_id, music_tracks(id,title,artist,cover_url,youtube_id,source_type)')
    .eq('user_id', profile.id)
    .eq('entry_date', dailyDate())
    .maybeSingle();

  if (error || !data) return null;
  return ((data as any).music_tracks || null) as Track | null;
}

function playTrack(track: Track) {
  player().playSong({
    type: track.source_type === 'youtube' ? 'youtube_song' : 'local_song',
    video_id: track.youtube_id || undefined,
    title: track.title,
    artist: track.artist || undefined,
    channel_title: track.artist || undefined,
    thumbnail: coverFor(track),
  } as any, false);
}

function findMusicRoot(): HTMLElement | null {
  return document.querySelector<HTMLElement>('.profile-view-page .profile-music-final, .profile-view-page .profile-music-tab');
}

function findDailyCard(root: HTMLElement): HTMLElement | null {
  return Array.from(root.querySelectorAll<HTMLElement>('.profile-music-final-side .profile-music-final-card, section, article, div'))
    .find(card => card.querySelector('h2')?.textContent?.includes('Canción del día')) || null;
}

function findDiaryTarget(root: HTMLElement): HTMLElement | null {
  const modern = Array.from(root.querySelectorAll<HTMLElement>('.profile-music-final-side .profile-music-final-card'))
    .find(card => card.querySelector('h2')?.textContent?.includes('Diario musical'));
  if (modern) return modern;
  const heading = Array.from(root.querySelectorAll<HTMLElement>('h1,h2,h3,strong,span,div'))
    .find(el => el.textContent?.trim() === 'Diario musical');
  return heading?.closest('section,article,.profile-music-tab>div,.profile-music-tab') || heading || null;
}

function renderDailyCard(card: HTMLElement, track: Track | null) {
  const content = track
    ? `<div class="profile-music-daily-sync-daily-row" data-daily-sync-track="${esc(track.id)}">
        <img src="${esc(coverFor(track))}" alt="">
        <div><strong>${esc(track.title)}</strong><small>${esc(track.artist || 'Artista desconocido')}</small></div>
        <button type="button" class="profile-music-daily-sync-play" aria-label="Reproducir en el reproductor global">▶</button>
      </div>`
    : '<div class="profile-music-daily-sync-empty">Aún no has elegido la canción de hoy.</div>';

  const body = card.querySelector<HTMLElement>('.profile-music-daily-sync-body');
  if (body) {
    body.innerHTML = content;
    return;
  }

  card.dataset.dailySyncCard = '1';
  const existing = card.querySelector('.profile-music-final-diary-entry');
  const holder = document.createElement('div');
  holder.className = 'profile-music-daily-sync-body';
  holder.innerHTML = content;
  if (existing) existing.replaceWith(holder);
  else card.appendChild(holder);
}

function addSwitcher(root: HTMLElement) {
  if (root.querySelector('.profile-music-daily-sync-restore-switcher')) return;

  const switcher = document.createElement('div');
  switcher.className = 'profile-music-daily-sync-restore-switcher';
  switcher.innerHTML = `
    <div class="profile-music-daily-sync-restore-copy">
      <span>ESPACIO MUSICAL</span>
      <strong>Música</strong>
    </div>
    <div class="profile-music-daily-sync-restore-actions" role="tablist" aria-label="Secciones musicales">
      <button type="button" class="active" data-daily-view="library">Mi música</button>
      <button type="button" data-daily-view="diary">Diario musical</button>
    </div>`;

  root.prepend(switcher);

  const library = switcher.querySelector<HTMLButtonElement>('[data-daily-view="library"]');
  const diary = switcher.querySelector<HTMLButtonElement>('[data-daily-view="diary"]');
  const activate = (button: HTMLButtonElement) => {
    switcher.querySelectorAll('[data-daily-view]').forEach(item => item.classList.remove('active'));
    button.classList.add('active');
  };

  library?.addEventListener('click', () => {
    activate(library);
    root.scrollIntoView({ behavior: 'smooth', block: 'start' });
  });

  diary?.addEventListener('click', () => {
    activate(diary!);
    findDiaryTarget(root)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  });
}

function ensureUi() {
  const root = findMusicRoot();
  if (!root) return;
  addSwitcher(root);
  bindDailyPlayback(root);
  const page = document.querySelector<HTMLElement>('.profile-view-page');
  if (page) bindMusicTab(page);
}

let syncing = false;
let scheduled = false;

async function syncProfileMusic() {
  const root = findMusicRoot();
  const page = document.querySelector<HTMLElement>('.profile-view-page');
  if (!root || !page) return;
  ensureUi();
  if (syncing) return;

  syncing = true;
  try {
    const dailyCard = findDailyCard(root);
    const track = await loadTodayTrack(page);
    if (dailyCard) renderDailyCard(dailyCard, track);
  } finally {
    syncing = false;
    // The music tab can replace its DOM after the async load. Re-attach the switcher after every render pass.
    requestAnimationFrame(() => ensureUi());
    window.setTimeout(() => ensureUi(), 250);
    window.setTimeout(() => ensureUi(), 900);
  }
}

function scheduleSync(delay = 80) {
  if (scheduled) return;
  scheduled = true;
  window.setTimeout(() => {
    scheduled = false;
    void syncProfileMusic();
  }, delay);
}

function bindDailyPlayback(root: HTMLElement) {
  if (root.dataset.dailySyncBound === '1') return;
  root.dataset.dailySyncBound = '1';
  root.addEventListener('click', event => {
    const target = event.target as HTMLElement;
    const row = target.closest<HTMLElement>('[data-daily-sync-track]');
    if (!row) return;
    event.preventDefault();
    event.stopPropagation();
    const page = document.querySelector<HTMLElement>('.profile-view-page');
    if (!page) return;
    void loadTodayTrack(page).then(track => {
      if (track) playTrack(track);
    });
  }, true);
}

function bindMusicTab(page: HTMLElement) {
  if (page.dataset.dailySyncTabBound === '1') return;
  page.dataset.dailySyncTabBound = '1';
  page.addEventListener('click', event => {
    const tab = (event.target as HTMLElement).closest<HTMLButtonElement>('.profile-view-tabs button');
    if (tab?.textContent?.trim() === 'Música') scheduleSync(120);
  }, true);
}

function boot() {
  const observer = new MutationObserver(() => {
    // Never gate UI restoration behind the async Supabase request. The profile music DOM is rebuilt several times.
    ensureUi();
  });

  observer.observe(document.body, { childList: true, subtree: true });
  window.addEventListener('inkorium:daily-song-changed', () => scheduleSync(50));
  scheduleSync(120);
  window.setTimeout(() => ensureUi(), 300);
  window.setTimeout(() => ensureUi(), 1000);
}

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot, { once: true });
else boot();