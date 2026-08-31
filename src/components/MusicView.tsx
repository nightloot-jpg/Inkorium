import React, { useState, useEffect, useRef } from 'react';
import { useInkorium } from '../context/InkoriumContext';
import { 
  Play, Pause, SkipForward, SkipBack, Shuffle, Repeat, Repeat1, 
  Volume2, Volume1, VolumeX, Music, Search, Plus, Trash2, Sparkles, 
  Disc, Radio, Heart, ListPlus, Check, Share2, Filter, LayoutGrid, 
  List, TrendingUp, Flame, Headset, Clock, User, X
} from 'lucide-react';
import { Track } from '../types';
import { musicAudioEngine } from '../utils/audioEngine';

export const MusicView: React.FC = () => {
  const {
    currentUser,
    updateUserData,
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
    setIsMusicPlayerOpen,
    setIsMusicPlayerMinimized,
    addCustomTrack,
    removeTrackFromPlaylist
  } = useInkorium();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGenre, setSelectedGenre] = useState<string>('todos');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [showAddModal, setShowAddModal] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Form states for adding custom track
  const [newTitle, setNewTitle] = useState('');
  const [newArtist, setNewArtist] = useState('');
  const [newGenre, setNewGenre] = useState('Pop Nostalgia');
  const [newAudioUrl, setNewAudioUrl] = useState('');
  const [newCoverUrl, setNewCoverUrl] = useState('');
  const [newYear, setNewYear] = useState<number>(2008);

  // Visualizer Canvas Ref
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  // Format seconds to mm:ss
  const formatTime = (seconds: number) => {
    if (isNaN(seconds) || seconds < 0) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  // Toast feedback helper
  const showFeedback = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Equalizer visualizer effect
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const render = () => {
      animationFrameRef.current = requestAnimationFrame(render);
      const width = canvas.width;
      const height = canvas.height;
      ctx.clearRect(0, 0, width, height);

      const freqData = musicAudioEngine.getFrequencyData();
      const numBars = 32;
      const barWidth = (width / numBars) - 2;

      for (let i = 0; i < numBars; i++) {
        let barHeight = 4;
        if (isMusicPlaying) {
          const rawVal = freqData[i % freqData.length] || 0;
          const pulse = Math.sin(Date.now() / 120 + i * 0.4) * 8;
          barHeight = Math.max(4, (rawVal / 255) * (height - 6) + (rawVal > 10 ? pulse : 2));
        }

        const x = i * (barWidth + 2);
        const y = height - barHeight;

        const grad = ctx.createLinearGradient(0, height, 0, 0);
        grad.addColorStop(0, '#3869A0');
        grad.addColorStop(0.5, '#60a5fa');
        grad.addColorStop(1, '#93c5fd');

        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.roundRect(x, y, barWidth, barHeight, [3, 3, 0, 0]);
        ctx.fill();
      }
    };

    render();

    return () => {
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
    };
  }, [isMusicPlaying]);

  // Filter songs
  const filteredTracks = musicPlaylist.filter(track => {
    const matchesSearch = track.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          track.artist.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          (track.album && track.album.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesGenre = selectedGenre === 'todos' || track.genre === selectedGenre;
    return matchesSearch && matchesGenre;
  });

  const allGenres = Array.from(new Set(musicPlaylist.map(t => t.genre).filter(Boolean))) as string[];

  // Set current song as user's profile song
  const handleSetAsProfileSong = (track: Track) => {
    updateUserData({ musica: `${track.title} - ${track.artist}` });
    showFeedback(`¡"${track.title}" configurada como música de tu perfil!`);
  };

  const handleAddTrackSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newArtist.trim()) return;

    addCustomTrack({
      title: newTitle.trim(),
      artist: newArtist.trim(),
      genre: newGenre,
      duration: 180,
      year: newYear,
      audioUrl: newAudioUrl.trim() || undefined,
      coverUrl: newCoverUrl.trim() || 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=600&auto=format&fit=crop&q=80',
      synthStyle: 'retro_pop'
    });

    setNewTitle('');
    setNewArtist('');
    setNewAudioUrl('');
    setNewCoverUrl('');
    setShowAddModal(false);
    showFeedback('¡Canción añadida a tu biblioteca con éxito!');
  };

  return (
    <div className="w-full max-w-[1720px] 2xl:max-w-[1850px] mx-auto px-3 sm:px-6 lg:px-8 py-4">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-16 right-4 z-50 bg-[#3869A0] text-white px-4 py-2.5 rounded-lg shadow-xl border border-white/20 flex items-center gap-2 text-xs font-semibold animate-in fade-in slide-in-from-top-2">
          <Check className="w-4 h-4 text-emerald-300 flex-shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Main Container Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        
        {/* ========================================================= */}
        {/* LEFT COLUMN: NOW PLAYING DECK & RETRO PROFILE WIDGET     */}
        {/* ========================================================= */}
        <div className="lg:col-span-4 space-y-4">
          
          {/* Main Deck Player Card */}
          <div className="bg-white dark:bg-slate-900 rounded-lg border border-[#ccd5df] dark:border-slate-800 shadow-xs overflow-hidden">
            <div className="bg-[#3869A0] text-white px-3.5 py-2 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Radio className="w-4 h-4 text-blue-200" />
                <h2 className="font-bold text-xs tracking-tight">Reproductor Central Inkorium</h2>
              </div>
              {isMusicPlaying && (
                <span className="flex items-center gap-1 text-[10px] bg-white/20 px-2 py-0.5 rounded-full font-mono">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                  EN VIVO
                </span>
              )}
            </div>

            <div className="p-4 space-y-4">
              {/* Vinyl Turntable Display */}
              <div className="relative w-full aspect-4/3 rounded-lg overflow-hidden bg-gradient-to-br from-slate-900 via-slate-800 to-[#1e3a5f] p-4 flex items-center justify-center border border-gray-200 dark:border-slate-800 shadow-inner">
                {/* Spinning Vinyl Record */}
                <div 
                  className={`absolute w-44 h-44 rounded-full bg-slate-950 border-4 border-slate-700 flex items-center justify-center transition-all duration-700 shadow-2xl ${
                    isMusicPlaying ? 'translate-x-10 sm:translate-x-14 opacity-90' : 'opacity-0 scale-90'
                  }`}
                  style={{
                    animation: isMusicPlaying ? 'spin 7s linear infinite' : 'none'
                  }}
                >
                  <div className="w-36 h-36 rounded-full border border-slate-700/40 flex items-center justify-center">
                    <div className="w-24 h-24 rounded-full border border-slate-700/60 flex items-center justify-center">
                      <div className="w-12 h-12 rounded-full bg-[#3869A0] border-2 border-white/80 flex items-center justify-center text-white">
                        <Disc className="w-6 h-6" />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Album Cover Art */}
                <div className="relative z-10 w-40 h-40 rounded-lg overflow-hidden border-2 border-white/30 shadow-2xl group flex-shrink-0">
                  <img 
                    src={currentTrack?.coverUrl || 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=600&auto=format&fit=crop&q=80'} 
                    alt={currentTrack?.title} 
                    className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
                  />
                  <div className="absolute top-2 left-2 bg-black/70 backdrop-blur-xs text-white text-[9px] font-bold px-2 py-0.5 rounded uppercase tracking-wider">
                    {currentTrack?.genre || 'Nostalgia'}
                  </div>
                  {currentTrack?.year && (
                    <div className="absolute bottom-2 right-2 bg-[#3869A0]/90 text-white text-[9px] font-bold px-1.5 py-0.5 rounded font-mono">
                      {currentTrack.year}
                    </div>
                  )}
                </div>
              </div>

              {/* Live Equalizer Canvas */}
              <div className="h-8 w-full bg-slate-100 dark:bg-slate-800/80 rounded px-2 flex items-center overflow-hidden border border-gray-200 dark:border-slate-800">
                <canvas 
                  ref={canvasRef} 
                  width={340} 
                  height={32} 
                  className="w-full h-full"
                />
              </div>

              {/* Title & Artist */}
              <div className="text-center space-y-0.5">
                <h3 className="font-bold text-base text-gray-900 dark:text-white truncate">
                  {currentTrack?.title || 'Sin canción'}
                </h3>
                <p className="text-xs text-[#3869A0] dark:text-blue-400 font-semibold truncate">
                  {currentTrack?.artist || 'Artista'}
                </p>
                {currentTrack?.album && (
                  <p className="text-[11px] text-gray-400 dark:text-gray-500 truncate">
                    Álbum: {currentTrack.album}
                  </p>
                )}
              </div>

              {/* Progress Slider */}
              <div className="space-y-1">
                <input
                  type="range"
                  min={0}
                  max={musicDuration || 180}
                  value={musicPosition}
                  onChange={e => seekMusic(parseFloat(e.target.value))}
                  className="w-full h-2 bg-gray-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-[#3869A0] dark:accent-blue-400"
                />
                <div className="flex justify-between text-[11px] text-gray-400 font-mono">
                  <span>{formatTime(musicPosition)}</span>
                  <span>{formatTime(musicDuration)}</span>
                </div>
              </div>

              {/* Playback Controls */}
              <div className="flex items-center justify-between pt-1">
                <button
                  onClick={toggleMusicShuffle}
                  className={`p-2 rounded-full transition cursor-pointer ${
                    isMusicShuffled ? 'text-[#3869A0] dark:text-blue-400 bg-blue-50 dark:bg-blue-950/40 font-bold' : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-200'
                  }`}
                  title={isMusicShuffled ? 'Modo aleatorio: Activado' : 'Modo aleatorio: Desactivado'}
                >
                  <Shuffle className="w-4 h-4" />
                </button>

                <button
                  onClick={prevTrack}
                  className="p-2 rounded-full text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-slate-800 transition cursor-pointer"
                  title="Canción anterior"
                >
                  <SkipBack className="w-5 h-5" />
                </button>

                {/* Big Main Play Button */}
                <button
                  onClick={togglePlayMusic}
                  className="w-12 h-12 rounded-full bg-[#3869A0] hover:bg-[#2c537f] text-white flex items-center justify-center shadow-lg transition-transform active:scale-95 cursor-pointer"
                  title={isMusicPlaying ? 'Pausar música' : 'Reproducir música'}
                >
                  {isMusicPlaying ? (
                    <Pause className="w-6 h-6" />
                  ) : (
                    <Play className="w-6 h-6 fill-current ml-0.5" />
                  )}
                </button>

                <button
                  onClick={nextTrack}
                  className="p-2 rounded-full text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-slate-800 transition cursor-pointer"
                  title="Siguiente canción"
                >
                  <SkipForward className="w-5 h-5" />
                </button>

                <button
                  onClick={toggleMusicRepeat}
                  className={`p-2 rounded-full transition cursor-pointer ${
                    musicRepeatMode !== 'off' ? 'text-[#3869A0] dark:text-blue-400 bg-blue-50 dark:bg-blue-950/40 font-bold' : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-200'
                  }`}
                  title={`Repetición: ${musicRepeatMode === 'all' ? 'Toda la lista' : musicRepeatMode === 'one' ? 'Repetir 1 canción' : 'Desactivada'}`}
                >
                  {musicRepeatMode === 'one' ? <Repeat1 className="w-4 h-4" /> : <Repeat className="w-4 h-4" />}
                </button>
              </div>

              {/* Volume Slider */}
              <div className="pt-2 border-t border-gray-100 dark:border-slate-800 flex items-center gap-2">
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
                  className="flex-1 h-1.5 bg-gray-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-[#3869A0]"
                />

                <span className="text-[10px] font-mono text-gray-400 w-8 text-right">
                  {isMusicMuted ? '0%' : `${Math.round(musicVolume * 100)}%`}
                </span>
              </div>

              {/* Quick Actions for Current Track */}
              {currentTrack && (
                <div className="pt-2 flex items-center justify-between gap-2 border-t border-gray-100 dark:border-slate-800 text-xs">
                  <button
                    onClick={() => handleSetAsProfileSong(currentTrack)}
                    className="flex-1 py-1.5 px-2 bg-blue-50 dark:bg-blue-950/50 hover:bg-blue-100 dark:hover:bg-blue-900/60 text-[#3869A0] dark:text-blue-300 font-semibold rounded flex items-center justify-center gap-1.5 transition cursor-pointer border border-blue-200 dark:border-blue-800/60"
                  >
                    <Heart className="w-3.5 h-3.5 fill-current text-rose-500" />
                    <span>Poner en mi perfil</span>
                  </button>

                  <button
                    onClick={() => {
                      setIsMusicPlayerOpen(true);
                      setIsMusicPlayerMinimized(true);
                      showFeedback('Reproductor flotante activado');
                    }}
                    className="py-1.5 px-2.5 bg-gray-100 dark:bg-slate-800 hover:bg-gray-200 dark:hover:bg-slate-700 text-gray-700 dark:text-gray-300 font-medium rounded flex items-center gap-1 transition cursor-pointer"
                    title="Mantener música sonando en una cápsula minimizada mientras navegas por Inkorium"
                  >
                    <Disc className="w-3.5 h-3.5 text-[#3869A0]" />
                    <span>Flotante</span>
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* User's Current Profile Song Card */}
          <div className="bg-white dark:bg-slate-900 rounded-lg border border-[#ccd5df] dark:border-slate-800 p-3.5 shadow-xs space-y-2">
            <div className="flex items-center justify-between pb-1.5 border-b border-gray-100 dark:border-slate-800">
              <span className="font-bold text-xs text-gray-800 dark:text-white flex items-center gap-1.5">
                <Headset className="w-4 h-4 text-[#3869A0]" />
                Música de tu perfil
              </span>
              <span className="text-[10px] text-gray-400 font-mono">Tuenti Vibe</span>
            </div>

            <div className="p-2.5 rounded bg-blue-50/70 dark:bg-blue-950/30 border border-blue-100 dark:border-blue-900/40 text-xs">
              <p className="text-gray-500 dark:text-gray-400 text-[11px] mb-1">
                La canción que suena cuando la gente visita tu perfil:
              </p>
              <p className="font-bold text-[#3869A0] dark:text-blue-300 text-xs truncate">
                {currentUser.musica || 'Sin canción establecida aún'}
              </p>
            </div>
          </div>

          {/* Retro Station Curated Playlists */}
          <div className="bg-white dark:bg-slate-900 rounded-lg border border-[#ccd5df] dark:border-slate-800 p-3.5 shadow-xs space-y-2">
            <div className="flex items-center justify-between pb-1.5 border-b border-gray-100 dark:border-slate-800">
              <span className="font-bold text-xs text-gray-800 dark:text-white flex items-center gap-1.5">
                <Flame className="w-4 h-4 text-amber-500" />
                Estaciones Tuenti Retro
              </span>
            </div>

            <div className="space-y-1.5 text-xs">
              {[
                { title: 'Fiesta de Fin de Curso 2008', genre: 'Electro Dance', count: '12 pistas', color: 'from-amber-500 to-orange-500' },
                { title: 'Tardes de Messenger & Zumbidos', genre: 'Pop Nostalgia', count: '16 pistas', color: 'from-blue-500 to-indigo-500' },
                { title: 'Indie Español de Festival', genre: 'Indie Rock', count: '14 pistas', color: 'from-emerald-500 to-teal-500' },
                { title: 'Chiptune Gamer 8-Bit', genre: 'Chiptune 8-Bit', count: '10 pistas', color: 'from-purple-500 to-pink-500' },
              ].map((station, i) => (
                <div 
                  key={i}
                  onClick={() => {
                    setSelectedGenre(station.genre);
                    showFeedback(`Filtrando por estación: ${station.title}`);
                  }}
                  className="p-2 rounded bg-gray-50 dark:bg-slate-800/60 hover:bg-blue-50 dark:hover:bg-blue-950/40 border border-gray-100 dark:border-slate-800 cursor-pointer transition flex items-center justify-between group"
                >
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full bg-gradient-to-r ${station.color}`} />
                    <span className="font-semibold text-gray-800 dark:text-gray-200 group-hover:text-[#3869A0]">
                      {station.title}
                    </span>
                  </div>
                  <span className="text-[10px] text-gray-400">{station.genre}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ========================================================= */}
        {/* RIGHT COLUMN: MAIN BROWSER & CHARTS                      */}
        {/* ========================================================= */}
        <div className="lg:col-span-8 space-y-4">
          
          {/* Hero Header Banner */}
          <div className="bg-gradient-to-r from-[#3869A0] via-[#2f5988] to-[#1e3a5f] text-white rounded-lg p-5 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Disc className="w-6 h-6 text-amber-300 animate-spin" style={{ animationDuration: '6s' }} />
                <h1 className="font-bold text-xl sm:text-2xl tracking-tight">Inkorium Música</h1>
              </div>
              <p className="text-xs text-blue-100 max-w-xl">
                Escucha los mejores éxitos, descubre bandas nostálgicas y personaliza la banda sonora de tu perfil como en la época dorada de Tuenti.
              </p>
            </div>

            <button
              onClick={() => setShowAddModal(true)}
              className="px-4 py-2 bg-amber-400 hover:bg-amber-300 text-gray-900 font-bold text-xs rounded-md shadow flex items-center gap-1.5 transition cursor-pointer flex-shrink-0"
            >
              <Plus className="w-4 h-4" />
              <span>Añadir Canción</span>
            </button>
          </div>

          {/* Search, Genre Filter Pills, and View Switcher */}
          <div className="bg-white dark:bg-slate-900 rounded-lg border border-[#ccd5df] dark:border-slate-800 p-3 shadow-xs space-y-2.5">
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2">
              {/* Search Bar */}
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  placeholder="Buscar por título, artista o álbum..."
                  className="w-full pl-9 pr-3 py-1.5 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded text-xs text-gray-900 dark:text-white focus:outline-none focus:border-[#3869A0]"
                />
              </div>

              {/* View Mode Toggle */}
              <div className="flex items-center gap-1 border border-gray-200 dark:border-slate-700 rounded p-0.5 bg-gray-50 dark:bg-slate-800 self-end sm:self-auto">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-1.5 rounded transition cursor-pointer ${
                    viewMode === 'grid' ? 'bg-[#3869A0] text-white shadow-xs' : 'text-gray-500 hover:text-gray-800 dark:text-gray-400'
                  }`}
                  title="Vista en cuadrícula"
                >
                  <LayoutGrid className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-1.5 rounded transition cursor-pointer ${
                    viewMode === 'list' ? 'bg-[#3869A0] text-white shadow-xs' : 'text-gray-500 hover:text-gray-800 dark:text-gray-400'
                  }`}
                  title="Vista en lista detallada"
                >
                  <List className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Genre Filter Pills */}
            <div className="flex gap-1.5 overflow-x-auto pb-1 text-xs scrollbar-none">
              <button
                onClick={() => setSelectedGenre('todos')}
                className={`px-3 py-1 rounded-full font-semibold whitespace-nowrap transition cursor-pointer ${
                  selectedGenre === 'todos'
                    ? 'bg-[#3869A0] text-white shadow-xs'
                    : 'bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200'
                }`}
              >
                Todas ({musicPlaylist.length})
              </button>
              {allGenres.map(g => {
                const count = musicPlaylist.filter(t => t.genre === g).length;
                return (
                  <button
                    key={g}
                    onClick={() => setSelectedGenre(g)}
                    className={`px-3 py-1 rounded-full font-semibold whitespace-nowrap transition cursor-pointer ${
                      selectedGenre === g
                        ? 'bg-[#3869A0] text-white shadow-xs'
                        : 'bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200'
                    }`}
                  >
                    {g} ({count})
                  </button>
                );
              })}
            </div>
          </div>

          {/* ========================================================= */}
          {/* TRACKS DISPLAY: GRID OR LIST                             */}
          {/* ========================================================= */}
          {filteredTracks.length === 0 ? (
            <div className="bg-white dark:bg-slate-900 rounded-lg border border-[#ccd5df] dark:border-slate-800 p-12 text-center space-y-3">
              <div className="w-12 h-12 rounded-full bg-blue-50 dark:bg-blue-950/40 text-[#3869A0] flex items-center justify-center mx-auto">
                <Music className="w-6 h-6" />
              </div>
              <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                No se encontraron canciones con ese filtro
              </p>
              <button
                onClick={() => {
                  setSearchQuery('');
                  setSelectedGenre('todos');
                }}
                className="px-3 py-1.5 bg-[#3869A0] text-white text-xs font-bold rounded cursor-pointer"
              >
                Restablecer filtros
              </button>
            </div>
          ) : viewMode === 'grid' ? (
            /* ============ GRID VIEW ============ */
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3.5">
              {filteredTracks.map(track => {
                const isSelected = currentTrack?.id === track.id;
                const isPlayingThis = isSelected && isMusicPlaying;

                return (
                  <div
                    key={track.id}
                    className={`group bg-white dark:bg-slate-900 rounded-lg border overflow-hidden transition-all duration-200 hover:shadow-md flex flex-col ${
                      isSelected
                        ? 'border-[#3869A0] ring-2 ring-[#3869A0]/20 dark:ring-blue-400/20'
                        : 'border-[#ccd5df] dark:border-slate-800'
                    }`}
                  >
                    {/* Cover Art Box with Play Overlay */}
                    <div className="relative aspect-square w-full overflow-hidden bg-slate-100 dark:bg-slate-800">
                      <img 
                        src={track.coverUrl} 
                        alt={track.title} 
                        className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                      />
                      
                      {/* Play Button Overlay */}
                      <div 
                        onClick={() => {
                          if (isSelected) {
                            togglePlayMusic();
                          } else {
                            playTrack(track);
                          }
                        }}
                        className={`absolute inset-0 bg-black/40 flex items-center justify-center transition-opacity cursor-pointer ${
                          isPlayingThis ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
                        }`}
                      >
                        <div className="w-11 h-11 rounded-full bg-[#3869A0] text-white flex items-center justify-center shadow-lg transform active:scale-95">
                          {isPlayingThis ? (
                            <Pause className="w-5 h-5" />
                          ) : (
                            <Play className="w-5 h-5 fill-current ml-0.5" />
                          )}
                        </div>
                      </div>

                      {/* Genre Tag */}
                      <span className="absolute top-2 left-2 bg-black/60 backdrop-blur-xs text-white text-[9px] font-bold px-1.5 py-0.5 rounded">
                        {track.genre || 'Pop'}
                      </span>

                      {/* Year badge */}
                      {track.year && (
                        <span className="absolute bottom-2 right-2 bg-[#3869A0]/80 text-white text-[9px] font-mono px-1 py-0.5 rounded">
                          {track.year}
                        </span>
                      )}
                    </div>

                    {/* Metadata & Actions */}
                    <div className="p-2.5 flex-1 flex flex-col justify-between space-y-2">
                      <div>
                        <h4 
                          onClick={() => playTrack(track)}
                          className="font-bold text-xs text-gray-900 dark:text-white truncate hover:text-[#3869A0] cursor-pointer" 
                          title={track.title}
                        >
                          {track.title}
                        </h4>
                        <p className="text-[11px] text-gray-500 dark:text-gray-400 truncate">
                          {track.artist}
                        </p>
                      </div>

                      <div className="pt-2 border-t border-gray-100 dark:border-slate-800 flex items-center justify-between text-[11px]">
                        <span className="text-gray-400 font-mono">{formatTime(track.duration)}</span>
                        
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => handleSetAsProfileSong(track)}
                            className="p-1 rounded hover:bg-rose-50 text-gray-400 hover:text-rose-500 transition cursor-pointer"
                            title="Poner como canción de mi perfil"
                          >
                            <Heart className="w-3.5 h-3.5" />
                          </button>

                          {musicPlaylist.length > 1 && (
                            <button
                              onClick={() => removeTrackFromPlaylist(track.id)}
                              className="p-1 rounded hover:bg-red-50 text-gray-400 hover:text-red-500 transition cursor-pointer"
                              title="Eliminar de mi lista"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            /* ============ LIST VIEW ============ */
            <div className="bg-white dark:bg-slate-900 rounded-lg border border-[#ccd5df] dark:border-slate-800 overflow-hidden shadow-xs">
              <div className="grid grid-cols-12 px-4 py-2 bg-gray-50 dark:bg-slate-800/80 border-b border-gray-200 dark:border-slate-800 text-[11px] font-bold text-gray-500 uppercase tracking-wider">
                <div className="col-span-1 text-center">#</div>
                <div className="col-span-5">Título / Artista</div>
                <div className="col-span-3">Género / Álbum</div>
                <div className="col-span-1 text-center">Duración</div>
                <div className="col-span-2 text-right">Acciones</div>
              </div>

              <div className="divide-y divide-gray-100 dark:divide-slate-800">
                {filteredTracks.map((track, index) => {
                  const isSelected = currentTrack?.id === track.id;
                  const isPlayingThis = isSelected && isMusicPlaying;

                  return (
                    <div
                      key={track.id}
                      onClick={() => playTrack(track)}
                      className={`grid grid-cols-12 items-center px-4 py-2.5 transition cursor-pointer ${
                        isSelected
                          ? 'bg-blue-50/80 dark:bg-blue-950/40 text-[#3869A0] font-semibold'
                          : 'hover:bg-gray-50 dark:hover:bg-slate-800/60 text-gray-800 dark:text-gray-200'
                      }`}
                    >
                      {/* Index / Playing icon */}
                      <div className="col-span-1 text-center text-xs">
                        {isPlayingThis ? (
                          <Disc className="w-4 h-4 text-[#3869A0] animate-spin mx-auto" />
                        ) : (
                          <span className="text-gray-400 font-mono">{index + 1}</span>
                        )}
                      </div>

                      {/* Title & Cover */}
                      <div className="col-span-5 flex items-center gap-2.5 min-w-0 pr-2">
                        <div className="relative w-8 h-8 rounded overflow-hidden flex-shrink-0 border border-gray-200 dark:border-slate-700">
                          <img src={track.coverUrl} alt="" className="w-full h-full object-cover" />
                        </div>
                        <div className="min-w-0">
                          <p className={`text-xs truncate ${isSelected ? 'font-bold text-[#3869A0] dark:text-blue-300' : ''}`}>
                            {track.title}
                          </p>
                          <p className="text-[11px] text-gray-400 dark:text-gray-500 truncate">
                            {track.artist}
                          </p>
                        </div>
                      </div>

                      {/* Genre & Album */}
                      <div className="col-span-3 min-w-0 text-xs text-gray-500 dark:text-gray-400 truncate pr-2">
                        <span>{track.genre || 'Pop'}</span>
                        {track.album && <span className="text-gray-400 block text-[10px] truncate">{track.album}</span>}
                      </div>

                      {/* Duration */}
                      <div className="col-span-1 text-center font-mono text-xs text-gray-400">
                        {formatTime(track.duration)}
                      </div>

                      {/* Actions */}
                      <div 
                        onClick={e => e.stopPropagation()}
                        className="col-span-2 flex items-center justify-end gap-1.5"
                      >
                        <button
                          onClick={() => {
                            if (isPlayingThis) {
                              togglePlayMusic();
                            } else {
                              playTrack(track);
                            }
                          }}
                          className="p-1 rounded bg-[#3869A0] hover:bg-[#2c537f] text-white transition cursor-pointer"
                          title={isPlayingThis ? 'Pausar' : 'Reproducir'}
                        >
                          {isPlayingThis ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5 fill-current ml-0.5" />}
                        </button>

                        <button
                          onClick={() => handleSetAsProfileSong(track)}
                          className="p-1 rounded hover:bg-rose-50 text-gray-400 hover:text-rose-500 transition cursor-pointer"
                          title="Poner como música de mi perfil"
                        >
                          <Heart className="w-3.5 h-3.5" />
                        </button>

                        {musicPlaylist.length > 1 && (
                          <button
                            onClick={() => removeTrackFromPlaylist(track.id)}
                            className="p-1 rounded hover:bg-red-50 text-gray-400 hover:text-red-500 transition cursor-pointer"
                            title="Eliminar pista"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ========================================================= */}
      {/* MODAL: AÑADIR CANCIÓN PERSONALIZADA                      */}
      {/* ========================================================= */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-gray-300 dark:border-slate-700 rounded-xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95">
            <div className="bg-[#3869A0] text-white px-4 py-3 flex items-center justify-between">
              <div className="flex items-center gap-2 font-bold text-sm">
                <Music className="w-4 h-4" />
                <span>Añadir Canción a Inkorium</span>
              </div>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-white hover:text-gray-200 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddTrackSubmit} className="p-4 space-y-3.5 text-xs">
              <div>
                <label className="font-bold text-gray-700 dark:text-gray-300 block mb-1">
                  Título de la canción *
                </label>
                <input
                  type="text"
                  required
                  value={newTitle}
                  onChange={e => setNewTitle(e.target.value)}
                  placeholder="Ej: Amores de Verano 2007"
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
                  placeholder="Ej: Melocos & Pignoise"
                  className="w-full p-2 rounded border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-gray-900 dark:text-white focus:outline-none focus:border-[#3869A0]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
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
                    Año
                  </label>
                  <input
                    type="number"
                    min={1990}
                    max={2030}
                    value={newYear}
                    onChange={e => setNewYear(parseInt(e.target.value) || 2008)}
                    className="w-full p-2 rounded border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-gray-900 dark:text-white focus:outline-none focus:border-[#3869A0]"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-gray-700 dark:text-gray-300 block mb-1">
                  Carátula (URL de imagen)
                </label>
                <input
                  type="url"
                  value={newCoverUrl}
                  onChange={e => setNewCoverUrl(e.target.value)}
                  placeholder="https://images.unsplash.com/..."
                  className="w-full p-2 rounded border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-gray-900 dark:text-white focus:outline-none focus:border-[#3869A0]"
                />
              </div>

              <div>
                <label className="font-bold text-gray-700 dark:text-gray-300 block mb-1">
                  Enlace Audio MP3 (Opcional)
                </label>
                <input
                  type="url"
                  value={newAudioUrl}
                  onChange={e => setNewAudioUrl(e.target.value)}
                  placeholder="https://.../audio.mp3"
                  className="w-full p-2 rounded border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-gray-900 dark:text-white focus:outline-none focus:border-[#3869A0]"
                />
                <p className="text-[11px] text-gray-400 mt-1">
                  💡 Si no proporcionas una URL directa a un archivo MP3, el sintetizador Web Audio polifónico de Inkorium generará la música en tiempo real.
                </p>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-gray-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-3 py-1.5 rounded border border-gray-300 dark:border-slate-700 text-gray-600 dark:text-gray-300 hover:bg-gray-100 cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-[#3869A0] hover:bg-[#2c537f] text-white font-bold rounded cursor-pointer shadow-xs"
                >
                  Añadir Canción
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
