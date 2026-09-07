import React, { useState, useEffect, useMemo } from 'react';
import { useInkorium } from '../context/InkoriumContext';
import { 
  Album, Photo 
} from '../types';
import { 
  GripVertical, ArrowUp, ArrowDown, Sparkles, Check, RotateCcw, 
  Calendar, Clock, Tag, X, Users, Layers, AlertCircle, Save, Info,
  ChevronLeft, ChevronRight, Eye, ArrowRightLeft
} from 'lucide-react';

interface CollaborativeTimelineManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  album: Album;
}

export const CollaborativeTimelineManagerModal: React.FC<CollaborativeTimelineManagerModalProps> = ({
  isOpen,
  onClose,
  album
}) => {
  const { photos, currentUser, users, reorderAlbumPhotos, pushNotification } = useInkorium();

  // Get raw photos of this album
  const rawAlbumPhotos = useMemo(() => {
    return photos.filter(p => p.albumId === album.id);
  }, [photos, album.id]);

  // Working state for ordered photos and milestone notes
  const [orderedPhotos, setOrderedPhotos] = useState<Photo[]>([]);
  const [timelineNotes, setTimelineNotes] = useState<Record<string, string>>({});
  const [draggedPhotoId, setDraggedPhotoId] = useState<string | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const [selectedPhotoForNote, setSelectedPhotoForNote] = useState<string | null>(null);
  const [noteInput, setNoteInput] = useState<string>('');
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState<boolean>(false);
  const [previewMode, setPreviewMode] = useState<'grid' | 'timeline'>('grid');

  // Initialize orderedPhotos on load based on album.photoOrder
  useEffect(() => {
    if (!album) return;
    
    const existingOrder = album.photoOrder || [];
    const notes = album.timelineNotes || {};
    setTimelineNotes({ ...notes });

    if (existingOrder.length > 0) {
      // Map existing order, then append any photos not in photoOrder
      const ordered: Photo[] = [];
      const addedIds = new Set<string>();

      existingOrder.forEach(id => {
        const found = rawAlbumPhotos.find(p => p.id === id);
        if (found) {
          ordered.push(found);
          addedIds.add(id);
        }
      });

      rawAlbumPhotos.forEach(p => {
        if (!addedIds.has(p.id)) {
          ordered.push(p);
        }
      });

      setOrderedPhotos(ordered);
    } else {
      // Default: copy of rawAlbumPhotos
      setOrderedPhotos([...rawAlbumPhotos]);
    }
    setHasUnsavedChanges(false);
  }, [album, rawAlbumPhotos]);

  if (!isOpen) return null;

  // Drag & Drop handlers
  const handleDragStart = (e: React.DragEvent, photoId: string) => {
    setDraggedPhotoId(photoId);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', photoId);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (dragOverIndex !== index) {
      setDragOverIndex(index);
    }
  };

  const handleDragLeave = () => {
    // optional
  };

  const handleDrop = (e: React.DragEvent, targetIndex: number) => {
    e.preventDefault();
    setDragOverIndex(null);
    if (!draggedPhotoId) return;

    const currentIndex = orderedPhotos.findIndex(p => p.id === draggedPhotoId);
    if (currentIndex === -1 || currentIndex === targetIndex) {
      setDraggedPhotoId(null);
      return;
    }

    const updated = [...orderedPhotos];
    const [movedItem] = updated.splice(currentIndex, 1);
    updated.splice(targetIndex, 0, movedItem);

    setOrderedPhotos(updated);
    setDraggedPhotoId(null);
    setHasUnsavedChanges(true);
  };

  const handleDragEnd = () => {
    setDraggedPhotoId(null);
    setDragOverIndex(null);
  };

  // Step Move Actions (Accessibility & precise control)
  const movePhotoStep = (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= orderedPhotos.length) return;

    const updated = [...orderedPhotos];
    const temp = updated[index];
    updated[index] = updated[targetIndex];
    updated[targetIndex] = temp;

    setOrderedPhotos(updated);
    setHasUnsavedChanges(true);
  };

  const moveToPosition = (index: number, position: 'start' | 'end') => {
    if (position === 'start' && index === 0) return;
    if (position === 'end' && index === orderedPhotos.length - 1) return;

    const updated = [...orderedPhotos];
    const [item] = updated.splice(index, 1);
    if (position === 'start') {
      updated.unshift(item);
    } else {
      updated.push(item);
    }
    setOrderedPhotos(updated);
    setHasUnsavedChanges(true);
  };

  // Sorting helpers
  const handleReverseOrder = () => {
    setOrderedPhotos(prev => [...prev].reverse());
    setHasUnsavedChanges(true);
  };

  const handleResetToUploadOrder = () => {
    setOrderedPhotos([...rawAlbumPhotos]);
    setHasUnsavedChanges(true);
  };

  // Timeline Milestone Notes
  const handleOpenNoteEditor = (photoId: string) => {
    setSelectedPhotoForNote(photoId);
    setNoteInput(timelineNotes[photoId] || '');
  };

  const handleSaveNote = () => {
    if (!selectedPhotoForNote) return;
    const cleanNote = noteInput.trim();
    const updatedNotes = { ...timelineNotes };
    if (cleanNote) {
      updatedNotes[selectedPhotoForNote] = cleanNote;
    } else {
      delete updatedNotes[selectedPhotoForNote];
    }
    setTimelineNotes(updatedNotes);
    setSelectedPhotoForNote(null);
    setNoteInput('');
    setHasUnsavedChanges(true);
  };

  // Save changes to context and close
  const handleSaveTimeline = () => {
    const orderedIds = orderedPhotos.map(p => p.id);
    reorderAlbumPhotos(album.id, orderedIds, timelineNotes);
    setHasUnsavedChanges(false);

    pushNotification({
      id: `toast-timeline-saved-${Date.now()}`,
      userId: currentUser.id,
      fromUserId: currentUser.id,
      fromUserName: currentUser.nombre || 'Inkorium',
      tipo: 'sistema',
      mensaje: `¡Cronología del álbum "${album.nombre}" guardada con éxito!`,
      fecha: 'Ahora mismo',
      leido: false
    });

    onClose();
  };

  const presetMoments = [
    '22:00 - Llegada y previa',
    '23:30 - Inicio de la fiesta',
    '00:45 - Photocall de grupo',
    '02:00 - Brindis y tarta',
    '03:30 - Momento épico / Baile',
    '05:00 - Fin de fiesta'
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/70 backdrop-blur-xs animate-fade-in">
      <div className="bg-white dark:bg-[#0e1726] rounded-2xl border border-[#ccd5df] dark:border-[#1d2b40] w-full max-w-5xl h-[92vh] max-h-[900px] flex flex-col shadow-2xl overflow-hidden">
        
        {/* Top Header */}
        <div className="px-5 py-4 border-b border-gray-200 dark:border-slate-800 bg-gradient-to-r from-blue-50/50 via-white to-indigo-50/40 dark:from-[#111c2e] dark:via-[#0e1726] dark:to-[#111c2e] flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#3869A0] to-indigo-600 text-white flex items-center justify-center shadow-md">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-bold text-gray-900 dark:text-white truncate">
                  Gestor de Cronología del Evento
                </h2>
                <span className="bg-blue-100 dark:bg-blue-900/60 text-[#3869A0] dark:text-blue-300 text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0">
                  Creador
                </span>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 truncate max-w-md">
                Álbum: <strong className="text-gray-700 dark:text-gray-200">{album.nombre}</strong> {album.eventName && `(Evento: ${album.eventName})`}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-slate-800 transition cursor-pointer"
              title="Cerrar"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Toolbar & Guidance banner */}
        <div className="px-5 py-2.5 bg-gray-50 dark:bg-slate-900/60 border-b border-gray-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3 shrink-0 text-xs">
          <div className="flex items-center gap-2 text-gray-600 dark:text-gray-300">
            <Info className="w-4 h-4 text-[#3869A0] shrink-0" />
            <span className="hidden sm:inline">
              <strong>Arrastra y suelta</strong> las fotos para organizar la historia del evento en orden cronológico real.
            </span>
            <span className="sm:hidden">
              Arrastra las fotos para reordenar la cronología.
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* View switcher */}
            <div className="flex items-center bg-gray-200/80 dark:bg-slate-800 p-0.5 rounded-lg">
              <button
                onClick={() => setPreviewMode('grid')}
                className={`px-2.5 py-1 rounded-md font-semibold text-[11px] transition cursor-pointer flex items-center gap-1 ${
                  previewMode === 'grid'
                    ? 'bg-white dark:bg-slate-700 text-[#3869A0] dark:text-white shadow-2xs'
                    : 'text-gray-600 dark:text-gray-400'
                }`}
              >
                <Layers className="w-3 h-3" />
                <span>Cuadrícula</span>
              </button>
              <button
                onClick={() => setPreviewMode('timeline')}
                className={`px-2.5 py-1 rounded-md font-semibold text-[11px] transition cursor-pointer flex items-center gap-1 ${
                  previewMode === 'timeline'
                    ? 'bg-white dark:bg-slate-700 text-[#3869A0] dark:text-white shadow-2xs'
                    : 'text-gray-600 dark:text-gray-400'
                }`}
              >
                <Clock className="w-3 h-3" />
                <span>Línea Temporal</span>
              </button>
            </div>

            {/* Quick Actions */}
            <button
              onClick={handleReverseOrder}
              className="px-2.5 py-1 rounded-lg border border-gray-300 dark:border-slate-700 hover:bg-gray-100 dark:hover:bg-slate-800 text-gray-700 dark:text-gray-200 font-semibold text-[11px] flex items-center gap-1 transition cursor-pointer"
              title="Invertir el orden completo de las fotos"
            >
              <ArrowRightLeft className="w-3 h-3" />
              <span>Invertir</span>
            </button>

            <button
              onClick={handleResetToUploadOrder}
              className="px-2.5 py-1 rounded-lg border border-gray-300 dark:border-slate-700 hover:bg-gray-100 dark:hover:bg-slate-800 text-gray-700 dark:text-gray-200 font-semibold text-[11px] flex items-center gap-1 transition cursor-pointer"
              title="Restablecer al orden original de subida"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Restablecer</span>
            </button>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
          
          {orderedPhotos.length === 0 ? (
            <div className="text-center py-20 space-y-3">
              <Clock className="w-12 h-12 text-gray-400 mx-auto" />
              <p className="text-sm font-bold text-gray-600 dark:text-gray-300">
                No hay fotos en este álbum para ordenar
              </p>
              <p className="text-xs text-gray-400">
                Sube fotos al álbum colaborativo para poder organizar la cronología.
              </p>
            </div>
          ) : previewMode === 'grid' ? (
            /* ================= GRID REORDER MODE ================= */
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3.5">
              {orderedPhotos.map((photo, index) => {
                const isDragging = draggedPhotoId === photo.id;
                const isOver = dragOverIndex === index;
                const note = timelineNotes[photo.id];
                const uploader = users.find(u => u.id === photo.uploaderId);

                return (
                  <div
                    key={photo.id}
                    draggable
                    onDragStart={(e) => handleDragStart(e, photo.id)}
                    onDragOver={(e) => handleDragOver(e, index)}
                    onDragLeave={handleDragLeave}
                    onDrop={(e) => handleDrop(e, index)}
                    onDragEnd={handleDragEnd}
                    className={`group relative rounded-xl border transition-all duration-150 flex flex-col bg-white dark:bg-[#111c2e] overflow-hidden select-none cursor-grab active:cursor-grabbing ${
                      isDragging 
                        ? 'opacity-30 scale-95 border-dashed border-[#3869A0] shadow-none' 
                        : isOver 
                          ? 'border-2 border-blue-500 scale-102 shadow-lg ring-2 ring-blue-400/50' 
                          : 'border-gray-200 dark:border-slate-800 hover:border-[#3869A0] hover:shadow-md'
                    }`}
                  >
                    {/* Index & Drag handle badge */}
                    <div className="absolute top-2 left-2 z-20 flex items-center gap-1">
                      <span className="bg-black/75 backdrop-blur-xs text-white text-[10px] font-mono font-bold px-1.5 py-0.5 rounded shadow-xs flex items-center gap-1">
                        <GripVertical className="w-3 h-3 text-gray-300 opacity-70 group-hover:opacity-100" />
                        <span>#{index + 1}</span>
                      </span>
                    </div>

                    {/* Uploader signature badge */}
                    <div className="absolute top-2 right-2 z-20">
                      <span className="bg-black/70 backdrop-blur-xs text-white text-[9px] font-bold px-1.5 py-0.5 rounded flex items-center gap-1 shadow-xs max-w-[100px] truncate">
                        {photo.uploaderAvatar && (
                          <img src={photo.uploaderAvatar} alt="" className="w-2.5 h-2.5 rounded-full object-cover shrink-0" />
                        )}
                        <span className="truncate">{photo.uploaderName || uploader?.nombre || 'Amigo'}</span>
                      </span>
                    </div>

                    {/* Photo thumbnail */}
                    <div className="aspect-square bg-gray-100 dark:bg-slate-800 relative overflow-hidden">
                      <img 
                        src={photo.archivo} 
                        alt={photo.titulo} 
                        className="w-full h-full object-cover group-hover:scale-105 transition duration-200 pointer-events-none" 
                      />

                      {/* Drop indicator overlay */}
                      {isOver && (
                        <div className="absolute inset-0 bg-blue-500/20 flex items-center justify-center border-2 border-blue-500">
                          <span className="bg-blue-600 text-white font-bold text-xs px-2 py-1 rounded shadow-md">
                            Soltar aquí (#{index + 1})
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Milestone Note if exists */}
                    {note && (
                      <div className="px-2 py-1 bg-amber-50 dark:bg-amber-950/40 border-t border-amber-200 dark:border-amber-900/40 text-[10px] text-amber-900 dark:text-amber-200 font-bold flex items-center gap-1 truncate">
                        <Clock className="w-3 h-3 text-amber-600 shrink-0" />
                        <span className="truncate">{note}</span>
                      </div>
                    )}

                    {/* Bottom controls */}
                    <div className="p-2 border-t border-gray-100 dark:border-slate-800 bg-gray-50/70 dark:bg-slate-900/40 flex items-center justify-between gap-1 text-[10px]">
                      <span className="font-bold text-gray-700 dark:text-gray-300 truncate max-w-[90px]" title={photo.titulo}>
                        {photo.titulo}
                      </span>

                      <div className="flex items-center gap-1 shrink-0">
                        {/* Add milestone note button */}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleOpenNoteEditor(photo.id);
                          }}
                          className={`p-1 rounded hover:bg-gray-200 dark:hover:bg-slate-700 transition cursor-pointer ${
                            note ? 'text-amber-600 font-bold' : 'text-gray-400 hover:text-gray-600'
                          }`}
                          title={note ? `Editar hito: ${note}` : 'Añadir hito/hora del evento'}
                        >
                          <Tag className="w-3 h-3" />
                        </button>

                        {/* Move step backward */}
                        <button
                          disabled={index === 0}
                          onClick={(e) => {
                            e.stopPropagation();
                            movePhotoStep(index, 'up');
                          }}
                          className="p-1 rounded hover:bg-gray-200 dark:hover:bg-slate-700 disabled:opacity-30 disabled:pointer-events-none text-gray-600 dark:text-gray-300 cursor-pointer"
                          title="Mover antes"
                        >
                          <ChevronLeft className="w-3 h-3" />
                        </button>

                        {/* Move step forward */}
                        <button
                          disabled={index === orderedPhotos.length - 1}
                          onClick={(e) => {
                            e.stopPropagation();
                            movePhotoStep(index, 'down');
                          }}
                          className="p-1 rounded hover:bg-gray-200 dark:hover:bg-slate-700 disabled:opacity-30 disabled:pointer-events-none text-gray-600 dark:text-gray-300 cursor-pointer"
                          title="Mover después"
                        >
                          <ChevronRight className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            /* ================= TIMELINE STORY FLOW MODE ================= */
            <div className="max-w-3xl mx-auto py-2 space-y-6">
              <div className="relative border-l-2 border-blue-300 dark:border-blue-900 ml-4 sm:ml-6 pl-4 sm:pl-6 space-y-6">
                {orderedPhotos.map((photo, index) => {
                  const note = timelineNotes[photo.id];
                  return (
                    <div 
                      key={photo.id} 
                      className="relative group bg-white dark:bg-[#111c2e] border border-gray-200 dark:border-slate-800 rounded-xl p-3 shadow-2xs hover:shadow-md transition flex flex-col sm:flex-row items-start sm:items-center gap-3.5"
                    >
                      {/* Timeline dot marker */}
                      <div className="absolute -left-[25px] sm:-left-[33px] top-4 w-5 h-5 rounded-full bg-[#3869A0] text-white flex items-center justify-center text-[9px] font-bold ring-4 ring-white dark:ring-[#0e1726]">
                        {index + 1}
                      </div>

                      {/* Photo preview */}
                      <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-lg overflow-hidden shrink-0 border border-gray-200 dark:border-slate-700 bg-gray-100 dark:bg-slate-800">
                        <img src={photo.archivo} alt={photo.titulo} className="w-full h-full object-cover" />
                      </div>

                      {/* Info & Milestone */}
                      <div className="flex-1 min-w-0 space-y-1.5">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs font-bold text-[#3869A0] dark:text-blue-400">
                            Momento #{index + 1}
                          </span>
                          {note && (
                            <span className="bg-amber-100 dark:bg-amber-900/60 text-amber-900 dark:text-amber-200 text-xs font-bold px-2 py-0.5 rounded-md flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              <span>{note}</span>
                            </span>
                          )}
                        </div>

                        <h4 className="font-bold text-sm text-gray-900 dark:text-white truncate">
                          {photo.titulo}
                        </h4>

                        <p className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1.5">
                          <span>Subida por: <strong>{photo.uploaderName}</strong></span>
                          <span>•</span>
                          <span>{photo.fecha}</span>
                        </p>
                      </div>

                      {/* Controls in timeline */}
                      <div className="flex sm:flex-col items-center gap-1.5 shrink-0 self-end sm:self-center">
                        <button
                          onClick={() => handleOpenNoteEditor(photo.id)}
                          className="px-2.5 py-1 rounded-lg bg-blue-50 dark:bg-blue-950/50 hover:bg-blue-100 text-[#3869A0] dark:text-blue-300 text-xs font-bold transition cursor-pointer flex items-center gap-1"
                        >
                          <Tag className="w-3 h-3" />
                          <span>{note ? 'Editar Hito' : '+ Hito'}</span>
                        </button>

                        <div className="flex items-center gap-1">
                          <button
                            disabled={index === 0}
                            onClick={() => movePhotoStep(index, 'up')}
                            className="p-1.5 rounded-lg border border-gray-200 dark:border-slate-700 hover:bg-gray-100 dark:hover:bg-slate-800 disabled:opacity-30 disabled:pointer-events-none cursor-pointer"
                            title="Subir en la cronología"
                          >
                            <ArrowUp className="w-3.5 h-3.5" />
                          </button>
                          <button
                            disabled={index === orderedPhotos.length - 1}
                            onClick={() => movePhotoStep(index, 'down')}
                            className="p-1.5 rounded-lg border border-gray-200 dark:border-slate-700 hover:bg-gray-100 dark:hover:bg-slate-800 disabled:opacity-30 disabled:pointer-events-none cursor-pointer"
                            title="Bajar en la cronología"
                          >
                            <ArrowDown className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Milestone Note Edit Popover / Sub-modal */}
        {selectedPhotoForNote && (
          <div className="p-4 bg-amber-50/90 dark:bg-[#1a1c24] border-t border-amber-200 dark:border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 animate-fade-in shrink-0">
            <div className="flex-1 w-full space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-amber-900 dark:text-amber-200 flex items-center gap-1.5">
                  <Tag className="w-3.5 h-3.5 text-amber-600" />
                  <span>Añadir o editar hito cronológico del evento para esta foto:</span>
                </span>
                <button 
                  onClick={() => setSelectedPhotoForNote(null)}
                  className="text-gray-400 hover:text-gray-600 text-xs cursor-pointer"
                >
                  Cancelar
                </button>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={noteInput}
                  onChange={(e) => setNoteInput(e.target.value)}
                  placeholder="Ej: 23:00 - Llegada a la discoteca, 01:30 - Momento tarta..."
                  className="flex-1 px-3 py-1.5 text-xs bg-white dark:bg-slate-800 border border-amber-300 dark:border-slate-700 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#3869A0]"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleSaveNote();
                  }}
                  autoFocus
                />
                <button
                  onClick={handleSaveNote}
                  className="px-3.5 py-1.5 bg-[#3869A0] hover:bg-[#2c537f] text-white text-xs font-bold rounded-lg cursor-pointer transition shrink-0"
                >
                  Guardar hito
                </button>
              </div>

              {/* Quick presets */}
              <div className="flex flex-wrap items-center gap-1.5 pt-1">
                <span className="text-[10px] text-gray-500 font-semibold">Sugerencias rápidas:</span>
                {presetMoments.map(preset => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => setNoteInput(preset)}
                    className="text-[10px] px-2 py-0.5 bg-white dark:bg-slate-800 border border-amber-200 dark:border-slate-700 hover:border-amber-400 rounded text-amber-800 dark:text-amber-300 font-medium cursor-pointer transition"
                  >
                    {preset}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Footer Actions */}
        <div className="px-5 py-3.5 border-t border-gray-200 dark:border-slate-800 bg-white dark:bg-[#0e1726] flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
            <span>Total: <strong>{orderedPhotos.length} fotos</strong></span>
            {hasUnsavedChanges && (
              <span className="text-amber-600 dark:text-amber-400 font-bold flex items-center gap-1">
                <AlertCircle className="w-3.5 h-3.5" />
                <span>Cambios sin guardar</span>
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-gray-300 dark:border-slate-700 hover:bg-gray-100 dark:hover:bg-slate-800 text-gray-700 dark:text-gray-200 text-xs font-bold transition cursor-pointer"
            >
              Cancelar
            </button>

            <button
              onClick={handleSaveTimeline}
              className="px-5 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white text-xs font-bold transition cursor-pointer shadow-md flex items-center gap-1.5"
            >
              <Save className="w-4 h-4" />
              <span>Guardar Cronología del Evento</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
