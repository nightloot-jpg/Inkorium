import { BookOpen, Heart, Images, Music2, Send, UserRound, Users } from 'lucide-react';
import type { Profile, ProfileStats, Signature } from '../../types/profile.types';
import { ProfileAbout } from './ProfileAbout';

type Props = {
  profile: Profile;
  isOwnProfile: boolean;
  editingCity: boolean;
  cityDraft: string;
  savingCity: boolean;
  onStartCityEdit: () => void;
  onCityDraftChange: (value: string) => void;
  onSaveCity: () => void;
  onCancelCity: () => void;
  editingBio: boolean;
  bioDraft: string;
  savingBio: boolean;
  onStartBioEdit: () => void;
  onBioDraftChange: (value: string) => void;
  onSaveBio: () => void;
  onCancelBio: () => void;
  signatures: Signature[];
  loadingSignatures: boolean;
  signatureDraft: string;
  savingSignature: boolean;
  onSignatureDraftChange: (value: string) => void;
  onSubmitSignature: () => void;
  profileStats: ProfileStats;
  currentSong?: { title?: string | null; artist?: string | null } | null;
  onTogglePlayback: () => void;
};

export function ProfileHome({
  profile,
  isOwnProfile,
  editingCity,
  cityDraft,
  savingCity,
  onStartCityEdit,
  onCityDraftChange,
  onSaveCity,
  onCancelCity,
  editingBio,
  bioDraft,
  savingBio,
  onStartBioEdit,
  onBioDraftChange,
  onSaveBio,
  onCancelBio,
  signatures,
  loadingSignatures,
  signatureDraft,
  savingSignature,
  onSignatureDraftChange,
  onSubmitSignature,
  profileStats,
  currentSong,
  onTogglePlayback,
}: Props) {
  return (
    <div className="profile-view-grid">
      <main className="profile-view-main">
        <ProfileAbout
          profile={profile}
          isOwnProfile={isOwnProfile}
          editingBio={editingBio}
          bioDraft={bioDraft}
          savingBio={savingBio}
          editingCity={editingCity}
          cityDraft={cityDraft}
          savingCity={savingCity}
          onStartBioEdit={onStartBioEdit}
          onBioDraftChange={onBioDraftChange}
          onSaveBio={onSaveBio}
          onCancelBio={onCancelBio}
          onStartCityEdit={onStartCityEdit}
          onCityDraftChange={onCityDraftChange}
          onSaveCity={onSaveCity}
          onCancelCity={onCancelCity}
        />

        <div className="profile-view-card profile-view-signature-card">
          <div className="profile-view-section-head"><h2><BookOpen size={17} /> Libro de firmas</h2><span>{signatures.length}</span></div>
          <div className="profile-view-signature-form">
            <textarea value={signatureDraft} onChange={event => onSignatureDraftChange(event.target.value)} placeholder="Deja una firma en este perfil..." />
            <div className="profile-view-signature-actions"><span>Máx. 500 caracteres</span><button type="button" onClick={onSubmitSignature} disabled={!signatureDraft.trim() || savingSignature}><Send size={14} />Firmar</button></div>
          </div>
          {loadingSignatures ? <div className="profile-view-empty">Cargando firmas...</div> : signatures.length === 0 ? <div className="profile-view-empty">Todavía no hay firmas. Sé la primera persona en dejar un mensaje.</div> : (
            <div className="profile-view-signatures">
              {signatures.map(signature => <article key={signature.id} className="profile-view-signature"><div>{signature.author?.avatar_url ? <img className="profile-view-signature-avatar" src={signature.author.avatar_url} alt="" /> : <div className="profile-view-signature-avatar">{(signature.author?.full_name || signature.author?.username || 'U').trim().split(/\s+/).slice(0, 2).map(part => part[0]).join('').toUpperCase()}</div>}</div><div><div className="profile-view-signature-meta">{signature.author?.full_name || signature.author?.username || 'Usuario'} · {new Date(signature.created_at).toLocaleDateString()}</div><p>{signature.content}</p></div></article>)}
            </div>
          )}
        </div>
      </main>

      <aside className="profile-view-side">
        <div className="profile-view-card profile-view-intro-card"><div className="profile-view-card-title"><Music2 size={18} /> ¿Qué estás escuchando ahora?</div><button type="button" className="profile-view-listening" onClick={onTogglePlayback}>{currentSong ? `${currentSong.title || 'Canción'} · ${currentSong.artist || ''}` : 'Nada reproduciéndose ahora. Abre el reproductor global para empezar a escuchar música.'}</button></div>
        <div className="profile-view-card"><div className="profile-view-section-head"><h2><Users size={16} /> Estadísticas</h2></div><div className="profile-view-stats-list"><div><Users size={16} /><span>Amigos</span><strong>{profileStats.friends_count}</strong></div><div><Heart size={16} /><span>Seguidores</span><strong>{profileStats.followers_count}</strong></div><div><UserRound size={16} /><span>Siguiendo</span><strong>{profileStats.following_count}</strong></div><div><Images size={16} /><span>Álbumes</span><strong>{profileStats.albums_count}</strong></div></div></div>
      </aside>
    </div>
  );
}
