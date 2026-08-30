import React, { useState, useEffect } from 'react';
import { useInkorium } from '../context/InkoriumContext';
import { 
  ChevronLeft, ChevronRight, X, Heart, MessageSquare, 
  Tag, UserCheck, Trash2, User as UserIcon, Send, Sparkles
} from 'lucide-react';
import { PhotoTag } from '../types';

export const PhotoLightbox: React.FC = () => {
  const {
    currentUser,
    users,
    photos,
    selectedPhotoId,
    viewPhoto,
    viewUserProfile,
    addPhotoComment,
    likePhoto,
    addPhotoTag,
    removePhotoTag,
    setPhotoAsAvatar,
    deletePhoto
  } = useInkorium();

  const [taggingMode, setTaggingMode] = useState(false);
  const [tagCoords, setTagCoords] = useState<{ x: number; y: number } | null>(null);
  const [selectedTagUserId, setSelectedTagUserId] = useState<string>('');
  const [commentText, setCommentText] = useState('');

  if (!selectedPhotoId) return null;

  const currentPhotoIndex = photos.findIndex(p => p.id === selectedPhotoId);
  const photo = photos[currentPhotoIndex];

  if (!photo) return null;

  const hasPrev = currentPhotoIndex > 0;
  const hasNext = currentPhotoIndex < photos.length - 1;

  const goToPrev = () => {
    if (hasPrev) {
      viewPhoto(photos[currentPhotoIndex - 1].id);
      setTaggingMode(false);
      setTagCoords(null);
    }
  };

  const goToNext = () => {
    if (hasNext) {
      viewPhoto(photos[currentPhotoIndex + 1].id);
      setTaggingMode(false);
      setTagCoords(null);
    }
  };

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        viewPhoto(null);
      } else if (e.key === 'ArrowLeft') {
        goToPrev();
      } else if (e.key === 'ArrowRight') {
        goToNext();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentPhotoIndex, photos]);

  const handleImageClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!taggingMode) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    setTagCoords({ x, y });
  };

  const handleConfirmTag = () => {
    if (!tagCoords || !selectedTagUserId) return;
    addPhotoTag(photo.id, selectedTagUserId, tagCoords.x, tagCoords.y);
    setTagCoords(null);
    setTaggingMode(false);
    setSelectedTagUserId('');
  };

  const handleAddComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim()) return;
    addPhotoComment(photo.id, commentText);
    setCommentText('');
  };

  const isUploader = photo.uploaderId === currentUser.id;

  return (
    <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 animate-fade-in select-none">
      {/* Close button */}
      <button
        onClick={() => viewPhoto(null)}
        className="absolute top-3 right-3 text-white/80 hover:text-white p-2 rounded-full hover:bg-white/10 transition z-50 cursor-pointer"
        title="Cerrar visor de fotos (Esc)"
      >
        <X className="w-6 h-6" />
      </button>

      {/* Main Container */}
      <div className="bg-white rounded-lg overflow-hidden shadow-2xl max-w-5xl w-full max-h-[92vh] flex flex-col md:flex-row border border-gray-700">
        {/* Left Column: Photo Stage & Navigation */}
        <div className="md:w-7/12 lg:w-2/3 bg-black flex flex-col items-center justify-between relative p-2">
          {/* Top Info Bar */}
          <div className="w-full flex items-center justify-between text-white/80 text-xs px-2 py-1 z-10">
            <span className="font-semibold">
              Foto {currentPhotoIndex + 1} de {photos.length}
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setTaggingMode(!taggingMode)}
                className={`px-2.5 py-1 rounded text-xs font-bold transition flex items-center gap-1 cursor-pointer ${
                  taggingMode ? 'bg-amber-500 text-black' : 'bg-white/20 hover:bg-white/30 text-white'
                }`}
                title="Haz clic en la foto para etiquetar a tus amigos"
              >
                <Tag className="w-3 h-3" />
                <span>{taggingMode ? 'Cancelar etiqueta' : 'Etiquetar amigos'}</span>
              </button>
            </div>
          </div>

          {/* Photo Display Container */}
          <div 
            className="relative flex-1 flex items-center justify-center w-full min-h-[300px] overflow-hidden my-auto cursor-crosshair group"
            onClick={handleImageClick}
          >
            <img
              src={photo.archivo}
              alt={photo.titulo}
              className="max-h-[65vh] max-w-full object-contain rounded shadow-lg"
            />

            {/* Tagging indicator on photo */}
            {photo.etiquetas.map(tag => (
              <div
                key={tag.id}
                style={{ left: `${tag.x}%`, top: `${tag.y}%` }}
                className="absolute -translate-x-1/2 -translate-y-1/2 pointer-events-auto group/tag"
              >
                <div className="w-10 h-10 border-2 border-dashed border-white/80 rounded shadow-md group-hover/tag:border-amber-400 transition"></div>
                <div className="absolute top-full left-1/2 -translate-x-1/2 mt-1 bg-black/80 text-white text-[11px] font-bold px-2 py-0.5 rounded whitespace-nowrap shadow-lg flex items-center gap-1.5 backdrop-blur-xs">
                  <span 
                    onClick={(e) => {
                      e.stopPropagation();
                      viewUserProfile(tag.userId);
                      viewPhoto(null);
                    }}
                    className="hover:underline cursor-pointer"
                  >
                    {tag.userName}
                  </span>
                  {(isUploader || tag.userId === currentUser.id) && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        removePhotoTag(photo.id, tag.id);
                      }}
                      className="text-red-400 hover:text-red-300 font-normal ml-0.5"
                      title="Eliminar etiqueta"
                    >
                      ✕
                    </button>
                  )}
                </div>
              </div>
            ))}

            {/* Temporary Placement Tag Box */}
            {tagCoords && taggingMode && (
              <div
                style={{ left: `${tagCoords.x}%`, top: `${tagCoords.y}%` }}
                className="absolute -translate-x-1/2 -translate-y-1/2 z-30"
                onClick={e => e.stopPropagation()}
              >
                <div className="w-12 h-12 border-2 border-amber-400 bg-amber-400/20 rounded animate-pulse"></div>
                <div className="absolute top-full left-1/2 -translate-x-1/2 mt-1 bg-white text-gray-800 p-2 rounded shadow-2xl border border-gray-300 z-40 w-48 text-xs">
                  <p className="font-bold text-gray-700 mb-1">¿Quién es?</p>
                  <select
                    value={selectedTagUserId}
                    onChange={e => setSelectedTagUserId(e.target.value)}
                    className="w-full p-1 border rounded text-xs mb-2 bg-gray-50"
                  >
                    <option value="">Selecciona un amigo...</option>
                    {users.map(u => (
                      <option key={u.id} value={u.id}>{u.nombre} {u.apellidos}</option>
                    ))}
                  </select>
                  <div className="flex justify-end gap-1">
                    <button
                      onClick={() => setTagCoords(null)}
                      className="px-2 py-0.5 bg-gray-200 text-gray-700 text-[10px] rounded"
                    >
                      Cancelar
                    </button>
                    <button
                      onClick={handleConfirmTag}
                      disabled={!selectedTagUserId}
                      className="px-2 py-0.5 bg-[#3869A0] text-white text-[10px] font-bold rounded disabled:opacity-50"
                    >
                      Etiquetar
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Tag Mode Helper Banner */}
            {taggingMode && !tagCoords && (
              <div className="absolute bottom-3 bg-black/75 text-amber-300 text-xs px-3 py-1.5 rounded-full border border-amber-400/40 pointer-events-none animate-bounce">
                Haz clic en cualquier parte de la foto para colocar una etiqueta
              </div>
            )}

            {/* Left & Right navigation arrows */}
            {hasPrev && (
              <button
                onClick={(e) => { e.stopPropagation(); goToPrev(); }}
                className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/60 hover:bg-black/80 text-white p-2 rounded-full transition cursor-pointer"
                title="Foto anterior (Flecha izquierda)"
              >
                <ChevronLeft className="w-6 h-6" />
              </button>
            )}

            {hasNext && (
              <button
                onClick={(e) => { e.stopPropagation(); goToNext(); }}
                className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/60 hover:bg-black/80 text-white p-2 rounded-full transition cursor-pointer"
                title="Foto siguiente (Flecha derecha)"
              >
                <ChevronRight className="w-6 h-6" />
              </button>
            )}
          </div>

          {/* Bottom toolbar */}
          <div className="w-full flex items-center justify-between text-white/80 text-xs px-2 py-1">
            <div className="flex items-center gap-2">
              <button
                onClick={() => likePhoto(photo.id)}
                className={`flex items-center gap-1 px-2 py-1 rounded bg-white/10 hover:bg-white/20 transition cursor-pointer ${
                  photo.likes.includes(currentUser.id) ? 'text-red-400 font-bold' : 'text-white'
                }`}
              >
                <Heart className={`w-3.5 h-3.5 ${photo.likes.includes(currentUser.id) ? 'fill-current' : ''}`} />
                <span>{photo.likes.length > 0 ? `${photo.likes.length} Me gusta` : 'Me gusta'}</span>
              </button>

              <button
                onClick={() => setPhotoAsAvatar(photo.id)}
                className="px-2 py-1 rounded bg-white/10 hover:bg-white/20 text-white transition text-xs flex items-center gap-1 cursor-pointer"
                title="Establecer como mi foto de perfil"
              >
                <UserIcon className="w-3 h-3" />
                <span>Poner como foto de perfil</span>
              </button>
            </div>

            {isUploader && (
              <button
                onClick={() => {
                  if (confirm('¿Seguro que quieres borrar esta foto?')) {
                    deletePhoto(photo.id);
                  }
                }}
                className="text-red-400 hover:text-red-300 p-1 flex items-center gap-1 text-xs cursor-pointer"
                title="Borrar foto"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Borrar</span>
              </button>
            )}
          </div>
        </div>

        {/* Right Column: Photo Details & Comments */}
        <div className="md:w-5/12 lg:w-1/3 bg-[#f8fafc] flex flex-col justify-between border-t md:border-t-0 md:border-l border-gray-200 overflow-hidden">
          {/* Top uploader details */}
          <div className="p-3 bg-white border-b border-gray-200 space-y-2">
            <div className="flex items-center gap-2.5">
              <div 
                onClick={() => {
                  viewUserProfile(photo.uploaderId);
                  viewPhoto(null);
                }}
                className="cursor-pointer"
              >
                <div className="w-9 h-9 rounded bg-blue-100 text-[#3869A0] font-bold flex items-center justify-center border border-gray-300">
                  {photo.uploaderName.charAt(0)}
                </div>
              </div>
              <div className="overflow-hidden">
                <h3 
                  onClick={() => {
                    viewUserProfile(photo.uploaderId);
                    viewPhoto(null);
                  }}
                  className="font-bold text-xs text-[#3869A0] hover:underline cursor-pointer truncate"
                >
                  {photo.uploaderName}
                </h3>
                <p className="text-[10px] text-gray-400">{photo.fecha}</p>
              </div>
            </div>

            {photo.titulo && (
              <p className="text-xs text-gray-800 font-medium whitespace-pre-line leading-relaxed">
                {photo.titulo}
              </p>
            )}

            {photo.albumName && (
              <span className="inline-block text-[10px] text-[#3869A0] bg-blue-50 px-2 py-0.5 rounded font-semibold border border-blue-100">
                Álbum: {photo.albumName}
              </span>
            )}

            {/* Tagged people list */}
            {photo.etiquetas.length > 0 && (
              <div className="pt-1.5 border-t border-gray-100">
                <span className="text-[11px] font-bold text-gray-600 block mb-1">En esta foto:</span>
                <div className="flex flex-wrap gap-1">
                  {photo.etiquetas.map(t => (
                    <span
                      key={t.id}
                      onClick={() => {
                        viewUserProfile(t.userId);
                        viewPhoto(null);
                      }}
                      className="px-2 py-0.5 bg-gray-100 hover:bg-blue-100 text-[#3869A0] font-semibold text-[10px] rounded cursor-pointer transition border border-gray-200"
                    >
                      {t.userName}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Comments list container */}
          <div className="flex-1 p-3 overflow-y-auto space-y-2.5 divide-y divide-gray-100 text-xs">
            <span className="font-bold text-gray-700 text-xs block mb-2">
              Comentarios ({photo.comentarios.length})
            </span>

            {photo.comentarios.length === 0 ? (
              <div className="text-center py-8 text-gray-400 text-xs">
                Aún no hay comentarios en esta foto. ¡Escribe el primero! :)
              </div>
            ) : (
              photo.comentarios.map(c => (
                <div key={c.id} className="pt-2 first:pt-0 flex items-start gap-2">
                  <img src={c.avatar} alt="" className="w-7 h-7 rounded object-cover border border-gray-300 mt-0.5" />
                  <div className="flex-1 bg-white p-2 rounded border border-gray-200">
                    <div className="flex justify-between items-center mb-0.5">
                      <span 
                        onClick={() => {
                          viewUserProfile(c.userId);
                          viewPhoto(null);
                        }}
                        className="font-bold text-[#3869A0] hover:underline cursor-pointer text-[11px]"
                      >
                        {c.nombre}
                      </span>
                      <span className="text-[9px] text-gray-400">{c.fecha}</span>
                    </div>
                    <p className="text-gray-700 leading-snug text-xs">{c.comentario}</p>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Comment Form */}
          <form onSubmit={handleAddComment} className="p-2.5 bg-white border-t border-gray-200 flex items-center gap-2">
            <input
              type="text"
              placeholder="Escribe un comentario..."
              value={commentText}
              onChange={e => setCommentText(e.target.value)}
              className="flex-1 p-1.5 text-xs rounded border border-gray-300 focus:outline-none focus:border-[#3869A0]"
            />
            <button
              type="submit"
              disabled={!commentText.trim()}
              className="px-3 py-1.5 bg-[#3869A0] hover:bg-[#2c537f] disabled:bg-gray-300 text-white font-bold text-xs rounded transition cursor-pointer shadow-xs disabled:cursor-not-allowed"
            >
              <Send className="w-3.5 h-3.5" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
