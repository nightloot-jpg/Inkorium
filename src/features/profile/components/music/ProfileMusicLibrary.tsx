import { Music2, Pencil, Play, Plus, Search, Trash2, X } from 'lucide-react';
import { useState } from 'react';
import type { MusicLibraryTrack, MusicPlaylist } from '../../services/profile-music-library.service';

type Props = {
  tracks: MusicLibraryTrack[];
  favoriteIds: Set<string>;
  playlists: MusicPlaylist[];
  loading: boolean;
  canEdit: boolean;
  onPlay: (track: MusicLibraryTrack) => void;
  onToggleFavorite: (trackId: string) => Promise<void>;
  onEditTrack: (track: MusicLibraryTrack) => void;
  onDeleteTrack: (trackId: string) => Promise<void>;
  onNewPlaylist: () => void;
  onEditPlaylist: (playlist: MusicPlaylist) => void;
  onDeletePlaylist: (playlistId: string) => Promise<void>;
  onAddToPlaylist: (playlist: MusicPlaylist) => void;
};

export function ProfileMusicLibrary({ tracks, favoriteIds, playlists, loading, canEdit, onPlay, onToggleFavorite, onEditTrack, onDeleteTrack, onNewPlaylist, onEditPlaylist, onDeletePlaylist, onAddToPlaylist }: Props) {
  const [query, setQuery] = useState('');
  const visibleTracks = tracks.filter(track => `${track.title} ${track.artist || ''} ${track.album || ''}`.toLowerCase().includes(query.trim().toLowerCase()));

  if (loading) return <section className="profile-music-library"><div className="profile-music-loading">Cargando tu música...</div></section>;

  return (
    <section className="profile-music-library">
      <div className="profile-music-section-head">
        <div><h2><Music2 size={17} /> Biblioteca musical</h2><p>Tu colección de canciones y playlists.</p></div>
        {canEdit && <button type="button" className="profile-music-primary-action" onClick={onNewPlaylist}><Plus size={15} /> Nueva playlist</button>}
      </div>

      <div className="profile-music-searchbar"><Search size={15} /><input value={query} onChange={event => setQuery(event.target.value)} placeholder="Buscar en tu música..." /></div>

      {visibleTracks.length ? (
        <div className="profile-music-track-list">
          {visibleTracks.map(track => {
            const favorite = favoriteIds.has(track.id);
            return (
              <article className="profile-music-track-row" key={track.id}>
                <button type="button" className="profile-music-track-main" onClick={() => onPlay(track)}>
                  {track.cover_url || track.youtube_id ? <img src={track.cover_url || `https://i.ytimg.com/vi/${track.youtube_id}/hqdefault.jpg`} alt="" /> : <span className="profile-music-track-placeholder"><Music2 size={18} /></span>}
                  <span><strong>{track.title}</strong><small>{track.artist || 'Artista desconocido'}{track.album ? ` · ${track.album}` : ''}</small></span>
                  <Play size={16} aria-hidden="true" />
                </button>
                {canEdit && <div className="profile-music-track-actions">
                  <button type="button" aria-label={favorite ? 'Quitar de favoritos' : 'Añadir a favoritos'} className={favorite ? 'is-active' : ''} onClick={() => void onToggleFavorite(track.id)}>{favorite ? '♥' : '♡'}</button>
                  <button type="button" aria-label="Editar canción" onClick={() => onEditTrack(track)}><Pencil size={14} /></button>
                  <button type="button" aria-label="Eliminar canción" onClick={() => { if (window.confirm('¿Eliminar esta canción de tu biblioteca?')) void onDeleteTrack(track.id); }}><Trash2 size={14} /></button>
                </div>}
              </article>
            );
          })}
        </div>
      ) : <div className="profile-music-empty">{tracks.length ? 'No hay canciones que coincidan con la búsqueda.' : 'Todavía no tienes canciones guardadas.'}</div>}

      <div className="profile-music-playlists">
        <div className="profile-music-section-head"><div><h3>Playlists</h3><p>Organiza tu colección.</p></div></div>
        {playlists.length ? <div className="profile-music-playlist-grid">{playlists.map(playlist => <article className="profile-music-playlist-card" key={playlist.id}>
          <div className="profile-music-playlist-cover"><Music2 size={20} /></div>
          <div className="profile-music-playlist-body"><strong>{playlist.name}</strong><small>{playlist.description || 'Sin descripción'}</small></div>
          {canEdit && <div className="profile-music-playlist-actions"><button type="button" onClick={() => onAddToPlaylist(playlist)} aria-label="Añadir canciones"><Plus size={14} /></button><button type="button" onClick={() => onEditPlaylist(playlist)} aria-label="Editar playlist"><Pencil size={14} /></button><button type="button" onClick={() => { if (window.confirm('¿Eliminar esta playlist?')) void onDeletePlaylist(playlist.id); }} aria-label="Eliminar playlist"><X size={14} /></button></div>}
        </article>)}</div> : <div className="profile-music-empty">Todavía no tienes playlists.</div>}
      </div>
    </section>
  );
}
