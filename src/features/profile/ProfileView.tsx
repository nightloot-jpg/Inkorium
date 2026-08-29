import { useEffect, useState } from 'react';
import { Images } from 'lucide-react';
import { useAuthStore, usePlayerStore } from '../../lib/store';
import type { ProfileViewProps, StatusValue, MediaTarget } from './types/profile.types';
import type { MusicDiaryEntry } from './services/profile-music.service';
import type { DailySongTrack } from './services/profile-daily-song.service';
import type { MusicLibraryTrack } from './services/profile-music-library.service';
import type { MusicPlaylist } from './services/profile-music-library.service';
import { useProfile } from './hooks/useProfile';
import { useProfileStats } from './hooks/useProfileStats';
import { useProfileSignatures } from './hooks/useProfileSignatures';
import { useProfileMedia } from './hooks/useProfileMedia';
import { useProfileMusicDiary } from './hooks/useProfileMusicDiary';
import { useProfileDailySong } from './hooks/useProfileDailySong';
import { useProfileMusicLibrary } from './hooks/useProfileMusicLibrary';
import { useProfileMusicTaste } from './hooks/useProfileMusicTaste';
import { useProfileMusicPreferences } from './hooks/useProfileMusicPreferences';
import { ProfileHeader } from './components/ProfileHeader';
import { ProfileTabs, type ProfileTab } from './components/ProfileTabs';
import { ProfileSideNav } from './components/ProfileSideNav';
import { ProfileHome } from './components/home/ProfileHome';
import { ProfileMusicDiary } from './components/music/ProfileMusicDiary';
import { ProfileDailySong } from './components/music/ProfileDailySong';
import { ProfileMusicLibrary } from './components/music/ProfileMusicLibrary';
import { ProfileMusicTasteCard } from './components/music/ProfileMusicTasteCard';
import { ProfileMusicPreferencesPanel } from './components/music/ProfileMusicPreferencesPanel';
import { ProfileVideos } from './components/ProfileVideos';
import './profile-view.css';
import './profile-about-card.css';
import './profile-global.css';
import './profile-videos-tab-2026.css';
import './profile-tuenti-2026.css';
import './profile-media-upload.css';
import './profile-media-final-2026.css';

const STATUS_META: Record<StatusValue, { label: string; className: string }> = { conectado: { label: 'Conectado', className: 'online' }, ausente: { label: 'Ausente', className: 'away' }, desconectado: { label: 'Desconectado', className: 'offline' } };
const normalizeStatus = (value: string | null | undefined): StatusValue => value === 'ausente' || value === 'desconectado' ? value : 'conectado';

export function ProfileView({ session, profile: initialProfile, profileId, username }: ProfileViewProps) {
  const [activeTab, setActiveTab] = useState<ProfileTab>('Inicio');
  const [status, setStatus] = useState<StatusValue>(normalizeStatus(initialProfile?.user_status));
  const [savingStatus, setSavingStatus] = useState(false);
  const [editingBio, setEditingBio] = useState(false);
  const [bioDraft, setBioDraft] = useState(initialProfile?.bio || '');
  const [savingBio, setSavingBio] = useState(false);
  const [editingHashtag, setEditingHashtag] = useState(false);
  const [hashtagDraft, setHashtagDraft] = useState(initialProfile?.profile_hashtag || '');
  const [savingHashtag, setSavingHashtag] = useState(false);
  const [signatureDraft, setSignatureDraft] = useState('');
  const globalProfile = useAuthStore(state => state.profile);
  const updateGlobalProfile = useAuthStore(state => state.updateProfile);
  const currentSong = usePlayerStore(state => state.currentSong);
  const isPlaying = usePlayerStore(state => state.isPlaying);
  const pendingPlay = usePlayerStore(state => state.pendingPlay);
  const pause = usePlayerStore(state => state.pause);
  const resume = usePlayerStore(state => state.resume);
  const openPlayer = usePlayerStore(state => state.openPlayer);
  const playSong = usePlayerStore(state => state.playSong);
  const { profile, update, updateStatus } = useProfile(profileId, initialProfile);
  const { stats: profileStats } = useProfileStats(profileId);
  const { signatures, loading: loadingSignatures, saving: savingSignature, submit: submitSignature } = useProfileSignatures(profileId, session.user.id);
  const ownProfile = profileId === session.user.id;
  const { uploadingMedia, handleMediaFileSelected, gallery, loadingGallery, loadGallery } = useProfileMedia({
    isOwnProfile: ownProfile,
    profileId,
    onMediaUpdated: (target, url) => {
      const fields = target === 'banner' ? { banner_url: url } : { avatar_url: url };
      updateGlobalProfile(fields);
      void update(fields);
    },
  });
  const { entries: musicDiary, loading: loadingMusicDiary } = useProfileMusicDiary(profileId, activeTab === 'Música', profileId === session.user.id);
  const { song: dailySong, loading: loadingDailySong, saving: savingDailySong, search: searchDailySong, getSavedMusic, choose: chooseDailySong } = useProfileDailySong(profileId, activeTab === 'Música');
  const { tracks: musicTracks, favoriteIds, playlists, loading: loadingMusicLibrary, toggleFavorite, editTrack, removeTrack, createPlaylist, updatePlaylist, deletePlaylist, addTrackToPlaylist } = useProfileMusicLibrary(profileId, activeTab === 'Música');
  const { artists: musicTasteArtists, loading: loadingMusicTaste, saving: savingMusicTaste, error: musicTasteError, addArtist: addMusicTasteArtist, removeArtist: removeMusicTasteArtist } = useProfileMusicTaste(profileId, activeTab === 'Música');
  const musicPreferences = useProfileMusicPreferences(profileId, activeTab === 'Música');
  const displayProfile = profile || initialProfile;
  const displayName = displayProfile?.full_name || displayProfile?.username || username || 'Usuario';
  const handle = displayProfile?.username ? `@${displayProfile.username}` : `@${username}`;
  const effectiveStatus = ownProfile ? normalizeStatus(globalProfile?.user_status ?? status) : normalizeStatus(displayProfile?.user_status);
  const statusMeta = STATUS_META[effectiveStatus];

  useEffect(() => { setStatus(normalizeStatus(displayProfile?.user_status)); setBioDraft(displayProfile?.bio || ''); setHashtagDraft(displayProfile?.profile_hashtag || ''); }, [displayProfile?.bio, displayProfile?.profile_hashtag, displayProfile?.user_status]);
  useEffect(() => { if (activeTab === 'Fotos') void loadGallery(profileId).catch(error => console.error('Error loading profile gallery:', error)); }, [activeTab, loadGallery, profileId]);

  const saveStatus = async (next: StatusValue) => { if (!ownProfile) return; setSavingStatus(true); try { await updateStatus(next); setStatus(next); updateGlobalProfile({ user_status: next }); window.dispatchEvent(new CustomEvent('inkorium-user-status-updated', { detail: { userId: session.user.id, status: next } })); } catch (error) { window.alert(`No se pudo guardar el estado: ${error instanceof Error ? error.message : 'Error desconocido'}`); } finally { setSavingStatus(false); } };
  const saveBio = async () => { if (!ownProfile) return; setSavingBio(true); const value = bioDraft.trim().slice(0, 180); try { await update({ bio: value || null }); updateGlobalProfile({ bio: value || null }); setEditingBio(false); } catch (error) { window.alert(`No se pudo guardar la biografía: ${error instanceof Error ? error.message : 'Error desconocido'}`); } finally { setSavingBio(false); } };
  const saveHashtag = async () => { if (!ownProfile) return; setSavingHashtag(true); const value = hashtagDraft.trim().replace(/^#+/, '').replace(/\s+/g, '').slice(0, 50); try { await update({ profile_hashtag: value || null }); setHashtagDraft(value); setEditingHashtag(false); } catch (error) { window.alert(`No se pudo guardar el hashtag: ${error instanceof Error ? error.message : 'Error desconocido'}`); } finally { setSavingHashtag(false); } };
  const handleSubmitSignature = async () => { if (!signatureDraft.trim()) return; try { await submitSignature(signatureDraft); setSignatureDraft(''); } catch (error) { window.alert(`No se pudo dejar la firma: ${error instanceof Error ? error.message : 'Error desconocido'}`); } };
  const togglePlayback = () => { if (!currentSong) { openPlayer(); return; } if (isPlaying || pendingPlay) pause(); else resume(); };
  const playTrack = (track: DailySongTrack | MusicLibraryTrack) => { playSong({ id: track.id, title: track.title, artist: track.artist || undefined, thumbnail: track.cover_url || undefined, video_id: track.youtube_id || undefined, source_type: track.source_type === 'local' ? 'local' : 'youtube' }, true); };
  const playDiaryEntry = (entry: MusicDiaryEntry) => { if (!entry.track) return; playSong({ id: entry.track.id, title: entry.track.title, artist: entry.track.artist || undefined, thumbnail: entry.track.cover_url || undefined, video_id: entry.track.youtube_id || undefined, source_type: entry.track.source_type === 'local' ? 'local' : 'youtube' }, true); };
  if (!displayProfile) return null;

  const handleEditTrack = (track: MusicLibraryTrack) => { const title = window.prompt('Título', track.title); if (title === null) return; const artist = window.prompt('Artista', track.artist || '') ?? ''; const album = window.prompt('Álbum', track.album || '') ?? ''; void editTrack(track.id, { title, artist, album }).catch(error => window.alert(error instanceof Error ? error.message : 'No se pudo editar la canción.')); };
  const handleAddToPlaylist = async (playlist: MusicPlaylist) => { const track = musicTracks[0]; if (!track) return; try { await addTrackToPlaylist(playlist.id, track.id); } catch (error) { window.alert(error instanceof Error ? error.message : 'No se pudo añadir la canción.'); } };

  return <section className="profile-view-page">
    {uploadingMedia && <div className="profile-media-upload-status" role="status" aria-live="polite">Subiendo imagen…</div>}
    <ProfileHeader profile={displayProfile} displayName={displayName} handle={handle} avatar={displayProfile.avatar_url || ''} banner={displayProfile.banner_url || ''} isOwnProfile={ownProfile} status={effectiveStatus} statusLabel={statusMeta.label} statusClassName={statusMeta.className} savingStatus={savingStatus} savingHashtag={savingHashtag} editingHashtag={editingHashtag} hashtagDraft={hashtagDraft} editingBio={editingBio} bioDraft={bioDraft} savingBio={savingBio} onMediaFileSelected={(target: MediaTarget, file: File) => { void handleMediaFileSelected(target, file); }} onStatusChange={saveStatus} onStartHashtagEdit={() => setEditingHashtag(true)} onHashtagDraftChange={setHashtagDraft} onSaveHashtag={() => void saveHashtag()} onCancelHashtag={() => { setEditingHashtag(false); setHashtagDraft(displayProfile.profile_hashtag || ''); }} onStartBioEdit={() => { if (ownProfile) setEditingBio(true); }} onBioDraftChange={setBioDraft} onSaveBio={() => void saveBio()} onCancelBio={() => setEditingBio(false)} />
    <ProfileTabs activeTab={activeTab} onChange={setActiveTab} />
    <div className="profile-view-layout">
      <ProfileSideNav activeTab={activeTab} onChange={setActiveTab} />
      <div className="profile-view-route-content">
        {activeTab === 'Inicio' && <ProfileHome signatures={signatures} loadingSignatures={loadingSignatures} signatureDraft={signatureDraft} savingSignature={savingSignature} onSignatureDraftChange={setSignatureDraft} onSubmitSignature={() => void handleSubmitSignature()} profileStats={profileStats} currentSong={currentSong} onTogglePlayback={togglePlayback} />}
        {activeTab === 'Fotos' && <div className="profile-view-card"><div className="profile-view-section-head"><h2><Images size={17} /> Fotos</h2><span>{gallery.length}</span></div><div className="profile-media-gallery">{loadingGallery ? [1,2,3,4].map(item => <span key={item} />) : gallery.map(photo => <button key={photo.id} type="button"><img src={photo.url} alt={photo.caption || 'Foto'} /></button>)}</div></div>}
        {activeTab === 'Videos' && <ProfileVideos profileId={profileId} />}
        {activeTab === 'Música' && <div className="profile-music-stack">
          <ProfileDailySong song={dailySong} loading={loadingDailySong} saving={savingDailySong} canEdit={ownProfile} search={searchDailySong} getSavedMusic={getSavedMusic} onChoose={chooseDailySong} onPlay={playTrack} />
          <ProfileMusicLibrary tracks={musicTracks} favoriteIds={favoriteIds} playlists={playlists} loading={loadingMusicLibrary} canEdit={ownProfile} onPlay={playTrack} onToggleFavorite={toggleFavorite} onEditTrack={handleEditTrack} onDeleteTrack={removeTrack} onNewPlaylist={() => { const name = window.prompt('Nombre de la playlist'); if (name) void createPlaylist(name, '', true); }} onEditPlaylist={playlist => { const name = window.prompt('Nombre', playlist.name) ?? playlist.name; void updatePlaylist(playlist.id, name, playlist.description || '', playlist.is_public !== false); }} onDeletePlaylist={deletePlaylist} onAddToPlaylist={handleAddToPlaylist} />
          <ProfileMusicTasteCard artists={musicTasteArtists} loading={loadingMusicTaste} saving={savingMusicTaste} canEdit={ownProfile} error={musicTasteError} onAdd={addMusicTasteArtist} onRemove={removeMusicTasteArtist} />
          <ProfileMusicPreferencesPanel playlists={musicPreferences.featuredPlaylists} selectedIds={musicPreferences.featuredPlaylists.map(item => item.id)} saving={musicPreferences.saving} canEdit={ownProfile} error={musicPreferences.error} onSave={musicPreferences.save} />
          <ProfileMusicDiary entries={musicDiary} loading={loadingMusicDiary} onPlay={playDiaryEntry} />
        </div>}
      </div>
    </div>
  </section>;
}
