import { Music2, Play } from 'lucide-react';
import type { MusicDiaryEntry } from '../../services/profile-music.service';

type Props = {
  entries: MusicDiaryEntry[];
  loading: boolean;
  onPlay: (entry: MusicDiaryEntry) => void;
};

const formatDate = (value: string) => new Date(`${value}T12:00:00`).toLocaleDateString('es-ES', {
  weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
});

const formatTime = (value: string) => new Date(value).toLocaleTimeString('es-ES', {
  hour: '2-digit', minute: '2-digit',
});

export function ProfileMusicDiary({ entries, loading, onPlay }: Props) {
  return (
    <section className="profile-music-diary">
      <div className="profile-music-section-head">
        <div>
          <h2><Music2 size={17} /> Diario musical</h2>
          <p className="profile-music-card-sub">Tu historia musical, sincronizada con la canción del día.</p>
        </div>
      </div>

      {loading ? (
        <div className="profile-music-diary__loading">Cargando diario...</div>
      ) : entries.length ? (
        <div className="profile-music-diary__list">
          {entries.map(entry => (
            <article className="profile-music-diary__entry" key={entry.id}>
              <div className="profile-music-diary__date">
                <strong>{formatDate(entry.entry_date)}</strong>
                <span>{formatTime(entry.created_at)}</span>
              </div>
              <button type="button" className="profile-music-diary__song" onClick={() => onPlay(entry)}>
                {entry.track?.cover_url ? <img src={entry.track.cover_url} alt="" /> : <span className="profile-music-diary__placeholder"><Music2 size={18} /></span>}
                <span>
                  <strong>{entry.track?.title || 'Canción'}</strong>
                  <small>{entry.track?.artist || 'Artista desconocido'}</small>
                </span>
                <Play size={16} aria-hidden="true" />
              </button>
              <span className="profile-music-diary__badge">🎵 Canción del día</span>
            </article>
          ))}
        </div>
      ) : (
        <div className="profile-music-diary__empty">Todavía no hay páginas en tu diario. Elige tu canción del día y aquí quedará registrada.</div>
      )}
    </section>
  );
}
