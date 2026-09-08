import React, { useState, useEffect } from 'react';
import { useInkorium } from '../context/InkoriumContext';
import { 
  Search, Play, Heart, Plus, ExternalLink, Sparkles, Check, 
  Tv, Volume2, Film, Music, Flame, Disc, Radio, Loader2, X, RefreshCw
} from 'lucide-react';
import { YouTubeVideoResult, Track } from '../types';
import { searchYouTubeVideos, convertYouTubeToTrack, FEATURED_YOUTUBE_HITS, extractYouTubeId } from '../lib/youtubeApi';

interface YouTubeSearchPlayerProps {
  onSongSelected?: (track: Track) => void;
}

const QUICK_TAGS = [
  'El Canto del Loco',
  'Melendi',
  'Amaral',
  'Estopa',
  'Tuenti 2008',
  'Electro Dance',
  'Indie Rock',
  'Reggaeton 2000s'
];

export const YouTubeSearchPlayer: React.FC<YouTubeSearchPlayerProps> = ({ onSongSelected }) => {
  const { currentUser, updateUserData, addCustomTrack, playTrack } = useInkorium();

  const [query, setQuery] = useState('');
  const [activeSearch, setActiveSearch] = useState('');
  const [results, setResults] = useState<YouTubeVideoResult[]>(FEATURED_YOUTUBE_HITS);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedVideo, setSelectedVideo] = useState<YouTubeVideoResult>(FEATURED_YOUTUBE_HITS[0]);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [addedIds, setAddedIds] = useState<Set<string>>(new Set());

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleSearch = async (searchTerm?: string) => {
    const term = (searchTerm !== undefined ? searchTerm : query).trim();
    if (!term) {
      setResults(FEATURED_YOUTUBE_HITS);
      setActiveSearch('');
      return;
    }

    setIsLoading(true);
    setActiveSearch(term);
    try {
      const vids = await searchYouTubeVideos(term);
      setResults(vids);
      if (vids.length > 0 && !selectedVideo) {
        setSelectedVideo(vids[0]);
      }
    } catch (err) {
      console.error('Error searching YouTube:', err);
      showToast('Error al buscar en YouTube');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePlayVideo = (video: YouTubeVideoResult) => {
    setSelectedVideo(video);
    const track = convertYouTubeToTrack(video);
    if (onSongSelected) {
      onSongSelected(track);
    }
  };

  const handleSetAsProfileSong = (video: YouTubeVideoResult) => {
    const songName = `${video.title} - ${video.channelTitle}`;
    updateUserData({ musica: songName });
    showToast(`¡"${video.title}" configurada en tu perfil!`);
  };

  const handleAddToLibrary = (video: YouTubeVideoResult) => {
    addCustomTrack({
      title: video.title,
      artist: video.channelTitle || 'YouTube Music',
      genre: 'YouTube',
      duration: video.durationSeconds || 210,
      year: new Date().getFullYear(),
      coverUrl: video.thumbnail || `https://i.ytimg.com/vi/${video.id}/hqdefault.jpg`,
      synthStyle: 'retro_pop',
      youtubeId: video.id,
      youtubeUrl: video.youtubeUrl
    });
    setAddedIds(prev => new Set(prev).add(video.id));
    showToast(`¡"${video.title}" añadida a tu biblioteca!`);
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-lg border border-[#ccd5df] dark:border-slate-800 shadow-xs overflow-hidden">
      {/* Toast Feedback */}
      {toastMessage && (
        <div className="fixed top-20 right-4 z-50 bg-[#3869A0] text-white px-4 py-2 rounded-lg shadow-xl border border-white/20 flex items-center gap-2 text-xs font-semibold animate-in fade-in slide-in-from-top-2">
          <Check className="w-4 h-4 text-emerald-300 flex-shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header with YouTube Theme Badge */}
      <div className="bg-gradient-to-r from-red-600 via-red-700 to-[#3869A0] text-white px-3.5 py-2.5 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 bg-white rounded-md flex items-center justify-center text-red-600 font-black text-[10px] shadow-xs">
            ▶
          </div>
          <div>
            <h2 className="font-bold text-xs tracking-tight">Búsqueda de Música en YouTube</h2>
          </div>
        </div>

        <span className="text-[10px] bg-black/30 backdrop-blur-xs px-2 py-0.5 rounded-full font-semibold">
          YouTube Player
        </span>
      </div>

      <div className="p-3.5 space-y-3.5">
        {/* Search Input Bar */}
        <form 
          onSubmit={(e) => {
            e.preventDefault();
            handleSearch();
          }} 
          className="space-y-2"
        >
          <div className="relative flex items-center">
            <Search className="w-4 h-4 text-gray-400 absolute left-3" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Buscar canción, artista o pegar enlace de YouTube..."
              className="w-full pl-9 pr-20 py-2 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg text-xs text-gray-900 dark:text-white focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500/20"
            />
            <div className="absolute right-1.5 flex items-center gap-1">
              {query && (
                <button
                  type="button"
                  onClick={() => {
                    setQuery('');
                    handleSearch('');
                  }}
                  className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
              <button
                type="submit"
                disabled={isLoading}
                className="px-2.5 py-1 bg-red-600 hover:bg-red-700 text-white rounded text-xs font-bold transition flex items-center gap-1 cursor-pointer"
              >
                {isLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Buscar'}
              </button>
            </div>
          </div>

          {/* Quick Search Tag Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-[11px] scrollbar-none">
            <span className="text-gray-400 text-[10px] font-semibold flex items-center gap-0.5 flex-shrink-0">
              <Flame className="w-3 h-3 text-red-500" />
              Tendencias:
            </span>
            {QUICK_TAGS.map((tag) => (
              <button
                key={tag}
                type="button"
                onClick={() => {
                  setQuery(tag);
                  handleSearch(tag);
                }}
                className={`px-2 py-0.5 rounded-full whitespace-nowrap transition cursor-pointer text-[10px] font-medium ${
                  activeSearch === tag
                    ? 'bg-red-600 text-white font-bold'
                    : 'bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-gray-300 hover:bg-red-50 dark:hover:bg-red-950/40 hover:text-red-600'
                }`}
              >
                {tag}
              </button>
            ))}
          </div>
        </form>

        {/* Active YouTube Video Player */}
        {selectedVideo && (
          <div className="rounded-lg overflow-hidden border border-gray-200 dark:border-slate-800 bg-slate-950 shadow-md">
            {/* Embedded Responsive YouTube Iframe */}
            <div className="relative w-full aspect-video bg-black">
              <iframe
                key={selectedVideo.id}
                src={`https://www.youtube-nocookie.com/embed/${selectedVideo.id}?autoplay=1&rel=0&modestbranding=1`}
                title={selectedVideo.title}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                className="absolute inset-0 w-full h-full border-0"
              />
            </div>

            {/* Video Info & Controls Panel */}
            <div className="p-3 bg-white dark:bg-slate-900 border-t border-gray-100 dark:border-slate-800 space-y-2">
              <div>
                <h3 className="font-bold text-xs sm:text-sm text-gray-900 dark:text-white line-clamp-1">
                  {selectedVideo.title}
                </h3>
                <div className="flex items-center justify-between text-[11px] text-gray-500 dark:text-gray-400 mt-0.5">
                  <span className="font-semibold text-red-600 dark:text-red-400">
                    {selectedVideo.channelTitle}
                  </span>
                  <div className="flex items-center gap-2 font-mono text-[10px]">
                    {selectedVideo.duration && <span>⏱ {selectedVideo.duration}</span>}
                    {selectedVideo.views && <span>👁 {selectedVideo.views}</span>}
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-1.5 pt-1.5 border-t border-gray-100 dark:border-slate-800">
                <button
                  onClick={() => handleSetAsProfileSong(selectedVideo)}
                  className="flex-1 py-1.5 px-2 bg-blue-50 dark:bg-blue-950/50 hover:bg-blue-100 dark:hover:bg-blue-900/60 text-[#3869A0] dark:text-blue-300 font-semibold rounded text-[11px] flex items-center justify-center gap-1 transition cursor-pointer border border-blue-200 dark:border-blue-800/60"
                  title="Poner esta canción en tu perfil de Inkorium"
                >
                  <Heart className="w-3.5 h-3.5 fill-current text-rose-500" />
                  <span>En mi perfil</span>
                </button>

                <button
                  onClick={() => handleAddToLibrary(selectedVideo)}
                  className={`flex-1 py-1.5 px-2 font-semibold rounded text-[11px] flex items-center justify-center gap-1 transition cursor-pointer border ${
                    addedIds.has(selectedVideo.id)
                      ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800'
                      : 'bg-gray-100 dark:bg-slate-800 hover:bg-gray-200 dark:hover:bg-slate-700 text-gray-700 dark:text-gray-200 border-gray-200 dark:border-slate-700'
                  }`}
                  title="Guardar en tu biblioteca de música"
                >
                  {addedIds.has(selectedVideo.id) ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-500" />
                      <span>Guardada</span>
                    </>
                  ) : (
                    <>
                      <Plus className="w-3.5 h-3.5 text-gray-600 dark:text-gray-300" />
                      <span>Guardar</span>
                    </>
                  )}
                </button>

                <a
                  href={selectedVideo.youtubeUrl || `https://www.youtube.com/watch?v=${selectedVideo.id}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="py-1.5 px-2 bg-red-50 dark:bg-red-950/40 hover:bg-red-100 dark:hover:bg-red-900/50 text-red-600 dark:text-red-400 font-medium rounded text-[11px] flex items-center gap-1 transition border border-red-200 dark:border-red-800/50"
                  title="Abrir directamente en YouTube"
                >
                  <ExternalLink className="w-3 h-3" />
                  <span className="hidden sm:inline">YouTube</span>
                </a>
              </div>
            </div>
          </div>
        )}

        {/* Search Results List */}
        <div className="space-y-2">
          <div className="flex items-center justify-between pb-1 border-b border-gray-100 dark:border-slate-800">
            <span className="font-bold text-xs text-gray-800 dark:text-gray-200 flex items-center gap-1.5">
              <Film className="w-3.5 h-3.5 text-red-600" />
              {activeSearch ? `Resultados para "${activeSearch}"` : 'Videos Populares Recomendados'}
            </span>
            <span className="text-[10px] text-gray-400 font-mono">
              {results.length} videos
            </span>
          </div>

          <div className="space-y-2 max-h-[360px] overflow-y-auto pr-1">
            {results.map((video) => {
              const isCurrent = selectedVideo?.id === video.id;
              const isAdded = addedIds.has(video.id);

              return (
                <div
                  key={video.id}
                  onClick={() => handlePlayVideo(video)}
                  className={`p-2 rounded-lg border transition-all cursor-pointer flex items-center gap-2.5 group ${
                    isCurrent
                      ? 'bg-red-50 dark:bg-red-950/30 border-red-300 dark:border-red-800 shadow-xs'
                      : 'bg-gray-50 dark:bg-slate-800/60 hover:bg-white dark:hover:bg-slate-800 border-gray-200 dark:border-slate-800'
                  }`}
                >
                  {/* Video Thumbnail */}
                  <div className="relative w-18 h-12 rounded overflow-hidden bg-slate-900 flex-shrink-0">
                    <img
                      src={video.thumbnail}
                      alt={video.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                    />
                    <div className="absolute inset-0 bg-black/30 group-hover:bg-black/10 transition flex items-center justify-center">
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center text-white ${isCurrent ? 'bg-red-600' : 'bg-black/60 group-hover:bg-red-600'} transition`}>
                        <Play className="w-3 h-3 fill-current ml-0.5" />
                      </div>
                    </div>
                    {video.duration && (
                      <span className="absolute bottom-0.5 right-0.5 bg-black/80 text-white font-mono text-[9px] px-1 rounded">
                        {video.duration}
                      </span>
                    )}
                  </div>

                  {/* Video Title & Channel */}
                  <div className="flex-1 min-w-0">
                    <h4 className={`text-xs font-bold truncate ${isCurrent ? 'text-red-600 dark:text-red-400' : 'text-gray-900 dark:text-gray-100 group-hover:text-red-600'}`}>
                      {video.title}
                    </h4>
                    <p className="text-[11px] text-gray-500 dark:text-gray-400 truncate">
                      {video.channelTitle}
                    </p>
                    {video.views && (
                      <p className="text-[10px] text-gray-400">
                        {video.views}
                      </p>
                    )}
                  </div>

                  {/* Quick Save Button */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleAddToLibrary(video);
                    }}
                    className={`p-1.5 rounded transition ${
                      isAdded
                        ? 'text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40'
                        : 'text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-200 dark:hover:bg-slate-700'
                    }`}
                    title={isAdded ? 'Guardada en tu biblioteca' : 'Guardar en tu biblioteca'}
                  >
                    {isAdded ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Plus className="w-3.5 h-3.5" />}
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
