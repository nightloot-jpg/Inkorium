import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useInkorium } from '../context/InkoriumContext';
import { 
  Play, Pause, SkipForward, SkipBack, Shuffle, Repeat, Repeat1, 
  Volume2, Volume1, VolumeX, Heart, Check, ExternalLink, 
  Disc, ListMusic, ChevronUp, ChevronDown, Music, X, Tv, 
  Minimize2, Maximize2, Sparkles, Radio, GripVertical, RotateCcw
} from 'lucide-react';

interface Position {
  x: number;
  y: number;
}

export const PersistentMusicBottomBar: React.FC = () => {
  const {
    currentTrack,
    isMusicPlaying,
    musicPosition,
    musicDuration,
    musicVolume,
    isMusicMuted,
    isMusicShuffled,
    musicRepeatMode,
    musicPlaylist,
    playTrack,
    togglePlayMusic,
    nextTrack,
    prevTrack,
    seekMusic,
    setMusicVolume,
    toggleMusicMute,
    toggleMusicShuffle,
    toggleMusicRepeat,
    updateUserData,
    setActiveTab,
    activeTab
  } = useInkorium();

  const [isExpandedQueue, setIsExpandedQueue] = useState(false);
  const [isProfileSaved, setIsProfileSaved] = useState(false);
  const [showVideoPopup, setShowVideoPopup] = useState(false);
  const [showVolumeSlider, setShowVolumeSlider] = useState(false);
  const [isMinimizedPill, setIsMinimizedPill] = useState(false);

  // Dragging State
  const [position, setPosition] = useState<Position | null>(() => {
    if (typeof localStorage !== 'undefined') {
      const saved = localStorage.getItem('inkorium:player_position');
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          if (typeof parsed.x === 'number' && typeof parsed.y === 'number') {
            return parsed;
          }
        } catch {}
      }
    }
    return null;
  });

  const [isDragging, setIsDragging] = useState(false);
  const dragStartRef = useRef<{ startX: number; startY: number; initialX: number; initialY: number } | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Initialize position to bottom right if null
  useEffect(() => {
    if (position === null && typeof window !== 'undefined') {
      const defaultX = Math.max(16, window.innerWidth - 380);
      const defaultY = Math.max(16, window.innerHeight - 76);
      setPosition({ x: defaultX, y: defaultY });
    }
  }, [position]);

  // Keep player inside window on resize
  useEffect(() => {
    const handleResize = () => {
      setPosition(prev => {
        if (!prev) return prev;
        const playerWidth = containerRef.current?.offsetWidth || 340;
        const playerHeight = containerRef.current?.offsetHeight || 50;
        const clampedX = Math.min(Math.max(10, prev.x), Math.max(10, window.innerWidth - playerWidth - 10));
        const clampedY = Math.min(Math.max(10, prev.y), Math.max(10, window.innerHeight - playerHeight - 10));
        return { x: clampedX, y: clampedY };
      });
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Save position to localStorage
  const savePosition = useCallback((newPos: Position) => {
    setPosition(newPos);
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('inkorium:player_position', JSON.stringify(newPos));
    }
  }, []);

  // Mouse & Touch Drag Handlers
  const handleDragStart = (clientX: number, clientY: number) => {
    if (!position) return;
    setIsDragging(true);
    dragStartRef.current = {
      startX: clientX,
      startY: clientY,
      initialX: position.x,
      initialY: position.y
    };
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    // Only allow left click and don't trigger drag on interactive inputs / buttons
    if (e.button !== 0) return;
    const target = e.target as HTMLElement;
    if (target.closest('button') || target.closest('input') || target.closest('a')) {
      return;
    }
    handleDragStart(e.clientX, e.clientY);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    const target = e.target as HTMLElement;
    if (target.closest('button') || target.closest('input') || target.closest('a')) {
      return;
    }
    const touch = e.touches[0];
    if (touch) {
      handleDragStart(touch.clientX, touch.clientY);
    }
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging || !dragStartRef.current) return;
      const deltaX = e.clientX - dragStartRef.current.startX;
      const deltaY = e.clientY - dragStartRef.current.startY;

      const playerWidth = containerRef.current?.offsetWidth || 340;
      const playerHeight = containerRef.current?.offsetHeight || 50;

      const newX = Math.min(Math.max(8, dragStartRef.current.initialX + deltaX), window.innerWidth - playerWidth - 8);
      const newY = Math.min(Math.max(8, dragStartRef.current.initialY + deltaY), window.innerHeight - playerHeight - 8);

      setPosition({ x: newX, y: newY });
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (!isDragging || !dragStartRef.current) return;
      const touch = e.touches[0];
      if (!touch) return;

      const deltaX = touch.clientX - dragStartRef.current.startX;
      const deltaY = touch.clientY - dragStartRef.current.startY;

      const playerWidth = containerRef.current?.offsetWidth || 340;
      const playerHeight = containerRef.current?.offsetHeight || 50;

      const newX = Math.min(Math.max(8, dragStartRef.current.initialX + deltaX), window.innerWidth - playerWidth - 8);
      const newY = Math.min(Math.max(8, dragStartRef.current.initialY + deltaY), window.innerHeight - playerHeight - 8);

      setPosition({ x: newX, y: newY });
    };

    const handleDragEnd = () => {
      if (isDragging && position) {
        setIsDragging(false);
        savePosition(position);
        dragStartRef.current = null;
      }
    };

    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleDragEnd);
      window.addEventListener('touchmove', handleTouchMove);
      window.addEventListener('touchend', handleDragEnd);
    }

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleDragEnd);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleDragEnd);
    };
  }, [isDragging, position, savePosition]);

  const resetPosition = () => {
    if (typeof window !== 'undefined') {
      const defaultX = Math.max(16, window.innerWidth - 380);
      const defaultY = Math.max(16, window.innerHeight - 76);
      savePosition({ x: defaultX, y: defaultY });
    }
  };

  // If no track is loaded, do not render
  if (!currentTrack) {
    return null;
  }

  const isYouTubeTrack = !!currentTrack.youtubeId;

  const formatTime = (seconds: number) => {
    if (isNaN(seconds) || seconds < 0) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  const progressPercentage = musicDuration > 0 ? (musicPosition / musicDuration) * 100 : 0;

  const handleSeekFromBar = (e: React.MouseEvent<HTMLDivElement>) => {
    e.stopPropagation();
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const width = rect.width;
    if (width > 0 && musicDuration > 0) {
      const newPos = (clickX / width) * musicDuration;
      seekMusic(newPos);
    }
  };

  const handleSetProfileSong = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!currentTrack) return;
    const songName = `${currentTrack.title} - ${currentTrack.artist}`;
    updateUserData({ musica: songName });
    setIsProfileSaved(true);
    setTimeout(() => setIsProfileSaved(false), 2500);
  };

  return (
    <>
      {/* 1. PERSISTENT HIDDEN YOUTUBE BACKGROUND AUDIO IFRAME */}
      {/* Keeps audio seamlessly playing across all tabs/pages */}
      {isYouTubeTrack && !showVideoPopup && isMusicPlaying && (
        <div className="hidden" aria-hidden="true">
          <iframe
            key={currentTrack.youtubeId + '-persistent-bg'}
            src={`https://www.youtube-nocookie.com/embed/${currentTrack.youtubeId}?autoplay=1&enablejsapi=1&rel=0`}
            title={currentTrack.title}
            allow="autoplay"
            className="w-0 h-0 border-0 pointer-events-none"
          />
        </div>
      )}

      {/* 2. FLOATING MINI-VIDEO (PIP) FOR YOUTUBE */}
      {isYouTubeTrack && showVideoPopup && (
        <div 
          className="fixed bottom-24 right-4 sm:right-6 z-50 w-64 sm:w-72 rounded-xl overflow-hidden shadow-2xl border-2 border-[#3869A0] bg-black animate-in fade-in slide-in-from-bottom-2"
        >
          <div className="bg-[#3869A0] text-white px-2.5 py-1 flex items-center justify-between text-[11px] font-bold">
            <span className="flex items-center gap-1.5 truncate">
              <Tv className="w-3 h-3 text-red-300" />
              <span className="truncate">{currentTrack.title}</span>
            </span>
            <button
              onClick={() => setShowVideoPopup(false)}
              className="p-0.5 hover:bg-white/20 rounded cursor-pointer"
              title="Ocultar vídeo (el audio continuará sonando)"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
          <div className="relative aspect-video w-full bg-black">
            <iframe
              key={currentTrack.youtubeId + '-pip'}
              src={`https://www.youtube-nocookie.com/embed/${currentTrack.youtubeId}?autoplay=${isMusicPlaying ? 1 : 0}&enablejsapi=1&rel=0`}
              title={currentTrack.title}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              className="w-full h-full border-0"
            />
          </div>
        </div>
      )}

      {/* 3. DRAGGABLE FLOATING PLAYER CONTAINER */}
      <div 
        ref={containerRef}
        style={{
          position: 'fixed',
          left: position ? `${position.x}px` : 'auto',
          top: position ? `${position.y}px` : 'auto',
          right: position ? 'auto' : '20px',
          bottom: position ? 'auto' : '20px',
          zIndex: 45,
          userSelect: isDragging ? 'none' : 'auto'
        }}
        className={`transition-shadow duration-200 ${isDragging ? 'cursor-grabbing opacity-95 scale-[1.02]' : 'cursor-grab'}`}
        onMouseDown={handleMouseDown}
        onTouchStart={handleTouchStart}
      >
        {isMinimizedPill ? (
          /* Mini Floating Vinyl Bubble (Draggable anywhere) */
          <div className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-md rounded-full shadow-[0_10px_35px_rgba(0,0,0,0.25)] border border-[#ccd5df] dark:border-slate-700 p-1.5 flex items-center gap-2 group ring-2 ring-transparent hover:ring-[#3869A0]/30 transition">
            <div 
              onClick={() => setIsMinimizedPill(false)}
              className="relative w-8 h-8 rounded-full overflow-hidden bg-slate-950 flex-shrink-0 cursor-pointer shadow-xs"
              title="Click para expandir"
            >
              <img 
                src={currentTrack.coverUrl || 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=300&auto=format&fit=crop&q=80'} 
                alt={currentTrack.title} 
                className={`w-full h-full object-cover ${isMusicPlaying ? 'animate-spin-slow' : ''}`}
              />
              {isMusicPlaying && (
                <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
                  <Disc className="w-3.5 h-3.5 text-white" />
                </div>
              )}
            </div>

            <div 
              onClick={() => setIsMinimizedPill(false)}
              className="min-w-0 max-w-[110px] cursor-pointer"
            >
              <p className="font-bold text-[11px] text-gray-900 dark:text-white truncate leading-tight">
                {currentTrack.title}
              </p>
            </div>

            <button
              onClick={(e) => {
                e.stopPropagation();
                togglePlayMusic();
              }}
              className="w-7 h-7 rounded-full bg-[#3869A0] text-white flex items-center justify-center shadow-xs cursor-pointer active:scale-95 flex-shrink-0"
              title={isMusicPlaying ? 'Pausar' : 'Reproducir'}
            >
              {isMusicPlaying ? <Pause className="w-3.5 h-3.5 fill-current" /> : <Play className="w-3.5 h-3.5 fill-current ml-0.5" />}
            </button>

            <button
              onClick={(e) => {
                e.stopPropagation();
                setIsMinimizedPill(false);
              }}
              className="p-1 text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 cursor-pointer"
              title="Expandir reproductor"
            >
              <Maximize2 className="w-3 h-3" />
            </button>
          </div>
        ) : (
          /* Sleek Draggable Compact Floating Player */
          <div className="relative">
            
            {/* Expanded Playlist Queue Floating Drawer (above the player) */}
            {isExpandedQueue && (
              <div 
                onMouseDown={(e) => e.stopPropagation()}
                onTouchStart={(e) => e.stopPropagation()}
                className="absolute bottom-full mb-2 left-0 right-0 max-h-56 overflow-y-auto rounded-xl border border-gray-200 dark:border-slate-700 p-2.5 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md shadow-2xl animate-in fade-in slide-in-from-bottom-2 z-50 cursor-auto"
              >
                <div className="flex items-center justify-between pb-1.5 border-b border-gray-100 dark:border-slate-800 text-[11px]">
                  <span className="font-bold text-gray-800 dark:text-white flex items-center gap-1.5">
                    <ListMusic className="w-3.5 h-3.5 text-[#3869A0]" />
                    Cola ({musicPlaylist.length} temas)
                  </span>
                  <button
                    onClick={() => setIsExpandedQueue(false)}
                    className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 cursor-pointer"
                  >
                    Cerrar
                  </button>
                </div>
                <div className="space-y-1 pt-1.5">
                  {musicPlaylist.map((t, idx) => {
                    const isSelected = t.id === currentTrack.id || (t.youtubeId && currentTrack.youtubeId && t.youtubeId === currentTrack.youtubeId);
                    return (
                      <div
                        key={t.id || idx}
                        onClick={() => playTrack(t)}
                        className={`p-1.5 rounded-lg flex items-center gap-2 cursor-pointer transition text-[11px] border ${
                          isSelected
                            ? 'bg-blue-50 dark:bg-blue-950/60 border-[#3869A0] font-bold text-[#3869A0] dark:text-blue-300'
                            : 'bg-gray-50/70 dark:bg-slate-800/60 border-transparent hover:bg-gray-100 dark:hover:bg-slate-800 text-gray-700 dark:text-gray-300'
                        }`}
                      >
                        <img src={t.coverUrl} alt="" className="w-6 h-6 rounded object-cover flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="truncate">{t.title}</p>
                          <p className="text-[9px] text-gray-400 truncate">{t.artist}</p>
                        </div>
                        {t.youtubeId && (
                          <span className="text-[8px] bg-red-100 dark:bg-red-950 text-red-600 dark:text-red-400 px-1 py-0.2 rounded font-bold">
                            YT
                          </span>
                        )}
                        {isSelected && isMusicPlaying && (
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse flex-shrink-0" />
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Main Floating Capsule Shell */}
            <div className="relative overflow-hidden bg-white/95 dark:bg-slate-900/95 backdrop-blur-md rounded-2xl border border-[#ccd5df] dark:border-slate-700 shadow-[0_12px_40px_rgba(0,0,0,0.22)] ring-1 ring-black/5 dark:ring-white/10 px-2.5 py-1.5 sm:px-3 sm:py-2 flex items-center justify-between gap-2 sm:gap-3 select-none">
              
              {/* Micro Progress Bar on Top */}
              <div 
                onClick={handleSeekFromBar}
                className="absolute top-0 left-0 right-0 h-1 bg-gray-200 dark:bg-slate-800 cursor-pointer group"
                title={`Posición: ${formatTime(musicPosition)} / ${formatTime(musicDuration)}`}
              >
                <div 
                  className="h-full bg-[#3869A0] dark:bg-blue-400 transition-all duration-150 relative"
                  style={{ width: `${progressPercentage}%` }}
                >
                  <div className="hidden group-hover:block absolute right-0 top-1/2 -translate-y-1/2 w-2.5 h-2.5 rounded-full bg-[#3869A0] border-2 border-white shadow" />
                </div>
              </div>

              {/* Drag Handle Icon */}
              <div 
                className="text-gray-300 dark:text-gray-600 hover:text-gray-500 dark:hover:text-gray-400 cursor-grab active:cursor-grabbing p-0.5 -ml-1"
                title="Arrastra para mover el reproductor"
              >
                <GripVertical className="w-3.5 h-3.5" />
              </div>

              {/* Album Cover & Track Info */}
              <div className="flex items-center gap-2 min-w-0 max-w-[140px] sm:max-w-[180px] lg:max-w-[220px]">
                <div 
                  onClick={(e) => {
                    e.stopPropagation();
                    if (activeTab !== 'musica') setActiveTab('musica');
                  }}
                  className="relative w-8 h-8 rounded-lg overflow-hidden bg-slate-950 border border-gray-200 dark:border-slate-700 flex-shrink-0 shadow-xs cursor-pointer group"
                  title="Ir a Inkorium Música"
                >
                  <img 
                    src={currentTrack.coverUrl || 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=300&auto=format&fit=crop&q=80'} 
                    alt={currentTrack.title} 
                    className={`w-full h-full object-cover transition-transform ${isMusicPlaying ? 'scale-105' : ''}`}
                  />
                  {isMusicPlaying && (
                    <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
                      <Disc className="w-3.5 h-3.5 text-white animate-spin-slow" />
                    </div>
                  )}
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1">
                    <h4 
                      onClick={(e) => {
                        e.stopPropagation();
                        if (activeTab !== 'musica') setActiveTab('musica');
                      }}
                      className="font-bold text-[11px] sm:text-xs text-gray-900 dark:text-white truncate cursor-pointer hover:text-[#3869A0] transition leading-tight"
                      title={currentTrack.title}
                    >
                      {currentTrack.title}
                    </h4>
                    {isYouTubeTrack && (
                      <span className="text-[8px] bg-red-600 text-white font-bold px-1 py-0.2 rounded flex-shrink-0">
                        YT
                      </span>
                    )}
                  </div>
                  <p className="text-[9px] sm:text-[10px] text-[#3869A0] dark:text-blue-400 font-semibold truncate leading-tight">
                    {currentTrack.artist}
                  </p>
                </div>
              </div>

              {/* Playback Controls */}
              <div 
                onMouseDown={(e) => e.stopPropagation()}
                onTouchStart={(e) => e.stopPropagation()}
                className="flex items-center gap-1 sm:gap-1.5 flex-shrink-0"
              >
                <button
                  onClick={prevTrack}
                  className="p-1 text-gray-600 dark:text-gray-300 hover:text-[#3869A0] transition cursor-pointer"
                  title="Anterior"
                >
                  <SkipBack className="w-3.5 h-3.5" />
                </button>

                <button
                  onClick={togglePlayMusic}
                  className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-[#3869A0] hover:bg-[#2c537f] text-white flex items-center justify-center shadow-xs transition-transform active:scale-95 cursor-pointer"
                  title={isMusicPlaying ? 'Pausar' : 'Reproducir'}
                >
                  {isMusicPlaying ? (
                    <Pause className="w-3.5 h-3.5 fill-current" />
                  ) : (
                    <Play className="w-3.5 h-3.5 fill-current ml-0.5" />
                  )}
                </button>

                <button
                  onClick={nextTrack}
                  className="p-1 text-gray-600 dark:text-gray-300 hover:text-[#3869A0] transition cursor-pointer"
                  title="Siguiente"
                >
                  <SkipForward className="w-3.5 h-3.5" />
                </button>

                <span className="hidden md:inline text-[9px] font-mono text-gray-400 pl-0.5">
                  {formatTime(musicPosition)}/{formatTime(musicDuration)}
                </span>
              </div>

              {/* Quick Actions (PIP, Volume, Profile, Queue, Minimize) */}
              <div 
                onMouseDown={(e) => e.stopPropagation()}
                onTouchStart={(e) => e.stopPropagation()}
                className="flex items-center gap-0.5 sm:gap-1 flex-shrink-0"
              >
                {/* PIP Video Toggle */}
                {isYouTubeTrack && (
                  <button
                    onClick={() => setShowVideoPopup(!showVideoPopup)}
                    className={`p-1 rounded-md transition cursor-pointer ${
                      showVideoPopup
                        ? 'text-red-600 bg-red-50 dark:bg-red-950/40'
                        : 'text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30'
                    }`}
                    title={showVideoPopup ? 'Cerrar vídeo flotante' : 'Ver vídeo PIP'}
                  >
                    <Tv className="w-3.5 h-3.5" />
                  </button>
                )}

                {/* Volume Popover */}
                <div className="relative">
                  <button
                    onClick={() => setShowVolumeSlider(!showVolumeSlider)}
                    className="p-1 text-gray-400 hover:text-[#3869A0] transition cursor-pointer"
                    title="Volumen"
                  >
                    {isMusicMuted || musicVolume === 0 ? (
                      <VolumeX className="w-3.5 h-3.5 text-red-500" />
                    ) : musicVolume < 0.5 ? (
                      <Volume1 className="w-3.5 h-3.5" />
                    ) : (
                      <Volume2 className="w-3.5 h-3.5" />
                    )}
                  </button>

                  {showVolumeSlider && (
                    <div className="absolute bottom-full mb-2 right-0 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-lg p-2 shadow-xl flex items-center gap-2 z-50 animate-in fade-in">
                      <button onClick={toggleMusicMute} className="text-gray-500 hover:text-[#3869A0]">
                        {isMusicMuted ? <VolumeX className="w-3 h-3 text-red-500" /> : <Volume2 className="w-3 h-3" />}
                      </button>
                      <input
                        type="range"
                        min={0}
                        max={1}
                        step={0.05}
                        value={isMusicMuted ? 0 : musicVolume}
                        onChange={e => setMusicVolume(parseFloat(e.target.value))}
                        className="w-16 h-1 bg-gray-200 dark:bg-slate-700 rounded appearance-none cursor-pointer accent-[#3869A0]"
                      />
                    </div>
                  )}
                </div>

                {/* Set Profile Song */}
                <button
                  onClick={handleSetProfileSong}
                  className={`p-1 rounded-md transition cursor-pointer ${
                    isProfileSaved
                      ? 'text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40'
                      : 'text-gray-400 hover:text-rose-500'
                  }`}
                  title="Poner como canción de mi perfil"
                >
                  {isProfileSaved ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Heart className="w-3.5 h-3.5" />}
                </button>

                {/* Queue Toggle */}
                <button
                  onClick={() => setIsExpandedQueue(!isExpandedQueue)}
                  className={`p-1 rounded-md transition cursor-pointer ${
                    isExpandedQueue 
                      ? 'text-[#3869A0] bg-blue-50 dark:bg-blue-950/40 font-bold' 
                      : 'text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
                  }`}
                  title="Cola de reproducción"
                >
                  <ListMusic className="w-3.5 h-3.5" />
                </button>

                {/* Minimize Button */}
                <button
                  onClick={() => setIsMinimizedPill(true)}
                  className="p-1 text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition cursor-pointer"
                  title="Minimizar a burbuja"
                >
                  <Minimize2 className="w-3 h-3" />
                </button>

                {/* Reset to Default Corner Button */}
                <button
                  onClick={resetPosition}
                  className="p-1 text-gray-300 dark:text-gray-600 hover:text-gray-500 dark:hover:text-gray-300 transition cursor-pointer"
                  title="Volver a la posición predeterminada"
                >
                  <RotateCcw className="w-2.5 h-2.5" />
                </button>
              </div>

            </div>
          </div>
        )}
      </div>
    </>
  );
};
