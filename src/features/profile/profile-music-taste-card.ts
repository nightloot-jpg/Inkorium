import { supabase } from '../../lib/supabase';
import { usePlayerStore } from '../../lib/store';
import './profile-music-taste-card.css';

type FavoriteArtist = {
  id: string;
  artist_name: string;
  youtube_channel_id: string | null;
  youtube_video_id: string | null;
  cover_url: string | null;
};

const MAX_ARTISTS = 8;
const DISPLAY_ARTISTS = 5;
const esc = (value: unknown) => String(value ?? '').replace(/[&<>\"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '\"': '&quot;', "'": '&#39;' }[char] || char));
const root = () => document.querySelector<HTMLElement>('.profile-view-page');

async function resolveProfile() {
  const page = root();
  if (!page) return null;
  const session = await supabase.auth.getSession();
  const ownId = session.data.session?.user?.id || '';
  const handle = page.querySelector('.profile-view-handle')?.textContent?.trim().replace(/^@/, '') || '';
  if (!handle) return { id: ownId, own: true };
  const { data } = await supabase.from('profiles').select('id').eq('username', handle).maybeSingle();
  return { id: data?.id || '', own: data?.id === ownId };
}

async function loadArtists(userId: string) {
  const { data, error } = await supabase
    .from('profile_music_favorite_artists')
    .select('id,artist_name,youtube_channel_id,youtube_video_id,cover_url')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(MAX_ARTISTS);
  if (error) throw error;
  return (data || []) as FavoriteArtist[];
}

function closeModal() {
  document.querySelector('.profile-music-taste-modal-backdrop')?.remove();
}

function openModal(title: string, body: string) {
  closeModal();
  const host = document.createElement('div');
  host.className = 'profile-music-taste-modal-backdrop';
  host.innerHTML = `<div class="profile-music-taste-modal" role="dialog" aria-modal="true" aria-label="${esc(title)}">
    <div class="profile-music-taste-modal-head"><div><strong>${esc(title)}</strong><small>Elige los artistas que quieres enseñar en tu perfil.</small></div><button type="button" data-taste-close aria-label="Cerrar">×</button></div>
    <div class="profile-music-taste-modal-body">${body}</div>
  </div>`;
  document.body.appendChild(host);
  host.addEventListener('click', event => {
    const target = event.target as HTMLElement;
    if (target === host || target.closest('[data-taste-close]')) closeModal();
  });
  return host;
}

function artistPill(artist: FavoriteArtist) {
  const cover = artist.cover_url || '';
  return `<button type="button" class="profile-music-taste-pill" data-taste-play="${esc(artist.youtube_video_id || '')}" data-taste-artist="${esc(artist.artist_name)}" title="${esc(artist.artist_name)}">
    ${cover ? `<img src="${esc(cover)}" alt="">` : '<span class="profile-music-taste-pill-icon">♫</span>'}
    <span>${esc(artist.artist_name)}</span>
  </button>`;
}

function renderCard(card: HTMLElement, artists: FavoriteArtist[], own: boolean) {
  const visible = artists.slice(0, DISPLAY_ARTISTS);
  const remaining = Math.max(0, artists.length - visible.length);
  card.innerHTML = `<div class="profile-music-taste-head">
    <div class="profile-music-taste-title">🎶 <span>Tu gusto musical</span></div>
    ${own ? '<button type="button" class="profile-music-taste-edit" data-taste-edit>Editar</button>' : ''}
  </div>
  <p class="profile-music-taste-sub">Tus artistas favoritos y sonidos principales.</p>
  <div class="profile-music-taste-pills">
    ${visible.map(artistPill).join('') || '<span class="profile-music-taste-empty">Aún no has elegido artistas favoritos.</span>'}
    ${remaining ? `<span class="profile-music-taste-more">+${remaining} más</span>` : ''}
  </div>`;
}

async function openManager(userId: string) {
  const page = root();
  if (!page) return;
  const session = await supabase.auth.getSession();
  if (session.data.session?.user?.id !== userId) return;

  let artists = await loadArtists(userId);
  const host = openModal('Tu gusto musical', `<p class="profile-music-taste-help">Busca artistas en YouTube y selecciona hasta ${MAX_ARTISTS}. Los cambios se guardan directamente en tu perfil.</p>
    <div class="profile-music-taste-search"><input id="tasteArtistSearch" type="search" placeholder="Busca un artista..." autocomplete="off"><button type="button" id="tasteArtistSearchButton">Buscar</button></div>
    <div id="tasteArtistResults" class="profile-music-taste-results"><div class="profile-music-taste-empty-box">Busca un artista para empezar.</div></div>
    <div class="profile-music-taste-selected"><div class="profile-music-taste-selected-head"><strong>Mis artistas</strong><span id="tasteArtistCount"></span></div><div id="tasteArtistSelected"></div></div>`);

  const results = host.querySelector<HTMLElement>('#tasteArtistResults')!;
  const selected = host.querySelector<HTMLElement>('#tasteArtistSelected')!;
  const count = host.querySelector<HTMLElement>('#tasteArtistCount')!;

  const refreshSelected = () => {
    count.textContent = `${artists.length}/${MAX_ARTISTS}`;
    selected.innerHTML = artists.map(artist => `<div class="profile-music-taste-selected-row">
      ${artist.cover_url ? `<img src="${esc(artist.cover_url)}" alt="">` : '<span class="profile-music-taste-selected-icon">♫</span>'}
      <div><strong>${esc(artist.artist_name)}</strong><small>Artista favorito</small></div>
      <button type="button" data-taste-remove="${esc(artist.id)}" aria-label="Quitar ${esc(artist.artist_name)}">×</button>
    </div>`).join('') || '<div class="profile-music-taste-empty-box">Todavía no tienes artistas favoritos.</div>';
  };
  refreshSelected();

  const search = async () => {
    const query = host.querySelector<HTMLInputElement>('#tasteArtistSearch')!.value.trim();
    if (!query) return;
    results.innerHTML = '<div class="profile-music-taste-loading">Buscando artistas…</div>';
    try {
      const key = import.meta.env.VITE_YOUTUBE_API_KEY;
      if (!key) throw new Error('Falta VITE_YOUTUBE_API_KEY');
      const url = `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${encodeURIComponent(query)}&type=channel&maxResults=10&key=${key}`;
      const response = await fetch(url);
      const data = await response.json();
      if (!response.ok) throw new Error(data?.error?.message || 'No se pudo buscar en YouTube.');
      const items = (data.items || []).filter((item: any) => item.id?.channelId);
      results.innerHTML = items.map((item: any) => {
        const channelId = item.id.channelId;
        const name = item.snippet?.title || 'Artista';
        const cover = item.snippet?.thumbnails?.high?.url || item.snippet?.thumbnails?.medium?.url || item.snippet?.thumbnails?.default?.url || '';
        const saved = artists.some(artist => artist.artist_name.toLowerCase() === name.toLowerCase());
        const disabled = saved || artists.length >= MAX_ARTISTS;
        return `<div class="profile-music-taste-result"><img src="${esc(cover)}" alt=""><div><strong>${esc(name)}</strong><small>Canal de YouTube</small></div><button type="button" data-taste-save data-channel-id="${esc(channelId)}" data-artist-name="${esc(name)}" data-cover="${esc(cover)}" ${disabled ? 'disabled' : ''}>${saved ? 'Guardado' : 'Añadir'}</button></div>`;
      }).join('') || '<div class="profile-music-taste-empty-box">No encontramos artistas con ese nombre.</div>';
    } catch (error: any) {
      results.innerHTML = `<div class="profile-music-taste-empty-box profile-music-taste-error">${esc(error?.message || 'No se pudo buscar.')}</div>`;
    }
  };

  host.querySelector('#tasteArtistSearchButton')?.addEventListener('click', () => void search());
  host.querySelector<HTMLInputElement>('#tasteArtistSearch')?.addEventListener('keydown', event => { if (event.key === 'Enter') void search(); });

  results.addEventListener('click', async event => {
    const button = (event.target as HTMLElement).closest<HTMLButtonElement>('[data-taste-save]');
    if (!button || button.disabled) return;
    try {
      const artistName = button.dataset.artistName?.trim() || '';
      if (!artistName || artists.length >= MAX_ARTISTS) return;
      const { data, error } = await supabase.from('profile_music_favorite_artists').insert({
        user_id: userId,
        artist_name: artistName,
        youtube_channel_id: button.dataset.channelId || null,
        cover_url: button.dataset.cover || null,
      }).select('id,artist_name,youtube_channel_id,youtube_video_id,cover_url').single();
      if (error) throw error;
      artists = [data as FavoriteArtist, ...artists.filter(item => item.artist_name.toLowerCase() !== artistName.toLowerCase())].slice(0, MAX_ARTISTS);
      refreshSelected();
      button.textContent = 'Guardado';
      button.disabled = true;
      await refreshCardForUser(userId);
    } catch (error: any) {
      window.alert(error?.message || 'No se pudo guardar el artista.');
    }
  });

  selected.addEventListener('click', async event => {
    const button = (event.target as HTMLElement).closest<HTMLButtonElement>('[data-taste-remove]');
    if (!button) return;
    try {
      const { error } = await supabase.from('profile_music_favorite_artists').delete().eq('id', button.dataset.tasteRemove!).eq('user_id', userId);
      if (error) throw error;
      artists = artists.filter(artist => artist.id !== button.dataset.tasteRemove);
      refreshSelected();
      await refreshCardForUser(userId);
    } catch (error: any) {
      window.alert(error?.message || 'No se pudo quitar el artista.');
    }
  });
}

async function refreshCardForUser(userId: string) {
  const page = root();
  const card = page?.querySelector<HTMLElement>('.profile-music-side .profile-music-side-card[data-taste-card]');
  if (!card) return;
  try {
    const artists = await loadArtists(userId);
    const session = await supabase.auth.getSession();
    renderCard(card, artists, session.data.session?.user?.id === userId);
  } catch {
    // Keep the existing card visible if a refresh fails.
  }
}

async function enhanceCard(card: HTMLElement) {
  if (card.dataset.tasteCard === 'ready') return;
  const context = await resolveProfile();
  if (!context?.id) return;
  card.dataset.tasteCard = 'ready';
  try {
    renderCard(card, await loadArtists(context.id), context.own);
  } catch {
    // If the optional preferences table is not available yet, leave the original card intact.
    delete card.dataset.tasteCard;
    return;
  }
  card.addEventListener('click', async event => {
    const target = event.target as HTMLElement;
    const edit = target.closest<HTMLElement>('[data-taste-edit]');
    if (edit && context.own) {
      event.preventDefault();
      event.stopPropagation();
      await openManager(context.id);
      return;
    }
    const play = target.closest<HTMLElement>('[data-taste-play]');
    if (play?.dataset.tastePlay) {
      const videoId = play.dataset.tastePlay;
      usePlayerStore.getState().playSong({ type: 'youtube_song', video_id: videoId, title: play.dataset.tasteArtist || 'YouTube', artist: play.dataset.tasteArtist || undefined, channel_title: play.dataset.tasteArtist || undefined, thumbnail: `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg` } as any, false);
    }
  });
}

function scan() {
  document.querySelectorAll<HTMLElement>('.profile-music-side .profile-music-side-card').forEach(card => {
    if (card.querySelector('.profile-music-side-title')?.textContent?.includes('Tu gusto musical')) void enhanceCard(card);
  });
}

function boot() {
  scan();
  const observer = new MutationObserver(scan);
  observer.observe(document.body, { childList: true, subtree: true });
  window.addEventListener('inkorium:daily-song-changed', scan);
}

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot, { once: true }); else boot();
