import { supabase } from '../../lib/supabase';
import { usePlayerStore } from '../../lib/store';
import './profile-music-tab.css';

type Track = { id: string; title: string; artist: string | null; cover_url: string | null; youtube_id: string | null; source_type: string; album: string | null; duration: number | null };
type Playlist = { id: string; name: string; cover_url: string | null; description: string | null };

type ProfileMusicState = { profileId: string; active: boolean; originalGrid?: string; root?: HTMLElement; interval?: number; rendering?: boolean };

const state: ProfileMusicState = { profileId: '', active: false, rendering: false };
const MUSIC_MODE_ATTR = 'data-profile-music-mode';

const esc = (value: unknown) => String(value ?? '').replace(/[&<>\"']/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '\"': '&quot;', "'": '&#39;' }[ch] || ch));
const coverFor = (track: Track | null) => track?.cover_url || (track?.youtube_id ? `https://i.ytimg.com/vi/${track.youtube_id}/hqdefault.jpg` : '');
const time = (seconds: number | null | undefined) => { const total = Math.max(0, Math.floor(Number(seconds) || 0)); return `${Math.floor(total / 60)}:${String(total % 60).padStart(2, '0')}`; };
const playTrack = (track: Track | null) => { if (!track) return; const player = usePlayerStore.getState(); player.playSong({ type: track.source_type === 'youtube' ? 'youtube_song' : 'local_song', video_id: track.youtube_id || undefined, title: track.title, artist: track.artist || undefined, channel_title: track.artist || undefined, thumbnail: coverFor(track) } as any, false); };

async function resolveProfileId(root: HTMLElement) {
  const handle = root.querySelector('.profile-view-handle')?.textContent?.trim().replace(/^@/, '') || '';
  const session = await supabase.auth.getSession();
  if (session.data.session?.user?.id) {
    const own = await supabase.from('profiles').select('id,username').eq('id', session.data.session.user.id).maybeSingle();
    if (own.data?.username === handle || !handle) return own.data.id as string;
  }
  if (!handle) return session.data.session?.user?.id || '';
  const { data } = await supabase.from('profiles').select('id').eq('username', handle).maybeSingle();
  return data?.id || '';
}

async function fetchTracks(ids: string[]) {
  if (!ids.length) return new Map<string, Track>();
  const { data } = await supabase.from('music_tracks').select('id,title,artist,cover_url,youtube_id,source_type,album,duration').in('id', ids);
  return new Map<string, Track>(((data || []) as Track[]).map(track => [track.id, track]));
}

async function renderMusic(root: HTMLElement) {
  if (state.rendering) return;
  state.rendering = true;
  state.root = root;
  if (!state.originalGrid) state.originalGrid = root.querySelector('.profile-view-grid')?.innerHTML || '';
  state.active = true;
  root.setAttribute(MUSIC_MODE_ATTR, '1');

  const profileId = state.profileId || await resolveProfileId(root);
  state.profileId = profileId;
  if (!profileId) { state.rendering = false; return; }

  const [favoritesResult, dayResult, activitiesResult, playlistsResult] = await Promise.all([
    supabase.from('music_favorites').select('id,track_id,created_at').eq('user_id', profileId).order('created_at', { ascending: false }).limit(16),
    supabase.from('profile_song_of_day').select('id,track_id,updated_at').eq('user_id', profileId).maybeSingle(),
    supabase.from('music_activity').select('id,track_id,action,created_at').eq('user_id', profileId).order('created_at', { ascending: false }).limit(8),
    supabase.from('music_playlists').select('id,name,cover_url,description').eq('user_id', profileId).eq('is_public', true).order('created_at', { ascending: false }).limit(4),
  ]);

  const favoriteRows = favoritesResult.data || [];
  const activityRows = activitiesResult.data || [];
  const ids = Array.from(new Set([...favoriteRows.map((row: any) => row.track_id), dayResult.data?.track_id, ...activityRows.map((row: any) => row.track_id)].filter(Boolean)));
  const trackMap = await fetchTracks(ids as string[]);
  const favorites = favoriteRows.map((row: any) => trackMap.get(row.track_id)).filter(Boolean) as Track[];
  const dayTrack = dayResult.data?.track_id ? trackMap.get(dayResult.data.track_id) || null : null;
  const activities = activityRows.map((row: any) => ({ ...row, track: trackMap.get(row.track_id) || null })).filter((row: any) => row.track);
  const playlists = (playlistsResult.data || []) as Playlist[];
  const artists = Array.from(new Map(favorites.filter(track => track.artist).map(track => [track.artist, track])).values()).slice(0, 4);
  const albums = Array.from(new Map(favorites.filter(track => track.album).map(track => [`${track.album}|${track.artist}`, track])).values()).slice(0, 4);
  const current = usePlayerStore.getState().currentSong;

  const grid = root.querySelector('.profile-view-grid');
  if (!grid) { state.rendering = false; return; }
  grid.innerHTML = `<div class="profile-music-tab">
    <div class="profile-music-wrap">
      <div class="profile-music-main">
        <section class="profile-music-card profile-music-highlight">
          <div class="profile-music-section-head"><div><h2>🎵 Mi música</h2><p class="profile-music-card-sub">Canciones, artistas y recuerdos que forman parte de tu perfil.</p></div><button class="profile-music-add" data-music-action="add">＋ Añadir música</button></div>
          <div class="profile-music-now" data-music-now>
            ${current ? `<img class="profile-music-cover" src="${esc(current.thumbnail || '')}" alt=""><div class="profile-music-now-copy"><span class="profile-music-now-title">${esc(current.title)}</span><span class="profile-music-now-artist">${esc(current.artist || current.channel_title || 'Inkorium')}</span><div class="profile-music-progress"><span style="width:0%"></span></div><div class="profile-music-time"><span data-now-time>0:00</span><span data-now-duration>${time(usePlayerStore.getState().duration)}</span></div></div><div class="profile-music-now-actions"><button class="profile-music-play" data-music-action="toggle" aria-label="Reproducir o pausar">${usePlayerStore.getState().isPlaying ? '❚❚' : '▶'}</button></div>` : `<div class="profile-music-now-copy" style="grid-column:1/-1"><span class="profile-music-now-title">Nada reproduciéndose ahora</span><span class="profile-music-now-artist">Empieza a escuchar una canción para verla aquí.</span></div>`}
          </div>
        </section>
        <section class="profile-music-card"><div class="profile-music-section-head"><div><h2>🌙 Canción del día</h2><p class="profile-music-card-sub">La canción que quieres dejar como parte de tu perfil.</p></div></div>${dayTrack ? `<div class="profile-music-song-day"><img class="profile-music-cover" src="${esc(coverFor(dayTrack))}" alt=""><div><div class="profile-music-track-title">${esc(dayTrack.title)}</div><div class="profile-music-track-artist">${esc(dayTrack.artist || 'Artista desconocido')}</div><span class="profile-music-mini-label">Canción del día</span></div><div class="profile-music-action-row"><button class="profile-music-small-play" data-track-id="${dayTrack.id}" aria-label="Reproducir">▶</button></div></div>` : `<div class="profile-music-empty">Todavía no has elegido una canción del día.</div>`}</section>
        <section class="profile-music-card"><div class="profile-music-section-head"><div><h2>Artistas favoritos</h2><p class="profile-music-card-sub">Los artistas que más aparecen en tu música.</p></div></div>${artists.length ? `<div class="profile-music-grid-4">${artists.map(track => `<div class="profile-music-grid-artist"><img class="profile-music-avatar" src="${esc(coverFor(track))}" alt=""><span class="profile-music-artist-name">${esc(track.artist)}</span><button class="profile-music-text-btn" data-track-id="${track.id}">Escuchar</button></div>`).join('')}</div>` : `<div class="profile-music-empty">Añade algunas canciones a favoritos para crear tu lista de artistas.</div>`}</section>
        <section class="profile-music-card"><div class="profile-music-section-head"><div><h2>Álbumes destacados</h2><p class="profile-music-card-sub">Una selección de tus álbumes favoritos.</p></div></div>${albums.length ? `<div class="profile-music-grid-4">${albums.map(track => `<div class="profile-music-album"><img src="${esc(coverFor(track))}" alt=""><span class="profile-music-album-title">${esc(track.album)}</span><span class="profile-music-album-artist">${esc(track.artist || '')}</span></div>`).join('')}</div>` : `<div class="profile-music-empty">Tus álbumes destacados aparecerán cuando guardes música con álbum.</div>`}</section>
        <section class="profile-music-card"><div class="profile-music-section-head"><div><h2>Últimas canciones</h2><p class="profile-music-card-sub">Tu pequeña historia musical.</p></div></div>${activities.length ? `<div class="profile-music-list">${activities.slice(0,6).map((row:any) => `<div class="profile-music-list-row"><img class="profile-music-list-cover" src="${esc(coverFor(row.track))}" alt=""><div><div class="profile-music-track-title">${esc(row.track.title)}</div><div class="profile-music-track-artist">${esc(row.track.artist || 'Artista desconocido')} · ${row.action === 'listened' ? 'Escuchada' : row.action === 'shared' ? 'Compartida' : row.action === 'saved' ? 'Guardada' : 'Playlist'}</div></div><button class="profile-music-small-play" data-track-id="${row.track.id}" aria-label="Reproducir">▶</button></div>`).join('')}</div>` : `<div class="profile-music-empty">Aquí aparecerán tus últimas canciones escuchadas, compartidas o guardadas.</div>`}</section>
      </div>
      <aside class="profile-music-side">
        <section class="profile-music-card profile-music-side-card"><div class="profile-music-side-title">🎶 Tu gusto musical</div><p class="profile-music-card-sub">Tus favoritos se convierten en pequeñas pistas sobre quién eres.</p><div class="profile-music-pill-row">${Array.from(new Set(favorites.filter(t => t.artist).map(t => t.artist))).slice(0,8).map(a => `<span class="profile-music-pill">${esc(a)}</span>`).join('') || '<span class="profile-music-pill">Sin artistas todavía</span>'}</div></section>
        <section class="profile-music-card profile-music-side-card"><div class="profile-music-side-title">📚 Playlists</div>${playlists.length ? playlists.map(p => `<div class="profile-music-side-row"><img class="profile-music-side-thumb" src="${esc(p.cover_url || '')}" alt=""><div class="profile-music-side-copy"><strong>${esc(p.name)}</strong><small>${esc(p.description || 'Playlist pública')}</small></div></div>`).join('') : '<div class="profile-music-empty">Todavía no hay playlists públicas.</div>'}</section>
        <section class="profile-music-card profile-music-side-card"><div class="profile-music-side-title">💜 Un detalle musical</div><p class="profile-music-card-sub">La música que compartes y guardas se queda como parte de tu identidad en Inkorium.</p></section>
      </aside>
    </div>
  </div>`;

  const musicTab = root.querySelector('.profile-music-tab') as HTMLElement | null;
  musicTab?.addEventListener('click', event => {
    const target = event.target as HTMLElement;
    const trackButton = target.closest<HTMLElement>('[data-track-id]');
    if (trackButton) { const track = trackMap.get(trackButton.dataset.trackId || ''); playTrack(track || null); return; }
    const action = target.closest<HTMLElement>('[data-music-action]')?.dataset.musicAction;
    if (action === 'toggle') { const player = usePlayerStore.getState(); if (player.isPlaying || player.pendingPlay) player.pause(); else if (player.currentSong) player.resume(); }
    if (action === 'add') window.location.href = '/music';
  });
  state.rendering = false;
}

function restoreGrid(root: HTMLElement) { state.active = false; root.removeAttribute(MUSIC_MODE_ATTR); const grid = root.querySelector('.profile-view-grid'); if (grid && state.originalGrid !== undefined) grid.innerHTML = state.originalGrid; }

function bind() { const root = document.querySelector<HTMLElement>('.profile-view-page'); if (!root) return; const tabs = root.querySelectorAll<HTMLButtonElement>('.profile-view-tabs button'); tabs.forEach(tab => { if (tab.dataset.musicBound === '1') return; tab.dataset.musicBound = '1'; tab.addEventListener('click', async () => { const label = tab.textContent?.trim(); if (label === 'Música') await renderMusic(root); else if (state.active) restoreGrid(root); }, true); }); }
function boot() { bind(); const observer = new MutationObserver(() => { bind(); if (state.active && !document.querySelector('.profile-music-tab') && state.root) renderMusic(state.root); }); observer.observe(document.body, { childList: true, subtree: true }); }
if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot, { once: true }); else boot();