import { Save, Settings2 } from 'lucide-react';
import type { MusicFeaturedPlaylist } from '../../services/profile-music-preferences.service';

type PlaylistOption = MusicFeaturedPlaylist;

type Props = {
  playlists: PlaylistOption[];
  selectedIds: string[];
  loading: boolean;
  saving: boolean;
  canEdit: boolean;
  error: string | null;
  onSave: (ids: string[]) => Promise<void>;
};

export function ProfileMusicPreferences({ playlists, selectedIds, loading, saving, canEdit, error, onSave }: Props) {
  const selected = new Set(selectedIds);

  const toggle = (id: string) => {
    if (!canEdit || saving) return;
    if (selected.has(id)) selected.delete(id);
    else if (selected.size < 6) selected.add(id);
  };

  return (
    <section className="profile-music-preferences profile-view-card">
      <div className="profile-view-section-head">
        <div>
          <h2><Settings2 size={17} /> Preferencias musicales</h2>
          <span>{selected.size}/6 playlists destacadas</span>
        </div>
      </div>
      {loading ? (
        <div className="profile-music-empty">Cargando preferencias…</div>
      ) : playlists.length ? (
        <div className="profile-music-preferences-grid">
          {playlists.map(playlist => {
            const active = selected.has(playlist.id);
            return (
              <button
                key={playlist.id}
                type="button"
                className={`profile-music-preferences-option ${active ? 'is-selected' : ''}`}
                disabled={!canEdit || saving}
                onClick={() => toggle(playlist.id)}
                aria-pressed={active}
              >
                <span className="profile-music-preferences-cover">
                  {playlist.cover_url ? <img src={playlist.cover_url} alt="" /> : <span>♫</span>}
                </span>
                <span className="profile-music-preferences-copy">
                  <strong>{playlist.name}</strong>
                  <small>{playlist.description || 'Sin descripción'}</small>
                </span>
                <span className="profile-music-preferences-check" aria-hidden="true">{active ? '✓' : ''}</span>
              </button>
            );
          })}
        </div>
      ) : (
        <div className="profile-music-empty">Crea una playlist para poder destacarla en tu perfil.</div>
      )}
      {canEdit && <div className="profile-music-preferences-actions"><button type="button" className="profile-music-primary-action" disabled={saving} onClick={() => void onSave(Array.from(selected))}><Save size={15} /> {saving ? 'Guardando…' : 'Guardar preferencias'}</button></div>}
      {error && <p className="profile-music-error" role="alert">{error}</p>}
    </section>
  );
}
