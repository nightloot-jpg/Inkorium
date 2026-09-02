import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useInkorium } from '../context/InkoriumContext';
import { 
  ChevronLeft, ChevronRight, X, Heart, MessageSquare, 
  Tag, Trash2, Send, Download, 
  Maximize2, Minimize2, Smile, Folder, Calendar, Camera, Check, Search, UserPlus,
  Globe, Users, Lock, UserCheck, ShieldCheck, CheckSquare, Square
} from 'lucide-react';
import { PhotoTag, PhotoComment, Photo, PhotoPrivacy } from '../types';

const TUENTI_EMOTICONS = [
  { text: ':) ', label: 'Sonrisa' },
  { text: ':D ', label: 'Risa' },
  { text: ';) ', label: 'Guiño' },
  { text: 'xD ', label: 'Carcajada' },
  { text: ':( ', label: 'Triste' },
  { text: ':P ', label: 'Lengua' },
  { text: '<3 ', label: 'Corazón' },
  { text: '*.* ', label: 'Enamorado' },
  { text: ':O ', label: 'Sorpresa' },
  { text: '^^ ', label: 'Felicidad' }
];

export const PhotoLightbox: React.FC = () => {
  const {
    currentUser,
    users,
    photos,
    albums,
    selectedPhotoId,
    selectedAlbumId,
    viewPhoto,
    viewAlbum,
    viewUserProfile,
    addPhotoComment,
    likePhoto,
    addPhotoTag,
    removePhotoTag,
    setPhotoAsAvatar,
    deletePhoto,
    canUserViewPhoto,
    updatePhotoPrivacy,
    getFriendsOf
  } = useInkorium();

  const [taggingMode, setTaggingMode] = useState(false);
  const [tagCoords, setTagCoords] = useState<{ x: number; y: number } | null>(null);
  const [selectedTagUserId, setSelectedTagUserId] = useState<string>('');
  const [tagSearchQuery, setTagSearchQuery] = useState('');
  const [hoveredTagId, setHoveredTagId] = useState<string | null>(null);
  const [commentText, setCommentText] = useState('');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showEmoticons, setShowEmoticons] = useState(false);
  const [avatarSuccess, setAvatarSuccess] = useState(false);
  
  // Privacy edit modal state
  const [showPrivacyModal, setShowPrivacyModal] = useState(false);
  const [editPrivacy, setEditPrivacy] = useState<PhotoPrivacy>('amigos');
  const [editAllowedUsers, setEditAllowedUsers] = useState<string[]>([]);
  const [privacySearchQuery, setPrivacySearchQuery] = useState('');

  const commentInputRef = useRef<HTMLInputElement>(null);
  const imageContainerRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);

  // Active photo list (scoped to album if an album is selected, otherwise all photos)
  const activePhotosList = useMemo(() => {
    if (!photos || photos.length === 0) return [];
    if (selectedAlbumId) {
      const albumPhotos = photos.filter(p => p.albumId === selectedAlbumId);
      if (albumPhotos.length > 0) return albumPhotos;
    }
    return photos;
  }, [photos, selectedAlbumId]);

  // Find the selected photo, with fallback if not directly matching ID
  const { currentPhotoIndex, photo } = useMemo(() => {
    if (!selectedPhotoId) return { currentPhotoIndex: -1, photo: null };

    // Try finding in active scoped list
    let idx = activePhotosList.findIndex(p => p.id === selectedPhotoId || p.archivo === selectedPhotoId);
    let resolvedPhoto = idx !== -1 ? activePhotosList[idx] : null;

    // Fallback: search in all photos
    if (!resolvedPhoto && photos.length > 0) {
      idx = photos.findIndex(p => p.id === selectedPhotoId || p.archivo === selectedPhotoId);
      if (idx !== -1) {
        resolvedPhoto = photos[idx];
      }
    }

    // Secondary fallback: generate a temporary display photo if only a URL was given
    if (!resolvedPhoto && selectedPhotoId) {
      resolvedPhoto = {
        id: selectedPhotoId,
        uploaderId: currentUser?.id || 'unknown',
        uploaderName: currentUser ? `${currentUser.nombre} ${currentUser.apellidos}`.trim() : 'Usuario',
        archivo: selectedPhotoId.startsWith('http') || selectedPhotoId.startsWith('data:') ? selectedPhotoId : '',
        titulo: 'Foto de Inkorium',
        fecha: 'Reciente',
        etiquetas: [],
        comentarios: [],
        likes: []
      };
      idx = 0;
    }

    return { currentPhotoIndex: idx, photo: resolvedPhoto };
  }, [selectedPhotoId, activePhotosList, photos, currentUser]);

  // Tag candidate friends filtering
  const filteredFriendsToTag = useMemo(() => {
    const query = tagSearchQuery.toLowerCase().trim();
    return users.filter(u => {
      if (!query) return true;
      const fullName = `${u.nombre} ${u.apellidos}`.toLowerCase();
      const username = (u.username || '').toLowerCase();
      return fullName.includes(query) || username.includes(query);
    });
  }, [users, tagSearchQuery]);

  const listToUse = activePhotosList.length > 0 ? activePhotosList : photos;
  const currentTotal = listToUse.length > 0 ? listToUse.length : 1;
  const safeIndex = currentPhotoIndex >= 0 ? currentPhotoIndex : 0;

  const hasPrev = listToUse.length > 1 && safeIndex > 0;
  const hasNext = listToUse.length > 1 && safeIndex < listToUse.length - 1;

  const goToPrev = () => {
    if (hasPrev && listToUse[safeIndex - 1]) {
      viewPhoto(listToUse[safeIndex - 1].id);
      setTaggingMode(false);
      setTagCoords(null);
      setTagSearchQuery('');
    }
  };

  const goToNext = () => {
    if (hasNext && listToUse[safeIndex + 1]) {
      viewPhoto(listToUse[safeIndex + 1].id);
      setTaggingMode(false);
      setTagCoords(null);
      setTagSearchQuery('');
    }
  };

  // Defensive check for current user's friend list & privacy list (Must be declared before any conditional returns)
  const myFriends = useMemo(() => {
    if (!currentUser) return [];
    const friends = getFriendsOf(currentUser.id);
    return friends.length > 0 ? friends : users.filter(u => u.id !== currentUser.id);
  }, [getFriendsOf, currentUser, users]);

  const filteredPrivacyFriends = useMemo(() => {
    if (!privacySearchQuery.trim()) return myFriends;
    const q = privacySearchQuery.toLowerCase();
    return myFriends.filter(f => {
      const name = `${f.nombre} ${f.apellidos}`.toLowerCase();
      const username = (f.username || '').toLowerCase();
      const city = (f.ciudad || f.provincia || '').toLowerCase();
      return name.includes(q) || username.includes(q) || city.includes(q);
    });
  }, [myFriends, privacySearchQuery]);

  // Keyboard navigation & Esc to close
  useEffect(() => {
    if (!selectedPhotoId) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA')) {
        if (e.key === 'Escape') {
          target.blur();
        }
        return;
      }

      if (e.key === 'Escape') {
        if (taggingMode) {
          setTaggingMode(false);
          setTagCoords(null);
        } else {
          viewPhoto(null);
        }
      } else if (e.key === 'ArrowLeft') {
        goToPrev();
      } else if (e.key === 'ArrowRight') {
        goToNext();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedPhotoId, safeIndex, listToUse, hasPrev, hasNext, taggingMode]);

  if (!selectedPhotoId || !photo) return null;

  // Defensive values to avoid any possible null-pointer or property crashes
  const safeLikes = Array.isArray(photo.likes) ? photo.likes : [];
  const safeComments = Array.isArray(photo.comentarios) ? photo.comentarios : [];
  const safeTags = Array.isArray(photo.etiquetas) ? photo.etiquetas : [];
  const uploaderName = photo.uploaderName || 'Usuario';
  const uploaderInitial = uploaderName.charAt(0).toUpperCase() || 'U';
  const isUploader = currentUser && (photo.uploaderId === currentUser.id || photo.uploaderId === currentUser.username);
  const hasLiked = currentUser ? safeLikes.includes(currentUser.id) : false;

  // Find uploader object for avatar
  const uploaderUser = users.find(u => u.id === photo.uploaderId || u.username === photo.uploaderId);
  const uploaderAvatar = uploaderUser?.avatar || (isUploader ? currentUser?.avatar : '') || '';

  // Album name if associated
  const associatedAlbum = albums.find(a => a.id === photo.albumId);
  const displayAlbumName = photo.albumName || associatedAlbum?.nombre;

  const handleImageClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!taggingMode) return;
    const target = imageRef.current || imageContainerRef.current || e.currentTarget;
    const rect = target.getBoundingClientRect();
    if (rect.width <= 0 || rect.height <= 0) return;
    const x = Math.max(2, Math.min(98, ((e.clientX - rect.left) / rect.width) * 100));
    const y = Math.max(2, Math.min(98, ((e.clientY - rect.top) / rect.height) * 100));
    setTagCoords({ x, y });
  };

  const handleConfirmTag = (targetUserId: string) => {
    if (!tagCoords || !targetUserId) return;
    addPhotoTag(photo.id, targetUserId, Math.round(tagCoords.x), Math.round(tagCoords.y));
    setTagCoords(null);
    setTaggingMode(false);
    setSelectedTagUserId('');
    setTagSearchQuery('');
  };

  const handleSelfTag = () => {
    if (!currentUser) return;
    handleConfirmTag(currentUser.id);
  };

  const handleAddComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim()) return;
    addPhotoComment(photo.id, commentText);
    setCommentText('');
    setShowEmoticons(false);
  };

  const handleInsertEmoticon = (emoticon: string) => {
    setCommentText(prev => `${prev}${emoticon}`);
    if (commentInputRef.current) {
      commentInputRef.current.focus();
    }
  };

  const handleSetAvatar = () => {
    setPhotoAsAvatar(photo.id);
    setAvatarSuccess(true);
    setTimeout(() => setAvatarSuccess(false), 3000);
  };

  const handleDownload = () => {
    if (!photo.archivo) return;
    const a = document.createElement('a');
    a.href = photo.archivo;
    a.download = `${photo.titulo || 'inkorium-foto'}.jpg`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  // Check viewer permission
  const isAllowedToView = photo ? canUserViewPhoto(photo, currentUser?.id) : true;

  const handleOpenPrivacyModal = () => {
    if (!photo) return;
    setEditPrivacy(photo.privacidad || 'amigos');
    setEditAllowedUsers(photo.allowedUserIds || []);
    setPrivacySearchQuery('');
    setShowPrivacyModal(true);
  };

  const handleSavePrivacy = () => {
    if (!photo) return;
    updatePhotoPrivacy(photo.id, editPrivacy, editAllowedUsers);
    setShowPrivacyModal(false);
  };

  const toggleEditAllowedUser = (userId: string) => {
    setEditAllowedUsers(prev =>
      prev.includes(userId) ? prev.filter(id => id !== userId) : [...prev, userId]
    );
  };

  if (!isAllowedToView && !isUploader) {
    return (
      <div 
        className="fixed inset-0 z-50 bg-black/95 backdrop-blur-md flex items-center justify-center p-4 text-white animate-fade-in"
        id="inkorium-photo-lightbox-restricted"
      >
        <div className="bg-[#1c222c] border border-gray-700 rounded-lg p-6 max-w-md w-full text-center space-y-4 shadow-2xl">
          <div className="w-14 h-14 mx-auto rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center border border-amber-500/30">
            <Lock className="w-7 h-7" />
          </div>
          <div>
            <h2 className="text-base font-bold text-gray-100">Foto privada o restringida</h2>
            <p className="text-xs text-gray-400 mt-1.5 leading-relaxed">
              Esta foto tiene una configuración de privacidad personalizada por <strong className="text-white">{uploaderName}</strong> y no está disponible para tu cuenta.
            </p>
          </div>
          <div className="pt-2">
            <button
              onClick={() => viewPhoto(null)}
              className="px-5 py-2 bg-[#3869A0] hover:bg-[#2c537f] text-white font-bold text-xs rounded transition cursor-pointer"
            >
              Cerrar visor
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div 
      className="fixed inset-0 z-50 bg-black/95 backdrop-blur-md flex flex-col justify-between select-none animate-fade-in text-white"
      id="inkorium-photo-lightbox"
    >
      {/* ================= 1. CLASSIC TUENTI TOP HEADER BAR ================= */}
      <header className="w-full bg-[#1b2028] border-b border-[#2d3542] px-3 sm:px-5 py-2.5 flex items-center justify-between z-30 shadow-md text-xs">
        {/* Left: Album Navigation & Context */}
        <div className="flex items-center gap-3 overflow-hidden">
          <button
            onClick={() => {
              viewPhoto(null);
              if (photo.albumId) {
                viewAlbum(photo.albumId);
              }
            }}
            className="flex items-center gap-1.5 text-blue-300 hover:text-white font-bold transition truncate cursor-pointer"
            title="Volver a la galería"
          >
            <ChevronLeft className="w-4 h-4 text-blue-400" />
            <span className="truncate">
              {displayAlbumName ? `Álbum: ${displayAlbumName}` : `Fotos de ${uploaderName}`}
            </span>
          </button>

          <span className="text-gray-500 hidden sm:inline">|</span>

          {/* Photo Counter */}
          <span className="font-semibold text-gray-300 whitespace-nowrap">
            Foto {safeIndex + 1} de {currentTotal}
          </span>
        </div>

        {/* Right: Actions (Tag, Fullscreen, Download, Avatar, Close) */}
        <div className="flex items-center gap-2 sm:gap-2.5">
          {/* Tagging Button */}
          <button
            id="lightbox-btn-tag-friends"
            onClick={() => {
              setTaggingMode(!taggingMode);
              setTagCoords(null);
              setTagSearchQuery('');
            }}
            className={`px-3 py-1.5 rounded text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-xs ${
              taggingMode 
                ? 'bg-amber-400 text-black animate-pulse ring-2 ring-amber-300' 
                : 'bg-[#3869A0] hover:bg-[#2c537f] text-white border border-[#4a7cb6]'
            }`}
            title="Etiquetar amigos en esta foto"
          >
            <Tag className="w-3.5 h-3.5" />
            <span>{taggingMode ? 'Cancelar etiquetado' : 'Etiquetar amigos'}</span>
          </button>

          {/* Set as profile picture button */}
          <button
            onClick={handleSetAvatar}
            className={`px-2.5 py-1.5 rounded text-xs font-semibold transition flex items-center gap-1.5 cursor-pointer ${
              avatarSuccess 
                ? 'bg-emerald-600 text-white font-bold' 
                : 'bg-white/10 hover:bg-white/20 text-gray-200 hover:text-white'
            }`}
            title="Poner como foto de mi perfil"
          >
            {avatarSuccess ? <Check className="w-3.5 h-3.5" /> : <Camera className="w-3.5 h-3.5" />}
            <span className="hidden md:inline">{avatarSuccess ? '¡Foto actualizada!' : 'Poner de perfil'}</span>
          </button>

          {/* Download button */}
          <button
            onClick={handleDownload}
            className="p-1.5 bg-white/10 hover:bg-white/20 text-gray-200 hover:text-white rounded transition cursor-pointer"
            title="Descargar foto"
          >
            <Download className="w-4 h-4" />
          </button>

          {/* Fullscreen toggle */}
          <button
            onClick={() => setIsFullscreen(!isFullscreen)}
            className="p-1.5 bg-white/10 hover:bg-white/20 text-gray-200 hover:text-white rounded transition cursor-pointer hidden sm:block"
            title={isFullscreen ? 'Salir de pantalla completa' : 'Pantalla completa'}
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>

          {/* Big Close Button */}
          <button
            onClick={() => viewPhoto(null)}
            className="p-1.5 bg-red-600/85 hover:bg-red-600 text-white rounded transition ml-1 cursor-pointer font-bold flex items-center gap-1 px-2.5"
            title="Cerrar visor (Esc)"
          >
            <X className="w-4 h-4" />
            <span className="hidden sm:inline text-[11px]">Cerrar</span>
          </button>
        </div>
      </header>

      {/* ================= 2. MAIN BODY (STAGE + SIDEBAR) ================= */}
      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden relative">
        {/* LEFT COLUMN: PHOTO STAGE & CONTROLS */}
        <div className={`flex-1 flex flex-col justify-between bg-[#0b0e14] relative overflow-hidden ${isFullscreen ? 'lg:w-full' : 'lg:w-8/12 xl:w-3/4'}`}>
          {/* Active Tagging Help Notification */}
          {taggingMode && !tagCoords && (
            <div className="absolute top-4 left-1/2 -translate-x-1/2 z-30 bg-amber-400 text-black font-bold text-xs px-4 py-2 rounded-full shadow-2xl animate-bounce flex items-center gap-2 border border-amber-500">
              <Tag className="w-4 h-4" />
              <span>Haz clic sobre la persona en la foto para colocar su etiqueta</span>
            </div>
          )}

          {/* Centered Photo Canvas Container */}
          <div 
            className="flex-1 flex items-center justify-center relative p-3 sm:p-6 w-full h-full overflow-hidden"
          >
            {/* The Main Image Container */}
            <div 
              ref={imageContainerRef}
              className={`relative max-h-full max-w-full flex items-center justify-center group ${
                taggingMode ? 'cursor-crosshair' : 'cursor-default'
              }`}
              onClick={handleImageClick}
            >
              <img
                ref={imageRef}
                src={photo.archivo}
                alt={photo.titulo || 'Foto'}
                className="max-h-[68vh] md:max-h-[76vh] max-w-full object-contain rounded shadow-2xl transition duration-150 select-none pointer-events-auto"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=1200&q=80';
                }}
              />

              {/* Tag Overlays onto photo */}
              {safeTags.map((tag) => {
                const tagName = tag.userName || tag.nombre || 'Amigo';
                const tagUserId = tag.userId || tag.usuarioId || '';
                const isHovered = hoveredTagId === tag.id;
                const taggedFriendUser = users.find(u => u.id === tagUserId);
                const friendAvatar = taggedFriendUser?.avatar;

                return (
                  <div
                    key={tag.id}
                    style={{ left: `${tag.x}%`, top: `${tag.y}%` }}
                    className="absolute -translate-x-1/2 -translate-y-1/2 pointer-events-auto group/tag z-20"
                    onMouseEnter={() => setHoveredTagId(tag.id)}
                    onMouseLeave={() => setHoveredTagId(null)}
                    onClick={(e) => e.stopPropagation()}
                  >
                    {/* Tag Box Marker */}
                    <div className={`w-14 h-14 border-2 rounded shadow-lg transition duration-200 ${
                      isHovered
                        ? 'border-amber-400 bg-amber-400/25 scale-110 ring-4 ring-amber-300/40'
                        : 'border-white/80 border-dashed group-hover/tag:border-amber-400 group-hover/tag:bg-amber-400/15'
                    }`}></div>
                    
                    {/* Tag Tooltip with friend avatar & name */}
                    <div className={`absolute top-full left-1/2 -translate-x-1/2 mt-1.5 bg-[#1a1f28]/95 text-white text-[11px] font-bold px-2.5 py-1.5 rounded-md shadow-2xl whitespace-nowrap flex items-center gap-2 backdrop-blur-sm border ${
                      isHovered ? 'border-amber-400 ring-2 ring-amber-400/30' : 'border-gray-600'
                    }`}>
                      {friendAvatar ? (
                        <img src={friendAvatar} alt="" className="w-4 h-4 rounded-full object-cover" />
                      ) : (
                        <span className="text-[10px]">👤</span>
                      )}
                      
                      <button 
                        onClick={() => {
                          if (tagUserId) {
                            viewUserProfile(tagUserId);
                            viewPhoto(null);
                          }
                        }}
                        className="hover:underline hover:text-amber-300 cursor-pointer"
                        title="Ver perfil"
                      >
                        {tagName}
                      </button>

                      {(isUploader || tagUserId === currentUser?.id) && (
                        <button
                          onClick={() => removePhotoTag(photo.id, tag.id)}
                          className="text-red-400 hover:text-red-200 font-bold ml-1 hover:scale-125 transition cursor-pointer p-0.5"
                          title="Eliminar etiqueta"
                        >
                          ✕
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}

              {/* Active Placement Tag Box Popover */}
              {tagCoords && taggingMode && (
                <div
                  style={{ left: `${tagCoords.x}%`, top: `${tagCoords.y}%` }}
                  className="absolute -translate-x-1/2 -translate-y-1/2 z-40"
                  onClick={e => e.stopPropagation()}
                >
                  <div className="w-16 h-16 border-2 border-amber-400 bg-amber-400/30 rounded animate-pulse shadow-2xl"></div>
                  
                  {/* Friend Search & Tag Selector Card */}
                  <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 bg-white text-gray-800 p-3 rounded-lg shadow-2xl border border-gray-300 z-50 w-64 text-xs animate-fade-in">
                    <div className="flex items-center justify-between mb-2">
                      <p className="font-bold text-gray-900 flex items-center gap-1.5 text-xs">
                        <Tag className="w-3.5 h-3.5 text-[#3869A0]" />
                        <span>Etiquetar amigo</span>
                      </p>
                      <button
                        onClick={() => {
                          setTagCoords(null);
                          setTaggingMode(false);
                        }}
                        className="text-gray-400 hover:text-gray-700 font-bold text-xs cursor-pointer"
                      >
                        ✕
                      </button>
                    </div>

                    {/* Quick Self Tag Option */}
                    {currentUser && (
                      <button
                        type="button"
                        onClick={handleSelfTag}
                        className="w-full mb-2.5 py-1.5 px-2 bg-blue-50 hover:bg-blue-100 text-[#3869A0] rounded font-bold text-[11px] flex items-center justify-center gap-1.5 border border-blue-200 cursor-pointer transition"
                      >
                        <UserPlus className="w-3.5 h-3.5" />
                        <span>Etiquetarme a mí mismo</span>
                      </button>
                    )}

                    {/* Search filter input */}
                    <div className="relative mb-2">
                      <Search className="w-3.5 h-3.5 text-gray-400 absolute left-2 top-2" />
                      <input
                        type="text"
                        placeholder="Buscar amigo..."
                        value={tagSearchQuery}
                        onChange={e => setTagSearchQuery(e.target.value)}
                        className="w-full pl-7 pr-2 py-1.5 border border-gray-300 rounded text-xs bg-gray-50 focus:outline-none focus:border-[#3869A0] font-medium"
                        autoFocus
                      />
                    </div>
                    
                    {/* Friends list scrollable */}
                    <div className="max-h-36 overflow-y-auto border border-gray-200 rounded divide-y divide-gray-100 mb-2.5 bg-gray-50/50">
                      {filteredFriendsToTag.length === 0 ? (
                        <div className="p-3 text-center text-gray-400 text-[11px]">
                          No se encontraron amigos
                        </div>
                      ) : (
                        filteredFriendsToTag.map(u => (
                          <button
                            key={u.id}
                            type="button"
                            onClick={() => handleConfirmTag(u.id)}
                            className="w-full text-left p-1.5 hover:bg-blue-50 transition flex items-center gap-2 cursor-pointer group"
                          >
                            <img src={u.avatar} alt="" className="w-6 h-6 rounded-full object-cover border border-gray-300 flex-shrink-0" />
                            <div className="overflow-hidden flex-1">
                              <span className="font-semibold text-gray-800 group-hover:text-[#3869A0] block truncate text-[11px]">
                                {u.nombre} {u.apellidos}
                              </span>
                              <span className="text-[9px] text-gray-400 block truncate">@{u.username || u.id}</span>
                            </div>
                          </button>
                        ))
                      )}
                    </div>
                    
                    <div className="flex justify-end gap-1.5">
                      <button
                        type="button"
                        onClick={() => {
                          setTagCoords(null);
                          setTaggingMode(false);
                        }}
                        className="px-2.5 py-1 bg-gray-200 hover:bg-gray-300 text-gray-700 text-[11px] font-semibold rounded cursor-pointer transition"
                      >
                        Cancelar
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Left Prev Arrow Button */}
            {hasPrev && (
              <button
                onClick={(e) => { e.stopPropagation(); goToPrev(); }}
                className="absolute left-3 top-1/2 -translate-y-1/2 bg-black/60 hover:bg-[#3869A0] text-white p-3 rounded-full transition cursor-pointer shadow-2xl group z-30"
                title="Foto anterior (Flecha Izquierda ←)"
              >
                <ChevronLeft className="w-6 h-6 group-hover:scale-110 transition" />
              </button>
            )}

            {/* Right Next Arrow Button */}
            {hasNext && (
              <button
                onClick={(e) => { e.stopPropagation(); goToNext(); }}
                className="absolute right-3 top-1/2 -translate-y-1/2 bg-black/60 hover:bg-[#3869A0] text-white p-3 rounded-full transition cursor-pointer shadow-2xl group z-30"
                title="Foto siguiente (Flecha Derecha →)"
              >
                <ChevronRight className="w-6 h-6 group-hover:scale-110 transition" />
              </button>
            )}
          </div>

          {/* Bottom Toolbar under image */}
          <div className="bg-[#141822] border-t border-[#232936] px-4 py-2.5 flex items-center justify-between text-xs z-20">
            {/* Left: Likes */}
            <div className="flex items-center gap-3">
              <button
                onClick={() => likePhoto(photo.id)}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-full transition cursor-pointer font-bold ${
                  hasLiked 
                    ? 'bg-rose-500/20 text-rose-400 border border-rose-500/40' 
                    : 'bg-white/10 hover:bg-white/20 text-gray-200'
                }`}
              >
                <Heart className={`w-3.5 h-3.5 ${hasLiked ? 'fill-current text-rose-500' : ''}`} />
                <span>{hasLiked ? 'Te gusta' : 'Me gusta'}</span>
                {safeLikes.length > 0 && (
                  <span className="bg-white/20 px-1.5 py-0.2 rounded-full text-[10px] ml-0.5">
                    {safeLikes.length}
                  </span>
                )}
              </button>

              {safeLikes.length > 0 && (
                <span className="text-gray-400 text-[11px] hidden sm:inline">
                  {hasLiked
                    ? safeLikes.length === 1
                      ? 'A ti te gusta esta foto'
                      : `A ti y a ${safeLikes.length - 1} persona(s) más les gusta esto`
                    : `A ${safeLikes.length} persona(s) les gusta esto`}
                </span>
              )}
            </div>

            {/* Right: Quick tag shortcut & delete photo */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  setTaggingMode(!taggingMode);
                  setTagCoords(null);
                  setTagSearchQuery('');
                }}
                className={`flex items-center gap-1 text-xs px-2.5 py-1 rounded transition cursor-pointer font-medium ${
                  taggingMode ? 'bg-amber-400 text-black font-bold' : 'text-gray-300 hover:text-white bg-white/10 hover:bg-white/20'
                }`}
              >
                <Tag className="w-3.5 h-3.5" />
                <span>{taggingMode ? 'Cancelar' : 'Etiquetar'}</span>
              </button>

              {isUploader && (
                <button
                  onClick={() => {
                    if (confirm('¿Estás seguro de eliminar esta foto de tu galería?')) {
                      deletePhoto(photo.id);
                      viewPhoto(null);
                    }
                  }}
                  className="text-red-400 hover:text-red-300 hover:bg-red-500/10 px-2 py-1 rounded flex items-center gap-1 font-semibold transition cursor-pointer"
                  title="Eliminar esta foto permanentemente"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Eliminar foto</span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: TUENTI DETAILS & TABLÓN DE COMENTARIOS */}
        {!isFullscreen && (
          <aside className="lg:w-4/12 xl:w-1/4 bg-[#f8fafc] text-gray-800 flex flex-col justify-between border-t lg:border-t-0 lg:border-l border-gray-300 h-auto lg:h-full overflow-hidden">
            {/* Top: Uploader & Photo Info */}
            <div className="p-3.5 bg-white border-b border-gray-200 space-y-2.5 shadow-2xs">
              {/* Uploader Card */}
              <div className="flex items-center gap-3">
                <div 
                  onClick={() => {
                    viewUserProfile(photo.uploaderId);
                    viewPhoto(null);
                  }}
                  className="cursor-pointer relative group flex-shrink-0"
                  title={`Ver perfil de ${uploaderName}`}
                >
                  {uploaderAvatar ? (
                    <img 
                      src={uploaderAvatar} 
                      alt={uploaderName} 
                      className="w-10 h-10 rounded-full object-cover border border-gray-300 group-hover:ring-2 group-hover:ring-[#3869A0] transition" 
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-blue-100 text-[#3869A0] font-bold flex items-center justify-center border border-gray-300">
                      {uploaderInitial}
                    </div>
                  )}
                </div>

                <div className="overflow-hidden flex-1">
                  <h3 
                    onClick={() => {
                      viewUserProfile(photo.uploaderId);
                      viewPhoto(null);
                    }}
                    className="font-bold text-xs text-[#3869A0] hover:underline cursor-pointer truncate"
                  >
                    {uploaderName}
                  </h3>
                  <div className="flex items-center gap-1.5 text-[10px] text-gray-400">
                    <Calendar className="w-3 h-3 text-gray-400" />
                    <span>{photo.fecha || 'Recientemente'}</span>
                  </div>
                </div>
              </div>

              {/* Photo Title / Caption */}
              {photo.titulo && (
                <div className="bg-gray-50 rounded p-2 border border-gray-100">
                  <p className="text-xs text-gray-800 font-medium whitespace-pre-line leading-relaxed">
                    {photo.titulo}
                  </p>
                </div>
              )}

              {/* Album Tag */}
              {displayAlbumName && (
                <div className="flex items-center gap-1.5 text-[11px] text-[#3869A0] bg-blue-50/80 px-2 py-1 rounded font-semibold border border-blue-100">
                  <Folder className="w-3 h-3 flex-shrink-0" />
                  <span className="truncate">Álbum: {displayAlbumName}</span>
                </div>
              )}

              {/* Privacy Setting Indicator & Quick Edit */}
              <div className="pt-2 border-t border-gray-100 flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-[11px]">
                  {(!photo.privacidad || photo.privacidad === 'amigos') && (
                    <span className="inline-flex items-center gap-1 text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 font-medium">
                      <Users className="w-3 h-3" />
                      <span>Solo amigos</span>
                    </span>
                  )}
                  {photo.privacidad === 'publica' && (
                    <span className="inline-flex items-center gap-1 text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200 font-medium">
                      <Globe className="w-3 h-3" />
                      <span>Pública</span>
                    </span>
                  )}
                  {photo.privacidad === 'eleccion' && (
                    <span className="inline-flex items-center gap-1 text-purple-700 bg-purple-50 px-2 py-0.5 rounded border border-purple-200 font-medium">
                      <UserCheck className="w-3 h-3" />
                      <span>Elección ({(photo.allowedUserIds || []).length} personas)</span>
                    </span>
                  )}
                </div>

                {isUploader && (
                  <button
                    onClick={handleOpenPrivacyModal}
                    className="text-[10px] text-[#3869A0] hover:underline font-bold cursor-pointer"
                  >
                    Cambiar
                  </button>
                )}
              </div>

              {/* Tagged Friends List ("En esta foto:") */}
              <div className="pt-2 border-t border-gray-100 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-gray-700 flex items-center gap-1">
                    <Tag className="w-3 h-3 text-[#3869A0]" />
                    <span>En esta foto ({safeTags.length}):</span>
                  </span>
                  
                  <button
                    onClick={() => {
                      setTaggingMode(true);
                      setTagCoords(null);
                      setTagSearchQuery('');
                    }}
                    className="text-[10px] text-[#3869A0] hover:underline font-bold cursor-pointer"
                  >
                    + Etiquetar
                  </button>
                </div>

                {safeTags.length === 0 ? (
                  <p className="text-[10px] text-gray-400 italic">No hay nadie etiquetado en esta foto.</p>
                ) : (
                  <div className="flex flex-wrap gap-1">
                    {safeTags.map(t => {
                      const tagId = t.userId || t.usuarioId || '';
                      const tagName = t.userName || t.nombre || 'Amigo';
                      const isHovered = hoveredTagId === t.id;
                      const taggedFriend = users.find(u => u.id === tagId);

                      return (
                        <div
                          key={t.id}
                          onMouseEnter={() => setHoveredTagId(t.id)}
                          onMouseLeave={() => setHoveredTagId(null)}
                          className={`px-2 py-0.5 rounded text-[10px] transition border flex items-center gap-1 ${
                            isHovered
                              ? 'bg-amber-100 border-amber-300 text-amber-900 font-bold'
                              : 'bg-gray-100 hover:bg-blue-100 text-[#3869A0] border-gray-200 font-semibold'
                          }`}
                        >
                          {taggedFriend?.avatar ? (
                            <img src={taggedFriend.avatar} alt="" className="w-3.5 h-3.5 rounded-full object-cover" />
                          ) : (
                            <span>👤</span>
                          )}
                          <button
                            onClick={() => {
                              if (tagId) {
                                viewUserProfile(tagId);
                                viewPhoto(null);
                              }
                            }}
                            className="cursor-pointer hover:underline"
                          >
                            {tagName}
                          </button>
                          {(isUploader || tagId === currentUser?.id) && (
                            <button
                              onClick={() => removePhotoTag(photo.id, t.id)}
                              className="text-gray-400 hover:text-red-500 font-bold ml-0.5 cursor-pointer"
                              title="Quitar etiqueta"
                            >
                              ✕
                            </button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* Middle: Comments Section (Tablón de la foto) */}
            <div className="flex-1 p-3 overflow-y-auto space-y-3 bg-[#f8fafc] text-xs">
              <div className="flex items-center justify-between pb-1 border-b border-gray-200 font-bold text-gray-700 text-xs">
                <span className="flex items-center gap-1.5">
                  <MessageSquare className="w-3.5 h-3.5 text-[#3869A0]" />
                  <span>Comentarios ({safeComments.length})</span>
                </span>
                <span className="text-[10px] text-gray-400 font-normal">Tablón de foto</span>
              </div>

              {safeComments.length === 0 ? (
                <div className="text-center py-10 text-gray-400 text-xs space-y-1">
                  <p>No hay ningún comentario todavía.</p>
                  <p className="text-[11px] text-gray-400">¡Sé el primero en firmar en esta foto!</p>
                </div>
              ) : (
                <div className="space-y-2.5">
                  {safeComments.map((c) => {
                    const cAuthorName = c.autorNombre || c.nombre || 'Usuario';
                    const cAuthorId = c.autorId || c.userId || '';
                    const cAuthorAvatar = c.autorAvatar || c.avatar || '';
                    const cText = c.texto || c.comentario || '';
                    const cInitial = cAuthorName.charAt(0).toUpperCase() || 'U';

                    return (
                      <div key={c.id} className="bg-white p-2.5 rounded border border-gray-200 shadow-2xs space-y-1">
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2">
                            {cAuthorAvatar ? (
                              <img 
                                src={cAuthorAvatar} 
                                alt={cAuthorName} 
                                className="w-6 h-6 rounded-full object-cover border border-gray-300 flex-shrink-0" 
                              />
                            ) : (
                              <div className="w-6 h-6 rounded-full bg-blue-100 text-[#3869A0] font-bold text-[10px] flex items-center justify-center flex-shrink-0">
                                {cInitial}
                              </div>
                            )}
                            <button
                              onClick={() => {
                                if (cAuthorId) {
                                  viewUserProfile(cAuthorId);
                                  viewPhoto(null);
                                }
                              }}
                              className="font-bold text-[#3869A0] hover:underline cursor-pointer text-xs truncate max-w-[130px] text-left"
                            >
                              {cAuthorName}
                            </button>
                          </div>
                          <span className="text-[9px] text-gray-400 whitespace-nowrap">{c.fecha || 'Hoy'}</span>
                        </div>
                        <p className="text-gray-800 text-xs leading-relaxed pl-8 break-words">
                          {cText}
                        </p>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Bottom: Comment Form & Emoticon Bar */}
            <div className="p-2.5 bg-white border-t border-gray-200 space-y-2">
              {/* Emoticon selector bar */}
              {showEmoticons && (
                <div className="p-2 bg-gray-50 rounded border border-gray-200 flex flex-wrap gap-1.5 animate-fade-in shadow-inner">
                  {TUENTI_EMOTICONS.map((emo) => (
                    <button
                      key={emo.text}
                      type="button"
                      onClick={() => handleInsertEmoticon(emo.text)}
                      className="px-1.5 py-0.5 bg-white hover:bg-blue-50 border border-gray-200 hover:border-[#3869A0] rounded text-xs font-mono font-bold cursor-pointer transition"
                      title={emo.label}
                    >
                      {emo.text.trim()}
                    </button>
                  ))}
                </div>
              )}

              <form onSubmit={handleAddComment} className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setShowEmoticons(!showEmoticons)}
                  className={`p-1.5 rounded transition cursor-pointer border ${
                    showEmoticons ? 'bg-amber-100 border-amber-300 text-amber-700' : 'bg-gray-100 hover:bg-gray-200 border-gray-300 text-gray-600'
                  }`}
                  title="Emoticonos de Tuenti"
                >
                  <Smile className="w-4 h-4" />
                </button>

                <input
                  ref={commentInputRef}
                  type="text"
                  placeholder="Escribe un comentario..."
                  value={commentText}
                  onChange={e => setCommentText(e.target.value)}
                  className="flex-1 p-1.5 text-xs rounded border border-gray-300 focus:outline-none focus:border-[#3869A0] bg-white text-gray-800"
                />

                <button
                  type="submit"
                  disabled={!commentText.trim()}
                  className="px-3 py-1.5 bg-[#3869A0] hover:bg-[#2c537f] disabled:bg-gray-300 text-white font-bold text-xs rounded transition cursor-pointer shadow-xs disabled:cursor-not-allowed flex items-center gap-1"
                >
                  <Send className="w-3 h-3" />
                  <span className="hidden sm:inline">Comentar</span>
                </button>
              </form>

              {/* Surrounding photos thumbnails carousel */}
              {listToUse.length > 1 && (
                <div className="pt-2 border-t border-gray-100 flex items-center gap-1.5 overflow-x-auto py-1 scrollbar-thin">
                  {listToUse.map((p, idx) => (
                    <div
                      key={p.id}
                      onClick={() => {
                        viewPhoto(p.id);
                        setTaggingMode(false);
                        setTagCoords(null);
                        setTagSearchQuery('');
                      }}
                      className={`w-10 h-10 rounded overflow-hidden flex-shrink-0 cursor-pointer border-2 transition ${
                        idx === safeIndex 
                          ? 'border-[#3869A0] ring-2 ring-blue-300 scale-105' 
                          : 'border-transparent opacity-60 hover:opacity-100'
                      }`}
                      title={p.titulo || `Foto ${idx + 1}`}
                    >
                      <img src={p.archivo} alt="" className="w-full h-full object-cover" />
                    </div>
                  ))}
                </div>
              )}
            </div>
          </aside>
        )}
      </div>

      {/* ================= PRIVACY EDIT MODAL FOR UPLOADER ================= */}
      {showPrivacyModal && (
        <div className="fixed inset-0 z-60 bg-black/70 backdrop-blur-xs flex items-center justify-center p-3 animate-fade-in text-gray-900">
          <div className="bg-white rounded-lg border border-gray-300 max-w-lg w-full p-4 sm:p-5 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-2.5 border-b border-gray-200">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-[#3869A0]" />
                <h3 className="font-bold text-sm text-gray-900">Editar Privacidad de la Foto</h3>
              </div>
              <button
                onClick={() => setShowPrivacyModal(false)}
                className="text-gray-400 hover:text-gray-700 text-lg font-bold cursor-pointer"
              >
                ×
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <p className="text-gray-600">
                Selecciona quién puede ver esta foto en tu galería y en el feed de Inkorium:
              </p>

              {/* 3 Privacy choices */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setEditPrivacy('amigos')}
                  className={`p-2.5 rounded-lg border text-left transition cursor-pointer flex flex-col justify-between ${
                    editPrivacy === 'amigos'
                      ? 'border-[#3869A0] bg-blue-50/80 ring-1 ring-[#3869A0]'
                      : 'border-gray-200 bg-gray-50 hover:bg-gray-100'
                  }`}
                >
                  <div className="flex items-center gap-1.5 font-bold text-gray-900 mb-1">
                    <Users className="w-3.5 h-3.5 text-[#3869A0]" />
                    <span>Solo amigos</span>
                  </div>
                  <p className="text-[10px] text-gray-500">Tus amigos en Inkorium.</p>
                </button>

                <button
                  type="button"
                  onClick={() => setEditPrivacy('publica')}
                  className={`p-2.5 rounded-lg border text-left transition cursor-pointer flex flex-col justify-between ${
                    editPrivacy === 'publica'
                      ? 'border-[#3869A0] bg-blue-50/80 ring-1 ring-[#3869A0]'
                      : 'border-gray-200 bg-gray-50 hover:bg-gray-100'
                  }`}
                >
                  <div className="flex items-center gap-1.5 font-bold text-gray-900 mb-1">
                    <Globe className="w-3.5 h-3.5 text-[#3869A0]" />
                    <span>Pública</span>
                  </div>
                  <p className="text-[10px] text-gray-500">Cualquiera en la red.</p>
                </button>

                <button
                  type="button"
                  onClick={() => setEditPrivacy('eleccion')}
                  className={`p-2.5 rounded-lg border text-left transition cursor-pointer flex flex-col justify-between ${
                    editPrivacy === 'eleccion'
                      ? 'border-[#3869A0] bg-blue-50/80 ring-1 ring-[#3869A0]'
                      : 'border-gray-200 bg-gray-50 hover:bg-gray-100'
                  }`}
                >
                  <div className="flex items-center gap-1.5 font-bold text-gray-900 mb-1">
                    <UserCheck className="w-3.5 h-3.5 text-[#3869A0]" />
                    <span>Elección</span>
                  </div>
                  <p className="text-[10px] text-gray-500">Personas específicas.</p>
                </button>
              </div>

              {/* Friend Picker for Elección */}
              {editPrivacy === 'eleccion' && (
                <div className="p-3 bg-blue-50/50 rounded-lg border border-blue-200 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-gray-800 text-[11px]">
                      Personas autorizadas ({editAllowedUsers.length}):
                    </span>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setEditAllowedUsers(myFriends.map(f => f.id))}
                        className="text-[10px] text-[#3869A0] hover:underline font-bold cursor-pointer"
                      >
                        Todos
                      </button>
                      <span className="text-gray-300">|</span>
                      <button
                        type="button"
                        onClick={() => setEditAllowedUsers([])}
                        className="text-[10px] text-gray-500 hover:text-gray-800 font-semibold cursor-pointer"
                      >
                        Ninguno
                      </button>
                    </div>
                  </div>

                  <div className="relative">
                    <Search className="w-3.5 h-3.5 text-gray-400 absolute left-2 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      placeholder="Buscar amigo..."
                      value={privacySearchQuery}
                      onChange={e => setPrivacySearchQuery(e.target.value)}
                      className="w-full pl-7 pr-2 py-1 bg-white border border-gray-300 rounded text-xs focus:outline-none focus:border-[#3869A0]"
                    />
                  </div>

                  <div className="max-h-36 overflow-y-auto divide-y divide-gray-100 bg-white rounded border border-gray-200">
                    {filteredPrivacyFriends.map(friend => {
                      const isSelected = editAllowedUsers.includes(friend.id);
                      return (
                        <div
                          key={friend.id}
                          onClick={() => toggleEditAllowedUser(friend.id)}
                          className={`flex items-center justify-between p-1.5 hover:bg-blue-50/50 cursor-pointer transition ${
                            isSelected ? 'bg-blue-50 font-semibold' : ''
                          }`}
                        >
                          <div className="flex items-center gap-2 truncate">
                            <div className="w-5 h-5 rounded-full overflow-hidden bg-gray-200 flex-shrink-0">
                              {friend.avatar ? (
                                <img src={friend.avatar} alt="" className="w-full h-full object-cover" />
                              ) : (
                                <span className="text-[10px] flex items-center justify-center font-bold">
                                  {friend.nombre.charAt(0)}
                                </span>
                              )}
                            </div>
                            <span className="text-xs text-gray-800 truncate">
                              {friend.nombre} {friend.apellidos}
                            </span>
                          </div>
                          {isSelected ? (
                            <CheckSquare className="w-3.5 h-3.5 text-[#3869A0]" />
                          ) : (
                            <Square className="w-3.5 h-3.5 text-gray-300" />
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-gray-200">
              <button
                type="button"
                onClick={() => setShowPrivacyModal(false)}
                className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded text-xs font-semibold cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleSavePrivacy}
                disabled={editPrivacy === 'eleccion' && editAllowedUsers.length === 0}
                className="px-4 py-1.5 bg-[#3869A0] hover:bg-[#2c537f] text-white rounded text-xs font-bold transition disabled:opacity-50 cursor-pointer flex items-center gap-1.5"
              >
                <Check className="w-3.5 h-3.5" />
                <span>Guardar cambios</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
