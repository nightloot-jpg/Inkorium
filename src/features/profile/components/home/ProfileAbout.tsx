import { Gamepad2, MapPin, Pencil, Save, X } from 'lucide-react';
import type { Profile } from '../../types/profile.types';

type Props = {
  profile: Profile;
  isOwnProfile: boolean;
  editingBio: boolean;
  bioDraft: string;
  savingBio: boolean;
  editingCity: boolean;
  cityDraft: string;
  savingCity: boolean;
  onStartBioEdit: () => void;
  onBioDraftChange: (value: string) => void;
  onSaveBio: () => void;
  onCancelBio: () => void;
  onStartCityEdit: () => void;
  onCityDraftChange: (value: string) => void;
  onSaveCity: () => void;
  onCancelCity: () => void;
};

export function ProfileAbout({ profile, isOwnProfile, editingBio, bioDraft, savingBio, editingCity, cityDraft, savingCity, onStartBioEdit, onBioDraftChange, onSaveBio, onCancelBio, onStartCityEdit, onCityDraftChange, onSaveCity, onCancelCity }: Props) {
  return (
    <section className="profile-view-card profile-about-card">
      <div className="profile-view-section-head"><h2>Sobre mí</h2>{isOwnProfile && !editingBio && !editingCity && <Pencil size={16} aria-hidden="true" />}</div>
      <div className="profile-about-card__rows">
        <div className="profile-about-card__row">
          <MapPin size={17} />
          {editingCity ? (
            <div className="profile-about-card__inline-editor">
              <input value={cityDraft} onChange={event => onCityDraftChange(event.target.value)} maxLength={80} autoFocus />
              <button type="button" onClick={onSaveCity} disabled={savingCity}><Save size={14} /></button>
              <button type="button" onClick={onCancelCity} disabled={savingCity}><X size={14} /></button>
            </div>
          ) : (
            <button type="button" className={isOwnProfile ? 'profile-about-card__editable' : ''} onClick={isOwnProfile ? onStartCityEdit : undefined}>{profile.city || 'Añadir ciudad'}</button>
          )}
        </div>
        <div className="profile-about-card__row"><Gamepad2 size={17} /><span>{profile.profile_interests?.length ? profile.profile_interests.join(' · ') : 'Música · Gaming · Fotografía · Cine'}</span></div>
      </div>
      <div className="profile-about-card__bio">
        {editingBio ? (
          <div className="profile-about-card__bio-editor">
            <textarea value={bioDraft} onChange={event => onBioDraftChange(event.target.value)} maxLength={180} autoFocus />
            <div className="profile-about-card__actions"><span>{bioDraft.length}/180</span><button type="button" onClick={onSaveBio} disabled={savingBio}><Save size={14} />Guardar</button><button type="button" onClick={onCancelBio} disabled={savingBio}><X size={14} />Cancelar</button></div>
          </div>
        ) : (
          <button type="button" className={isOwnProfile ? 'profile-about-card__editable profile-about-card__bio-text' : 'profile-about-card__bio-text'} onClick={isOwnProfile ? onStartBioEdit : undefined}>{profile.bio || (isOwnProfile ? 'Añade una pequeña descripción sobre ti...' : 'Sin biografía.')}</button>
        )}
      </div>
    </section>
  );
}
