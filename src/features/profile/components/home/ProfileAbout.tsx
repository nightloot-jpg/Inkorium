import { Gamepad2, MapPin, Pencil, Save, X } from 'lucide-react';
import type { Profile } from '../../types/profile.types';

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
};

export function ProfileAbout({ profile, isOwnProfile, editingCity, cityDraft, savingCity, onStartCityEdit, onCityDraftChange, onSaveCity, onCancelCity }: Props) {
  return (
    <section className="profile-view-card profile-about-card">
      <div className="profile-view-section-head"><h2>Sobre mí</h2></div>
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
            <button type="button" className={isOwnProfile ? 'profile-about-card__editable' : ''} onClick={isOwnProfile ? onStartCityEdit : undefined}>
              {profile.city || 'Añadir ciudad'}{isOwnProfile && <Pencil size={13} />}
            </button>
          )}
        </div>
        <div className="profile-about-card__row">
          <Gamepad2 size={17} />
          <span>{profile.profile_interests?.length ? profile.profile_interests.join(' · ') : 'Música · Gaming · Fotografía · Cine'}</span>
        </div>
      </div>
    </section>
  );
}
