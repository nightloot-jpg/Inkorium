import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useInkorium } from '../context/InkoriumContext';
import { 
  Play, Pause, Music, Search, Plus, ListMusic, Sparkles, 
  Disc, Radio, Heart, Filter, LayoutGrid, List, Flame, 
  Headset, Clock, User, X, Check, Share2, Youtube, ExternalLink,
  ChevronRight, RefreshCw, Layers, Loader2, Eye, UploadCloud, FolderUp
} from 'lucide-react';
import { Track, SocialPlaylist, CommunityListeningActivity, YouTubeVideoResult } from '../types';
import { INITIAL_TRACKS_CATALOG, INITIAL_COMMUNITY_PLAYLISTS, INITIAL_COMMUNITY_LISTENING } from '../data/musicData';
import { searchYouTubeVideos, convertYouTubeToTrack } from '../lib/youtubeApi';
import { MusicSongCard } from './MusicSongCard';
import { PlaylistCard } from './PlaylistCard';
import { PlaylistDetailModal } from './PlaylistDetailModal';
import { MusicComposer } from './MusicComposer';
import { CommunityListeningFeed } from './CommunityListeningFeed';
import { YouTubeSearchPlayer } from './YouTubeSearchPlayer';

export const MusicView: React.FC = () => {
  const {
    currentUser,
    updateUserData,
    currentTrack,
    isMusicPlaying,
    playTrack,
    togglePlayMusic,
    musicPlaylist,
    addCustomTrack,
    playlists,
    userPlaylists,
    createPlaylist,
    addTrackToPlaylist,
    playPlaylist,
    toggleLikePlaylist
  } = useInkorium();

  // Search & Category State
  const [searchInput, setSearchInput] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<'todas' | 'youtube' | 'canciones' | 'artistas' | 'albumes' | 'playlists'>('todas');
  const [selectedGenre, setSelectedGenre] = useState<string>('todos');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  // YouTube Live Search State
  const [youtubeResults, setYoutubeResults] = useState<YouTubeVideoResult[]>([]);
  const [isSearchingYouTube, setIsSearchingYouTube] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);

  // Selected Playlist for Detail Modal
  const [selectedPlaylistIdForDetail, setSelectedPlaylistIdForDetail] = useState<string | null>(null);

  // Community Listening Activity
  const [listeningActivities, setListeningActivities] = useState<CommunityListeningActivity[]>(INITIAL_COMMUNITY_LISTENING);
  const [communityTab, setCommunityTab] = useState<'populares' | 'nuevas' | 'amigos' | 'tuenti_classic'>('populares');

  // Modals
  const [composerMode, setComposerMode] = useState<'add_song' | 'create_playlist' | 'add_to_playlist' | 'upload_pc' | null>(null);
  const [selectedTrackForComposer, setSelectedTrackForComposer] = useState<Track | null>(null);

  // Trigger YouTube Search function
  const triggerYouTubeSearch = useCallback(async (query: string) => {
    const q = query.trim();
    if (!q) {
      setYoutubeResults([]);
      setIsSearchingYouTube(false);
      return;
    }
    setIsSearchingYouTube(true);
    setSearchError(null);
    try {
      const results = await searchYouTubeVideos(q);
      setYoutubeResults(results);
    } catch (err) {
      console.error('Error al buscar en YouTube:', err);
      setSearchError('No se pudieron obtener resultados de YouTube en este momento.');
    } finally {
      setIsSearchingYouTube(false);
    }
  }, []);

  // Debounce search input (300ms)
  useEffect(() => {
    const handler = setTimeout(() => {
      const q = searchInput.trim();
      setDebouncedSearch(q.toLowerCase());
      if (q.length >= 2) {
        triggerYouTubeSearch(q);
      } else {
        setYoutubeResults([]);
      }
    }, 300);
    return () => clearTimeout(handler);
  }, [searchInput, triggerYouTubeSearch]);

  const handleManualSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchInput.trim()) {
      setDebouncedSearch(searchInput.trim().toLowerCase());
      triggerYouTubeSearch(searchInput.trim());
    }
  };

  // Combined Track Catalog (Initial catalog + user's custom added tracks in context)
  const allAvailableTracks = useMemo(() => {
    const seen = new Set<string>();
    const combined: Track[] = [];

    // Add context playlist items first
    for (const t of musicPlaylist) {
      if (!seen.has(t.id)) {
        seen.add(t.id);
        combined.push(t);
      }
    }

    // Add initial catalog items
    for (const t of INITIAL_TRACKS_CATALOG) {
      if (!seen.has(t.id)) {
        seen.add(t.id);
        combined.push(t);
      }
    }

    return combined;
  }, [musicPlaylist]);

  // Filtered Tracks based on debounced search and genre
  const filteredTracks = useMemo(() => {
    return allAvailableTracks.filter(track => {
      const matchText = !debouncedSearch || 
        track.title.toLowerCase().includes(debouncedSearch) ||
        track.artist.toLowerCase().includes(debouncedSearch) ||
        (track.album && track.album.toLowerCase().includes(debouncedSearch)) ||
        (track.genre && track.genre.toLowerCase().includes(debouncedSearch));

      const matchGenre = selectedGenre === 'todos' || track.genre?.toLowerCase() === selectedGenre.toLowerCase();

      if (selectedCategory === 'artistas') {
        return !debouncedSearch || track.artist.toLowerCase().includes(debouncedSearch);
      }
      if (selectedCategory === 'albumes') {
        return !debouncedSearch || (track.album && track.album.toLowerCase().includes(debouncedSearch));
      }

      return matchText && matchGenre;
    });
  }, [allAvailableTracks, debouncedSearch, selectedGenre, selectedCategory]);

  // Filtered Playlists based on debounced search
  const filteredPlaylists = useMemo(() => {
    if (!debouncedSearch) return playlists;
    return playlists.filter(p => 
      p.name.toLowerCase().includes(debouncedSearch) ||
      (p.description && p.description.toLowerCase().includes(debouncedSearch)) ||
      p.creatorName.toLowerCase().includes(debouncedSearch) ||
      p.tracks.some(t => t.title.toLowerCase().includes(debouncedSearch) || t.artist.toLowerCase().includes(debouncedSearch))
    );
  }, [playlists, debouncedSearch]);

  // Distinct genres for filters
  const availableGenres = useMemo(() => {
    const genres = new Set<string>();
    allAvailableTracks.forEach(t => {
      if (t.genre) genres.add(t.genre);
    });
    return Array.from(genres);
  }, [allAvailableTracks]);

  // Handlers for Playlist creation and modification
  const handleCreatePlaylist = (newPlData: any) => {
    createPlaylist({
      name: newPlData.name,
      description: newPlData.description,
      coverUrl: newPlData.coverUrl,
      category: newPlData.category,
      isCollaborative: newPlData.isCollaborative,
      isPrivate: newPlData.isPrivate,
      initialTracks: newPlData.tracks || []
    });
  };

  const handleAddSongToPlaylist = (track: Track, playlistId: string) => {
    addTrackToPlaylist(playlistId, track);
  };

  const handlePlayPlaylist = (pl: SocialPlaylist) => {
    playPlaylist(pl, 0);
  };

  const handlePlayYouTubeVideo = (video: YouTubeVideoResult) => {
    const track = convertYouTubeToTrack(video);
    playTrack(track);
  };

  const myPlaylists = userPlaylists;

  const communityFilteredPlaylists = useMemo(() => {
    if (communityTab === 'populares') {
      return [...playlists].sort((a, b) => ((b.likes?.length || 0) - (a.likes?.length || 0)));
    }
    if (communityTab === 'nuevas') {
      return [...playlists].reverse();
    }
    if (communityTab === 'tuenti_classic') {
      return playlists.filter(p => p.category === 'tuenti_classic');
    }
    return playlists.filter(p => p.category === 'amigos' || p.creatorId !== currentUser.id);
  }, [playlists, communityTab, currentUser.id]);

  const selectedPlaylistForDetail = useMemo(() => {
    if (!selectedPlaylistIdForDetail) return null;
    return playlists.find(p => p.id === selectedPlaylistIdForDetail) || null;
  }, [playlists, selectedPlaylistIdForDetail]);

  return (
    <div className="w-full max-w-[1720px] 2xl:max-w-[1850px] mx-auto px-3 sm:px-6 lg:px-8 py-4 space-y-5 pb-24">
      
      {/* ========================================================= */}
      {/* 1. HEADER                                                 */}
      {/* ========================================================= */}
      <div className="bg-white dark:bg-slate-900 rounded border border-[#ccd5df] dark:border-slate-800 p-4 sm:p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded bg-[#3869A0] text-white flex items-center justify-center shadow-xs">
              <Disc className="w-5 h-5 animate-spin-slow" />
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white tracking-tight">
              Inkorium Música
            </h1>
            <span className="text-[10px] bg-red-100 dark:bg-red-950 text-red-600 dark:text-red-300 font-bold px-2 py-0.5 rounded flex items-center gap-1">
              <Youtube className="w-3 h-3" />
              YouTube Player
            </span>
          </div>
          <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 max-w-2xl leading-relaxed">
            Busca cualquier canción o artista directamente en YouTube o en el catálogo de Inkorium y reprodúcela al instante. Añade temas a tu perfil y crea playlists míticas.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            onClick={() => setComposerMode('add_song')}
            className="px-3.5 py-2 bg-white dark:bg-slate-800 hover:bg-gray-50 dark:hover:bg-slate-700 text-[#3869A0] dark:text-blue-300 border border-[#ccd5df] dark:border-slate-700 rounded text-xs font-bold transition flex items-center gap-1.5 shadow-xs cursor-pointer"
          >
            <Music className="w-3.5 h-3.5" />
            <span>Añadir canción</span>
          </button>

          <button
            onClick={() => setComposerMode('create_playlist')}
            className="px-4 py-2 bg-[#3869A0] hover:bg-[#2c537f] text-white rounded text-xs font-bold transition flex items-center gap-1.5 shadow-xs cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Crear playlist</span>
          </button>
        </div>
      </div>

      {/* ========================================================= */}
      {/* 2. BUSCADOR & CATEGORÍAS (CONECTADO A YOUTUBE & PLAYLISTS)  */}
      {/* ========================================================= */}
      <div className="bg-white dark:bg-slate-900 rounded border border-[#ccd5df] dark:border-slate-800 p-3 sm:p-4 shadow-xs space-y-3">
        {/* Large Input with Form Submit */}
        <form onSubmit={handleManualSearchSubmit} className="relative flex items-center gap-2">
          <div className="relative flex-1 flex items-center">
            <Search className="w-5 h-5 text-gray-400 absolute left-3.5" />
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Buscar canciones, artistas o playlists en YouTube y en Inkorium (ej. Rock 2000s, Cascada, Bad Bunny, Tuenti)..."
              className="w-full pl-11 pr-24 py-2.5 bg-gray-50 dark:bg-slate-800/80 border border-gray-200 dark:border-slate-700 rounded text-xs sm:text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:border-[#3869A0] focus:ring-1 focus:ring-[#3869A0]/20 transition"
            />
            {searchInput && (
              <button
                type="button"
                onClick={() => {
                  setSearchInput('');
                  setYoutubeResults([]);
                }}
                className="absolute right-3 p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
          
          <button
            type="submit"
            disabled={isSearchingYouTube || !searchInput.trim()}
            className="px-4 py-2.5 bg-[#3869A0] hover:bg-[#2c537f] disabled:bg-gray-300 dark:disabled:bg-slate-700 text-white rounded text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-xs whitespace-nowrap"
          >
            {isSearchingYouTube ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Buscando...</span>
              </>
            ) : (
              <>
                <Youtube className="w-4 h-4 text-red-300" />
                <span>Buscar</span>
              </>
            )}
          </button>
        </form>

        {/* Category Pills */}
        <div className="flex items-center justify-between gap-2.5 pt-1 border-t border-gray-100 dark:border-slate-800">
          {/* Main Categories */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
            {([
              { id: 'todas', label: 'Todos los resultados', icon: null, badgeColor: '' },
              { id: 'playlists', label: 'Playlists', icon: ListMusic, badgeColor: 'text-indigo-500' },
              { id: 'canciones', label: 'Canciones', icon: Music, badgeColor: 'text-emerald-500' },
              { id: 'youtube', label: 'YouTube', icon: Youtube, badgeColor: 'text-red-500' },
              { id: 'artistas', label: 'Artistas', icon: User, badgeColor: 'text-amber-500' },
              { id: 'albumes', label: 'Álbumes', icon: Disc, badgeColor: 'text-purple-500' },
            ] as const).map(({ id, label, icon: IconComponent, badgeColor }) => {
              const isSelected = selectedCategory === id;
              const countBadge = debouncedSearch
                ? id === 'playlists'
                  ? filteredPlaylists.length
                  : id === 'canciones'
                  ? filteredTracks.length
                  : id === 'youtube'
                  ? youtubeResults.length
                  : null
                : id === 'playlists'
                ? playlists.length
                : null;

              return (
                <button
                  key={id}
                  type="button"
                  onClick={() => setSelectedCategory(id as any)}
                  className={`px-3 py-1.5 rounded text-xs font-semibold capitalize transition cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
                    isSelected
                      ? 'bg-[#3869A0] text-white shadow-xs'
                      : 'bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-slate-700'
                  }`}
                >
                  {IconComponent && (
                    <IconComponent className={`w-3.5 h-3.5 ${isSelected ? 'text-white' : badgeColor || ''}`} />
                  )}
                  <span>{label}</span>
                  {countBadge !== null && (
                    <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                      isSelected 
                        ? 'bg-white/25 text-white' 
                        : 'bg-gray-200 dark:bg-slate-700 text-gray-600 dark:text-gray-300'
                    }`}>
                      {countBadge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* ========================================================= */}
      {/* 3. CONTENIDO PRINCIPAL (2 COLUMNAS: 70% / 30%)             */}
      {/* ========================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        
        {/* ========================================================= */}
        {/* LEFT COLUMN (~70%): DESCUBRIMIENTO Y RESULTADOS          */}
        {/* ========================================================= */}
        <div className="lg:col-span-8 xl:col-span-8 2xl:col-span-8 space-y-6">
          
          {/* SEARCH RESULTS VIEW (if user typed a query) */}
          {debouncedSearch ? (
            <div className="space-y-6">
              <div className="flex items-center justify-between pb-2 border-b border-gray-200 dark:border-slate-800">
                <div className="flex items-center gap-2">
                  <Search className="w-4 h-4 text-[#3869A0]" />
                  <h2 className="font-bold text-sm text-gray-900 dark:text-white">
                    Resultados para "{searchInput}"
                  </h2>
                  {isSearchingYouTube && (
                    <span className="text-[11px] text-[#3869A0] flex items-center gap-1 animate-pulse font-medium">
                      <Loader2 className="w-3 h-3 animate-spin" />
                      Buscando en YouTube...
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-1 bg-gray-100 dark:bg-slate-800 p-0.5 rounded border border-gray-200 dark:border-slate-700">
                  <button
                    onClick={() => setViewMode('grid')}
                    className={`p-1 rounded transition cursor-pointer ${viewMode === 'grid' ? 'bg-white dark:bg-slate-700 text-[#3869A0] shadow-xs' : 'text-gray-400'}`}
                    title="Vista en cuadrícula"
                  >
                    <LayoutGrid className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => setViewMode('list')}
                    className={`p-1 rounded transition cursor-pointer ${viewMode === 'list' ? 'bg-white dark:bg-slate-700 text-[#3869A0] shadow-xs' : 'text-gray-400'}`}
                    title="Vista en lista"
                  >
                    <List className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* YOUTUBE RESULTS SECTION */}
              {(selectedCategory === 'todas' || selectedCategory === 'youtube') && (
                <div className="space-y-3 bg-red-50/40 dark:bg-red-950/20 p-3.5 rounded border border-red-200/80 dark:border-red-900/40">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded bg-red-600 text-white flex items-center justify-center shadow-xs">
                        <Youtube className="w-3.5 h-3.5" />
                      </div>
                      <h3 className="font-bold text-xs sm:text-sm text-gray-900 dark:text-white">
                        Canciones en YouTube ({youtubeResults.length})
                      </h3>
                    </div>
                    <span className="text-[10px] text-red-600 dark:text-red-400 font-bold uppercase tracking-wider">
                      Reproducción Directa
                    </span>
                  </div>

                  {isSearchingYouTube ? (
                    <div className="py-8 text-center text-xs text-gray-500 flex flex-col items-center justify-center gap-2">
                      <Loader2 className="w-6 h-6 text-red-500 animate-spin" />
                      <p>Sintonizando canciones en YouTube...</p>
                    </div>
                  ) : youtubeResults.length > 0 ? (
                    <div className={viewMode === 'grid' ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3" : "space-y-2"}>
                      {youtubeResults.map(video => {
                        const track = convertYouTubeToTrack(video);
                        const isCurrent = currentTrack?.youtubeId === video.id || currentTrack?.id === track.id;
                        const isPlaying = isCurrent && isMusicPlaying;

                        return (
                          <div
                            key={video.id}
                            onClick={() => handlePlayYouTubeVideo(video)}
                            className={`p-2.5 rounded border transition group cursor-pointer flex flex-col justify-between ${
                              isCurrent
                                ? 'bg-red-50 dark:bg-red-950/60 border-red-400 shadow-xs'
                                : 'bg-white dark:bg-slate-900 border-gray-200 dark:border-slate-800 hover:border-red-300 hover:shadow-xs'
                            }`}
                          >
                            <div className="flex items-start gap-3">
                              {/* Thumbnail */}
                              <div className="relative w-20 h-14 rounded overflow-hidden bg-black flex-shrink-0 border border-gray-300 dark:border-slate-700">
                                <img
                                  src={video.thumbnail}
                                  alt={video.title}
                                  className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                                />
                                <div className="absolute inset-0 bg-black/30 group-hover:bg-black/50 flex items-center justify-center transition">
                                  {isPlaying ? (
                                    <div className="w-7 h-7 rounded-full bg-red-600 text-white flex items-center justify-center shadow">
                                      <Pause className="w-4 h-4 fill-current" />
                                    </div>
                                  ) : (
                                    <div className="w-7 h-7 rounded-full bg-red-600 text-white flex items-center justify-center shadow opacity-90 group-hover:opacity-100 group-hover:scale-110 transition">
                                      <Play className="w-4 h-4 fill-current ml-0.5" />
                                    </div>
                                  )}
                                </div>
                                <span className="absolute bottom-1 right-1 bg-black/80 text-white text-[9px] px-1 rounded font-mono">
                                  {video.duration}
                                </span>
                              </div>

                              {/* Details */}
                              <div className="flex-1 min-w-0">
                                <h4 className="font-bold text-xs text-gray-900 dark:text-white line-clamp-2 leading-tight group-hover:text-red-600 transition">
                                  {video.title}
                                </h4>
                                <p className="text-[11px] text-gray-500 dark:text-gray-400 truncate mt-0.5">
                                  {video.channelTitle}
                                </p>
                                {video.views && (
                                  <p className="text-[10px] text-gray-400">
                                    {video.views}
                                  </p>
                                )}
                              </div>
                            </div>

                            {/* Actions Bar */}
                            <div className="flex items-center justify-between pt-2 mt-2 border-t border-gray-100 dark:border-slate-800 text-[11px]">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handlePlayYouTubeVideo(video);
                                }}
                                className="text-red-600 dark:text-red-400 font-bold hover:underline flex items-center gap-1 cursor-pointer"
                              >
                                <Play className="w-3 h-3 fill-current" />
                                <span>{isPlaying ? 'Pausar' : 'Reproducir'}</span>
                              </button>

                              <div className="flex items-center gap-1.5">
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    const songString = `${video.title} - ${video.channelTitle}`;
                                    updateUserData({ musica: songString });
                                  }}
                                  className="p-1 text-gray-400 hover:text-rose-500 transition cursor-pointer"
                                  title="Poner en mi perfil"
                                >
                                  <Heart className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setSelectedTrackForComposer(track);
                                    setComposerMode('add_to_playlist');
                                  }}
                                  className="p-1 text-gray-400 hover:text-[#3869A0] transition cursor-pointer"
                                  title="Añadir a playlist"
                                >
                                  <Plus className="w-3.5 h-3.5" />
                                </button>
                                <a
                                  href={video.youtubeUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  onClick={(e) => e.stopPropagation()}
                                  className="p-1 text-gray-400 hover:text-red-500 transition"
                                  title="Abrir en YouTube"
                                >
                                  <ExternalLink className="w-3.5 h-3.5" />
                                </a>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <p className="text-xs text-gray-500 py-2">
                      No se encontraron vídeos directos de YouTube para esta búsqueda.
                    </p>
                  )}
                </div>
              )}

              {/* Matched Playlists Section (Shown first if playlists category selected or if matches exist in 'todas') */}
              {(selectedCategory === 'todas' || selectedCategory === 'playlists') && (
                <div className="space-y-3 bg-indigo-50/40 dark:bg-indigo-950/20 p-3.5 rounded border border-indigo-200/80 dark:border-indigo-900/40">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded bg-[#3869A0] text-white flex items-center justify-center shadow-xs">
                        <ListMusic className="w-3.5 h-3.5" />
                      </div>
                      <h3 className="font-bold text-xs sm:text-sm text-gray-900 dark:text-white">
                        Playlists Coincidentes ({filteredPlaylists.length})
                      </h3>
                    </div>
                    {filteredPlaylists.length > 0 && (
                      <span className="text-[10px] text-indigo-600 dark:text-indigo-400 font-bold uppercase tracking-wider">
                        {filteredPlaylists.length} encontrada{filteredPlaylists.length !== 1 ? 's' : ''}
                      </span>
                    )}
                  </div>

                  {filteredPlaylists.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {filteredPlaylists.map(pl => (
                        <PlaylistCard
                          key={pl.id}
                          playlist={pl}
                          onSelectPlaylist={(p) => setSelectedPlaylistIdForDetail(p.id)}
                          onPlayPlaylist={handlePlayPlaylist}
                        />
                      ))}
                    </div>
                  ) : selectedCategory === 'playlists' ? (
                    <div className="py-8 text-center text-xs text-gray-500 flex flex-col items-center justify-center gap-2 bg-white/60 dark:bg-slate-900/60 rounded border border-indigo-100 dark:border-slate-800 p-4">
                      <ListMusic className="w-8 h-8 text-indigo-400/80" />
                      <p className="font-medium text-gray-700 dark:text-gray-300">
                        No se encontraron playlists para "{searchInput}"
                      </p>
                      <p className="text-[11px] text-gray-400">
                        ¿Quieres crear una playlist con este nombre?
                      </p>
                      <button
                        onClick={() => setComposerMode('create_playlist')}
                        className="mt-1 px-3 py-1.5 bg-[#3869A0] hover:bg-[#2c537f] text-white rounded text-xs font-semibold cursor-pointer shadow-xs flex items-center gap-1.5"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Crear playlist "{searchInput}"</span>
                      </button>
                    </div>
                  ) : (
                    <p className="text-xs text-gray-500 py-1">
                      No se encontraron playlists con el nombre o contenido "{searchInput}".
                    </p>
                  )}
                </div>
              )}

              {/* Matched Songs from Local Catalog */}
              {(selectedCategory === 'todas' || selectedCategory === 'canciones' || selectedCategory === 'artistas' || selectedCategory === 'albumes') && (
                <div className="space-y-3">
                  <h3 className="font-bold text-xs text-gray-700 dark:text-gray-300 flex items-center gap-1.5">
                    <Music className="w-3.5 h-3.5 text-[#3869A0]" />
                    Canciones del Catálogo Inkorium ({filteredTracks.length})
                  </h3>

                  {filteredTracks.length > 0 ? (
                    viewMode === 'grid' ? (
                      <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-3.5">
                        {filteredTracks.map(track => (
                          <MusicSongCard
                            key={track.id}
                            track={track}
                            playlists={playlists}
                            onOpenAddModal={(t) => {
                              setSelectedTrackForComposer(t);
                              setComposerMode('add_to_playlist');
                            }}
                          />
                        ))}
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {filteredTracks.map(track => (
                          <MusicSongCard
                            key={track.id}
                            track={track}
                            playlists={playlists}
                            layout="list"
                            onOpenAddModal={(t) => {
                              setSelectedTrackForComposer(t);
                              setComposerMode('add_to_playlist');
                            }}
                          />
                        ))}
                      </div>
                    )
                  ) : (
                    <div className="py-6 bg-white dark:bg-slate-900 rounded border border-[#ccd5df] dark:border-slate-800 text-center space-y-2 p-4">
                      <Music className="w-6 h-6 text-gray-300 mx-auto" />
                      <p className="text-xs text-gray-500">No hay más canciones locales para esta búsqueda.</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          ) : (
            /* DEFAULT DISCOVERY VIEW (Rich, Social, Engaging) */
            <div className="space-y-7">
              
              {/* PC UPLOAD CALLOUT BANNER */}
              <div className="bg-gradient-to-r from-emerald-500/10 via-blue-500/10 to-transparent dark:from-emerald-950/30 dark:via-blue-950/30 p-3.5 sm:p-4 rounded-lg border border-emerald-500/20 dark:border-emerald-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-emerald-600 text-white flex items-center justify-center flex-shrink-0 shadow-xs">
                    <UploadCloud className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-xs sm:text-sm text-gray-900 dark:text-white">
                      ¿Tienes canciones en tu PC? (MP3, WAV, OGG, M4A)
                    </h3>
                    <p className="text-[11px] sm:text-xs text-gray-600 dark:text-gray-300">
                      Sube tus temas favoritos desde tu ordenador, reprodúcelos al instante y añádelos a tus playlists.
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setComposerMode('upload_pc')}
                  className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-xs cursor-pointer flex-shrink-0"
                >
                  <FolderUp className="w-4 h-4" />
                  <span>Subir archivo desde PC</span>
                </button>
              </div>

              {/* 4.1 SECCIÓN DESTACADA: TEMAZOS DE INKORIUM */}
              <div className="space-y-3">
                <div className="flex items-center justify-between pb-1.5 border-b border-gray-200 dark:border-slate-800">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-[#3869A0]" />
                    <h2 className="font-bold text-sm text-gray-900 dark:text-white">
                      Temazos Destacados
                    </h2>
                    <span className="text-[10px] bg-red-100 dark:bg-red-950 text-red-600 dark:text-red-400 font-bold px-1.5 py-0.5 rounded">
                      Top Inkorium
                    </span>
                  </div>
                  <span className="text-[11px] text-gray-400">Los más reproducidos</span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-3.5">
                  {allAvailableTracks.slice(0, 4).map(track => (
                    <MusicSongCard
                      key={track.id}
                      track={track}
                      playlists={playlists}
                      onOpenAddModal={(t) => {
                        setSelectedTrackForComposer(t);
                        setComposerMode('add_to_playlist');
                      }}
                    />
                  ))}
                </div>
              </div>

              {/* 4.2 PLAYLISTS RECOMENDADAS & COLECCIONES VISUALES */}
              <div className="space-y-3">
                <div className="flex items-center justify-between pb-1.5 border-b border-gray-200 dark:border-slate-800">
                  <div className="flex items-center gap-2">
                    <ListMusic className="w-4 h-4 text-[#3869A0]" />
                    <h2 className="font-bold text-sm text-gray-900 dark:text-white">
                      Playlists de la Época & Recomendadas
                    </h2>
                  </div>
                  <button
                    onClick={() => setComposerMode('create_playlist')}
                    className="text-xs font-semibold text-[#3869A0] hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <Plus className="w-3 h-3" />
                    <span>Crear mi playlist</span>
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {playlists.slice(0, 4).map(pl => (
                    <PlaylistCard
                      key={pl.id}
                      playlist={pl}
                      onSelectPlaylist={(p) => setSelectedPlaylistIdForDetail(p.id)}
                      onPlayPlaylist={handlePlayPlaylist}
                    />
                  ))}
                </div>
              </div>

              {/* 4.3 TODA LA COLECCIÓN DE ÉXITOS CON FILTROS Y VISTAS */}
              <div className="space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-1.5 border-b border-gray-200 dark:border-slate-800">
                  <div className="flex items-center gap-2">
                    <Disc className="w-4 h-4 text-[#3869A0]" />
                    <h2 className="font-bold text-sm text-gray-900 dark:text-white">
                      Colección Musical de Inkorium ({filteredTracks.length} temas)
                    </h2>
                  </div>

                  {/* Genre filters & View Mode */}
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1 overflow-x-auto text-[11px]">
                      <button
                        onClick={() => setSelectedGenre('todos')}
                        className={`px-2 py-0.5 rounded font-semibold transition cursor-pointer ${
                          selectedGenre === 'todos'
                            ? 'bg-[#3869A0] text-white'
                            : 'bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-gray-300'
                        }`}
                      >
                        Todos
                      </button>
                      {availableGenres.slice(0, 4).map(g => (
                        <button
                          key={g}
                          onClick={() => setSelectedGenre(g)}
                          className={`px-2 py-0.5 rounded font-semibold transition cursor-pointer whitespace-nowrap ${
                            selectedGenre === g
                              ? 'bg-[#3869A0] text-white'
                              : 'bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200'
                          }`}
                        >
                          {g}
                        </button>
                      ))}
                    </div>

                    <div className="flex items-center gap-0.5 bg-gray-100 dark:bg-slate-800 p-0.5 rounded border border-gray-200 dark:border-slate-700">
                      <button
                        onClick={() => setViewMode('grid')}
                        className={`p-1 rounded transition cursor-pointer ${viewMode === 'grid' ? 'bg-white dark:bg-slate-700 text-[#3869A0] shadow-xs' : 'text-gray-400'}`}
                      >
                        <LayoutGrid className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => setViewMode('list')}
                        className={`p-1 rounded transition cursor-pointer ${viewMode === 'list' ? 'bg-white dark:bg-slate-700 text-[#3869A0] shadow-xs' : 'text-gray-400'}`}
                      >
                        <List className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>

                {viewMode === 'grid' ? (
                  <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-3.5">
                    {filteredTracks.map(track => (
                      <MusicSongCard
                        key={track.id}
                        track={track}
                        playlists={playlists}
                        onOpenAddModal={(t) => {
                          setSelectedTrackForComposer(t);
                          setComposerMode('add_to_playlist');
                        }}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="space-y-2">
                    {filteredTracks.map(track => (
                      <MusicSongCard
                        key={track.id}
                        track={track}
                        playlists={playlists}
                        layout="list"
                        onOpenAddModal={(t) => {
                          setSelectedTrackForComposer(t);
                          setComposerMode('add_to_playlist');
                        }}
                      />
                    ))}
                  </div>
                )}
              </div>

              {/* 4.4 BUSCADOR DE YOUTUBE DIRECTO EMBEBIDO */}
              <div className="pt-2">
                <YouTubeSearchPlayer 
                  onSongSelected={(track) => {
                    playTrack(track);
                  }} 
                />
              </div>

            </div>
          )}
        </div>

        {/* ========================================================= */}
        {/* RIGHT COLUMN (~30%): MI MÚSICA, PLAYLISTS Y ACTIVIDAD     */}
        {/* ========================================================= */}
        <div className="lg:col-span-4 xl:col-span-4 2xl:col-span-4 space-y-5">
          
          {/* 1. MÚSICA DE MI PERFIL */}
          <div className="bg-white dark:bg-slate-900 rounded border border-[#ccd5df] dark:border-slate-800 p-3.5 shadow-xs space-y-2.5">
            <div className="flex items-center justify-between pb-1.5 border-b border-gray-100 dark:border-slate-800">
              <span className="font-bold text-xs text-gray-900 dark:text-white flex items-center gap-1.5">
                <Headset className="w-4 h-4 text-[#3869A0]" />
                Canción de tu perfil
              </span>
              <span className="text-[10px] text-gray-400 font-mono">Tuenti Profile</span>
            </div>

            <div className="p-2.5 rounded bg-blue-50/70 dark:bg-blue-950/30 border border-blue-100 dark:border-blue-900/40 text-xs space-y-1.5">
              <p className="text-[11px] text-gray-500 dark:text-gray-400">
                Esta canción se reproduce o muestra en tu perfil cuando tus amigos te visitan:
              </p>
              <div className="font-bold text-xs text-[#3869A0] dark:text-blue-300 flex items-center gap-1.5">
                <Disc className="w-3.5 h-3.5 text-[#3869A0] animate-spin-slow" />
                <span className="truncate">{currentUser.musica || 'Sin canción asignada todavía'}</span>
              </div>
            </div>

            <div className="flex items-center justify-between gap-2 pt-1 text-[11px]">
              <button
                onClick={() => setComposerMode('add_song')}
                className="flex-1 py-1 px-2 border border-gray-200 dark:border-slate-700 hover:border-[#3869A0] rounded text-gray-600 dark:text-gray-300 font-semibold transition cursor-pointer text-center"
              >
                Cambiar canción
              </button>
            </div>
          </div>

          {/* 2. LO QUE ESTÁN ESCUCHANDO (SOCIAL FEED) */}
          <CommunityListeningFeed activities={listeningActivities} />

          {/* 3. PLAYLISTS DE LA COMUNIDAD */}
          <div className="bg-white dark:bg-slate-900 rounded border border-[#ccd5df] dark:border-slate-800 shadow-xs overflow-hidden">
            <div className="bg-[#3869A0] text-white px-3.5 py-2.5 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Radio className="w-4 h-4 text-blue-200" />
                <h3 className="font-bold text-xs">Playlists de la comunidad</h3>
              </div>
              <button
                onClick={() => setComposerMode('create_playlist')}
                className="text-[10px] bg-white/20 hover:bg-white/30 text-white font-bold px-2 py-0.5 rounded transition cursor-pointer"
              >
                + Crear
              </button>
            </div>

            {/* Tab filter */}
            <div className="grid grid-cols-4 p-1.5 bg-gray-100 dark:bg-slate-800 text-[10px] font-bold border-b border-gray-200 dark:border-slate-700">
              <button
                onClick={() => setCommunityTab('populares')}
                className={`py-1 rounded text-center transition cursor-pointer ${communityTab === 'populares' ? 'bg-white dark:bg-slate-700 text-[#3869A0] shadow-xs' : 'text-gray-500'}`}
              >
                Populares
              </button>
              <button
                onClick={() => setCommunityTab('nuevas')}
                className={`py-1 rounded text-center transition cursor-pointer ${communityTab === 'nuevas' ? 'bg-white dark:bg-slate-700 text-[#3869A0] shadow-xs' : 'text-gray-500'}`}
              >
                Nuevas
              </button>
              <button
                onClick={() => setCommunityTab('tuenti_classic')}
                className={`py-1 rounded text-center transition cursor-pointer ${communityTab === 'tuenti_classic' ? 'bg-white dark:bg-slate-700 text-[#3869A0] shadow-xs' : 'text-gray-500'}`}
              >
                Tuenti
              </button>
              <button
                onClick={() => setCommunityTab('amigos')}
                className={`py-1 rounded text-center transition cursor-pointer ${communityTab === 'amigos' ? 'bg-white dark:bg-slate-700 text-[#3869A0] shadow-xs' : 'text-gray-500'}`}
              >
                Amigos
              </button>
            </div>

            {/* Playlists List */}
            <div className="p-3 space-y-2 max-h-72 overflow-y-auto divide-y divide-gray-100 dark:divide-slate-800">
              {communityFilteredPlaylists.map(pl => (
                <div
                  key={pl.id}
                  onClick={() => setSelectedPlaylistIdForDetail(pl.id)}
                  className="pt-2 first:pt-0 flex items-center justify-between gap-2.5 group cursor-pointer"
                >
                  <img src={pl.coverUrl} alt="" className="w-10 h-10 rounded object-cover flex-shrink-0 border border-gray-200 dark:border-slate-700" />
                  <div className="flex-1 min-w-0">
                    <h4 className="font-bold text-xs text-gray-900 dark:text-white group-hover:text-[#3869A0] truncate">
                      {pl.name}
                    </h4>
                    <p className="text-[10px] text-gray-400 truncate">
                      Por {pl.creatorName} • {pl.tracks?.length || pl.songsCount || 0} canciones
                    </p>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handlePlayPlaylist(pl);
                    }}
                    className="w-7 h-7 rounded-full bg-blue-50 dark:bg-blue-950/40 text-[#3869A0] dark:text-blue-300 flex items-center justify-center hover:bg-[#3869A0] hover:text-white transition cursor-pointer flex-shrink-0"
                    title="Reproducir playlist"
                  >
                    <Play className="w-3.5 h-3.5 fill-current ml-0.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* 4. MIS PLAYLISTS CREADAS */}
          <div className="bg-white dark:bg-slate-900 rounded border border-[#ccd5df] dark:border-slate-800 p-3.5 shadow-xs space-y-3">
            <div className="flex items-center justify-between pb-1.5 border-b border-gray-100 dark:border-slate-800">
              <span className="font-bold text-xs text-gray-900 dark:text-white flex items-center gap-1.5">
                <ListMusic className="w-4 h-4 text-[#3869A0]" />
                Mis Playlists ({myPlaylists.length})
              </span>
              <button
                onClick={() => setComposerMode('create_playlist')}
                className="text-[11px] text-[#3869A0] font-bold hover:underline cursor-pointer"
              >
                + Nueva
              </button>
            </div>

            {myPlaylists.length > 0 ? (
              <div className="space-y-2">
                {myPlaylists.map(pl => (
                  <div
                    key={pl.id}
                    onClick={() => setSelectedPlaylistIdForDetail(pl.id)}
                    className="p-2 rounded bg-gray-50 dark:bg-slate-800/60 hover:bg-blue-50/60 dark:hover:bg-blue-950/40 border border-gray-200 dark:border-slate-700 flex items-center justify-between gap-2 cursor-pointer transition"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <img src={pl.coverUrl} alt="" className="w-8 h-8 rounded object-cover flex-shrink-0" />
                      <div className="min-w-0">
                        <p className="font-bold text-xs text-gray-800 dark:text-gray-200 truncate">{pl.name}</p>
                        <p className="text-[10px] text-gray-400">{pl.tracks?.length || 0} canciones</p>
                      </div>
                    </div>
                    <Play className="w-3.5 h-3.5 text-[#3869A0] flex-shrink-0" />
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-4 text-center text-xs text-gray-400 space-y-1.5">
                <p>Aún no has creado playlists personales.</p>
                <button
                  onClick={() => setComposerMode('create_playlist')}
                  className="px-3 py-1 bg-gray-100 dark:bg-slate-800 hover:bg-[#3869A0] hover:text-white text-gray-700 dark:text-gray-300 rounded font-semibold transition cursor-pointer text-[11px]"
                >
                  Crear mi primera playlist
                </button>
              </div>
            )}
          </div>

        </div>

      </div>

      {/* ========================================================= */}
      {/* MODALS: PLAYLIST DETAIL & MUSIC COMPOSER                  */}
      {/* ========================================================= */}
      <PlaylistDetailModal
        playlist={selectedPlaylistForDetail}
        isOpen={!!selectedPlaylistForDetail}
        onClose={() => setSelectedPlaylistIdForDetail(null)}
        onOpenAddModal={(t) => {
          setSelectedTrackForComposer(t);
          setComposerMode('add_to_playlist');
        }}
      />

      <MusicComposer
        mode={composerMode || 'add_song'}
        isOpen={!!composerMode}
        onClose={() => {
          setComposerMode(null);
          setSelectedTrackForComposer(null);
        }}
        selectedTrack={selectedTrackForComposer}
        playlists={playlists}
        onCreatePlaylist={handleCreatePlaylist}
        onAddSongToPlaylist={handleAddSongToPlaylist}
      />

    </div>
  );
};
