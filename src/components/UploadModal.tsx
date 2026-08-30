import React, { useState, useRef } from 'react';
import { useInkorium } from '../context/InkoriumContext';
import { Upload, Image as ImageIcon, Plus, Check, Sliders, Loader2, RefreshCw, Camera, AlertCircle } from 'lucide-react';
import { PhotoEditorControls } from './PhotoEditorControls';
import { PhotoEditState, DEFAULT_EDIT_STATE, bakeEditedImage } from '../utils/imageEditor';
import { uploadMediaFile } from '../lib/storage';

export const UploadModal: React.FC<{ isOpen: boolean; onClose: () => void }> = ({ isOpen, onClose }) => {
  const { albums, currentUser, uploadPhoto, createAlbum } = useInkorium();

  const [title, setTitle] = useState('');
  const [albumId, setAlbumId] = useState<string>('');
  const [photoUrl, setPhotoUrl] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [editState, setEditState] = useState<PhotoEditState>({ ...DEFAULT_EDIT_STATE });
  const [isProcessing, setIsProcessing] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const [showNewAlbumInput, setShowNewAlbumInput] = useState(false);
  const [newAlbumName, setNewAlbumName] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleFileUpload = (file: File) => {
    if (!file.type.startsWith('image/')) {
      setErrorMessage('Por favor, selecciona un archivo de imagen válido (JPG, PNG, GIF o WEBP).');
      return;
    }
    setErrorMessage(null);
    setSelectedFile(file);

    const reader = new FileReader();
    reader.onload = (e) => {
      if (e.target?.result) {
        setPhotoUrl(e.target.result as string);
        setEditState({ ...DEFAULT_EDIT_STATE });
        if (!title) {
          const autoTitle = file.name.replace(/\.[^/.]+$/, '').replace(/[_-]/g, ' ');
          setTitle(autoTitle);
        }
      }
    };
    reader.readAsDataURL(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileUpload(e.dataTransfer.files[0]);
    }
  };

  const handleCreateNewAlbum = () => {
    if (!newAlbumName.trim()) return;
    createAlbum(newAlbumName.trim());
    setNewAlbumName('');
    setShowNewAlbumInput(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!photoUrl || isProcessing) return;

    setIsProcessing(true);
    setErrorMessage(null);
    try {
      // 1. Bake all filters, rotation, adjustments and retro date stamp onto canvas
      const bakedDataUrl = await bakeEditedImage(photoUrl, editState);

      // 2. Upload to storage bucket (Supabase / R2 / base64 fallback)
      const storedUrl = await uploadMediaFile(bakedDataUrl, 'photos');

      // 3. Register photo in context
      uploadPhoto(title.trim() || 'Sin título', albumId || null, storedUrl);
      
      // Clean state
      setTitle('');
      setPhotoUrl('');
      setSelectedFile(null);
      setAlbumId('');
      setEditState({ ...DEFAULT_EDIT_STATE });
      onClose();
    } catch (err: any) {
      console.error('Error processing image:', err);
      // Fallback with base64
      uploadPhoto(title.trim() || 'Sin título', albumId || null, photoUrl);
      onClose();
    } finally {
      setIsProcessing(false);
    }
  };

  const myAlbums = albums.filter(a => a.userId === currentUser.id);

  return (
    <div className="fixed inset-0 z-50 bg-black/65 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-fade-in">
      <div className="bg-white rounded-lg border border-gray-300 max-w-3xl w-full p-4 sm:p-5 shadow-2xl space-y-4 max-h-[92vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-2.5 border-b border-gray-200">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded bg-blue-100 text-[#3869A0] flex items-center justify-center font-bold">
              <Upload className="w-4 h-4" />
            </div>
            <div>
              <h2 className="font-bold text-sm text-gray-900 leading-tight">Subir y Publicar Foto en Inkorium</h2>
              <p className="text-[11px] text-gray-500">Selecciona fotos de tu equipo, aplica filtros vintage y guárdalas en tus álbumes</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="text-gray-400 hover:text-gray-700 text-lg font-bold cursor-pointer px-1"
          >
            ✕
          </button>
        </div>

        {errorMessage && (
          <div className="p-2.5 bg-red-50 border border-red-200 rounded text-red-700 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          {/* Main Photo Picker / Photo Editor Area */}
          {!photoUrl ? (
            <div className="space-y-3">
              <label className="font-bold text-gray-700 block">1. Selecciona la foto que deseas subir desde tu equipo:</label>
              
              {/* Drag and drop zone */}
              <div
                onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
                onDragLeave={() => setIsDragOver(false)}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-lg p-10 text-center cursor-pointer transition ${
                  isDragOver ? 'border-[#3869A0] bg-blue-50' : 'border-gray-300 hover:bg-gray-50'
                }`}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={e => e.target.files?.[0] && handleFileUpload(e.target.files[0])}
                  className="hidden"
                />

                <div className="flex flex-col items-center gap-3 text-gray-500">
                  <div className="w-14 h-14 rounded-full bg-blue-50 text-[#3869A0] flex items-center justify-center shadow-xs">
                    <ImageIcon className="w-7 h-7" />
                  </div>
                  <div>
                    <p className="font-bold text-gray-800 text-sm">
                      Haz clic para examinar archivos o arrastra una imagen aquí
                    </p>
                    <p className="text-[11px] text-gray-400 mt-1">Formatos compatibles: JPG, JPEG, PNG, GIF o WEBP</p>
                  </div>
                  <button
                    type="button"
                    className="mt-2 px-4 py-1.5 bg-[#3869A0] hover:bg-[#2c537f] text-white font-bold rounded shadow-xs text-xs flex items-center gap-1.5 cursor-pointer"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    <span>Seleccionar desde el ordenador</span>
                  </button>
                </div>
              </div>
            </div>
          ) : (
            /* PHOTO EDITOR ACTIVE */
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <label className="font-bold text-gray-700 flex items-center gap-1.5 text-xs">
                  <Sliders className="w-3.5 h-3.5 text-[#3869A0]" />
                  <span>Edición de foto y filtros retro:</span>
                </label>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="text-[11px] text-[#3869A0] hover:underline font-semibold flex items-center gap-1 cursor-pointer"
                  >
                    <RefreshCw className="w-3 h-3" />
                    <span>Cambiar imagen</span>
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={e => e.target.files?.[0] && handleFileUpload(e.target.files[0])}
                    className="hidden"
                  />
                </div>
              </div>

              {/* Editor Controls & Live Canvas */}
              <PhotoEditorControls
                photoUrl={photoUrl}
                editState={editState}
                onChange={setEditState}
              />
            </div>
          )}

          {/* Details: Title & Album Selector */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-gray-200">
            {/* Title */}
            <div>
              <label className="font-bold text-gray-700 block mb-1">Título o pie de foto:</label>
              <input
                type="text"
                placeholder="Escribe un título para la foto..."
                value={title}
                onChange={e => setTitle(e.target.value)}
                className="w-full p-2 text-xs rounded border border-gray-300 focus:outline-none focus:border-[#3869A0] bg-white"
              />
            </div>

            {/* Album Selector */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="font-bold text-gray-700">Álbum de destino:</label>
                <button
                  type="button"
                  onClick={() => setShowNewAlbumInput(!showNewAlbumInput)}
                  className="text-[11px] text-[#3869A0] hover:underline flex items-center gap-1 font-semibold cursor-pointer"
                >
                  <Plus className="w-3 h-3" />
                  <span>Crear nuevo álbum</span>
                </button>
              </div>

              {showNewAlbumInput && (
                <div className="flex items-center gap-2 p-2 bg-blue-50/60 rounded border border-blue-200 mb-2">
                  <input
                    type="text"
                    placeholder="Nombre del nuevo álbum..."
                    value={newAlbumName}
                    onChange={e => setNewAlbumName(e.target.value)}
                    className="flex-1 p-1.5 text-xs bg-white rounded border border-gray-300 focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={handleCreateNewAlbum}
                    disabled={!newAlbumName.trim()}
                    className="px-2.5 py-1 bg-[#3869A0] text-white font-bold rounded text-xs disabled:opacity-50 cursor-pointer"
                  >
                    Guardar
                  </button>
                </div>
              )}

              <select
                value={albumId}
                onChange={e => setAlbumId(e.target.value)}
                className="w-full p-2 text-xs rounded border border-gray-300 focus:outline-none focus:border-[#3869A0] bg-white"
              >
                <option value="">Ninguno (Fotos subidas sueltas)</option>
                {myAlbums.map(a => (
                  <option key={a.id} value={a.id}>{a.nombre}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-between pt-3 border-t border-gray-200">
            <div className="text-[11px] text-gray-500">
              {photoUrl ? '✓ Los filtros y la rotación se aplicarán permanentemente a la foto publicada.' : 'Selecciona una foto para continuar.'}
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                disabled={isProcessing}
                className="px-3.5 py-1.5 rounded bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold cursor-pointer transition disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={!photoUrl || isProcessing}
                className="px-5 py-1.5 rounded bg-[#3869A0] hover:bg-[#2c537f] text-white font-bold cursor-pointer shadow-xs transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Guardando y subiendo...</span>
                  </>
                ) : (
                  <>
                    <Upload className="w-3.5 h-3.5" />
                    <span>Subir a Inkorium</span>
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


