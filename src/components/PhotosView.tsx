import React, { useState, useMemo } from 'react';
import { useInkorium } from '../context/InkoriumContext';
import { 
  Image as ImageIcon, Plus, Upload, Trash2, Edit2, 
  Tag, Folder, Sparkles, Heart, MessageSquare,
  Globe, Users, Lock, UserCheck, Calendar, UserPlus,
  Layers, Filter, ArrowLeft, Shield, CheckCircle2, ChevronRight,
  Clock, ArrowUpDown, SlidersHorizontal, GripVertical, Camera
} from 'lucide-react';
import { Album, Photo } from '../types';
import { CollaborativeAlbumCreateModal } from './CollaborativeAlbumCreateModal';
import { CollaborativeBatchUploadModal } from './CollaborativeBatchUploadModal';
import { CollaboratorsManageModal } from './CollaboratorsManageModal';
import { CollaborativeTimelineManagerModal } from './CollaborativeTimelineManagerModal';

export const PhotosView: React.FC<{ onOpenUpload: () => void }> = ({ onOpenUpload }) => {
  const {
    currentUser,
    users,
    photos,
    albums,
    events,
    selectedAlbumId,
    viewAlbum,
    viewPhoto,
    createAlbum,
    renameAlbum,
    deleteAlbum,
    viewUserProfile,
    canUserViewPhoto,
    canUserUploadToAlbum,
    setSelectedEventId,
    setActiveTab: setNavActiveTab
  } = useInkorium();

  const [activeTab, setActiveTab] = useState<'albumes' | 'subidas' | 'etiquetadas'>('albumes');
  
  // Modals state
  const [showCreateCollabModal, setShowCreateCollabModal] = useState(false);
  const [showBatchUploadModal, setShowBatchUploadModal] = useState(false);
  const [batchTargetAlbumId, setBatchTargetAlbumId] = useState<string | null>(null);
  const [managingAlbum, setManagingAlbum] = useState<Album | null>(null);
  const [showTimelineManagerModal, setShowTimelineManagerModal] = useState(false);
  const [albumDisplayMode, setAlbumDisplayMode] = useState<'grid' | 'timeline'>('grid');

  // Filter inside specific album
  const [uploaderFilter, setUploaderFilter] = useState<string>('all');

  // Selected album object (if viewing a specific album)
  const currentAlbum = useMemo(() => {
    return albums.find(a => a.id === selectedAlbumId);
  }, [albums, selectedAlbumId]);

  // Photos filters
  const myUploadedPhotos = useMemo(() => {
    return photos.filter(p => p.uploaderId === currentUser.id);
  }, [photos, currentUser.id]);

  const myTaggedPhotos = useMemo(() => {
    return photos.filter(p => 
      Array.isArray(p.etiquetas) && 
      p.etiquetas.some(t => t.userId === currentUser.id || t.usuarioId === currentUser.id) &&
      canUserViewPhoto(p, currentUser.id)
    );
  }, [photos, currentUser.id, canUserViewPhoto]);

  const albumPhotos = useMemo(() => {
    if (!selectedAlbumId) return [];
    const raw = photos.filter(p => p.albumId === selectedAlbumId && canUserViewPhoto(p, currentUser.id));

    // Sort according to currentAlbum photoOrder if specified
    if (currentAlbum?.photoOrder && currentAlbum.photoOrder.length > 0) {
      const orderMap = new Map<string, number>();
      currentAlbum.photoOrder.forEach((id, idx) => orderMap.set(id, idx));

      return [...raw].sort((a, b) => {
        const orderA = orderMap.has(a.id) ? orderMap.get(a.id)! : 999999;
        const orderB = orderMap.has(b.id) ? orderMap.get(b.id)! : 999999;
        return orderA - orderB;
      });
    }

    return raw;
  }, [photos, selectedAlbumId, canUserViewPhoto, currentUser.id, currentAlbum]);

  // Filtered album photos by uploader
  const filteredAlbumPhotos = useMemo(() => {
    if (uploaderFilter === 'all') return albumPhotos;
    return albumPhotos.filter(p => p.uploaderId === uploaderFilter);
  }, [albumPhotos, uploaderFilter]);

  // Unique uploaders in current album
  const albumUploaders = useMemo(() => {
    const map = new Map<string, { id: string; name: string; avatar?: string; count: number }>();
    albumPhotos.forEach(p => {
      const existing = map.get(p.uploaderId);
      if (existing) {
        existing.count += 1;
      } else {
        const u = users.find(user => user.id === p.uploaderId);
        map.set(p.uploaderId, {
          id: p.uploaderId,
          name: p.uploaderName || u?.nombre || 'Usuario',
          avatar: p.uploaderAvatar || u?.avatar,
          count: 1
        });
      }
    });
    return Array.from(map.values());
  }, [albumPhotos, users]);

  // Collaborative Albums vs Personal Albums
  const collaborativeAlbums = useMemo(() => {
    return albums.filter(a => a.isCollaborative);
  }, [albums]);

  const personalAlbums = useMemo(() => {
    return albums.filter(a => !a.isCollaborative);
  }, [albums]);

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

  const handleOpenBatchUploadForAlbum = (albId: string) => {
    setBatchTargetAlbumId(albId);
    setShowBatchUploadModal(true);
  };

  const handleGoToLinkedEvent = (eventId: string) => {
    setSelectedEventId(eventId);
    setNavActiveTab('eventos');
  };

  const isCurrentAlbumOwner = currentAlbum 
    ? (currentAlbum.userId === currentUser.id || currentAlbum.propietarioId === currentUser.id)
    : false;

  const canUploadToCurrentAlbum = currentAlbum
    ? canUserUploadToAlbum(currentAlbum, currentUser.id)
    : true;

  return (
    <div className="w-full max-w-[1720px] 2xl:max-w-[1850px] mx-auto px-3 sm:px-6 lg:px-8 py-4 space-y-4 animate-fade-in">
      
      {/* Top Header Card */}
      <div className="bg-white dark:bg-[#0e1726] rounded-xl border border-[#ccd5df] dark:border-[#1d2b40] p-4 sm:p-5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <ImageIcon className="w-5 h-5 text-[#3869A0] dark:text-blue-400" />
            <span>Álbumes y Fotos de Inkorium</span>
          </h1>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
            Crea álbumes colaborativos de fiestas y eventos o explora tus fotos compartidas
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Create Collaborative Album Button */}
          <button
            onClick={() => setShowCreateCollabModal(true)}
            className="px-3.5 py-1.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 transition cursor-pointer shadow-xs"
          >
            <Users className="w-3.5 h-3.5" />
            <span>Crear Álbum Colaborativo</span>
          </button>

          {/* Batch Upload Simultaneous Button */}
          <button
            onClick={() => {
              setBatchTargetAlbumId(selectedAlbumId || null);
              setShowBatchUploadModal(true);
            }}
            className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 transition cursor-pointer shadow-xs"
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Subida Simultánea</span>
          </button>

          {/* Single Upload Button */}
          <button
            onClick={onOpenUpload}
            className="px-3 py-1.5 bg-[#3869A0] hover:bg-[#2c537f] text-white rounded-lg text-xs font-bold flex items-center gap-1.5 transition cursor-pointer shadow-xs"
          >
            <Upload className="w-3.5 h-3.5" />
            <span>Subir foto</span>
          </button>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-[#ccd5df] dark:border-[#1d2b40] pb-1 px-1 text-xs font-semibold overflow-x-auto">
        <button
          onClick={() => {
            viewAlbum(null);
            setActiveTab('albumes');
          }}
          className={`px-3.5 py-1.5 rounded-lg transition cursor-pointer flex items-center gap-1.5 shrink-0 ${
            activeTab === 'albumes' && !selectedAlbumId 
              ? 'bg-[#3869A0] text-white shadow-xs' 
              : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-800'
          }`}
        >
          <Folder className="w-3.5 h-3.5" />
          <span>Todos los Álbumes ({albums.length})</span>
        </button>

        <button
          onClick={() => {
            viewAlbum(null);
            setActiveTab('subidas');
          }}
          className={`px-3.5 py-1.5 rounded-lg transition cursor-pointer flex items-center gap-1.5 shrink-0 ${
            activeTab === 'subidas' 
              ? 'bg-[#3869A0] text-white shadow-xs' 
              : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-800'
          }`}
        >
          <Upload className="w-3.5 h-3.5" />
          <span>Mis fotos subidas ({myUploadedPhotos.length})</span>
        </button>

        <button
          onClick={() => {
            viewAlbum(null);
            setActiveTab('etiquetadas');
          }}
          className={`px-3.5 py-1.5 rounded-lg transition cursor-pointer flex items-center gap-1.5 shrink-0 ${
            activeTab === 'etiquetadas' 
              ? 'bg-[#3869A0] text-white shadow-xs' 
              : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-800'
          }`}
        >
          <Tag className="w-3.5 h-3.5" />
          <span>Fotos donde aparezco ({myTaggedPhotos.length})</span>
        </button>

        {selectedAlbumId && currentAlbum && (
          <div className="ml-auto flex items-center gap-2 text-xs">
            <span className="text-gray-400">Viendo:</span>
            <span className="font-bold text-[#3869A0] dark:text-blue-400 truncate max-w-xs">
              {currentAlbum.nombre}
            </span>
          </div>
        )}
      </div>

      {/* ================= VIEWING SPECIFIC ALBUM ================= */}
      {selectedAlbumId && currentAlbum ? (
        <div className="bg-white dark:bg-[#0e1726] rounded-xl border border-[#ccd5df] dark:border-[#1d2b40] p-4 sm:p-5 shadow-xs space-y-4">
          
          {/* Album Header Banner */}
          <div className="pb-4 border-b border-gray-200 dark:border-slate-800 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <div className="flex flex-wrap items-center gap-2 mb-1">
                  <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                    {currentAlbum.nombre}
                  </h2>

                  {currentAlbum.isCollaborative && (
                    <span className="bg-blue-100 dark:bg-blue-900/60 text-[#3869A0] dark:text-blue-300 text-xs font-bold px-2 py-0.5 rounded-full flex items-center gap-1 shadow-2xs">
                      <Users className="w-3 h-3" />
                      <span>Álbum Colaborativo</span>
                    </span>
                  )}

                  {currentAlbum.eventName && (
                    <button
                      onClick={() => currentAlbum.eventId && handleGoToLinkedEvent(currentAlbum.eventId)}
                      className="bg-purple-100 dark:bg-purple-900/50 hover:bg-purple-200 text-purple-800 dark:text-purple-300 text-xs font-bold px-2 py-0.5 rounded-full flex items-center gap-1 transition cursor-pointer"
                      title="Ver ficha del evento"
                    >
                      <Calendar className="w-3 h-3" />
                      <span>Evento: {currentAlbum.eventName}</span>
                      <ChevronRight className="w-3 h-3" />
                    </button>
                  )}
                </div>

                {currentAlbum.descripcion && (
                  <p className="text-xs text-gray-600 dark:text-gray-300 max-w-2xl leading-relaxed">
                    {currentAlbum.descripcion}
                  </p>
                )}

                <div className="flex flex-wrap items-center gap-3 text-[11px] text-gray-500 dark:text-gray-400 mt-2">
                  <span>Creado por: <strong>{currentAlbum.propietarioNombre || 'Usuario'}</strong></span>
                  <span>•</span>
                  <span>{currentAlbum.fecha}</span>
                  <span>•</span>
                  <span>{albumPhotos.length} fotos en total</span>
                  {currentAlbum.photoOrder && currentAlbum.photoOrder.length > 0 && (
                    <>
                      <span>•</span>
                      <span className="text-blue-600 dark:text-blue-400 font-bold flex items-center gap-1">
                        <Sparkles className="w-3 h-3" />
                        <span>Cronología personalizada</span>
                      </span>
                    </>
                  )}
                </div>
              </div>

              {/* Action Buttons for Album */}
              <div className="flex flex-wrap items-center gap-2">
                {/* Mode Switcher: Grid vs Timeline */}
                <div className="flex items-center bg-gray-100 dark:bg-slate-800 p-0.5 rounded-lg border border-gray-200 dark:border-slate-700">
                  <button
                    onClick={() => setAlbumDisplayMode('grid')}
                    className={`px-2.5 py-1 rounded-md font-semibold text-xs transition cursor-pointer flex items-center gap-1 ${
                      albumDisplayMode === 'grid'
                        ? 'bg-white dark:bg-slate-700 text-[#3869A0] dark:text-white shadow-2xs'
                        : 'text-gray-600 dark:text-gray-400'
                    }`}
                  >
                    <Layers className="w-3 h-3" />
                    <span>Cuadrícula</span>
                  </button>
                  <button
                    onClick={() => setAlbumDisplayMode('timeline')}
                    className={`px-2.5 py-1 rounded-md font-semibold text-xs transition cursor-pointer flex items-center gap-1 ${
                      albumDisplayMode === 'timeline'
                        ? 'bg-white dark:bg-slate-700 text-[#3869A0] dark:text-white shadow-2xs'
                        : 'text-gray-600 dark:text-gray-400'
                    }`}
                  >
                    <Clock className="w-3 h-3" />
                    <span>Cronología</span>
                  </button>
                </div>

                <button
                  onClick={() => viewAlbum(null)}
                  className="px-3 py-1.5 rounded-lg border border-gray-300 dark:border-slate-700 hover:bg-gray-50 dark:hover:bg-slate-800 text-gray-700 dark:text-gray-200 text-xs font-semibold flex items-center gap-1 cursor-pointer transition"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Volver</span>
                </button>

                {/* Drag & Drop Timeline Manager button for creator */}
                {isCurrentAlbumOwner && (
                  <button
                    onClick={() => setShowTimelineManagerModal(true)}
                    className="px-3 py-1.5 rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white text-xs font-bold flex items-center gap-1.5 transition cursor-pointer shadow-xs"
                    title="Arrastra y suelta fotos para reordenar la cronología del evento"
                  >
                    <GripVertical className="w-3.5 h-3.5" />
                    <span>Reordenar Cronología</span>
                  </button>
                )}

                {currentAlbum.isCollaborative && isCurrentAlbumOwner && (
                  <button
                    onClick={() => setManagingAlbum(currentAlbum)}
                    className="px-3 py-1.5 rounded-lg bg-blue-50 dark:bg-blue-950/50 hover:bg-blue-100 dark:hover:bg-blue-900/60 text-[#3869A0] dark:text-blue-300 border border-blue-200 dark:border-blue-800 text-xs font-bold flex items-center gap-1.5 transition cursor-pointer shadow-xs"
                  >
                    <UserPlus className="w-3.5 h-3.5" />
                    <span>Colaboradores</span>
                  </button>
                )}

                {canUploadToCurrentAlbum && (
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => handleOpenBatchUploadForAlbum(currentAlbum.id)}
                      className="px-3.5 py-1.5 rounded-lg bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white text-xs font-bold flex items-center gap-1.5 transition cursor-pointer shadow-xs"
                      title="Sube fotos aplicando los filtros y sello LED de fecha estilo Cámara 2008"
                    >
                      <Camera className="w-3.5 h-3.5" />
                      <span>Cámara 2008 / Subir</span>
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Filter by Uploader Friend in Collaborative Album */}
            {albumUploaders.length > 1 && (
              <div className="pt-2 flex flex-wrap items-center gap-2 text-xs">
                <span className="text-gray-500 font-semibold flex items-center gap-1">
                  <Filter className="w-3 h-3" />
                  Filtrar por amigo:
                </span>
                <button
                  onClick={() => setUploaderFilter('all')}
                  className={`px-2.5 py-1 rounded-full text-xs font-semibold transition cursor-pointer ${
                    uploaderFilter === 'all'
                      ? 'bg-[#3869A0] text-white shadow-xs'
                      : 'bg-gray-100 dark:bg-slate-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-slate-700'
                  }`}
                >
                  Todos ({albumPhotos.length})
                </button>
                {albumUploaders.map(uploader => (
                  <button
                    key={uploader.id}
                    onClick={() => setUploaderFilter(uploader.id)}
                    className={`px-2.5 py-1 rounded-full text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer ${
                      uploaderFilter === uploader.id
                        ? 'bg-[#3869A0] text-white shadow-xs'
                        : 'bg-gray-100 dark:bg-slate-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-slate-700'
                    }`}
                  >
                    <img 
                      src={uploader.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=50'} 
                      alt="" 
                      className="w-4 h-4 rounded-full object-cover" 
                    />
                    <span>{uploader.name} ({uploader.count})</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Photos Area: Grid vs Timeline Flow */}
          {filteredAlbumPhotos.length === 0 ? (
            <div className="text-center py-16 space-y-3 bg-gray-50/50 dark:bg-slate-900/30 rounded-xl border border-dashed border-gray-300 dark:border-slate-800">
              <div className="w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-950 text-[#3869A0] dark:text-blue-400 flex items-center justify-center mx-auto">
                <ImageIcon className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-sm text-gray-800 dark:text-gray-200">
                {uploaderFilter === 'all' ? 'Este álbum aún no tiene fotos' : 'No hay fotos con este filtro'}
              </h3>
              <p className="text-xs text-gray-500 max-w-sm mx-auto">
                {canUploadToCurrentAlbum 
                  ? '¡Sé el primero en subir las fotos de la fiesta o evento para compartirlas con todos!' 
                  : 'Aún no se han publicado fotos en este álbum.'}
              </p>
              {canUploadToCurrentAlbum && (
                <button
                  onClick={() => handleOpenBatchUploadForAlbum(currentAlbum.id)}
                  className="px-4 py-2 bg-[#3869A0] hover:bg-[#2c537f] text-white rounded-lg text-xs font-bold cursor-pointer shadow-xs inline-flex items-center gap-2"
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>Subir fotos ahora</span>
                </button>
              )}
            </div>
          ) : albumDisplayMode === 'timeline' ? (
            /* ================= TIMELINE STORY VIEW ================= */
            <div className="py-4 space-y-6">
              {/* Creator curation guidance banner */}
              {isCurrentAlbumOwner && (
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/40 dark:to-indigo-950/40 border border-blue-200 dark:border-blue-900/50 rounded-xl p-3 sm:p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-[#3869A0] text-white flex items-center justify-center shrink-0">
                      <Clock className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-gray-900 dark:text-white">
                        Cronología narrativa del evento
                      </p>
                      <p className="text-[11px] text-gray-600 dark:text-gray-300">
                        Como creador del álbum, puedes arrastrar y soltar las fotos para reordenar los momentos del evento y añadir hitos horarios.
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setShowTimelineManagerModal(true)}
                    className="px-3.5 py-1.5 bg-[#3869A0] hover:bg-[#2c537f] text-white rounded-lg text-xs font-bold flex items-center gap-1.5 transition cursor-pointer shrink-0 shadow-xs"
                  >
                    <GripVertical className="w-3.5 h-3.5" />
                    <span>Reordenar Cronología (Drag & Drop)</span>
                  </button>
                </div>
              )}

              {/* Vertical timeline flow */}
              <div className="relative border-l-2 border-blue-200 dark:border-blue-900 ml-4 sm:ml-8 pl-4 sm:pl-8 space-y-6">
                {filteredAlbumPhotos.map((p, idx) => {
                  const milestoneNote = currentAlbum.timelineNotes?.[p.id];

                  return (
                    <div 
                      key={p.id}
                      className="relative group bg-white dark:bg-[#111c2e] border border-gray-200 dark:border-slate-800 rounded-xl p-3.5 shadow-2xs hover:shadow-md transition"
                    >
                      {/* Timeline dot marker */}
                      <div className="absolute -left-[25px] sm:-left-[41px] top-4 w-6 h-6 rounded-full bg-[#3869A0] text-white flex items-center justify-center text-[10px] font-mono font-bold ring-4 ring-white dark:ring-[#0e1726] shadow-xs">
                        {idx + 1}
                      </div>

                      <div className="flex flex-col md:flex-row items-start md:items-center gap-4">
                        {/* Photo thumbnail */}
                        <div 
                          onClick={() => viewPhoto(p.id)}
                          className="w-full md:w-44 h-44 rounded-lg overflow-hidden shrink-0 border border-gray-200 dark:border-slate-700 bg-gray-100 dark:bg-slate-800 cursor-pointer relative group/img"
                        >
                          <img 
                            src={p.archivo} 
                            alt={p.titulo} 
                            className="w-full h-full object-cover group-hover/img:scale-105 transition duration-300" 
                          />
                          
                          {/* Analog date stamp */}
                          <div className="absolute bottom-1 right-1 font-mono text-[9px] font-bold text-[#ff9000] drop-shadow-[0_1px_2px_rgba(0,0,0,0.9)] select-none tracking-wider">
                            '08 09 14
                          </div>
                        </div>

                        {/* Story info */}
                        <div className="flex-1 min-w-0 space-y-2">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="font-mono text-xs font-bold text-[#3869A0] dark:text-blue-400">
                              Momento #{idx + 1}
                            </span>
                            {milestoneNote && (
                              <span className="bg-amber-100 dark:bg-amber-900/60 text-amber-900 dark:text-amber-200 text-xs font-bold px-2.5 py-0.5 rounded-md flex items-center gap-1">
                                <Clock className="w-3 h-3 text-amber-600" />
                                <span>{milestoneNote}</span>
                              </span>
                            )}
                          </div>

                          <h3 
                            onClick={() => viewPhoto(p.id)}
                            className="text-base font-bold text-gray-900 dark:text-white cursor-pointer hover:text-[#3869A0] transition"
                          >
                            {p.titulo}
                          </h3>

                          {/* Uploader signature */}
                          <div className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-300">
                            {p.uploaderAvatar && (
                              <img src={p.uploaderAvatar} alt="" className="w-5 h-5 rounded-full object-cover" />
                            )}
                            <span>Subida por <strong>{p.uploaderName}</strong></span>
                            <span>•</span>
                            <span className="text-gray-400">{p.fecha}</span>
                          </div>

                          {/* Reactions & Tags */}
                          <div className="flex items-center gap-3 pt-1 text-xs text-gray-500">
                            <span className="flex items-center gap-1 font-semibold">
                              ❤️ {p.likes.length} me gusta
                            </span>
                            <span className="flex items-center gap-1 font-semibold">
                              💬 {p.comentarios.length} comentarios
                            </span>
                            {p.etiquetas && p.etiquetas.length > 0 && (
                              <span className="flex items-center gap-1 font-semibold text-blue-600 dark:text-blue-400">
                                🏷️ {p.etiquetas.length} etiquetados
                              </span>
                            )}
                          </div>
                        </div>

                        {/* View photo button */}
                        <button
                          onClick={() => viewPhoto(p.id)}
                          className="px-3 py-1.5 rounded-lg bg-gray-100 dark:bg-slate-800 hover:bg-[#3869A0] hover:text-white text-gray-700 dark:text-gray-300 text-xs font-bold transition cursor-pointer shrink-0 self-end md:self-center"
                        >
                          Ver foto
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            /* ================= GRID VIEW ================= */
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
              {filteredAlbumPhotos.map((p, idx) => (
                <div
                  key={p.id}
                  onClick={() => viewPhoto(p.id)}
                  className="group relative rounded-lg overflow-hidden border border-gray-200 dark:border-slate-700 bg-gray-100 dark:bg-slate-800 aspect-square cursor-pointer shadow-2xs hover:shadow-md transition"
                >
                  <img 
                    src={p.archivo} 
                    alt={p.titulo} 
                    className="w-full h-full object-cover group-hover:scale-105 transition duration-300" 
                  />
                  
                  {/* Uploader signature badge (Tuenti style) */}
                  <div className="absolute top-1.5 left-1.5 z-10 flex items-center gap-1">
                    <span className="bg-black/65 backdrop-blur-xs text-white text-[9px] font-bold px-1.5 py-0.5 rounded flex items-center gap-1 shadow-xs truncate max-w-[120px]">
                      {p.uploaderAvatar && (
                        <img src={p.uploaderAvatar} alt="" className="w-3 h-3 rounded-full object-cover shrink-0" />
                      )}
                      <span className="truncate">{p.uploaderName}</span>
                    </span>
                    {currentAlbum.photoOrder && currentAlbum.photoOrder.length > 0 && (
                      <span className="bg-blue-600/80 text-white text-[8px] font-mono font-bold px-1 py-0.5 rounded">
                        #{idx + 1}
                      </span>
                    )}
                  </div>

                  {/* Milestone tag on grid if exists */}
                  {currentAlbum.timelineNotes?.[p.id] && (
                    <div className="absolute top-1.5 right-1.5 z-10">
                      <span className="bg-amber-500/90 backdrop-blur-xs text-black font-bold text-[8px] px-1.5 py-0.5 rounded shadow-xs truncate max-w-[90px] block">
                        {currentAlbum.timelineNotes[p.id]}
                      </span>
                    </div>
                  )}

                  {/* Analog amber timestamp */}
                  <div className="absolute bottom-1 right-1 font-mono text-[9px] font-bold text-[#ff9000] drop-shadow-[0_1px_2px_rgba(0,0,0,0.9)] select-none tracking-wider">
                    '08 09 14
                  </div>

                  {/* Hover Overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition p-2.5 flex flex-col justify-end text-white text-xs">
                    <p className="font-bold truncate text-[11px] drop-shadow-xs">{p.titulo}</p>
                    <div className="flex items-center justify-between text-[10px] text-white/90 mt-1">
                      <span>{p.likes.length} ❤️</span>
                      <span>{p.comentarios.length} 💬</span>
                      {p.etiquetas && p.etiquetas.length > 0 && (
                        <span>{p.etiquetas.length} 🏷️</span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : activeTab === 'subidas' ? (
        /* ================= SUBIDAS VIEW ================= */
        <div className="bg-white dark:bg-[#0e1726] rounded-xl border border-[#ccd5df] dark:border-[#1d2b40] p-4 sm:p-5 shadow-xs space-y-4">
          <h2 className="font-bold text-sm text-gray-800 dark:text-gray-200 pb-2 border-b border-gray-200 dark:border-slate-800">
            Fotos subidas por ti ({myUploadedPhotos.length})
          </h2>

          {myUploadedPhotos.length === 0 ? (
            <div className="text-center py-14 text-gray-400 text-xs">
              No has subido ninguna foto todavía.
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
              {myUploadedPhotos.map(p => (
                <div
                  key={p.id}
                  onClick={() => viewPhoto(p.id)}
                  className="group relative rounded-lg overflow-hidden border border-gray-200 dark:border-slate-700 bg-gray-100 dark:bg-slate-800 aspect-square cursor-pointer shadow-2xs hover:shadow-md transition"
                >
                  <img src={p.archivo} alt={p.titulo} className="w-full h-full object-cover group-hover:scale-105 transition duration-300" />
                  
                  {/* Privacy badge */}
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
        <div className="bg-white dark:bg-[#0e1726] rounded-xl border border-[#ccd5df] dark:border-[#1d2b40] p-4 sm:p-5 shadow-xs space-y-4">
          <h2 className="font-bold text-sm text-gray-800 dark:text-gray-200 pb-2 border-b border-gray-200 dark:border-slate-800">
            Fotos en las que estás etiquetado/a ({myTaggedPhotos.length})
          </h2>

          {myTaggedPhotos.length === 0 ? (
            <div className="text-center py-14 text-gray-400 text-xs">
              No estás etiquetado/a en ninguna foto aún. ¡Pídeles a tus amigos que te etiqueten!
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
              {myTaggedPhotos.map(p => (
                <div
                  key={p.id}
                  onClick={() => viewPhoto(p.id)}
                  className="group relative rounded-lg overflow-hidden border border-gray-200 dark:border-slate-700 bg-gray-100 dark:bg-slate-800 aspect-square cursor-pointer shadow-2xs hover:shadow-md transition"
                >
                  <img src={p.archivo} alt={p.titulo} className="w-full h-full object-cover group-hover:scale-105 transition duration-300" />
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
        /* ================= MAIN ALBUMS OVERVIEW ================= */
        <div className="space-y-6">
          
          {/* Section 1: Álbumes Colaborativos y de Fiestas */}
          <div className="bg-white dark:bg-[#0e1726] rounded-xl border border-[#ccd5df] dark:border-[#1d2b40] p-4 sm:p-5 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-gray-200 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded bg-blue-100 dark:bg-blue-900/60 text-[#3869A0] dark:text-blue-300 flex items-center justify-center">
                  <Users className="w-3.5 h-3.5" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-gray-900 dark:text-white">
                    Álbumes Colaborativos de Eventos & Fiestas ({collaborativeAlbums.length})
                  </h3>
                  <p className="text-[11px] text-gray-500 dark:text-gray-400">
                    Álbumes compartidos donde varios amigos suben fotos conjuntamente
                  </p>
                </div>
              </div>

              <button
                onClick={() => setShowCreateCollabModal(true)}
                className="px-3 py-1.5 bg-[#3869A0] hover:bg-[#2c537f] text-white rounded-lg text-xs font-bold flex items-center gap-1.5 transition cursor-pointer shadow-xs self-start sm:self-auto"
              >
                <Plus className="w-3 h-3" />
                <span>Crear Álbum Colaborativo</span>
              </button>
            </div>

            {collaborativeAlbums.length === 0 ? (
              <div className="p-8 text-center bg-blue-50/40 dark:bg-blue-950/20 rounded-xl border border-dashed border-blue-200 dark:border-blue-900/50 space-y-2">
                <Users className="w-10 h-10 text-[#3869A0] mx-auto opacity-70" />
                <h4 className="font-bold text-xs sm:text-sm text-gray-800 dark:text-gray-200">
                  Aún no hay álbumes colaborativos
                </h4>
                <p className="text-xs text-gray-500 dark:text-gray-400 max-w-md mx-auto">
                  Crea uno tras tu próxima fiesta o cumpleaños para que tus amigos vuelquen todas sus fotos simultáneamente en un único álbum compartido.
                </p>
                <button
                  onClick={() => setShowCreateCollabModal(true)}
                  className="px-4 py-2 bg-[#3869A0] hover:bg-[#2c537f] text-white rounded-lg text-xs font-bold cursor-pointer shadow-xs inline-flex items-center gap-1.5 mt-2"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Crear el primer álbum colaborativo</span>
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                {collaborativeAlbums.map(album => {
                  const albumPhotoItems = photos.filter(p => p.albumId === album.id);
                  const count = albumPhotoItems.length;
                  const coverPhoto = albumPhotoItems[0] || (album.portada ? { archivo: album.portada } : null);
                  const isOwner = (album.userId === currentUser.id) || (album.propietarioId === currentUser.id);

                  return (
                    <div
                      key={album.id}
                      className="border border-blue-200 dark:border-blue-900/60 hover:border-[#3869A0] rounded-xl p-3 bg-gradient-to-b from-blue-50/30 to-white dark:from-[#111c2e] dark:to-[#0e1726] shadow-2xs hover:shadow-md transition group flex flex-col justify-between"
                    >
                      <div 
                        onClick={() => viewAlbum(album.id)}
                        className="cursor-pointer space-y-2"
                      >
                        <div className="h-36 rounded-lg bg-gray-100 dark:bg-slate-800 overflow-hidden relative flex items-center justify-center border border-gray-200 dark:border-slate-700">
                          {coverPhoto ? (
                            <img src={coverPhoto.archivo} alt="" className="w-full h-full object-cover group-hover:scale-105 transition duration-300" />
                          ) : (
                            <Users className="w-10 h-10 text-[#3869A0] opacity-40" />
                          )}

                          <span className="absolute top-1.5 left-1.5 bg-blue-600 text-white text-[9px] font-bold px-1.5 py-0.5 rounded shadow-xs flex items-center gap-1">
                            <Users className="w-2.5 h-2.5" />
                            <span>Colaborativo</span>
                          </span>

                          <span className="absolute bottom-1.5 right-1.5 bg-black/75 backdrop-blur-xs text-white text-[10px] font-bold px-2 py-0.5 rounded shadow-xs">
                            {count} fotos
                          </span>
                        </div>

                        <div>
                          <h4 className="font-bold text-sm text-[#3869A0] dark:text-blue-400 group-hover:underline truncate">
                            {album.nombre}
                          </h4>
                          {album.eventName && (
                            <span className="text-[10px] text-purple-600 dark:text-purple-400 font-semibold flex items-center gap-1 mt-0.5 truncate">
                              <Calendar className="w-3 h-3 shrink-0" />
                              <span className="truncate">{album.eventName}</span>
                            </span>
                          )}
                          {album.descripcion && (
                            <p className="text-[11px] text-gray-500 dark:text-gray-400 line-clamp-1 mt-0.5">
                              {album.descripcion}
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Footer info & management */}
                      <div className="pt-2 mt-2 border-t border-gray-100 dark:border-slate-800 flex items-center justify-between text-[10px] text-gray-400">
                        <span className="truncate">De: {album.propietarioNombre || 'Amigo'}</span>
                        
                        <div className="flex items-center gap-1">
                          {isOwner && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                viewAlbum(album.id);
                                setShowTimelineManagerModal(true);
                              }}
                              className="text-indigo-600 dark:text-indigo-400 hover:underline font-bold px-1 flex items-center gap-0.5"
                              title="Reordenar fotos arrastrando"
                            >
                              <GripVertical className="w-2.5 h-2.5" />
                              <span>Cronología</span>
                            </button>
                          )}
                          {isOwner && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setManagingAlbum(album);
                              }}
                              className="text-[#3869A0] hover:underline font-bold px-1"
                              title="Gestionar colaboradores"
                            >
                              Amigos
                            </button>
                          )}
                          {isOwner && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteAlbum(album);
                              }}
                              className="text-red-500 hover:text-red-700 p-1"
                              title="Borrar álbum"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Section 2: Core & Personal Albums */}
          <div className="bg-white dark:bg-[#0e1726] rounded-xl border border-[#ccd5df] dark:border-[#1d2b40] p-4 sm:p-5 shadow-xs space-y-4">
            <h3 className="font-bold text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              Álbumes del sistema y personales
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
              {/* Fotos subidas card */}
              <div
                onClick={() => setActiveTab('subidas')}
                className="border border-gray-200 dark:border-slate-700 hover:border-[#3869A0] rounded-xl p-3 bg-white dark:bg-[#111c2e] cursor-pointer shadow-2xs hover:shadow-md transition group text-center"
              >
                <div className="h-36 rounded-lg bg-gray-100 dark:bg-slate-800 overflow-hidden mb-2 relative flex items-center justify-center border border-gray-200 dark:border-slate-700">
                  {myUploadedPhotos[0] ? (
                    <img src={myUploadedPhotos[0].archivo} alt="" className="w-full h-full object-cover group-hover:scale-105 transition" />
                  ) : (
                    <Upload className="w-10 h-10 text-gray-300 dark:text-gray-600" />
                  )}
                  <span className="absolute bottom-1.5 right-1.5 bg-black/70 text-white text-[10px] font-bold px-1.5 py-0.5 rounded">
                    {myUploadedPhotos.length} fotos
                  </span>
                </div>
                <h4 className="font-bold text-sm text-[#3869A0] dark:text-blue-400 group-hover:underline">Fotos subidas</h4>
                <p className="text-[11px] text-gray-500 dark:text-gray-400">Todas tus fotos sueltas</p>
              </div>

              {/* Fotos etiquetadas card */}
              <div
                onClick={() => setActiveTab('etiquetadas')}
                className="border border-gray-200 dark:border-slate-700 hover:border-[#3869A0] rounded-xl p-3 bg-white dark:bg-[#111c2e] cursor-pointer shadow-2xs hover:shadow-md transition group text-center"
              >
                <div className="h-36 rounded-lg bg-gray-100 dark:bg-slate-800 overflow-hidden mb-2 relative flex items-center justify-center border border-gray-200 dark:border-slate-700">
                  {myTaggedPhotos[0] ? (
                    <img src={myTaggedPhotos[0].archivo} alt="" className="w-full h-full object-cover group-hover:scale-105 transition" />
                  ) : (
                    <Tag className="w-10 h-10 text-gray-300 dark:text-gray-600" />
                  )}
                  <span className="absolute bottom-1.5 right-1.5 bg-black/70 text-white text-[10px] font-bold px-1.5 py-0.5 rounded">
                    {myTaggedPhotos.length} fotos
                  </span>
                </div>
                <h4 className="font-bold text-sm text-[#3869A0] dark:text-blue-400 group-hover:underline">Fotos etiquetadas</h4>
                <p className="text-[11px] text-gray-500 dark:text-gray-400">Fotos donde sales tú</p>
              </div>

              {/* Personal custom albums */}
              {personalAlbums.map(album => {
                const cover = photos.find(p => p.albumId === album.id);
                const count = photos.filter(p => p.albumId === album.id).length;
                const isOwner = (album.userId === currentUser.id) || (album.propietarioId === currentUser.id);

                return (
                  <div
                    key={album.id}
                    className="border border-gray-200 dark:border-slate-700 hover:border-[#3869A0] rounded-xl p-3 bg-white dark:bg-[#111c2e] shadow-2xs hover:shadow-md transition group flex flex-col justify-between"
                  >
                    <div 
                      onClick={() => viewAlbum(album.id)}
                      className="cursor-pointer"
                    >
                      <div className="h-36 rounded-lg bg-gray-100 dark:bg-slate-800 overflow-hidden mb-2 relative flex items-center justify-center border border-gray-200 dark:border-slate-700">
                        {cover ? (
                          <img src={cover.archivo} alt="" className="w-full h-full object-cover group-hover:scale-105 transition" />
                        ) : (
                          <Folder className="w-10 h-10 text-gray-300 dark:text-gray-600" />
                        )}
                        <span className="absolute bottom-1.5 right-1.5 bg-black/70 text-white text-[10px] font-bold px-1.5 py-0.5 rounded">
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
                          className="text-gray-500 dark:text-gray-400 hover:text-[#3869A0] p-1 flex items-center gap-0.5 text-[11px] cursor-pointer"
                          title="Renombrar álbum"
                        >
                          <Edit2 className="w-3 h-3" />
                          <span>Renombrar</span>
                        </button>
                        <button
                          onClick={() => handleDeleteAlbum(album)}
                          className="text-gray-500 dark:text-gray-400 hover:text-red-600 p-1 flex items-center gap-0.5 text-[11px] cursor-pointer"
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
          </div>
        </div>
      )}

      {/* Collaborative Modals */}
      {showCreateCollabModal && (
        <CollaborativeAlbumCreateModal
          isOpen={showCreateCollabModal}
          onClose={() => setShowCreateCollabModal(false)}
        />
      )}

      {showBatchUploadModal && (
        <CollaborativeBatchUploadModal
          isOpen={showBatchUploadModal}
          onClose={() => {
            setShowBatchUploadModal(false);
            setBatchTargetAlbumId(null);
          }}
          targetAlbumId={batchTargetAlbumId}
        />
      )}

      {managingAlbum && (
        <CollaboratorsManageModal
          isOpen={Boolean(managingAlbum)}
          onClose={() => setManagingAlbum(null)}
          album={managingAlbum}
        />
      )}

      {showTimelineManagerModal && currentAlbum && (
        <CollaborativeTimelineManagerModal
          isOpen={showTimelineManagerModal}
          onClose={() => setShowTimelineManagerModal(false)}
          album={currentAlbum}
        />
      )}
    </div>
  );
};
