import React, { useState, useRef } from 'react';
import { useInkorium } from '../context/InkoriumContext';
import { Camera, Upload, Check, X, Loader2, Sparkles, Sliders, RefreshCw, ZoomIn, ZoomOut } from 'lucide-react';
import { uploadMediaFile } from '../lib/storage';
import { supabase, isSupabaseConfigured } from '../lib/supabase';

interface AvatarModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AvatarModal: React.FC<AvatarModalProps> = ({ isOpen, onClose }) => {
  const { currentUser, updateUserData } = useInkorium();

  const [previewUrl, setPreviewUrl] = useState<string>(currentUser.avatar || '');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [zoom, setZoom] = useState<number>(1);
  const [filter, setFilter] = useState<'normal' | 'vintage' | 'contrast' | 'bw'>('normal');
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [isDragOver, setIsDragOver] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleFileSelect = (file: File) => {
    if (!file.type.startsWith('image/')) {
      setErrorMsg('Por favor selecciona una imagen válida (JPG, PNG, GIF o WEBP).');
      return;
    }
    setErrorMsg(null);
    setSelectedFile(file);

    const reader = new FileReader();
    reader.onload = (e) => {
      if (e.target?.result) {
        setPreviewUrl(e.target.result as string);
        setZoom(1);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  };

  const handleSaveAvatar = async () => {
    if (!previewUrl) return;
    setIsUploading(true);
    setErrorMsg(null);

    try {
      let finalAvatarUrl = previewUrl;

      if (selectedFile) {
        // Upload to Supabase storage or get URL
        finalAvatarUrl = await uploadMediaFile(selectedFile, 'avatars');
      } else if (previewUrl.startsWith('data:image')) {
        finalAvatarUrl = await uploadMediaFile(previewUrl, 'avatars');
      }

      // Update in context
      updateUserData({ avatar: finalAvatarUrl });

      // Sync to Supabase profiles & auth metadata if logged in
      if (isSupabaseConfigured && supabase && currentUser.id) {
        try {
          await supabase.from('profiles').upsert({
            id: currentUser.id,
            avatar: finalAvatarUrl
          });
          await supabase.auth.updateUser({
            data: { avatar: finalAvatarUrl }
          });
        } catch (supaErr) {
          console.warn('Error syncing avatar to Supabase profile:', supaErr);
        }
      }

      setIsUploading(false);
      onClose();
    } catch (err: any) {
      console.error('Error saving avatar:', err);
      setErrorMsg(err?.message || 'Error al guardar la foto de perfil.');
      setIsUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/65 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-fade-in">
      <div className="bg-white rounded-lg border border-gray-300 max-w-md w-full p-4 sm:p-5 shadow-2xl space-y-4 max-h-[92vh] overflow-y-auto text-xs">
        {/* Header */}
        <div className="flex items-center justify-between pb-2.5 border-b border-gray-200">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded bg-blue-100 text-[#3869A0] flex items-center justify-center font-bold">
              <Camera className="w-4 h-4" />
            </div>
            <div>
              <h2 className="font-bold text-sm text-gray-900 leading-tight">Cambiar foto de perfil / Avatar</h2>
              <p className="text-[11px] text-gray-500">Sube una foto desde tu dispositivo o arrástrala aquí</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="text-gray-400 hover:text-gray-700 text-base font-bold cursor-pointer px-1"
          >
            ✕
          </button>
        </div>

        {errorMsg && (
          <div className="p-2.5 bg-red-50 border border-red-200 rounded text-red-700 text-xs">
            {errorMsg}
          </div>
        )}

        {/* Avatar Preview Area */}
        <div className="flex flex-col items-center justify-center space-y-3 py-2">
          <div className="relative group w-36 h-36 rounded-full border-4 border-[#3869A0]/20 shadow-md overflow-hidden bg-gray-100 flex items-center justify-center">
            {previewUrl ? (
              <img
                src={previewUrl}
                alt="Vista previa"
                style={{
                  transform: `scale(${zoom})`,
                  filter: 
                    filter === 'vintage' ? 'sepia(0.35) contrast(1.1) brightness(1.05)' :
                    filter === 'contrast' ? 'contrast(1.3) saturate(1.2)' :
                    filter === 'bw' ? 'grayscale(1)' : 'none'
                }}
                className="w-full h-full object-cover transition duration-150"
              />
            ) : (
              <Camera className="w-12 h-12 text-gray-300" />
            )}

            <div 
              onClick={() => fileInputRef.current?.click()}
              className="absolute inset-0 bg-black/40 text-white flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition cursor-pointer"
            >
              <Upload className="w-5 h-5 mb-1" />
              <span className="text-[10px] font-bold">Examinar</span>
            </div>
          </div>

          {/* Quick Zoom slider & filter */}
          {previewUrl && (
            <div className="w-full space-y-2 pt-1">
              <div className="flex items-center justify-between gap-2 px-4 text-[11px] text-gray-600">
                <span className="flex items-center gap-1 font-semibold">
                  <ZoomOut className="w-3.5 h-3.5" />
                  <span>Zoom:</span>
                </span>
                <input
                  type="range"
                  min="0.8"
                  max="2"
                  step="0.05"
                  value={zoom}
                  onChange={(e) => setZoom(parseFloat(e.target.value))}
                  className="flex-1 accent-[#3869A0]"
                />
                <span className="flex items-center gap-1 font-semibold">
                  <ZoomIn className="w-3.5 h-3.5" />
                  <span>{Math.round(zoom * 100)}%</span>
                </span>
              </div>

              {/* Filter chips */}
              <div className="flex items-center justify-center gap-1.5 pt-1">
                {(['normal', 'vintage', 'contrast', 'bw'] as const).map((f) => (
                  <button
                    key={f}
                    type="button"
                    onClick={() => setFilter(f)}
                    className={`px-2.5 py-1 rounded text-[10px] font-bold capitalize transition cursor-pointer ${
                      filter === f ? 'bg-[#3869A0] text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {f === 'normal' ? 'Original' : f === 'vintage' ? 'Retro' : f === 'contrast' ? 'Vívido' : 'B&N'}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Drag & Drop or Browse Trigger */}
        <div
          onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
          onDragLeave={() => setIsDragOver(false)}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`border-2 border-dashed rounded-lg p-4 text-center cursor-pointer transition ${
            isDragOver ? 'border-[#3869A0] bg-blue-50' : 'border-gray-300 hover:bg-gray-50'
          }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={(e) => e.target.files?.[0] && handleFileSelect(e.target.files[0])}
            className="hidden"
          />

          <div className="flex items-center justify-center gap-2 text-gray-600">
            <Upload className="w-4 h-4 text-[#3869A0]" />
            <span className="font-bold">Seleccionar archivo desde tu equipo</span>
          </div>
          <p className="text-[10px] text-gray-400 mt-0.5">Formatos admitidos: JPG, PNG, GIF, WEBP</p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-2 pt-3 border-t border-gray-200">
          <button
            type="button"
            onClick={onClose}
            disabled={isUploading}
            className="px-3.5 py-1.5 rounded bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold cursor-pointer transition disabled:opacity-50"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleSaveAvatar}
            disabled={!previewUrl || isUploading}
            className="px-5 py-1.5 rounded bg-[#3869A0] hover:bg-[#2c537f] text-white font-bold cursor-pointer shadow-xs transition disabled:opacity-50 flex items-center gap-1.5"
          >
            {isUploading ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Guardando avatar...</span>
              </>
            ) : (
              <>
                <Check className="w-3.5 h-3.5" />
                <span>Guardar avatar</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
