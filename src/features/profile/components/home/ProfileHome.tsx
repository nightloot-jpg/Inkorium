import { Music2 } from 'lucide-react';
import { ProfileAbout } from './ProfileAbout';
import { ProfileSignatures } from './ProfileSignatures';
import { ProfileStats } from './ProfileStats';
import type { Profile, ProfileStats as ProfileStatsModel, Signature } from '../../types/profile.types';

type Props = {
  profile?: Profile;
  isOwnProfile?: boolean;
  editingCity?: boolean;
  cityDraft?: string;
  savingCity?: boolean;
  onStartCityEdit?: () => void;
  onCityDraftChange?: (value: string) => void;
  onSaveCity?: () => void;
  onCancelCity?: () => void;
  signatures: Signature[];
  loadingSignatures: boolean;
  signatureDraft: string;
  savingSignature: boolean;
  onSignatureDraftChange: (value: string) => void;
  onSubmitSignature: () => void;
  profileStats: ProfileStatsModel;
  currentSong?: { title?: string | null; artist?: string | null } | null;
  onTogglePlayback: () => void;
};

export function ProfileHome({
  profile,
  isOwnProfile = false,
  editingCity = false,
  cityDraft = '',
  savingCity = false,
  onStartCityEdit = () => undefined,
  onCityDraftChange = () => undefined,
  onSaveCity = () => undefined,
  onCancelCity = () => undefined,
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
        {profile ? (
          <ProfileAbout
            profile={profile}
            isOwnProfile={isOwnProfile}
            editingBio={false}
            bioDraft={profile.bio || ''}
            savingBio={false}
            editingCity={editingCity}
            cityDraft={cityDraft}
            savingCity={savingCity}
            onStartBioEdit={() => undefined}
            onBioDraftChange={() => undefined}
            onSaveBio={() => undefined}
            onCancelBio={() => undefined}
            onStartCityEdit={onStartCityEdit}
            onCityDraftChange={onCityDraftChange}
            onSaveCity={onSaveCity}
            onCancelCity={onCancelCity}
          />
        ) : null}
        <ProfileSignatures
          signatures={signatures}
          loading={loadingSignatures}
          draft={signatureDraft}
          saving={savingSignature}
          onDraftChange={onSignatureDraftChange}
          onSubmit={onSubmitSignature}
        />
      </main>
      <aside className="profile-view-side">
        <div className="profile-view-card profile-view-intro-card">
          <div className="profile-view-card-title"><Music2 size={18} /> ¿Qué estás escuchando ahora?</div>
          <button type="button" className="profile-view-listening" onClick={onTogglePlayback}>
            {currentSong ? `${currentSong.title || 'Canción'} · ${currentSong.artist || ''}` : 'Nada reproduciéndose ahora. Abre el reproductor global para empezar a escuchar música.'}
          </button>
        </div>
        <ProfileStats stats={profileStats} />
      </aside>
    </div>
  );
}
