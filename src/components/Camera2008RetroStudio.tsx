import React, { useState, useEffect, useRef } from 'react';
import { 
  Camera, Sparkles, Sliders, Calendar, Clock, RotateCcw, 
  Check, Eye, EyeOff, Layers, Zap, Palette, ArrowRight, Wand2
} from 'lucide-react';
import { 
  Camera2008Config, 
  CAMERA_2008_PRESETS, 
  DEFAULT_CAMERA_2008_CONFIG, 
  getDefault2008DateStamp,
  render2008CameraToCanvas,
  bakeCamera2008Image 
} from '../utils/imageEditor';

export interface PhotoItemWith2008Config {
  id: string;
  previewUrl: string;
  title: string;
  config: Camera2008Config;
}

interface Camera2008RetroStudioProps {
  photoItems: Array<{ id: string; previewUrl: string; title: string }>;
  photoConfigs: Record<string, Camera2008Config>;
  onUpdateConfig: (id: string, config: Camera2008Config) => void;
  onApplyToAll: (config: Camera2008Config) => void;
  albumEventDate?: string;
  albumEventName?: string;
}

export const Camera2008RetroStudio: React.FC<Camera2008RetroStudioProps> = ({
  photoItems,
  photoConfigs,
  onUpdateConfig,
  onApplyToAll,
  albumEventDate,
  albumEventName
}) => {
  const [selectedPhotoId, setSelectedPhotoId] = useState<string>(photoItems[0]?.id || '');
  const [showOriginal, setShowOriginal] = useState(false);
  const [activeTab, setActiveTab] = useState<'presets' | 'datestamp' | 'manual'>('presets');
  
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const currentImgRef = useRef<HTMLImageElement | null>(null);

  // Sync selected photo if items change
  useEffect(() => {
    if (photoItems.length > 0 && (!selectedPhotoId || !photoItems.some(p => p.id === selectedPhotoId))) {
      setSelectedPhotoId(photoItems[0].id);
    }
  }, [photoItems, selectedPhotoId]);

  const currentPhoto = photoItems.find(p => p.id === selectedPhotoId) || photoItems[0];
  const currentConfig = (currentPhoto && photoConfigs[currentPhoto.id]) || {
    ...DEFAULT_CAMERA_2008_CONFIG,
    dateStampText: albumEventDate ? formatEventDateTo2008(albumEventDate) : getDefault2008DateStamp()
  };

  function formatEventDateTo2008(dateStr: string): string {
    try {
      const parts = dateStr.split(/[-/]/);
      if (parts.length >= 3) {
        // e.g. 2024-09-14 or 14/09/2024
        const mm = parts[1].padStart(2, '0');
        const dd = parts[2].length === 2 ? parts[2] : parts[0].padStart(2, '0');
        return `'08 ${mm} ${dd}`;
      }
    } catch {
      // fallback
    }
    return getDefault2008DateStamp();
  }

  // Load image object and draw onto canvas
  useEffect(() => {
    if (!currentPhoto || !canvasRef.current) return;

    const img = new Image();
    img.crossOrigin = 'anonymous';

    img.onload = () => {
      currentImgRef.current = img;
      renderCanvas();
    };

    img.src = currentPhoto.previewUrl;
  }, [currentPhoto?.previewUrl]);

  // Re-render canvas when config or showOriginal changes
  useEffect(() => {
    renderCanvas();
  }, [currentConfig, showOriginal]);

  const renderCanvas = () => {
    const canvas = canvasRef.current;
    const img = currentImgRef.current;
    if (!canvas || !img) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas dimensions matching aspect ratio (constrained for smooth preview rendering)
    const maxDimension = 720;
    let w = img.naturalWidth || img.width;
    let h = img.naturalHeight || img.height;

    if (w > maxDimension || h > maxDimension) {
      if (w > h) {
        h = Math.round((h * maxDimension) / w);
        w = maxDimension;
      } else {
        w = Math.round((w * maxDimension) / h);
        h = maxDimension;
      }
    }

    canvas.width = w;
    canvas.height = h;

    if (showOriginal) {
      ctx.filter = 'none';
      ctx.drawImage(img, 0, 0, w, h);
    } else {
      render2008CameraToCanvas(ctx, img, w, h, currentConfig);
    }
  };

  const handleSelectPreset = (presetId: string) => {
    const preset = CAMERA_2008_PRESETS.find(p => p.id === presetId);
    if (!preset || !currentPhoto) return;

    const newConfig: Camera2008Config = {
      ...currentConfig,
      ...preset.config,
      presetId: preset.id
    };

    onUpdateConfig(currentPhoto.id, newConfig);
  };

  const handleUpdateField = <K extends keyof Camera2008Config>(field: K, value: Camera2008Config[K]) => {
    if (!currentPhoto) return;
    const newConfig: Camera2008Config = {
      ...currentConfig,
      [field]: value
    };
    onUpdateConfig(currentPhoto.id, newConfig);
  };

  const handleApplyToAllPhotos = () => {
    onApplyToAll(currentConfig);
  };

  const handleResetCurrent = () => {
    if (!currentPhoto) return;
    onUpdateConfig(currentPhoto.id, {
      ...DEFAULT_CAMERA_2008_CONFIG,
      dateStampText: albumEventDate ? formatEventDateTo2008(albumEventDate) : getDefault2008DateStamp()
    });
  };

  if (!currentPhoto) {
    return (
      <div className="p-8 text-center text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-slate-900/50 rounded-xl border border-dashed border-gray-300 dark:border-slate-800">
        <Camera className="w-8 h-8 mx-auto mb-2 text-gray-400" />
        <p className="text-xs font-bold">Selecciona o sube fotos para configurar el filtro Cámara 2008</p>
      </div>
    );
  }

  return (
    <div className="bg-slate-900 text-white rounded-xl border border-slate-700/80 p-3.5 sm:p-4.5 space-y-4 shadow-xl">
      
      {/* Top Banner: 2008 Camera Visualizer */}
      <div className="flex flex-wrap items-center justify-between gap-2.5 pb-3 border-b border-slate-800">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-500 to-orange-600 text-white flex items-center justify-center font-bold shadow-xs">
            <Camera className="w-4.5 h-4.5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-xs sm:text-sm text-amber-400 tracking-wide flex items-center gap-1.5">
                <span>ESTUDIO CÁMARA 2008</span>
                <span className="bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[9px] font-mono px-1.5 py-0.2 rounded">
                  HTML5 CANVAS
                </span>
              </h3>
            </div>
            <p className="text-[11px] text-slate-300">
              Transforma las fotos del álbum con saturación analógica y sello LED de fecha retro
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Apply to all button */}
          {photoItems.length > 1 && (
            <button
              type="button"
              onClick={handleApplyToAllPhotos}
              className="px-2.5 py-1.5 bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 transition cursor-pointer shadow-xs"
              title="Aplica los ajustes de esta foto a todas las fotos seleccionadas"
            >
              <Wand2 className="w-3.5 h-3.5" />
              <span>Aplicar a las {photoItems.length} fotos</span>
            </button>
          )}

          <button
            type="button"
            onClick={handleResetCurrent}
            className="px-2 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-medium flex items-center gap-1 transition cursor-pointer border border-slate-700"
            title="Restablecer a valores por defecto"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Restablecer</span>
          </button>
        </div>
      </div>

      {/* Main Studio Area: Live Canvas on left, Controls on right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        
        {/* Left Column: Live Canvas Stage (5 cols on lg) */}
        <div className="lg:col-span-6 flex flex-col gap-3">
          
          {/* Live Canvas Viewer */}
          <div className="relative rounded-xl overflow-hidden bg-black/80 border border-slate-800 flex items-center justify-center min-h-[260px] max-h-[380px] shadow-inner">
            
            {/* The Actual HTML5 Canvas */}
            <canvas
              ref={canvasRef}
              className="max-h-[340px] max-w-full w-auto h-auto object-contain transition-all"
            />

            {/* Hold to Compare overlay button */}
            <div className="absolute top-2.5 right-2.5 z-20">
              <button
                type="button"
                onMouseDown={() => setShowOriginal(true)}
                onMouseUp={() => setShowOriginal(false)}
                onTouchStart={() => setShowOriginal(true)}
                onTouchEnd={() => setShowOriginal(false)}
                className="bg-black/75 hover:bg-black text-white px-2.5 py-1 rounded-lg text-[10px] font-bold backdrop-blur-xs border border-white/20 flex items-center gap-1.5 cursor-pointer shadow-md transition select-none"
              >
                {showOriginal ? <EyeOff className="w-3 h-3 text-amber-400" /> : <Eye className="w-3 h-3 text-slate-300" />}
                <span>{showOriginal ? 'Viendo Original' : 'Mantén: Comparar'}</span>
              </button>
            </div>

            {/* Vintage Digicam OSD / UI Overlay */}
            <div className="absolute top-2.5 left-2.5 z-10 pointer-events-none flex flex-col gap-1 font-mono text-[9px] text-white/70 drop-shadow-[0_1px_2px_rgba(0,0,0,0.9)]">
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                <span className="font-bold tracking-widest text-red-400">REC</span>
                <span className="text-slate-400">ISO 400</span>
                <span className="text-slate-400">5.0 MP</span>
              </div>
            </div>

            {/* Bottom-left photo title label */}
            <div className="absolute bottom-2 left-2.5 z-10 pointer-events-none max-w-[200px] truncate text-[10px] text-slate-300 bg-black/60 px-2 py-0.5 rounded backdrop-blur-xs font-medium">
              {currentPhoto.title || 'Foto seleccionada'}
            </div>
          </div>

          {/* Photo thumbnails strip (if multiple photos) */}
          {photoItems.length > 1 && (
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-[11px] text-slate-400 px-0.5">
                <span>Fotos del lote ({photoItems.length}) - Haz clic para editar individualmente:</span>
              </div>
              <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-thin">
                {photoItems.map((p, idx) => {
                  const isSelected = p.id === selectedPhotoId;
                  const cfg = photoConfigs[p.id] || DEFAULT_CAMERA_2008_CONFIG;
                  const presetObj = CAMERA_2008_PRESETS.find(pr => pr.id === cfg.presetId);

                  return (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => setSelectedPhotoId(p.id)}
                      className={`relative rounded-lg overflow-hidden shrink-0 w-16 h-16 border-2 transition cursor-pointer group ${
                        isSelected 
                          ? 'border-amber-400 ring-2 ring-amber-400/40 scale-105 shadow-md' 
                          : 'border-slate-700 hover:border-slate-500 opacity-75 hover:opacity-100'
                      }`}
                    >
                      <img src={p.previewUrl} alt="" className="w-full h-full object-cover" />
                      
                      {/* Photo number indicator */}
                      <span className="absolute top-1 left-1 bg-black/75 text-white font-mono text-[9px] font-bold px-1 rounded">
                        #{idx + 1}
                      </span>

                      {/* Mini analog stamp indicator */}
                      {cfg.addDateStamp && (
                        <span className="absolute bottom-0.5 right-0.5 font-mono text-[7px] font-bold text-[#ff9000] drop-shadow-[0_1px_1px_rgba(0,0,0,0.9)]">
                          '08
                        </span>
                      )}

                      {/* Selected check */}
                      {isSelected && (
                        <div className="absolute inset-0 bg-amber-500/15 pointer-events-none" />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Controls & Customizer Tabs (6 cols on lg) */}
        <div className="lg:col-span-6 flex flex-col gap-3">
          
          {/* Subtabs Selector */}
          <div className="grid grid-cols-3 gap-1 bg-slate-950 p-1 rounded-lg border border-slate-800">
            <button
              type="button"
              onClick={() => setActiveTab('presets')}
              className={`py-1.5 px-2 rounded-md font-bold text-xs transition cursor-pointer flex items-center justify-center gap-1.5 ${
                activeTab === 'presets'
                  ? 'bg-amber-500 text-slate-950 shadow-xs'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>1. Estilos 2008</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('datestamp')}
              className={`py-1.5 px-2 rounded-md font-bold text-xs transition cursor-pointer flex items-center justify-center gap-1.5 ${
                activeTab === 'datestamp'
                  ? 'bg-amber-500 text-slate-950 shadow-xs'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Clock className="w-3.5 h-3.5" />
              <span>2. Sello de Fecha</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('manual')}
              className={`py-1.5 px-2 rounded-md font-bold text-xs transition cursor-pointer flex items-center justify-center gap-1.5 ${
                activeTab === 'manual'
                  ? 'bg-amber-500 text-slate-950 shadow-xs'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Sliders className="w-3.5 h-3.5" />
              <span>3. Ajustes Finos</span>
            </button>
          </div>

          {/* TAB 1: PRESETS */}
          {activeTab === 'presets' && (
            <div className="space-y-2 max-h-[320px] overflow-y-auto pr-1 scrollbar-thin">
              <p className="text-[11px] text-slate-400 font-medium">
                Elige la atmósfera analógica de los años dorados de Tuenti:
              </p>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {CAMERA_2008_PRESETS.map(preset => {
                  const isSelected = currentConfig.presetId === preset.id;

                  return (
                    <div
                      key={preset.id}
                      onClick={() => handleSelectPreset(preset.id)}
                      className={`p-2.5 rounded-xl border text-left cursor-pointer transition relative flex flex-col justify-between ${
                        isSelected
                          ? 'border-amber-400 bg-amber-500/10 text-white shadow-xs'
                          : 'border-slate-800 hover:border-slate-600 bg-slate-950/60 text-slate-300'
                      }`}
                    >
                      <div className="space-y-1">
                        <div className="flex items-center justify-between gap-1">
                          <span className="font-bold text-xs text-white">
                            {preset.name}
                          </span>
                          <span className={`text-[9px] font-bold px-1.5 py-0.2 rounded shrink-0 ${
                            isSelected 
                              ? 'bg-amber-400 text-slate-950' 
                              : 'bg-slate-800 text-slate-300'
                          }`}>
                            {preset.badge}
                          </span>
                        </div>
                        <p className="text-[10px] text-slate-400 line-clamp-2 leading-tight">
                          {preset.description}
                        </p>
                      </div>

                      <div className="mt-2 pt-1.5 border-t border-slate-800/80 flex items-center justify-between text-[10px]">
                        <span className="font-mono text-amber-400/90 font-bold">
                          '08 LED ON
                        </span>
                        {isSelected && (
                          <span className="flex items-center gap-0.5 text-amber-400 font-bold">
                            <Check className="w-3 h-3" />
                            <span>Activo</span>
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 2: DATE STAMP CONFIG */}
          {activeTab === 'datestamp' && (
            <div className="space-y-3 bg-slate-950/70 border border-slate-800 rounded-xl p-3">
              {/* Enable / Disable toggle */}
              <label className="flex items-center justify-between text-xs font-bold text-slate-200 cursor-pointer pb-2 border-b border-slate-800">
                <span className="flex items-center gap-1.5">
                  <Clock className="w-4 h-4 text-amber-400" />
                  <span>Imprimir Sello de Fecha Analógico (LED)</span>
                </span>
                <input
                  type="checkbox"
                  checked={currentConfig.addDateStamp}
                  onChange={e => handleUpdateField('addDateStamp', e.target.checked)}
                  className="w-4 h-4 text-amber-500 rounded focus:ring-amber-400 cursor-pointer"
                />
              </label>

              {currentConfig.addDateStamp ? (
                <div className="space-y-3 pt-1">
                  {/* Date Text Input */}
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-slate-300 block">
                      Texto del sello analógico:
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={currentConfig.dateStampText}
                        onChange={e => handleUpdateField('dateStampText', e.target.value)}
                        placeholder="'08 09 14"
                        className="flex-1 p-2 text-xs font-mono font-bold rounded-lg border border-slate-700 bg-slate-900 text-amber-400 tracking-wider focus:outline-none focus:border-amber-400"
                      />
                    </div>
                  </div>

                  {/* Quick Format Shortcuts */}
                  <div className="space-y-1">
                    <span className="text-[10px] text-slate-400 font-medium block">Formatos rápidos:</span>
                    <div className="flex flex-wrap gap-1.5">
                      <button
                        type="button"
                        onClick={() => handleUpdateField('dateStampText', getDefault2008DateStamp())}
                        className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px] font-mono rounded cursor-pointer transition border border-slate-700"
                      >
                        {getDefault2008DateStamp()} (Hoy '08)
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          const now = new Date();
                          const hh = String(now.getHours()).padStart(2, '0');
                          const mi = String(now.getMinutes()).padStart(2, '0');
                          handleUpdateField('dateStampText', `${getDefault2008DateStamp()} ${hh}:${mi}`);
                        }}
                        className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px] font-mono rounded cursor-pointer transition border border-slate-700"
                      >
                        '08 con Hora
                      </button>

                      {albumEventDate && (
                        <button
                          type="button"
                          onClick={() => handleUpdateField('dateStampText', formatEventDateTo2008(albumEventDate))}
                          className="px-2 py-1 bg-amber-950/70 hover:bg-amber-900/80 text-amber-300 text-[10px] font-mono rounded cursor-pointer transition border border-amber-800/80"
                          title="Fecha del evento asociado"
                        >
                          📅 Fecha de Evento ({formatEventDateTo2008(albumEventDate)})
                        </button>
                      )}
                    </div>
                  </div>

                  {/* LED Color Selection */}
                  <div className="space-y-1.5 pt-1">
                    <label className="text-[11px] font-bold text-slate-300 block">
                      Color del display LED digital:
                    </label>
                    <div className="grid grid-cols-4 gap-1.5">
                      <button
                        type="button"
                        onClick={() => handleUpdateField('dateStampColor', 'amber')}
                        className={`p-1.5 rounded-lg border text-center font-mono font-bold text-[10px] transition cursor-pointer ${
                          currentConfig.dateStampColor === 'amber'
                            ? 'border-amber-400 bg-amber-500/20 text-amber-300'
                            : 'border-slate-800 bg-slate-900 text-amber-500/70'
                        }`}
                      >
                        Ámbar '08
                      </button>

                      <button
                        type="button"
                        onClick={() => handleUpdateField('dateStampColor', 'yellow')}
                        className={`p-1.5 rounded-lg border text-center font-mono font-bold text-[10px] transition cursor-pointer ${
                          currentConfig.dateStampColor === 'yellow'
                            ? 'border-yellow-400 bg-yellow-500/20 text-yellow-300'
                            : 'border-slate-800 bg-slate-900 text-yellow-500/70'
                        }`}
                      >
                        Amarillo
                      </button>

                      <button
                        type="button"
                        onClick={() => handleUpdateField('dateStampColor', 'red')}
                        className={`p-1.5 rounded-lg border text-center font-mono font-bold text-[10px] transition cursor-pointer ${
                          currentConfig.dateStampColor === 'red'
                            ? 'border-red-400 bg-red-500/20 text-red-300'
                            : 'border-slate-800 bg-slate-900 text-red-500/70'
                        }`}
                      >
                        Rojo Neón
                      </button>

                      <button
                        type="button"
                        onClick={() => handleUpdateField('dateStampColor', 'green')}
                        className={`p-1.5 rounded-lg border text-center font-mono font-bold text-[10px] transition cursor-pointer ${
                          currentConfig.dateStampColor === 'green'
                            ? 'border-emerald-400 bg-emerald-500/20 text-emerald-300'
                            : 'border-slate-800 bg-slate-900 text-emerald-500/70'
                        }`}
                      >
                        Verde LCD
                      </button>
                    </div>
                  </div>

                  {/* Position */}
                  <div className="space-y-1 pt-1">
                    <label className="text-[11px] font-bold text-slate-300 block">
                      Posición en la foto:
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => handleUpdateField('dateStampPosition', 'bottom-right')}
                        className={`py-1.5 px-2 rounded-lg border text-xs font-semibold transition cursor-pointer ${
                          currentConfig.dateStampPosition === 'bottom-right'
                            ? 'border-amber-400 bg-amber-500/20 text-white'
                            : 'border-slate-800 bg-slate-900 text-slate-400'
                        }`}
                      >
                        ↘ Inferior Derecha (Clásico)
                      </button>
                      <button
                        type="button"
                        onClick={() => handleUpdateField('dateStampPosition', 'bottom-left')}
                        className={`py-1.5 px-2 rounded-lg border text-xs font-semibold transition cursor-pointer ${
                          currentConfig.dateStampPosition === 'bottom-left'
                            ? 'border-amber-400 bg-amber-500/20 text-white'
                            : 'border-slate-800 bg-slate-900 text-slate-400'
                        }`}
                      >
                        ↙ Inferior Izquierda
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="p-3 text-center text-slate-400 text-xs">
                  Sello de fecha desactivado para esta foto.
                </div>
              )}
            </div>
          )}

          {/* TAB 3: MANUAL FINE TUNING */}
          {activeTab === 'manual' && (
            <div className="space-y-3 bg-slate-950/70 border border-slate-800 rounded-xl p-3 text-xs max-h-[320px] overflow-y-auto pr-1">
              
              {/* Warmth */}
              <div className="space-y-1">
                <div className="flex justify-between text-[11px] font-semibold text-slate-300">
                  <span className="flex items-center gap-1">
                    <Zap className="w-3 h-3 text-amber-400" />
                    <span>Calidez / Flash Fiesta 2008</span>
                  </span>
                  <span className="font-mono text-amber-400">{currentConfig.warmth}</span>
                </div>
                <input
                  type="range"
                  min="-20"
                  max="50"
                  value={currentConfig.warmth}
                  onChange={e => handleUpdateField('warmth', Number(e.target.value))}
                  className="w-full accent-amber-500 cursor-pointer"
                />
              </div>

              {/* Saturation */}
              <div className="space-y-1">
                <div className="flex justify-between text-[11px] font-semibold text-slate-300">
                  <span className="flex items-center gap-1">
                    <Palette className="w-3 h-3 text-pink-400" />
                    <span>Saturación de Color</span>
                  </span>
                  <span className="font-mono text-pink-400">{currentConfig.saturation}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="180"
                  value={currentConfig.saturation}
                  onChange={e => handleUpdateField('saturation', Number(e.target.value))}
                  className="w-full accent-pink-500 cursor-pointer"
                />
              </div>

              {/* Contrast */}
              <div className="space-y-1">
                <div className="flex justify-between text-[11px] font-semibold text-slate-300">
                  <span>Contraste</span>
                  <span className="font-mono text-slate-300">{currentConfig.contrast}%</span>
                </div>
                <input
                  type="range"
                  min="70"
                  max="150"
                  value={currentConfig.contrast}
                  onChange={e => handleUpdateField('contrast', Number(e.target.value))}
                  className="w-full accent-amber-500 cursor-pointer"
                />
              </div>

              {/* Brightness */}
              <div className="space-y-1">
                <div className="flex justify-between text-[11px] font-semibold text-slate-300">
                  <span>Brillo / Exposición</span>
                  <span className="font-mono text-slate-300">{currentConfig.brightness}%</span>
                </div>
                <input
                  type="range"
                  min="70"
                  max="140"
                  value={currentConfig.brightness}
                  onChange={e => handleUpdateField('brightness', Number(e.target.value))}
                  className="w-full accent-amber-500 cursor-pointer"
                />
              </div>

              {/* Toggles: Vignette & Digicam Grain */}
              <div className="pt-2 border-t border-slate-800 space-y-2">
                <label className="flex items-center justify-between text-slate-300 cursor-pointer">
                  <span>Viñeteado de lente compacta</span>
                  <input
                    type="checkbox"
                    checked={currentConfig.vignette}
                    onChange={e => handleUpdateField('vignette', e.target.checked)}
                    className="w-4 h-4 text-amber-500 rounded focus:ring-amber-400 cursor-pointer"
                  />
                </label>

                <label className="flex items-center justify-between text-slate-300 cursor-pointer">
                  <span>Grano de sensor CCD (Ruido analógico ISO)</span>
                  <input
                    type="checkbox"
                    checked={currentConfig.addSensorGrain}
                    onChange={e => handleUpdateField('addSensorGrain', e.target.checked)}
                    className="w-4 h-4 text-amber-500 rounded focus:ring-amber-400 cursor-pointer"
                  />
                </label>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
