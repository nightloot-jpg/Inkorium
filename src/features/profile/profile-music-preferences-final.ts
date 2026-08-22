import { supabase } from '../../lib/supabase';
import './profile-music-preferences-final.css';

type FavoriteArtist = {
  id: string;
  artist_name: string;
  youtube_channel_id: string | null;
  youtube_video_id: string | null;
  cover_url: string | null;
};

type Playlist = { id: string; name: string; cover_url: string | null; description: string | null; is_public?: boolean };

const esc = (value: unknown) => String(value ?? '').replace(/[&<>\"']/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '\"': '&quot;', "'": '&#39;' }[ch] || ch));
const coverFor = (playlist?: Playlist | null) => playlist?.cover_url || '';
const page = () => document.querySelector<HTMLElement>('.profile-view-page');

async function resolveProfile() {
  const root = page();
  if (!root) return null;
  const session = await supabase.auth.getSession();
  const ownId = session.data.session?.user?.id || '';
  const handle = root.querySelector('.profile-view-handle')?.textContent?.trim().replace(/^@/, '') || '';
  if (!handle) return { id: ownId, own: true };
  const { data } = await supabase.from('profiles').select('id').eq('username', handle).maybeSingle();
  return { id: data?.id || ownId, own: data?.id === ownId };
}

function modal(title: string, body: string) {
  document.querySelector('.profile-music-preferences-backdrop')?.remove();
  const host = document.createElement('div');
  host.className = 'profile-music-preferences-backdrop';
  host.innerHTML = `<div class="profile-music-preferences-modal" role="dialog" aria-modal="true"><div class="profile-music-preferences-head"><h3>${esc(title)}</h3><button type="button" data-pref-close>×</button></div><div class="profile-music-preferences-body">${body}</div></div>`;
  document.body.appendChild(host);
  host.addEventListener('click', event => {
    const target = event.target as HTMLElement;
    if (target === host || target.closest('[data-pref-close]')) host.remove();
  });
  return host;
}

function youtubeSearchUrl(query: string) {
  const key = import.meta.env.VITE_YOUTUBE_API_KEY;
  return { key, url: `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${encodeURIComponent(query)}&type=video&maxResults=10&key=${key}` };
}

async function loadArtists(userId: string) {
  const { data } = await supabase.from('profile_music_favorite_artists').select('id,artist_name,youtube_channel_id,youtube_video_id,cover_url').eq('user_id', userId).order('created_at', { ascending: false }).limit(12);
  return (data || []) as FavoriteArtist[];
}

async function loadPlaylists(userId: string) {
  const { data } = await supabase.from('music_playlists').select('id,name,cover_url,description,is_public').eq('user_id', userId).order('created_at', { ascending: false }).limit(50);
  return (data || []) as Playlist[];
}

async function loadFeaturedPlaylistIds(userId: string) {
  const { data } = await supabase.from('profile_music_featured_playlists').select('playlist_id').eq('user_id', userId);
  return new Set<string>((data || []).map((row: any) => row.playlist_id).filter(Boolean));
}

function artistCard(artist: FavoriteArtist) {
  return `<div class="profile-music-pref-artist"><img src="${esc(artist.cover_url || '')}" alt=""><div><strong>${esc(artist.artist_name)}</strong><small>Artista favorito</small></div><button type="button" data-artist-remove="${esc(artist.id)}">×</button></div>`;
}

async function openArtistManager(userId: string) {
  let artists = await loadArtists(userId);
  const host = modal('Artistas favoritos', `<p class="profile-music-pref-help">Busca en YouTube y guarda los cantantes o artistas que quieres destacar en tu perfil.</p><div class="profile-music-pref-search"><input id="artistSearch" placeholder="Busca un artista..."/><button type="button" class="profile-music-pref-primary" id="artistSearchButton">Buscar</button></div><div id="artistResults" class="profile-music-pref-results"></div><div class="profile-music-pref-selected"><div class="profile-music-pref-selected-head"><strong>Mis artistas favoritos</strong><span id="artistCount"></span></div><div id="artistSelectedList">${artists.map(artistCard).join('') || '<div class="profile-music-pref-empty">Todavía no has elegido artistas.</div>'}</div></div>`);
  const results = host.querySelector<HTMLElement>('#artistResults')!;
  const selected = host.querySelector<HTMLElement>('#artistSelectedList')!;
  const count = host.querySelector<HTMLElement>('#artistCount')!;
  const updateSelected = () => { selected.innerHTML = artists.map(artistCard).join('') || '<div class="profile-music-pref-empty">Todavía no has elegido artistas.</div>'; count.textContent = `${artists.length}/8`; };
  updateSelected();

  const runSearch = async () => {
    const query = host.querySelector<HTMLInputElement>('#artistSearch')!.value.trim();
    if (!query) return;
    results.innerHTML = '<div class="profile-music-pref-empty">Buscando en YouTube…</div>';
    try {
      const { key, url } = youtubeSearchUrl(query);
      if (!key) throw new Error('Falta VITE_YOUTUBE_API_KEY');
      const response = await fetch(url);
      const data = await response.json();
      if (!response.ok) throw new Error(data?.error?.message || 'No se pudo buscar en YouTube.');
      results.innerHTML = (data.items || []).map((item: any) => {
        const artist = item.snippet?.channelTitle || 'YouTube';
        const cover = item.snippet?.thumbnails?.high?.url || item.snippet?.thumbnails?.medium?.url || item.snippet?.thumbnails?.default?.url || '';
        const videoId = item.id?.videoId || '';
        const selectedAlready = artists.some(saved => saved.artist_name.toLowerCase() === artist.toLowerCase());
        return `<div class="profile-music-pref-result"><img src="${esc(cover)}" alt=""><div><strong>${esc(artist)}</strong><small>${esc(item.snippet?.title || '')}</small></div><button type="button" class="profile-music-pref-primary" data-artist-save='${esc(JSON.stringify({ artist_name: artist, youtube_video_id: videoId, cover_url: cover }))}' ${selectedAlready || artists.length >= 8 ? 'disabled' : ''}>${selectedAlready ? 'Guardado' : 'Elegir'}</button></div>`;
      }).join('') || '<div class="profile-music-pref-empty">No encontramos artistas.</div>';
    } catch (error: any) {
      results.innerHTML = `<div class="profile-music-pref-empty">${esc(error?.message || 'No se pudo buscar.')}</div>`;
    }
  };

  host.querySelector('#artistSearchButton')?.addEventListener('click', () => void runSearch());
  host.querySelector<HTMLInputElement>('#artistSearch')?.addEventListener('keydown', event => { if (event.key === 'Enter') void runSearch(); });
  results.addEventListener('click', async event => {
    const button = (event.target as HTMLElement).closest<HTMLElement>('[data-artist-save]');
    if (!button) return;
    try {
      const artist = JSON.parse(button.dataset.artistSave || '{}');
      const { data, error } = await supabase.from('profile_music_favorite_artists').insert({ user_id: userId, artist_name: artist.artist_name, youtube_video_id: artist.youtube_video_id || null, cover_url: artist.cover_url || null }).select('id,artist_name,youtube_channel_id,youtube_video_id,cover_url').single();
      if (error) throw error;
      artists = [data as FavoriteArtist, ...artists.filter(item => item.artist_name.toLowerCase() !== data.artist_name.toLowerCase())].slice(0, 8);
      updateSelected();
      await runSearch();
    } catch (error: any) { window.alert(error?.message || 'No se pudo guardar el artista.'); }
  });
  selected.addEventListener('click', async event => {
    const button = (event.target as HTMLElement).closest<HTMLElement>('[data-artist-remove]');
    if (!button) return;
    try {
      const { error } = await supabase.from('profile_music_favorite_artists').delete().eq('id', button.dataset.artistRemove!).eq('user_id', userId);
      if (error) throw error;
      artists = artists.filter(item => item.id !== button.dataset.artistRemove);
      updateSelected();
    } catch (error: any) { window.alert(error?.message || 'No se pudo quitar el artista.'); }
  });
}

function playlistCard(playlist: Playlist) {
  return `<div class="profile-music-pref-playlist"><div class="profile-music-pref-playlist-cover">${playlist.cover_url ? `<img src="${esc(coverFor(playlist))}" alt="">` : '<span>♫</span>'}</div><div><strong>${esc(playlist.name)}</strong><small>${esc(playlist.description || 'Playlist pública')}</small></div></div>`;
}

async function openFeaturedPlaylists(userId: string) {
  const [playlists, featured] = await Promise.all([loadPlaylists(userId), loadFeaturedPlaylistIds(userId)]);
  const host = modal('Álbumes favoritos', `<p class="profile-music-pref-help">Aquí eliges qué playlists aparecen como tus álbumes destacados en el perfil.</p><div class="profile-music-pref-playlist-picker">${playlists.map(playlist => `<label class="profile-music-pref-playlist-option"><input type="checkbox" data-featured-playlist="${esc(playlist.id)}" ${featured.has(playlist.id) ? 'checked' : ''}><div>${playlist.cover_url ? `<img src="${esc(playlist.cover_url)}" alt="">` : '<span class="profile-music-pref-playlist-fallback">♫</span>'}</div><span><strong>${esc(playlist.name)}</strong><small>${esc(playlist.description || 'Playlist pública')}</small></span></label>`).join('') || '<div class="profile-music-pref-empty">Crea una playlist primero.</div>'}</div><div class="profile-music-pref-actions"><button type="button" data-pref-close>Cancelar</button><button type="button" class="profile-music-pref-primary" id="featuredPlaylistSave">Guardar selección</button></div>`);
  host.querySelector('#featuredPlaylistSave')?.addEventListener('click', async () => {
    try {
      const selected = Array.from(host.querySelectorAll<HTMLInputElement>('[data-featured-playlist]:checked')).map(input => input.dataset.featuredPlaylist!).filter(Boolean).slice(0, 6);
      const { error: deleteError } = await supabase.from('profile_music_featured_playlists').delete().eq('user_id', userId);
      if (deleteError) throw deleteError;
      if (selected.length) {
        const { error } = await supabase.from('profile_music_featured_playlists').insert(selected.map(playlistId => ({ user_id: userId, playlist_id: playlistId })));
        if (error) throw error;
      }
      host.remove();
      refresh();
    } catch (error: any) { window.alert(error?.message || 'No se pudo guardar la selección.'); }
  });
}

function hideDailySongAndDiaryAdd() {
  const root = page();
  if (!root) return;
  const main = root.querySelector<HTMLElement>('.profile-music-final-main');
  main?.querySelectorAll<HTMLElement>('section.profile-music-final-card').forEach(section => {
    const title = section.querySelector('h2')?.textContent?.trim() || '';
    if (title.includes('Canción del día')) section.remove();
  });
  const diary = root.querySelector<HTMLElement>('.profile-music-final-side');
  diary?.querySelectorAll<HTMLElement>('[data-music-action="add"]').forEach(button => button.remove());
}

async function renderOverrides() {
  const ctx = await resolveProfile();
  if (!ctx?.id) return;
  hideDailySongAndDiaryAdd();
  const root = page();
  if (!root) return;
  const main = root.querySelector<HTMLElement>('.profile-music-final-main');
  if (!main) return;

  const artistSection = Array.from(main.querySelectorAll<HTMLElement>('section.profile-music-final-card')).find(section => section.querySelector('h2')?.textContent?.includes('Artistas favoritos'));
  if (artistSection) {
    const artists = await loadArtists(ctx.id);
    artistSection.innerHTML = `<div class="profile-music-final-head"><div><h2>🎤 Artistas favoritos</h2><p class="profile-music-final-card-sub">Los artistas que tú eliges, no los que el sistema adivina.</p></div>${ctx.own ? '<button type="button" class="profile-music-final-link" data-pref-action="artists">Gestionar</button>' : ''}</div><div class="profile-music-pref-artist-grid">${artists.map(artistCard).join('') || '<div class="profile-music-pref-empty">Aún no has elegido artistas favoritos.</div>'}</div>`;
  }

  const albumSection = Array.from(main.querySelectorAll<HTMLElement>('section.profile-music-final-card')).find(section => section.querySelector('h2')?.textContent?.includes('Álbumes destacados'));
  if (albumSection) {
    const [playlists, featured] = await Promise.all([loadPlaylists(ctx.id), loadFeaturedPlaylistIds(ctx.id)]);
    const visible = playlists.filter(playlist => featured.has(playlist.id));
    albumSection.innerHTML = `<div class="profile-music-final-head"><div><h2>💿 Álbumes favoritos</h2><p class="profile-music-final-card-sub">Elige tus playlists favoritas para destacarlas aquí.</p></div>${ctx.own ? '<button type="button" class="profile-music-final-link" data-pref-action="playlists">Seleccionar playlists</button>' : ''}</div><div class="profile-music-pref-playlist-grid">${visible.map(playlistCard).join('') || '<div class="profile-music-pref-empty">Todavía no has seleccionado ninguna playlist.</div>'}</div>`;
  }

  if (root.dataset.profileMusicPreferencesBound !== '1') {
    root.dataset.profileMusicPreferencesBound = '1';
    root.addEventListener('click', event => {
      const target = event.target as HTMLElement;
      const action = target.closest<HTMLElement>('[data-pref-action]')?.dataset.prefAction;
      if (action === 'artists') void openArtistManager(ctx.id);
      if (action === 'playlists') void openFeaturedPlaylists(ctx.id);
    });
  }
}

function refresh() {
  window.setTimeout(() => {
    const musicTab = Array.from(document.querySelectorAll<HTMLButtonElement>('.profile-view-tabs button')).find(btn => btn.textContent?.trim() === 'Música');
    musicTab?.click();
    window.setTimeout(() => void renderOverrides(), 120);
  }, 0);
}

function boot() {
  const observer = new MutationObserver(() => {
    const root = page();
    if (!root?.querySelector('.profile-music-final')) return;
    window.setTimeout(() => void renderOverrides(), 80);
  });
  observer.observe(document.body, { childList: true, subtree: true });
  window.addEventListener('inkorium:daily-song-changed', () => window.setTimeout(() => void renderOverrides(), 100));
  window.setTimeout(() => void renderOverrides(), 300);
}

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot, { once: true }); else boot();
