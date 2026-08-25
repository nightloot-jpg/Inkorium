import { useState } from 'react';
import type { MusicTasteArtist } from '../../services/profile-music-taste.service';

type Props = {
  artists: MusicTasteArtist[];
  loading: boolean;
  saving: boolean;
  canEdit: boolean;
  error: string | null;
  onAdd: (name: string) => Promise<void>;
  onRemove: (id: string) => Promise<void>;
};

export function ProfileMusicTasteCard({ artists, loading, saving, canEdit, error, onAdd, onRemove }: Props) {
  const [draft, setDraft] = useState('');
  const submit = async () => {
    const value = draft.trim();
    if (!value) return;
    await onAdd(value);
    setDraft('');
  };

  return <section className="profile-music-taste-react profile-view-card" aria-labelledby="profile-music-taste-title">
    <div className="profile-view-section-head">
      <div>
        <h2 id="profile-music-taste-title">Tu gusto musical</h2>
        <span>{artists.length}/8 artistas</span>
      </div>
    </div>
    {loading ? <div className="profile-music-taste-react-empty">Cargando tus artistas…</div> : <div className="profile-music-taste-react-list">
      {artists.map(artist => <div className="profile-music-taste-react-item" key={artist.id}>
        <div className="profile-music-taste-react-avatar" aria-hidden="true">♫</div>
        <strong>{artist.artist_name}</strong>
        {canEdit && <button type="button" disabled={saving} onClick={() => void onRemove(artist.id)} aria-label={`Quitar ${artist.artist_name}`}>×</button>}
      </div>)}
      {!artists.length && <div className="profile-music-taste-react-empty">{canEdit ? 'Añade hasta 8 artistas que formen parte de tu banda sonora.' : 'Este usuario todavía no ha elegido artistas favoritos.'}</div>}
    </div>}
    {canEdit && <div className="profile-music-taste-react-editor">
      <input value={draft} maxLength={80} placeholder="Añade un artista…" onChange={event => setDraft(event.target.value)} onKeyDown={event => { if (event.key === 'Enter') void submit(); }} disabled={saving || artists.length >= 8} />
      <button type="button" onClick={() => void submit()} disabled={saving || !draft.trim() || artists.length >= 8}>{saving ? 'Guardando…' : 'Añadir'}</button>
    </div>}
    {error && <p className="profile-music-taste-react-error" role="alert">{error}</p>}
  </section>;
}
