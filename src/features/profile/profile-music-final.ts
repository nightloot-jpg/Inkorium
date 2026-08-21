import { supabase } from '../../lib/supabase';
import { usePlayerStore } from '../../lib/store';
import './profile-music-final.css';

type Track = { id: string; title: string; artist: string | null; cover_url: string | null; youtube_id: string | null; source_type: string; album?: string | null; user_id?: string | null };
type Playlist = { id: string; name: string; cover_url: string | null; description: string | null; is_public?: boolean };
type DiaryEntry = { id: string; entry_date: string; track_id: string; track?: Track | null };

let activeRoot: HTMLElement | null = null;
let rendering = false;
let queued = false;

const esc = (value: unknown) => String(value ?? '').replace(/[&<>\"']/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '\"': '&quot;', "'": '&#39;' }[ch] || ch));
const coverFor = (track?: Track | null) => track?.cover_url || (track?.youtube_id ? `https://i.ytimg.com/vi/${track.youtube_id}/hqdefault.jpg` : '');
const player = () => usePlayerStore.getState();
const playTrack = (track?: Track | null) => {
  if (!track) return;
  player().playSong({ type: track.source_type === 'youtube' ? 'youtube_song' : 'local_song', video_id: track.youtube_id || undefined, title: track.title, artist: track.artist || undefined, channel_title: track.artist || undefined, thumbnail: coverFor(track) } as any, false);
};
const dateParts = (value: string) => {
  const d = new Date(`${value}T12:00:00`);
  return { day: String(d.getDate()).padStart(2, '0'), month: d.toLocaleDateString('es-ES', { month: 'short' }).replace('.', '').toUpperCase(), year: d.getFullYear() };
};

async function resolveProfile(root: HTMLElement) {
  const handle = root.querySelector('.profile-view-handle')?.textContent?.trim().replace(/^@/, '') || '';
  const session = await supabase.auth.getSession();
  const ownId = session.data.session?.user?.id || '';
  if (!handle) return { id: ownId, own: true };
  const { data } = await supabase.from('profiles').select('id,username').eq('username', handle).maybeSingle();
  return { id: data?.id || '', own: data?.id === ownId };
}

async function load(profileId: string) {
  const [tracksResult, favoritesResult, playlistsResult, diaryRowsResult] = await Promise.all([
    supabase.from('music_tracks').select('id,title,artist,cover_url,youtube_id,source_type,album,user_id').eq('user_id', profileId).order('created_at', { ascending: false }).limit(100),
    supabase.from('music_favorites').select('track_id,created_at').eq('user_id', profileId).order('created_at', { ascending: false }).limit(100),
    supabase.from('music_playlists').select('id,name,cover_url,description,is_public').eq('user_id', profileId).order('created_at', { ascending: false }).limit(30),
    supabase.from('profile_music_diary').select('id,entry_date,track_id').eq('user_id', profileId).order('entry_date', { ascending: false }).limit(20),
  ]);

  const tracks = (tracksResult.data || []) as Track[];
  const favoriteIds = new Set<string>((favoritesResult.data || []).map((row: any) => row.track_id).filter(Boolean));
  const diaryRows = (diaryRowsResult.data || []) as DiaryEntry[];
  const missingDiaryIds = Array.from(new Set(diaryRows.map(entry => entry.track_id).filter(id => !tracks.some(track => track.id === id))));
  let extra: Track[] = [];
  if (missingDiaryIds.length) {
    const { data } = await supabase.from('music_tracks').select('id,title,artist,cover_url,youtube_id,source_type,album,user_id').in('id', missingDiaryIds);
    extra = (data || []) as Track[];
  }
  const map = new Map<string, Track>(); [...tracks, ...extra].forEach(track => map.set(track.id, track));
  const diary = diaryRows.map(entry => ({ ...entry, track: map.get(entry.track_id) || null })).filter(entry => entry.track) as DiaryEntry[];
  const favorites = Array.from(favoriteIds).map(id => map.get(id)).filter(Boolean) as Track[];
  return { tracks, favorites, favoriteIds, playlists: (playlistsResult.data || []) as Playlist[], diary };
}

function finalRow(track: Track, favoriteIds: Set<string>, own: boolean) {
  const ownTrack = own && track.user_id === undefined ? true : own && track.user_id === track.user_id;
  const active = favoriteIds.has(track.id);
  return `<div class="profile-music-final-row"><img src="${esc(coverFor(track))}" alt=""><div><strong>${esc(track.title)}</strong><small>${esc(track.artist || 'Artista desconocido')}${track.album ? ` · ${esc(track.album)}` : ''}</small></div><div class="profile-music-final-actions"><button type="button" data-final-play="${esc(track.id)}" aria-label="Reproducir">▶</button>${own ? `<button type="button" class="${active ? 'active' : ''}" data-favorite-id="${esc(track.id)}" aria-label="Favorito">♥</button>${ownTrack ? `<button type="button" data-edit-track="${esc(track.id)}" aria-label="Editar">✎</button>` : ''}` : ''}</div></div>`;
}

function playlistCard(p: Playlist, own: boolean) {
  return `<div class="profile-music-final-playlist"><h3>${esc(p.name)}</h3><p>${esc(p.description || 'Playlist pública')}</p>${own ? `<div class="profile-music-final-actions"><button type="button" data-playlist-add="${esc(p.id)}">＋</button><button type="button" data-edit-playlist="${esc(p.id)}">✎</button><button type="button" data-delete-playlist="${esc(p.id)}">×</button></div>` : ''}</div>`;
}

function diaryRow(entry: DiaryEntry) {
  const date = dateParts(entry.entry_date);
  return `<div class="profile-music-final-diary-entry"><div class="profile-music-final-diary-date"><span class="profile-music-final-diary-day">${date.day}</span><span class="profile-music-final-diary-month">${date.month} ${date.year}</span></div><div class="profile-music-final-diary-entry-main"><img src="${esc(coverFor(entry.track))}" alt=""><div><strong>${esc(entry.track?.title)}</strong><small>${esc(entry.track?.artist || 'Artista desconocido')}</small></div></div><button type="button" class="profile-music-final-diary-play" data-diary-play="${esc(entry.track_id)}" aria-label="Reproducir">▶</button></div>`;
}

async function reorganize(root: HTMLElement) {
  if (!root.querySelector('.profile-music-tab') || rendering) return;
  const tab = root.querySelector<HTMLElement>('.profile-music-tab');
  if (!tab || tab.dataset.finalized === '1') return;
  rendering = true;
  try {
    const resolved = await resolveProfile(root);
    if (!resolved.id) return;
    const data = await load(resolved.id);
    const current = player().currentSong;
    const favoriteArtists = Array.from(new Map(data.favorites.filter(track => track.artist).map(track => [track.artist!, track])).values()).slice(0, 8);
    const own = resolved.own;

    tab.dataset.finalized = '1';
    tab.innerHTML = `<div class="profile-music-final">
      <main class="profile-music-final-main">
        <section class="profile-music-final-card">
          <div class="profile-music-final-head"><div><h2>🎵 Mi música</h2><p class="profile-music-final-card-sub">Tus canciones favoritas y la música que has guardado.</p></div>${own ? '<button type="button" class="profile-music-final-primary" data-music-action="add">＋ Añadir música</button>' : ''}</div>
          ${current ? `<div class="profile-music-final-now"><img class="profile-music-final-cover" src="${esc(current.thumbnail || '')}" alt=""><div class="profile-music-final-now-copy"><div class="profile-music-final-title">${esc(current.title)}</div><div class="profile-music-final-artist">${esc(current.artist || current.channel_title || 'Inkorium')}</div></div><button type="button" class="profile-music-final-play" data-final-now>${player().isPlaying ? '❚❚' : '▶'}</button></div>` : ''}
          <div class="profile-music-final-list">${data.favorites.length ? data.favorites.slice(0, 30).map(track => finalRow(track, data.favoriteIds, own)).join('') : '<div class="profile-music-final-empty">Todavía no tienes canciones favoritas. Añade música desde YouTube.</div>'}</div>
        </section>
        <section class="profile-music-final-card">
          <div class="profile-music-final-head"><div><h2>📚 Playlists</h2><p class="profile-music-final-card-sub">Tus colecciones para ordenar la música a tu manera.</p></div>${own ? '<button type="button" class="profile-music-final-link" data-music-action="new-playlist">＋ Nueva</button>' : ''}</div>
          <div class="profile-music-final-playlists">${data.playlists.length ? data.playlists.map(p => playlistCard(p, own)).join('') : '<div class="profile-music-final-empty">Todavía no tienes playlists.</div>'}</div>
        </section>
        <section class="profile-music-final-card">
          <div class="profile-music-final-head"><div><h2>🎤 Artistas favoritos</h2><p class="profile-music-final-card-sub">Los artistas que más aparecen en tu música.</p></div></div>
          <div class="profile-music-final-artists">${favoriteArtists.length ? favoriteArtists.map(track => `<span class="profile-music-final-artist-pill"><img src="${esc(coverFor(track))}" alt="">${esc(track.artist || '')}</span>`).join('') : '<div class="profile-music-final-empty">Añade favoritos para crear tu lista.</div>'}</div>
        </section>
      </main>
      <aside class="profile-music-final-side">
        <section class="profile-music-final-card">
          <div class="profile-music-final-head"><div><h2>📖 Diario musical</h2><p class="profile-music-final-card-sub">Una canción al día, un recuerdo para cada fecha.</p></div></div>
          <div class="profile-music-final-diary">${data.diary.length ? data.diary.slice(0, 8).map(diaryRow).join('') : '<div class="profile-music-final-empty">Todavía no hay páginas en tu diario.</div>'}</div>
        </section>
        <section class="profile-music-final-card">
          <div class="profile-music-final-head"><div><h2>🎧 Canción del día</h2><p class="profile-music-final-card-sub">La que has elegido para hoy.</p></div><button type="button" class="profile-music-final-link" data-music-action="day">${data.diary[0] && data.diary[0].entry_date === new Date().toISOString().slice(0, 10) ? 'Cambiar' : 'Elegir'}</button></div>
          ${data.diary[0] && data.diary[0].entry_date === new Date().toISOString().slice(0, 10) ? diaryRow(data.diary[0]) : '<div class="profile-music-final-empty">Aún no has elegido la canción de hoy.</div>'}
        </section>
      </aside>
    </div>`;

    tab.addEventListener('click', event => {
      const target = event.target as HTMLElement;
      const playId = target.closest<HTMLElement>('[data-final-play]')?.dataset.finalPlay || target.closest<HTMLElement>('[data-diary-play]')?.dataset.diaryPlay;
      if (playId) {
        const track = [...data.tracks, ...data.diary.map(entry => entry.track).filter(Boolean) as Track[]].find(item => item?.id === playId);
        if (track) playTrack(track);
        return;
      }
      const now = target.closest<HTMLElement>('[data-final-now]');
      if (now && current) {
        if (player().isPlaying || player().pendingPlay) player().pause(); else player().resume();
      }
    }, { once: true });
  } finally {
    rendering = false;
  }
}

function schedule(root: HTMLElement) {
  activeRoot = root;
  if (queued) return;
  queued = true;
  window.setTimeout(() => { queued = false; void reorganize(root); }, 80);
}

function boot() {
  const root = document.querySelector<HTMLElement>('.profile-view-page');
  if (!root) return;
  activeRoot = root;
  const observer = new MutationObserver(() => {
    if (root.querySelector('.profile-music-tab')) schedule(root);
  });
  observer.observe(root, { childList: true, subtree: true });
  root.addEventListener('click', event => {
    const tab = (event.target as HTMLElement).closest<HTMLButtonElement>('.profile-view-tabs button');
    if (tab?.textContent?.trim() === 'Música') window.setTimeout(() => schedule(root), 160);
  }, true);
  schedule(root);
}

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot, { once: true }); else boot();
