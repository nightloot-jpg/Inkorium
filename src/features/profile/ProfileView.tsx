import { useEffect, useState } from 'react';
import { Images } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuthStore, usePlayerStore } from '../../lib/store';
import type { GalleryPhoto, MediaTarget, Profile, ProfileStats, ProfileViewProps, Signature, StatusValue } from './types/profile.types';
import { ProfileHeader } from './components/ProfileHeader';
import { ProfileTabs, type ProfileTab } from './components/ProfileTabs';
import { ProfileHome } from './components/home/ProfileHome';
import './profile-view.css';
import './profile-about-card.css';
import './profile-global.css';

const STATUS_META: Record<StatusValue, { label: string; className: string }> = {
  conectado: { label: 'Conectado', className: 'online' },
  ausente: { label: 'Ausente', className: 'away' },
  desconectado: { label: 'Desconectado', className: 'offline' },
};

const normalizeStatus = (value: string | null | undefined): StatusValue => value === 'ausente' || value === 'desconectado' ? value : 'conectado';

export function ProfileView({ session, profile, profileId, username }: ProfileViewProps) {
  const [activeTab, setActiveTab] = useState<ProfileTab>('Inicio');
  const [viewedProfile, setViewedProfile] = useState<Profile | null>(profile);
  const [viewedProfileId, setViewedProfileId] = useState(profileId);
  const [status, setStatus] = useState<StatusValue>(normalizeStatus(profile?.user_status));
  const [savingStatus, setSavingStatus] = useState(false);
  const [editingBio, setEditingBio] = useState(false);
  const [bioDraft, setBioDraft] = useState(profile?.bio || '');
  const [savingBio, setSavingBio] = useState(false);
  const [editingHashtag, setEditingHashtag] = useState(false);
  const [hashtagDraft, setHashtagDraft] = useState(profile?.profile_hashtag || '');
  const [savingHashtag, setSavingHashtag] = useState(false);
  const [signatures, setSignatures] = useState<Signature[]>([]);
  const [loadingSignatures, setLoadingSignatures] = useState(true);
  const [signatureDraft, setSignatureDraft] = useState('');
  const [savingSignature, setSavingSignature] = useState(false);
  const [profileStats, setProfileStats] = useState<ProfileStats>({ friends_count: 0, followers_count: 0, following_count: 0, albums_count: 0 });
  const [gallery, setGallery] = useState<GalleryPhoto[]>([]);
  const [loadingGallery, setLoadingGallery] = useState(false);

  const globalProfile = useAuthStore(state => state.profile);
  const updateGlobalProfile = useAuthStore(state => state.updateProfile);
  const currentSong = usePlayerStore(state => state.currentSong);
  const isPlaying = usePlayerStore(state => state.isPlaying);
  const pendingPlay = usePlayerStore(state => state.pendingPlay);
  const pause = usePlayerStore(state => state.pause);
  const resume = usePlayerStore(state => state.resume);
  const openPlayer = usePlayerStore(state => state.openPlayer);

  const isOwnProfile = viewedProfileId === session.user.id;
  const displayProfile = viewedProfile || profile;
  const displayName = displayProfile?.full_name || displayProfile?.username || username || 'Usuario';
  const handle = displayProfile?.username ? `@${displayProfile.username}` : `@${username}`;
  const avatar = displayProfile?.avatar_url || '';
  const banner = displayProfile?.banner_url || '';
  const effectiveStatus = isOwnProfile ? normalizeStatus(globalProfile?.user_status ?? status) : normalizeStatus(displayProfile?.user_status);
  const statusMeta = STATUS_META[effectiveStatus];

  useEffect(() => {
    let cancelled = false;
    setViewedProfileId(profileId);

    async function resolveProfile() {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, username, full_name, bio, city, avatar_url, banner_url, user_status, profile_interests, profile_hashtag')
        .eq('id', profileId)
        .maybeSingle();
      if (cancelled) return;
      if (error) console.error('Error loading profile:', error);
      const resolved = (data || profile || null) as Profile | null;
      setViewedProfile(resolved);
      if (profileId === session.user.id && resolved) {
        setStatus(normalizeStatus(resolved.user_status));
        updateGlobalProfile({ user_status: resolved.user_status });
      }
    }

    void resolveProfile();
    return () => { cancelled = true; };
  }, [profile, profileId, session.user.id, updateGlobalProfile]);

  useEffect(() => {
    if (isOwnProfile) {
      if (globalProfile?.user_status) setStatus(normalizeStatus(globalProfile.user_status));
      setBioDraft(globalProfile?.bio ?? displayProfile?.bio ?? '');
    } else {
      setStatus(normalizeStatus(displayProfile?.user_status));
      setBioDraft(displayProfile?.bio || '');
    }
  }, [displayProfile?.bio, displayProfile?.user_status, globalProfile?.bio, globalProfile?.user_status, isOwnProfile]);

  useEffect(() => {
    setHashtagDraft(displayProfile?.profile_hashtag ?? '');
  }, [displayProfile?.profile_hashtag]);

  useEffect(() => {
    let cancelled = false;
    setLoadingSignatures(true);

    async function loadSignatures() {
      const { data, error } = await supabase
        .from('profile_signatures')
        .select('id, content, created_at, author_id')
        .eq('profile_id', profileId)
        .order('created_at', { ascending: false })
        .limit(30);
      if (cancelled) return;
      if (error) {
        console.error('Error loading profile signatures:', error);
        setSignatures([]);
        setLoadingSignatures(false);
        return;
      }

      const rows = (data || []) as Signature[];
      const authorIds = Array.from(new Set(rows.map(row => row.author_id).filter(Boolean)));
      const authors: Record<string, Signature['author']> = {};
      if (authorIds.length) {
        const { data: profiles } = await supabase.from('profiles').select('id, username, full_name, avatar_url').in('id', authorIds);
        for (const author of profiles || []) authors[(author as { id: string }).id] = author as Signature['author'];
      }
      setSignatures(rows.map(row => ({ ...row, author: authors[row.author_id] || null })));
      setLoadingSignatures(false);
    }

    void loadSignatures();
    return () => { cancelled = true; };
  }, [profileId]);

  useEffect(() => {
    let cancelled = false;
    async function loadProfileStats() {
      const { data, error } = await supabase.rpc('get_profile_stats', { target_user_id: profileId }).maybeSingle();
      if (cancelled) return;
      if (error) {
        console.error('Error loading profile stats:', error);
        return;
      }
      if (data) {
        setProfileStats({
          friends_count: Number(data.friends_count ?? 0),
          followers_count: Number(data.followers_count ?? 0),
          following_count: Number(data.following_count ?? 0),
          albums_count: Number(data.albums_count ?? 0),
        });
      }
    }
    void loadProfileStats();
    const handleFocus = () => void loadProfileStats();
    window.addEventListener('focus', handleFocus);
    return () => {
      cancelled = true;
      window.removeEventListener('focus', handleFocus);
    };
  }, [profileId]);

  useEffect(() => {
    if (activeTab !== 'Fotos') return;
    let cancelled = false;
    setLoadingGallery(true);
    async function loadGallery() {
      const { data, error } = await supabase
        .from('photos')
        .select('id, url, caption, created_at')
        .eq('user_id', viewedProfileId)
        .order('created_at', { ascending: false })
        .limit(60);
      if (cancelled) return;
      if (error) console.error('Error loading profile gallery:', error);
      setGallery((data || []) as GalleryPhoto[]);
      setLoadingGallery(false);
    }
    void loadGallery();
    return () => { cancelled = true; };
  }, [activeTab, viewedProfileId]);

  const saveStatus = async (next: StatusValue) => {
    if (!isOwnProfile) return;
    setSavingStatus(true);
    const { error } = await supabase.from('profiles').update({ user_status: next, updated_at: new Date().toISOString() }).eq('id', session.user.id);
    setSavingStatus(false);
    if (error) {
      window.alert(`No se pudo guardar el estado: ${error.message}`);
      return;
    }
    setStatus(next);
    setViewedProfile(current => current ? { ...current, user_status: next } : current);
    updateGlobalProfile({ user_status: next });
    window.dispatchEvent(new CustomEvent('inkorium-user-status-updated', { detail: { userId: session.user.id, status: next } }));
  };

  const saveBio = async () => {
    if (!isOwnProfile) return;
    setSavingBio(true);
    const value = bioDraft.trim().slice(0, 180);
    const { error } = await supabase.from('profiles').update({ bio: value || null, updated_at: new Date().toISOString() }).eq('id', session.user.id);
    setSavingBio(false);
    if (error) {
      window.alert(`No se pudo guardar la biografía: ${error.message}`);
      return;
    }
    setViewedProfile(current => current ? { ...current, bio: value || null } : current);
    updateGlobalProfile({ bio: value || null });
    setEditingBio(false);
  };

  const saveHashtag = async () => {
    if (!isOwnProfile) return;
    setSavingHashtag(true);
    const value = hashtagDraft.trim().replace(/^#+/, '').replace(/\s+/g, '').slice(0, 50);
    const { error } = await supabase.from('profiles').update({ profile_hashtag: value || null, updated_at: new Date().toISOString() }).eq('id', session.user.id);
    setSavingHashtag(false);
    if (error) {
      window.alert(`No se pudo guardar el hashtag: ${error.message}`);
      return;
    }
    setViewedProfile(current => current ? { ...current, profile_hashtag: value || null } : current);
    setHashtagDraft(value);
    setEditingHashtag(false);
  };

  const submitSignature = async () => {
    const content = signatureDraft.trim().slice(0, 500);
    if (!content || savingSignature) return;
    setSavingSignature(true);
    const { data, error } = await supabase
      .from('profile_signatures')
      .insert({ profile_id: profileId, author_id: session.user.id, content })
      .select('id, content, created_at, author_id')
      .single();
    setSavingSignature(false);
    if (error) {
      window.alert(`No se pudo dejar la firma: ${error.message}`);
      return;
    }
    const author = { username: globalProfile?.username ?? null, full_name: globalProfile?.full_name ?? null, avatar_url: globalProfile?.avatar_url ?? null };
    setSignatures(current => [{ ...(data as Signature), author }, ...current]);
    setSignatureDraft('');
  };

  const togglePlayback = () => {
    if (!currentSong) {
      openPlayer();
      return;
    }
    if (isPlaying || pendingPlay) pause();
    else resume();
  };

  const openMediaChooser = (target: MediaTarget) => {
    if (!isOwnProfile) return;
    window.dispatchEvent(new CustomEvent('inkorium-profile-media-edit', { detail: { target } }));
  };

  if (!displayProfile) return null;

  return (
    <section className="profile-view-page">
      <ProfileHeader
        profile={displayProfile}
        displayName={displayName}
        handle={handle}
        avatar={avatar}
        banner={banner}
        isOwnProfile={isOwnProfile}
        status={effectiveStatus}
        statusLabel={statusMeta.label}
        statusClassName={statusMeta.className}
        savingStatus={savingStatus}
        savingHashtag={savingHashtag}
        editingHashtag={editingHashtag}
        hashtagDraft={hashtagDraft}
        editingBio={editingBio}
        bioDraft={bioDraft}
        savingBio={savingBio}
        onOpenMedia={openMediaChooser}
        onStatusChange={saveStatus}
        onStartHashtagEdit={() => setEditingHashtag(true)}
        onHashtagDraftChange={setHashtagDraft}
        onSaveHashtag={() => void saveHashtag()}
        onCancelHashtag={() => { setEditingHashtag(false); setHashtagDraft(displayProfile.profile_hashtag || ''); }}
        onStartBioEdit={() => { if (isOwnProfile) setEditingBio(true); }}
        onBioDraftChange={setBioDraft}
        onSaveBio={() => void saveBio()}
        onCancelBio={() => setEditingBio(false)}
      />

      <ProfileTabs activeTab={activeTab} onChange={setActiveTab} />

      {activeTab === 'Inicio' && (
        <ProfileHome
          signatures={signatures}
          loadingSignatures={loadingSignatures}
          signatureDraft={signatureDraft}
          savingSignature={savingSignature}
          onSignatureDraftChange={setSignatureDraft}
          onSubmitSignature={() => void submitSignature()}
          profileStats={profileStats}
          currentSong={currentSong}
          onTogglePlayback={togglePlayback}
        />
      )}

      {activeTab === 'Fotos' && (
        <div className="profile-view-card">
          <div className="profile-view-section-head"><h2><Images size={17} /> Fotos</h2><span>{gallery.length}</span></div>
          <div className="profile-media-gallery">
            {loadingGallery ? [1, 2, 3, 4].map(item => <span key={item} />) : gallery.map(photo => (
              <button key={photo.id} type="button" onClick={() => openMediaChooser('avatar')}>
                <img src={photo.url} alt={photo.caption || 'Foto'} />
              </button>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'Videos' && <div className="profile-view-card profile-view-empty">Los vídeos del perfil se cargarán aquí.</div>}
      {activeTab === 'Música' && <div className="profile-view-card profile-view-empty">La música del perfil se cargará aquí.</div>}
    </section>
  );
}
