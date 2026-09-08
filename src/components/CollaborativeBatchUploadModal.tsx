import React, { useState, useRef, useMemo } from 'react';
import { useInkorium } from '../context/InkoriumContext';
import { 
  Upload, Image as ImageIcon, X, Trash2, Check, Sparkles, 
  Loader2, AlertCircle, Plus, Users, Calendar, Sliders, ShieldCheck,
  Camera, Eye, Wand2, ArrowRight
} from 'lucide-react';
import { Album, PhotoPrivacy } from '../types';
import { validateImageFile } from '../utils/validation';
import { 
  Camera2008Config, 
  DEFAULT_CAMERA_2008_CONFIG, 
  getDefault2008DateStamp, 
  bakeCamera2008Image 
} from '../utils/imageEditor';
import { Camera2008RetroStudio } from './Camera2008RetroStudio';
import { uploadMediaFile } from '../lib/storage';

interface BatchPhotoItem {
  id: string;
  file: File;
  previewUrl: string;
  title: string;
  isValid: boolean;
  error?: string;
}

interface CollaborativeBatchUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetAlbumId?: string | null;
  onCompleted?: () => void;
}

export const CollaborativeBatchUploadModal: React.FC<CollaborativeBatchUploadModalProps> = ({
  isOpen,
  onClose,
  targetAlbumId,
  onCompleted
}) => {
  const { 
    albums, 
    currentUser, 
    uploadMultiplePhotos, 
    uploadPhoto, 
    canUserUploadToAlbum,
    createAlbum 
  } = useInkorium();

  const [selectedAlbumId, setSelectedAlbumId] = useState<string>(targetAlbumId || '');
  const [photoItems, setPhotoItems] = useState<BatchPhotoItem[]>([]);
  const [photoConfigs, setPhotoConfigs] = useState<Record<string, Camera2008Config>>({});
  const [activeView, setActiveView] = useState<'upload' | 'studio'>('upload');
  const [isDragOver, setIsDragOver] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<{ current: number; total: number }>({ current: 0, total: 0 });
  const [applyRetroFilter, setApplyRetroFilter] = useState(true);
  const [privacy, setPrivacy] = useState<PhotoPrivacy>('amigos');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Sync targetAlbumId prop
  React.useEffect(() => {
    if (targetAlbumId) {
      setSelectedAlbumId(targetAlbumId);
    }
  }, [targetAlbumId]);

  // Filter available albums where current user has permission to upload
  const availableAlbums = useMemo(() => {
    return albums.filter(album => canUserUploadToAlbum(album, currentUser.id));
  }, [albums, canUserUploadToAlbum, currentUser.id]);

  const currentAlbumObj = useMemo(() => {
    return albums.find(a => a.id === selectedAlbumId);
  }, [albums, selectedAlbumId]);

  const formatAlbumDateTo2008 = (dateStr?: string) => {
    if (!dateStr) return getDefault2008DateStamp();
    try {
      const parts = dateStr.split(/[-/]/);
      if (parts.length >= 3) {
        const mm = parts[1].padStart(2, '0');
        const dd = parts[2].length === 2 ? parts[2] : parts[0].padStart(2, '0');
        return `'08 ${mm} ${dd}`;
      }
    } catch {
      // ignore
    }
    return getDefault2008DateStamp();
  };

  const handleProcessFiles = async (files: FileList | File[]) => {
    setErrorMessage(null);
    const newItems: BatchPhotoItem[] = [];
    const newConfigs: Record<string, Camera2008Config> = {};

    const baseDateStamp = currentAlbumObj?.fecha 
      ? formatAlbumDateTo2008(currentAlbumObj.fecha) 
      : getDefault2008DateStamp();

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const validation = await validateImageFile(file, {
        maxSizeBytes: 15 * 1024 * 1024,
        maxWidth: 6000,
        maxHeight: 6000
      });

      const previewUrl = await new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onload = (e) => resolve(e.target?.result as string || '');
        reader.readAsDataURL(file);
      });

      const autoTitle = file.name.replace(/\.[^/.]+$/, '').replace(/[_-]/g, ' ');
      const itemId = `batch-${Date.now()}-${Math.random().toString(36).slice(2, 6)}-${i}`;

      newItems.push({
        id: itemId,
        file,
        previewUrl,
        title: autoTitle,
        isValid: validation.isValid,
        error: validation.message
      });

      newConfigs[itemId] = {
        ...DEFAULT_CAMERA_2008_CONFIG,
        dateStampText: baseDateStamp
      };
    }

    setPhotoItems(prev => [...prev, ...newItems]);
    setPhotoConfigs(prev => ({ ...prev, ...newConfigs }));
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      void handleProcessFiles(e.target.files);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      void handleProcessFiles(e.dataTransfer.files);
    }
  };

  const removePhotoItem = (id: string) => {
    setPhotoItems(prev => prev.filter(p => p.id !== id));
    setPhotoConfigs(prev => {
      const copy = { ...prev };
      delete copy[id];
      return copy;
    });
  };

  const updateItemTitle = (id: string, title: string) => {
    setPhotoItems(prev => prev.map(p => p.id === id ? { ...p, title } : p));
  };

  const updatePhotoConfig = (id: string, config: Camera2008Config) => {
    setPhotoConfigs(prev => ({
      ...prev,
      [id]: config
    }));
  };

  const applyConfigToAll = (config: Camera2008Config) => {
    const updated: Record<string, Camera2008Config> = {};
    photoItems.forEach(p => {
      updated[p.id] = { ...config };
    });
    setPhotoConfigs(updated);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (photoItems.length === 0 || isProcessing) return;

    const validItems = photoItems.filter(p => p.isValid && p.previewUrl);
    if (validItems.length === 0) {
      setErrorMessage('No hay fotos válidas para subir.');
      return;
    }

    setIsProcessing(true);
    setUploadProgress({ current: 0, total: validItems.length });
    setErrorMessage(null);

    const uploadedList: Array<{ titulo: string; archivoUrl: string; privacidad: PhotoPrivacy }> = [];

    try {
      for (let i = 0; i < validItems.length; i++) {
        const item = validItems[i];
        let finalDataUrl = item.previewUrl;

        // Apply 2008 camera canvas processing if enabled
        if (applyRetroFilter) {
          const config = photoConfigs[item.id] || {
            ...DEFAULT_CAMERA_2008_CONFIG,
            dateStampText: currentAlbumObj?.fecha 
              ? formatAlbumDateTo2008(currentAlbumObj.fecha) 
              : getDefault2008DateStamp()
          };
          try {
            finalDataUrl = await bakeCamera2008Image(item.previewUrl, config);
          } catch {
            finalDataUrl = item.previewUrl;
          }
        }

        // Upload to storage or fallback
        let storedUrl = finalDataUrl;
        try {
          storedUrl = await uploadMediaFile(finalDataUrl, 'photos');
        } catch {
          storedUrl = finalDataUrl;
        }

        uploadedList.push({
          titulo: item.title.trim() || `Foto ${i + 1}`,
          archivoUrl: storedUrl,
          privacidad: privacy
        });

        setUploadProgress({ current: i + 1, total: validItems.length });
      }

      // Save photos in context
      uploadMultiplePhotos(uploadedList, selectedAlbumId || '');

      setPhotoItems([]);
      setPhotoConfigs({});
      if (onCompleted) onCompleted();
      onClose();
    } catch (err: any) {
      console.error('Batch upload error:', err);
      setErrorMessage('Hubo un problema al procesar y subir algunas fotos.');
    } finally {
      setIsProcessing(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 animate-fade-in">
      <div className="bg-white dark:bg-[#0e1726] rounded-xl border border-gray-300 dark:border-slate-700 max-w-3xl w-full p-4 sm:p-5 shadow-2xl space-y-4 max-h-[94vh] overflow-y-auto">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-gray-200 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 flex items-center justify-center font-bold">
              <Upload className="w-4.5 h-4.5" />
            </div>
            <div>
              <h2 className="font-bold text-sm sm:text-base text-gray-900 dark:text-white leading-tight flex items-center gap-2">
                <span>Subida de Fotos al Álbum Colaborativo</span>
                <span className="bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-800 text-[10px] font-mono px-1.5 py-0.2 rounded flex items-center gap-1">
                  <Camera className="w-3 h-3" />
                  <span>Filtros 2008</span>
                </span>
              </h2>
              <p className="text-[11px] text-gray-500 dark:text-gray-400">
                Sube varias fotos simultáneamente con estética analógica '08 y sello de fecha digital
              </p>
            </div>
          </div>
          <button 
            onClick={onClose}
            disabled={isProcessing}
            className="text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 text-lg font-bold cursor-pointer px-1.5 py-0.5 rounded hover:bg-gray-100 dark:hover:bg-slate-800 disabled:opacity-50"
          >
            ✕
          </button>
        </div>

        {errorMessage && (
          <div className="p-2.5 rounded-lg bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800/60 text-red-700 dark:text-red-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* View Switcher: Upload Dropzone / List vs Studio Canvas */}
        {photoItems.length > 0 && (
          <div className="flex items-center justify-between bg-gray-100 dark:bg-slate-900/80 p-1 rounded-lg border border-gray-200 dark:border-slate-800">
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setActiveView('upload')}
                className={`px-3 py-1.5 rounded-md font-bold text-xs transition cursor-pointer flex items-center gap-1.5 ${
                  activeView === 'upload'
                    ? 'bg-white dark:bg-slate-800 text-gray-900 dark:text-white shadow-2xs'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900'
                }`}
              >
                <ImageIcon className="w-3.5 h-3.5" />
                <span>Fotos Seleccionadas ({photoItems.length})</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveView('studio')}
                className={`px-3 py-1.5 rounded-md font-bold text-xs transition cursor-pointer flex items-center gap-1.5 ${
                  activeView === 'studio'
                    ? 'bg-amber-500 text-slate-950 shadow-xs'
                    : 'text-amber-700 dark:text-amber-400 hover:text-amber-800 dark:hover:text-amber-300'
                }`}
              >
                <Camera className="w-3.5 h-3.5" />
                <span>Estudio Cámara 2008 (Canvas HTML5)</span>
              </button>
            </div>

            <span className="text-[11px] text-gray-500 dark:text-gray-400 hidden sm:inline px-2 font-medium">
              {applyRetroFilter ? '✨ Filtro 2008 activo' : 'Original sin filtro'}
            </span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          
          {/* Target Album Selection */}
          <div className="p-3 rounded-lg bg-gray-50 dark:bg-slate-900/60 border border-gray-200 dark:border-slate-800 space-y-2">
            <label className="font-bold text-gray-800 dark:text-gray-200 block">
              Álbum de destino: *
            </label>
            <select
              value={selectedAlbumId}
              onChange={e => setSelectedAlbumId(e.target.value)}
              disabled={isProcessing}
              className="w-full p-2.5 text-xs rounded-lg border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-gray-900 dark:text-white font-medium focus:outline-none focus:ring-1 focus:ring-[#3869A0]"
              required
            >
              <option value="">-- Selecciona un álbum para subir las fotos --</option>
              {availableAlbums.map(a => {
                const isCollab = a.isCollaborative;
                return (
                  <option key={a.id} value={a.id}>
                    {isCollab ? `👥 [Colaborativo] ${a.nombre}` : `📁 ${a.nombre}`}
                    {a.eventName ? ` (Evento: ${a.eventName})` : ''}
                  </option>
                );
              })}
            </select>

            {currentAlbumObj && currentAlbumObj.isCollaborative && (
              <div className="p-2 rounded bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900/60 text-[11px] text-[#3869A0] dark:text-blue-300 flex items-center gap-2">
                <Users className="w-3.5 h-3.5 shrink-0" />
                <span>
                  Estás colaborando en el álbum de <b>{currentAlbumObj.propietarioNombre || 'tu amigo'}</b>. Tus fotos llevarán tu firma.
                </span>
              </div>
            )}
          </div>

          {/* VIEW 1: UPLOAD DROPZONE & ITEM LIST */}
          {activeView === 'upload' && (
            <div className="space-y-4">
              {/* Multi-file Dropzone */}
              <div
                onDragOver={e => { e.preventDefault(); setIsDragOver(true); }}
                onDragLeave={() => setIsDragOver(false)}
                onDrop={handleDrop}
                onClick={() => !isProcessing && fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition flex flex-col items-center justify-center gap-2 ${
                  isDragOver 
                    ? 'border-[#3869A0] bg-blue-50/60 dark:bg-blue-950/40' 
                    : 'border-gray-300 dark:border-slate-700 hover:border-[#3869A0] dark:hover:border-blue-400 bg-gray-50/50 dark:bg-slate-900/30'
                }`}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  accept="image/*"
                  className="hidden"
                  onChange={handleFileInputChange}
                  disabled={isProcessing}
                />
                <div className="w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-950 text-[#3869A0] dark:text-blue-300 flex items-center justify-center">
                  <Upload className="w-6 h-6" />
                </div>
                <div>
                  <p className="font-bold text-gray-800 dark:text-gray-200 text-xs sm:text-sm">
                    Haz clic o arrastra múltiples fotos aquí
                  </p>
                  <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5">
                    Sube varias fotos simultáneamente (JPG, PNG, WebP)
                  </p>
                </div>
              </div>

              {/* Queue of Selected Photos */}
              {photoItems.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs font-bold text-gray-700 dark:text-gray-200 px-1">
                    <span>Fotos seleccionadas ({photoItems.length})</span>
                    <button
                      type="button"
                      onClick={() => { setPhotoItems([]); setPhotoConfigs({}); }}
                      disabled={isProcessing}
                      className="text-red-500 hover:text-red-600 dark:hover:text-red-400 text-[11px] font-semibold cursor-pointer disabled:opacity-50"
                    >
                      Limpiar lista
                    </button>
                  </div>

                  <div className="max-h-56 overflow-y-auto space-y-2 pr-1">
                    {photoItems.map((item, idx) => {
                      const cfg = photoConfigs[item.id] || DEFAULT_CAMERA_2008_CONFIG;
                      return (
                        <div 
                          key={item.id}
                          className="p-2.5 rounded-lg border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 flex items-center gap-3 shadow-xs"
                        >
                          <div className="w-12 h-12 rounded bg-gray-100 dark:bg-slate-700 overflow-hidden shrink-0 border border-gray-200 dark:border-slate-600 relative">
                            <img src={item.previewUrl} alt="" className="w-full h-full object-cover" />
                            {cfg.addDateStamp && (
                              <span className="absolute bottom-0 right-0 font-mono text-[7px] font-bold text-[#ff9000] bg-black/60 px-0.5 rounded-tl">
                                '08
                              </span>
                            )}
                          </div>

                          <div className="flex-1 min-w-0">
                            <input
                              type="text"
                              value={item.title}
                              onChange={e => updateItemTitle(item.id, e.target.value)}
                              placeholder={`Título foto ${idx + 1}...`}
                              disabled={isProcessing}
                              className="w-full p-1.5 text-xs rounded border border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-900 text-gray-900 dark:text-white focus:outline-none focus:border-[#3869A0]"
                            />
                            <div className="flex items-center gap-2 text-[10px] text-gray-400 mt-0.5 truncate">
                              <span>{item.file.name} ({(item.file.size / 1024).toFixed(0)} KB)</span>
                              <span>•</span>
                              <span className="text-amber-600 dark:text-amber-400 font-semibold font-mono">
                                Sello: {cfg.addDateStamp ? cfg.dateStampText : 'Desactivado'}
                              </span>
                            </div>
                          </div>

                          <button
                            type="button"
                            onClick={() => setActiveView('studio')}
                            className="px-2 py-1 bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 hover:bg-amber-100 dark:hover:bg-amber-900/60 rounded text-[11px] font-bold border border-amber-200 dark:border-amber-800/80 cursor-pointer flex items-center gap-1 shrink-0"
                            title="Editar filtro en el canvas"
                          >
                            <Camera className="w-3 h-3" />
                            <span>Retocar</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => removePhotoItem(item.id)}
                            disabled={isProcessing}
                            className="text-gray-400 hover:text-red-600 dark:hover:text-red-400 p-1.5 rounded cursor-pointer disabled:opacity-50 shrink-0"
                            title="Eliminar de la lista"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* VIEW 2: DEDICATED CAMERA 2008 CANVAS RETRO STUDIO */}
          {activeView === 'studio' && photoItems.length > 0 && (
            <div className="space-y-3">
              <Camera2008RetroStudio
                photoItems={photoItems}
                photoConfigs={photoConfigs}
                onUpdateConfig={updatePhotoConfig}
                onApplyToAll={applyConfigToAll}
                albumEventDate={currentAlbumObj?.fecha}
                albumEventName={currentAlbumObj?.eventName}
              />
            </div>
          )}

          {/* Quick Options Bar (Retro filter & Privacy) */}
          <div className="p-3 rounded-lg bg-gray-50 dark:bg-slate-900/60 border border-gray-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <label className="flex items-center gap-2 text-xs font-semibold text-gray-700 dark:text-gray-200 cursor-pointer">
              <input
                type="checkbox"
                checked={applyRetroFilter}
                onChange={e => setApplyRetroFilter(e.target.checked)}
                disabled={isProcessing}
                className="w-4 h-4 text-amber-500 rounded focus:ring-amber-400 cursor-pointer"
              />
              <span className="flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                <span>Aplicar procesado con Cámara 2008 (Canvas HTML5 y sello LED analógico)</span>
              </span>
            </label>

            <div className="flex items-center gap-2">
              <span className="text-gray-500 text-[11px]">Privacidad:</span>
              <select
                value={privacy}
                onChange={e => setPrivacy(e.target.value as PhotoPrivacy)}
                disabled={isProcessing}
                className="p-1.5 text-xs rounded border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-gray-900 dark:text-white focus:outline-none"
              >
                <option value="amigos">Solo amigos</option>
                <option value="publica">Pública</option>
              </select>
            </div>
          </div>

          {/* Progress Indicator */}
          {isProcessing && (
            <div className="p-3 rounded-lg bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/60 space-y-2">
              <div className="flex items-center justify-between text-xs font-bold text-amber-900 dark:text-amber-300">
                <span className="flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin text-amber-600" />
                  <span>Procesando en Canvas y subiendo fotos ({uploadProgress.current} de {uploadProgress.total})...</span>
                </span>
                <span>{Math.round((uploadProgress.current / (uploadProgress.total || 1)) * 100)}%</span>
              </div>
              <div className="w-full bg-amber-200 dark:bg-amber-900 rounded-full h-2 overflow-hidden">
                <div 
                  className="bg-amber-500 h-full transition-all duration-300 rounded-full"
                  style={{ width: `${(uploadProgress.current / (uploadProgress.total || 1)) * 100}%` }}
                />
              </div>
            </div>
          )}

          {/* Action buttons */}
          <div className="flex items-center justify-between gap-2 pt-3 border-t border-gray-200 dark:border-slate-800">
            <div>
              {photoItems.length > 0 && activeView === 'upload' && (
                <button
                  type="button"
                  onClick={() => setActiveView('studio')}
                  className="px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 cursor-pointer shadow-xs transition"
                >
                  <Camera className="w-3.5 h-3.5" />
                  <span>Configurar Filtros Cámara 2008</span>
                </button>
              )}
              {photoItems.length > 0 && activeView === 'studio' && (
                <button
                  type="button"
                  onClick={() => setActiveView('upload')}
                  className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs flex items-center gap-1.5 cursor-pointer shadow-xs transition"
                >
                  <ImageIcon className="w-3.5 h-3.5" />
                  <span>Volver a la lista de fotos</span>
                </button>
              )}
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                disabled={isProcessing}
                className="px-3.5 py-1.5 rounded-lg bg-gray-100 dark:bg-slate-800 hover:bg-gray-200 dark:hover:bg-slate-700 text-gray-700 dark:text-gray-200 font-semibold cursor-pointer disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={photoItems.length === 0 || !selectedAlbumId || isProcessing}
                className="px-5 py-2 rounded-lg bg-[#3869A0] hover:bg-[#2c537f] text-white font-bold cursor-pointer shadow-xs disabled:opacity-50 flex items-center gap-2 text-xs"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Horneando y subiendo...</span>
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4" />
                    <span>Subir {photoItems.length} foto{photoItems.length === 1 ? '' : 's'}</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

