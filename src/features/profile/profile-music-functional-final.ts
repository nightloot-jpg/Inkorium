import { supabase } from '../../lib/supabase';
import { usePlayerStore } from '../../lib/store';
import './profile-music-functional-final.css';

type Track = {
  id: string;
  title: string;
  artist: string | null;
  cover_url: string | null;
  youtube_id: string | null;
  source_type: string;
  album: string | null;
  user_id: string | null;
};

type Playlist = {
  id: string;
  name: string;
  cover_url: string | null;
  description: string | null;
  is_public?: boolean;
};

const esc = (value: unknown) => String(value ?? '').replace(/[&<>\"']/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '\"': '&quot;', "'": '&#39;' }[ch] || ch));
const coverFor = (track?: Track | null) => track?.cover_url || (track?.youtube_id ? `https://i.ytimg.com/vi/${track.youtube_id}/hqdefault.jpg` : '');
const player = () => usePlayerStore.getState();
const today = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

async function resolveProfile(root: HTMLElement) {
  const session = await supabase.auth.getSession();
  const ownId = session.data.session?.user?.id || '';
  const handle = root.querySelector('.profile-view-handle')?.textContent?.trim().replace(/^@/, '') || '';
  if (!handle) return { id: ownId, own: true };
  const { data } = await supabase.from('profiles').select('id').eq('username', handle).maybeSingle();
  return { id: data?.id || ownId, own: data?.id === ownId };
}

async function getContext() {
  const page = document.querySelector<HTMLElement>('.profile-view-page');
  if (!page) return null;
  const profile = await resolveProfile(page);
  if (!profile.id) return null;
  return { page, ...profile };
}

function openModal(title: string, body: string) {
  document.querySelector('.profile-music-functional-backdrop')?.remove();
  const host = document.createElement('div');
  host.className = 'profile-music-functional-backdrop';
  host.innerHTML = `<div class="profile-music-functional-modal" role="dialog" aria-modal="true"><div class="profile-music-functional-head"><h3>${esc(title)}</h3><button type="button" data-functional-close>×</button></div><div class="profile-music-functional-body">${body}</div></div>`;
  document.body.appendChild(host);
  host.addEventListener('click', e => {
    const target = e.target as HTMLElement;
    if (target === host || target.closest('[data-functional-close]')) host.remove();
  });
  return host;
}

function playTrack(track: Track | null | undefined) {
  if (!track) return;
  player().playSong({
    type: track.source_type === 'youtube' ? 'youtube_song' : 'local_song',
    video_id: track.youtube_id || undefined,
    title: track.title,
    artist: track.artist || undefined,
    channel_title: track.artist || undefined,
    thumbnail: coverFor(track),
  } as any, false);
}

async function fetchTrack(id: string) {
  const { data } = await supabase.from('music_tracks').select('id,title,artist,cover_url,youtube_id,source_type,album,user_id').eq('id', id).maybeSingle();
  return (data || null) as Track | null;
}

async function fetchPlaylist(id: string) {
  const { data } = await supabase.from('music_playlists').select('id,name,cover_url,description,is_public').eq('id', id).maybeSingle();
  return (data || null) as Playlist | null;
}

async function refreshProfileMusic() {
  const musicTab = Array.from(document.querySelectorAll<HTMLButtonElement>('.profile-view-tabs button')).find(btn => btn.textContent?.trim() === 'Música');
  musicTab?.click();
}

async function saveDailyTrack(trackId: string, profileId: string) {
  const now = new Date().toISOString();
  const day = today();
  const { error: songError } = await supabase.from('profile_song_of_day').upsert({ user_id: profileId, track_id: trackId, updated_at: now }, { onConflict: 'user_id' });
  if (songError) throw songError;
  const { error: diaryError } = await supabase.from('profile_music_diary').upsert({ user_id: profileId, entry_date: day, track_id: trackId }, { onConflict: 'user_id,entry_date' });
  if (diaryError) throw diaryError;
  window.dispatchEvent(new CustomEvent('inkorium:daily-song-changed'));
}

async function openSongDayEditor(ctx: { page: HTMLElement; id: string; own: boolean }) {
  if (!ctx.own) return;
  const { data: tracks } = await supabase.from('music_tracks').select('id,title,artist,cover_url,youtube_id,source_type,album,user_id').eq('user_id', ctx.id).order('created_at', { ascending: false }).limit(100);
  const current = await supabase.from('profile_song_of_day').select('track_id').eq('user_id', ctx.id).maybeSingle();
  const rows = ((tracks || []) as Track[]).map(track => `<div class="functional-row"><img src="${esc(coverFor(track))}" alt=""><div><strong>${esc(track.title)}</strong><small>${esc(track.artist || '')}</small></div><button type="button" class="functional-primary" data-day-track="${esc(track.id)}">${current.data?.track_id === track.id ? 'Elegida ✓' : 'Elegir'}</button></div>`).join('');
  const host = openModal('Elegir canción del día', `<p class="functional-help">Solo una canción puede ocupar el día. También se guardará en tu Diario musical.</p><div class="functional-tabs"><button class="active" data-day-source="saved">Mi música</button><button data-day-source="youtube">YouTube</button></div><div class="functional-day-saved">${rows || '<div class="functional-empty">Aún no tienes canciones guardadas.</div>'}</div><div class="functional-day-youtube" hidden><div class="functional-search"><input id="dailySearch" placeholder="Busca una canción en YouTube..."><button type="button" class="functional-primary" id="dailySearchBtn">Buscar</button></div><div id="dailyResults"></div></div>`);
  host.querySelectorAll<HTMLButtonElement>('[data-day-source]').forEach(button => button.addEventListener('click', () => {
    host.querySelectorAll('[data-day-source]').forEach(el => el.classList.remove('active'));
    button.classList.add('active');
    const saved = host.querySelector<HTMLElement>('.functional-day-saved');
    const yt = host.querySelector<HTMLElement>('.functional-day-youtube');
    const isSaved = button.dataset.daySource === 'saved';
    if (saved) saved.hidden = !isSaved;
    if (yt) yt.hidden = isSaved;
  }));
  host.querySelector('.functional-day-saved')?.addEventListener('click', async e => {
    const button = (e.target as HTMLElement).closest<HTMLElement>('[data-day-track]');
    if (!button) return;
    try { await saveDailyTrack(button.dataset.dayTrack!, ctx.id); host.remove(); await refreshProfileMusic(); } catch (error: any) { window.alert(error?.message || 'No se pudo guardar la canción del día.'); }
  });
  const input = host.querySelector<HTMLInputElement>('#dailySearch')!;
  const results = host.querySelector<HTMLElement>('#dailyResults')!;
  const runSearch = async () => {
    const q = input.value.trim();
    if (!q) return;
    results.innerHTML = '<div class="functional-empty">Buscando…</div>';
    try {
      const key = import.meta.env.VITE_YOUTUBE_API_KEY;
      if (!key) throw new Error('Falta VITE_YOUTUBE_API_KEY');
      const response = await fetch(`https://www.googleapis.com/youtube/v3/search?part=snippet&q=${encodeURIComponent(q)}&type=video&maxResults=10&key=${key}`);
      const data = await response.json();
      if (!response.ok) throw new Error(data?.error?.message || 'No se pudo buscar en YouTube.');
      results.innerHTML = (data.items || []).map((item: any) => {
        const video = { youtube_id: item.id.videoId, title: item.snippet?.title || 'Sin título', artist: item.snippet?.channelTitle || 'YouTube', cover_url: item.snippet?.thumbnails?.high?.url || item.snippet?.thumbnails?.medium?.url || '' };
        return `<div class="functional-row"><img src="${esc(video.cover_url)}" alt=""><div><strong>${esc(video.title)}</strong><small>${esc(video.artist)}</small></div><button type="button" class="functional-primary" data-day-youtube='${esc(JSON.stringify(video))}'>Elegir</button></div>`;
      }).join('') || '<div class="functional-empty">No encontramos resultados.</div>';
    } catch (error: any) { results.innerHTML = `<div class="functional-empty">${esc(error?.message || 'No se pudo buscar.')}</div>`; }
  };
  host.querySelector('#dailySearchBtn')?.addEventListener('click', () => void runSearch());
  input.addEventListener('keydown', e => { if (e.key === 'Enter') void runSearch(); });
  results.addEventListener('click', async e => {
    const button = (e.target as HTMLElement).closest<HTMLElement>('[data-day-youtube]');
    if (!button) return;
    try {
      const video = JSON.parse(button.dataset.dayYoutube || '{}');
      let trackId = (tracks as Track[]).find(track => track.youtube_id === video.youtube_id)?.id;
      if (!trackId) {
        const { data, error } = await supabase.from('music_tracks').insert({ user_id: ctx.id, title: video.title, artist: video.artist, cover_url: video.cover_url, youtube_id: video.youtube_id, source_type: 'youtube' }).select('id').single();
        if (error) throw error;
        trackId = data.id;
      }
      await saveDailyTrack(trackId, ctx.id); host.remove(); await refreshProfileMusic();
    } catch (error: any) { window.alert(error?.message || 'No se pudo guardar la canción del día.'); }
  });
}

async function openPlaylistEditorModal(ctx: { id: string; own: boolean }, playlist?: Playlist) {
  if (!ctx.own) return;
  const host = openModal(playlist ? 'Editar playlist' : 'Nueva playlist', `<label>Nombre<input id="plName" value="${esc(playlist?.name || '')}"></label><label>Descripción<textarea id="plDescription" rows="3">${esc(playlist?.description || '')}</textarea></label><label class="functional-check"><input id="plPublic" type="checkbox" ${playlist?.is_public !== false ? 'checked' : ''}> Playlist pública</label><div class="functional-actions"><button type="button" data-functional-close>Cancelar</button><button type="button" class="functional-primary" id="plSave">${playlist ? 'Guardar cambios' : 'Crear playlist'}</button></div>`);
  host.querySelector('#plSave')?.addEventListener('click', async () => {
    const name = host.querySelector<HTMLInputElement>('#plName')!.value.trim();
    const description = host.querySelector<HTMLTextAreaElement>('#plDescription')!.value.trim();
    const isPublic = host.querySelector<HTMLInputElement>('#plPublic')!.checked;
    if (!name) { window.alert('Ponle un nombre a la playlist.'); return; }
    try {
      const result = playlist
        ? await supabase.from('music_playlists').update({ name, description: description || null, is_public: isPublic }).eq('id', playlist.id).eq('user_id', ctx.id)
        : await supabase.from('music_playlists').insert({ user_id: ctx.id, name, description: description || null, is_public: isPublic });
      if (result.error) throw result.error;
      host.remove(); await refreshProfileMusic();
    } catch (error: any) { window.alert(error?.message || 'No se pudo guardar la playlist.'); }
  });
}

async function openPlaylistSongsModal(ctx: { id: string; own: boolean }, playlistId: string) {
  if (!ctx.own) return;
  const { data: tracks } = await supabase.from('music_tracks').select('id,title,artist,cover_url,youtube_id,source_type,album,user_id').eq('user_id', ctx.id).order('created_at', { ascending: false }).limit(100);
  const host = openModal('Añadir canciones a la playlist', `<p class="functional-help">Elige las canciones guardadas que quieres incluir.</p><div class="functional-list">${((tracks || []) as Track[]).map(track => `<div class="functional-row"><img src="${esc(coverFor(track))}" alt=""><div><strong>${esc(track.title)}</strong><small>${esc(track.artist || '')}</small></div><button type="button" class="functional-primary" data-pl-track="${esc(track.id)}">Añadir</button></div>`).join('') || '<div class="functional-empty">No tienes canciones guardadas.</div>'}</div>`);
  host.querySelector('.functional-list')?.addEventListener('click', async e => {
    const button = (e.target as HTMLElement).closest<HTMLElement>('[data-pl-track]');
    if (!button) return;
    try {
      const { data: last } = await supabase.from('music_playlist_items').select('position').eq('playlist_id', playlistId).order('position', { ascending: false }).limit(1).maybeSingle();
      const position = Number(last?.position || 0) + 1;
      const { error } = await supabase.from('music_playlist_items').upsert({ playlist_id: playlistId, track_id: button.dataset.plTrack!, position }, { onConflict: 'playlist_id,track_id' });
      if (error) throw error;
      button.textContent = 'Añadida ✓';
    } catch (error: any) { window.alert(error?.message || 'No se pudo añadir.'); }
  });
}

async function openTrackEditorModal(ctx: { id: string; own: boolean }, trackId: string) {
  if (!ctx.own) return;
  const track = await fetchTrack(trackId);
  if (!track) return;
  const host = openModal('Editar canción', `<label>Título<input id="trTitle" value="${esc(track.title)}"></label><label>Artista<input id="trArtist" value="${esc(track.artist || '')}"></label><label>Álbum<input id="trAlbum" value="${esc(track.album || '')}" placeholder="Nombre del álbum"></label><div class="functional-actions"><button type="button" data-functional-close>Cancelar</button><button type="button" class="functional-primary" id="trSave">Guardar cambios</button></div>`);
  host.querySelector('#trSave')?.addEventListener('click', async () => {
    const title = host.querySelector<HTMLInputElement>('#trTitle')!.value.trim();
    const artist = host.querySelector<HTMLInputElement>('#trArtist')!.value.trim();
    const album = host.querySelector<HTMLInputElement>('#trAlbum')!.value.trim();
    if (!title) { window.alert('El título no puede estar vacío.'); return; }
    try {
      const { error } = await supabase.from('music_tracks').update({ title, artist: artist || null, album: album || null }).eq('id', trackId).eq('user_id', ctx.id);
      if (error) throw error;
      host.remove(); await refreshProfileMusic();
    } catch (error: any) { window.alert(error?.message || 'No se pudo guardar la canción.'); }
  });
}

async function openAlbumManager(ctx: { id: string; own: boolean }) {
  if (!ctx.own) return;
  const { data } = await supabase.from('music_tracks').select('id,title,artist,cover_url,youtube_id,source_type,album,user_id').eq('user_id', ctx.id).order('created_at', { ascending: false }).limit(100);
  const tracks = (data || []) as Track[];
  const host = openModal('Álbumes destacados', `<p class="functional-help">Asigna o cambia el álbum de tus canciones. Los álbumes con nombre aparecen automáticamente en el perfil.</p><div class="functional-list">${tracks.map(track => `<div class="functional-row"><img src="${esc(coverFor(track))}" alt=""><div><strong>${esc(track.title)}</strong><small>${esc(track.artist || '')}${track.album ? ` · ${esc(track.album)}` : ' · Sin álbum'}</small></div><button type="button" class="functional-primary" data-edit-album="${esc(track.id)}">Editar</button></div>`).join('')}</div>`);
  host.querySelector('.functional-list')?.addEventListener('click', async e => {
    const button = (e.target as HTMLElement).closest<HTMLElement>('[data-edit-album]');
    if (!button) return;
    host.remove();
    await openTrackEditorModal(ctx, button.dataset.editAlbum!);
  });
}

async function openTasteManager(ctx: { id: string; own: boolean }) {
  if (!ctx.own) return;
  const { data: tracks } = await supabase.from('music_tracks').select('id,title,artist,cover_url,youtube_id,source_type,album,user_id').eq('user_id', ctx.id).limit(100);
  const { data: favorites } = await supabase.from('music_favorites').select('track_id').eq('user_id', ctx.id).limit(200);
  const favoriteIds = new Set<string>((favorites || []).map((row: any) => row.track_id));
  const byArtist = new Map<string, Track[]>();
  (tracks || []).forEach((track: any) => { if (!track.artist) return; const list = byArtist.get(track.artist) || []; list.push(track as Track); byArtist.set(track.artist, list); });
  const artists = Array.from(byArtist.entries()).sort((a, b) => a[0].localeCompare(b[0]));
  const host = openModal('Editar gusto musical', `<p class="functional-help">Tu gusto se construye con tus canciones favoritas. Marca los artistas que quieras destacar.</p><div class="functional-list">${artists.map(([artist, songs]) => { const active = songs.some(song => favoriteIds.has(song.id)); const representative = songs[0]; return `<label class="functional-artist-option"><input type="checkbox" data-taste-artist="${esc(artist)}" data-taste-track="${esc(representative.id)}" ${active ? 'checked' : ''}><img src="${esc(coverFor(representative))}" alt=""><span>${esc(artist)}</span></label>`; }).join('') || '<div class="functional-empty">Añade canciones para poder editar tus gustos.</div>'}</div><div class="functional-actions"><button type="button" data-functional-close>Cerrar</button></div>`);
  host.querySelector('.functional-list')?.addEventListener('change', async e => {
    const input = (e.target as HTMLInputElement).closest<HTMLInputElement>('[data-taste-artist]');
    if (!input) return;
    const artist = input.dataset.tasteArtist!;
    const songIds = byArtist.get(artist)?.map(song => song.id) || [];
    try {
      if (input.checked) {
        await supabase.from('music_favorites').upsert({ user_id: ctx.id, track_id: input.dataset.tasteTrack! }, { onConflict: 'user_id,track_id' });
      } else if (songIds.length) {
        const { error } = await supabase.from('music_favorites').delete().eq('user_id', ctx.id).in('track_id', songIds);
        if (error) throw error;
      }
      window.dispatchEvent(new CustomEvent('inkorium:music-data-changed'));
    } catch (error: any) { input.checked = !input.checked; window.alert(error?.message || 'No se pudo actualizar el gusto musical.'); }
  });
}

async function handleClick(event: MouseEvent) {
  const target = event.target as HTMLElement;
  const root = document.querySelector<HTMLElement>('.profile-view-page');
  if (!root) return;
  const ctx = await resolveProfile(root);
  if (!ctx.id || !ctx.own) return;

  const action = target.closest<HTMLElement>('[data-music-action]')?.dataset.musicAction;
  if (action === 'day') { event.preventDefault(); event.stopPropagation(); await openSongDayEditor({ page: root, ...ctx }); return; }
  if (action === 'new-playlist') { event.preventDefault(); event.stopPropagation(); await openPlaylistEditorModal(ctx); return; }
  if (action === 'add') {
    // Used by Artistas favoritos and the old generic links. Keep it useful by opening the music picker through the header action.
    return;
  }

  const tasteEdit = target.closest<HTMLElement>('.profile-music-side-card [data-music-action="add"]');
  if (tasteEdit) { event.preventDefault(); event.stopPropagation(); await openTasteManager(ctx); return; }

  const playlistEdit = target.closest<HTMLElement>('[data-edit-playlist]');
  if (playlistEdit) { event.preventDefault(); event.stopPropagation(); const playlist = await fetchPlaylist(playlistEdit.dataset.editPlaylist!); if (playlist) await openPlaylistEditorModal(ctx, playlist); return; }
  const playlistAdd = target.closest<HTMLElement>('[data-playlist-add]');
  if (playlistAdd) { event.preventDefault(); event.stopPropagation(); await openPlaylistSongsModal(ctx, playlistAdd.dataset.playlistAdd!); return; }
  const playlistDelete = target.closest<HTMLElement>('[data-delete-playlist]');
  if (playlistDelete) { event.preventDefault(); event.stopPropagation(); if (!window.confirm('¿Eliminar esta playlist?')) return; const { error } = await supabase.from('music_playlists').delete().eq('id', playlistDelete.dataset.deletePlaylist!).eq('user_id', ctx.id); if (error) window.alert(error.message); else await refreshProfileMusic(); return; }

  const trackPlay = target.closest<HTMLElement>('[data-track-id]');
  if (trackPlay) { event.preventDefault(); event.stopPropagation(); const track = await fetchTrack(trackPlay.dataset.trackId!); playTrack(track); return; }
  const albumEdit = target.closest<HTMLElement>('.profile-music-card [data-music-action="add"]');
  if (albumEdit && target.closest('section')?.querySelector('h2')?.textContent?.includes('Álbumes destacados')) { event.preventDefault(); event.stopPropagation(); await openAlbumManager(ctx); return; }
  const trackEdit = target.closest<HTMLElement>('[data-edit-track]');
  if (trackEdit) { event.preventDefault(); event.stopPropagation(); await openTrackEditorModal(ctx, trackEdit.dataset.editTrack!); return; }
  const playRecent = target.closest<HTMLElement>('.profile-music-list-row [data-track-id]');
  if (playRecent) { event.preventDefault(); event.stopPropagation(); const track = await fetchTrack(playRecent.dataset.trackId!); playTrack(track); }
}

function boot() {
  document.addEventListener('click', event => { void handleClick(event as MouseEvent); }, true);
  window.addEventListener('inkorium:music-data-changed', () => { window.setTimeout(() => void refreshProfileMusic(), 0); });
}

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot, { once: true }); else boot();
