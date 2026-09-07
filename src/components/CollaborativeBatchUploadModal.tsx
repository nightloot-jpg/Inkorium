import React, { useState, useRef, useMemo } from 'react';
import { useInkorium } from '../context/InkoriumContext';
import { 
  Upload, Image as ImageIcon, X, Trash2, Check, Sparkles, 
  Loader2, AlertCircle, Plus, Users, Calendar, Sliders, ShieldCheck
} from 'lucide-react';
import { Album, PhotoPrivacy } from '../types';
import { validateImageFile } from '../utils/validation';
import { bakeEditedImage, DEFAULT_EDIT_STATE, PhotoEditState } from '../utils/imageEditor';
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

  const handleProcessFiles = async (files: FileList | File[]) => {
    setErrorMessage(null);
    const newItems: BatchPhotoItem[] = [];

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

      newItems.push({
        id: `batch-${Date.now()}-${Math.random().toString(36).slice(2, 6)}-${i}`,
        file,
        previewUrl,
        title: autoTitle,
        isValid: validation.isValid,
        error: validation.message
      });
    }

    setPhotoItems(prev => [...prev, ...newItems]);
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
  };

  const updateItemTitle = (id: string, title: string) => {
    setPhotoItems(prev => prev.map(p => p.id === id ? { ...p, title } : p));
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

    const now = new Date();
    const yy = "'08";
    const mm = String(now.getMonth() + 1).padStart(2, '0');
    const dd = String(now.getDate()).padStart(2, '0');
    const retroStamp = `${yy} ${mm} ${dd}`;

    try {
      for (let i = 0; i < validItems.length; i++) {
        const item = validItems[i];
        let finalDataUrl = item.previewUrl;

        // Apply retro filter if enabled
        if (applyRetroFilter) {
          const editState: PhotoEditState = {
            ...DEFAULT_EDIT_STATE,
            filterId: 'tuenti_2008',
            brightness: 106,
            contrast: 112,
            saturation: 120,
            sepia: 18,
            overlayStyle: 'warm',
            addDateStamp: true,
            dateStampText: retroStamp
          };
          try {
            finalDataUrl = await bakeEditedImage(item.previewUrl, editState);
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
      if (onCompleted) onCompleted();
      onClose();
    } catch (err: any) {
      console.error('Batch upload error:', err);
      setErrorMessage('Hubo un problema al subir algunas fotos.');
    } finally {
      setIsProcessing(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/65 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-fade-in">
      <div className="bg-white dark:bg-[#0e1726] rounded-xl border border-gray-300 dark:border-slate-700 max-w-2xl w-full p-4 sm:p-5 shadow-2xl space-y-4 max-h-[92vh] overflow-y-auto">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-gray-200 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 flex items-center justify-center font-bold">
              <Upload className="w-4.5 h-4.5" />
            </div>
            <div>
              <h2 className="font-bold text-sm sm:text-base text-gray-900 dark:text-white leading-tight">
                Subida Simultánea de Fotos
              </h2>
              <p className="text-[11px] text-gray-500 dark:text-gray-400">
                Arrastra y suelta varias fotos a la vez para volcarlas en el álbum del evento
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
                  onClick={() => setPhotoItems([])}
                  disabled={isProcessing}
                  className="text-red-500 hover:text-red-600 dark:hover:text-red-400 text-[11px] font-semibold cursor-pointer disabled:opacity-50"
                >
                  Limpiar lista
                </button>
              </div>

              <div className="max-h-60 overflow-y-auto space-y-2 pr-1">
                {photoItems.map((item, idx) => (
                  <div 
                    key={item.id}
                    className="p-2.5 rounded-lg border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 flex items-center gap-3 shadow-xs"
                  >
                    <div className="w-12 h-12 rounded bg-gray-100 dark:bg-slate-700 overflow-hidden shrink-0 border border-gray-200 dark:border-slate-600">
                      <img src={item.previewUrl} alt="" className="w-full h-full object-cover" />
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
                      <span className="text-[10px] text-gray-400 mt-0.5 block truncate">
                        {item.file.name} ({(item.file.size / 1024).toFixed(0)} KB)
                      </span>
                    </div>

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
                ))}
              </div>
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
                className="w-4 h-4 text-[#3869A0] rounded focus:ring-[#3869A0]"
              />
              <span className="flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                <span>Aplicar sello de fecha retro '08 y contraste clásico</span>
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
            <div className="p-3 rounded-lg bg-blue-50 dark:bg-blue-950/50 border border-blue-200 dark:border-blue-900/60 space-y-2">
              <div className="flex items-center justify-between text-xs font-bold text-[#3869A0] dark:text-blue-300">
                <span className="flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin text-[#3869A0]" />
                  <span>Subiendo fotos al álbum ({uploadProgress.current} de {uploadProgress.total})...</span>
                </span>
                <span>{Math.round((uploadProgress.current / (uploadProgress.total || 1)) * 100)}%</span>
              </div>
              <div className="w-full bg-blue-200 dark:bg-blue-900 rounded-full h-2 overflow-hidden">
                <div 
                  className="bg-[#3869A0] h-full transition-all duration-300 rounded-full"
                  style={{ width: `${(uploadProgress.current / (uploadProgress.total || 1)) * 100}%` }}
                />
              </div>
            </div>
          )}

          {/* Action buttons */}
          <div className="flex items-center justify-end gap-2 pt-3 border-t border-gray-200 dark:border-slate-800">
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
                  <span>Subiendo...</span>
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4" />
                  <span>Subir {photoItems.length} foto{photoItems.length === 1 ? '' : 's'}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
