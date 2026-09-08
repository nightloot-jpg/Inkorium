import React, { useState } from 'react';
import { useInkorium } from '../context/InkoriumContext';
import { 
  X, Play, Pause, Heart, Share2, Plus, Clock, 
  ListMusic, User, Sparkles, Check, Disc, ExternalLink,
  Trash2, Copy, ArrowUp, ArrowDown, Users, Lock, Music
} from 'lucide-react';
import { SocialPlaylist, Track } from '../types';

interface PlaylistDetailModalProps {
  playlist: SocialPlaylist | null;
  isOpen: boolean;
  onClose: () => void;
  onOpenAddModal?: (track?: Track) => void;
}

export const PlaylistDetailModal: React.FC<PlaylistDetailModalProps> = ({
  playlist,
  isOpen,
  onClose,
  onOpenAddModal
}) => {
  const {
    currentUser,
    currentTrack,
    isMusicPlaying,
    playTrack,
    togglePlayMusic,
    updateUserData,
    playPlaylist,
    toggleLikePlaylist,
    duplicatePlaylist,
    deletePlaylist,
    removeTrackFromPlaylistById,
    reorderPlaylistTracks,
    playlists,
    sharePlaylistToFeed,
    shareTrackToFeed
  } = useInkorium();

  const [confirmDelete, setConfirmDelete] = useState(false);
  const [isSharedToWall, setIsSharedToWall] = useState(false);

  if (!isOpen || !playlist) return null;

  // Keep playlist state reactive from context
  const activePlaylist = playlists.find(p => p.id === playlist.id) || playlist;

  const isOwner = activePlaylist.creatorId === currentUser.id || activePlaylist.creatorId === 'u-me';
  const isCollaborator = Array.isArray(activePlaylist.collaborators) && activePlaylist.collaborators.includes(currentUser.id);
  const canEdit = isOwner || isCollaborator || activePlaylist.isCollaborative;
  const hasLiked = Array.isArray(activePlaylist.likes) && activePlaylist.likes.includes(currentUser.id);

  const handlePlayAll = () => {
    playPlaylist(activePlaylist, 0);
  };

  const handlePlayTrackAtIndex = (index: number) => {
    playPlaylist(activePlaylist, index);
  };

  const handleDelete = () => {
    deletePlaylist(activePlaylist.id);
    onClose();
  };

  const handleDuplicate = () => {
    duplicatePlaylist(activePlaylist.id);
  };

  const formatDuration = (seconds?: number) => {
    if (!seconds || isNaN(seconds)) return '3:30';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5">
      <div 
        className="bg-white dark:bg-slate-900 w-full max-w-3xl rounded-lg border border-[#ccd5df] dark:border-slate-800 shadow-2xl overflow-hidden flex flex-col max-h-[88vh] animate-in fade-in zoom-in-95 duration-200"
        onClick={e => e.stopPropagation()}
      >
        {/* Playlist Hero Banner */}
        <div className="relative bg-gradient-to-r from-slate-900 via-[#1e3a5f] to-[#3869A0] text-white p-4 sm:p-6">
          <button
            onClick={onClose}
            className="absolute top-3 right-3 p-1.5 bg-black/40 hover:bg-black/60 rounded-full text-white transition cursor-pointer z-10"
            title="Cerrar"
          >
            <X className="w-4 h-4" />
          </button>

          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 sm:gap-6">
            {/* Cover */}
            <div className="relative w-28 h-28 sm:w-36 sm:h-36 rounded-lg overflow-hidden bg-slate-950 border-2 border-white/20 shadow-xl flex-shrink-0">
              <img 
                src={activePlaylist.coverUrl || 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=600&auto=format&fit=crop&q=80'} 
                alt={activePlaylist.name} 
                className="w-full h-full object-cover"
              />
            </div>

            {/* Info */}
            <div className="space-y-2 text-center sm:text-left flex-1 min-w-0">
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                <span className="bg-white/20 backdrop-blur-xs text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded">
                  Playlist de Inkorium
                </span>
                {activePlaylist.category && (
                  <span className="bg-[#3869A0] text-[10px] font-semibold px-2 py-0.5 rounded">
                    {activePlaylist.category === 'tuenti_classic' ? 'Tuenti Clásico' : activePlaylist.category}
                  </span>
                )}
                {activePlaylist.isCollaborative && (
                  <span className="bg-emerald-600/80 text-white text-[10px] font-bold px-2 py-0.5 rounded flex items-center gap-1">
                    <Users className="w-3 h-3" /> Colaborativa
                  </span>
                )}
                {activePlaylist.isPrivate && (
                  <span className="bg-amber-600/80 text-white text-[10px] font-bold px-2 py-0.5 rounded flex items-center gap-1">
                    <Lock className="w-3 h-3" /> Privada
                  </span>
                )}
              </div>

              <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white line-clamp-2">
                {activePlaylist.name}
              </h2>

              {activePlaylist.description && (
                <p className="text-xs sm:text-sm text-blue-100/90 leading-relaxed line-clamp-2">
                  {activePlaylist.description}
                </p>
              )}

              {/* Creator & Stats */}
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3 text-xs text-blue-200 pt-1">
                <div className="flex items-center gap-1.5 font-semibold text-white">
                  {activePlaylist.creatorAvatar ? (
                    <img src={activePlaylist.creatorAvatar} alt="" className="w-4 h-4 rounded-full object-cover" />
                  ) : (
                    <User className="w-3.5 h-3.5" />
                  )}
                  <span>{activePlaylist.creatorName}</span>
                </div>
                <span>•</span>
                <span>{activePlaylist.tracks?.length || activePlaylist.songsCount || 0} canciones</span>
                <span>•</span>
                <span>{activePlaylist.durationFormatted || '25 min'}</span>
              </div>

              {/* Action Buttons */}
              <div className="pt-2 flex flex-wrap items-center justify-center sm:justify-start gap-2.5">
                <button
                  onClick={handlePlayAll}
                  disabled={!activePlaylist.tracks || activePlaylist.tracks.length === 0}
                  className="px-4 py-1.5 bg-white text-[#3869A0] hover:bg-blue-50 disabled:opacity-50 rounded-full font-bold text-xs sm:text-sm flex items-center gap-1.5 shadow-lg transition transform active:scale-95 cursor-pointer"
                >
                  <Play className="w-3.5 h-3.5 fill-current ml-0.5" />
                  <span>Reproducir todo</span>
                </button>

                <button
                  onClick={() => toggleLikePlaylist(activePlaylist.id)}
                  className={`px-3 py-1.5 rounded-full font-semibold text-xs flex items-center gap-1.5 transition cursor-pointer ${
                    hasLiked 
                      ? 'bg-rose-500 text-white' 
                      : 'bg-white/20 hover:bg-white/30 text-white'
                  }`}
                  title={hasLiked ? 'Ya no me gusta' : 'Me gusta'}
                >
                  <Heart className={`w-3.5 h-3.5 ${hasLiked ? 'fill-current' : ''}`} />
                  <span>{activePlaylist.likes?.length || 0}</span>
                </button>

                <button
                  onClick={handleDuplicate}
                  className="px-3 py-1.5 bg-white/20 hover:bg-white/30 text-white rounded-full font-semibold text-xs flex items-center gap-1.5 transition cursor-pointer"
                  title="Clonar a mis playlists"
                >
                  <Copy className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Clonar</span>
                </button>

                <button
                  onClick={() => {
                    sharePlaylistToFeed(activePlaylist);
                    setIsSharedToWall(true);
                    setTimeout(() => setIsSharedToWall(false), 3000);
                  }}
                  className={`px-3 py-1.5 rounded-full font-semibold text-xs flex items-center gap-1.5 transition cursor-pointer ${
                    isSharedToWall
                      ? 'bg-emerald-600 text-white font-bold'
                      : 'bg-white/20 hover:bg-white/30 text-white'
                  }`}
                  title="Compartir playlist en mi muro de Inkorium"
                >
                  {isSharedToWall ? (
                    <>
                      <Check className="w-3.5 h-3.5" />
                      <span>¡En mi muro!</span>
                    </>
                  ) : (
                    <>
                      <Share2 className="w-3.5 h-3.5" />
                      <span>Compartir en muro</span>
                    </>
                  )}
                </button>

                {canEdit && onOpenAddModal && (
                  <button
                    onClick={() => onOpenAddModal()}
                    className="px-3 py-1.5 bg-white/20 hover:bg-white/30 text-white rounded-full font-semibold text-xs flex items-center gap-1.5 transition cursor-pointer"
                    title="Añadir canciones"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Añadir temas</span>
                  </button>
                )}

                {isOwner && (
                  confirmDelete ? (
                    <div className="flex items-center gap-1 bg-red-600/90 rounded-full p-0.5 px-2">
                      <span className="text-[10px] text-white font-bold">¿Borrar?</span>
                      <button
                        onClick={handleDelete}
                        className="px-2 py-0.5 bg-white text-red-600 rounded-full text-[10px] font-bold hover:bg-red-50 cursor-pointer"
                      >
                        Sí
                      </button>
                      <button
                        onClick={() => setConfirmDelete(false)}
                        className="px-1.5 py-0.5 text-white text-[10px] hover:underline cursor-pointer"
                      >
                        No
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setConfirmDelete(true)}
                      className="p-1.5 bg-white/10 hover:bg-red-500/80 text-white/80 hover:text-white rounded-full text-xs transition cursor-pointer"
                      title="Eliminar playlist"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Tracks List */}
        <div className="flex-1 overflow-y-auto p-3 sm:p-5 space-y-1">
          <div className="flex items-center justify-between pb-2 border-b border-gray-200 dark:border-slate-800 text-[11px] font-bold text-gray-400 uppercase tracking-wider px-2">
            <div className="flex items-center gap-4">
              <span className="w-6 text-center">#</span>
              <span>Título</span>
            </div>
            <div className="flex items-center gap-4 sm:gap-6">
              <span className="hidden sm:inline">Duración</span>
              <span>Acciones</span>
            </div>
          </div>

          {activePlaylist.tracks && activePlaylist.tracks.length > 0 ? (
            activePlaylist.tracks.map((track, idx) => {
              const isCurrent = currentTrack?.id === track.id;
              const isPlaying = isCurrent && isMusicPlaying;

              return (
                <div
                  key={track.id || idx}
                  onClick={() => handlePlayTrackAtIndex(idx)}
                  className={`group p-2 rounded flex items-center justify-between transition cursor-pointer border ${
                    isCurrent
                      ? 'bg-blue-50/80 dark:bg-blue-950/40 border-[#3869A0] dark:border-blue-700'
                      : 'hover:bg-gray-50 dark:hover:bg-slate-800/60 border-transparent hover:border-gray-200 dark:hover:border-slate-800'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0 flex-1">
                    {/* Index or Play indicator */}
                    <span className="w-6 text-center font-mono text-xs text-gray-400 group-hover:hidden">
                      {idx + 1}
                    </span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        if (isCurrent) togglePlayMusic();
                        else handlePlayTrackAtIndex(idx);
                      }}
                      className="w-6 text-center hidden group-hover:flex items-center justify-center text-[#3869A0] cursor-pointer"
                    >
                      {isPlaying ? <Pause className="w-3.5 h-3.5 fill-current" /> : <Play className="w-3.5 h-3.5 fill-current" />}
                    </button>

                    <img src={track.coverUrl} alt="" className="w-9 h-9 rounded object-cover flex-shrink-0" />

                    <div className="min-w-0 flex-1">
                      <p className={`text-xs font-bold truncate ${isCurrent ? 'text-[#3869A0] dark:text-blue-400' : 'text-gray-900 dark:text-gray-100'}`}>
                        {track.title}
                      </p>
                      <p className="text-[11px] text-gray-500 dark:text-gray-400 truncate">
                        {track.artist}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 sm:gap-4">
                    <span className="hidden sm:inline text-xs font-mono text-gray-400">
                      {formatDuration(track.duration)}
                    </span>

                    <div className="flex items-center gap-1">
                      {/* Reorder Buttons (If owner/canEdit) */}
                      {canEdit && activePlaylist.tracks.length > 1 && (
                        <div className="hidden sm:flex items-center opacity-0 group-hover:opacity-100 transition">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              if (idx > 0) reorderPlaylistTracks(activePlaylist.id, idx, idx - 1);
                            }}
                            disabled={idx === 0}
                            className="p-1 text-gray-400 hover:text-[#3869A0] disabled:opacity-20 rounded transition cursor-pointer"
                            title="Subir posición"
                          >
                            <ArrowUp className="w-3 h-3" />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              if (idx < activePlaylist.tracks.length - 1) reorderPlaylistTracks(activePlaylist.id, idx, idx + 1);
                            }}
                            disabled={idx === activePlaylist.tracks.length - 1}
                            className="p-1 text-gray-400 hover:text-[#3869A0] disabled:opacity-20 rounded transition cursor-pointer"
                            title="Bajar posición"
                          >
                            <ArrowDown className="w-3 h-3" />
                          </button>
                        </div>
                      )}

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          shareTrackToFeed(track);
                        }}
                        className="p-1.5 text-gray-400 hover:text-[#3869A0] rounded transition cursor-pointer"
                        title="Compartir canción en mi muro"
                      >
                        <Share2 className="w-3.5 h-3.5" />
                      </button>

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          updateUserData({ musica: `${track.title} - ${track.artist}` });
                        }}
                        className="p-1.5 text-gray-400 hover:text-rose-500 rounded transition cursor-pointer"
                        title="Poner en mi perfil"
                      >
                        <Heart className="w-3.5 h-3.5" />
                      </button>

                      {track.youtubeUrl && (
                        <a
                          href={track.youtubeUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={e => e.stopPropagation()}
                          className="p-1.5 text-gray-400 hover:text-red-500 rounded transition"
                          title="Ver en YouTube"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                      )}

                      {/* Remove from playlist button */}
                      {canEdit && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            removeTrackFromPlaylistById(activePlaylist.id, track.id);
                          }}
                          className="p-1.5 text-gray-400 hover:text-red-600 rounded transition opacity-0 group-hover:opacity-100 cursor-pointer"
                          title="Eliminar de la playlist"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="py-12 text-center text-gray-400 text-xs space-y-2">
              <Music className="w-8 h-8 mx-auto text-gray-300 dark:text-slate-600" />
              <p>Esta playlist aún no tiene canciones agregadas.</p>
              {canEdit && onOpenAddModal && (
                <button
                  onClick={() => onOpenAddModal()}
                  className="px-3 py-1 bg-blue-50 dark:bg-blue-950/50 hover:bg-[#3869A0] hover:text-white text-[#3869A0] dark:text-blue-300 rounded font-semibold text-xs transition cursor-pointer"
                >
                  + Añadir canciones ahora
                </button>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-3 bg-gray-50 dark:bg-slate-800/50 border-t border-gray-200 dark:border-slate-800 flex items-center justify-between">
          <div className="text-[11px] text-gray-400">
            {activePlaylist.tracks?.length || 0} canciones • Creada por {activePlaylist.creatorName}
          </div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-gray-200 dark:bg-slate-700 hover:bg-gray-300 dark:hover:bg-slate-600 text-gray-800 dark:text-white rounded text-xs font-bold cursor-pointer transition"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};
