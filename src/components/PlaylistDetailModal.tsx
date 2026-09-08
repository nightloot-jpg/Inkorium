import React from 'react';
import { useInkorium } from '../context/InkoriumContext';
import { 
  X, Play, Pause, Heart, Share2, Plus, Clock, 
  ListMusic, User, Sparkles, Check, Disc, ExternalLink
} from 'lucide-react';
import { SocialPlaylist, Track } from '../types';

interface PlaylistDetailModalProps {
  playlist: SocialPlaylist | null;
  isOpen: boolean;
  onClose: () => void;
  onOpenAddModal?: (track: Track) => void;
}

export const PlaylistDetailModal: React.FC<PlaylistDetailModalProps> = ({
  playlist,
  isOpen,
  onClose,
  onOpenAddModal
}) => {
  const {
    currentTrack,
    isMusicPlaying,
    playTrack,
    togglePlayMusic,
    updateUserData
  } = useInkorium();

  if (!isOpen || !playlist) return null;

  const handlePlayAll = () => {
    if (playlist.tracks && playlist.tracks.length > 0) {
      playTrack(playlist.tracks[0]);
    }
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
            className="absolute top-3 right-3 p-1.5 bg-black/40 hover:bg-black/60 rounded-full text-white transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>

          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 sm:gap-6">
            {/* Cover */}
            <div className="relative w-28 h-28 sm:w-36 sm:h-36 rounded-lg overflow-hidden bg-slate-950 border-2 border-white/20 shadow-xl flex-shrink-0">
              <img 
                src={playlist.coverUrl} 
                alt={playlist.name} 
                className="w-full h-full object-cover"
              />
            </div>

            {/* Info */}
            <div className="space-y-2 text-center sm:text-left flex-1 min-w-0">
              <div className="flex items-center justify-center sm:justify-start gap-2">
                <span className="bg-white/20 backdrop-blur-xs text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded">
                  Playlist de Inkorium
                </span>
                {playlist.category && (
                  <span className="bg-[#3869A0] text-[10px] font-semibold px-2 py-0.5 rounded">
                    {playlist.category}
                  </span>
                )}
              </div>

              <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white line-clamp-2">
                {playlist.name}
              </h2>

              {playlist.description && (
                <p className="text-xs sm:text-sm text-blue-100/90 leading-relaxed line-clamp-2">
                  {playlist.description}
                </p>
              )}

              {/* Creator & Stats */}
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3 text-xs text-blue-200 pt-1">
                <div className="flex items-center gap-1.5 font-semibold text-white">
                  {playlist.creatorAvatar ? (
                    <img src={playlist.creatorAvatar} alt="" className="w-4 h-4 rounded-full object-cover" />
                  ) : (
                    <User className="w-3.5 h-3.5" />
                  )}
                  <span>{playlist.creatorName}</span>
                </div>
                <span>•</span>
                <span>{playlist.tracks?.length || playlist.songsCount || 0} canciones</span>
                <span>•</span>
                <span>{playlist.durationFormatted || '25 min'}</span>
              </div>

              {/* Play All Button */}
              <div className="pt-2 flex items-center justify-center sm:justify-start gap-3">
                <button
                  onClick={handlePlayAll}
                  className="px-5 py-2 bg-white text-[#3869A0] hover:bg-blue-50 rounded-full font-bold text-xs sm:text-sm flex items-center gap-2 shadow-lg transition transform active:scale-95 cursor-pointer"
                >
                  <Play className="w-4 h-4 fill-current ml-0.5" />
                  <span>Reproducir todo</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Tracks List */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-1">
          <div className="flex items-center justify-between pb-2 border-b border-gray-200 dark:border-slate-800 text-[11px] font-bold text-gray-400 uppercase tracking-wider px-2">
            <div className="flex items-center gap-4">
              <span className="w-5 text-center">#</span>
              <span>Título</span>
            </div>
            <div className="flex items-center gap-6">
              <span className="hidden sm:inline">Duración</span>
              <span>Acciones</span>
            </div>
          </div>

          {playlist.tracks && playlist.tracks.length > 0 ? (
            playlist.tracks.map((track, idx) => {
              const isCurrent = currentTrack?.id === track.id;
              const isPlaying = isCurrent && isMusicPlaying;

              return (
                <div
                  key={track.id || idx}
                  onClick={() => playTrack(track)}
                  className={`group p-2 rounded flex items-center justify-between transition cursor-pointer border ${
                    isCurrent
                      ? 'bg-blue-50/80 dark:bg-blue-950/40 border-[#3869A0] dark:border-blue-700'
                      : 'hover:bg-gray-50 dark:hover:bg-slate-800/60 border-transparent hover:border-gray-200 dark:hover:border-slate-800'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    {/* Index or Play indicator */}
                    <span className="w-5 text-center font-mono text-xs text-gray-400 group-hover:hidden">
                      {idx + 1}
                    </span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        if (isCurrent) togglePlayMusic();
                        else playTrack(track);
                      }}
                      className="w-5 text-center hidden group-hover:flex items-center justify-center text-[#3869A0] cursor-pointer"
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

                  <div className="flex items-center gap-4">
                    <span className="hidden sm:inline text-xs font-mono text-gray-400">
                      {formatDuration(track.duration)}
                    </span>

                    <div className="flex items-center gap-1">
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
                    </div>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="py-12 text-center text-gray-400 text-xs">
              Esta playlist aún no tiene canciones agregadas.
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-3 bg-gray-50 dark:bg-slate-800/50 border-t border-gray-200 dark:border-slate-800 flex justify-end">
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
