import { Check, Circle, Pencil, X } from 'lucide-react';
import type { Profile, StatusValue } from '../types/profile.types';

type Props = {
  profile: Profile;
  displayName: string;
  handle: string;
  avatar: string;
  banner: string;
  isOwnProfile: boolean;
  status: StatusValue;
  statusLabel: string;
  statusClassName: string;
  savingStatus: boolean;
  savingHashtag: boolean;
  editingHashtag: boolean;
  hashtagDraft: string;
  editingBio: boolean;
  bioDraft: string;
  savingBio: boolean;
  onOpenMedia: (target: 'avatar' | 'banner') => void;
  onStatusChange: (value: StatusValue) => void;
  onStartHashtagEdit: () => void;
  onHashtagDraftChange: (value: string) => void;
  onSaveHashtag: () => void;
  onCancelHashtag: () => void;
  onStartBioEdit: () => void;
  onBioDraftChange: (value: string) => void;
  onSaveBio: () => void;
  onCancelBio: () => void;
};

export function ProfileHeader({
  profile,
  displayName,
  handle,
  avatar,
  banner,
  isOwnProfile,
  status,
  statusLabel,
  statusClassName,
  savingStatus,
  savingHashtag,
  editingHashtag,
  hashtagDraft,
  editingBio,
  bioDraft,
  savingBio,
  onOpenMedia,
  onStatusChange,
  onStartHashtagEdit,
  onHashtagDraftChange,
  onSaveHashtag,
  onCancelHashtag,
  onStartBioEdit,
  onBioDraftChange,
  onSaveBio,
  onCancelBio,
}: Props) {
  return (
    <>
      <button
        className={`profile-view-cover profile-view-cover-button ${isOwnProfile ? 'editable' : ''}`}
        type="button"
        onClick={() => onOpenMedia('banner')}
        disabled={!isOwnProfile}
        style={banner ? { backgroundImage: `url(${banner})` } : undefined}
        aria-label={isOwnProfile ? 'Cambiar foto de portada' : 'Foto de portada'}
      >
        {!banner && <div className="profile-view-cover-placeholder" />}
        {isOwnProfile && <span className="profile-view-image-overlay">Cambiar portada</span>}
      </button>

      <div className="profile-view-header">
        <div className="profile-view-avatar-wrap">
          <button
            className={`profile-view-avatar-button ${isOwnProfile ? 'editable' : ''}`}
            type="button"
            onClick={() => onOpenMedia('avatar')}
            disabled={!isOwnProfile}
            aria-label={isOwnProfile ? 'Cambiar foto de perfil' : 'Foto de perfil'}
          >
            {avatar ? <img className="profile-view-avatar" src={avatar} alt={displayName} /> : <div className="profile-view-avatar profile-view-avatar-fallback">{displayName.trim().split(/\s+/).slice(0, 2).map(part => part[0]).join('').toUpperCase() || 'U'}</div>}
          </button>
        </div>

        <div className="profile-view-identity">
          <div className="profile-view-name-row">
            <h1>{displayName}</h1>
            <span className="profile-view-verified" aria-label="Perfil verificado">✓</span>
          </div>
          <div className="profile-view-handle">{handle}</div>

          <div className="profile-view-status-row">
            <span className={`profile-view-status-dot ${statusClassName}`}>
              <Circle size={10} fill="currentColor" />
            </span>
            {isOwnProfile ? (
              <select className="profile-view-status-select" value={status} onChange={event => onStatusChange(event.target.value as StatusValue)} disabled={savingStatus} aria-label="Estado">
                <option value="conectado">Conectado</option>
                <option value="ausente">Ausente</option>
                <option value="desconectado">Desconectado</option>
              </select>
            ) : <span className="profile-view-status-label">{statusLabel}</span>}
          </div>

          {isOwnProfile ? (
            editingHashtag ? (
              <div className="profile-view-hashtag-editor">
                <input
                  autoFocus
                  value={hashtagDraft ? `#${hashtagDraft}` : ''}
                  maxLength={51}
                  placeholder="#Inkorium"
                  onChange={event => onHashtagDraftChange(event.target.value.replace(/^#+/, '').replace(/\s+/g, ''))}
                  onKeyDown={event => {
                    if (event.key === 'Enter') onSaveHashtag();
                    if (event.key === 'Escape') onCancelHashtag();
                  }}
                />
                <button type="button" onClick={onSaveHashtag} disabled={savingHashtag}><Check size={14} />Guardar</button>
                <button type="button" className="secondary" onClick={onCancelHashtag}><X size={14} /></button>
              </div>
            ) : (
              <button type="button" className="profile-view-hashtag editable" onClick={onStartHashtagEdit}>
                #{profile.profile_hashtag || 'Añadir hashtag'} <Pencil size={13} />
              </button>
            )
          ) : profile.profile_hashtag ? <span className="profile-view-hashtag">#{profile.profile_hashtag}</span> : null}

          {editingBio && isOwnProfile ? (
            <div className="profile-view-bio-editor">
              <textarea value={bioDraft} onChange={event => onBioDraftChange(event.target.value)} maxLength={180} />
              <div className="profile-view-bio-actions">
                <button type="button" onClick={onCancelBio}><X size={14} />Cancelar</button>
                <button className="primary" type="button" onClick={onSaveBio} disabled={savingBio}><Check size={14} />Guardar</button>
              </div>
            </div>
          ) : (
            <button type="button" className="profile-view-bio" onClick={onStartBioEdit}>
              {profile.bio || 'Añade una biografía para contar algo sobre ti.'}
              {isOwnProfile && <Pencil size={14} />}
            </button>
          )}
        </div>
      </div>
    </>
  );
}
