import React, { useState, useEffect, useRef } from 'react';
import { useInkorium } from '../context/InkoriumContext';
import { 
  Play, Pause, SkipForward, SkipBack, Shuffle, Repeat, Repeat1, 
  Volume2, Volume1, VolumeX, ListMusic, Music, X, Minimize2, 
  Maximize2, Plus, Trash2, Search, Sparkles, Disc, Radio, ExternalLink,
  ChevronUp, ChevronDown, Share2, Heart, Check
} from 'lucide-react';
import { Track } from '../types';
import { musicAudioEngine } from '../utils/audioEngine';

export const FloatingMusicPlayer: React.FC = () => {
  const {
    currentUser,
    currentTrack,
    isMusicPlaying,
    musicPosition,
    musicDuration,
    musicVolume,
    isMusicMuted,
    isMusicShuffled,
    musicRepeatMode,
    musicPlaylist,
    isMusicPlayerOpen,
    isMusicPlayerMinimized,
    playTrack,
    togglePlayMusic,
    nextTrack,
    prevTrack,
    seekMusic,
    setMusicVolume,
    toggleMusicMute,
    toggleMusicShuffle,
    toggleMusicRepeat,
    setIsMusicPlayerOpen,
    setIsMusicPlayerMinimized,
    addCustomTrack,
    removeTrackFromPlaylist,
    shareTrackToFeed,
    updateUserData
  } = useInkorium();

  const [showPlaylist, setShowPlaylist] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGenre, setSelectedGenre] = useState<string>('todos');
  const [showAddTrackModal, setShowAddTrackModal] = useState(false);
  const [isSharedToWall, setIsSharedToWall] = useState(false);
  const [isProfileSaved, setIsProfileSaved] = useState(false);

  // Form states for adding custom track
  const [newTitle, setNewTitle] = useState('');
  const [newArtist, setNewArtist] = useState('');
  const [newGenre, setNewGenre] = useState('Pop Nostalgia');
  const [newAudioUrl, setNewAudioUrl] = useState('');
  const [newCoverUrl, setNewCoverUrl] = useState('');

  // Canvas visualizer ref
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  // Format seconds to mm:ss
  const formatTime = (seconds: number) => {
    if (isNaN(seconds) || seconds < 0) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  // Derive the active track: currently loaded track, user profile song, or first track in playlist
  const activeTrack = currentTrack || (currentUser?.musica ? musicPlaylist.find(t => `${t.title} - ${t.artist}` === currentUser.musica || currentUser.musica?.toLowerCase().includes(t.title.toLowerCase())) : null) || musicPlaylist[0];

  // Interactive Progress Bar Ref & States
  const progressBarRef = useRef<HTMLDivElement | null>(null);
  const miniProgressBarRef = useRef<HTMLDivElement | null>(null);
  const [isScrubbing, setIsScrubbing] = useState(false);
  const [scrubTime, setScrubTime] = useState<number | null>(null);
  const [hoverTime, setHoverTime] = useState<number | null>(null);
  const [hoverPercent, setHoverPercent] = useState<number | null>(null);

  // Calculate seek time from MouseEvent or TouchEvent coordinates
  const calculateTimeFromEvent = (clientX: number, targetRect: DOMRect, duration: number) => {
    const offsetX = Math.max(0, Math.min(clientX - targetRect.left, targetRect.width));
    const percent = targetRect.width > 0 ? offsetX / targetRect.width : 0;
    const targetSeconds = percent * duration;
    return { targetSeconds, percent: percent * 100 };
  };

  const handleSeekStart = (e: React.MouseEvent<HTMLDivElement> | React.TouchEvent<HTMLDivElement>) => {
    if (!progressBarRef.current) return;
    const duration = musicDuration || activeTrack?.duration || 180;
    const rect = progressBarRef.current.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const { targetSeconds, percent } = calculateTimeFromEvent(clientX, rect, duration);
    
    setIsScrubbing(true);
    setScrubTime(targetSeconds);
    setHoverPercent(percent);
    setHoverTime(targetSeconds);
    seekMusic(targetSeconds);
  };

  const handleMouseMoveBar = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!progressBarRef.current) return;
    const duration = musicDuration || activeTrack?.duration || 180;
    const rect = progressBarRef.current.getBoundingClientRect();
    const { targetSeconds, percent } = calculateTimeFromEvent(e.clientX, rect, duration);
    setHoverTime(targetSeconds);
    setHoverPercent(percent);

    if (isScrubbing) {
      setScrubTime(targetSeconds);
      seekMusic(targetSeconds);
    }
  };

  const handleMouseLeaveBar = () => {
    if (!isScrubbing) {
      setHoverTime(null);
      setHoverPercent(null);
    }
  };

  // Mini-player progress bar click
  const handleMiniSeekClick = (e: React.MouseEvent<HTMLDivElement>) => {
    e.stopPropagation();
    if (!miniProgressBarRef.current) return;
    const duration = musicDuration || activeTrack?.duration || 180;
    const rect = miniProgressBarRef.current.getBoundingClientRect();
    const { targetSeconds } = calculateTimeFromEvent(e.clientX, rect, duration);
    seekMusic(targetSeconds);
  };

  // Global listeners for mouseup / touchend when scrubbing
  useEffect(() => {
    if (!isScrubbing) return;

    const handleGlobalMove = (e: MouseEvent | TouchEvent) => {
      if (!progressBarRef.current) return;
      const duration = musicDuration || activeTrack?.duration || 180;
      const rect = progressBarRef.current.getBoundingClientRect();
      const clientX = 'touches' in e ? (e as TouchEvent).touches[0].clientX : (e as MouseEvent).clientX;
      const { targetSeconds, percent } = calculateTimeFromEvent(clientX, rect, duration);
      setScrubTime(targetSeconds);
      setHoverTime(targetSeconds);
      setHoverPercent(percent);
      seekMusic(targetSeconds);
    };

    const handleGlobalEnd = () => {
      setIsScrubbing(false);
      setScrubTime(null);
      setHoverTime(null);
      setHoverPercent(null);
    };

    window.addEventListener('mousemove', handleGlobalMove);
    window.addEventListener('mouseup', handleGlobalEnd);
    window.addEventListener('touchmove', handleGlobalMove);
    window.addEventListener('touchend', handleGlobalEnd);

    return () => {
      window.removeEventListener('mousemove', handleGlobalMove);
      window.removeEventListener('mouseup', handleGlobalEnd);
      window.removeEventListener('touchmove', handleGlobalMove);
      window.removeEventListener('touchend', handleGlobalEnd);
    };
  }, [isScrubbing, musicDuration, activeTrack?.duration, seekMusic]);

  // Auto-sync current track if opened without an active track
  useEffect(() => {
    if (isMusicPlayerOpen && !currentTrack && activeTrack) {
      playTrack(activeTrack, !isMusicPlayerMinimized);
    }
  }, [isMusicPlayerOpen, currentTrack, activeTrack, playTrack, isMusicPlayerMinimized]);

  // Real-time Canvas Equalizer Visualizer
  useEffect(() => {
    if (!isMusicPlayerOpen || isMusicPlayerMinimized || showPlaylist) {
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
      return;
    }

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const renderVisualizer = () => {
      animationFrameRef.current = requestAnimationFrame(renderVisualizer);
      const width = canvas.width;
      const height = canvas.height;
      ctx.clearRect(0, 0, width, height);

      const freqData = musicAudioEngine.getFrequencyData();
      const numBars = 24;
      const barWidth = (width / numBars) - 2;

      for (let i = 0; i < numBars; i++) {
        let barHeight = 4;
        if (isMusicPlaying) {
          const rawVal = freqData[i % freqData.length] || 0;
          // Add rhythmic pulse if audio data is low/synthesized
          const pulse = Math.sin(Date.now() / 150 + i) * 6;
          barHeight = Math.max(4, (rawVal / 255) * (height - 6) + (rawVal > 10 ? pulse : 2));
        }

        const x = i * (barWidth + 2);
        const y = height - barHeight;

        // Gradient color for bars
        const grad = ctx.createLinearGradient(0, height, 0, 0);
        grad.addColorStop(0, '#3869A0');
        grad.addColorStop(0.6, '#60a5fa');
        grad.addColorStop(1, '#93c5fd');

        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.roundRect(x, y, barWidth, barHeight, [2, 2, 0, 0]);
        ctx.fill();
      }
    };

    renderVisualizer();

    return () => {
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
    };
  }, [isMusicPlayerOpen, isMusicPlayerMinimized, showPlaylist, isMusicPlaying]);

  if (!isMusicPlayerOpen) return null;

  const isYouTubeTrack = !!activeTrack?.youtubeId;

  // Filtered playlist
  const filteredPlaylist = musicPlaylist.filter(track => {
    const matchesSearch = track.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          track.artist.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesGenre = selectedGenre === 'todos' || track.genre === selectedGenre;
    return matchesSearch && matchesGenre;
  });

  const allGenres = Array.from(new Set(musicPlaylist.map(t => t.genre).filter(Boolean))) as string[];

  const handleAddTrack = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newArtist.trim()) return;

    addCustomTrack({
      title: newTitle.trim(),
      artist: newArtist.trim(),
      genre: newGenre,
      duration: 180,
      audioUrl: newAudioUrl.trim() || undefined,
      coverUrl: newCoverUrl.trim() || 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=600&auto=format&fit=crop&q=80',
      synthStyle: 'retro_pop'
    });

    setNewTitle('');
    setNewArtist('');
    setNewAudioUrl('');
    setNewCoverUrl('');
    setShowAddTrackModal(false);
  };

  const handleTogglePlay = () => {
    if (!currentTrack && activeTrack) {
      playTrack(activeTrack, true);
    } else {
      togglePlayMusic();
    }
  };

  // ==============================================================
  // ACTIVE BACKGROUND AUDIO ENGINE (Unthrottled YouTube Stream)
  // ==============================================================
  const youtubeAudioEngineNode = isYouTubeTrack && activeTrack?.youtubeId && isMusicPlaying ? (
    <div 
      style={{
        position: 'fixed',
        bottom: '-9999px',
        right: '-9999px',
        width: '200px',
        height: '200px',
        opacity: 0.001,
        pointerEvents: 'none',
        zIndex: -9999
      }}
      aria-hidden="true"
    >
      <iframe
        key={`yt-audio-floating-${activeTrack.youtubeId}`}
        src={`https://www.youtube-nocookie.com/embed/${activeTrack.youtubeId}?autoplay=1&enablejsapi=1&rel=0`}
        title={activeTrack.title}
        allow="autoplay; encrypted-media"
        style={{ width: '100%', height: '100%', border: 'none' }}
      />
    </div>
  ) : null;

  // ==============================================================
  // MINIMIZED FLOATING PILL / MINI-PLAYER
  // ==============================================================
  if (isMusicPlayerMinimized) {
    const activeTrack = currentTrack || musicPlaylist[0];
    const effectiveDuration = musicDuration || activeTrack?.duration || 180;
    const currentSeconds = isScrubbing && scrubTime !== null ? scrubTime : musicPosition;
    const progressPercent = effectiveDuration > 0 ? (currentSeconds / effectiveDuration) * 100 : 0;

    return (
      <>
        {youtubeAudioEngineNode}
        <div className="fixed bottom-12 left-4 z-50 flex items-center gap-2 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border border-[#ccd5df] dark:border-slate-700 shadow-xl rounded-full px-3 py-1.5 transition-all duration-300 animate-in fade-in slide-in-from-bottom-3 hover:shadow-2xl select-none group overflow-hidden">
          {/* Interactive Bottom Progress Track */}
          <div 
            ref={miniProgressBarRef}
            onClick={handleMiniSeekClick}
            className="absolute bottom-0 left-0 right-0 h-1 bg-gray-200/60 dark:bg-slate-800/80 cursor-pointer hover:h-2 transition-all group/minibar"
            title="Clic para saltar en la canción"
          >
            <div 
              className="h-full bg-[#3869A0] dark:bg-blue-400 transition-all duration-150 group-hover/minibar:bg-blue-500"
              style={{ width: `${Math.min(100, Math.max(0, progressPercent))}%` }}
            />
          </div>

          {/* Spinning Vinyl Cover */}
          <div 
            onClick={() => setIsMusicPlayerMinimized(false)}
            className="relative w-8 h-8 rounded-full overflow-hidden flex-shrink-0 cursor-pointer border border-[#3869A0]/40 shadow-xs group-hover:scale-105 transition-transform"
            title="Clic para expandir reproductor completo"
          >
            <img 
              src={activeTrack?.coverUrl || 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=300&auto=format&fit=crop&q=80'} 
              alt={activeTrack?.title} 
              className={`w-full h-full object-cover ${isMusicPlaying ? 'animate-spin' : ''}`}
              style={{ animationDuration: '6s' }}
            />
            <div className="absolute inset-0 m-auto w-2.5 h-2.5 rounded-full bg-white dark:bg-slate-900 border border-gray-400" />
          </div>

          {/* Info text with auto scroll */}
          <div 
            onClick={() => setIsMusicPlayerMinimized(false)}
            className="cursor-pointer max-w-[140px] sm:max-w-[180px] overflow-hidden"
            title="Clic para expandir reproductor completo"
          >
            <p className="text-xs font-bold text-gray-900 dark:text-white truncate leading-tight flex items-center gap-1">
              <Music className="w-3 h-3 text-[#3869A0] dark:text-blue-400 flex-shrink-0" />
              <span>{activeTrack?.title || 'Reproductor Inkorium'}</span>
            </p>
            <p className="text-[10px] text-gray-500 dark:text-gray-400 truncate">
              {activeTrack?.artist || 'Música retro'} {isMusicPlaying ? `• ${formatTime(currentSeconds)}` : ''}
            </p>
          </div>

          {/* Mini Controls */}
          <div className="flex items-center gap-1 pl-1 border-l border-gray-200 dark:border-slate-700">
            <button
              onClick={togglePlayMusic}
              className="p-1.5 rounded-full bg-[#3869A0] hover:bg-[#2c537f] text-white transition cursor-pointer shadow-xs"
              title={isMusicPlaying ? 'Pausar' : 'Reproducir'}
            >
              {isMusicPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5 fill-current ml-0.5" />}
            </button>

            <button
              onClick={nextTrack}
              className="p-1 rounded-full hover:bg-gray-100 dark:hover:bg-slate-800 text-gray-600 dark:text-gray-300 transition cursor-pointer"
              title="Siguiente canción"
            >
              <SkipForward className="w-3.5 h-3.5" />
            </button>

            <button
              onClick={() => setIsMusicPlayerMinimized(false)}
              className="p-1 rounded-full hover:bg-gray-100 dark:hover:bg-slate-800 text-gray-600 dark:text-gray-300 transition cursor-pointer"
              title="Expandir reproductor"
            >
              <Maximize2 className="w-3.5 h-3.5" />
            </button>

            <button
              onClick={() => setIsMusicPlayerOpen(false)}
              className="p-1 rounded-full hover:bg-red-50 dark:hover:bg-red-950/40 text-gray-400 hover:text-red-500 transition cursor-pointer"
              title="Cerrar reproductor"
            >
              <X className="w-3 h-3" />
            </button>
          </div>
        </div>
      </>
    );
  }

  // ==============================================================
  // EXPANDED HIGH-FIDELITY FLOATING MUSIC PLAYER
  // ==============================================================
  return (
    <>
      {youtubeAudioEngineNode}
      <div className="fixed bottom-12 left-4 z-50 w-[320px] sm:w-[350px] bg-white dark:bg-slate-900 border border-[#ccd5df] dark:border-slate-700 rounded-xl shadow-2xl overflow-hidden transition-all duration-300 animate-in fade-in slide-in-from-bottom-4 select-none">
      {/* Retro Header Bar */}
      <div className="bg-[#3869A0] text-white px-3 py-2 flex items-center justify-between shadow-xs">
        <div className="flex items-center gap-2">
          <div className="p-1 rounded bg-white/20 text-white">
            <Radio className="w-3.5 h-3.5" />
          </div>
          <span className="font-bold text-xs tracking-tight">Inkorium Music Player</span>
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={() => setShowPlaylist(prev => !prev)}
            className={`p-1 rounded transition cursor-pointer ${showPlaylist ? 'bg-white/30 text-white font-bold' : 'hover:bg-white/20 text-blue-100'}`}
            title={showPlaylist ? 'Ver reproductor' : 'Ver lista de canciones'}
          >
            <ListMusic className="w-4 h-4" />
          </button>

          <button
            onClick={() => setIsMusicPlayerMinimized(true)}
            className="p-1 rounded hover:bg-white/20 text-blue-100 hover:text-white transition cursor-pointer"
            title="Minimizar reproductor"
          >
            <Minimize2 className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={() => setIsMusicPlayerOpen(false)}
            className="p-1 rounded hover:bg-red-600 text-blue-100 hover:text-white transition cursor-pointer"
            title="Cerrar reproductor"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* ================= VIEW 1: PLAYLIST & LIBRARY ================= */}
      {showPlaylist ? (
        <div className="p-3 bg-gray-50 dark:bg-slate-900 flex flex-col h-[380px]">
          <div className="flex items-center justify-between pb-2 mb-2 border-b border-gray-200 dark:border-slate-800">
            <div className="flex items-center gap-1.5 font-bold text-xs text-gray-800 dark:text-white">
              <ListMusic className="w-4 h-4 text-[#3869A0] dark:text-blue-400" />
              <span>Lista de Canciones ({musicPlaylist.length})</span>
            </div>

            <button
              onClick={() => setShowAddTrackModal(true)}
              className="px-2 py-1 rounded bg-[#3869A0] hover:bg-[#2c537f] text-white text-[10px] font-bold flex items-center gap-1 transition cursor-pointer shadow-xs"
            >
              <Plus className="w-3 h-3" />
              <span>Añadir</span>
            </button>
          </div>

          {/* Search bar */}
          <div className="relative mb-2">
            <Search className="w-3.5 h-3.5 text-gray-400 absolute left-2.5 top-2.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Buscar título o artista..."
              className="w-full pl-8 pr-3 py-1.5 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded text-xs text-gray-800 dark:text-white focus:outline-none focus:border-[#3869A0]"
            />
          </div>

          {/* Genre Filter Pills */}
          <div className="flex gap-1 overflow-x-auto pb-1.5 mb-2 text-[10px] scrollbar-none">
            <button
              onClick={() => setSelectedGenre('todos')}
              className={`px-2 py-0.5 rounded-full font-semibold whitespace-nowrap transition cursor-pointer ${
                selectedGenre === 'todos' ? 'bg-[#3869A0] text-white' : 'bg-gray-200 dark:bg-slate-800 text-gray-600 dark:text-gray-300'
              }`}
            >
              Todos
            </button>
            {allGenres.map(g => (
              <button
                key={g}
                onClick={() => setSelectedGenre(g)}
                className={`px-2 py-0.5 rounded-full font-semibold whitespace-nowrap transition cursor-pointer ${
                  selectedGenre === g ? 'bg-[#3869A0] text-white' : 'bg-gray-200 dark:bg-slate-800 text-gray-600 dark:text-gray-300'
                }`}
              >
                {g}
              </button>
            ))}
          </div>

          {/* Track List */}
          <div className="flex-1 overflow-y-auto space-y-1 pr-1 divide-y divide-gray-100 dark:divide-slate-800/60">
            {filteredPlaylist.length === 0 ? (
              <div className="py-12 text-center text-gray-400 text-xs">
                No se encontraron canciones con ese filtro.
              </div>
            ) : (
              filteredPlaylist.map((track, idx) => {
                const isSelected = currentTrack?.id === track.id;
                return (
                  <div
                    key={track.id}
                    onClick={() => playTrack(track)}
                    className={`pt-1 first:pt-0 flex items-center justify-between p-1.5 rounded cursor-pointer transition group ${
                      isSelected 
                        ? 'bg-blue-50 dark:bg-blue-950/40 text-[#3869A0] dark:text-blue-300 font-semibold' 
                        : 'hover:bg-gray-100 dark:hover:bg-slate-800 text-gray-700 dark:text-gray-300'
                    }`}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="relative w-8 h-8 rounded overflow-hidden flex-shrink-0 border border-gray-200 dark:border-slate-700">
                        <img src={track.coverUrl} alt="" className="w-full h-full object-cover" />
                        {isSelected && isMusicPlaying && (
                          <div className="absolute inset-0 bg-[#3869A0]/70 flex items-center justify-center text-white">
                            <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping" />
                          </div>
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className={`text-xs truncate ${isSelected ? 'font-bold text-[#3869A0] dark:text-blue-300' : ''}`}>
                          {track.title}
                        </p>
                        <p className="text-[10px] text-gray-400 dark:text-gray-500 truncate">
                          {track.artist} {track.genre ? `• ${track.genre}` : ''}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 flex-shrink-0 text-[11px] text-gray-400 font-mono">
                      <span>{formatTime(track.duration)}</span>
                      
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          shareTrackToFeed(track);
                        }}
                        className="opacity-0 group-hover:opacity-100 p-1 text-gray-400 hover:text-[#3869A0] transition cursor-pointer"
                        title="Compartir en mi muro"
                      >
                        <Share2 className="w-3 h-3" />
                      </button>

                      {musicPlaylist.length > 1 && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            removeTrackFromPlaylist(track.id);
                          }}
                          className="opacity-0 group-hover:opacity-100 p-1 text-gray-400 hover:text-red-500 transition cursor-pointer"
                          title="Eliminar de lista"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>

          <div className="pt-2 mt-auto border-t border-gray-200 dark:border-slate-800 flex justify-between items-center text-[10px] text-gray-400">
            <span>💾 Playlist guardada en navegador</span>
            <button
              onClick={() => setShowPlaylist(false)}
              className="text-[#3869A0] dark:text-blue-400 font-bold hover:underline cursor-pointer"
            >
              Volver al reproductor
            </button>
          </div>
        </div>
      ) : (
        /* ================= VIEW 2: FULL ALBUM ART & CONTROLS ================= */
        <div className="p-4 bg-white dark:bg-slate-900 space-y-3.5">
          {/* Main Album Art Container with Vinyl Animation */}
          <div className="relative w-full aspect-square rounded-lg overflow-hidden bg-gradient-to-tr from-slate-900 via-slate-800 to-[#3869A0]/40 p-3 flex items-center justify-center border border-gray-200 dark:border-slate-800 shadow-inner">
            {/* Spinning Vinyl Record behind */}
            <div 
              className={`absolute w-44 h-44 rounded-full bg-slate-950 border-4 border-slate-800 flex items-center justify-center transition-all duration-700 shadow-2xl ${
                isMusicPlaying ? 'rotate-animation translate-x-8 sm:translate-x-12 opacity-90' : 'opacity-0 scale-90'
              }`}
              style={{
                animation: isMusicPlaying ? 'spin 8s linear infinite' : 'none'
              }}
            >
              {/* Vinyl Grooves */}
              <div className="w-36 h-36 rounded-full border border-slate-700/40 flex items-center justify-center">
                <div className="w-24 h-24 rounded-full border border-slate-700/60 flex items-center justify-center">
                  <div className="w-12 h-12 rounded-full bg-[#3869A0] border-2 border-white/80 flex items-center justify-center text-white">
                    <Disc className="w-6 h-6" />
                  </div>
                </div>
              </div>
            </div>

            {/* Front Cover Artwork Card */}
            <div className="relative z-10 w-44 h-44 rounded-lg overflow-hidden border-2 border-white/20 shadow-2xl group flex-shrink-0">
              <img 
                src={activeTrack?.coverUrl || 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=600&auto=format&fit=crop&q=80'} 
                alt={activeTrack?.title} 
                className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
              />
              <div className="absolute top-2 left-2 bg-black/60 backdrop-blur-xs text-white text-[9px] font-bold px-2 py-0.5 rounded uppercase tracking-wider">
                {activeTrack?.genre || 'Indie'}
              </div>
              {activeTrack?.year && (
                <div className="absolute bottom-2 right-2 bg-[#3869A0]/90 text-white text-[9px] font-bold px-1.5 py-0.5 rounded font-mono">
                  {activeTrack.year}
                </div>
              )}
            </div>
          </div>

          {/* Equalizer Waveform Canvas */}
          <div className="h-6 w-full bg-slate-100 dark:bg-slate-800/60 rounded px-2 flex items-center overflow-hidden border border-gray-100 dark:border-slate-800">
            <canvas 
              ref={canvasRef} 
              width={290} 
              height={24} 
              className="w-full h-full"
            />
          </div>

          {/* Track Meta (Title, Artist, Album) & Social Actions */}
          <div className="text-center space-y-1">
            <div>
              <h3 className="font-bold text-sm text-gray-900 dark:text-white truncate">
                {activeTrack?.title || 'Sin canción seleccionada'}
              </h3>
              <p className="text-xs text-[#3869A0] dark:text-blue-400 font-medium truncate">
                {activeTrack?.artist || 'Artista desconocido'}
              </p>
              {activeTrack?.album && (
                <p className="text-[10px] text-gray-400 dark:text-gray-500 truncate">
                  {activeTrack.album}
                </p>
              )}
            </div>

            {/* Quick Social Actions (Compartir en mi muro & Poner en perfil) */}
            {activeTrack && (
              <div className="flex items-center justify-center gap-2 pt-0.5">
                <button
                  onClick={() => {
                    shareTrackToFeed(activeTrack);
                    setIsSharedToWall(true);
                    setTimeout(() => setIsSharedToWall(false), 3000);
                  }}
                  className={`px-2.5 py-1 rounded-full text-[11px] font-semibold flex items-center gap-1.5 transition shadow-xs cursor-pointer ${
                    isSharedToWall
                      ? 'bg-emerald-500 text-white'
                      : 'bg-[#3869A0]/10 hover:bg-[#3869A0]/20 text-[#3869A0] dark:text-blue-300 dark:bg-blue-900/30'
                  }`}
                  title="Compartir lo que estoy escuchando en mi muro con un mini reproductor"
                >
                  {isSharedToWall ? (
                    <>
                      <Check className="w-3 h-3 text-white" />
                      <span>¡En mi muro!</span>
                    </>
                  ) : (
                    <>
                      <Share2 className="w-3 h-3" />
                      <span>Compartir en mi muro</span>
                    </>
                  )}
                </button>

                <button
                  onClick={() => {
                    updateUserData({ musica: `${activeTrack.title} - ${activeTrack.artist}` });
                    setIsProfileSaved(true);
                    setTimeout(() => setIsProfileSaved(false), 2500);
                  }}
                  className={`p-1.5 rounded-full transition cursor-pointer ${
                    isProfileSaved
                      ? 'bg-emerald-100 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400'
                      : 'bg-gray-100 hover:bg-rose-50 text-gray-500 hover:text-rose-500 dark:bg-slate-800 dark:text-gray-400'
                  }`}
                  title="Poner en mi perfil de usuario"
                >
                  <Heart className={`w-3.5 h-3.5 ${isProfileSaved ? 'fill-emerald-500 text-emerald-500' : ''}`} />
                </button>

                {activeTrack.youtubeUrl && (
                  <a
                    href={activeTrack.youtubeUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-1.5 rounded-full bg-gray-100 hover:bg-red-50 text-gray-500 hover:text-red-500 dark:bg-slate-800 dark:text-gray-400 transition"
                    title="Ver en YouTube"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                )}
              </div>
            )}
          </div>

          {/* Interactive Progress Bar with Click/Drag Scrubbing & Hover Tooltip */}
          {(() => {
            const effectiveDuration = musicDuration || activeTrack?.duration || 180;
            const currentSeconds = isScrubbing && scrubTime !== null ? scrubTime : musicPosition;
            const progressPercent = effectiveDuration > 0 ? (currentSeconds / effectiveDuration) * 100 : 0;

            return (
              <div className="space-y-1.5 pt-1">
                {/* Clickable and Draggable Bar Area */}
                <div
                  ref={progressBarRef}
                  onMouseDown={handleSeekStart}
                  onTouchStart={handleSeekStart}
                  onMouseMove={handleMouseMoveBar}
                  onMouseLeave={handleMouseLeaveBar}
                  className="relative py-2.5 -my-2 cursor-pointer group select-none touch-none"
                  title="Haz clic o arrastra para saltar a cualquier punto de la canción"
                >
                  {/* Floating Hover Timestamp Tooltip */}
                  {hoverPercent !== null && hoverTime !== null && (
                    <div 
                      className="absolute -top-5.5 transform -translate-x-1/2 bg-gray-900/95 dark:bg-slate-800 text-white text-[10px] font-mono font-bold px-1.5 py-0.5 rounded shadow-lg pointer-events-none z-30 border border-white/20 whitespace-nowrap animate-in fade-in zoom-in-95 duration-100"
                      style={{ left: `${Math.max(8, Math.min(92, hoverPercent))}%` }}
                    >
                      {formatTime(hoverTime)}
                    </div>
                  )}

                  {/* Track Background */}
                  <div className="h-1.5 group-hover:h-2.5 bg-gray-200 dark:bg-slate-700/80 rounded-full relative overflow-hidden transition-all duration-150">
                    {/* Hover ghost highlight track */}
                    {hoverPercent !== null && (
                      <div 
                        className="absolute top-0 bottom-0 left-0 bg-[#3869A0]/25 dark:bg-blue-400/25 rounded-full pointer-events-none transition-all duration-75"
                        style={{ width: `${Math.max(0, Math.min(100, hoverPercent))}%` }}
                      />
                    )}

                    {/* Active Progress Fill */}
                    <div 
                      className="h-full bg-gradient-to-r from-[#3869A0] via-[#4678b0] to-blue-400 rounded-full transition-all duration-75 group-hover:brightness-110 shadow-xs"
                      style={{ width: `${Math.min(100, Math.max(0, progressPercent))}%` }}
                    />
                  </div>

                  {/* Glowing Scrubber Thumb Knob */}
                  <div 
                    className={`absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-3.5 h-3.5 rounded-full bg-white border-2 border-[#3869A0] dark:border-blue-400 shadow-md transition-transform duration-100 pointer-events-none ${
                      isScrubbing 
                        ? 'scale-125 ring-4 ring-[#3869A0]/30 shadow-lg' 
                        : 'scale-0 group-hover:scale-100'
                    }`}
                    style={{ left: `${Math.min(100, Math.max(0, progressPercent))}%` }}
                  />
                </div>

                {/* Real-time Time Labels */}
                <div className="flex justify-between items-center text-[10px] text-gray-500 dark:text-gray-400 font-mono select-none">
                  <span className={isScrubbing ? 'font-bold text-[#3869A0] dark:text-blue-400' : ''}>
                    {formatTime(currentSeconds)}
                  </span>
                  <span className="text-gray-400 dark:text-gray-500">
                    {formatTime(effectiveDuration)}
                  </span>
                </div>
              </div>
            );
          })()}

          {/* Main Controls (Shuffle, Prev, Big Play, Next, Repeat) */}
          <div className="flex items-center justify-between pt-1">
            <button
              onClick={toggleMusicShuffle}
              className={`p-2 rounded-full transition cursor-pointer ${
                isMusicShuffled ? 'text-[#3869A0] dark:text-blue-400 bg-blue-50 dark:bg-blue-950/40' : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-200'
              }`}
              title={isMusicShuffled ? 'Modo aleatorio activado' : 'Activar modo aleatorio'}
            >
              <Shuffle className="w-3.5 h-3.5" />
            </button>

            <button
              onClick={prevTrack}
              className="p-2 rounded-full text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-slate-800 transition cursor-pointer"
              title="Canción anterior"
            >
              <SkipBack className="w-4 h-4" />
            </button>

            {/* Big Play Button */}
            <button
              onClick={handleTogglePlay}
              className="w-11 h-11 rounded-full bg-[#3869A0] hover:bg-[#2c537f] text-white flex items-center justify-center shadow-lg transition-transform active:scale-95 cursor-pointer"
              title={isMusicPlaying ? 'Pausar' : 'Reproducir'}
            >
              {isMusicPlaying ? (
                <Pause className="w-5 h-5" />
              ) : (
                <Play className="w-5 h-5 fill-current ml-0.5" />
              )}
            </button>

            <button
              onClick={nextTrack}
              className="p-2 rounded-full text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-slate-800 transition cursor-pointer"
              title="Siguiente canción"
            >
              <SkipForward className="w-4 h-4" />
            </button>

            <button
              onClick={toggleMusicRepeat}
              className={`p-2 rounded-full transition cursor-pointer ${
                musicRepeatMode !== 'off' ? 'text-[#3869A0] dark:text-blue-400 bg-blue-50 dark:bg-blue-950/40 font-bold' : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-200'
              }`}
              title={`Repetición: ${musicRepeatMode === 'all' ? 'Toda la lista' : musicRepeatMode === 'one' ? 'Repetir 1 canción' : 'Desactivada'}`}
            >
              {musicRepeatMode === 'one' ? <Repeat1 className="w-3.5 h-3.5" /> : <Repeat className="w-3.5 h-3.5" />}
            </button>
          </div>

            {/* Volume Control Bar */}
          <div className="pt-2 border-t border-gray-100 dark:border-slate-800/80 flex items-center gap-2">
            <button
              onClick={toggleMusicMute}
              className="text-gray-500 dark:text-gray-400 hover:text-[#3869A0] transition cursor-pointer"
              title={isMusicMuted ? 'Activar sonido' : 'Silenciar'}
            >
              {isMusicMuted || musicVolume === 0 ? (
                <VolumeX className="w-4 h-4 text-red-500" />
              ) : musicVolume < 0.5 ? (
                <Volume1 className="w-4 h-4" />
              ) : (
                <Volume2 className="w-4 h-4" />
              )}
            </button>

            <input
              type="range"
              min={0}
              max={1}
              step={0.05}
              value={isMusicMuted ? 0 : musicVolume}
              onChange={e => setMusicVolume(parseFloat(e.target.value))}
              className="flex-1 h-1 bg-gray-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-[#3869A0]"
            />

            <span className="text-[10px] font-mono text-gray-400 w-7 text-right">
              {isMusicMuted ? '0%' : `${Math.round(musicVolume * 100)}%`}
            </span>
          </div>
        </div>
      )}

      {/* ================= MODAL: AÑADIR CANCIÓN PERSONALIZADA ================= */}
      {showAddTrackModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-gray-300 dark:border-slate-700 rounded-xl shadow-2xl w-full max-w-sm overflow-hidden animate-in fade-in zoom-in-95">
            <div className="bg-[#3869A0] text-white px-4 py-2.5 flex items-center justify-between">
              <div className="flex items-center gap-2 font-bold text-xs">
                <Music className="w-4 h-4" />
                <span>Añadir Canción a Inkorium</span>
              </div>
              <button
                onClick={() => setShowAddTrackModal(false)}
                className="text-white hover:text-gray-200 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddTrack} className="p-4 space-y-3 text-xs">
              <div>
                <label className="font-bold text-gray-700 dark:text-gray-300 block mb-1">
                  Título de la canción *
                </label>
                <input
                  type="text"
                  required
                  value={newTitle}
                  onChange={e => setNewTitle(e.target.value)}
                  placeholder="Ej: Noches de Verano 2008"
                  className="w-full p-2 rounded border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-gray-900 dark:text-white focus:outline-none focus:border-[#3869A0]"
                />
              </div>

              <div>
                <label className="font-bold text-gray-700 dark:text-gray-300 block mb-1">
                  Artista / Grupo *
                </label>
                <input
                  type="text"
                  required
                  value={newArtist}
                  onChange={e => setNewArtist(e.target.value)}
                  placeholder="Ej: Los Indiscretos"
                  className="w-full p-2 rounded border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-gray-900 dark:text-white focus:outline-none focus:border-[#3869A0]"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-bold text-gray-700 dark:text-gray-300 block mb-1">
                    Género
                  </label>
                  <select
                    value={newGenre}
                    onChange={e => setNewGenre(e.target.value)}
                    className="w-full p-2 rounded border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-gray-900 dark:text-white focus:outline-none focus:border-[#3869A0]"
                  >
                    <option value="Pop Nostalgia">Pop Nostalgia</option>
                    <option value="Indie Rock">Indie Rock</option>
                    <option value="Electro Dance">Electro Dance</option>
                    <option value="Pop Punk">Pop Punk</option>
                    <option value="Chiptune 8-Bit">Chiptune 8-Bit</option>
                    <option value="Lofi Chill">Lofi Chill</option>
                    <option value="Synthwave">Synthwave</option>
                    <option value="Acústico">Acústico</option>
                  </select>
                </div>

                <div>
                  <label className="font-bold text-gray-700 dark:text-gray-300 block mb-1">
                    Carátula (URL)
                  </label>
                  <input
                    type="url"
                    value={newCoverUrl}
                    onChange={e => setNewCoverUrl(e.target.value)}
                    placeholder="https://..."
                    className="w-full p-2 rounded border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-gray-900 dark:text-white focus:outline-none focus:border-[#3869A0]"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-gray-700 dark:text-gray-300 block mb-1">
                  Enlace Audio MP3 (Opcional - Motor Web Audio integrado)
                </label>
                <input
                  type="url"
                  value={newAudioUrl}
                  onChange={e => setNewAudioUrl(e.target.value)}
                  placeholder="https://.../cancion.mp3"
                  className="w-full p-2 rounded border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-gray-900 dark:text-white focus:outline-none focus:border-[#3869A0]"
                />
                <p className="text-[10px] text-gray-400 mt-1">
                  Si no especificas un MP3, Inkorium generará una melodía sintetizada procedural retro en tiempo real.
                </p>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-gray-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowAddTrackModal(false)}
                  className="px-3 py-1.5 rounded border border-gray-300 dark:border-slate-700 text-gray-600 dark:text-gray-300 hover:bg-gray-100 cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-[#3869A0] hover:bg-[#2c537f] text-white font-bold rounded cursor-pointer shadow-xs"
                >
                  Añadir y Reproducir
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
    </>
  );
};
