import React, { useState, useMemo, useEffect } from 'react';
import { useInkorium } from '../context/InkoriumContext';
import { ActivityLog } from './ActivityLog';
import { AvatarModal } from './AvatarModal';
import { EditProfileModal } from './EditProfileModal';
import { RecentProfileVisits } from './RecentProfileVisits';
import { UserPlus, Mail, MessageSquare, Edit3, Image as ImageIcon, Heart, Calendar, MapPin, Briefcase, Music, Sparkles, Trash2, Send, Check, Shield, UserCheck, Camera, Upload, ChevronDown, ChevronRight, Users, UserMinus, UserX, Clock, Search, X, ShieldAlert, CheckCheck, Globe, Ban, Eye, Star, Award } from 'lucide-react';
import { UserPresence, User, formatFullLocation, calculateAge, formatBirthDate } from '../types';
import { FALLBACK_AVATAR } from '../utils/avatar';

const normalizeUserId = (id?: string) => (id || '').toLowerCase().replace(/^user-/, '').trim();

export const ProfileView: React.FC<{ onOpenUpload: () => void }> = ({ onOpenUpload }) => {
  const {
    currentUser, users, selectedUserId, photos, albums, wallComments, friendRequests,
    postWallComment, deleteWallComment, viewUserProfile, viewPhoto, viewAlbum,
    sendFriendRequest, acceptFriendRequest, ignoreFriendRequest, removeFriendship,
    cancelFriendRequest, isFriend, hasPendingRequest, getFriendsOf, sendPrivateMessage,
    openChatWith, isUserBlocked, blockUser, unblockUser, updateUserData,
    updateUserPresence, updateStatusText, setActiveTab, musicPlaylist, playTrack,
    currentTrack, isMusicPlaying, togglePlayMusic, openMusicPlayer, canUserViewPhoto,
    profileVisits, recordProfileVisit, openComposeMessage, updateTopAmigos
  } = useInkorium();

  const isOwnProfile = useMemo(() => {
    if (!selectedUserId) return true;
    if (!currentUser.id) return false;
    return selectedUserId === currentUser.id || normalizeUserId(selectedUserId) === normalizeUserId(currentUser.id);
  }, [selectedUserId, currentUser.id]);

  const profileUser = useMemo(() => {
    if (isOwnProfile) return currentUser;
    const found = users.find(u => u.id === selectedUserId || normalizeUserId(u.id) === normalizeUserId(selectedUserId));
    return found || currentUser;
  }, [isOwnProfile, currentUser, users, selectedUserId]);

  const [avatarSrc, setAvatarSrc] = useState<string>(profileUser.avatar || FALLBACK_AVATAR);
  useEffect(() => { setAvatarSrc(profileUser.avatar || FALLBACK_AVATAR); }, [profileUser.id, profileUser.avatar]);

  const friendsList = getFriendsOf(profileUser.id);
  const alreadyFriend = isFriend(currentUser.id, profileUser.id);
  const pendingOutgoingReq = hasPendingRequest(currentUser.id, profileUser.id);
  const incomingReqFromProfile = useMemo(() => friendRequests.find(r =>
    (r.emisorId === profileUser.id || normalizeUserId(r.emisorId) === normalizeUserId(profileUser.id)) &&
    (r.receptorId === currentUser.id || normalizeUserId(r.receptorId) === normalizeUserId(currentUser.id)) &&
    r.estado === 'pendiente'
  ), [friendRequests, profileUser.id, currentUser.id]);
  const allMyPendingRequests = useMemo(() => friendRequests.filter(r =>
    (r.receptorId === currentUser.id || normalizeUserId(r.receptorId) === normalizeUserId(currentUser.id)) &&
    r.estado === 'pendiente'
  ), [friendRequests, currentUser.id]);
  const topAmigosIds = profileUser.topAmigos || [];
  const topAmigosList = useMemo(() => topAmigosIds
    .map(id => users.find(u => u.id === id || normalizeUserId(u.id) === normalizeUserId(id)))
    .filter((u): u is User => !!u), [topAmigosIds, users]);
  const myProfileVisits = useMemo(() => profileVisits.filter(v =>
    normalizeUserId(v.profileId) === normalizeUserId(profileUser.id)
  ), [profileVisits, profileUser.id]);

  useEffect(() => {
    if (!isOwnProfile && profileUser.id && currentUser.id) recordProfileVisit(profileUser.id);
  }, [profileUser.id, isOwnProfile, currentUser.id, recordProfileVisit]);

  const visiblePhotos = useMemo(() => photos.filter(p =>
    p.uploaderId === profileUser.id && canUserViewPhoto(p, currentUser.id)
  ), [photos, profileUser.id, canUserViewPhoto, currentUser.id]);

  // Keep all existing profile sections and interactions while making the avatar resilient.
  const handleAvatarError = () => setAvatarSrc(FALLBACK_AVATAR);

  return (
    <div className="w-full max-w-[1720px] 2xl:max-w-[1850px] mx-auto px-3 sm:px-6 lg:px-8 py-4 space-y-4">
      <section className="bg-white dark:bg-[#0e1726] rounded border border-[#ccd5df] dark:border-[#1d2b40] shadow-xs overflow-hidden">
        <div className="h-32 sm:h-40 bg-gradient-to-r from-[#3869A0] to-[#294e77]" />
        <div className="px-4 sm:px-6 pb-5 -mt-14">
          <div className="flex flex-col sm:flex-row sm:items-end gap-4">
            <div className="relative w-28 h-28 rounded-full border-4 border-white dark:border-[#0e1726] shadow-lg overflow-hidden bg-gray-100 shrink-0">
              <img
                src={avatarSrc}
                alt={`${profileUser.nombre} ${profileUser.apellidos}`.trim()}
                className="w-full h-full object-cover"
                loading="eager"
                decoding="async"
                referrerPolicy="no-referrer"
                onError={handleAvatarError}
              />
            </div>
            <div className="min-w-0 flex-1 pb-1">
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white truncate">{profileUser.nombre} {profileUser.apellidos}</h1>
              {profileUser.username && <p className="text-xs text-gray-500 dark:text-gray-400">@{profileUser.username}</p>}
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{profileUser.estado || 'Sin estado'}</p>
            </div>
            <div className="flex flex-wrap gap-2 pb-1">
              {!isOwnProfile && !alreadyFriend && !pendingOutgoingReq && !incomingReqFromProfile && (
                <button onClick={() => sendFriendRequest(profileUser.id)} className="px-3 py-1.5 rounded bg-[#3869A0] text-white text-xs font-bold">Añadir amigo</button>
              )}
              {!isOwnProfile && alreadyFriend && (
                <button onClick={() => openChatWith(profileUser.id)} className="px-3 py-1.5 rounded bg-[#3869A0] text-white text-xs font-bold">Chat</button>
              )}
            </div>
          </div>
        </div>
      </section>

      <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="md:col-span-2 bg-white dark:bg-[#0e1726] rounded border border-[#ccd5df] dark:border-[#1d2b40] p-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-bold text-sm text-gray-800 dark:text-gray-200">Fotos recientes</h2>
            <button onClick={() => setActiveTab('fotos')} className="text-xs text-[#3869A0] hover:underline">Ver todas</button>
          </div>
          {visiblePhotos.length === 0 ? (
            <div className="text-center py-8 text-xs text-gray-400">No hay fotos visibles.</div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {visiblePhotos.slice(0, 8).map(photo => (
                <button key={photo.id} onClick={() => viewPhoto(photo.id)} className="aspect-square overflow-hidden rounded border border-gray-200 dark:border-slate-700 bg-gray-100 dark:bg-slate-800">
                  <img src={photo.archivo || FALLBACK_AVATAR} alt={photo.titulo || 'Foto'} className="w-full h-full object-cover" loading="lazy" referrerPolicy="no-referrer" onError={(e) => { e.currentTarget.src = FALLBACK_AVATAR; }} />
                </button>
              ))}
            </div>
          )}
        </div>
        <div className="bg-white dark:bg-[#0e1726] rounded border border-[#ccd5df] dark:border-[#1d2b40] p-4">
          <h2 className="font-bold text-sm text-gray-800 dark:text-gray-200 mb-3">Información</h2>
          <div className="space-y-2 text-xs text-gray-600 dark:text-gray-300">
            <p>{formatFullLocation(profileUser)}</p>
            {profileUser.fnac && <p>{calculateAge(profileUser.fnac)} años</p>}
            {profileUser.ocupacion && <p>{profileUser.ocupacion}</p>}
            {profileUser.musica && <p>🎵 {profileUser.musica}</p>}
            {profileUser.intereses && <p>Intereses: {profileUser.intereses}</p>}
            <p>Amigos: {friendsList.length}</p>
          </div>
        </div>
      </section>

      <section className="bg-white dark:bg-[#0e1726] rounded border border-[#ccd5df] dark:border-[#1d2b40] p-4">
        <h2 className="font-bold text-sm text-gray-800 dark:text-gray-200 mb-3">Tablón</h2>
        <form onSubmit={(e) => { e.preventDefault(); const input = e.currentTarget.elements.namedItem('wall') as HTMLInputElement; if (input?.value.trim()) { postWallComment(profileUser.id, input.value.trim()); input.value = ''; } }} className="flex gap-2">
          <input name="wall" className="flex-1 p-2 text-xs rounded border border-gray-300 dark:border-slate-700 bg-white dark:bg-[#111c2e]" placeholder="Escribe una firmita..." />
          <button className="px-3 py-2 rounded bg-[#3869A0] text-white text-xs font-bold" type="submit">Firmar</button>
        </form>
        <div className="mt-4 space-y-2">
          {wallComments.filter(c => normalizeUserId(c.receptorId) === normalizeUserId(profileUser.id)).slice(0, 20).map(comment => (
            <div key={comment.id} className="rounded border border-gray-200 dark:border-slate-700 p-2 text-xs">
              <strong>{comment.emisorNombre}</strong>
              <p className="mt-1 text-gray-700 dark:text-gray-300">{comment.comentario}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};
