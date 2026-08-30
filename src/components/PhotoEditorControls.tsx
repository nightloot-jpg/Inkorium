import React, { useState } from 'react';
import { 
  RotateCw, 
  RotateCcw, 
  FlipHorizontal, 
  FlipVertical, 
  Sliders, 
  Sparkles, 
  RotateCcw as ResetIcon, 
  Calendar, 
  Sun, 
  Contrast as ContrastIcon, 
  Palette, 
  Check, 
  Eye
} from 'lucide-react';
import { 
  PhotoEditState, 
  RETRO_FILTER_PRESETS, 
  DEFAULT_EDIT_STATE, 
  getCssFilterString, 
  getCssTransformString 
} from '../utils/imageEditor';

interface PhotoEditorControlsProps {
  photoUrl: string;
  editState: PhotoEditState;
  onChange: (newState: PhotoEditState) => void;
}

export const PhotoEditorControls: React.FC<PhotoEditorControlsProps> = ({
  photoUrl,
  editState,
  onChange
}) => {
  const [activeTab, setActiveTab] = useState<'filtros' | 'ajustes' | 'orientacion'>('filtros');
  const [showOriginal, setShowOriginal] = useState(false);

  // Rotate 90 deg clockwise
  const handleRotateRight = () => {
    onChange({
      ...editState,
      rotation: (editState.rotation + 90) % 360
    });
  };

  // Rotate 90 deg counter-clockwise
  const handleRotateLeft = () => {
    onChange({
      ...editState,
      rotation: (editState.rotation + 270) % 360
    });
  };

  // Flip horizontal
  const handleToggleFlipH = () => {
    onChange({
      ...editState,
      flipH: !editState.flipH
    });
  };

  // Flip vertical
  const handleToggleFlipV = () => {
    onChange({
      ...editState,
      flipV: !editState.flipV
    });
  };

  // Apply preset filter
  const handleApplyPreset = (presetId: string) => {
    const preset = RETRO_FILTER_PRESETS.find(p => p.id === presetId);
    if (!preset) return;

    onChange({
      ...editState,
      filterId: preset.id,
      brightness: preset.brightness,
      contrast: preset.contrast,
      saturation: preset.saturation,
      sepia: preset.sepia,
      hueRotate: preset.hueRotate,
      vignette: preset.vignette
    });
  };

  // Reset to original
  const handleReset = () => {
    onChange({ ...DEFAULT_EDIT_STATE });
  };

  const isModified = 
    editState.rotation !== 0 ||
    editState.flipH ||
    editState.flipV ||
    editState.filterId !== 'none' ||
    editState.brightness !== 100 ||
    editState.contrast !== 100 ||
    editState.saturation !== 100 ||
    editState.sepia !== 0 ||
    editState.addDateStamp ||
    editState.vignette;

  const currentCssFilter = showOriginal ? 'none' : getCssFilterString(editState);
  const currentCssTransform = showOriginal ? 'none' : getCssTransformString(editState);

  return (
    <div className="space-y-3 bg-[#f7f9fa] border border-[#ccd5df] rounded-lg p-3">
      {/* Top Header & Reset */}
      <div className="flex items-center justify-between border-b border-gray-200 pb-2">
        <div className="flex items-center gap-1.5 font-bold text-xs text-gray-800">
          <Sparkles className="w-3.5 h-3.5 text-[#3869A0]" />
          <span>Editor de Foto & Filtros Retro</span>
          {isModified && (
            <span className="bg-amber-100 text-amber-800 text-[10px] px-1.5 py-0.2 rounded font-semibold border border-amber-300">
              Editada
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          {/* Compare Original Button */}
          <button
            type="button"
            onMouseDown={() => setShowOriginal(true)}
            onMouseUp={() => setShowOriginal(false)}
            onMouseLeave={() => setShowOriginal(false)}
            onTouchStart={() => setShowOriginal(true)}
            onTouchEnd={() => setShowOriginal(false)}
            className="text-[11px] px-2 py-0.5 bg-white hover:bg-gray-100 border border-gray-300 rounded text-gray-600 font-medium flex items-center gap-1 cursor-pointer transition select-none"
            title="Mantén presionado para ver la foto original"
          >
            <Eye className="w-3 h-3 text-gray-500" />
            <span>{showOriginal ? 'Viendo original...' : 'Ver original'}</span>
          </button>

          {/* Reset button */}
          {isModified && (
            <button
              type="button"
              onClick={handleReset}
              className="text-[11px] text-red-600 hover:text-red-800 hover:underline flex items-center gap-1 font-semibold cursor-pointer"
            >
              <ResetIcon className="w-3 h-3" />
              <span>Restablecer</span>
            </button>
          )}
        </div>
      </div>

      {/* Main Preview Frame */}
      <div className="relative w-full h-56 sm:h-64 bg-black/90 rounded-lg overflow-hidden flex items-center justify-center border border-gray-300 select-none">
        <div className="relative max-w-full max-h-full flex items-center justify-center p-2">
          <img
            src={photoUrl}
            alt="Vista previa editada"
            style={{
              filter: currentCssFilter,
              transform: currentCssTransform,
              transition: 'filter 0.15s ease, transform 0.2s ease'
            }}
            className="max-h-52 sm:max-h-60 max-w-full object-contain rounded shadow-lg"
          />

          {/* Realtime Vignette Overlay */}
          {!showOriginal && editState.vignette && (
            <div 
              className="absolute inset-0 pointer-events-none rounded"
              style={{
                boxShadow: 'inset 0 0 60px rgba(0, 0, 0, 0.7)'
              }}
            />
          )}

          {/* Realtime Retro Date Stamp Overlay */}
          {!showOriginal && editState.addDateStamp && (
            <div 
              className="absolute bottom-4 right-4 text-[#ff7b00] font-mono font-bold text-xs sm:text-sm tracking-wider pointer-events-none drop-shadow-[0_0_4px_rgba(255,123,0,0.8)]"
              style={{ textShadow: '0 0 5px #ff7b00, 0 0 2px #ff9900' }}
            >
              {editState.dateStampText || "'08 09 14"}
            </div>
          )}
        </div>

        {/* Quick Orientation Floating Bar */}
        <div className="absolute top-2 right-2 flex items-center gap-1 bg-black/70 backdrop-blur-xs p-1 rounded border border-white/20">
          <button
            type="button"
            onClick={handleRotateLeft}
            title="Rotar 90° a la izquierda"
            className="p-1 text-white hover:bg-white/20 rounded transition cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={handleRotateRight}
            title="Rotar 90° a la derecha"
            className="p-1 text-white hover:bg-white/20 rounded transition cursor-pointer"
          >
            <RotateCw className="w-3.5 h-3.5" />
          </button>
          <div className="w-[1px] h-3.5 bg-white/30 mx-0.5" />
          <button
            type="button"
            onClick={handleToggleFlipH}
            title="Voltear horizontalmente (espejo)"
            className={`p-1 rounded transition cursor-pointer ${
              editState.flipH ? 'bg-[#3869A0] text-white' : 'text-white hover:bg-white/20'
            }`}
          >
            <FlipHorizontal className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={handleToggleFlipV}
            title="Voltear verticalmente"
            className={`p-1 rounded transition cursor-pointer ${
              editState.flipV ? 'bg-[#3869A0] text-white' : 'text-white hover:bg-white/20'
            }`}
          >
            <FlipVertical className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Badge in preview */}
        <div className="absolute bottom-2 left-2 text-[10px] bg-black/60 backdrop-blur-xs text-gray-200 px-2 py-0.5 rounded border border-white/10">
          {RETRO_FILTER_PRESETS.find(p => p.id === editState.filterId)?.name || 'Personalizado'}
          {editState.rotation !== 0 && ` • ${editState.rotation}°`}
        </div>
      </div>

      {/* Editor Sub-Tabs */}
      <div className="flex items-center gap-1 border-b border-gray-200 pb-1">
        <button
          type="button"
          onClick={() => setActiveTab('filtros')}
          className={`px-3 py-1 text-xs font-bold rounded-t cursor-pointer transition flex items-center gap-1.5 ${
            activeTab === 'filtros'
              ? 'bg-[#3869A0] text-white'
              : 'text-gray-600 hover:bg-gray-200 bg-white border border-gray-200'
          }`}
        >
          <Sparkles className="w-3 h-3" />
          <span>Filtros Vintage ({RETRO_FILTER_PRESETS.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('ajustes')}
          className={`px-3 py-1 text-xs font-bold rounded-t cursor-pointer transition flex items-center gap-1.5 ${
            activeTab === 'ajustes'
              ? 'bg-[#3869A0] text-white'
              : 'text-gray-600 hover:bg-gray-200 bg-white border border-gray-200'
          }`}
        >
          <Sliders className="w-3 h-3" />
          <span>Ajustes manuales</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('orientacion')}
          className={`px-3 py-1 text-xs font-bold rounded-t cursor-pointer transition flex items-center gap-1.5 ${
            activeTab === 'orientacion'
              ? 'bg-[#3869A0] text-white'
              : 'text-gray-600 hover:bg-gray-200 bg-white border border-gray-200'
          }`}
        >
          <RotateCw className="w-3 h-3" />
          <span>Girar y encuadre</span>
        </button>
      </div>

      {/* TAB 1: FILTROS VINTAGE */}
      {activeTab === 'filtros' && (
        <div className="space-y-2.5">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {RETRO_FILTER_PRESETS.map((preset) => {
              const isSelected = editState.filterId === preset.id;
              return (
                <button
                  type="button"
                  key={preset.id}
                  onClick={() => handleApplyPreset(preset.id)}
                  className={`p-2 rounded border text-left transition relative cursor-pointer group ${
                    isSelected
                      ? 'bg-blue-50/80 border-[#3869A0] ring-1 ring-[#3869A0]'
                      : 'bg-white border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-bold text-xs text-gray-800 truncate">
                      {preset.name}
                    </span>
                    <span className={`text-[9px] px-1 py-0.2 rounded font-semibold ${
                      isSelected ? 'bg-[#3869A0] text-white' : 'bg-gray-100 text-gray-500'
                    }`}>
                      {preset.eraBadge}
                    </span>
                  </div>

                  <p className="text-[10px] text-gray-500 line-clamp-2 leading-tight">
                    {preset.description}
                  </p>

                  {isSelected && (
                    <div className="absolute top-1.5 right-1.5 w-2 h-2 bg-[#3869A0] rounded-full" />
                  )}
                </button>
              );
            })}
          </div>

          {/* Quick Retro Features row */}
          <div className="pt-2 border-t border-gray-200 flex flex-wrap items-center justify-between gap-3 text-xs">
            {/* Vignette Toggle */}
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={editState.vignette}
                onChange={e => onChange({ ...editState, vignette: e.target.checked })}
                className="w-3.5 h-3.5 text-[#3869A0] rounded focus:ring-0 cursor-pointer"
              />
              <span className="font-medium text-gray-700">Viñeteado vintage (bordes oscuros)</span>
            </label>

            {/* Date Stamp Toggle */}
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={editState.addDateStamp}
                onChange={e => onChange({ ...editState, addDateStamp: e.target.checked })}
                className="w-3.5 h-3.5 text-[#3869A0] rounded focus:ring-0 cursor-pointer"
              />
              <span className="font-medium text-gray-700 flex items-center gap-1">
                <Calendar className="w-3 h-3 text-amber-600" />
                <span>Estampar fecha de cámara digital</span>
              </span>
            </label>
          </div>
        </div>
      )}

      {/* TAB 2: AJUSTES MANUALES */}
      {activeTab === 'ajustes' && (
        <div className="space-y-3 bg-white p-3 rounded border border-gray-200">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            {/* Brillo */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="font-semibold text-gray-700 flex items-center gap-1">
                  <Sun className="w-3.5 h-3.5 text-amber-500" />
                  <span>Brillo</span>
                </span>
                <span className="text-gray-500 font-mono text-[11px]">{editState.brightness}%</span>
              </div>
              <input
                type="range"
                min={50}
                max={160}
                value={editState.brightness}
                onChange={e => onChange({ ...editState, brightness: Number(e.target.value), filterId: 'custom' })}
                className="w-full h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-[#3869A0]"
              />
            </div>

            {/* Contraste */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="font-semibold text-gray-700 flex items-center gap-1">
                  <ContrastIcon className="w-3.5 h-3.5 text-gray-700" />
                  <span>Contraste</span>
                </span>
                <span className="text-gray-500 font-mono text-[11px]">{editState.contrast}%</span>
              </div>
              <input
                type="range"
                min={50}
                max={160}
                value={editState.contrast}
                onChange={e => onChange({ ...editState, contrast: Number(e.target.value), filterId: 'custom' })}
                className="w-full h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-[#3869A0]"
              />
            </div>

            {/* Saturación */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="font-semibold text-gray-700 flex items-center gap-1">
                  <Palette className="w-3.5 h-3.5 text-pink-500" />
                  <span>Saturación de color</span>
                </span>
                <span className="text-gray-500 font-mono text-[11px]">{editState.saturation}%</span>
              </div>
              <input
                type="range"
                min={0}
                max={200}
                value={editState.saturation}
                onChange={e => onChange({ ...editState, saturation: Number(e.target.value), filterId: 'custom' })}
                className="w-full h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-[#3869A0]"
              />
            </div>

            {/* Tinte Sepia */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="font-semibold text-gray-700 flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5 text-amber-700" />
                  <span>Tinte Sepia retro</span>
                </span>
                <span className="text-gray-500 font-mono text-[11px]">{editState.sepia}%</span>
              </div>
              <input
                type="range"
                min={0}
                max={100}
                value={editState.sepia}
                onChange={e => onChange({ ...editState, sepia: Number(e.target.value), filterId: 'custom' })}
                className="w-full h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-[#3869A0]"
              />
            </div>
          </div>

          {/* Retro Extras section */}
          <div className="pt-2 border-t border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <label className="flex items-center gap-2 cursor-pointer text-xs">
              <input
                type="checkbox"
                checked={editState.vignette}
                onChange={e => onChange({ ...editState, vignette: e.target.checked })}
                className="w-3.5 h-3.5 text-[#3869A0] rounded focus:ring-0 cursor-pointer"
              />
              <span className="font-medium text-gray-700">Añadir viñeta (borde oscuro)</span>
            </label>

            <div className="flex items-center gap-2 text-xs">
              <label className="flex items-center gap-1.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={editState.addDateStamp}
                  onChange={e => onChange({ ...editState, addDateStamp: e.target.checked })}
                  className="w-3.5 h-3.5 text-[#3869A0] rounded focus:ring-0 cursor-pointer"
                />
                <span className="font-medium text-gray-700">Sello fecha:</span>
              </label>

              {editState.addDateStamp && (
                <input
                  type="text"
                  value={editState.dateStampText || "'08 09 14"}
                  onChange={e => onChange({ ...editState, dateStampText: e.target.value })}
                  placeholder="'08 09 14"
                  className="px-2 py-0.5 text-xs font-mono bg-gray-50 border border-gray-300 rounded w-28 text-amber-700 font-bold focus:outline-none"
                />
              )}
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: ORIENTACION Y ENCUADRE */}
      {activeTab === 'orientacion' && (
        <div className="space-y-3 bg-white p-3 rounded border border-gray-200 text-xs">
          <p className="text-gray-600">
            Ajusta la orientación o voltea la imagen antes de guardarla en tu álbum o perfil:
          </p>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            <button
              type="button"
              onClick={handleRotateLeft}
              className="p-2.5 rounded border border-gray-200 hover:bg-blue-50/60 hover:border-blue-300 flex flex-col items-center gap-1.5 transition cursor-pointer"
            >
              <RotateCcw className="w-5 h-5 text-[#3869A0]" />
              <span className="font-bold text-gray-700">Rotar -90°</span>
              <span className="text-[10px] text-gray-400">Antihorario</span>
            </button>

            <button
              type="button"
              onClick={handleRotateRight}
              className="p-2.5 rounded border border-gray-200 hover:bg-blue-50/60 hover:border-blue-300 flex flex-col items-center gap-1.5 transition cursor-pointer"
            >
              <RotateCw className="w-5 h-5 text-[#3869A0]" />
              <span className="font-bold text-gray-700">Rotar +90°</span>
              <span className="text-[10px] text-gray-400">Horario</span>
            </button>

            <button
              type="button"
              onClick={handleToggleFlipH}
              className={`p-2.5 rounded border flex flex-col items-center gap-1.5 transition cursor-pointer ${
                editState.flipH 
                  ? 'bg-blue-50 border-[#3869A0] text-[#3869A0]' 
                  : 'border-gray-200 hover:bg-gray-50 text-gray-700'
              }`}
            >
              <FlipHorizontal className="w-5 h-5" />
              <span className="font-bold">Espejo Horizontal</span>
              <span className="text-[10px] text-gray-400">{editState.flipH ? 'Activado' : 'Desactivado'}</span>
            </button>

            <button
              type="button"
              onClick={handleToggleFlipV}
              className={`p-2.5 rounded border flex flex-col items-center gap-1.5 transition cursor-pointer ${
                editState.flipV 
                  ? 'bg-blue-50 border-[#3869A0] text-[#3869A0]' 
                  : 'border-gray-200 hover:bg-gray-50 text-gray-700'
              }`}
            >
              <FlipVertical className="w-5 h-5" />
              <span className="font-bold">Espejo Vertical</span>
              <span className="text-[10px] text-gray-400">{editState.flipV ? 'Activado' : 'Desactivado'}</span>
            </button>
          </div>

          <div className="flex items-center justify-between pt-2 border-t border-gray-100 text-gray-500 text-[11px]">
            <span>Ángulo actual: <b className="text-gray-800">{editState.rotation}°</b></span>
            {(editState.rotation !== 0 || editState.flipH || editState.flipV) && (
              <button
                type="button"
                onClick={() => onChange({ ...editState, rotation: 0, flipH: false, flipV: false })}
                className="text-[#3869A0] hover:underline font-semibold"
              >
                Restablecer solo orientación
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
