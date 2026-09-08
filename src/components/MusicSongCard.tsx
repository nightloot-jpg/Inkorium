import React, { useState } from 'react';
import { useInkorium } from '../context/InkoriumContext';
import { 
  Play, Pause, Heart, Plus, Share2, ExternalLink, 
  Check, MoreHorizontal, Music, Radio, Disc, Send
} from 'lucide-react';
import { Track, SocialPlaylist } from '../types';

interface MusicSongCardProps {
  track: Track;
  playlists?: SocialPlaylist[];
  onAddToPlaylist?: (track: Track, playlistId: string) => void;
  onOpenAddModal?: (track: Track) => void;
  layout?: 'grid' | 'list' | 'compact';
}

export const MusicSongCard: React.FC<MusicSongCardProps> = ({
  track,
  playlists = [],
  onAddToPlaylist,
  onOpenAddModal,
  layout = 'grid'
}) => {
  const {
    currentTrack,
    isMusicPlaying,
    playTrack,
    togglePlayMusic,
    updateUserData,
    currentUser,
    shareTrackToFeed
  } = useInkorium();

  const [showPlaylistMenu, setShowPlaylistMenu] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isProfileSuccess, setIsProfileSuccess] = useState(false);
  const [isSharedToWall, setIsSharedToWall] = useState(false);

  const isCurrent = currentTrack?.id === track.id || 
    (currentTrack?.youtubeId && track.youtubeId && currentTrack.youtubeId === track.youtubeId);
  const isPlaying = isCurrent && isMusicPlaying;

  const formatDuration = (seconds?: number) => {
    if (!seconds || isNaN(seconds)) return '3:30';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  const handlePlayClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isCurrent) {
      togglePlayMusic();
    } else {
      playTrack(track);
    }
  };

  const handleSetProfileSong = (e: React.MouseEvent) => {
    e.stopPropagation();
    const songString = `${track.title} - ${track.artist}`;
    updateUserData({ musica: songString });
    setIsProfileSuccess(true);
    setTimeout(() => setIsProfileSuccess(false), 2500);
  };

  const handleShareToWall = (e: React.MouseEvent) => {
    e.stopPropagation();
    shareTrackToFeed(track);
    setIsSharedToWall(true);
    setTimeout(() => setIsSharedToWall(false), 3000);
  };

  const handleShareLink = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard?.writeText(`${window.location.origin}/#musica?song=${encodeURIComponent(track.title)}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (layout === 'list') {
    return (
      <div 
        onClick={() => playTrack(track)}
        className={`group p-2 sm:p-2.5 rounded border transition flex items-center gap-3 cursor-pointer ${
          isCurrent 
            ? 'bg-blue-50/90 dark:bg-blue-950/40 border-[#3869A0] dark:border-blue-700 shadow-xs' 
            : 'bg-white dark:bg-slate-900 border-[#ccd5df] dark:border-slate-800 hover:border-[#3869A0]/50 hover:bg-slate-50 dark:hover:bg-slate-800/80'
        }`}
      >
        {/* Cover with Play Overlay */}
        <div className="relative w-12 h-12 rounded overflow-hidden bg-slate-800 flex-shrink-0 border border-gray-200 dark:border-slate-700">
          <img 
            src={track.coverUrl || 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=300&auto=format&fit=crop&q=80'} 
            alt={track.title} 
            className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
          />
          <button
            onClick={handlePlayClick}
            className={`absolute inset-0 flex items-center justify-center transition cursor-pointer ${
              isPlaying 
                ? 'bg-black/50 text-white' 
                : 'bg-black/30 group-hover:bg-black/50 text-white opacity-90 group-hover:opacity-100'
            }`}
          >
            {isPlaying ? (
              <Pause className="w-5 h-5 fill-current" />
            ) : (
              <Play className="w-5 h-5 fill-current ml-0.5" />
            )}
          </button>
        </div>

        {/* Track Title & Artist */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <h4 className={`text-xs font-bold truncate ${isCurrent ? 'text-[#3869A0] dark:text-blue-400' : 'text-gray-900 dark:text-gray-100 group-hover:text-[#3869A0]'}`}>
              {track.title}
            </h4>
            {track.genre && (
              <span className="hidden md:inline-block text-[9px] bg-gray-100 dark:bg-slate-800 text-gray-500 dark:text-gray-400 px-1.5 py-0.5 rounded border border-gray-200 dark:border-slate-700">
                {track.genre}
              </span>
            )}
          </div>
          <p className="text-[11px] text-gray-500 dark:text-gray-400 truncate">
            {track.artist}
            {track.album && <span className="text-gray-400 dark:text-gray-500"> • {track.album}</span>}
          </p>
        </div>

        {/* Duration */}
        <div className="hidden sm:block text-[11px] font-mono text-gray-400 dark:text-gray-500">
          {formatDuration(track.duration)}
        </div>

        {/* Social Actions */}
        <div className="flex items-center gap-1">
          {/* Share to Wall Button */}
          <button
            onClick={handleShareToWall}
            className={`px-2 py-1 rounded text-[11px] font-medium flex items-center gap-1 transition cursor-pointer ${
              isSharedToWall
                ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800'
                : 'text-gray-600 dark:text-gray-300 hover:text-[#3869A0] hover:bg-blue-50 dark:hover:bg-slate-800 border border-transparent'
            }`}
            title="Compartir canción en mi muro"
          >
            {isSharedToWall ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-500" />
                <span className="text-[10px] font-bold">¡Publicado!</span>
              </>
            ) : (
              <>
                <Share2 className="w-3.5 h-3.5" />
                <span className="hidden lg:inline text-[10px]">Compartir en mi muro</span>
              </>
            )}
          </button>

          <button
            onClick={handleSetProfileSong}
            className={`p-1.5 rounded transition cursor-pointer ${
              isProfileSuccess 
                ? 'text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40' 
                : 'text-gray-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30'
            }`}
            title="Poner en mi perfil"
          >
            {isProfileSuccess ? <Check className="w-3.5 h-3.5" /> : <Heart className="w-3.5 h-3.5" />}
          </button>

          <button
            onClick={(e) => {
              e.stopPropagation();
              if (onOpenAddModal) {
                onOpenAddModal(track);
              } else {
                setShowPlaylistMenu(!showPlaylistMenu);
              }
            }}
            className="p-1.5 text-gray-400 hover:text-[#3869A0] hover:bg-blue-50 dark:hover:bg-blue-950/30 rounded transition cursor-pointer"
            title="Añadir a playlist"
          >
            <Plus className="w-3.5 h-3.5" />
          </button>

          {track.youtubeUrl && (
            <a
              href={track.youtubeUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={e => e.stopPropagation()}
              className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 rounded transition"
              title="Ver en YouTube"
            >
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          )}
        </div>
      </div>
    );
  }

  // Default: Grid Card (Visual, compact, Tuenti styled)
  return (
    <div 
      onClick={() => playTrack(track)}
      className={`group rounded border transition-all cursor-pointer flex flex-col justify-between overflow-hidden ${
        isCurrent
          ? 'bg-blue-50/70 dark:bg-blue-950/40 border-[#3869A0] dark:border-blue-600 shadow-xs'
          : 'bg-white dark:bg-slate-900 border-[#ccd5df] dark:border-slate-800 hover:border-[#3869A0]/70 hover:shadow-xs'
      }`}
    >
      {/* Cover Image */}
      <div className="relative aspect-square w-full bg-slate-900 overflow-hidden">
        <img 
          src={track.coverUrl || 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=500&auto=format&fit=crop&q=80'} 
          alt={track.title} 
          className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
        />

        {/* Play Button Overlay */}
        <button
          onClick={handlePlayClick}
          className={`absolute inset-0 flex items-center justify-center transition cursor-pointer ${
            isPlaying 
              ? 'bg-black/40 text-white' 
              : 'bg-black/20 group-hover:bg-black/45 opacity-0 group-hover:opacity-100 text-white'
          }`}
        >
          <div className={`w-10 h-10 rounded-full flex items-center justify-center shadow-lg transition-transform active:scale-95 ${
            isPlaying ? 'bg-[#3869A0] text-white' : 'bg-white text-[#3869A0] hover:scale-110'
          }`}>
            {isPlaying ? (
              <Pause className="w-5 h-5 fill-current" />
            ) : (
              <Play className="w-5 h-5 fill-current ml-0.5" />
            )}
          </div>
        </button>

        {/* Duration Badge */}
        <span className="absolute bottom-1.5 right-1.5 bg-black/80 backdrop-blur-xs text-white text-[10px] font-mono px-1.5 py-0.5 rounded">
          {formatDuration(track.duration)}
        </span>

        {/* Genre Pill */}
        {track.genre && (
          <span className="absolute top-1.5 left-1.5 bg-[#3869A0]/90 text-white text-[9px] font-bold px-1.5 py-0.5 rounded tracking-wide">
            {track.genre}
          </span>
        )}
      </div>

      {/* Info & Metadata */}
      <div className="p-2.5 space-y-1.5">
        <div>
          <h4 className={`text-xs font-bold truncate ${isCurrent ? 'text-[#3869A0] dark:text-blue-400' : 'text-gray-900 dark:text-white group-hover:text-[#3869A0]'}`}>
            {track.title}
          </h4>
          <p className="text-[11px] text-gray-500 dark:text-gray-400 truncate">
            {track.artist}
          </p>
        </div>

        {/* Action Row */}
        <div className="flex items-center justify-between pt-1.5 border-t border-gray-100 dark:border-slate-800 text-xs">
          {/* Share to Wall Button */}
          <button
            onClick={handleShareToWall}
            className={`px-1.5 py-1 rounded text-[10px] font-semibold flex items-center gap-1 transition cursor-pointer ${
              isSharedToWall
                ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400'
                : 'text-gray-600 dark:text-gray-300 hover:text-[#3869A0] hover:bg-blue-50 dark:hover:bg-slate-800'
            }`}
            title="Compartir en mi muro (publica un mini reproductor en tu feed)"
          >
            {isSharedToWall ? (
              <>
                <Check className="w-3 h-3 text-emerald-500" />
                <span>¡Publicado!</span>
              </>
            ) : (
              <>
                <Share2 className="w-3 h-3 text-[#3869A0]" />
                <span>Mi muro</span>
              </>
            )}
          </button>

          <div className="flex items-center gap-0.5">
            <button
              onClick={handleSetProfileSong}
              className={`p-1 rounded text-[10px] font-semibold flex items-center gap-0.5 transition cursor-pointer ${
                isProfileSuccess 
                  ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400' 
                  : 'text-gray-500 dark:text-gray-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30'
              }`}
              title="Poner esta canción en tu perfil de Inkorium"
            >
              <Heart className={`w-3 h-3 ${isProfileSuccess ? 'fill-emerald-500 text-emerald-500' : ''}`} />
            </button>

            <button
              onClick={(e) => {
                e.stopPropagation();
                if (onOpenAddModal) {
                  onOpenAddModal(track);
                } else {
                  setShowPlaylistMenu(!showPlaylistMenu);
                }
              }}
              className="p-1 text-gray-400 hover:text-[#3869A0] hover:bg-blue-50 dark:hover:bg-blue-950/40 rounded transition cursor-pointer"
              title="Añadir a playlist"
            >
              <Plus className="w-3.5 h-3.5" />
            </button>

            {track.youtubeUrl && (
              <a
                href={track.youtubeUrl}
                target="_blank"
                rel="noopener noreferrer"
                onClick={e => e.stopPropagation()}
                className="p-1 text-gray-400 hover:text-red-500 rounded transition"
                title="Abrir en YouTube"
              >
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

