import React, { useState, useMemo, useRef } from 'react';
import { 
  ArrowLeft, Images, Image as ImageIcon, FileText, Download, 
  MessageSquare, Search, Upload, Plus, File, Archive, Music, 
  Loader2, Maximize2, ExternalLink, Calendar, Check, X, Filter
} from 'lucide-react';
import { User, ChatMessage } from '../types';

interface SharedMediaViewProps {
  targetUser: User;
  currentUser: User;
  allMessages: ChatMessage[];
  onBackToChat: () => void;
  onJumpToMessage: (messageId: string) => void;
  onSelectPhotoLightbox: (photoUrl: string, message?: ChatMessage) => void;
  onUploadFile: (file: File) => Promise<void>;
  isUploading: boolean;
}

type MediaTab = 'all' | 'photos' | 'files';
type SenderFilter = 'all' | 'me' | 'them';

export const SharedMediaView: React.FC<SharedMediaViewProps> = ({
  targetUser,
  currentUser,
  allMessages,
  onBackToChat,
  onJumpToMessage,
  onSelectPhotoLightbox,
  onUploadFile,
  isUploading
}) => {
  const [activeTab, setActiveTab] = useState<MediaTab>('all');
  const [senderFilter, setSenderFilter] = useState<SenderFilter>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isDraggingOver, setIsDraggingOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Filter messages that contain either an image or a file
  const mediaMessages = useMemo(() => {
    return allMessages.filter(m => Boolean(m.imageUrl || m.fileUrl));
  }, [allMessages]);

  // Apply category, sender, and search filters
  const filteredMessages = useMemo(() => {
    return mediaMessages.filter(msg => {
      // Category filter
      const isPhoto = Boolean(msg.imageUrl);
      const isFile = Boolean(msg.fileUrl && !msg.imageUrl);

      if (activeTab === 'photos' && !isPhoto) return false;
      if (activeTab === 'files' && !isFile) return false;

      // Sender filter
      const isMe = msg.emisorId === currentUser.id;
      if (senderFilter === 'me' && !isMe) return false;
      if (senderFilter === 'them' && isMe) return false;

      // Search query filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesName = (msg.fileName || '').toLowerCase().includes(q);
        const matchesMsg = (msg.mensaje || '').toLowerCase().includes(q);
        const matchesDate = (msg.fecha || '').toLowerCase().includes(q);
        if (!matchesName && !matchesMsg && !matchesDate) return false;
      }

      return true;
    });
  }, [mediaMessages, activeTab, senderFilter, searchQuery, currentUser.id]);

  const totalPhotosCount = useMemo(() => {
    return mediaMessages.filter(m => Boolean(m.imageUrl)).length;
  }, [mediaMessages]);

  const totalFilesCount = useMemo(() => {
    return mediaMessages.filter(m => Boolean(m.fileUrl && !m.imageUrl)).length;
  }, [mediaMessages]);

  const formatFileSize = (bytes?: number): string => {
    if (!bytes || bytes <= 0) return 'Archivo';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const getFileIcon = (fileName?: string, fileType?: string) => {
    const ext = (fileName?.split('.').pop() || '').toLowerCase();
    const type = (fileType || '').toLowerCase();

    if (ext === 'pdf' || type.includes('pdf')) {
      return <FileText className="w-5 h-5 text-red-500" />;
    }
    if (['zip', 'rar', '7z', 'tar', 'gz'].includes(ext) || type.includes('zip') || type.includes('compressed')) {
      return <Archive className="w-5 h-5 text-amber-500" />;
    }
    if (['mp3', 'wav', 'ogg', 'm4a'].includes(ext) || type.includes('audio')) {
      return <Music className="w-5 h-5 text-purple-500" />;
    }
    return <File className="w-5 h-5 text-blue-500" />;
  };

  // Drag & drop handlers
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      void onUploadFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files[0]) {
      void onUploadFile(files[0]);
    }
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className="flex flex-col h-[350px] bg-[#f8fafc] dark:bg-[#090d16] text-xs relative select-none"
    >
      {/* Hidden file input */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileInputChange}
        className="hidden"
      />

      {/* Drag & Drop Overlay */}
      {isDraggingOver && (
        <div className="absolute inset-0 bg-[#3869A0]/85 z-40 flex flex-col items-center justify-center text-white border-2 border-dashed border-white m-1.5 rounded-lg backdrop-blur-xs">
          <Upload className="w-8 h-8 animate-bounce mb-1 text-white" />
          <span className="font-bold text-xs">Suelta aquí para compartir en el chat</span>
          <span className="text-[10px] opacity-80 mt-0.5">Fotos o cualquier tipo de archivo</span>
        </div>
      )}

      {/* Top Navigation Bar */}
      <div className="bg-white dark:bg-[#0e1726] border-b border-gray-200 dark:border-slate-800 p-2 flex items-center justify-between gap-2 shadow-2xs">
        <div className="flex items-center gap-1.5 min-w-0">
          <button
            type="button"
            onClick={onBackToChat}
            className="p-1 text-gray-500 dark:text-gray-400 hover:text-[#3869A0] hover:bg-gray-100 dark:hover:bg-slate-800 rounded transition cursor-pointer flex-shrink-0"
            title="Volver a los mensajes"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div className="truncate">
            <h4 className="font-bold text-gray-800 dark:text-gray-100 text-[11px] flex items-center gap-1 truncate">
              <Images className="w-3.5 h-3.5 text-[#3869A0] dark:text-blue-400 flex-shrink-0" />
              <span>Multimedia compartida</span>
            </h4>
            <p className="text-[9px] text-gray-500 dark:text-gray-400 truncate">
              {mediaMessages.length} {mediaMessages.length === 1 ? 'elemento compartido' : 'elementos compartidos'} con {targetUser.nombre}
            </p>
          </div>
        </div>

        {/* Upload action button */}
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={isUploading}
          className="flex items-center gap-1 bg-[#3869A0] hover:bg-[#2c537f] text-white text-[10px] font-semibold px-2 py-1 rounded shadow-2xs transition cursor-pointer disabled:opacity-50 flex-shrink-0"
          title="Compartir foto o archivo"
        >
          {isUploading ? (
            <>
              <Loader2 className="w-3 h-3 animate-spin" />
              <span>Subiendo...</span>
            </>
          ) : (
            <>
              <Plus className="w-3 h-3" />
              <span>Compartir</span>
            </>
          )}
        </button>
      </div>

      {/* Filter Tabs & Search Bar */}
      <div className="bg-gray-100/90 dark:bg-slate-900 border-b border-gray-200 dark:border-slate-800 px-2 py-1.5 flex flex-col gap-1.5">
        {/* Category Tabs & Sender selector */}
        <div className="flex items-center justify-between gap-1 text-[10px]">
          {/* Categories: All, Photos, Files */}
          <div className="flex items-center gap-0.5 bg-gray-200/80 dark:bg-slate-800 p-0.5 rounded">
            <button
              type="button"
              onClick={() => setActiveTab('all')}
              className={`px-2 py-0.5 rounded font-medium transition cursor-pointer ${
                activeTab === 'all'
                  ? 'bg-white dark:bg-slate-700 text-[#3869A0] dark:text-blue-300 shadow-2xs font-bold'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900'
              }`}
            >
              Todos ({mediaMessages.length})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('photos')}
              className={`px-2 py-0.5 rounded font-medium transition cursor-pointer flex items-center gap-1 ${
                activeTab === 'photos'
                  ? 'bg-white dark:bg-slate-700 text-[#3869A0] dark:text-blue-300 shadow-2xs font-bold'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900'
              }`}
            >
              <ImageIcon className="w-2.5 h-2.5" />
              <span>Fotos ({totalPhotosCount})</span>
            </button>
            {totalFilesCount > 0 && (
              <button
                type="button"
                onClick={() => setActiveTab('files')}
                className={`px-2 py-0.5 rounded font-medium transition cursor-pointer flex items-center gap-1 ${
                  activeTab === 'files'
                    ? 'bg-white dark:bg-slate-700 text-[#3869A0] dark:text-blue-300 shadow-2xs font-bold'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900'
                }`}
              >
                <FileText className="w-2.5 h-2.5" />
                <span>Archivos ({totalFilesCount})</span>
              </button>
            )}
          </div>

          {/* Sender Filter */}
          <select
            value={senderFilter}
            onChange={(e) => setSenderFilter(e.target.value as SenderFilter)}
            className="text-[10px] bg-white dark:bg-slate-800 border border-gray-300 dark:border-slate-700 text-gray-700 dark:text-gray-200 rounded px-1.5 py-0.5 outline-none cursor-pointer"
          >
            <option value="all">Todos los emisores</option>
            <option value="me">Enviados por mí</option>
            <option value="them">De {targetUser.nombre}</option>
          </select>
        </div>

        {/* Search input if there are more than 3 items */}
        {mediaMessages.length > 3 && (
          <div className="relative">
            <Search className="w-3 h-3 text-gray-400 absolute left-2 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Buscar por nombre, nota o fecha..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-6 pr-6 py-1 text-[10px] bg-white dark:bg-slate-800 border border-gray-300 dark:border-slate-700 rounded text-gray-800 dark:text-gray-100 placeholder-gray-400 outline-none focus:border-[#3869A0]"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-1.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 p-0.5"
              >
                <X className="w-2.5 h-2.5" />
              </button>
            )}
          </div>
        )}
      </div>

      {/* Main Grid Viewport */}
      <div className="flex-1 p-2.5 overflow-y-auto">
        {filteredMessages.length === 0 ? (
          /* Empty state */
          <div className="h-full flex flex-col items-center justify-center text-center p-4 text-gray-500 dark:text-gray-400">
            <div className="w-12 h-12 rounded-full bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900/60 flex items-center justify-center text-[#3869A0] dark:text-blue-400 mb-2">
              <Images className="w-6 h-6" />
            </div>
            {mediaMessages.length === 0 ? (
              <>
                <p className="font-bold text-xs text-gray-700 dark:text-gray-200 mb-1">
                  Sin multimedia en esta conversación
                </p>
                <p className="text-[10px] text-gray-500 max-w-[220px] mb-3 leading-tight">
                  Las fotos y archivos que compartáis tú y {targetUser.nombre} en este chat se organizarán automáticamente aquí.
                </p>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="flex items-center gap-1.5 bg-[#3869A0] hover:bg-[#2c537f] text-white text-[11px] font-medium px-3 py-1.5 rounded-full shadow-xs transition cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Compartir una foto o archivo</span>
                </button>
              </>
            ) : (
              <>
                <p className="font-bold text-xs text-gray-700 dark:text-gray-200 mb-1">
                  No hay resultados con estos filtros
                </p>
                <p className="text-[10px] text-gray-500 mb-2">
                  Prueba a cambiar la búsqueda o restablecer los filtros.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setActiveTab('all');
                    setSenderFilter('all');
                    setSearchQuery('');
                  }}
                  className="text-[10px] text-[#3869A0] dark:text-blue-400 underline font-semibold cursor-pointer"
                >
                  Restablecer filtros
                </button>
              </>
            )}
          </div>
        ) : (
          /* Grid of exchanged media */
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {filteredMessages.map((msg) => {
              const isMe = msg.emisorId === currentUser.id;
              const senderUser = isMe ? currentUser : targetUser;
              const isPhoto = Boolean(msg.imageUrl);

              if (isPhoto) {
                return (
                  <div
                    key={msg.id}
                    className="group relative aspect-square rounded-md overflow-hidden border border-gray-200 dark:border-slate-800 bg-black/5 dark:bg-black/30 shadow-2xs transition-all hover:shadow-md hover:border-[#3869A0]"
                  >
                    {/* Thumbnail Image */}
                    <img
                      src={msg.imageUrl}
                      alt={msg.fileName || 'Foto compartida'}
                      className="w-full h-full object-cover cursor-pointer transition-transform duration-200 group-hover:scale-105"
                      onClick={() => onSelectPhotoLightbox(msg.imageUrl!, msg)}
                      loading="lazy"
                    />

                    {/* Subtle sender badge at top */}
                    <div className="absolute top-1 left-1 flex items-center gap-1 bg-black/60 backdrop-blur-xs text-white text-[9px] px-1.5 py-0.5 rounded pointer-events-none">
                      <span className="w-1.5 h-1.5 rounded-full bg-green-400" />
                      <span className="font-medium truncate max-w-[65px]">
                        {isMe ? 'Tú' : targetUser.nombre}
                      </span>
                    </div>

                    {/* Hover Overlay with actions */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-1.5 text-white">
                      <div className="flex items-center justify-between gap-1 mb-1">
                        <span className="text-[9px] text-gray-300 truncate">
                          {msg.fecha}
                        </span>

                        <div className="flex items-center gap-1">
                          {/* Jump to chat message */}
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              onJumpToMessage(msg.id);
                            }}
                            className="p-1 bg-white/20 hover:bg-white/40 rounded text-white cursor-pointer transition"
                            title="Ver en el chat"
                          >
                            <MessageSquare className="w-3 h-3" />
                          </button>

                          {/* Full screen lightbox */}
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              onSelectPhotoLightbox(msg.imageUrl!, msg);
                            }}
                            className="p-1 bg-white/20 hover:bg-white/40 rounded text-white cursor-pointer transition"
                            title="Ampliar foto"
                          >
                            <Maximize2 className="w-3 h-3" />
                          </button>

                          {/* Download / Open */}
                          <a
                            href={msg.imageUrl}
                            target="_blank"
                            rel="noreferrer"
                            download={`foto-${targetUser.nombre}-${msg.id}.jpg`}
                            onClick={(e) => e.stopPropagation()}
                            className="p-1 bg-white/20 hover:bg-white/40 rounded text-white cursor-pointer transition"
                            title="Descargar imagen"
                          >
                            <Download className="w-3 h-3" />
                          </a>
                        </div>
                      </div>

                      {msg.mensaje && msg.mensaje !== '📷 Foto' && (
                        <p className="text-[9px] text-gray-200 truncate leading-tight">
                          {msg.mensaje}
                        </p>
                      )}
                    </div>
                  </div>
                );
              }

              /* Non-image File Item */
              return (
                <div
                  key={msg.id}
                  className="group relative flex flex-col justify-between p-2 rounded-md border border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-800 shadow-2xs hover:border-[#3869A0] transition-all"
                >
                  <div className="flex items-start gap-1.5">
                    <div className="p-1.5 rounded bg-gray-100 dark:bg-slate-700/60 flex-shrink-0">
                      {getFileIcon(msg.fileName, msg.fileType)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-bold text-[10px] text-gray-800 dark:text-gray-100 truncate" title={msg.fileName || 'Archivo adjunto'}>
                        {msg.fileName || 'Archivo'}
                      </p>
                      <p className="text-[9px] text-gray-400">
                        {formatFileSize(msg.fileSize)}
                      </p>
                    </div>
                  </div>

                  <div className="mt-2 pt-1 border-t border-gray-100 dark:border-slate-700/50 flex items-center justify-between text-[9px] text-gray-500">
                    <span className="truncate">
                      {isMe ? 'Tú' : targetUser.nombre} • {msg.fecha}
                    </span>
                    <div className="flex items-center gap-1 flex-shrink-0">
                      <button
                        type="button"
                        onClick={() => onJumpToMessage(msg.id)}
                        className="p-1 hover:text-[#3869A0] rounded cursor-pointer"
                        title="Ver en el chat"
                      >
                        <MessageSquare className="w-3 h-3" />
                      </button>
                      <a
                        href={msg.fileUrl}
                        download={msg.fileName || 'archivo'}
                        target="_blank"
                        rel="noreferrer"
                        className="p-1 hover:text-[#3869A0] rounded cursor-pointer"
                        title="Descargar archivo"
                      >
                        <Download className="w-3 h-3" />
                      </a>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Bottom Drop Indicator */}
      <div className="p-1.5 bg-gray-50 dark:bg-[#0e1726] border-t border-gray-200 dark:border-slate-800 text-center text-[10px] text-gray-400 dark:text-gray-500">
        <span>Arrastra y suelta imágenes o archivos aquí para compartirlos</span>
      </div>
    </div>
  );
};
