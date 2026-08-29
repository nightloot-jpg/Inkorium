import { Camera, Check, Circle, Images, MapPin, Pencil, Users, X } from 'lucide-react';
import type { Profile, ProfileStats, StatusValue } from '../types/profile.types';

type MediaTarget = 'avatar' | 'banner';

type Props = {
  profile: Profile;
  profileStats: ProfileStats;
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
  onMediaFileSelected: (target: MediaTarget, file: File) => void;
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

export function ProfileHeader({ profile, profileStats, displayName, handle, avatar, banner, isOwnProfile, status, statusLabel, statusClassName, savingStatus, savingHashtag, editingHashtag, hashtagDraft, editingBio, bioDraft, savingBio, onMediaFileSelected, onStatusChange, onStartHashtagEdit, onHashtagDraftChange, onSaveHashtag, onCancelHashtag, onStartBioEdit, onBioDraftChange, onSaveBio, onCancelBio }: Props) {
  const handleFileChange = (target: MediaTarget) => (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (file) onMediaFileSelected(target, file);
  };
  const interests = (profile.profile_interests || []).filter(Boolean).slice(0, 6);

  return <>
    {isOwnProfile && <>
      <input id="profile-upload-banner" className="profile-view-file-input" type="file" accept="image/jpeg,image/png,image/webp,image/gif" onChange={handleFileChange('banner')} aria-label="Seleccionar foto de cabecera" />
      <input id="profile-upload-avatar" className="profile-view-file-input" type="file" accept="image/jpeg,image/png,image/webp,image/gif" onChange={handleFileChange('avatar')} aria-label="Seleccionar foto de perfil" />
    </>}

    <label className={`profile-view-cover profile-view-cover-button ${isOwnProfile ? 'editable' : 'locked'}`} htmlFor={isOwnProfile ? 'profile-upload-banner' : undefined} style={banner ? { backgroundImage: `url(${banner})` } : undefined} aria-label={isOwnProfile ? 'Cambiar foto de portada' : 'Foto de portada'}>
      {!banner && <div className="profile-view-cover-placeholder" />}
      {isOwnProfile && <span className="profile-view-image-overlay"><Camera size={13} /> {banner ? 'Cambiar portada' : 'Agregar foto de cabecera'}</span>}
    </label>

    <div className="profile-view-header">
      <div className="profile-view-avatar-wrap">
        <label className={`profile-view-avatar-button ${isOwnProfile ? 'editable' : 'locked'}`} htmlFor={isOwnProfile ? 'profile-upload-avatar' : undefined} aria-label={isOwnProfile ? 'Cambiar foto de perfil' : 'Foto de perfil'}>
          {avatar ? <img className="profile-view-avatar" src={avatar} alt={displayName} /> : <div className="profile-view-avatar profile-view-avatar-fallback">{displayName.trim().split(/\s+/).slice(0, 2).map(part => part[0]).join('').toUpperCase() || 'U'}</div>}
          {isOwnProfile && <span className="profile-view-avatar-overlay"><Camera size={15} /></span>}
        </label>
      </div>

      <div className="profile-view-identity">
        <div className="profile-view-name-row"><h1>{displayName}</h1><span className="profile-view-verified" aria-label="Perfil verificado">✓</span></div>
        <div className="profile-view-handle">{handle}</div>
        <div className="profile-view-status-row">
          <span className={`profile-view-status-dot ${statusClassName}`}><Circle size={10} fill="currentColor" /></span>
          {isOwnProfile ? <select className="profile-view-status-select" value={status} onChange={event => onStatusChange(event.target.value as StatusValue)} disabled={savingStatus} aria-label="Estado"><option value="conectado">Conectado</option><option value="ausente">Ausente</option><option value="desconectado">Desconectado</option></select> : <span className="profile-view-status-label">{statusLabel}</span>}
        </div>
        {isOwnProfile ? (editingHashtag ? <div className="profile-view-hashtag-editor"><input autoFocus value={hashtagDraft ? `#${hashtagDraft}` : ''} maxLength={51} placeholder="#Inkorium" onChange={event => onHashtagDraftChange(event.target.value.replace(/^#+/, '').replace(/\s+/g, ''))} onKeyDown={event => { if (event.key === 'Enter') onSaveHashtag(); if (event.key === 'Escape') onCancelHashtag(); }} /><button type="button" onClick={onSaveHashtag} disabled={savingHashtag}><Check size={14} />Guardar</button><button type="button" className="secondary" onClick={onCancelHashtag}><X size={14} /></button></div> : <button type="button" className="profile-view-hashtag editable" onClick={onStartHashtagEdit}>#{profile.profile_hashtag || 'Añadir hashtag'} <Pencil size={13} /></button>) : profile.profile_hashtag ? <span className="profile-view-hashtag">#{profile.profile_hashtag}</span> : null}
        {editingBio && isOwnProfile ? <div className="profile-view-bio-editor"><textarea value={bioDraft} onChange={event => onBioDraftChange(event.target.value)} maxLength={180} /><div className="profile-view-bio-actions"><button type="button" onClick={onCancelBio}><X size={14} />Cancelar</button><button className="primary" type="button" onClick={onSaveBio} disabled={savingBio}><Check size={14} />Guardar</button></div></div> : <button type="button" className="profile-view-bio" onClick={onStartBioEdit}>{profile.bio || 'Añade una biografía para contar algo sobre ti.'}{isOwnProfile && <Pencil size={14} />}</button>}

        {(profile.city || interests.length > 0) && <div className="profile-profile-meta">
          {profile.city && <span><MapPin size={13} />{profile.city}</span>}
          {profile.city && interests.length > 0 && <span className="dot">·</span>}
          {interests.length > 0 && <span>{interests.slice(0, 3).map((interest, index) => <span key={`${interest}-${index}`}>{interest}{index < Math.min(interests.length, 3) - 1 ? ' · ' : ''}</span>)}</span>}
        </div>}

        <div className="profile-header-stats" aria-label="Resumen del perfil">
          <span className="profile-header-stat"><Users size={13} /><strong>{profileStats.friends_count}</strong> amigos</span>
          <span className="profile-header-stat"><Images size={13} /><strong>{profileStats.albums_count}</strong> álbumes</span>
        </div>
      </div>
    </div>
  </>;
}
