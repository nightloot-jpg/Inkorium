import React, { useState } from 'react';
import { 
  Play, Pause, Music, Disc, ListMusic, Volume2, 
  ExternalLink, Heart, Sparkles, Youtube, Check, Radio
} from 'lucide-react';
import { Track, SocialPlaylist } from '../types';
import { useInkorium } from '../context/InkoriumContext';

interface FeedTrackMiniPlayerProps {
  track: Track;
}

export const FeedTrackMiniPlayer: React.FC<FeedTrackMiniPlayerProps> = ({ track }) => {
  const {
    currentTrack,
    isMusicPlaying,
    playTrack,
    togglePlayMusic,
    musicPosition,
    musicDuration,
    seekMusic,
    setIsMusicPlayerOpen,
    updateUserData,
    currentUser
  } = useInkorium();

  const [isSavedToProfile, setIsSavedToProfile] = useState(false);
  const [hoverSeekPercent, setHoverSeekPercent] = useState<number | null>(null);

  const isCurrent = currentTrack?.id === track.id;
  const isPlayingThis = isCurrent && isMusicPlaying;

  const handlePlayToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isCurrent) {
      togglePlayMusic();
    } else {
      playTrack(track);
    }
  };

  const handleProgressBarClick = (e: React.MouseEvent<HTMLDivElement>) => {
    e.stopPropagation();
    if (!isCurrent) {
      playTrack(track);
      return;
    }
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const width = rect.width;
    const percent = Math.max(0, Math.min(1, clickX / width));
    const effectiveDuration = musicDuration || track.duration || 180;
    const targetSeconds = percent * effectiveDuration;
    seekMusic(targetSeconds);
  };

  const handleSetProfileSong = (e: React.MouseEvent) => {
    e.stopPropagation();
    const songName = `${track.title} - ${track.artist}`;
    updateUserData({ musica: songName });
    setIsSavedToProfile(true);
    setTimeout(() => setIsSavedToProfile(false), 3000);
  };

  const formatDuration = (seconds?: number) => {
    if (!seconds || isNaN(seconds)) return '3:30';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  const effectiveDuration = isCurrent ? (musicDuration || track.duration || 180) : (track.duration || 180);
  const currentSeconds = isCurrent ? musicPosition : 0;
  const progressPercent = effectiveDuration > 0 ? (currentSeconds / effectiveDuration) * 100 : 0;

  return (
    <div className="mt-2 rounded-xl bg-gradient-to-r from-slate-900 via-[#1b3353] to-[#2a4d77] text-white p-3.5 sm:p-4 shadow-md border border-[#3869A0]/40 overflow-hidden relative group">
      {/* Background Decorative Vinyl Glow */}
      <div className="absolute -right-8 -bottom-8 w-32 h-32 bg-blue-500/10 rounded-full blur-2xl pointer-events-none" />

      <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 relative z-10">
        {/* Vinyl Disc & Cover Art */}
        <div className="relative flex-shrink-0 flex items-center justify-center">
          <div 
            onClick={handlePlayToggle}
            className="relative w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-slate-950 p-1 shadow-xl border-2 border-white/20 cursor-pointer overflow-hidden group/disc flex items-center justify-center transition-transform active:scale-95"
          >
            {/* Spinning Album Art */}
            <img 
              src={track.coverUrl || 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=300&auto=format&fit=crop&q=80'} 
              alt={track.title}
              className={`w-full h-full object-cover rounded-full ${isPlayingThis ? 'animate-[spin_5s_linear_infinite]' : ''}`}
            />
            {/* Vinyl Center Hole */}
            <div className="absolute w-4 h-4 bg-slate-950 border-2 border-white/50 rounded-full flex items-center justify-center z-10 shadow-inner">
              <div className="w-1.5 h-1.5 bg-white/70 rounded-full" />
            </div>

            {/* Hover Play/Pause Overlay */}
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/disc:opacity-100 transition-opacity rounded-full flex items-center justify-center text-white z-20">
              {isPlayingThis ? (
                <Pause className="w-6 h-6 fill-current" />
              ) : (
                <Play className="w-6 h-6 fill-current ml-0.5" />
              )}
            </div>
          </div>

          {/* Playing Animated Equalizer Wave Pill */}
          {isPlayingThis && (
            <div className="absolute -bottom-1 -right-1 bg-[#3869A0] text-white px-1.5 py-0.5 rounded-full text-[9px] font-bold flex items-center gap-0.5 shadow-lg border border-white/30">
              <span className="w-1 h-2.5 bg-white rounded-full animate-bounce [animation-delay:-0.3s]" />
              <span className="w-1 h-3.5 bg-white rounded-full animate-bounce [animation-delay:-0.15s]" />
              <span className="w-1 h-2 bg-white rounded-full animate-bounce" />
            </div>
          )}
        </div>

        {/* Track Metadata & Controls */}
        <div className="flex-1 min-w-0 space-y-1.5">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="bg-blue-400/20 text-blue-200 border border-blue-300/30 text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.2 rounded">
                  Mini Reproductor
                </span>
                {track.genre && (
                  <span className="text-[10px] text-blue-200 font-medium">
                    • {track.genre}
                  </span>
                )}
                {track.youtubeId && (
                  <span className="bg-red-500/30 text-red-200 border border-red-400/40 text-[9px] font-bold px-1.5 py-0.2 rounded flex items-center gap-0.5">
                    <Youtube className="w-2.5 h-2.5" /> YouTube
                  </span>
                )}
              </div>
              <h4 className="font-bold text-sm sm:text-base text-white truncate drop-shadow-xs mt-0.5">
                {track.title}
              </h4>
              <p className="text-xs text-blue-200 font-medium truncate">
                {track.artist} {track.album ? `— ${track.album}` : ''}
              </p>
            </div>

            {/* Play/Pause Button */}
            <button
              onClick={handlePlayToggle}
              className="w-10 h-10 rounded-full bg-white text-[#1b3353] hover:bg-blue-50 flex items-center justify-center shadow-lg transition-transform active:scale-95 flex-shrink-0 cursor-pointer"
              title={isPlayingThis ? 'Pausar' : 'Reproducir'}
            >
              {isPlayingThis ? (
                <Pause className="w-5 h-5 fill-current" />
              ) : (
                <Play className="w-5 h-5 fill-current ml-0.5" />
              )}
            </button>
          </div>

          {/* Interactive Progress Bar */}
          <div className="space-y-1 pt-1">
            <div 
              onClick={handleProgressBarClick}
              className="relative h-2 bg-black/40 hover:h-3 rounded-full overflow-hidden cursor-pointer transition-all border border-white/10"
              title={isCurrent ? "Haz clic para saltar a cualquier punto" : "Haz clic para reproducir"}
            >
              <div 
                className="absolute left-0 top-0 bottom-0 bg-gradient-to-r from-blue-400 to-cyan-300 rounded-full transition-all duration-150"
                style={{ width: `${progressPercent}%` }}
              />
            </div>

            <div className="flex items-center justify-between text-[10px] text-blue-200/90 font-mono">
              <span>{isCurrent ? formatDuration(musicPosition) : '0:00'}</span>
              <span>{formatDuration(effectiveDuration)}</span>
            </div>
          </div>

          {/* Quick Action Buttons */}
          <div className="flex items-center gap-2 pt-1 border-t border-white/10 text-xs text-blue-100 flex-wrap">
            <button
              onClick={() => setIsMusicPlayerOpen(true)}
              className="hover:text-white transition flex items-center gap-1 text-[11px] bg-white/10 hover:bg-white/20 px-2.5 py-1 rounded-md cursor-pointer"
              title="Abrir en reproductor flotante"
            >
              <Radio className="w-3 h-3 text-blue-300" />
              <span>Reproductor flotante</span>
            </button>

            <button
              onClick={handleSetProfileSong}
              className="hover:text-white transition flex items-center gap-1 text-[11px] bg-white/10 hover:bg-white/20 px-2.5 py-1 rounded-md cursor-pointer"
              title="Poner como canción de mi perfil"
            >
              {isSavedToProfile ? (
                <>
                  <Check className="w-3 h-3 text-emerald-400" />
                  <span className="text-emerald-300">¡En mi perfil!</span>
                </>
              ) : (
                <>
                  <Heart className="w-3 h-3 text-rose-400" />
                  <span>En mi perfil</span>
                </>
              )}
            </button>

            {track.youtubeUrl && (
              <a
                href={track.youtubeUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-white transition flex items-center gap-1 text-[11px] bg-red-600/30 hover:bg-red-600/50 px-2.5 py-1 rounded-md border border-red-500/30 ml-auto"
                title="Ver en YouTube"
              >
                <ExternalLink className="w-3 h-3" />
                <span className="hidden sm:inline">YouTube</span>
              </a>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

interface FeedPlaylistPlayerProps {
  playlist: SocialPlaylist;
}

export const FeedPlaylistPlayer: React.FC<FeedPlaylistPlayerProps> = ({ playlist }) => {
  const {
    currentTrack,
    isMusicPlaying,
    playTrack,
    playPlaylist,
    togglePlayMusic,
    setActiveTab,
    setIsMusicPlayerOpen
  } = useInkorium();

  const allTracks = playlist.tracks || [];
  // Per user request: up to the first 4 songs of the playlist
  const previewTracks = allTracks.slice(0, 4);
  const remainingCount = Math.max(0, allTracks.length - 4);

  const isCurrentPlaylistPlaying = isMusicPlaying && allTracks.some(t => t.id === currentTrack?.id);

  const handlePlayFullPlaylist = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (allTracks.length > 0) {
      playPlaylist(playlist, 0);
    }
  };

  const handlePlayTrackAtIndex = (e: React.MouseEvent, index: number) => {
    e.stopPropagation();
    playPlaylist(playlist, index);
  };

  const formatDuration = (seconds?: number) => {
    if (!seconds || isNaN(seconds)) return '3:30';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  return (
    <div className="mt-2 rounded-xl bg-white dark:bg-slate-900 border border-[#ccd5df] dark:border-slate-800 shadow-sm overflow-hidden flex flex-col">
      {/* Playlist Header Banner */}
      <div className="relative bg-gradient-to-r from-slate-900 via-[#1b3353] to-[#3869A0] text-white p-3 sm:p-4">
        <div className="flex items-center gap-3">
          {/* Cover */}
          <div className="relative w-14 h-14 sm:w-16 sm:h-16 rounded-lg overflow-hidden bg-slate-950 border border-white/20 shadow-md flex-shrink-0">
            <img 
              src={playlist.coverUrl || 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=600&auto=format&fit=crop&q=80'} 
              alt={playlist.name} 
              className="w-full h-full object-cover"
            />
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="bg-white/20 backdrop-blur-xs text-white text-[9px] font-bold px-2 py-0.5 rounded flex items-center gap-1">
                <ListMusic className="w-3 h-3" />
                Playlist • {allTracks.length} temas
              </span>
              {playlist.category && (
                <span className="text-[10px] text-blue-200 font-semibold uppercase tracking-wider">
                  {playlist.category === 'tuenti_classic' ? 'Tuenti 2000s' : playlist.category}
                </span>
              )}
            </div>

            <h4 className="font-bold text-sm sm:text-base text-white truncate drop-shadow-xs mt-0.5">
              {playlist.name}
            </h4>
            <p className="text-[11px] text-blue-200 truncate">
              Por <span className="font-semibold text-white">{playlist.creatorName}</span>
              {playlist.durationFormatted ? ` • ${playlist.durationFormatted}` : ''}
            </p>
          </div>

          {/* Play All Button */}
          <button
            onClick={handlePlayFullPlaylist}
            disabled={allTracks.length === 0}
            className="px-3.5 py-1.5 sm:px-4 sm:py-2 bg-white text-[#1b3353] hover:bg-blue-50 disabled:opacity-50 rounded-full font-bold text-xs flex items-center gap-1.5 shadow-lg transition-transform active:scale-95 flex-shrink-0 cursor-pointer"
            title="Reproducir playlist completa"
          >
            <Play className="w-3.5 h-3.5 fill-current ml-0.5" />
            <span className="hidden sm:inline">Reproducir</span>
          </button>
        </div>
      </div>

      {/* Track List Preview (Up to 4 songs) */}
      <div className="divide-y divide-gray-100 dark:divide-slate-800 bg-gray-50/50 dark:bg-slate-900/50">
        {previewTracks.length === 0 ? (
          <div className="p-4 text-center text-xs text-gray-400">
            Esta playlist aún no tiene canciones.
          </div>
        ) : (
          previewTracks.map((track, idx) => {
            const isPlayingThisTrack = currentTrack?.id === track.id && isMusicPlaying;
            const isCurrentTrackPaused = currentTrack?.id === track.id && !isMusicPlaying;

            return (
              <div
                key={track.id || idx}
                onClick={(e) => handlePlayTrackAtIndex(e, idx)}
                className={`p-2.5 sm:px-3.5 flex items-center justify-between gap-2.5 transition cursor-pointer group ${
                  isPlayingThisTrack 
                    ? 'bg-blue-50 dark:bg-blue-950/40 text-[#3869A0] dark:text-blue-300 font-semibold' 
                    : 'hover:bg-white dark:hover:bg-slate-800/80 text-gray-700 dark:text-gray-200'
                }`}
              >
                {/* Index / Play Icon */}
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-6 h-6 rounded flex items-center justify-center text-xs font-mono flex-shrink-0 text-gray-400 group-hover:text-[#3869A0]">
                    {isPlayingThisTrack ? (
                      <div className="flex items-end gap-0.5 h-3.5">
                        <span className="w-1 bg-[#3869A0] rounded-full animate-bounce [animation-delay:-0.3s] h-2" />
                        <span className="w-1 bg-[#3869A0] rounded-full animate-bounce [animation-delay:-0.15s] h-3.5" />
                        <span className="w-1 bg-[#3869A0] rounded-full animate-bounce h-2.5" />
                      </div>
                    ) : (
                      <span className="group-hover:hidden">{idx + 1}</span>
                    )}
                    {!isPlayingThisTrack && (
                      <Play className="w-3.5 h-3.5 hidden group-hover:block fill-current ml-0.5" />
                    )}
                  </div>

                  {/* Track Mini Thumbnail */}
                  <img 
                    src={track.coverUrl || 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=100&auto=format&fit=crop&q=80'} 
                    alt="" 
                    className="w-8 h-8 rounded object-cover border border-gray-200 dark:border-slate-700 flex-shrink-0"
                  />

                  {/* Title & Artist */}
                  <div className="min-w-0">
                    <p className={`text-xs truncate ${isPlayingThisTrack ? 'font-bold text-[#3869A0] dark:text-blue-300' : 'text-gray-900 dark:text-white'}`}>
                      {track.title}
                    </p>
                    <p className="text-[10px] text-gray-500 dark:text-gray-400 truncate">
                      {track.artist}
                    </p>
                  </div>
                </div>

                {/* Duration & Play Button */}
                <div className="flex items-center gap-2 flex-shrink-0 text-[11px] font-mono text-gray-400">
                  <span>{formatDuration(track.duration)}</span>
                  <button
                    onClick={(e) => handlePlayTrackAtIndex(e, idx)}
                    className="p-1 rounded-full text-gray-400 hover:text-[#3869A0] transition cursor-pointer"
                    title={`Reproducir "${track.title}"`}
                  >
                    {isPlayingThisTrack ? (
                      <Pause className="w-3.5 h-3.5 fill-current text-[#3869A0]" />
                    ) : (
                      <Play className="w-3.5 h-3.5" />
                    )}
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Footer Banner for Additional Tracks */}
      <div className="p-2.5 bg-gray-100 dark:bg-slate-800/80 border-t border-gray-200 dark:border-slate-800 flex items-center justify-between text-xs">
        <span className="text-[11px] text-gray-600 dark:text-gray-400 font-medium">
          {remainingCount > 0 
            ? `+${remainingCount} canciones más en esta playlist` 
            : `${allTracks.length} canciones en total`}
        </span>

        <button
          onClick={() => {
            if (setActiveTab) setActiveTab('musica');
          }}
          className="text-[11px] font-bold text-[#3869A0] hover:text-[#2c537f] dark:text-blue-400 dark:hover:text-blue-300 flex items-center gap-1 transition cursor-pointer"
        >
          <span>Ver en Inkorium Música</span>
          <ExternalLink className="w-3 h-3" />
        </button>
      </div>
    </div>
  );
};
