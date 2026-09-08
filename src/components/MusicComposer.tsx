import React, { useState, useRef, useEffect } from 'react';
import { useInkorium } from '../context/InkoriumContext';
import { 
  X, Plus, Music, ListMusic, Image as ImageIcon, Sparkles, 
  Search, Check, Youtube, UploadCloud, Radio, Disc, FileAudio,
  FolderUp, Play, CheckCircle2, AlertCircle
} from 'lucide-react';
import { Track, SocialPlaylist } from '../types';
import { searchYouTubeVideos } from '../lib/youtubeApi';

interface MusicComposerProps {
  mode: 'add_song' | 'create_playlist' | 'add_to_playlist' | 'upload_pc';
  isOpen: boolean;
  onClose: () => void;
  selectedTrack?: Track | null;
  playlists: SocialPlaylist[];
  onCreatePlaylist?: (playlistData: Omit<SocialPlaylist, 'id' | 'createdAt'>) => void;
  onAddSongToPlaylist?: (track: Track, playlistId: string) => void;
  onSongCreated?: (track: Track) => void;
}

const COVER_PRESETS = [
  { name: 'Tuenti 2008 Cassette', url: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=600&auto=format&fit=crop&q=80' },
  { name: 'Pop Rock & Conciertos', url: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=600&auto=format&fit=crop&q=80' },
  { name: 'Noches de Fiesta & Neon', url: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=600&auto=format&fit=crop&q=80' },
  { name: 'Vinilo Vintage', url: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=600&auto=format&fit=crop&q=80' },
  { name: 'Indie & Acústico', url: 'https://images.unsplash.com/photo-1465847899084-d164df4dedc6?w=600&auto=format&fit=crop&q=80' },
  { name: 'Electrónica & Club', url: 'https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?w=600&auto=format&fit=crop&q=80' }
];

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
  const { currentUser, addCustomTrack, playTrack } = useInkorium();

  // Sub-tab for adding song: 'pc_upload' | 'youtube' | 'manual'
  const [songTab, setSongTab] = useState<'pc_upload' | 'youtube' | 'manual'>(
    mode === 'upload_pc' ? 'pc_upload' : 'pc_upload'
  );

  // PC File state
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [uploadedAudioUrl, setUploadedAudioUrl] = useState<string>('');
  const [fileDuration, setFileDuration] = useState<number>(210);
  const [isDraggingFile, setIsDraggingFile] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const imageInputRef = useRef<HTMLInputElement | null>(null);

  // Common Song form state
  const [songTitle, setSongTitle] = useState('');
  const [songArtist, setSongArtist] = useState('');
  const [songAlbum, setSongAlbum] = useState('');
  const [songGenre, setSongGenre] = useState('Pop Rock');
  const [songYear, setSongYear] = useState<number>(2008);
  const [songCoverUrl, setSongCoverUrl] = useState(COVER_PRESETS[0].url);
  const [songYoutubeUrl, setSongYoutubeUrl] = useState('');
  const [autoPlayOnSave, setAutoPlayOnSave] = useState(true);
  const [targetPlaylistId, setTargetPlaylistId] = useState<string>('');

  // YouTube search state
  const [youtubeSearchQuery, setYoutubeSearchQuery] = useState('');
  const [isSearchingYt, setIsSearchingYt] = useState(false);
  const [ytResults, setYtResults] = useState<any[]>([]);

  // Playlist form state
  const [playlistName, setPlaylistName] = useState('');
  const [playlistDesc, setPlaylistDesc] = useState('');
  const [playlistCategory, setPlaylistCategory] = useState<SocialPlaylist['category']>('tuenti_classic');
  const [playlistCoverUrl, setPlaylistCoverUrl] = useState(COVER_PRESETS[1].url);
  const [isCollaborative, setIsCollaborative] = useState(false);
  const [isPrivate, setIsPrivate] = useState(false);
  const [selectedPlaylistId, setSelectedPlaylistId] = useState(playlists[0]?.id || '');

  // Reset when opening
  useEffect(() => {
    if (mode === 'upload_pc') {
      setSongTab('pc_upload');
    }
  }, [mode, isOpen]);

  if (!isOpen) return null;

  // Handle PC Audio file selection
  const processAudioFile = (file: File) => {
    if (!file.type.startsWith('audio/') && !file.name.match(/\.(mp3|wav|ogg|m4a|flac|aac|wma)$/i)) {
      alert('Por favor selecciona un archivo de audio válido (MP3, WAV, OGG, M4A, FLAC, etc.).');
      return;
    }

    setUploadedFile(file);
    const blobUrl = URL.createObjectURL(file);
    setUploadedAudioUrl(blobUrl);

    // Parse filename: "Artista - Cancion.mp3" or "Cancion.mp3"
    const nameWithoutExt = file.name.replace(/\.[^/.]+$/, '');
    if (nameWithoutExt.includes(' - ')) {
      const parts = nameWithoutExt.split(' - ');
      setSongArtist(parts[0].trim());
      setSongTitle(parts.slice(1).join(' - ').trim());
    } else if (nameWithoutExt.includes('_-_')) {
      const parts = nameWithoutExt.split('_-_');
      setSongArtist(parts[0].replace(/_/g, ' ').trim());
      setSongTitle(parts.slice(1).join(' ').replace(/_/g, ' ').trim());
    } else {
      setSongTitle(nameWithoutExt.replace(/_/g, ' ').trim());
      setSongArtist(`${currentUser.nombre} ${currentUser.apellidos}`.trim() || 'Mi Música Local');
    }

    // Measure exact audio duration
    try {
      const tempAudio = new Audio();
      tempAudio.src = blobUrl;
      tempAudio.addEventListener('loadedmetadata', () => {
        if (!isNaN(tempAudio.duration) && tempAudio.duration > 0) {
          setFileDuration(Math.round(tempAudio.duration));
        }
      });
    } catch (e) {
      console.warn('Could not read audio metadata:', e);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      processAudioFile(files[0]);
    }
  };

  const handleImageFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      const imgUrl = URL.createObjectURL(files[0]);
      setSongCoverUrl(imgUrl);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingFile(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingFile(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingFile(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processAudioFile(e.dataTransfer.files[0]);
    }
  };

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
      album: songAlbum.trim() || undefined,
      genre: songGenre,
      year: songYear || 2008,
      duration: fileDuration || 215,
      coverUrl: songCoverUrl.trim() || COVER_PRESETS[0].url,
      synthStyle: 'retro_pop',
      audioUrl: uploadedAudioUrl || undefined,
      youtubeUrl: songYoutubeUrl.trim() || undefined
    };

    const createdTrack: Track = {
      id: `local-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      ...newTrack
    };

    addCustomTrack(newTrack);

    if (targetPlaylistId && onAddSongToPlaylist) {
      onAddSongToPlaylist(createdTrack, targetPlaylistId);
    }

    if (autoPlayOnSave) {
      playTrack(createdTrack, false);
    }

    if (onSongCreated) {
      onSongCreated(createdTrack);
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
      coverUrl: playlistCoverUrl.trim() || COVER_PRESETS[1].url,
      category: playlistCategory,
      tracks: selectedTrack ? [selectedTrack] : [],
      songsCount: selectedTrack ? 1 : 0,
      duration: selectedTrack ? selectedTrack.duration : 0,
      durationFormatted: selectedTrack ? `${Math.round(selectedTrack.duration / 60)} min` : '0 min',
      likes: [currentUser.id],
      isCommunity: !isPrivate,
      isCustom: true,
      isCollaborative,
      collaborators: isCollaborative ? [currentUser.id] : [],
      isPrivate
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

  const formatSecs = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div 
        className="bg-white dark:bg-slate-900 w-full max-w-xl rounded-lg border border-[#ccd5df] dark:border-slate-800 shadow-2xl overflow-hidden my-auto animate-in fade-in zoom-in-95 duration-200"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-[#3869A0] text-white px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            {(mode === 'add_song' || mode === 'upload_pc') && <FolderUp className="w-4 h-4 text-blue-200" />}
            {mode === 'create_playlist' && <ListMusic className="w-4 h-4 text-blue-200" />}
            {mode === 'add_to_playlist' && <Plus className="w-4 h-4 text-blue-200" />}
            <h3 className="font-bold text-sm">
              {(mode === 'add_song' || mode === 'upload_pc') && 'Añadir o Subir Canción a Inkorium'}
              {mode === 'create_playlist' && 'Crear Playlist en Inkorium'}
              {mode === 'add_to_playlist' && `Añadir "${selectedTrack?.title}" a Playlist`}
            </h3>
          </div>
          <button 
            onClick={onClose}
            className="p-1 hover:bg-white/20 rounded transition text-white/90 hover:text-white cursor-pointer"
            title="Cerrar"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content depending on mode */}
        <div className="p-4 sm:p-5">
          {(mode === 'add_song' || mode === 'upload_pc') && (
            <div className="space-y-4">
              
              {/* Tabs for Add Method */}
              <div className="flex border-b border-gray-200 dark:border-slate-800 gap-1 pb-1">
                <button
                  type="button"
                  onClick={() => setSongTab('pc_upload')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-t text-xs font-bold transition cursor-pointer ${
                    songTab === 'pc_upload'
                      ? 'bg-[#3869A0] text-white'
                      : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-800'
                  }`}
                >
                  <UploadCloud className="w-3.5 h-3.5" />
                  <span>Subir desde mi PC</span>
                </button>

                <button
                  type="button"
                  onClick={() => setSongTab('youtube')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-t text-xs font-bold transition cursor-pointer ${
                    songTab === 'youtube'
                      ? 'bg-red-600 text-white'
                      : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-800'
                  }`}
                >
                  <Youtube className="w-3.5 h-3.5" />
                  <span>YouTube</span>
                </button>

                <button
                  type="button"
                  onClick={() => setSongTab('manual')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-t text-xs font-bold transition cursor-pointer ${
                    songTab === 'manual'
                      ? 'bg-slate-700 text-white'
                      : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-800'
                  }`}
                >
                  <Music className="w-3.5 h-3.5" />
                  <span>Manual / URL</span>
                </button>
              </div>

              {/* Form */}
              <form onSubmit={handleSongSubmit} className="space-y-3.5 text-xs">
                
                {/* 1. PC FILE DRAG & DROP ZONE */}
                {songTab === 'pc_upload' && (
                  <div className="space-y-2">
                    <input 
                      ref={fileInputRef}
                      type="file" 
                      accept="audio/*,.mp3,.wav,.ogg,.m4a,.flac,.aac" 
                      onChange={handleFileInputChange}
                      className="hidden" 
                    />

                    <div
                      onDragOver={handleDragOver}
                      onDragLeave={handleDragLeave}
                      onDrop={handleDrop}
                      onClick={() => fileInputRef.current?.click()}
                      className={`border-2 border-dashed rounded-lg p-5 text-center transition cursor-pointer ${
                        isDraggingFile
                          ? 'border-[#3869A0] bg-blue-50 dark:bg-blue-950/40 scale-[1.01]'
                          : uploadedFile
                          ? 'border-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/20'
                          : 'border-gray-300 dark:border-slate-700 hover:border-[#3869A0] bg-gray-50/50 dark:bg-slate-800/40'
                      }`}
                    >
                      {uploadedFile ? (
                        <div className="flex items-center justify-between gap-3 text-left">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded bg-emerald-100 dark:bg-emerald-900/50 text-emerald-600 dark:text-emerald-400 flex items-center justify-center flex-shrink-0">
                              <FileAudio className="w-5 h-5" />
                            </div>
                            <div className="min-w-0">
                              <p className="font-bold text-gray-900 dark:text-white truncate text-xs">{uploadedFile.name}</p>
                              <p className="text-[11px] text-gray-500">
                                {(uploadedFile.size / (1024 * 1024)).toFixed(2)} MB • Duración: ~{formatSecs(fileDuration)}
                              </p>
                            </div>
                          </div>
                          <span className="text-[11px] font-bold text-[#3869A0] hover:underline flex-shrink-0">
                            Cambiar archivo
                          </span>
                        </div>
                      ) : (
                        <div className="space-y-1.5 py-1">
                          <UploadCloud className="w-8 h-8 text-[#3869A0] mx-auto animate-bounce" />
                          <p className="font-bold text-gray-800 dark:text-gray-200">
                            Arrastra tu archivo MP3, WAV, FLAC u OGG aquí
                          </p>
                          <p className="text-[11px] text-gray-500">
                            O haz clic para explorar tus carpetas en tu ordenador
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* 2. YOUTUBE QUICK SEARCH */}
                {songTab === 'youtube' && (
                  <div className="p-3 bg-red-50/60 dark:bg-red-950/30 rounded border border-red-100 dark:border-red-900/50 space-y-2">
                    <label className="font-bold text-gray-800 dark:text-gray-200 flex items-center gap-1.5">
                      <Youtube className="w-3.5 h-3.5 text-red-600" />
                      Buscar canción o vídeo en YouTube:
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
                        className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded font-bold transition cursor-pointer flex-shrink-0"
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
                            className="p-1.5 bg-white dark:bg-slate-800 hover:bg-red-50 dark:hover:bg-red-950/50 border border-gray-200 dark:border-slate-700 rounded flex items-center gap-2 cursor-pointer transition"
                          >
                            <img src={r.thumbnail} alt="" className="w-10 h-7 object-cover rounded" />
                            <div className="flex-1 min-w-0">
                              <p className="font-bold truncate text-gray-800 dark:text-gray-200">{r.title}</p>
                              <p className="text-[10px] text-gray-500 truncate">{r.channelTitle}</p>
                            </div>
                            <span className="text-[10px] font-bold text-red-600">Usar</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* 3. SONG DETAILS */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="font-bold text-gray-700 dark:text-gray-300">Título de la canción *</label>
                    <input
                      type="text"
                      required
                      value={songTitle}
                      onChange={e => setSongTitle(e.target.value)}
                      placeholder="Ej: Princesas"
                      className="w-full px-2.5 py-1.5 bg-white dark:bg-slate-800 border border-gray-300 dark:border-slate-700 rounded text-xs"
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
                      className="w-full px-2.5 py-1.5 bg-white dark:bg-slate-800 border border-gray-300 dark:border-slate-700 rounded text-xs"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="space-y-1">
                    <label className="font-bold text-gray-700 dark:text-gray-300">Álbum (Opcional)</label>
                    <input
                      type="text"
                      value={songAlbum}
                      onChange={e => setSongAlbum(e.target.value)}
                      placeholder="Ej: Animales"
                      className="w-full px-2.5 py-1.5 bg-white dark:bg-slate-800 border border-gray-300 dark:border-slate-700 rounded text-xs"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="font-bold text-gray-700 dark:text-gray-300">Género Musical</label>
                    <select
                      value={songGenre}
                      onChange={e => setSongGenre(e.target.value)}
                      className="w-full px-2.5 py-1.5 bg-white dark:bg-slate-800 border border-gray-300 dark:border-slate-700 rounded text-xs"
                    >
                      <option value="Pop Rock">Pop Rock Español</option>
                      <option value="Rock 2000s">Rock 2000s</option>
                      <option value="Indie Pop">Indie Pop</option>
                      <option value="Eurodance">Eurodance / Fiesta</option>
                      <option value="Reggaeton Clásico">Reggaeton Clásico</option>
                      <option value="Hip Hop / Rap">Hip Hop / Rap</option>
                      <option value="Electro & Dance">Electro & Dance</option>
                      <option value="Nostalgia Tuenti">Nostalgia Tuenti</option>
                      <option value="Otro">Otro</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="font-bold text-gray-700 dark:text-gray-300">Año</label>
                    <input
                      type="number"
                      value={songYear}
                      onChange={e => setSongYear(parseInt(e.target.value) || 2008)}
                      min={1980}
                      max={new Date().getFullYear()}
                      className="w-full px-2.5 py-1.5 bg-white dark:bg-slate-800 border border-gray-300 dark:border-slate-700 rounded text-xs"
                    />
                  </div>
                </div>

                {/* Cover Image & Presets */}
                <div className="space-y-2 p-2.5 bg-gray-50 dark:bg-slate-800/60 rounded border border-gray-200 dark:border-slate-700">
                  <div className="flex items-center justify-between">
                    <label className="font-bold text-gray-700 dark:text-gray-300 flex items-center gap-1.5">
                      <ImageIcon className="w-3.5 h-3.5 text-[#3869A0]" />
                      Portada de la canción
                    </label>
                    <button
                      type="button"
                      onClick={() => imageInputRef.current?.click()}
                      className="text-[11px] text-[#3869A0] font-bold hover:underline cursor-pointer"
                    >
                      Subir foto desde PC
                    </button>
                    <input 
                      ref={imageInputRef}
                      type="file" 
                      accept="image/*" 
                      onChange={handleImageFileChange} 
                      className="hidden" 
                    />
                  </div>

                  <div className="flex items-center gap-3">
                    <img 
                      src={songCoverUrl} 
                      alt="Cover" 
                      className="w-12 h-12 rounded object-cover border border-gray-300 dark:border-slate-600 flex-shrink-0" 
                    />
                    <div className="flex-1 min-w-0">
                      <input
                        type="url"
                        value={songCoverUrl}
                        onChange={e => setSongCoverUrl(e.target.value)}
                        placeholder="O pega una URL de imagen..."
                        className="w-full px-2.5 py-1.5 bg-white dark:bg-slate-800 border border-gray-300 dark:border-slate-700 rounded text-xs"
                      />
                    </div>
                  </div>

                  {/* Quick Presets */}
                  <div className="pt-1">
                    <p className="text-[10px] text-gray-400 mb-1">O elige una portada retro:</p>
                    <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none">
                      {COVER_PRESETS.map((p, idx) => (
                        <img
                          key={idx}
                          src={p.url}
                          alt={p.name}
                          title={p.name}
                          onClick={() => setSongCoverUrl(p.url)}
                          className={`w-9 h-9 rounded object-cover cursor-pointer border-2 transition hover:scale-105 flex-shrink-0 ${
                            songCoverUrl === p.url ? 'border-[#3869A0] ring-1 ring-[#3869A0]' : 'border-transparent opacity-80 hover:opacity-100'
                          }`}
                        />
                      ))}
                    </div>
                  </div>
                </div>

                {/* Extra Options */}
                <div className="space-y-2 p-2.5 bg-blue-50/50 dark:bg-blue-950/30 rounded border border-blue-100 dark:border-blue-900/50">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={autoPlayOnSave}
                      onChange={e => setAutoPlayOnSave(e.target.checked)}
                      className="rounded text-[#3869A0] focus:ring-0"
                    />
                    <span className="text-gray-800 dark:text-gray-200 font-medium">
                      Reproducir inmediatamente en el reproductor persistente
                    </span>
                  </label>

                  {playlists.length > 0 && (
                    <div className="pt-1.5 flex items-center gap-2">
                      <span className="text-gray-600 dark:text-gray-400 whitespace-nowrap text-[11px]">
                        Añadir también a playlist:
                      </span>
                      <select
                        value={targetPlaylistId}
                        onChange={e => setTargetPlaylistId(e.target.value)}
                        className="flex-1 px-2 py-1 bg-white dark:bg-slate-800 border border-gray-300 dark:border-slate-700 rounded text-xs"
                      >
                        <option value="">(Ninguna por ahora)</option>
                        {playlists.map(pl => (
                          <option key={pl.id} value={pl.id}>{pl.name}</option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="pt-2 flex justify-end gap-2 border-t border-gray-100 dark:border-slate-800">
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-3.5 py-1.5 border border-gray-300 dark:border-slate-700 text-gray-600 dark:text-gray-300 rounded font-semibold hover:bg-gray-100 dark:hover:bg-slate-800 cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-1.5 bg-[#3869A0] hover:bg-[#2c537f] text-white rounded font-bold transition flex items-center gap-1.5 shadow-xs cursor-pointer"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Guardar y Reproducir</span>
                  </button>
                </div>
              </form>
            </div>
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

              <div className="space-y-2 p-2.5 bg-gray-50 dark:bg-slate-800/60 rounded border border-gray-200 dark:border-slate-700">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isCollaborative}
                    onChange={e => setIsCollaborative(e.target.checked)}
                    className="rounded text-[#3869A0] focus:ring-0"
                  />
                  <span className="text-gray-800 dark:text-gray-200 font-medium">
                    Playlist colaborativa (tus amigos podrán añadir temas)
                  </span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isPrivate}
                    onChange={e => setIsPrivate(e.target.checked)}
                    className="rounded text-[#3869A0] focus:ring-0"
                  />
                  <span className="text-gray-800 dark:text-gray-200 font-medium">
                    Playlist privada (solo visible para ti)
                  </span>
                </label>
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
