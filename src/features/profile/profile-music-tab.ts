import { supabase } from '../../lib/supabase';
import { usePlayerStore } from '../../lib/store';
import './profile-music-tab.css';

type Track = { id: string; title: string; artist: string | null; cover_url: string | null; youtube_id: string | null; source_type: string; album: string | null; duration: number | null; user_id?: string | null };
type Playlist = { id: string; name: string; cover_url: string | null; description: string | null; is_public?: boolean };
type Activity = { id: string; track_id: string; action: string; created_at: string; track?: Track | null };

type ProfileMusicState = {
  profileId: string;
  isOwn: boolean;
  active: boolean;
  originalGrid?: string;
  root?: HTMLElement;
  rendering?: boolean;
  tracks: Track[];
  favoriteIds: Set<string>;
  dayTrackId: string | null;
  playlists: Playlist[];
};

const state: ProfileMusicState = { profileId: '', isOwn: false, active: false, rendering: false, tracks: [], favoriteIds: new Set(), dayTrackId: null, playlists: [] };
const MUSIC_MODE_ATTR = 'data-profile-music-mode';

const esc = (value: unknown) => String(value ?? '').replace(/[&<>\"']/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '\"': '&quot;', "'": '&#39;' }[ch] || ch));
const coverFor = (track: Track | null | undefined) => track?.cover_url || (track?.youtube_id ? `https://i.ytimg.com/vi/${track.youtube_id}/hqdefault.jpg` : '');
const time = (seconds: number | null | undefined) => { const total = Math.max(0, Math.floor(Number(seconds) || 0)); return `${Math.floor(total / 60)}:${String(total % 60).padStart(2, '0')}`; };
const currentPlayer = () => usePlayerStore.getState();
const playTrack = (track: Track | null | undefined) => { if (!track) return; const player = currentPlayer(); player.playSong({ type: track.source_type === 'youtube' ? 'youtube_song' : 'local_song', video_id: track.youtube_id || undefined, title: track.title, artist: track.artist || undefined, channel_title: track.artist || undefined, thumbnail: coverFor(track) } as any, false); };

async function resolveProfile(root: HTMLElement) {
  const handle = root.querySelector('.profile-view-handle')?.textContent?.trim().replace(/^@/, '') || '';
  const session = await supabase.auth.getSession();
  const ownId = session.data.session?.user?.id || '';
  if (ownId && (!handle || handle === (await supabase.from('profiles').select('username').eq('id', ownId).maybeSingle()).data?.username)) return { id: ownId, own: true };
  if (!handle) return { id: ownId, own: true };
  const { data } = await supabase.from('profiles').select('id').eq('username', handle).maybeSingle();
  return { id: data?.id || '', own: data?.id === ownId };
}

async function loadData(profileId: string) {
  const [tracksResult, favoritesResult, dayResult, activityResult, playlistsResult] = await Promise.all([
    supabase.from('music_tracks').select('id,title,artist,cover_url,youtube_id,source_type,album,duration,user_id').eq('user_id', profileId).order('created_at', { ascending: false }).limit(60),
    supabase.from('music_favorites').select('track_id,created_at').eq('user_id', profileId).order('created_at', { ascending: false }).limit(60),
    supabase.from('profile_song_of_day').select('track_id').eq('user_id', profileId).maybeSingle(),
    supabase.from('music_activity').select('id,track_id,action,created_at').eq('user_id', profileId).order('created_at', { ascending: false }).limit(12),
    supabase.from('music_playlists').select('id,name,cover_url,description,is_public').eq('user_id', profileId).order('created_at', { ascending: false }).limit(20),
  ]);

  const ownTracks = (tracksResult.data || []) as Track[];
  const favoriteIds = new Set<string>((favoritesResult.data || []).map((row: any) => row.track_id).filter(Boolean));
  const extraIds = Array.from(new Set([...(favoritesResult.data || []).map((row: any) => row.track_id), ...(activityResult.data || []).map((row: any) => row.track_id), dayResult.data?.track_id].filter(Boolean))) as string[];
  const missingIds = extraIds.filter(id => !ownTracks.some(track => track.id === id));
  let extraTracks: Track[] = [];
  if (missingIds.length) {
    const { data } = await supabase.from('music_tracks').select('id,title,artist,cover_url,youtube_id,source_type,album,duration,user_id').in('id', missingIds);
    extraTracks = (data || []) as Track[];
  }

  const byId = new Map<string, Track>();
  [...ownTracks, ...extraTracks].forEach(track => byId.set(track.id, track));
  const tracks = Array.from(byId.values());
  const activities = (activityResult.data || []).map((row: any) => ({ ...row, track: byId.get(row.track_id) || null })) as Activity[];
  state.tracks = tracks;
  state.favoriteIds = favoriteIds;
  state.dayTrackId = dayResult.data?.track_id || null;
  state.playlists = (playlistsResult.data || []) as Playlist[];
  return { tracks, activities, dayTrack: state.dayTrackId ? byId.get(state.dayTrackId) || null : null };
}

async function ensureFavorite(trackId: string) {
  const { error } = await supabase.from('music_favorites').upsert({ user_id: state.profileId, track_id: trackId }, { onConflict: 'user_id,track_id' });
  if (error) throw error;
  state.favoriteIds.add(trackId);
}

async function toggleFavorite(trackId: string) {
  if (!state.isOwn) return;
  if (state.favoriteIds.has(trackId)) {
    const { error } = await supabase.from('music_favorites').delete().eq('user_id', state.profileId).eq('track_id', trackId);
    if (error) throw error;
    state.favoriteIds.delete(trackId);
  } else {
    await ensureFavorite(trackId);
  }
}

async function saveYoutubeTrack(video: { youtube_id: string; title: string; artist: string; cover_url: string }, asDay = false) {
  const existing = state.tracks.find(track => track.user_id === state.profileId && track.youtube_id === video.youtube_id);
  let trackId = existing?.id;
  if (!trackId) {
    const { data, error } = await supabase.from('music_tracks').insert({ user_id: state.profileId, title: video.title, artist: video.artist, cover_url: video.cover_url, youtube_id: video.youtube_id, source_type: 'youtube' }).select('id,title,artist,cover_url,youtube_id,source_type,album,duration,user_id').single();
    if (error) throw error;
    trackId = data.id;
  }
  if (asDay) await setSongOfDay(trackId);
  else await ensureFavorite(trackId);
  return trackId;
}

async function setSongOfDay(trackId: string) {
  if (!state.isOwn) return;
  const { error } = await supabase.from('profile_song_of_day').upsert({ user_id: state.profileId, track_id: trackId, updated_at: new Date().toISOString() }, { onConflict: 'user_id' });
  if (error) throw error;
  state.dayTrackId = trackId;
}

async function removeTrack(trackId: string) {
  if (!state.isOwn) return;
  await supabase.from('music_favorites').delete().eq('user_id', state.profileId).eq('track_id', trackId);
  const owned = state.tracks.find(track => track.id === trackId && track.user_id === state.profileId);
  if (owned) {
    const { error } = await supabase.from('music_tracks').delete().eq('id', trackId).eq('user_id', state.profileId);
    if (error) throw error;
  }
  if (state.dayTrackId === trackId) await supabase.from('profile_song_of_day').delete().eq('user_id', state.profileId);
}

async function editTrack(trackId: string, draft: { title: string; artist: string; album: string }) {
  if (!state.isOwn) return;
  const { error } = await supabase.from('music_tracks').update({ title: draft.title.trim(), artist: draft.artist.trim() || null, album: draft.album.trim() || null }).eq('id', trackId).eq('user_id', state.profileId);
  if (error) throw error;
}

async function createPlaylist(name: string, description: string, isPublic: boolean) {
  const { error } = await supabase.from('music_playlists').insert({ user_id: state.profileId, name: name.trim(), description: description.trim() || null, is_public: isPublic });
  if (error) throw error;
}

async function updatePlaylist(id: string, name: string, description: string, isPublic: boolean) {
  const { error } = await supabase.from('music_playlists').update({ name: name.trim(), description: description.trim() || null, is_public: isPublic }).eq('id', id).eq('user_id', state.profileId);
  if (error) throw error;
}

async function deletePlaylist(id: string) {
  const { error } = await supabase.from('music_playlists').delete().eq('id', id).eq('user_id', state.profileId);
  if (error) throw error;
}

async function addToPlaylist(playlistId: string, trackId: string) {
  const maxResult = await supabase.from('music_playlist_items').select('position').eq('playlist_id', playlistId).order('position', { ascending: false }).limit(1).maybeSingle();
  const nextPosition = Number(maxResult.data?.position || 0) + 1;
  const { error } = await supabase.from('music_playlist_items').upsert({ playlist_id: playlistId, track_id: trackId, position: nextPosition }, { onConflict: 'playlist_id,track_id' });
  if (error) throw error;
}

function closeModal() { document.querySelector('.profile-music-modal-backdrop')?.remove(); }
function modal(title: string, body: string) { closeModal(); const host = document.createElement('div'); host.className = 'profile-music-modal-backdrop'; host.innerHTML = `<div class="profile-music-modal" role="dialog" aria-modal="true"><div class="profile-music-modal-head"><h3>${esc(title)}</h3><button class="profile-music-modal-close" data-modal-close>×</button></div><div class="profile-music-modal-body">${body}</div></div>`; document.body.appendChild(host); host.addEventListener('click', e => { if ((e.target as HTMLElement).classList.contains('profile-music-modal-backdrop') || (e.target as HTMLElement).closest('[data-modal-close]')) closeModal(); }); return host; }

async function openMusicPicker(mode: 'save' | 'day') {
  if (!state.isOwn) return;
  const body = `<div class="profile-music-picker-tabs"><button class="active" data-picker-tab="youtube">YouTube</button><button data-picker-tab="saved">Mi música</button></div><div class="profile-music-search-row"><input id="profileMusicSearch" placeholder="Busca canciones, artistas o vídeos..."/><button class="profile-music-primary" id="profileMusicSearchBtn">Buscar</button></div><div id="profileMusicPickerResults" class="profile-music-picker-results"><div class="profile-music-empty">Busca una canción o abre «Mi música» para elegir una que ya tengas.</div></div>`;
  const host = modal(mode === 'day' ? 'Elegir canción del día' : 'Añadir música', body);
  const input = host.querySelector<HTMLInputElement>('#profileMusicSearch')!;
  const results = host.querySelector<HTMLElement>('#profileMusicPickerResults')!;

  const renderSaved = () => {
    const items = state.tracks.length ? state.tracks : [];
    results.innerHTML = items.length ? items.map(track => `<div class="profile-music-picker-row"><img src="${esc(coverFor(track))}" alt=""><div><strong>${esc(track.title)}</strong><small>${esc(track.artist || 'Artista desconocido')}</small></div><button class="profile-music-small-play" data-picker-track="${track.id}">${mode === 'day' ? 'Elegir' : 'Añadir'}</button></div>`).join('') : `<div class="profile-music-empty">Todavía no tienes canciones guardadas.</div>`;
  };

  const search = async () => {
    const query = input.value.trim(); if (!query) return;
    results.innerHTML = '<div class="profile-music-loading">Buscando en YouTube…</div>';
    try {
      const apiKey = import.meta.env.VITE_YOUTUBE_API_KEY;
      if (!apiKey) throw new Error('Falta VITE_YOUTUBE_API_KEY');
      const response = await fetch(`https://www.googleapis.com/youtube/v3/search?part=snippet&q=${encodeURIComponent(query)}&type=video&maxResults=12&key=${apiKey}`);
      const data = await response.json();
      if (!response.ok) throw new Error(data?.error?.message || 'No se pudo buscar en YouTube.');
      results.innerHTML = (data.items || []).map((item: any) => {
        const result = { youtube_id: item.id.videoId, title: stripHtml(item.snippet?.title || 'Sin título'), artist: item.snippet?.channelTitle || 'YouTube', cover_url: item.snippet?.thumbnails?.high?.url || item.snippet?.thumbnails?.medium?.url || item.snippet?.thumbnails?.default?.url || '' };
        return `<div class="profile-music-picker-row"><img src="${esc(result.cover_url)}" alt=""><div><strong>${esc(result.title)}</strong><small>${esc(result.artist)}</small></div><div class="profile-music-picker-actions"><button class="profile-music-small-play" data-picker-preview="${esc(result.youtube_id)}">▶</button><button class="profile-music-primary profile-music-picker-save" data-youtube='${esc(JSON.stringify(result))}'>${mode === 'day' ? 'Elegir' : 'Guardar'}</button></div></div>`;
      }).join('') || '<div class="profile-music-empty">No hemos encontrado resultados.</div>';
    } catch (error: any) { results.innerHTML = `<div class="profile-music-empty profile-music-error">${esc(error?.message || 'No se pudo buscar en YouTube.')}</div>`; }
  };

  host.querySelector('#profileMusicSearchBtn')?.addEventListener('click', () => void search());
  input.addEventListener('keydown', e => { if (e.key === 'Enter') void search(); });
  host.querySelectorAll('[data-picker-tab]').forEach(tab => tab.addEventListener('click', () => { host.querySelectorAll('[data-picker-tab]').forEach(el => el.classList.remove('active')); tab.classList.add('active'); if ((tab as HTMLElement).dataset.pickerTab === 'saved') renderSaved(); else results.innerHTML = '<div class="profile-music-empty">Busca una canción, artista o vídeo en YouTube.</div>'; }));
  results.addEventListener('click', async e => {
    const target = e.target as HTMLElement;
    const preview = target.closest<HTMLElement>('[data-picker-preview]');
    if (preview) { const trackId = preview.dataset.pickerPreview || ''; const videoTrack: Track = { id: `yt-${trackId}`, title: 'YouTube', artist: null, cover_url: `https://i.ytimg.com/vi/${trackId}/hqdefault.jpg`, youtube_id: trackId, source_type: 'youtube', album: null, duration: null, user_id: state.profileId }; playTrack(videoTrack); return; }
    const save = target.closest<HTMLElement>('[data-youtube]');
    if (save) {
      try { const result = JSON.parse(save.dataset.youtube || '{}'); await saveYoutubeTrack(result, mode === 'day'); closeModal(); await renderMusic(state.root!); } catch (error: any) { window.alert(error?.message || 'No se pudo guardar la canción.'); }
      return;
    }
    const saved = target.closest<HTMLElement>('[data-picker-track]');
    if (saved) { try { const trackId = saved.dataset.pickerTrack!; if (mode === 'day') await setSongOfDay(trackId); else await ensureFavorite(trackId); closeModal(); await renderMusic(state.root!); } catch (error: any) { window.alert(error?.message || 'No se pudo guardar el cambio.'); } }
  });
}

function openTrackEditor(track: Track) {
  if (!state.isOwn) return;
  const body = `<label>Título<input id="musicEditTitle" value="${esc(track.title)}"></label><label>Artista<input id="musicEditArtist" value="${esc(track.artist || '')}"></label><label>Álbum<input id="musicEditAlbum" value="${esc(track.album || '')}" placeholder="Ej. Blond"></label><div class="profile-music-modal-actions"><button class="profile-music-text-btn" data-modal-close>Cancelar</button><button class="profile-music-primary" id="musicEditSave">Guardar cambios</button></div>`;
  const host = modal('Editar canción', body);
  host.querySelector('#musicEditSave')?.addEventListener('click', async () => { try { await editTrack(track.id, { title: host.querySelector<HTMLInputElement>('#musicEditTitle')!.value, artist: host.querySelector<HTMLInputElement>('#musicEditArtist')!.value, album: host.querySelector<HTMLInputElement>('#musicEditAlbum')!.value }); closeModal(); await renderMusic(state.root!); } catch (error: any) { window.alert(error?.message || 'No se pudo editar la canción.'); } });
}

function openPlaylistEditor(playlist?: Playlist) {
  if (!state.isOwn) return;
  const body = `<label>Nombre<input id="playlistName" value="${esc(playlist?.name || '')}" placeholder="Mi playlist"></label><label>Descripción<textarea id="playlistDescription" rows="3" placeholder="Una descripción breve">${esc(playlist?.description || '')}</textarea></label><label class="profile-music-check"><input id="playlistPublic" type="checkbox" ${playlist?.is_public !== false ? 'checked' : ''}> Playlist pública</label><div class="profile-music-modal-actions"><button class="profile-music-text-btn" data-modal-close>Cancelar</button><button class="profile-music-primary" id="playlistSave">${playlist ? 'Guardar cambios' : 'Crear playlist'}</button></div>`;
  const host = modal(playlist ? 'Editar playlist' : 'Nueva playlist', body);
  host.querySelector('#playlistSave')?.addEventListener('click', async () => { try { const name = host.querySelector<HTMLInputElement>('#playlistName')!.value.trim(); if (!name) throw new Error('Ponle un nombre a la playlist.'); const description = host.querySelector<HTMLTextAreaElement>('#playlistDescription')!.value; const publicValue = host.querySelector<HTMLInputElement>('#playlistPublic')!.checked; if (playlist) await updatePlaylist(playlist.id, name, description, publicValue); else await createPlaylist(name, description, publicValue); closeModal(); await renderMusic(state.root!); } catch (error: any) { window.alert(error?.message || 'No se pudo guardar la playlist.'); } });
}

function openPlaylistSongs(playlist: Playlist) {
  if (!state.isOwn) return;
  const tracks = state.tracks;
  const body = `${tracks.length ? `<div class="profile-music-picker-results">${tracks.map(track => `<div class="profile-music-picker-row"><img src="${esc(coverFor(track))}" alt=""><div><strong>${esc(track.title)}</strong><small>${esc(track.artist || '')}</small></div><button class="profile-music-small-play" data-playlist-track="${track.id}">Añadir</button></div>`).join('')}</div>` : '<div class="profile-music-empty">No tienes canciones guardadas.</div>'}`;
  const host = modal(`Añadir canciones a ${playlist.name}`, body);
  host.querySelector('.profile-music-picker-results')?.addEventListener('click', async e => { const target = (e.target as HTMLElement).closest<HTMLElement>('[data-playlist-track]'); if (!target) return; try { await addToPlaylist(playlist.id, target.dataset.playlistTrack!); target.textContent = 'Añadida ✓'; } catch (error: any) { window.alert(error?.message || 'No se pudo añadir.'); } });
}

function renderTrackRow(track: Track) {
  const own = state.isOwn && track.user_id === state.profileId;
  const fav = state.favoriteIds.has(track.id);
  return `<div class="profile-music-list-row"><img class="profile-music-list-cover" src="${esc(coverFor(track))}" alt=""><div class="profile-music-row-copy"><div class="profile-music-track-title">${esc(track.title)}</div><div class="profile-music-track-artist">${esc(track.artist || 'Artista desconocido')}${track.album ? ` · ${esc(track.album)}` : ''}</div></div><div class="profile-music-inline-actions"><button class="profile-music-small-play" data-track-id="${track.id}" aria-label="Reproducir">▶</button>${state.isOwn ? `<button class="profile-music-small-play ${fav ? 'is-active' : ''}" data-favorite-id="${track.id}" title="${fav ? 'Quitar de favoritos' : 'Añadir a favoritos'}">♥</button>${own ? `<button class="profile-music-small-play" data-edit-track="${track.id}" title="Editar">✎</button><button class="profile-music-small-play danger" data-remove-track="${track.id}" title="Eliminar">×</button>` : ''}` : ''}</div></div>`;
}

async function renderMusic(root: HTMLElement) {
  if (state.rendering) return;
  state.rendering = true;
  state.root = root;
  if (!state.originalGrid) state.originalGrid = root.querySelector('.profile-view-grid')?.innerHTML || '';
  state.active = true;
  root.setAttribute(MUSIC_MODE_ATTR, '1');
  const resolved = await resolveProfile(root);
  state.profileId = resolved.id;
  state.isOwn = resolved.own;
  if (!state.profileId) { state.rendering = false; return; }
  const loaded = await loadData(state.profileId);
  const { tracks, activities, dayTrack } = loaded;
  const artists = Array.from(new Map(tracks.filter(track => track.artist).map(track => [track.artist!, track])).values()).slice(0, 8);
  const albums = Array.from(new Map(tracks.filter(track => track.album).map(track => [`${track.album}|${track.artist}`, track])).values()).slice(0, 8);
  const current = currentPlayer().currentSong;
  const playlists = state.playlists;
  const grid = root.querySelector('.profile-view-grid');
  if (!grid) { state.rendering = false; return; }

  const emptyEdit = state.isOwn ? '' : ' style="display:none"';
  grid.innerHTML = `<div class="profile-music-tab"><div class="profile-music-wrap">
    <div class="profile-music-main">
      <section class="profile-music-card profile-music-highlight"><div class="profile-music-section-head"><div><h2>🎵 Mi música</h2><p class="profile-music-card-sub">Tu biblioteca musical, totalmente editable.</p></div><button class="profile-music-add" data-music-action="add"${emptyEdit}>＋ Añadir música</button></div>
        <div class="profile-music-now">${current ? `<img class="profile-music-cover" src="${esc(current.thumbnail || '')}" alt=""><div class="profile-music-now-copy"><span class="profile-music-now-title">${esc(current.title)}</span><span class="profile-music-now-artist">${esc(current.artist || current.channel_title || 'Inkorium')}</span><div class="profile-music-progress"><span style="width:0%"></span></div><div class="profile-music-time"><span>0:00</span><span>${time(currentPlayer().duration)}</span></div></div><button class="profile-music-play" data-music-action="toggle">${currentPlayer().isPlaying ? '❚❚' : '▶'}</button>` : `<div class="profile-music-now-copy" style="grid-column:1/-1"><span class="profile-music-now-title">Nada reproduciéndose ahora</span><span class="profile-music-now-artist">Empieza a escuchar una canción para verla aquí.</span></div>`}</div>
        <div class="profile-music-library">${tracks.length ? tracks.map(renderTrackRow).join('') : '<div class="profile-music-empty">Tu biblioteca está vacía. Añade una canción desde YouTube o elige una de tus canciones guardadas.</div>'}</div>
      </section>
      <section class="profile-music-card"><div class="profile-music-section-head"><div><h2>🌙 Canción del día</h2><p class="profile-music-card-sub">Elige una canción y cámbiala cuando quieras.</p></div><button class="profile-music-link" data-music-action="day"${emptyEdit}>${dayTrack ? 'Cambiar' : 'Elegir canción'}</button></div>${dayTrack ? `<div class="profile-music-song-day"><img class="profile-music-cover" src="${esc(coverFor(dayTrack))}" alt=""><div><div class="profile-music-track-title">${esc(dayTrack.title)}</div><div class="profile-music-track-artist">${esc(dayTrack.artist || 'Artista desconocido')}</div><span class="profile-music-mini-label">Canción del día</span></div><div class="profile-music-action-row"><button class="profile-music-small-play" data-track-id="${dayTrack.id}">▶</button><button class="profile-music-small-play" data-clear-day${emptyEdit}>×</button></div></div>` : '<div class="profile-music-empty">Todavía no has elegido una canción del día.</div>'}</section>
      <section class="profile-music-card"><div class="profile-music-section-head"><div><h2>Artistas favoritos</h2><p class="profile-music-card-sub">Se construyen a partir de tu biblioteca y tus favoritos.</p></div><button class="profile-music-link" data-music-action="manage"${emptyEdit}>Gestionar</button></div>${artists.length ? `<div class="profile-music-grid-4">${artists.map(track => `<div class="profile-music-grid-artist"><img class="profile-music-avatar" src="${esc(coverFor(track))}" alt=""><span class="profile-music-artist-name">${esc(track.artist)}</span><button class="profile-music-text-btn" data-track-id="${track.id}">Escuchar</button></div>`).join('')}</div>` : '<div class="profile-music-empty">Añade canciones para crear tu lista de artistas.</div>'}</section>
      <section class="profile-music-card"><div class="profile-music-section-head"><div><h2>Álbumes destacados</h2><p class="profile-music-card-sub">Edita el álbum de tus canciones para construir esta sección.</p></div><button class="profile-music-link" data-music-action="manage"${emptyEdit}>Editar desde canciones</button></div>${albums.length ? `<div class="profile-music-grid-4">${albums.map(track => `<div class="profile-music-album"><img src="${esc(coverFor(track))}" alt=""><span class="profile-music-album-title">${esc(track.album)}</span><span class="profile-music-album-artist">${esc(track.artist || '')}</span><button class="profile-music-text-btn" data-edit-track="${track.id}"${ownHidden(track)}>Editar</button></div>`).join('')}</div>` : '<div class="profile-music-empty">Aún no hay álbumes destacados. Edita una canción y añade el nombre del álbum.</div>'}</section>
      <section class="profile-music-card"><div class="profile-music-section-head"><div><h2>Últimas canciones</h2><p class="profile-music-card-sub">Tu actividad musical reciente.</p></div></div>${activities.length ? `<div class="profile-music-list">${activities.slice(0,8).map(row => row.track ? `<div class="profile-music-list-row"><img class="profile-music-list-cover" src="${esc(coverFor(row.track))}" alt=""><div class="profile-music-row-copy"><div class="profile-music-track-title">${esc(row.track.title)}</div><div class="profile-music-track-artist">${esc(row.track.artist || 'Artista desconocido')} · ${actionLabel(row.action)}</div></div><button class="profile-music-small-play" data-track-id="${row.track.id}">▶</button></div>` : '').join('')}</div>` : '<div class="profile-music-empty">Aquí aparecerán tus canciones escuchadas, compartidas o guardadas.</div>'}</section>
    </div>
    <aside class="profile-music-side">
      <section class="profile-music-card profile-music-side-card"><div class="profile-music-section-head"><div class="profile-music-side-title">🎶 Tu gusto musical</div><button class="profile-music-link" data-music-action="manage"${emptyEdit}>Editar</button></div><p class="profile-music-card-sub">Tus favoritos y artistas principales.</p><div class="profile-music-pill-row">${artists.length ? artists.map(track => `<span class="profile-music-pill">${esc(track.artist)}</span>`).join('') : '<span class="profile-music-pill">Añade música</span>'}</div></section>
      <section class="profile-music-card profile-music-side-card"><div class="profile-music-section-head"><div class="profile-music-side-title">📚 Playlists</div><button class="profile-music-link" data-music-action="new-playlist"${emptyEdit}>＋ Nueva</button></div>${playlists.length ? playlists.map(p => `<div class="profile-music-side-row"><div class="profile-music-side-copy"><strong>${esc(p.name)}</strong><small>${esc(p.description || 'Playlist pública')}</small></div>${state.isOwn ? `<div class="profile-music-inline-actions"><button class="profile-music-small-play" data-playlist-add="${p.id}">＋</button><button class="profile-music-small-play" data-edit-playlist="${p.id}">✎</button><button class="profile-music-small-play danger" data-delete-playlist="${p.id}">×</button></div>` : ''}</div>`).join('') : '<div class="profile-music-empty">Todavía no hay playlists.</div>'}</section>
      <section class="profile-music-card profile-music-side-card"><div class="profile-music-side-title">💜 Un detalle musical</div><p class="profile-music-card-sub">Tu música cambia contigo. Guarda, edita, organiza y decide qué quieres destacar.</p></section>
    </aside>
  </div></div>`;

  bindMusicActions(root);
  state.rendering = false;
}

function ownHidden(track: Track) { return state.isOwn && track.user_id === state.profileId ? '' : ' style="display:none"'; }
function actionLabel(action: string) { return action === 'listened' ? 'Escuchada' : action === 'shared' ? 'Compartida' : action === 'saved' ? 'Guardada' : 'Playlist'; }

function bindMusicActions(root: HTMLElement) {
  const tab = root.querySelector('.profile-music-tab') as HTMLElement | null; if (!tab) return;
  tab.addEventListener('click', async e => {
    const target = e.target as HTMLElement;
    const action = target.closest<HTMLElement>('[data-music-action]')?.dataset.musicAction;
    const trackId = target.closest<HTMLElement>('[data-track-id]')?.dataset.trackId;
    if (trackId) { playTrack(state.tracks.find(track => track.id === trackId)); return; }
    const favoriteId = target.closest<HTMLElement>('[data-favorite-id]')?.dataset.favoriteId;
    if (favoriteId) { try { await toggleFavorite(favoriteId); await renderMusic(root); } catch (error: any) { window.alert(error?.message || 'No se pudo cambiar el favorito.'); } return; }
    const editTrackId = target.closest<HTMLElement>('[data-edit-track]')?.dataset.editTrack;
    if (editTrackId) { const track = state.tracks.find(item => item.id === editTrackId); if (track) openTrackEditor(track); return; }
    const removeId = target.closest<HTMLElement>('[data-remove-track]')?.dataset.removeTrack;
    if (removeId) { if (!window.confirm('¿Eliminar esta canción de tu música?')) return; try { await removeTrack(removeId); await renderMusic(root); } catch (error: any) { window.alert(error?.message || 'No se pudo eliminar.'); } return; }
    const dayClear = target.closest<HTMLElement>('[data-clear-day]');
    if (dayClear) { await supabase.from('profile_song_of_day').delete().eq('user_id', state.profileId); state.dayTrackId = null; await renderMusic(root); return; }
    const editPlaylistId = target.closest<HTMLElement>('[data-edit-playlist]')?.dataset.editPlaylist;
    if (editPlaylistId) { const playlist = state.playlists.find(item => item.id === editPlaylistId); if (playlist) openPlaylistEditor(playlist); return; }
    const deletePlaylistId = target.closest<HTMLElement>('[data-delete-playlist]')?.dataset.deletePlaylist;
    if (deletePlaylistId) { if (!window.confirm('¿Eliminar esta playlist?')) return; try { await deletePlaylist(deletePlaylistId); await renderMusic(root); } catch (error: any) { window.alert(error?.message || 'No se pudo eliminar la playlist.'); } return; }
    const addPlaylistId = target.closest<HTMLElement>('[data-playlist-add]')?.dataset.playlistAdd;
    if (addPlaylistId) { const playlist = state.playlists.find(item => item.id === addPlaylistId); if (playlist) openPlaylistSongs(playlist); return; }
    if (action === 'add') { await openMusicPicker('save'); return; }
    if (action === 'day') { await openMusicPicker('day'); return; }
    if (action === 'manage') { modal('Gestionar mi música', `<div class="profile-music-picker-results">${state.tracks.map(renderTrackRow).join('') || '<div class="profile-music-empty">No hay canciones guardadas.</div>'}</div>`); return; }
    if (action === 'new-playlist') { openPlaylistEditor(); return; }
    if (action === 'toggle') { const player = currentPlayer(); if (player.isPlaying || player.pendingPlay) player.pause(); else if (player.currentSong) player.resume(); }
  });
}

function restoreGrid(root: HTMLElement) { state.active = false; root.removeAttribute(MUSIC_MODE_ATTR); const grid = root.querySelector('.profile-view-grid'); if (grid && state.originalGrid !== undefined) grid.innerHTML = state.originalGrid; }
function bind() { const root = document.querySelector<HTMLElement>('.profile-view-page'); if (!root) return; const tabs = root.querySelectorAll<HTMLButtonElement>('.profile-view-tabs button'); tabs.forEach(tab => { if (tab.dataset.musicBound === '1') return; tab.dataset.musicBound = '1'; tab.addEventListener('click', async () => { const label = tab.textContent?.trim(); if (label === 'Música') await renderMusic(root); else if (state.active) restoreGrid(root); }, true); }); }
function boot() { bind(); const observer = new MutationObserver(() => { bind(); if (state.active && !document.querySelector('.profile-music-tab') && state.root) renderMusic(state.root); }); observer.observe(document.body, { childList: true, subtree: true }); }
function stripHtml(value: string) { return value.replace(/<[^>]*>/g, '').replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&amp;/g, '&'); }
if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot, { once: true }); else boot();
