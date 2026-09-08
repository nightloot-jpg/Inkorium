import React, { useState } from 'react';
import { useInkorium } from '../context/InkoriumContext';
import { Play, ListMusic, Clock, User, Heart, Sparkles, Check, Share2 } from 'lucide-react';
import { SocialPlaylist, Track } from '../types';

interface PlaylistCardProps {
  playlist: SocialPlaylist;
  onSelectPlaylist?: (playlist: SocialPlaylist) => void;
  onPlayPlaylist?: (playlist: SocialPlaylist) => void;
}

export const PlaylistCard: React.FC<PlaylistCardProps> = ({
  playlist,
  onSelectPlaylist,
  onPlayPlaylist
}) => {
  const { playTrack, currentTrack, isMusicPlaying, sharePlaylistToFeed } = useInkorium();
  const [isSharedToWall, setIsSharedToWall] = useState(false);

  const handlePlay = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onPlayPlaylist) {
      onPlayPlaylist(playlist);
    } else if (playlist.tracks && playlist.tracks.length > 0) {
      playTrack(playlist.tracks[0]);
    }
  };

  const handleShareToWall = (e: React.MouseEvent) => {
    e.stopPropagation();
    sharePlaylistToFeed(playlist);
    setIsSharedToWall(true);
    setTimeout(() => setIsSharedToWall(false), 3000);
  };

  const isCurrentPlaylistPlaying = isMusicPlaying && playlist.tracks?.some(t => t.id === currentTrack?.id);

  return (
    <div 
      onClick={() => onSelectPlaylist && onSelectPlaylist(playlist)}
      className="group bg-white dark:bg-slate-900 rounded border border-[#ccd5df] dark:border-slate-800 hover:border-[#3869A0]/70 transition-all cursor-pointer overflow-hidden shadow-xs hover:shadow flex flex-col justify-between"
    >
      {/* Visual Cover Header */}
      <div className="relative aspect-16/10 w-full bg-slate-950 overflow-hidden">
        <img 
          src={playlist.coverUrl || 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=600&auto=format&fit=crop&q=80'} 
          alt={playlist.name} 
          className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
        />

        {/* Gradient Shadow */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

        {/* Play Button Overlay */}
        <button
          onClick={handlePlay}
          className="absolute bottom-2.5 right-2.5 w-10 h-10 rounded-full bg-[#3869A0] hover:bg-[#2c537f] text-white flex items-center justify-center shadow-lg transition-transform active:scale-95 group-hover:scale-110 cursor-pointer"
          title={`Reproducir "${playlist.name}"`}
        >
          <Play className="w-5 h-5 fill-current ml-0.5" />
        </button>

        {/* Top Badges */}
        <div className="absolute top-2 left-2 flex items-center gap-1.5">
          <span className="bg-[#3869A0]/90 backdrop-blur-xs text-white text-[9px] font-bold px-2 py-0.5 rounded flex items-center gap-1">
            <ListMusic className="w-3 h-3" />
            {playlist.songsCount || playlist.tracks?.length || 0} temas
          </span>
          {playlist.durationFormatted && (
            <span className="bg-black/60 backdrop-blur-xs text-white text-[9px] font-mono px-1.5 py-0.5 rounded">
              ⏱ {playlist.durationFormatted}
            </span>
          )}
        </div>

        {/* Category Tag */}
        {playlist.category && (
          <span className="absolute bottom-2.5 left-2 text-[10px] text-blue-200 font-semibold uppercase tracking-wider">
            {playlist.category === 'tuenti_classic' ? 'Tuenti 2000s' : playlist.category}
          </span>
        )}
      </div>

      {/* Body Metadata */}
      <div className="p-3 space-y-2 flex-1 flex flex-col justify-between">
        <div>
          <h3 className="font-bold text-xs sm:text-sm text-gray-900 dark:text-white group-hover:text-[#3869A0] transition line-clamp-1">
            {playlist.name}
          </h3>
          {playlist.description && (
            <p className="text-[11px] text-gray-500 dark:text-gray-400 line-clamp-2 mt-0.5 leading-relaxed">
              {playlist.description}
            </p>
          )}
        </div>

        {/* Action Row & Creator Info Footer */}
        <div className="pt-2 border-t border-gray-100 dark:border-slate-800 flex items-center justify-between text-[11px] text-gray-400">
          <div className="flex items-center gap-1.5 truncate">
            {playlist.creatorAvatar ? (
              <img 
                src={playlist.creatorAvatar} 
                alt={playlist.creatorName} 
                className="w-4 h-4 rounded-full object-cover border border-gray-200 dark:border-slate-700 flex-shrink-0"
              />
            ) : (
              <User className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
            )}
            <span className="truncate text-gray-600 dark:text-gray-300 font-medium">
              Por <span className="font-semibold text-gray-800 dark:text-gray-200">{playlist.creatorName}</span>
            </span>
          </div>

          <div className="flex items-center gap-1 flex-shrink-0">
            {/* Share to Wall */}
            <button
              onClick={handleShareToWall}
              className={`p-1 rounded transition cursor-pointer flex items-center gap-1 ${
                isSharedToWall
                  ? 'text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 font-bold'
                  : 'text-gray-400 hover:text-[#3869A0] hover:bg-blue-50 dark:hover:bg-slate-800'
              }`}
              title="Compartir playlist en mi muro (con reproductor de sus 4 primeros temas)"
            >
              {isSharedToWall ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-500" />
                  <span className="text-[9px] text-emerald-600 font-bold">¡En muro!</span>
                </>
              ) : (
                <Share2 className="w-3.5 h-3.5" />
              )}
            </button>

            {playlist.likes && playlist.likes.length > 0 && (
              <span className="flex items-center gap-0.5 text-[10px] text-rose-500 font-semibold pl-1">
                <Heart className="w-3 h-3 fill-current" />
                {playlist.likes.length}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

