import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  MessageSquare,
  Send,
  Tag,
  X,
  Eye,
  EyeOff,
  UserCircle2
} from 'lucide-react';
import { PhotoTag } from '../types';
import { useInkorium } from '../context/InkoriumContext';

interface TagPoint {
  x: number;
  y: number;
}

export const PhotoRetroViewer: React.FC = () => {
  const {
    currentUser,
    users,
    photos,
    albums,
    selectedPhotoId,
    selectedAlbumId,
    viewPhoto,
    viewUserProfile,
    addPhotoTag,
    removePhotoTag,
    addPhotoComment,
    canUserViewPhoto,
    getFriendsOf
  } = useInkorium();

  const [taggingMode, setTaggingMode] = useState(false);
  const [pendingPoint, setPendingPoint] = useState<TagPoint | null>(null);
  const [selectedFriendId, setSelectedFriendId] = useState('');
  const [highlightedTagId, setHighlightedTagId] = useState<string | null>(null);
  const [showTagBoxes, setShowTagBoxes] = useState(true);
  const [commentText, setCommentText] = useState('');
  const [imageLoaded, setImageLoaded] = useState(false);
  const imageWrapRef = useRef<HTMLDivElement>(null);
  const modalRef = useRef<HTMLDivElement>(null);

  const photoList = useMemo(() => {
    if (!photos?.length) return [];
    if (selectedAlbumId) {
      const albumPhotos = photos.filter(photo => photo.albumId === selectedAlbumId);
      if (albumPhotos.length) return albumPhotos;
    }
    return photos;
  }, [photos, selectedAlbumId]);

  const currentIndex = useMemo(
    () => photoList.findIndex(photo => photo.id === selectedPhotoId || photo.archivo === selectedPhotoId),
    [photoList, selectedPhotoId]
  );

  const photo = useMemo(() => {
    const found = photoList.find(item => item.id === selectedPhotoId || item.archivo === selectedPhotoId);
    if (found) return found;
    return photos.find(item => item.id === selectedPhotoId || item.archivo === selectedPhotoId) || null;
  }, [photoList, photos, selectedPhotoId]);

  const friends = useMemo(() => {
    if (!currentUser) return [];
    const ownFriends = getFriendsOf(currentUser.id);
    return (ownFriends.length ? ownFriends : users.filter(user => user.id !== currentUser.id))
      .filter(user => user.id !== photo?.uploaderId);
  }, [currentUser, getFriendsOf, users, photo?.uploaderId]);

  const tags = useMemo(() => Array.isArray(photo?.etiquetas) ? photo.etiquetas : [], [photo]);
  const comments = useMemo(() => Array.isArray(photo?.comentarios) ? photo.comentarios : [], [photo]);
  const albumName = photo?.albumName || albums.find(album => album.id === photo?.albumId)?.nombre;
  const canView = photo ? canUserViewPhoto(photo, currentUser?.id) : true;
  const isOwner = Boolean(photo && currentUser && (photo.uploaderId === currentUser.id || photo.uploaderId === currentUser.username));

  const goTo = (direction: -1 | 1) => {
    if (!photoList.length || currentIndex < 0) return;
    const nextIndex = currentIndex + direction;
    if (nextIndex < 0 || nextIndex >= photoList.length) return;
    setTaggingMode(false);
    setPendingPoint(null);
    setHighlightedTagId(null);
    setSelectedFriendId('');
    viewPhoto(photoList[nextIndex].id);
  };

  useEffect(() => {
    if (!selectedPhotoId) return;
    setImageLoaded(false);
    setTaggingMode(false);
    setPendingPoint(null);
    setSelectedFriendId('');
    setHighlightedTagId(null);

    const handleKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      if (target && ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName)) {
        if (event.key === 'Escape') (target as HTMLElement).blur();
        return;
      }
      if (event.key === 'Escape') {
        if (taggingMode || pendingPoint) {
          setTaggingMode(false);
          setPendingPoint(null);
          setSelectedFriendId('');
        } else {
          viewPhoto(null);
        }
        return;
      }
      if (event.key === 'ArrowLeft') {
        event.preventDefault();
        goTo(-1);
      }
      if (event.key === 'ArrowRight') {
        event.preventDefault();
        goTo(1);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedPhotoId, taggingMode, pendingPoint, currentIndex, photoList]);

  useEffect(() => {
    if (selectedPhotoId) modalRef.current?.focus();
  }, [selectedPhotoId]);

  if (!selectedPhotoId || !photo) return null;

  const handleImageClick = (event: React.MouseEvent<HTMLDivElement>) => {
    if (!taggingMode || pendingPoint) return;
    const image = document.querySelector('#inkorium-retro-photo-image') as HTMLImageElement | null;
    const host = image || imageWrapRef.current;
    if (!host) return;
    const rect = host.getBoundingClientRect();
    if (!rect.width || !rect.height) return;
    const x = Math.max(0, Math.min(100, ((event.clientX - rect.left) / rect.width) * 100));
    const y = Math.max(0, Math.min(100, ((event.clientY - rect.top) / rect.height) * 100));
    setPendingPoint({ x, y });
  };

  const handleConfirmTag = () => {
    if (!pendingPoint || !selectedFriendId) return;
    addPhotoTag(photo.id, selectedFriendId, Math.round(pendingPoint.x), Math.round(pendingPoint.y));
    setPendingPoint(null);
    setSelectedFriendId('');
    setTaggingMode(false);
  };

  const tagUserId = (tag: PhotoTag) => tag.userId || tag.usuarioId || '';
  const tagUserName = (tag: PhotoTag) => tag.userName || tag.nombre || 'Amigo';

  const removeTag = (tag: PhotoTag) => {
    const id = tagUserId(tag);
    if (isOwner || id === currentUser?.id) removePhotoTag(photo.id, tag.id);
  };

  const submitComment = (event: React.FormEvent) => {
    event.preventDefault();
    const text = commentText.trim();
    if (!text) return;
    addPhotoComment(photo.id, text);
    setCommentText('');
  };

  if (!canView && !isOwner) {
    return (
      <div className="fixed inset-0 z-[80] bg-black/90 backdrop-blur-md flex items-center justify-center p-4" role="dialog" aria-modal="true">
        <div className="w-full max-w-md rounded-xl border border-white/15 bg-[#171a21] text-white shadow-2xl p-6 text-center">
          <div className="text-amber-300 text-4xl mb-3">🔒</div>
          <h2 className="text-base font-bold">Foto privada</h2>
          <p className="text-sm text-gray-400 mt-2">No tienes permiso para visualizar esta fotografía.</p>
          <button onClick={() => viewPhoto(null)} className="mt-5 px-4 py-2 rounded bg-[#3869A0] hover:bg-[#2f5b8c] font-semibold text-sm">Cerrar</button>
        </div>
      </div>
    );
  }

  const previousAvailable = currentIndex > 0;
  const nextAvailable = currentIndex >= 0 && currentIndex < photoList.length - 1;

  return (
    <div
      ref={modalRef}
      tabIndex={-1}
      role="dialog"
      aria-modal="true"
      aria-label="Visor de fotos"
      className="fixed inset-0 z-[80] bg-black/80 backdrop-blur-md text-white outline-none"
    >
      <div className="h-full flex flex-col overflow-hidden bg-black/20">
        <header className="h-12 shrink-0 bg-[#20252d]/95 border-b border-white/10 px-3 sm:px-5 flex items-center justify-between shadow-lg">
          <div className="min-w-0 flex items-center gap-2 text-xs">
            <span className="font-bold text-white truncate">{albumName || `Fotos de ${photo.uploaderName || 'Usuario'}`}</span>
            <span className="text-white/30">•</span>
            <span className="text-white/60 whitespace-nowrap">Foto {Math.max(1, currentIndex + 1)} de {Math.max(1, photoList.length)}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => { setTaggingMode(value => !value); setPendingPoint(null); setSelectedFriendId(''); }}
              className={`hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded text-xs font-bold border transition ${taggingMode ? 'bg-amber-400 text-black border-amber-300' : 'bg-white/10 border-white/10 hover:bg-white/15'}`}
            >
              <Tag className="w-3.5 h-3.5" /> {taggingMode ? 'Cancelar' : 'Etiquetar'}
            </button>
            <button
              onClick={() => setShowTagBoxes(value => !value)}
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded text-xs font-bold bg-white/10 hover:bg-white/15 border border-white/10"
              title={showTagBoxes ? 'Ocultar recuadros' : 'Mostrar recuadros'}
            >
              {showTagBoxes ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
              <span className="hidden sm:inline">{showTagBoxes ? 'Ocultar' : 'Mostrar'}</span>
            </button>
            <button onClick={() => viewPhoto(null)} className="p-1.5 rounded bg-red-600/90 hover:bg-red-500" title="Cerrar (Esc)">
              <X className="w-4 h-4" />
            </button>
          </div>
        </header>

        <main className="flex-1 min-h-0 flex flex-col lg:flex-row">
          <section className="group relative min-h-0 flex-1 bg-[#090b0f] flex items-center justify-center p-3 sm:p-6">
            {taggingMode && !pendingPoint && (
              <div className="absolute top-4 left-1/2 -translate-x-1/2 z-40 px-4 py-2 rounded-full bg-amber-400 text-black text-xs font-bold shadow-xl animate-bounce">
                Haz clic sobre la persona para ubicar su etiqueta
              </div>
            )}

            <button
              onClick={() => goTo(-1)}
              disabled={!previousAvailable}
              className={`absolute left-3 sm:left-5 top-1/2 -translate-y-1/2 z-30 rounded-full p-3 bg-black/55 border border-white/15 shadow-xl transition opacity-100 pointer-events-auto lg:opacity-0 lg:pointer-events-none lg:group-hover:opacity-100 lg:group-hover:pointer-events-auto disabled:opacity-0 ${previousAvailable ? 'hover:bg-[#3869A0]' : ''}`}
              title="Foto anterior ←"
            >
              <ChevronLeft className="w-7 h-7" />
            </button>

            <div
              ref={imageWrapRef}
              onClick={handleImageClick}
              className={`relative max-w-full max-h-[82vh] inline-flex items-center justify-center ${taggingMode && !pendingPoint ? 'cursor-crosshair' : 'cursor-default'}`}
            >
              <img
                id="inkorium-retro-photo-image"
                src={photo.archivo}
                alt={photo.titulo || 'Fotografía'}
                onLoad={() => setImageLoaded(true)}
                className={`max-w-full max-h-full w-auto h-auto object-contain rounded-sm select-none transition-opacity duration-200 ${imageLoaded ? 'opacity-100' : 'opacity-0'}`}
                draggable={false}
              />

              {!imageLoaded && <div className="absolute inset-0 flex items-center justify-center text-xs text-white/50">Cargando foto…</div>}

              {showTagBoxes && tags.map(tag => {
                const id = tagUserId(tag);
                const name = tagUserName(tag);
                const highlighted = highlightedTagId === tag.id;
                const friend = users.find(user => user.id === id);
                return (
                  <div
                    key={tag.id}
                    className="absolute -translate-x-1/2 -translate-y-1/2 z-20"
                    style={{ left: `${tag.x}%`, top: `${tag.y}%` }}
                    onMouseEnter={() => setHighlightedTagId(tag.id)}
                    onMouseLeave={() => setHighlightedTagId(null)}
                    onClick={event => event.stopPropagation()}
                  >
                    <button
                      type="button"
                      onClick={() => { if (id) { viewUserProfile(id); viewPhoto(null); } }}
                      className={`relative w-16 h-16 sm:w-20 sm:h-20 rounded border-2 transition-all duration-200 ${highlighted ? 'border-amber-300 bg-amber-300/35 ring-4 ring-amber-300/35 scale-105 shadow-[0_0_22px_rgba(251,191,36,0.55)]' : 'border-white bg-white/10 hover:border-amber-300/90 hover:bg-amber-300/20'} ${highlighted ? 'animate-pulse' : ''}`}
                      title={`Ver perfil de ${name}`}
                    >
                      <span className="sr-only">{name}</span>
                    </button>
                    <div className={`absolute top-full left-1/2 -translate-x-1/2 mt-1 whitespace-nowrap px-2 py-1 rounded border text-[11px] font-bold shadow-lg transition-colors ${highlighted ? 'bg-amber-300 text-black border-amber-200' : 'bg-[#171a21]/95 text-white border-white/15'}`}>
                      <span className="inline-flex items-center gap-1">
                        {friend?.avatar ? <img src={friend.avatar} alt="" className="w-4 h-4 rounded-full object-cover" /> : <UserCircle2 className="w-3.5 h-3.5" />}
                        {name}
                        {(isOwner || id === currentUser?.id) && (
                          <button type="button" onClick={() => removeTag(tag)} className="ml-1 text-red-300 hover:text-red-100" title="Eliminar etiqueta"><X className="w-3 h-3" /></button>
                        )}
                      </span>
                    </div>
                  </div>
                );
              })}

              {taggingMode && pendingPoint && (
                <div
                  className="absolute -translate-x-1/2 -translate-y-1/2 z-40"
                  style={{ left: `${pendingPoint.x}%`, top: `${pendingPoint.y}%` }}
                  onClick={event => event.stopPropagation()}
                >
                  <div className="w-16 h-16 border-2 border-amber-300 bg-amber-300/30 rounded animate-pulse ring-4 ring-amber-300/20 shadow-2xl" />
                  <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 w-64 rounded-lg border border-amber-200/50 bg-[#151922]/98 p-3 shadow-2xl text-xs">
                    <div className="font-bold mb-2 text-amber-200">Nueva etiqueta</div>
                    <select
                      value={selectedFriendId}
                      onChange={event => setSelectedFriendId(event.target.value)}
                      className="w-full rounded border border-white/15 bg-[#232936] text-white px-2 py-2 text-xs outline-none focus:border-amber-300"
                    >
                      <option value="">Selecciona un amigo…</option>
                      {friends.map(friend => (
                        <option key={friend.id} value={friend.id}>{friend.nombre} {friend.apellidos}</option>
                      ))}
                    </select>
                    <div className="flex justify-end gap-1.5 mt-2">
                      <button onClick={() => { setPendingPoint(null); setSelectedFriendId(''); }} className="px-2.5 py-1.5 rounded bg-white/10 hover:bg-white/15">Cancelar</button>
                      <button onClick={handleConfirmTag} disabled={!selectedFriendId} className="px-2.5 py-1.5 rounded bg-amber-400 text-black font-bold disabled:opacity-40">Etiquetar</button>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <button
              onClick={() => goTo(1)}
              disabled={!nextAvailable}
              className="absolute right-3 sm:right-5 top-1/2 -translate-y-1/2 z-30 rounded-full p-3 bg-black/55 border border-white/15 shadow-xl transition opacity-100 pointer-events-auto hover:bg-[#3869A0] disabled:opacity-0 lg:opacity-0 lg:pointer-events-none lg:group-hover:opacity-100 lg:group-hover:pointer-events-auto"
              title="Foto siguiente →"
            >
              <ChevronRight className="w-7 h-7" />
            </button>

            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 text-[10px] text-white/40 bg-black/40 rounded-full px-3 py-1">
              ← Anterior · → Siguiente · Esc Cerrar
            </div>
          </section>

          <aside className="w-full lg:w-[360px] xl:w-[400px] shrink-0 bg-[#f7f8fa] text-[#20242b] border-t lg:border-t-0 lg:border-l border-black/10 flex flex-col min-h-0">
            <div className="p-4 border-b border-black/10 bg-white">
              <div className="flex items-center gap-3">
                {(() => {
                  const author = users.find(user => user.id === photo.uploaderId || user.username === photo.uploaderId);
                  return author?.avatar ? <img src={author.avatar} alt={photo.uploaderName} className="w-10 h-10 rounded-full object-cover border border-black/10" /> : <div className="w-10 h-10 rounded-full bg-[#3869A0] text-white flex items-center justify-center font-bold">{(photo.uploaderName || 'U').charAt(0).toUpperCase()}</div>;
                })()}
                <div className="min-w-0">
                  <button onClick={() => { viewUserProfile(photo.uploaderId); viewPhoto(null); }} className="block text-left font-bold text-sm text-[#3869A0] hover:underline truncate">{photo.uploaderName || 'Usuario'}</button>
                  <div className="text-[11px] text-gray-500 truncate">{photo.titulo || 'Fotografía'}{albumName ? ` · ${albumName}` : ''}</div>
                </div>
              </div>
            </div>

            <div className="p-4 border-b border-black/10 bg-[#f7f8fa]">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-1.5 text-xs font-bold text-gray-700"><Tag className="w-3.5 h-3.5 text-[#3869A0]" /> Amigos etiquetados</div>
                <button onClick={() => { setTaggingMode(true); setPendingPoint(null); }} className="text-[11px] text-[#3869A0] font-bold hover:underline">+ Etiquetar</button>
              </div>
              {tags.length === 0 ? (
                <p className="text-xs text-gray-400 italic">Nadie etiquetado todavía.</p>
              ) : (
                <div className="flex flex-wrap gap-1.5">
                  {tags.map(tag => {
                    const id = tagUserId(tag);
                    const active = highlightedTagId === tag.id;
                    return (
                      <button
                        key={tag.id}
                        onMouseEnter={() => setHighlightedTagId(tag.id)}
                        onMouseLeave={() => setHighlightedTagId(null)}
                        onClick={() => { if (id) { viewUserProfile(id); viewPhoto(null); } }}
                        className={`px-2 py-1 rounded border text-[11px] font-semibold transition ${active ? 'bg-amber-100 border-amber-300 text-amber-900 shadow-sm' : 'bg-white border-gray-200 text-[#3869A0] hover:bg-blue-50'}`}
                      >
                        {tagUserName(tag)}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="flex-1 min-h-0 overflow-y-auto bg-white">
              <div className="px-4 py-3 sticky top-0 bg-white/95 backdrop-blur border-b border-black/10 flex items-center gap-1.5 text-xs font-bold">
                <MessageSquare className="w-3.5 h-3.5 text-[#3869A0]" /> Comentarios ({comments.length})
              </div>
              <div className="p-4 space-y-3">
                {comments.length === 0 && <p className="text-xs text-gray-400 italic">Sé el primero en comentar esta foto.</p>}
                {comments.map(comment => (
                  <div key={comment.id} className="flex gap-2.5">
                    {comment.avatar ? <img src={comment.avatar} alt="" className="w-7 h-7 rounded-full object-cover border border-black/10 shrink-0" /> : <div className="w-7 h-7 rounded-full bg-gray-200 shrink-0" />}
                    <div className="min-w-0 rounded-lg bg-[#f2f4f7] px-2.5 py-2 flex-1">
                      <div className="text-[11px] font-bold text-[#3869A0]">{comment.nombre || comment.autorNombre || 'Usuario'}</div>
                      <div className="text-xs text-gray-700 whitespace-pre-wrap break-words">{comment.texto}</div>
                      <div className="text-[9px] text-gray-400 mt-1">{comment.fecha}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <form onSubmit={submitComment} className="p-3 border-t border-black/10 bg-[#f7f8fa]">
              <div className="flex gap-2">
                <input
                  value={commentText}
                  onChange={event => setCommentText(event.target.value)}
                  placeholder="Escribe un comentario…"
                  className="flex-1 min-w-0 rounded border border-gray-300 bg-white px-2.5 py-2 text-xs outline-none focus:border-[#3869A0]"
                  aria-label="Comentario"
                />
                <button type="submit" disabled={!commentText.trim()} className="rounded bg-[#3869A0] hover:bg-[#2f5b8c] text-white px-3 disabled:opacity-40" title="Publicar comentario">
                  <Send className="w-3.5 h-3.5" />
                </button>
              </div>
            </form>
          </aside>
        </main>
      </div>
    </div>
  );
};

export default PhotoRetroViewer;
