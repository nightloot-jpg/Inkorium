import React, { useState } from 'react';
import { useInkorium } from '../context/InkoriumContext';
import { 
  X, Plus, Music, ListMusic, Image as ImageIcon, Sparkles, 
  Search, Check, Youtube, UploadCloud, Radio, Disc
} from 'lucide-react';
import { Track, SocialPlaylist } from '../types';
import { searchYouTubeVideos } from '../lib/youtubeApi';

interface MusicComposerProps {
  mode: 'add_song' | 'create_playlist' | 'add_to_playlist';
  isOpen: boolean;
  onClose: () => void;
  selectedTrack?: Track | null;
  playlists: SocialPlaylist[];
  onCreatePlaylist?: (playlistData: Omit<SocialPlaylist, 'id' | 'createdAt'>) => void;
  onAddSongToPlaylist?: (track: Track, playlistId: string) => void;
  onSongCreated?: (track: Track) => void;
}

export const MusicComposer: React.FC<MusicComposerProps> = ({
  mode,
  isOpen,
  onClose,
  selectedTrack,
  playlists,
  onCreatePlaylist,
  onAddSongToPlaylist,
  onSongCreated
}) => {
  const { currentUser, addCustomTrack } = useInkorium();

  // Song form state
  const [songTitle, setSongTitle] = useState('');
  const [songArtist, setSongArtist] = useState('');
  const [songGenre, setSongGenre] = useState('Pop Rock');
  const [songYear, setSongYear] = useState<number>(2008);
  const [songCoverUrl, setSongCoverUrl] = useState('');
  const [songYoutubeUrl, setSongYoutubeUrl] = useState('');
  const [youtubeSearchQuery, setYoutubeSearchQuery] = useState('');
  const [isSearchingYt, setIsSearchingYt] = useState(false);
  const [ytResults, setYtResults] = useState<any[]>([]);

  // Playlist form state
  const [playlistName, setPlaylistName] = useState('');
  const [playlistDesc, setPlaylistDesc] = useState('');
  const [playlistCategory, setPlaylistCategory] = useState<SocialPlaylist['category']>('tuenti_classic');
  const [playlistCoverUrl, setPlaylistCoverUrl] = useState('');
  const [selectedPlaylistId, setSelectedPlaylistId] = useState(playlists[0]?.id || '');

  if (!isOpen) return null;

  const handleSearchYt = async () => {
    if (!youtubeSearchQuery.trim()) return;
    setIsSearchingYt(true);
    try {
      const results = await searchYouTubeVideos(youtubeSearchQuery);
      setYtResults(results);
    } catch (e) {
      console.error(e);
    } finally {
      setIsSearchingYt(false);
    }
  };

  const handleSelectYtVideo = (v: any) => {
    setSongTitle(v.title);
    setSongArtist(v.channelTitle || 'Artista');
    setSongYoutubeUrl(v.youtubeUrl);
    setSongCoverUrl(v.thumbnail);
    setYtResults([]);
  };

  const handleSongSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!songTitle.trim()) return;

    const newTrack: Omit<Track, 'id'> = {
      title: songTitle.trim(),
      artist: songArtist.trim() || 'Artista Inkorium',
      genre: songGenre,
      year: songYear || 2008,
      duration: 215,
      coverUrl: songCoverUrl.trim() || 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=600&auto=format&fit=crop&q=80',
      synthStyle: 'retro_pop',
      youtubeUrl: songYoutubeUrl.trim() || undefined
    };

    addCustomTrack(newTrack);
    if (onSongCreated) {
      onSongCreated({ ...newTrack, id: `custom_${Date.now()}` });
    }
    onClose();
  };

  const handlePlaylistSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!playlistName.trim() || !onCreatePlaylist) return;

    onCreatePlaylist({
      name: playlistName.trim(),
      description: playlistDesc.trim(),
      creatorId: currentUser.id,
      creatorName: `${currentUser.nombre} ${currentUser.apellidos}`.trim(),
      creatorAvatar: currentUser.avatar,
      coverUrl: playlistCoverUrl.trim() || 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=600&auto=format&fit=crop&q=80',
      category: playlistCategory,
      tracks: selectedTrack ? [selectedTrack] : [],
      songsCount: selectedTrack ? 1 : 0,
      duration: selectedTrack ? selectedTrack.duration : 0,
      durationFormatted: selectedTrack ? `${Math.round(selectedTrack.duration / 60)} min` : '0 min',
      likes: [currentUser.id],
      isCommunity: true
    });
    onClose();
  };

  const handleAddToPlaylistSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedTrack && selectedPlaylistId && onAddSongToPlaylist) {
      onAddSongToPlaylist(selectedTrack, selectedPlaylistId);
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <div 
        className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-lg border border-[#ccd5df] dark:border-slate-800 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-[#3869A0] text-white px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            {mode === 'add_song' && <Music className="w-4 h-4 text-blue-200" />}
            {mode === 'create_playlist' && <ListMusic className="w-4 h-4 text-blue-200" />}
            {mode === 'add_to_playlist' && <Plus className="w-4 h-4 text-blue-200" />}
            <h3 className="font-bold text-sm">
              {mode === 'add_song' && 'Añadir Nueva Canción'}
              {mode === 'create_playlist' && 'Crear Playlist en Inkorium'}
              {mode === 'add_to_playlist' && `Añadir "${selectedTrack?.title}" a Playlist`}
            </h3>
          </div>
          <button 
            onClick={onClose}
            className="p-1 hover:bg-white/20 rounded transition text-white/90 hover:text-white cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content depending on mode */}
        <div className="p-4 sm:p-5">
          {mode === 'add_song' && (
            <form onSubmit={handleSongSubmit} className="space-y-3.5 text-xs">
              {/* YouTube Quick Fetch */}
              <div className="p-3 bg-blue-50/70 dark:bg-blue-950/30 rounded border border-blue-100 dark:border-blue-900/50 space-y-2">
                <label className="font-bold text-gray-800 dark:text-gray-200 flex items-center gap-1.5">
                  <Youtube className="w-3.5 h-3.5 text-red-600" />
                  Autocompletar desde YouTube (Opcional):
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={youtubeSearchQuery}
                    onChange={e => setYoutubeSearchQuery(e.target.value)}
                    placeholder="Ej: El Canto del Loco Zapatillas..."
                    className="flex-1 px-2.5 py-1.5 bg-white dark:bg-slate-800 border border-gray-300 dark:border-slate-700 rounded text-xs"
                  />
                  <button
                    type="button"
                    onClick={handleSearchYt}
                    disabled={isSearchingYt}
                    className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded font-bold transition cursor-pointer"
                  >
                    {isSearchingYt ? 'Buscando...' : 'Buscar'}
                  </button>
                </div>

                {ytResults.length > 0 && (
                  <div className="space-y-1 max-h-36 overflow-y-auto pt-1">
                    {ytResults.map(r => (
                      <div
                        key={r.id}
                        onClick={() => handleSelectYtVideo(r)}
                        className="p-1.5 bg-white dark:bg-slate-800 hover:bg-blue-50 dark:hover:bg-blue-950/50 border border-gray-200 dark:border-slate-700 rounded flex items-center gap-2 cursor-pointer transition"
                      >
                        <img src={r.thumbnail} alt="" className="w-10 h-7 object-cover rounded" />
                        <div className="flex-1 min-w-0">
                          <p className="font-bold truncate text-gray-800 dark:text-gray-200">{r.title}</p>
                          <p className="text-[10px] text-gray-500 truncate">{r.channelTitle}</p>
                        </div>
                        <span className="text-[10px] font-bold text-[#3869A0]">Usar</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-gray-700 dark:text-gray-300">Título de la canción *</label>
                  <input
                    type="text"
                    required
                    value={songTitle}
                    onChange={e => setSongTitle(e.target.value)}
                    placeholder="Ej: Princesas"
                    className="w-full px-2.5 py-1.5 bg-white dark:bg-slate-800 border border-gray-300 dark:border-slate-700 rounded"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-gray-700 dark:text-gray-300">Artista / Grupo *</label>
                  <input
                    type="text"
                    required
                    value={songArtist}
                    onChange={e => setSongArtist(e.target.value)}
                    placeholder="Ej: Pereza"
                    className="w-full px-2.5 py-1.5 bg-white dark:bg-slate-800 border border-gray-300 dark:border-slate-700 rounded"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-gray-700 dark:text-gray-300">Género Musical</label>
                  <select
                    value={songGenre}
                    onChange={e => setSongGenre(e.target.value)}
                    className="w-full px-2.5 py-1.5 bg-white dark:bg-slate-800 border border-gray-300 dark:border-slate-700 rounded"
                  >
                    <option value="Pop Rock">Pop Rock Español</option>
                    <option value="Rock 2000s">Rock 2000s</option>
                    <option value="Indie Pop">Indie Pop</option>
                    <option value="Eurodance">Eurodance / Fiesta</option>
                    <option value="Reggaeton Clásico">Reggaeton Clásico</option>
                    <option value="Nostalgia Tuenti">Nostalgia Tuenti</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-gray-700 dark:text-gray-300">Año de lanzamiento</label>
                  <input
                    type="number"
                    value={songYear}
                    onChange={e => setSongYear(parseInt(e.target.value) || 2008)}
                    min={1990}
                    max={new Date().getFullYear()}
                    className="w-full px-2.5 py-1.5 bg-white dark:bg-slate-800 border border-gray-300 dark:border-slate-700 rounded"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-gray-700 dark:text-gray-300">URL de Portada (Imagen)</label>
                <input
                  type="url"
                  value={songCoverUrl}
                  onChange={e => setSongCoverUrl(e.target.value)}
                  placeholder="https://..."
                  className="w-full px-2.5 py-1.5 bg-white dark:bg-slate-800 border border-gray-300 dark:border-slate-700 rounded"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2 border-t border-gray-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-3 py-1.5 border border-gray-300 dark:border-slate-700 text-gray-600 dark:text-gray-300 rounded font-semibold cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-[#3869A0] hover:bg-[#2c537f] text-white rounded font-bold cursor-pointer"
                >
                  Guardar Canción
                </button>
              </div>
            </form>
          )}

          {mode === 'create_playlist' && (
            <form onSubmit={handlePlaylistSubmit} className="space-y-3.5 text-xs">
              <div className="space-y-1">
                <label className="font-bold text-gray-700 dark:text-gray-300">Nombre de la Playlist *</label>
                <input
                  type="text"
                  required
                  value={playlistName}
                  onChange={e => setPlaylistName(e.target.value)}
                  placeholder="Ej: Temazos de Fin de Semana"
                  className="w-full px-2.5 py-1.5 bg-white dark:bg-slate-800 border border-gray-300 dark:border-slate-700 rounded"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-gray-700 dark:text-gray-300">Descripción / Dedicatoria</label>
                <textarea
                  rows={2}
                  value={playlistDesc}
                  onChange={e => setPlaylistDesc(e.target.value)}
                  placeholder="Para escuchar con los amigos antes de salir de fiesta..."
                  className="w-full px-2.5 py-1.5 bg-white dark:bg-slate-800 border border-gray-300 dark:border-slate-700 rounded resize-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-gray-700 dark:text-gray-300">Categoría</label>
                  <select
                    value={playlistCategory}
                    onChange={e => setPlaylistCategory(e.target.value as any)}
                    className="w-full px-2.5 py-1.5 bg-white dark:bg-slate-800 border border-gray-300 dark:border-slate-700 rounded"
                  >
                    <option value="tuenti_classic">Tuenti 2000s Clásicos</option>
                    <option value="populares">Populares & Éxitos</option>
                    <option value="amigos">Para Estados & Amigos</option>
                    <option value="verano">Verano & Fiesta</option>
                    <option value="indie">Indie & Alternativo</option>
                    <option value="reggaeton">Reggaeton Clásico</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-gray-700 dark:text-gray-300">URL Portada de Playlist</label>
                  <input
                    type="url"
                    value={playlistCoverUrl}
                    onChange={e => setPlaylistCoverUrl(e.target.value)}
                    placeholder="https://..."
                    className="w-full px-2.5 py-1.5 bg-white dark:bg-slate-800 border border-gray-300 dark:border-slate-700 rounded"
                  />
                </div>
              </div>

              <div className="pt-2 flex justify-end gap-2 border-t border-gray-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-3 py-1.5 border border-gray-300 dark:border-slate-700 text-gray-600 dark:text-gray-300 rounded font-semibold cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-[#3869A0] hover:bg-[#2c537f] text-white rounded font-bold cursor-pointer"
                >
                  Crear Playlist
                </button>
              </div>
            </form>
          )}

          {mode === 'add_to_playlist' && (
            <form onSubmit={handleAddToPlaylistSubmit} className="space-y-3.5 text-xs">
              <p className="text-gray-600 dark:text-gray-300">
                Selecciona a cuál de tus playlists deseas añadir esta canción:
              </p>

              <div className="space-y-2 max-h-48 overflow-y-auto">
                {playlists.map(pl => (
                  <label
                    key={pl.id}
                    className={`p-2.5 rounded border flex items-center justify-between cursor-pointer transition ${
                      selectedPlaylistId === pl.id
                        ? 'bg-blue-50 dark:bg-blue-950/40 border-[#3869A0]'
                        : 'bg-gray-50 dark:bg-slate-800 border-gray-200 dark:border-slate-700 hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <img src={pl.coverUrl} alt="" className="w-8 h-8 rounded object-cover" />
                      <div>
                        <p className="font-bold text-gray-900 dark:text-white">{pl.name}</p>
                        <p className="text-[10px] text-gray-400">{pl.songsCount || pl.tracks?.length || 0} canciones</p>
                      </div>
                    </div>
                    <input
                      type="radio"
                      name="playlistChoice"
                      value={pl.id}
                      checked={selectedPlaylistId === pl.id}
                      onChange={() => setSelectedPlaylistId(pl.id)}
                      className="accent-[#3869A0]"
                    />
                  </label>
                ))}
              </div>

              <div className="pt-2 flex justify-end gap-2 border-t border-gray-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-3 py-1.5 border border-gray-300 dark:border-slate-700 text-gray-600 dark:text-gray-300 rounded font-semibold cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-[#3869A0] hover:bg-[#2c537f] text-white rounded font-bold cursor-pointer"
                >
                  Añadir Canción
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
