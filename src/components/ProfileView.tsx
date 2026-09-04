import React, { useState, useMemo, useEffect } from 'react';
import { useInkorium } from '../context/InkoriumContext';
import { ActivityLog } from './ActivityLog';
import { AvatarModal } from './AvatarModal';
import { EditProfileModal } from './EditProfileModal';
import { RecentProfileVisits } from './RecentProfileVisits';
import { 
  UserPlus, Mail, MessageSquare, Edit3, Image as ImageIcon, 
  Heart, Calendar, MapPin, Briefcase, Music, Sparkles, 
  Trash2, Send, Check, Shield, UserCheck, Camera, Upload, ChevronDown, ChevronRight,
  Users, UserMinus, UserX, Clock, Search, X, ShieldAlert, CheckCheck, Globe, Ban,
  Eye, Star, Award
} from 'lucide-react';
import { UserPresence, User, formatFullLocation } from '../types';

const PRESENCE_CONFIG: Record<UserPresence, { label: string; dot: string; text: string; bg: string }> = {
  conectado: { label: 'Conectado', dot: 'bg-emerald-500', text: 'text-emerald-700', bg: 'bg-emerald-50' },
  ausente: { label: 'Ausente', dot: 'bg-amber-500', text: 'text-amber-700', bg: 'bg-amber-50' },
  ocupado: { label: 'Ocupado', dot: 'bg-red-500', text: 'text-red-700', bg: 'bg-red-50' },
  invisible: { label: 'Invisible', dot: 'bg-gray-400', text: 'text-gray-600', bg: 'bg-gray-100' }
};

export const ProfileView: React.FC<{ onOpenUpload: () => void }> = ({ onOpenUpload }) => {
  const {
    currentUser,
    users,
    selectedUserId,
    photos,
    albums,
    wallComments,
    friendRequests,
    postWallComment,
    deleteWallComment,
    viewUserProfile,
    viewPhoto,
    viewAlbum,
    sendFriendRequest,
    acceptFriendRequest,
    ignoreFriendRequest,
    removeFriendship,
    cancelFriendRequest,
    isFriend,
    hasPendingRequest,
    getFriendsOf,
    sendPrivateMessage,
    openChatWith,
    isUserBlocked,
    blockUser,
    unblockUser,
    updateUserData,
    updateUserPresence,
    updateStatusText,
    setActiveTab,
    // Music Player
    musicPlaylist,
    playTrack,
    currentTrack,
    isMusicPlaying,
    togglePlayMusic,
    openMusicPlayer,
    canUserViewPhoto,
    profileVisits,
    recordProfileVisit,
    openComposeMessage,
    updateTopAmigos
  } = useInkorium();

  const profileUser = users.find(u => u.id === selectedUserId) || currentUser;
  const isOwnProfile = profileUser.id === currentUser.id;

  // Track and record profile visit when viewing someone else's profile
  useEffect(() => {
    if (!isOwnProfile && profileUser.id && currentUser.id) {
      recordProfileVisit(profileUser.id);
    }
  }, [profileUser.id, isOwnProfile, currentUser.id, recordProfileVisit]);
  const friendsList = getFriendsOf(profileUser.id);
  const alreadyFriend = isFriend(currentUser.id, profileUser.id);
  const pendingOutgoingReq = hasPendingRequest(currentUser.id, profileUser.id);
  
  // Pending incoming request from this profile to current user
  const incomingReqFromProfile = useMemo(() => {
    return friendRequests.find(
      r => r.emisorId === profileUser.id && 
           r.receptorId === currentUser.id && 
           r.estado === 'pendiente'
    );
  }, [friendRequests, profileUser.id, currentUser.id]);

  // Current user's all incoming pending requests (to display in Amigos tab if on own profile)
  const allMyPendingRequests = useMemo(() => {
    return friendRequests.filter(
      r => r.receptorId === currentUser.id && 
           r.estado === 'pendiente'
    );
  }, [friendRequests, currentUser.id]);

  // Top Amigos calculation
  const topAmigosIds = profileUser.topAmigos || [];
  const topAmigosList = useMemo(() => {
    return topAmigosIds
      .map(id => users.find(u => u.id === id))
      .filter((u): u is User => !!u);
  }, [topAmigosIds, users]);

  // Visits to this profile
  const myProfileVisits = useMemo(() => {
    return profileVisits.filter(v => v.visitedUserId === profileUser.id);
  }, [profileVisits, profileUser.id]);

  // Profile View Sub-tab
  const [profileSubTab, setProfileSubTab] = useState<'perfil' | 'amigos' | 'fotos'>('perfil');
  const [friendSearchQuery, setFriendSearchQuery] = useState('');
  const [friendFilter, setFriendFilter] = useState<'todos' | 'online' | 'solicitudes'>('todos');
  const [confirmRemoveFriendId, setConfirmRemoveFriendId] = useState<string | null>(null);

  const [wallInput, setWallInput] = useState('');
  const [editingStatus, setEditingStatus] = useState(false);
  const [newStatusText, setNewStatusText] = useState(profileUser.estado);
  const [showDirectMessageModal, setShowDirectMessageModal] = useState(false);
  const [showAvatarModal, setShowAvatarModal] = useState(false);
  const [showEditProfileModal, setShowEditProfileModal] = useState(false);
  const [showTopAmigosModal, setShowTopAmigosModal] = useState(false);
  const [selectedTopIds, setSelectedTopIds] = useState<string[]>(profileUser.topAmigos || []);
  const [showPresenceMenu, setShowPresenceMenu] = useState(false);
  const [mpSubject, setMpSubject] = useState('');
  const [mpBody, setMpBody] = useState('');

  const userPresence: UserPresence = profileUser.presencia || (profileUser.online ? 'conectado' : 'invisible');

  // Photos of this user (filtered by privacy permissions)
  const userPhotos = photos.filter(p => p.uploaderId === profileUser.id && canUserViewPhoto(p, currentUser.id));
  // Tagged photos (filtered by privacy permissions)
  const taggedPhotos = photos.filter(p => 
    Array.isArray(p.etiquetas) && 
    p.etiquetas.some(t => t.userId === profileUser.id || t.usuarioId === profileUser.id) &&
    canUserViewPhoto(p, currentUser.id)
  );
  // User's custom albums
  const userAlbums = albums.filter(a => a.userId === profileUser.id || a.propietarioId === profileUser.id);

  // Wall comments for this user
  const userWallComments = useMemo(() => {
    return wallComments.filter(w => {
      const targetId = w.receptorId || w.propietarioId;
      if (!targetId) return false;
      return (
        targetId === profileUser.id ||
        (profileUser.username && targetId === profileUser.username) ||
        (isOwnProfile && targetId === currentUser.id)
      );
    });
  }, [wallComments, profileUser.id, profileUser.username, isOwnProfile, currentUser.id]);

  // Calculate age from fnac
  const birthYear = parseInt(profileUser.fnac.split('-')[0], 10) || 1993;
  const userAge = new Date().getFullYear() - birthYear;

  // Filtered friends list for the Amigos tab
  const filteredFriends = useMemo(() => {
    return friendsList.filter(friend => {
      if (friendFilter === 'online' && !friend.online && friend.presencia !== 'conectado') return false;
      if (friendSearchQuery.trim()) {
        const q = friendSearchQuery.toLowerCase();
        const fullName = `${friend.nombre} ${friend.apellidos}`.toLowerCase();
        const city = (friend.ciudad || friend.provincia || '').toLowerCase();
        const username = (friend.username || '').toLowerCase();
        return fullName.includes(q) || city.includes(q) || username.includes(q);
      }
      return true;
    });
  }, [friendsList, friendFilter, friendSearchQuery]);

  const handleSendWall = (e: React.FormEvent) => {
    e.preventDefault();
    if (!wallInput.trim()) return;
    postWallComment(profileUser.id, wallInput);
    setWallInput('');
  };

  const handleSaveStatus = () => {
    if (newStatusText.trim()) {
      updateStatusText(newStatusText.trim());
    }
    setEditingStatus(false);
  };

  const handleSendMp = (e: React.FormEvent) => {
    e.preventDefault();
    if (!mpBody.trim()) return;
    sendPrivateMessage(profileUser.id, mpSubject || 'Mensaje desde el perfil', mpBody);
    setMpSubject('');
    setMpBody('');
    setShowDirectMessageModal(false);
  };

  return (
    <div className="w-full max-w-[1720px] 2xl:max-w-[1850px] mx-auto px-3 sm:px-6 lg:px-8 py-4 space-y-4">
      {/* ================= PROFILE HEADER BANNER ================= */}
      <div className="bg-white rounded border border-[#ccd5df] p-4 shadow-xs">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          {/* Avatar & Main details */}
          <div className="flex items-center gap-4">
            <div className="relative group">
              <img
                src={profileUser.avatar}
                alt={profileUser.nombre}
                className="w-20 h-20 sm:w-24 sm:h-24 rounded object-cover border-2 border-gray-200 shadow-sm"
              />
              {isOwnProfile && (
                <button
                  onClick={() => setShowAvatarModal(true)}
                  className="absolute inset-0 bg-black/60 text-white text-[10px] font-bold opacity-0 group-hover:opacity-100 transition rounded flex flex-col items-center justify-center cursor-pointer"
                  title="Cambiar foto de perfil / Avatar"
                >
                  <Camera className="w-4 h-4 mb-0.5" />
                  <span>Cambiar foto</span>
                </button>
              )}
            </div>

            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-bold text-gray-900 leading-tight">
                  {profileUser.nombre} {profileUser.apellidos}
                </h1>
                
                {isOwnProfile ? (
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => setShowPresenceMenu(prev => !prev)}
                      className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-gray-100 hover:bg-gray-200 text-xs font-semibold cursor-pointer transition border border-gray-200"
                      title="Cambiar estado de presencia"
                    >
                      <span className={`w-2.5 h-2.5 rounded-full ${PRESENCE_CONFIG[userPresence].dot}`} />
                      <span className={`text-[11px] ${PRESENCE_CONFIG[userPresence].text}`}>
                        {PRESENCE_CONFIG[userPresence].label}
                      </span>
                      <ChevronDown className="w-3 h-3 text-gray-400" />
                    </button>

                    {showPresenceMenu && (
                      <div className="absolute left-0 top-full mt-1 z-30 w-36 bg-white rounded shadow-lg border border-gray-200 py-1 text-xs divide-y divide-gray-100">
                        {(Object.keys(PRESENCE_CONFIG) as UserPresence[]).map((key) => {
                          const cfg = PRESENCE_CONFIG[key];
                          const isSelected = userPresence === key;
                          return (
                            <button
                              key={key}
                              type="button"
                              onClick={() => {
                                updateUserPresence(key);
                                setShowPresenceMenu(false);
                              }}
                              className={`w-full px-2.5 py-1.5 text-left flex items-center justify-between hover:bg-blue-50 transition cursor-pointer ${
                                isSelected ? 'bg-blue-50 font-bold' : ''
                              }`}
                            >
                              <div className="flex items-center gap-2">
                                <span className={`w-2.5 h-2.5 rounded-full ${cfg.dot}`} />
                                <span className="text-gray-700">{cfg.label}</span>
                              </div>
                              {isSelected && <Check className="w-3.5 h-3.5 text-[#3869A0]" />}
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-gray-50 border border-gray-200 text-[11px] font-medium">
                    <span className={`w-2.5 h-2.5 rounded-full ${PRESENCE_CONFIG[userPresence].dot}`} />
                    <span className={PRESENCE_CONFIG[userPresence].text}>
                      {PRESENCE_CONFIG[userPresence].label}
                    </span>
                  </div>
                )}
              </div>

              <p className="text-xs text-gray-600 font-medium flex items-center gap-2 flex-wrap">
                <span>{userAge} años</span>
                <span>•</span>
                <span className="flex items-center gap-0.5"><MapPin className="w-3 h-3 text-gray-400" /> {formatFullLocation(profileUser)}</span>
                <span>•</span>
                <span className="text-[#3869A0] font-semibold">{profileUser.situacionSentimental}</span>
                <span>•</span>
                <span className="text-gray-700 font-semibold flex items-center gap-1 bg-blue-50/80 px-2 py-0.5 rounded border border-blue-200/60" title="Visitas acumuladas en este perfil">
                  <Eye className="w-3 h-3 text-[#3869A0]" />
                  <span>{myProfileVisits.length} {myProfileVisits.length === 1 ? 'visita' : 'visitas'}</span>
                </span>
              </p>

              {/* Status Quote bubble */}
              {!editingStatus ? (
                <div className="p-2 bg-[#f4f7fa] rounded border border-gray-200 text-xs text-gray-700 italic relative max-w-xl">
                  <span className="text-[#3869A0] font-serif font-bold text-sm leading-none">“</span>
                  <span>{profileUser.estado}</span>
                  <span className="text-[#3869A0] font-serif font-bold text-sm leading-none">”</span>
                  {isOwnProfile && (
                    <button
                      onClick={() => {
                        setNewStatusText(profileUser.estado);
                        setEditingStatus(true);
                      }}
                      className="ml-2 text-[10px] text-[#3869A0] hover:underline not-italic font-bold cursor-pointer"
                    >
                      Editar
                    </button>
                  )}
                </div>
              ) : (
                <div className="flex items-center gap-2 mt-1">
                  <input
                    type="text"
                    value={newStatusText}
                    onChange={e => setNewStatusText(e.target.value)}
                    className="text-xs p-1.5 rounded border border-[#3869A0] bg-white w-full max-w-md focus:outline-none"
                    placeholder="Escribe tu nuevo estado..."
                    autoFocus
                  />
                  <button
                    onClick={handleSaveStatus}
                    className="px-2.5 py-1 bg-[#3869A0] text-white text-xs font-bold rounded hover:bg-[#2c537f] cursor-pointer"
                  >
                    Guardar
                  </button>
                  <button
                    onClick={() => setEditingStatus(false)}
                    className="px-2.5 py-1 bg-gray-200 text-gray-700 text-xs rounded hover:bg-gray-300 cursor-pointer"
                  >
                    Cancelar
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Action buttons (Friendship, MP, Chat, Edit) */}
          <div className="flex flex-wrap items-center gap-2 self-start sm:self-center">
            {!isOwnProfile ? (
              <>
                {/* 1. If incoming friend request from this user */}
                {incomingReqFromProfile ? (
                  <div className="flex items-center gap-1.5 bg-amber-50 border border-amber-300 rounded p-1">
                    <span className="text-[11px] text-amber-800 font-medium px-1.5">Te envió solicitud:</span>
                    <button
                      onClick={() => acceptFriendRequest(incomingReqFromProfile.id)}
                      className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-xs font-bold flex items-center gap-1 transition cursor-pointer shadow-2xs"
                      title="Aceptar solicitud de amistad"
                    >
                      <Check className="w-3.5 h-3.5" />
                      <span>Aceptar</span>
                    </button>
                    <button
                      onClick={() => ignoreFriendRequest(incomingReqFromProfile.id)}
                      className="px-2 py-1 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded text-xs font-medium transition cursor-pointer"
                      title="Rechazar / ignorar solicitud"
                    >
                      <X className="w-3.5 h-3.5" />
                      <span>Rechazar</span>
                    </button>
                  </div>
                ) : alreadyFriend ? (
                  <div className="flex items-center gap-1.5">
                    <div className="flex items-center gap-1 px-3 py-1.5 bg-emerald-50 text-emerald-700 border border-emerald-300 rounded text-xs font-bold">
                      <UserCheck className="w-3.5 h-3.5" />
                      <span>Sois amigos</span>
                    </div>
                    <button
                      onClick={() => {
                        if (window.confirm(`¿Seguro que deseas eliminar a ${profileUser.nombre} de tu lista de amigos?`)) {
                          removeFriendship(profileUser.id);
                        }
                      }}
                      className="px-2 py-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded border border-transparent hover:border-red-200 transition text-xs cursor-pointer"
                      title="Eliminar de amigos"
                    >
                      <UserMinus className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ) : pendingOutgoingReq ? (
                  <div className="flex items-center gap-1 bg-gray-100 border border-gray-300 rounded p-0.5">
                    <span className="px-2.5 py-1 text-gray-600 text-xs font-medium flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-amber-600" />
                      <span>Petición enviada</span>
                    </span>
                    <button
                      onClick={() => cancelFriendRequest(profileUser.id)}
                      className="px-2 py-1 bg-white hover:bg-red-50 text-red-600 hover:text-red-700 text-[11px] font-semibold rounded border border-gray-200 hover:border-red-200 transition cursor-pointer"
                      title="Cancelar solicitud de amistad"
                    >
                      Cancelar
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => sendFriendRequest(profileUser.id)}
                    className="px-3.5 py-1.5 bg-[#3869A0] hover:bg-[#2c537f] text-white rounded text-xs font-bold flex items-center gap-1.5 shadow-xs transition cursor-pointer"
                  >
                    <UserPlus className="w-3.5 h-3.5" />
                    <span>Añadir amigo</span>
                  </button>
                )}

                {isUserBlocked(profileUser.id) ? (
                  <button
                    onClick={() => unblockUser(profileUser.id)}
                    className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-300 rounded text-xs font-bold flex items-center gap-1.5 shadow-xs transition cursor-pointer"
                    title="Desbloquear este usuario en el chat"
                  >
                    <Ban className="w-3.5 h-3.5 text-rose-600" />
                    <span>Desbloquear en chat</span>
                  </button>
                ) : (
                  <button
                    onClick={() => {
                      if (window.confirm(`¿Seguro que deseas bloquear a ${profileUser.nombre} en el chat? Dejarán de aparecer sus mensajes y no se podrán abrir conversaciones.`)) {
                        blockUser(profileUser.id);
                      }
                    }}
                    className="px-2.5 py-1.5 bg-white hover:bg-rose-50 text-gray-500 hover:text-rose-700 border border-gray-300 hover:border-rose-300 rounded text-xs font-semibold flex items-center gap-1.5 shadow-xs transition cursor-pointer"
                    title="Bloquear este usuario en el chat"
                  >
                    <Ban className="w-3.5 h-3.5" />
                    <span>Bloquear chat</span>
                  </button>
                )}

                <button
                  onClick={() => setShowDirectMessageModal(true)}
                  className="px-3 py-1.5 bg-white hover:bg-gray-50 text-gray-700 border border-gray-300 rounded text-xs font-bold flex items-center gap-1.5 shadow-xs transition cursor-pointer"
                >
                  <Mail className="w-3.5 h-3.5 text-[#3869A0]" />
                  <span>Mensaje</span>
                </button>

                <button
                  onClick={() => openChatWith(profileUser.id)}
                  className={`px-3 py-1.5 rounded text-xs font-bold flex items-center gap-1.5 shadow-xs transition cursor-pointer ${
                    isUserBlocked(profileUser.id)
                      ? 'bg-gray-100 hover:bg-gray-200 text-gray-400 border border-gray-300'
                      : 'bg-[#e8f0fe] hover:bg-[#d2e3fc] text-[#3869A0] border border-[#bcd0ee]'
                  }`}
                  title={isUserBlocked(profileUser.id) ? 'Usuario bloqueado en el chat' : 'Abrir chat en vivo'}
                >
                  <MessageSquare className="w-3.5 h-3.5" />
                  <span>Chat en vivo</span>
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={() => setShowAvatarModal(true)}
                  className="px-3 py-1.5 bg-white hover:bg-gray-50 text-gray-700 border border-gray-300 rounded text-xs font-bold flex items-center gap-1.5 shadow-xs transition cursor-pointer"
                >
                  <Camera className="w-3.5 h-3.5 text-[#3869A0]" />
                  <span>Cambiar avatar</span>
                </button>
                <button
                  onClick={() => setShowEditProfileModal(true)}
                  className="px-3 py-1.5 bg-white hover:bg-gray-50 text-[#3869A0] border border-[#3869A0]/40 rounded text-xs font-bold flex items-center gap-1.5 shadow-xs transition cursor-pointer hover:border-[#3869A0]"
                >
                  <Edit3 className="w-3.5 h-3.5 text-[#3869A0]" />
                  <span>Editar mis datos</span>
                </button>
                <button
                  onClick={onOpenUpload}
                  className="px-3 py-1.5 bg-[#3869A0] hover:bg-[#2c537f] text-white rounded text-xs font-bold flex items-center gap-1.5 shadow-xs transition cursor-pointer"
                >
                  <ImageIcon className="w-3.5 h-3.5" />
                  <span>Subir fotos</span>
                </button>
              </>
            )}
          </div>
        </div>

        {/* ================= PROFILE SUB-TABS NAVIGATION ================= */}
        <div className="flex items-center gap-2 border-t border-gray-200 mt-4 pt-3 text-xs font-bold">
          <button
            onClick={() => setProfileSubTab('perfil')}
            className={`px-3.5 py-1.5 rounded flex items-center gap-1.5 transition cursor-pointer ${
              profileSubTab === 'perfil'
                ? 'bg-[#3869A0] text-white shadow-xs'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Perfil & Tablón</span>
          </button>

          <button
            onClick={() => setProfileSubTab('amigos')}
            className={`px-3.5 py-1.5 rounded flex items-center gap-1.5 transition cursor-pointer ${
              profileSubTab === 'amigos'
                ? 'bg-[#3869A0] text-white shadow-xs'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>Amigos</span>
            <span className={`text-[10px] px-1.5 py-0.2 rounded font-bold ${
              profileSubTab === 'amigos' ? 'bg-white/25 text-white' : 'bg-gray-200 text-gray-700'
            }`}>
              {friendsList.length}
            </span>
            {isOwnProfile && allMyPendingRequests.length > 0 && (
              <span className="bg-amber-500 text-white text-[10px] px-1.5 py-0.2 rounded-full animate-pulse">
                {allMyPendingRequests.length}
              </span>
            )}
          </button>

          <button
            onClick={() => setProfileSubTab('fotos')}
            className={`px-3.5 py-1.5 rounded flex items-center gap-1.5 transition cursor-pointer ${
              profileSubTab === 'fotos'
                ? 'bg-[#3869A0] text-white shadow-xs'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            <ImageIcon className="w-3.5 h-3.5" />
            <span>Fotos & Álbumes</span>
            <span className={`text-[10px] px-1.5 py-0.2 rounded font-bold ${
              profileSubTab === 'fotos' ? 'bg-white/25 text-white' : 'bg-gray-200 text-gray-700'
            }`}>
              {userPhotos.length + taggedPhotos.length}
            </span>
          </button>
        </div>
      </div>

      {/* ================= TAB CONTENT: AMIGOS DEDICATED VIEW ================= */}
      {profileSubTab === 'amigos' && (
        <div className="space-y-4">
          {/* Top Bar for Friends Search & Filters */}
          <div className="bg-white rounded border border-[#ccd5df] p-3.5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded bg-[#3869A0]/10 text-[#3869A0] flex items-center justify-center font-bold">
                <Users className="w-4 h-4" />
              </div>
              <div>
                <h2 className="font-bold text-sm text-gray-900">
                  {isOwnProfile ? 'Mis amigos en Inkorium' : `Lista de amigos de ${profileUser.nombre}`}
                </h2>
                <p className="text-[11px] text-gray-500">
                  Total de {friendsList.length} {friendsList.length === 1 ? 'amigo conectado' : 'amigos conectados'} en la red
                </p>
              </div>
            </div>

            {/* Search and Filters */}
            <div className="flex flex-wrap items-center gap-2">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Buscar entre amigos..."
                  value={friendSearchQuery}
                  onChange={e => setFriendSearchQuery(e.target.value)}
                  className="p-1.5 pl-7 pr-3 text-xs rounded border border-gray-300 bg-gray-50 focus:bg-white focus:outline-none focus:border-[#3869A0] w-48 sm:w-60"
                />
                <Search className="w-3.5 h-3.5 text-gray-400 absolute left-2 top-2" />
                {friendSearchQuery && (
                  <button
                    onClick={() => setFriendSearchQuery('')}
                    className="absolute right-2 top-2 text-gray-400 hover:text-gray-600"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              <div className="flex items-center gap-1 bg-gray-100 p-0.5 rounded border border-gray-200">
                <button
                  onClick={() => setFriendFilter('todos')}
                  className={`px-2.5 py-1 rounded text-[11px] font-semibold transition cursor-pointer ${
                    friendFilter === 'todos' ? 'bg-white text-[#3869A0] shadow-xs' : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Todos ({friendsList.length})
                </button>
                <button
                  onClick={() => setFriendFilter('online')}
                  className={`px-2.5 py-1 rounded text-[11px] font-semibold transition cursor-pointer ${
                    friendFilter === 'online' ? 'bg-white text-emerald-700 shadow-xs' : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  En línea ({friendsList.filter(f => f.online || f.presencia === 'conectado').length})
                </button>
                {isOwnProfile && allMyPendingRequests.length > 0 && (
                  <button
                    onClick={() => setFriendFilter('solicitudes')}
                    className={`px-2.5 py-1 rounded text-[11px] font-semibold transition cursor-pointer flex items-center gap-1 ${
                      friendFilter === 'solicitudes' ? 'bg-amber-500 text-white shadow-xs' : 'text-amber-700 bg-amber-100/60 hover:bg-amber-100'
                    }`}
                  >
                    <span>Solicitudes</span>
                    <span className="px-1 py-0.2 bg-white text-amber-800 rounded-full text-[9px] font-bold">
                      {allMyPendingRequests.length}
                    </span>
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Pending Friend Requests Section (if on own profile or if filter selected) */}
          {isOwnProfile && (friendFilter === 'solicitudes' || friendFilter === 'todos') && allMyPendingRequests.length > 0 && (
            <div className="bg-amber-50/80 rounded border border-amber-200 p-4 shadow-xs space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-amber-200">
                <div className="flex items-center gap-2 text-amber-900 font-bold text-xs">
                  <UserPlus className="w-4 h-4 text-amber-700" />
                  <span>Solicitudes de amistad pendientes ({allMyPendingRequests.length})</span>
                </div>
                <span className="text-[11px] text-amber-700 font-medium">
                  Personas que quieren agregarte a sus amigos
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                {allMyPendingRequests.map(req => (
                  <div key={req.id} className="bg-white rounded border border-amber-200 p-3 shadow-xs space-y-2 flex flex-col justify-between">
                    <div className="flex items-center gap-2.5">
                      <img
                        src={req.emisorAvatar}
                        alt={req.emisorNombre}
                        className="w-11 h-11 rounded object-cover border border-gray-300 cursor-pointer hover:opacity-90 flex-shrink-0"
                        onClick={() => viewUserProfile(req.emisorId)}
                      />
                      <div className="min-w-0">
                        <h4
                          onClick={() => viewUserProfile(req.emisorId)}
                          className="font-bold text-xs text-[#3869A0] hover:underline cursor-pointer truncate"
                        >
                          {req.emisorNombre}
                        </h4>
                        <p className="text-[10px] text-gray-500 truncate flex items-center gap-1">
                          <MapPin className="w-3 h-3 text-gray-400" />
                          <span>{req.emisorProvincia || 'España'}</span>
                        </p>
                        <span className="text-[9px] text-gray-400">{req.fecha}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 pt-2 border-t border-gray-100">
                      <button
                        onClick={() => acceptFriendRequest(req.id)}
                        className="flex-1 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-xs font-bold flex items-center justify-center gap-1 transition cursor-pointer shadow-xs"
                      >
                        <Check className="w-3.5 h-3.5" />
                        <span>Aceptar</span>
                      </button>
                      <button
                        onClick={() => ignoreFriendRequest(req.id)}
                        className="px-2.5 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded text-xs font-medium transition cursor-pointer"
                        title="Rechazar solicitud"
                      >
                        <X className="w-3.5 h-3.5" />
                        <span>Rechazar</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Friends Grid */}
          {friendFilter !== 'solicitudes' && (
            <div className="bg-white rounded border border-[#ccd5df] p-4 shadow-xs space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-gray-200">
                <span className="font-bold text-xs text-gray-800">
                  {friendFilter === 'online' ? 'Amigos conectados ahora' : 'Todos los amigos'} ({filteredFriends.length})
                </span>
                <button
                  onClick={() => setActiveTab('gente')}
                  className="text-xs text-[#3869A0] hover:underline font-semibold flex items-center gap-1 cursor-pointer"
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  <span>Buscar más gente para añadir</span>
                </button>
              </div>

              {filteredFriends.length === 0 ? (
                <div className="text-center py-12 px-4 space-y-2">
                  <Users className="w-10 h-10 text-gray-300 mx-auto" />
                  <p className="font-bold text-gray-700 text-sm">
                    {friendSearchQuery
                      ? 'No se encontraron amigos que coincidan con la búsqueda.'
                      : friendsList.length === 0
                      ? (isOwnProfile ? 'Aún no tienes amigos agregados en tu perfil.' : `${profileUser.nombre} todavía no tiene amigos agregados.`)
                      : 'No hay amigos con los filtros seleccionados.'}
                  </p>
                  <p className="text-gray-400 text-xs max-w-sm mx-auto">
                    {isOwnProfile && friendsList.length === 0
                      ? 'Explora la sección "Gente" para enviar solicitudes de amistad a otros usuarios.'
                      : 'Puedes restablecer la búsqueda para ver todos los contactos.'}
                  </p>
                  {isOwnProfile && friendsList.length === 0 && (
                    <button
                      onClick={() => setActiveTab('gente')}
                      className="mt-2 px-4 py-1.5 bg-[#3869A0] hover:bg-[#2c537f] text-white rounded text-xs font-bold transition shadow-xs cursor-pointer inline-flex items-center gap-1.5"
                    >
                      <UserPlus className="w-3.5 h-3.5" />
                      <span>Ir a Buscar Gente</span>
                    </button>
                  )}
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3.5">
                  {filteredFriends.map(friend => {
                    const isOnline = friend.online || friend.presencia === 'conectado';
                    return (
                      <div
                        key={friend.id}
                        className="border border-gray-200 hover:border-[#3869A0] rounded-lg p-3 bg-white shadow-2xs hover:shadow-md transition flex flex-col justify-between group"
                      >
                        <div>
                          <div
                            onClick={() => viewUserProfile(friend.id)}
                            className="cursor-pointer space-y-2"
                          >
                            <div className="aspect-square rounded bg-gray-100 overflow-hidden relative border border-gray-200">
                              <img
                                src={friend.avatar}
                                alt={friend.nombre}
                                className="w-full h-full object-cover group-hover:scale-105 transition duration-200"
                                onError={(e) => {
                                  (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=400&auto=format&fit=crop&q=80';
                                }}
                              />
                              <span
                                className={`absolute top-2 right-2 w-2.5 h-2.5 rounded-full ring-2 ring-white shadow ${
                                  isOnline ? 'bg-emerald-500' : 'bg-gray-400'
                                }`}
                                title={isOnline ? 'Conectado' : 'Desconectado'}
                              />
                            </div>

                            <div>
                              <h3 className="font-bold text-xs text-[#3869A0] group-hover:underline truncate" title={`${friend.nombre} ${friend.apellidos}`}>
                                {friend.nombre} {friend.apellidos}
                              </h3>
                              {friend.username && (
                                <p className="text-[10px] text-gray-400 font-mono truncate">
                                  @{friend.username}
                                </p>
                              )}
                              <p className="text-[11px] text-gray-500 truncate flex items-center gap-1 mt-0.5">
                                <MapPin className="w-3 h-3 text-gray-400 flex-shrink-0" />
                                <span>{friend.ciudad || friend.provincia || 'España'}</span>
                              </p>
                            </div>
                          </div>

                          {friend.estado && (
                            <p className="text-[10px] text-gray-600 line-clamp-2 italic mt-2 bg-gray-50 p-1.5 rounded border border-gray-100">
                              "{friend.estado}"
                            </p>
                          )}
                        </div>

                        {/* Friend Card Action Buttons */}
                        <div className="mt-3 pt-2.5 border-t border-gray-100 flex items-center justify-between gap-1.5 text-xs">
                          <button
                            onClick={() => openChatWith(friend.id)}
                            className="flex-1 py-1 px-2 bg-[#e8f0fe] hover:bg-[#d2e3fc] text-[#3869A0] font-semibold text-[11px] rounded transition flex items-center justify-center gap-1 cursor-pointer"
                            title="Abrir chat en directo"
                          >
                            <MessageSquare className="w-3 h-3" />
                            <span>Chat</span>
                          </button>

                          <button
                            onClick={() => {
                              sendPrivateMessage(friend.id, 'Hola', '¡Hola! ¿Qué tal estás?');
                              setActiveTab('mensajes');
                            }}
                            className="py-1 px-2 bg-white hover:bg-gray-100 text-gray-700 border border-gray-200 text-[11px] rounded transition flex items-center justify-center cursor-pointer"
                            title="Enviar mensaje privado"
                          >
                            <Mail className="w-3 h-3 text-[#3869A0]" />
                          </button>

                          {isOwnProfile && (
                            <button
                              onClick={() => {
                                if (window.confirm(`¿Seguro que deseas eliminar a ${friend.nombre} de tu lista de amigos?`)) {
                                  removeFriendship(friend.id);
                                }
                              }}
                              className="py-1 px-2 bg-white hover:bg-red-50 text-gray-400 hover:text-red-600 border border-gray-200 hover:border-red-200 text-[11px] rounded transition cursor-pointer"
                              title="Eliminar de amigos"
                            >
                              <UserMinus className="w-3 h-3" />
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ================= TAB CONTENT: FOTOS DEDICATED VIEW ================= */}
      {profileSubTab === 'fotos' && (
        <div className="bg-white rounded border border-[#ccd5df] p-4 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-gray-200">
            <h2 className="font-bold text-sm text-gray-800 flex items-center gap-2">
              <ImageIcon className="w-4 h-4 text-[#3869A0]" />
              <span>Fotos y Álbumes de {profileUser.nombre} ({userPhotos.length + taggedPhotos.length})</span>
            </h2>
            {isOwnProfile && (
              <button
                onClick={onOpenUpload}
                className="px-3 py-1.5 bg-[#3869A0] hover:bg-[#2c537f] text-white rounded text-xs font-bold flex items-center gap-1.5 shadow-xs transition cursor-pointer"
              >
                <Upload className="w-3.5 h-3.5" />
                <span>Subir nueva foto</span>
              </button>
            )}
          </div>

          <div className="space-y-4">
            <div>
              <h3 className="font-bold text-xs text-gray-700 mb-2">Fotos subidas ({userPhotos.length})</h3>
              {userPhotos.length === 0 ? (
                <p className="text-gray-400 text-xs py-4 text-center">No hay fotos subidas por este usuario.</p>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
                  {userPhotos.map(photo => (
                    <div
                      key={photo.id}
                      onClick={() => viewPhoto(photo.id)}
                      className="aspect-square rounded overflow-hidden border border-gray-200 hover:border-[#3869A0] cursor-pointer group relative bg-gray-100"
                    >
                      <img
                        src={photo.archivo}
                        alt={photo.titulo}
                        className="w-full h-full object-cover group-hover:scale-105 transition"
                      />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition flex items-end p-2 text-white text-[10px]">
                        <span className="truncate">{photo.titulo || 'Foto'}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {taggedPhotos.length > 0 && (
              <div className="pt-3 border-t border-gray-100">
                <h3 className="font-bold text-xs text-gray-700 mb-2">Fotos donde aparece etiquetado ({taggedPhotos.length})</h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
                  {taggedPhotos.map(photo => (
                    <div
                      key={photo.id}
                      onClick={() => viewPhoto(photo.id)}
                      className="aspect-square rounded overflow-hidden border border-gray-200 hover:border-[#3869A0] cursor-pointer group relative bg-gray-100"
                    >
                      <img
                        src={photo.archivo}
                        alt={photo.titulo}
                        className="w-full h-full object-cover group-hover:scale-105 transition"
                      />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition flex items-end p-2 text-white text-[10px]">
                        <span className="truncate">{photo.titulo || 'Foto'}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ================= TAB CONTENT: PERFIL & TABLÓN (CLASSIC 3-COLUMN VIEW) ================= */}
      {profileSubTab === 'perfil' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          {/* ================= LEFT COLUMN: PERSONAL INFO ================= */}
          <div className="lg:col-span-3 space-y-4">
            {/* Datos Personales Card */}
            <div className="bg-white rounded border border-[#ccd5df] p-3 text-xs shadow-xs space-y-3">
              <div className="font-bold text-gray-800 pb-1.5 border-b border-gray-200 flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-[#3869A0]" />
                  <span>Información personal</span>
                </div>
                {isOwnProfile && (
                  <button
                    onClick={() => setShowEditProfileModal(true)}
                    className="text-[#3869A0] hover:text-[#2c537f] hover:underline font-bold text-[11px] flex items-center gap-1 cursor-pointer transition"
                    title="Editar mis datos personales"
                  >
                    <Edit3 className="w-3 h-3" />
                    <span>Editar</span>
                  </button>
                )}
              </div>

              <div className="space-y-2 text-gray-700">
                <div className="flex items-start justify-between">
                  <span className="text-gray-400 font-medium">Nombre:</span>
                  <span className="font-semibold text-right">{profileUser.nombre} {profileUser.apellidos}</span>
                </div>
                <div className="flex items-start justify-between">
                  <span className="text-gray-400 font-medium">Cumpleaños:</span>
                  <span className="font-semibold text-right">{profileUser.fnac} ({userAge} años)</span>
                </div>
                <div className="flex items-start justify-between">
                  <span className="text-gray-400 font-medium">Sexo:</span>
                  <span className="font-semibold text-right">{profileUser.sexo === 'h' ? 'Chico (Hombre)' : 'Chica (Mujer)'}</span>
                </div>
                {profileUser.pais && (
                  <div className="flex items-start justify-between">
                    <span className="text-gray-400 font-medium">País:</span>
                    <span className="font-semibold text-right">{profileUser.pais}</span>
                  </div>
                )}
                <div className="flex items-start justify-between">
                  <span className="text-gray-400 font-medium">Ubicación:</span>
                  <span className="font-semibold text-right">{formatFullLocation(profileUser)}</span>
                </div>
                <div className="flex items-start justify-between">
                  <span className="text-gray-400 font-medium">Situación:</span>
                  <span className="font-semibold text-right text-[#3869A0]">{profileUser.situacionSentimental}</span>
                </div>

                {profileUser.ocupacion && (
                  <div className="pt-1 border-t border-gray-100">
                    <span className="text-gray-400 font-medium block mb-0.5">Ocupación / Estudios:</span>
                    <p className="font-semibold text-gray-800">{profileUser.ocupacion}</p>
                  </div>
                )}

                {profileUser.intereses && (
                  <div className="pt-1 border-t border-gray-100">
                    <span className="text-gray-400 font-medium block mb-0.5">Intereses y aficiones:</span>
                    <p className="text-gray-700">{profileUser.intereses}</p>
                  </div>
                )}

                {profileUser.musica && (
                  <div className="pt-2 border-t border-gray-100 dark:border-slate-800">
                    <span className="text-gray-400 font-medium block mb-1 flex items-center justify-between">
                      <span className="flex items-center gap-1">
                        <Music className="w-3.5 h-3.5 text-[#3869A0] dark:text-blue-400" />
                        <span>Música / Canción del Perfil:</span>
                      </span>
                      <span className="text-[10px] text-[#3869A0] font-bold">♪ Myspace/Tuenti Vibe</span>
                    </span>
                    
                    {/* Interactive Profile Song Player Box */}
                    {(() => {
                      const matchedTrack = musicPlaylist.find(t => 
                        profileUser.musica?.toLowerCase().includes(t.title.toLowerCase()) || 
                        profileUser.musica?.toLowerCase().includes(t.artist.toLowerCase())
                      ) || musicPlaylist[Math.abs(profileUser.id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0)) % musicPlaylist.length] || musicPlaylist[0];

                      const isThisTrackPlaying = isMusicPlaying && currentTrack?.id === matchedTrack?.id;

                      return (
                        <div className="mt-1 p-2 rounded-lg bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-slate-800 dark:to-blue-950/40 border border-blue-200 dark:border-blue-900/60 shadow-2xs space-y-1.5">
                          <div className="flex items-center gap-2">
                            <div className="relative w-8 h-8 rounded-full overflow-hidden border border-[#3869A0]/40 flex-shrink-0">
                              <img 
                                src={matchedTrack?.coverUrl} 
                                alt="" 
                                className={`w-full h-full object-cover ${isThisTrackPlaying ? 'animate-spin' : ''}`}
                                style={{ animationDuration: '4s' }}
                              />
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="font-bold text-[11px] text-gray-900 dark:text-white truncate">
                                {matchedTrack?.title}
                              </p>
                              <p className="text-[10px] text-gray-500 dark:text-gray-400 truncate">
                                {matchedTrack?.artist} • {matchedTrack?.genre}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center justify-between pt-1 border-t border-blue-100 dark:border-slate-700/60">
                            <button
                              type="button"
                              onClick={() => {
                                if (isThisTrackPlaying) {
                                  togglePlayMusic();
                                } else if (matchedTrack) {
                                  playTrack(matchedTrack);
                                }
                              }}
                              className="px-2.5 py-1 rounded bg-[#3869A0] hover:bg-[#2c537f] text-white text-[10px] font-bold flex items-center gap-1 transition cursor-pointer shadow-xs"
                            >
                              {isThisTrackPlaying ? (
                                <>
                                  <span>⏸ Pausar</span>
                                </>
                              ) : (
                                <>
                                  <span>▶ Escuchar canción</span>
                                </>
                              )}
                            </button>

                            <button
                              type="button"
                              onClick={() => openMusicPlayer(matchedTrack)}
                              className="text-[10px] text-[#3869A0] dark:text-blue-400 hover:underline font-semibold cursor-pointer"
                            >
                              Abrir reproductor
                            </button>
                          </div>
                        </div>
                      );
                    })()}
                  </div>
                )}

                <div className="pt-2 border-t border-gray-100 text-[10px] text-gray-400">
                  Registrado en Inkorium el {profileUser.fechaReg}
                </div>
              </div>
            </div>

            {/* Top Amigos / Amigos Destacados (Classic Tuenti Sidebar Feature) */}
            <div className="bg-white rounded border border-[#ccd5df] p-3 text-xs shadow-xs space-y-2.5">
              <div className="font-bold text-gray-800 pb-2 border-b border-gray-200 flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-gray-900">
                  <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-400" />
                  <span>Top Amigos</span>
                  <span className="text-[10px] bg-amber-100 text-amber-800 font-bold px-1.5 py-0.2 rounded-full">
                    {topAmigosList.length > 0 ? topAmigosList.length : Math.min(friendsList.length, 6)}/8
                  </span>
                </div>
                {isOwnProfile && (
                  <button
                    onClick={() => {
                      setSelectedTopIds(profileUser.topAmigos || []);
                      setShowTopAmigosModal(true);
                    }}
                    className="text-[#3869A0] hover:underline font-bold text-[11px] cursor-pointer"
                  >
                    Editar Top
                  </button>
                )}
              </div>

              {topAmigosList.length === 0 && friendsList.length === 0 ? (
                <p className="text-[11px] text-gray-400 py-2 text-center">
                  Aún no hay amigos en el Top.
                </p>
              ) : (
                <div className="grid grid-cols-3 gap-2">
                  {(topAmigosList.length > 0 ? topAmigosList : friendsList.slice(0, 6)).map((friend) => (
                    <div
                      key={friend.id}
                      onClick={() => viewUserProfile(friend.id)}
                      className="cursor-pointer group text-center space-y-1 relative"
                    >
                      <div className="relative">
                        <img
                          src={friend.avatar}
                          alt={friend.nombre}
                          className="w-full aspect-square object-cover rounded border border-gray-200 group-hover:border-[#3869A0] transition"
                        />
                        <span
                          className={`absolute bottom-0.5 right-0.5 w-2 h-2 rounded-full ring-1 ring-white ${
                            friend.online || friend.presencia === 'conectado' ? 'bg-emerald-500' : 'bg-gray-400'
                          }`}
                        />
                        <Star className="w-2.5 h-2.5 text-amber-500 fill-amber-400 absolute top-0.5 left-0.5 drop-shadow-xs" />
                      </div>
                      <p className="text-[10px] font-semibold text-[#3869A0] group-hover:underline truncate">
                        {friend.nombre}
                      </p>
                    </div>
                  ))}
                </div>
              )}

              {isOwnProfile && topAmigosList.length === 0 && friendsList.length > 0 && (
                <div className="pt-2 border-t border-gray-100 text-center">
                  <button
                    onClick={() => {
                      setSelectedTopIds(friendsList.slice(0, 6).map(f => f.id));
                      setShowTopAmigosModal(true);
                    }}
                    className="text-[11px] text-[#3869A0] font-bold hover:underline cursor-pointer"
                  >
                    ★ Personalizar mis 6-8 amigos del Top
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* ================= CENTER COLUMN: TABLÓN DE FIRMAS (WALL ONLY) ================= */}
          <div className="lg:col-span-6 space-y-4">
            {/* ================= TABLÓN DE COMENTARIOS / FIRMAS ================= */}
            <div className="bg-white rounded border border-[#ccd5df] p-3 text-xs shadow-xs space-y-3">
              <div className="font-bold text-gray-800 pb-2 border-b border-gray-200 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <MessageSquare className="w-3.5 h-3.5 text-[#3869A0]" />
                  <span>Tablón de firmas de {profileUser.nombre} ({userWallComments.length})</span>
                </span>
              </div>

              {/* Input to write on wall */}
              <form onSubmit={handleSendWall} className="space-y-2">
                <textarea
                  value={wallInput}
                  onChange={e => setWallInput(e.target.value)}
                  placeholder={`Escribe algo en el tablón de ${isOwnProfile ? 'tu perfil' : profileUser.nombre}...`}
                  rows={2}
                  className="w-full p-2.5 text-xs rounded border border-gray-300 focus:outline-none focus:ring-1 focus:ring-[#3869A0] focus:border-[#3869A0] resize-none"
                />
                <div className="flex justify-between items-center">
                  <span className="text-[10px] text-gray-400">
                    ¡Déjale una firma o saludo nostálgico! :)
                  </span>
                  <button
                    type="submit"
                    disabled={!wallInput.trim()}
                    className="px-3.5 py-1.5 bg-[#3869A0] hover:bg-[#2c537f] disabled:bg-gray-300 text-white font-bold text-xs rounded transition flex items-center gap-1.5 cursor-pointer disabled:cursor-not-allowed shadow-xs"
                  >
                    <Send className="w-3 h-3" />
                    <span>Firmar tablón</span>
                  </button>
                </div>
              </form>

              {/* Wall Comments Stream */}
              <div className="divide-y divide-gray-100 pt-2 space-y-3">
                {userWallComments.length === 0 ? (
                  <div className="py-8 text-center text-gray-400 text-xs">
                    Todavía no hay comentarios en este tablón. ¡Sé el primero en firmar!
                  </div>
                ) : (
                  userWallComments.map(comment => {
                    const authorId = comment.autorId || comment.emisorId || '';
                    const authorName = comment.autorNombre || comment.emisorNombre || 'Usuario';
                    const authorAvatar = comment.autorAvatar || comment.emisorAvatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=400&auto=format&fit=crop&q=80';
                    const commentText = comment.texto || comment.comentario || '';
                    const canDelete = isOwnProfile || authorId === currentUser.id;

                    return (
                      <div key={comment.id} className="pt-3 first:pt-0 flex items-start gap-3 group">
                        <img
                          src={authorAvatar}
                          alt={authorName}
                          className="w-10 h-10 rounded object-cover border border-gray-300 cursor-pointer hover:opacity-90 flex-shrink-0"
                          onClick={() => authorId && viewUserProfile(authorId)}
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=400&auto=format&fit=crop&q=80';
                          }}
                        />
                        <div className="flex-1 bg-[#f9fafb] p-2.5 rounded border border-gray-200 space-y-1">
                          <div className="flex items-center justify-between">
                            <span
                              onClick={() => authorId && viewUserProfile(authorId)}
                              className="font-bold text-[#3869A0] hover:underline cursor-pointer text-xs"
                            >
                              {authorName}
                            </span>
                            <div className="flex items-center gap-2">
                              <span className="text-[10px] text-gray-400">{comment.fecha}</span>
                              {canDelete && (
                                <button
                                  onClick={() => deleteWallComment(comment.id)}
                                  className="text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition cursor-pointer"
                                  title="Borrar comentario del tablón"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </div>
                          </div>
                          <p className="text-gray-800 text-xs whitespace-pre-line leading-relaxed">
                            {commentText}
                          </p>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>

          {/* ================= RIGHT COLUMN: PHOTOS, FRIENDS & ACTIVITY LOG WIDGET ================= */}
          <div className="lg:col-span-3 space-y-4">
            {/* Fotos y Álbumes Mini Widget (Right sidebar style) */}
            <div className="bg-white rounded border border-[#ccd5df] p-3 text-xs shadow-xs space-y-2.5">
              <div className="font-bold text-gray-800 pb-2 border-b border-gray-200 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <ImageIcon className="w-3.5 h-3.5 text-[#3869A0]" />
                  <span>Fotos ({userPhotos.length + taggedPhotos.length})</span>
                </span>
                <button
                  onClick={() => setProfileSubTab('fotos')}
                  className="text-[11px] text-[#3869A0] hover:underline font-semibold cursor-pointer"
                >
                  Ver todas
                </button>
              </div>

              {userPhotos.length === 0 && taggedPhotos.length === 0 ? (
                <div className="py-3 text-center text-gray-400 text-xs space-y-1">
                  <p>Aún no hay fotos subidas.</p>
                  {isOwnProfile && (
                    <button
                      onClick={onOpenUpload}
                      className="text-[#3869A0] hover:underline text-[11px] font-semibold block mx-auto mt-1 cursor-pointer"
                    >
                      + Subir foto
                    </button>
                  )}
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="grid grid-cols-3 gap-1.5">
                    {[...userPhotos, ...taggedPhotos].slice(0, 6).map((photo) => (
                      <div
                        key={photo.id}
                        onClick={() => viewPhoto(photo.id)}
                        className="aspect-square rounded overflow-hidden border border-gray-200 hover:border-[#3869A0] cursor-pointer group relative bg-gray-100 shadow-2xs"
                        title={photo.titulo || 'Foto'}
                      >
                        <img
                          src={photo.archivo}
                          alt={photo.titulo || 'Foto'}
                          className="w-full h-full object-cover group-hover:scale-105 transition"
                        />
                        <div className="absolute inset-0 bg-black/35 opacity-0 group-hover:opacity-100 transition flex items-end p-1 text-[9px] text-white font-medium">
                          <span className="truncate drop-shadow-xs">{photo.titulo || 'Foto'}</span>
                        </div>
                      </div>
                    ))}
                  </div>

                  {userAlbums.length > 0 && (
                    <div className="pt-2 border-t border-gray-100 flex flex-wrap gap-1">
                      {userAlbums.slice(0, 3).map(alb => (
                        <button
                          key={alb.id}
                          onClick={() => viewAlbum(alb.id)}
                          className="px-2 py-0.5 bg-gray-100 hover:bg-blue-50 hover:text-[#3869A0] text-gray-600 rounded text-[10px] font-medium transition cursor-pointer truncate max-w-[120px]"
                        >
                          📁 {alb.nombre}
                        </button>
                      ))}
                    </div>
                  )}

                  <div className="pt-2 border-t border-gray-100 flex items-center justify-between text-[11px]">
                    {isOwnProfile ? (
                      <button
                        onClick={onOpenUpload}
                        className="text-[#3869A0] font-bold hover:underline flex items-center gap-1 cursor-pointer"
                      >
                        <Upload className="w-3 h-3" />
                        <span>Subir foto</span>
                      </button>
                    ) : (
                      <span className="text-[10px] text-gray-400">
                        {userAlbums.length} {userAlbums.length === 1 ? 'álbum' : 'álbumes'}
                      </span>
                    )}
                    <button
                      onClick={() => setProfileSubTab('fotos')}
                      className="text-gray-500 hover:text-gray-800 hover:underline cursor-pointer flex items-center gap-0.5 text-[10px]"
                    >
                      <span>Ver galería</span>
                      <ChevronRight className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              )}
            </div>
            {/* Friends Quick Widget */}
            <div className="bg-white rounded border border-[#ccd5df] p-3 text-xs shadow-xs space-y-2.5">
              <div className="font-bold text-gray-800 pb-2 border-b border-gray-200 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <Users className="w-3.5 h-3.5 text-[#3869A0]" />
                  <span>Amigos de {profileUser.nombre} ({friendsList.length})</span>
                </span>
                <button
                  onClick={() => setProfileSubTab('amigos')}
                  className="text-[11px] text-[#3869A0] hover:underline font-semibold cursor-pointer"
                >
                  Ver todos
                </button>
              </div>

              {friendsList.length === 0 ? (
                <div className="py-4 text-center text-gray-400 text-xs space-y-1">
                  <p>Todavía no tiene amigos agregados.</p>
                  {isOwnProfile && (
                    <button
                      onClick={() => setActiveTab('gente')}
                      className="text-[#3869A0] hover:underline text-[11px] font-semibold block mx-auto mt-1 cursor-pointer"
                    >
                      Buscar personas para añadir
                    </button>
                  )}
                </div>
              ) : (
                <div className="grid grid-cols-3 gap-2">
                  {friendsList.slice(0, 9).map(friend => (
                    <div
                      key={friend.id}
                      onClick={() => viewUserProfile(friend.id)}
                      className="cursor-pointer group text-center space-y-1"
                    >
                      <div className="relative">
                        <img
                          src={friend.avatar}
                          alt={friend.nombre}
                          className="w-full aspect-square object-cover rounded border border-gray-200 group-hover:opacity-80 transition"
                        />
                        <span
                          className={`absolute bottom-1 right-1 w-2 h-2 rounded-full ring-1 ring-white ${
                            friend.online || friend.presencia === 'conectado' ? 'bg-emerald-500' : 'bg-gray-400'
                          }`}
                        />
                      </div>
                      <p className="text-[10px] font-semibold text-[#3869A0] group-hover:underline truncate">
                        {friend.nombre}
                      </p>
                    </div>
                  ))}
                </div>
              )}

              {friendsList.length > 9 && (
                <button
                  onClick={() => setProfileSubTab('amigos')}
                  className="w-full py-1.5 bg-gray-50 hover:bg-gray-100 text-[#3869A0] font-semibold text-[11px] rounded border border-gray-200 transition cursor-pointer text-center"
                >
                  Ver los {friendsList.length} amigos →
                </button>
              )}
            </div>

            {/* ================= QUIÉN HA VISTO MI PERFIL (VISITAS AL PERFIL) ================= */}
            <RecentProfileVisits
              profileUser={profileUser}
              isOwnProfile={isOwnProfile}
              onViewUserProfile={viewUserProfile}
              onOpenDirectMessage={openComposeMessage}
              onOpenChat={openChatWith}
            />

            {/* ================= REGISTRO DE ACTIVIDAD (ACTIVITY LOG WIDGET) ================= */}
            <ActivityLog 
              userId={profileUser.id} 
              userName={profileUser.nombre} 
              isOwnProfile={isOwnProfile} 
            />
          </div>
        </div>
      )}

      {/* ================= PRIVATE MESSAGE MODAL ================= */}
      {showDirectMessageModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white rounded-lg border border-gray-300 max-w-md w-full p-4 shadow-2xl space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-gray-200">
              <h3 className="font-bold text-sm text-gray-800">
                Enviar mensaje privado a {profileUser.nombre}
              </h3>
              <button 
                onClick={() => setShowDirectMessageModal(false)}
                className="text-gray-400 hover:text-gray-700 text-base font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSendMp} className="space-y-2.5 text-xs">
              <div>
                <label className="font-semibold text-gray-700 block mb-1">Asunto:</label>
                <input
                  type="text"
                  placeholder="Escribe el asunto..."
                  value={mpSubject}
                  onChange={e => setMpSubject(e.target.value)}
                  className="w-full p-2 text-xs rounded border border-gray-300 focus:outline-none focus:border-[#3869A0]"
                />
              </div>

              <div>
                <label className="font-semibold text-gray-700 block mb-1">Mensaje:</label>
                <textarea
                  rows={4}
                  placeholder="Escribe tu mensaje privado..."
                  value={mpBody}
                  onChange={e => setMpBody(e.target.value)}
                  className="w-full p-2 text-xs rounded border border-gray-300 focus:outline-none focus:border-[#3869A0] resize-none"
                  required
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowDirectMessageModal(false)}
                  className="px-3 py-1.5 rounded bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={!mpBody.trim()}
                  className="px-4 py-1.5 rounded bg-[#3869A0] hover:bg-[#2c537f] text-white font-bold cursor-pointer shadow-xs disabled:opacity-50"
                >
                  Enviar mensaje
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Avatar Upload / Change Modal */}
      <AvatarModal
        isOpen={showAvatarModal}
        onClose={() => setShowAvatarModal(false)}
      />

      {/* Personal Info Edit Modal */}
      <EditProfileModal
        isOpen={showEditProfileModal}
        onClose={() => setShowEditProfileModal(false)}
        onOpenAvatarModal={() => setShowAvatarModal(true)}
      />

      {/* Top Amigos Selection Modal */}
      {showTopAmigosModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-lg border border-[#ccd5df] shadow-2xl max-w-lg w-full overflow-hidden flex flex-col max-h-[85vh]">
            <div className="bg-[#3869A0] text-white p-3.5 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Star className="w-4 h-4 text-yellow-300 fill-yellow-300" />
                <h3 className="font-bold text-sm">Elegir tus 6-8 Amigos Destacados (Top Amigos)</h3>
              </div>
              <button
                onClick={() => setShowTopAmigosModal(false)}
                className="text-white/80 hover:text-white text-base font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="p-4 overflow-y-auto space-y-3 text-xs flex-1">
              <div className="bg-amber-50 border border-amber-200 rounded p-2.5 text-amber-800 text-[11px] flex items-center gap-2">
                <Star className="w-4 h-4 text-amber-600 fill-amber-400 shrink-0" />
                <span>
                  Selecciona entre 1 y 8 amigos para mostrarlos en el bloque de honor en el lateral izquierdo de tu perfil, tal como en el Tuenti de 2008.
                </span>
              </div>

              <div className="flex items-center justify-between font-bold text-gray-700 pt-1">
                <span>Tus amigos disponibles ({friendsList.length}):</span>
                <span className="text-[#3869A0]">{selectedTopIds.length} / 8 seleccionados</span>
              </div>

              {friendsList.length === 0 ? (
                <p className="text-gray-400 py-6 text-center">
                  Primero necesitas añadir amigos para poder agregarlos a tu Top.
                </p>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 max-h-72 overflow-y-auto p-1">
                  {friendsList.map(friend => {
                    const isSelected = selectedTopIds.includes(friend.id);
                    return (
                      <div
                        key={friend.id}
                        onClick={() => {
                          if (isSelected) {
                            setSelectedTopIds(prev => prev.filter(id => id !== friend.id));
                          } else {
                            if (selectedTopIds.length >= 8) {
                              alert('Has alcanzado el límite máximo de 8 amigos en el Top.');
                              return;
                            }
                            setSelectedTopIds(prev => [...prev, friend.id]);
                          }
                        }}
                        className={`p-2 rounded border cursor-pointer transition flex items-center gap-2 relative select-none ${
                          isSelected
                            ? 'bg-blue-50 border-[#3869A0] shadow-xs'
                            : 'bg-white border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <img
                          src={friend.avatar}
                          alt={friend.nombre}
                          className="w-9 h-9 rounded object-cover border border-gray-200 shrink-0"
                        />
                        <div className="min-w-0 flex-1">
                          <p className="font-bold text-gray-800 text-[11px] truncate">
                            {friend.nombre}
                          </p>
                          <p className="text-[10px] text-gray-400 truncate">
                            {friend.provincia || 'España'}
                          </p>
                        </div>
                        {isSelected ? (
                          <div className="w-5 h-5 rounded-full bg-[#3869A0] text-white flex items-center justify-center shrink-0">
                            <Check className="w-3 h-3" />
                          </div>
                        ) : (
                          <div className="w-5 h-5 rounded-full border border-gray-300 shrink-0" />
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="p-3 bg-gray-50 border-t border-gray-200 flex items-center justify-between text-xs">
              <button
                type="button"
                onClick={() => setSelectedTopIds([])}
                className="text-gray-500 hover:text-red-600 text-[11px] font-medium cursor-pointer"
              >
                Limpiar selección
              </button>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setShowTopAmigosModal(false)}
                  className="px-3 py-1.5 rounded bg-gray-200 text-gray-700 font-semibold cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={() => {
                    updateTopAmigos(selectedTopIds);
                    setShowTopAmigosModal(false);
                  }}
                  className="px-4 py-1.5 rounded bg-[#3869A0] hover:bg-[#2c537f] text-white font-bold cursor-pointer shadow-xs"
                >
                  Guardar Top Amigos
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
