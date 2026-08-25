import { useState } from 'react';
import { Music2, Play, Search, X } from 'lucide-react';
import type { DailySongTrack } from '../../services/profile-daily-song.service';
import { trackCover } from '../../services/profile-daily-song.service';

type Props = {
  song: DailySongTrack | null;
  loading: boolean;
  saving: boolean;
  canEdit: boolean;
  search: (query: string) => Promise<DailySongTrack[]>;
  getSavedMusic: (profileId: string) => Promise<DailySongTrack[]>;
  onChoose: (track: DailySongTrack) => Promise<void>;
  onPlay: (track: DailySongTrack) => void;
};

export function ProfileDailySong({ song, loading, saving, canEdit, search, getSavedMusic, onChoose, onPlay }: Props) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<DailySongTrack[]>([]);
  const [busy, setBusy] = useState(false);
  const [mode, setMode] = useState<'youtube' | 'saved'>('youtube');

  const runSearch = async () => {
    if (!query.trim()) return;
    setBusy(true);
    try { setResults(await search(query.trim())); } finally { setBusy(false); }
  };

  const loadSaved = async () => {
    setBusy(true);
    try { setResults(await getSavedMusic()); } finally { setBusy(false); }
  };

  const choose = async (track: DailySongTrack) => {
    try { await onChoose(track); setOpen(false); } catch { /* hook exposes the error to the parent */ }
  };

  return (
    <>
      <section className="profile-daily-song-card">
        <div className="profile-daily-head">
          <span><Music2 size={15} /> Canción del día</span>
          {canEdit && <button type="button" onClick={() => setOpen(true)}>{song ? 'Cambiar canción del día' : 'Elegir canción del día'}</button>}
        </div>
        {loading ? <div className="profile-daily-loading">Cargando...</div> : song ? (
          <button type="button" className="profile-daily-current" onClick={() => onPlay(song)}>
            {trackCover(song) ? <img src={trackCover(song)} alt="" /> : <span className="profile-daily-placeholder"><Music2 size={18} /></span>}
            <span><strong>{song.title}</strong><small>{song.artist || 'Artista desconocido'}</small></span><Play size={16} />
          </button>
        ) : <p>Todavía no has elegido una canción para hoy.</p>}
      </section>

      {open && canEdit && <div className="profile-daily-song-modal-backdrop" role="presentation" onMouseDown={event => { if (event.target === event.currentTarget) setOpen(false); }}>
        <div className="profile-daily-song-modal" role="dialog" aria-modal="true" aria-label="Elegir canción del día">
          <header><strong>Elegir canción del día</strong><button type="button" onClick={() => setOpen(false)} aria-label="Cerrar"><X size={17} /></button></header>
          <div className="profile-daily-song-modal-body">
            <p className="profile-daily-muted">Solo una canción por día. Después de confirmarla quedará guardada en tu Diario musical.</p>
            <div className="profile-daily-tabs"><button type="button" className={mode === 'youtube' ? 'active' : ''} onClick={() => { setMode('youtube'); setResults([]); }}>YouTube</button><button type="button" className={mode === 'saved' ? 'active' : ''} onClick={() => { setMode('saved'); void loadSaved(); }}>Mi música</button></div>
            {mode === 'youtube' && <div className="profile-daily-search"><input value={query} onChange={event => setQuery(event.target.value)} onKeyDown={event => { if (event.key === 'Enter') void runSearch(); }} placeholder="Busca una canción, artista o vídeo..." autoFocus /><button type="button" onClick={() => void runSearch()} disabled={busy}><Search size={15} /> Buscar</button></div>}
            <div className="profile-daily-results">{busy ? <div className="profile-daily-loading">Cargando...</div> : results.length ? results.map(track => <div className="profile-daily-row" key={`${track.youtube_id || track.id}-${track.title}`}><img src={trackCover(track)} alt="" /><div><strong>{track.title}</strong><small>{track.artist || 'Artista desconocido'}</small></div><button type="button" disabled={saving} onClick={() => void choose(track)}>Elegir</button></div>) : <div className="profile-daily-empty">{mode === 'saved' ? 'No tienes canciones guardadas.' : 'Busca una canción o un artista para empezar.'}</div>}</div>
          </div>
        </div>
      </div>}
    </>
  );
}
