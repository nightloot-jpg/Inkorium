import React, { useState } from 'react';
import { useInkorium } from '../context/InkoriumContext';
import { 
  Image as ImageIcon, Plus, Upload, Trash2, Edit2, 
  Tag, Folder, Sparkles, Heart, MessageSquare,
  Globe, Users, Lock, UserCheck
} from 'lucide-react';
import { Album, Photo } from '../types';

export const PhotosView: React.FC<{ onOpenUpload: () => void }> = ({ onOpenUpload }) => {
  const {
    currentUser,
    photos,
    albums,
    selectedAlbumId,
    viewAlbum,
    viewPhoto,
    createAlbum,
    renameAlbum,
    deleteAlbum,
    viewUserProfile,
    canUserViewPhoto
  } = useInkorium();

  const [activeTab, setActiveTab] = useState<'albumes' | 'subidas' | 'etiquetadas'>('albumes');
  const [showNewAlbumModal, setShowNewAlbumModal] = useState(false);
  const [newAlbumTitle, setNewAlbumTitle] = useState('');
  const [newAlbumDesc, setNewAlbumDesc] = useState('');

  // Selected album object (if viewing a specific album)
  const currentAlbum = albums.find(a => a.id === selectedAlbumId);

  // Photos filters
  const myUploadedPhotos = photos.filter(p => p.uploaderId === currentUser.id);
  const myTaggedPhotos = photos.filter(p => 
    Array.isArray(p.etiquetas) && 
    p.etiquetas.some(t => t.userId === currentUser.id || t.usuarioId === currentUser.id) &&
    canUserViewPhoto(p, currentUser.id)
  );
  const albumPhotos = selectedAlbumId 
    ? photos.filter(p => p.albumId === selectedAlbumId && canUserViewPhoto(p, currentUser.id))
    : [];

  const handleCreateAlbumSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAlbumTitle.trim()) return;
    createAlbum(newAlbumTitle.trim(), newAlbumDesc.trim() || undefined);
    setNewAlbumTitle('');
    setNewAlbumDesc('');
    setShowNewAlbumModal(false);
  };

  const handleRenameAlbum = (album: Album) => {
    const nuevo = prompt('Escribe el nuevo nombre del álbum:', album.nombre);
    if (nuevo && nuevo.trim()) {
      renameAlbum(album.id, nuevo.trim());
    }
  };

  const handleDeleteAlbum = (album: Album) => {
    if (confirm(`¿Estás seguro de borrar el álbum "${album.nombre}"? Las fotos no se borrarán.`)) {
      deleteAlbum(album.id);
      if (selectedAlbumId === album.id) {
        viewAlbum(null);
      }
    }
  };

  return (
    <div className="w-full max-w-[1720px] 2xl:max-w-[1850px] mx-auto px-3 sm:px-6 lg:px-8 py-4 space-y-4">
      {/* Top Header Card */}
      <div className="bg-white dark:bg-[#0e1726] rounded border border-[#ccd5df] dark:border-[#1d2b40] p-4 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <ImageIcon className="w-5 h-5 text-[#3869A0] dark:text-blue-400" />
            <span>Álbumes y Fotos de Inkorium</span>
          </h1>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
            Explora tus fotos subidas, etiquetadas y álbumes personalizados
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowNewAlbumModal(true)}
            className="px-3 py-1.5 bg-white dark:bg-slate-800 hover:bg-gray-50 dark:hover:bg-slate-700 text-gray-700 dark:text-gray-200 border border-gray-300 dark:border-slate-700 rounded text-xs font-bold flex items-center gap-1.5 transition cursor-pointer shadow-xs"
          >
            <Plus className="w-3.5 h-3.5 text-[#3869A0] dark:text-blue-400" />
            <span>Crear álbum</span>
          </button>

          <button
            onClick={onOpenUpload}
            className="px-3.5 py-1.5 bg-[#3869A0] hover:bg-[#2c537f] text-white rounded text-xs font-bold flex items-center gap-1.5 transition cursor-pointer shadow-xs"
          >
            <Upload className="w-3.5 h-3.5" />
            <span>Subir fotos</span>
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-[#ccd5df] dark:border-[#1d2b40] pb-1 px-1 text-xs font-semibold">
        <button
          onClick={() => {
            viewAlbum(null);
            setActiveTab('albumes');
          }}
          className={`px-3 py-1.5 rounded transition cursor-pointer flex items-center gap-1.5 ${
            activeTab === 'albumes' && !selectedAlbumId ? 'bg-[#3869A0] text-white shadow-xs' : 'text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-slate-800'
          }`}
        >
          <Folder className="w-3.5 h-3.5" />
          <span>Mis Álbumes</span>
        </button>

        <button
          onClick={() => {
            viewAlbum(null);
            setActiveTab('subidas');
          }}
          className={`px-3 py-1.5 rounded transition cursor-pointer flex items-center gap-1.5 ${
            activeTab === 'subidas' ? 'bg-[#3869A0] text-white shadow-xs' : 'text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-slate-800'
          }`}
        >
          <Upload className="w-3.5 h-3.5" />
          <span>Fotos subidas ({myUploadedPhotos.length})</span>
        </button>

        <button
          onClick={() => {
            viewAlbum(null);
            setActiveTab('etiquetadas');
          }}
          className={`px-3 py-1.5 rounded transition cursor-pointer flex items-center gap-1.5 ${
            activeTab === 'etiquetadas' ? 'bg-[#3869A0] text-white shadow-xs' : 'text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-slate-800'
          }`}
        >
          <Tag className="w-3.5 h-3.5" />
          <span>Fotos etiquetadas ({myTaggedPhotos.length})</span>
        </button>

        {selectedAlbumId && currentAlbum && (
          <span className="ml-auto text-xs text-gray-500 font-normal">
            Álbum activo: <b className="text-[#3869A0]">{currentAlbum.nombre}</b>
          </span>
        )}
      </div>

      {/* ================= VIEWING SPECIFIC ALBUM ================= */}
      {selectedAlbumId && currentAlbum ? (
        <div className="bg-white dark:bg-[#0e1726] rounded border border-[#ccd5df] dark:border-[#1d2b40] p-4 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-gray-200 dark:border-slate-800">
            <div>
              <h2 className="text-base font-bold text-gray-900 dark:text-white">{currentAlbum.nombre}</h2>
              {currentAlbum.descripcion && (
                <p className="text-xs text-gray-600 dark:text-gray-300">{currentAlbum.descripcion}</p>
              )}
            </div>

            <button
              onClick={() => viewAlbum(null)}
              className="text-xs text-[#3869A0] dark:text-blue-400 hover:underline font-semibold cursor-pointer"
            >
              ← Volver a todos los álbumes
            </button>
          </div>

          {albumPhotos.length === 0 ? (
            <div className="text-center py-12 text-gray-400 text-xs">
              Este álbum aún no tiene fotos. ¡Sube algunas ahora!
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
              {albumPhotos.map(p => (
                <div
                  key={p.id}
                  onClick={() => viewPhoto(p.id)}
                  className="group relative rounded overflow-hidden border border-gray-200 dark:border-slate-700 bg-gray-100 dark:bg-slate-800 aspect-square cursor-pointer shadow-xs hover:shadow-md transition"
                >
                  <img src={p.archivo} alt={p.titulo} className="w-full h-full object-cover group-hover:scale-105 transition duration-200" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition p-2 flex flex-col justify-end text-white text-xs">
                    <p className="font-bold truncate text-[11px]">{p.titulo}</p>
                    <div className="flex items-center justify-between text-[10px] text-white/80 mt-1">
                      <span>{p.likes.length} ❤️</span>
                      <span>{p.comentarios.length} 💬</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : activeTab === 'subidas' ? (
        /* ================= SUBIDAS VIEW ================= */
        <div className="bg-white dark:bg-[#0e1726] rounded border border-[#ccd5df] dark:border-[#1d2b40] p-4 shadow-xs space-y-4">
          <h2 className="font-bold text-sm text-gray-800 dark:text-gray-200 pb-2 border-b border-gray-200 dark:border-slate-800">
            Fotos subidas por ti ({myUploadedPhotos.length})
          </h2>

          {myUploadedPhotos.length === 0 ? (
            <div className="text-center py-12 text-gray-400 text-xs">
              No has subido ninguna foto todavía.
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
              {myUploadedPhotos.map(p => (
                <div
                  key={p.id}
                  onClick={() => viewPhoto(p.id)}
                  className="group relative rounded overflow-hidden border border-gray-200 dark:border-slate-700 bg-gray-100 dark:bg-slate-800 aspect-square cursor-pointer shadow-xs hover:shadow-md transition"
                >
                  <img src={p.archivo} alt={p.titulo} className="w-full h-full object-cover group-hover:scale-105 transition duration-200" />
                  
                  {/* Top-left Privacy badge */}
                  <div className="absolute top-1.5 left-1.5 z-10">
                    {p.privacidad === 'publica' && (
                      <span className="bg-black/60 backdrop-blur-xs text-blue-300 text-[10px] font-bold px-1.5 py-0.5 rounded flex items-center gap-1 shadow-xs" title="Foto pública">
                        <Globe className="w-2.5 h-2.5" />
                        <span className="hidden sm:inline">Pública</span>
                      </span>
                    )}
                    {(!p.privacidad || p.privacidad === 'amigos') && (
                      <span className="bg-black/60 backdrop-blur-xs text-emerald-300 text-[10px] font-bold px-1.5 py-0.5 rounded flex items-center gap-1 shadow-xs" title="Solo amigos">
                        <Users className="w-2.5 h-2.5" />
                        <span className="hidden sm:inline">Amigos</span>
                      </span>
                    )}
                    {p.privacidad === 'eleccion' && (
                      <span className="bg-black/60 backdrop-blur-xs text-purple-300 text-[10px] font-bold px-1.5 py-0.5 rounded flex items-center gap-1 shadow-xs" title="Elección personalizada">
                        <UserCheck className="w-2.5 h-2.5" />
                        <span className="hidden sm:inline">Elección ({(p.allowedUserIds || []).length})</span>
                      </span>
                    )}
                  </div>

                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition p-2 flex flex-col justify-end text-white text-xs">
                    <p className="font-bold truncate text-[11px]">{p.titulo}</p>
                    <div className="flex items-center justify-between text-[10px] text-white/80 mt-1">
                      <span>{p.likes.length} ❤️</span>
                      <span>{p.comentarios.length} 💬</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : activeTab === 'etiquetadas' ? (
        /* ================= ETIQUETADAS VIEW ================= */
        <div className="bg-white dark:bg-[#0e1726] rounded border border-[#ccd5df] dark:border-[#1d2b40] p-4 shadow-xs space-y-4">
          <h2 className="font-bold text-sm text-gray-800 dark:text-gray-200 pb-2 border-b border-gray-200 dark:border-slate-800">
            Fotos en las que estás etiquetado/a ({myTaggedPhotos.length})
          </h2>

          {myTaggedPhotos.length === 0 ? (
            <div className="text-center py-12 text-gray-400 text-xs">
              No estás etiquetado/a en ninguna foto aún. ¡Pídeles a tus amigos que te etiqueten!
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
              {myTaggedPhotos.map(p => (
                <div
                  key={p.id}
                  onClick={() => viewPhoto(p.id)}
                  className="group relative rounded overflow-hidden border border-gray-200 dark:border-slate-700 bg-gray-100 dark:bg-slate-800 aspect-square cursor-pointer shadow-xs hover:shadow-md transition"
                >
                  <img src={p.archivo} alt={p.titulo} className="w-full h-full object-cover group-hover:scale-105 transition duration-200" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition p-2 flex flex-col justify-end text-white text-xs">
                    <p className="font-bold truncate text-[11px]">{p.titulo}</p>
                    <p className="text-[10px] text-blue-200 truncate">Por: {p.uploaderName}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        /* ================= ALBUMS MAIN GRID (Classic Tuenti Stacks) ================= */
        <div className="bg-white dark:bg-[#0e1726] rounded border border-[#ccd5df] dark:border-[#1d2b40] p-4 shadow-xs space-y-6">
          {/* Default Core Albums */}
          <div>
            <h3 className="font-bold text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">
              Álbumes del sistema
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
              {/* Fotos subidas card */}
              <div
                onClick={() => setActiveTab('subidas')}
                className="border border-gray-200 dark:border-slate-700 hover:border-[#3869A0] rounded p-3 bg-gradient-to-b from-white to-gray-50 dark:from-[#111c2e] dark:to-[#0e1726] cursor-pointer shadow-xs hover:shadow-md transition group text-center"
              >
                <div className="h-36 rounded bg-gray-100 dark:bg-slate-800 overflow-hidden mb-2 relative flex items-center justify-center border border-gray-200 dark:border-slate-700">
                  {myUploadedPhotos[0] ? (
                    <img src={myUploadedPhotos[0].archivo} alt="" className="w-full h-full object-cover group-hover:scale-105 transition" />
                  ) : (
                    <Upload className="w-10 h-10 text-gray-300 dark:text-gray-600" />
                  )}
                  <span className="absolute bottom-1 right-1 bg-black/70 text-white text-[10px] font-bold px-1.5 py-0.5 rounded">
                    {myUploadedPhotos.length} fotos
                  </span>
                </div>
                <h4 className="font-bold text-sm text-[#3869A0] dark:text-blue-400 group-hover:underline">Fotos subidas</h4>
                <p className="text-[11px] text-gray-500 dark:text-gray-400">Todas tus fotos compartidas</p>
              </div>

              {/* Fotos etiquetadas card */}
              <div
                onClick={() => setActiveTab('etiquetadas')}
                className="border border-gray-200 dark:border-slate-700 hover:border-[#3869A0] rounded p-3 bg-gradient-to-b from-white to-gray-50 dark:from-[#111c2e] dark:to-[#0e1726] cursor-pointer shadow-xs hover:shadow-md transition group text-center"
              >
                <div className="h-36 rounded bg-gray-100 dark:bg-slate-800 overflow-hidden mb-2 relative flex items-center justify-center border border-gray-200 dark:border-slate-700">
                  {myTaggedPhotos[0] ? (
                    <img src={myTaggedPhotos[0].archivo} alt="" className="w-full h-full object-cover group-hover:scale-105 transition" />
                  ) : (
                    <Tag className="w-10 h-10 text-gray-300 dark:text-gray-600" />
                  )}
                  <span className="absolute bottom-1 right-1 bg-black/70 text-white text-[10px] font-bold px-1.5 py-0.5 rounded">
                    {myTaggedPhotos.length} fotos
                  </span>
                </div>
                <h4 className="font-bold text-sm text-[#3869A0] dark:text-blue-400 group-hover:underline">Fotos etiquetadas</h4>
                <p className="text-[11px] text-gray-500 dark:text-gray-400">Fotos donde apareces tú</p>
              </div>
            </div>
          </div>

          {/* User Custom Personal Albums */}
          <div className="pt-4 border-t border-gray-200 dark:border-slate-800">
            <h3 className="font-bold text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">
              Álbumes personalizados
            </h3>

            {albums.length === 0 ? (
              <div className="text-center py-6 text-gray-400 text-xs">
                No has creado ningún álbum todavía. ¡Crea uno para organizar tus fotos!
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                {albums.map(album => {
                  const cover = photos.find(p => p.albumId === album.id);
                  const count = photos.filter(p => p.albumId === album.id).length;
                  const isOwner = (album.userId === currentUser.id) || (album.propietarioId === currentUser.id);

                  return (
                    <div
                      key={album.id}
                      className="border border-gray-200 dark:border-slate-700 hover:border-[#3869A0] rounded p-3 bg-white dark:bg-[#111c2e] shadow-xs hover:shadow-md transition group flex flex-col justify-between"
                    >
                      <div 
                        onClick={() => viewAlbum(album.id)}
                        className="cursor-pointer"
                      >
                        <div className="h-36 rounded bg-gray-100 dark:bg-slate-800 overflow-hidden mb-2 relative flex items-center justify-center border border-gray-200 dark:border-slate-700">
                          {cover ? (
                            <img src={cover.archivo} alt="" className="w-full h-full object-cover group-hover:scale-105 transition" />
                          ) : (
                            <Folder className="w-10 h-10 text-gray-300 dark:text-gray-600" />
                          )}
                          <span className="absolute bottom-1 right-1 bg-black/70 text-white text-[10px] font-bold px-1.5 py-0.5 rounded">
                            {count} fotos
                          </span>
                        </div>
                        <h4 className="font-bold text-sm text-[#3869A0] dark:text-blue-400 group-hover:underline truncate">{album.nombre}</h4>
                        {album.descripcion && (
                          <p className="text-[11px] text-gray-500 dark:text-gray-400 line-clamp-1">{album.descripcion}</p>
                        )}
                        <span className="text-[10px] text-gray-400 mt-1 block">{album.fecha}</span>
                      </div>

                      {isOwner && (
                        <div className="flex items-center justify-end gap-2 pt-2 mt-2 border-t border-gray-100 dark:border-slate-800 text-xs">
                          <button
                            onClick={() => handleRenameAlbum(album)}
                            className="text-gray-500 dark:text-gray-400 hover:text-[#3869A0] dark:hover:text-blue-400 p-1 flex items-center gap-0.5 text-[11px] cursor-pointer"
                            title="Renombrar álbum"
                          >
                            <Edit2 className="w-3 h-3" />
                            <span>Renombrar</span>
                          </button>
                          <button
                            onClick={() => handleDeleteAlbum(album)}
                            className="text-gray-500 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400 p-1 flex items-center gap-0.5 text-[11px] cursor-pointer"
                            title="Borrar álbum"
                          >
                            <Trash2 className="w-3 h-3" />
                            <span>Borrar</span>
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ================= CREATE ALBUM MODAL ================= */}
      {showNewAlbumModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white dark:bg-[#0e1726] rounded-lg border border-gray-300 dark:border-slate-700 max-w-md w-full p-4 shadow-2xl space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-gray-200 dark:border-slate-800">
              <h3 className="font-bold text-sm text-gray-900 dark:text-white">Crear un álbum personalizado</h3>
              <button 
                onClick={() => setShowNewAlbumModal(false)}
                className="text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 text-base font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateAlbumSubmit} className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-gray-700 dark:text-gray-200 block mb-1">Nombre del álbum:</label>
                <input
                  type="text"
                  placeholder="Ej: Vacaciones 2009, Cumpleaños, Fiesta..."
                  value={newAlbumTitle}
                  onChange={e => setNewAlbumTitle(e.target.value)}
                  className="w-full p-2 text-xs rounded border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-gray-900 dark:text-white focus:outline-none focus:border-[#3869A0]"
                  required
                  autoFocus
                />
              </div>

              <div>
                <label className="font-bold text-gray-700 dark:text-gray-200 block mb-1">Descripción (opcional):</label>
                <textarea
                  rows={2}
                  placeholder="De qué tratan las fotos de este álbum..."
                  value={newAlbumDesc}
                  onChange={e => setNewAlbumDesc(e.target.value)}
                  className="w-full p-2 text-xs rounded border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-gray-900 dark:text-white focus:outline-none focus:border-[#3869A0] resize-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-gray-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowNewAlbumModal(false)}
                  className="px-3.5 py-1.5 rounded bg-gray-100 dark:bg-slate-800 hover:bg-gray-200 dark:hover:bg-slate-700 text-gray-700 dark:text-gray-200 font-semibold cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={!newAlbumTitle.trim()}
                  className="px-4 py-1.5 rounded bg-[#3869A0] hover:bg-[#2c537f] text-white font-bold cursor-pointer shadow-xs disabled:opacity-50"
                >
                  Crear álbum
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
