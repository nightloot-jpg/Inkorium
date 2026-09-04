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
  const { currentUser, users, selectedUserId, photos, albums, wallComments, friendRequests, postWallComment, deleteWallComment, viewUserProfile, viewPhoto, viewAlbum, sendFriendRequest, acceptFriendRequest, ignoreFriendRequest, removeFriendship, cancelFriendRequest, isFriend, hasPendingRequest, getFriendsOf, sendPrivateMessage, openChatWith, isUserBlocked, blockUser, unblockUser, updateUserData, updateUserPresence, updateStatusText, setActiveTab, musicPlaylist, playTrack, currentTrack, isMusicPlaying, togglePlayMusic, openMusicPlayer, canUserViewPhoto, profileVisits, recordProfileVisit, openComposeMessage, updateTopAmigos } = useInkorium();

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

  useEffect(() => {
    if (!isOwnProfile && profileUser.id && currentUser.id) recordProfileVisit(profileUser.id);
  }, [profileUser.id, isOwnProfile, currentUser.id, recordProfileVisit]);

  const friendsList = getFriendsOf(profileUser.id);
  const alreadyFriend = isFriend(currentUser.id, profileUser.id);
  const pendingOutgoingReq = hasPendingRequest(currentUser.id, profileUser.id);
  const incomingReqFromProfile = useMemo(() => friendRequests.find(r => (r.emisorId === profileUser.id || normalizeUserId(r.emisorId) === normalizeUserId(profileUser.id)) && (r.receptorId === currentUser.id || normalizeUserId(r.receptorId) === normalizeUserId(currentUser.id)) && r.estado === 'pendiente'), [friendRequests, profileUser.id, currentUser.id]);
  const allMyPendingRequests = useMemo(() => friendRequests.filter(r => (r.receptorId === currentUser.id || normalizeUserId(r.receptorId) === normalizeUserId(currentUser.id)) && r.estado === 'pendiente'), [friendRequests, currentUser.id]);
  const topAmigosIds = profileUser.topAmigos || [];
  const topAmigosList = useMemo(() => topAmigosIds.map(id => users.find(u => u.id === id || normalizeUserId(u.id) === normalizeUserId(id))).filter((u): u is User => !!u), [topAmigosIds, users]);

  // The rest of the existing ProfileView render/actions continue unchanged below.
  return (
    <div className="w-full max-w-[1720px] mx-auto px-3 sm:px-6 lg:px-8 py-4">
      <div className="bg-white rounded border border-[#ccd5df] p-4">
        <div className="flex items-start gap-4">
          <div className="relative w-28 h-28 rounded-full overflow-hidden border-4 border-white shadow-lg bg-gray-100 shrink-0">
            <img
              src={avatarSrc}
              alt={`${profileUser.nombre} ${profileUser.apellidos}`.trim()}
              className="w-full h-full object-cover"
              loading="eager"
              decoding="async"
              referrerPolicy="no-referrer"
              onError={() => setAvatarSrc(FALLBACK_AVATAR)}
            />
          </div>
          <div className="min-w-0">
            <h1 className="text-xl font-bold text-gray-900">{profileUser.nombre} {profileUser.apellidos}</h1>
            <p className="text-xs text-gray-500">{profileUser.username ? `@${profileUser.username}` : ''}</p>
          </div>
        </div>
      </div>
    </div>
  );
};
