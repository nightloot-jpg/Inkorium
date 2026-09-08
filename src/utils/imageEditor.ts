export interface PhotoEditState {
  rotation: number; // 0, 90, 180, 270
  flipH: boolean;
  flipV: boolean;
  filterId: string;
  brightness: number; // 50 to 160, default 100
  contrast: number; // 50 to 160, default 100
  saturation: number; // 0 to 200, default 100
  sepia: number; // 0 to 100, default 0
  grayscale?: number; // 0 to 100, default 0
  hueRotate: number; // -180 to 180, default 0
  addDateStamp: boolean;
  dateStampText?: string;
  vignette: boolean;
  overlayStyle?: 'none' | 'sepia' | 'grayscale' | 'vintage' | 'warm' | 'cool';
}

export interface RetroFilterPreset {
  id: string;
  name: string;
  description: string;
  eraBadge: string;
  brightness: number;
  contrast: number;
  saturation: number;
  sepia: number;
  grayscale?: number;
  hueRotate: number;
  vignette: boolean;
  overlayStyle?: 'none' | 'sepia' | 'grayscale' | 'vintage' | 'warm' | 'cool';
  cssFilter: string;
}

export const RETRO_FILTER_PRESETS: RetroFilterPreset[] = [
  {
    id: 'none',
    name: 'Original',
    description: 'Sin modificaciones de color ni filtros',
    eraBadge: 'Original',
    brightness: 100,
    contrast: 100,
    saturation: 100,
    sepia: 0,
    grayscale: 0,
    hueRotate: 0,
    vignette: false,
    overlayStyle: 'none',
    cssFilter: 'none'
  },
  {
    id: 'sepia',
    name: 'Sepia',
    description: 'Tono marrón cálido y nostálgico vintage de los 2000s',
    eraBadge: 'Sepia',
    brightness: 98,
    contrast: 105,
    saturation: 85,
    sepia: 85,
    grayscale: 0,
    hueRotate: 0,
    vignette: false,
    overlayStyle: 'sepia',
    cssFilter: 'brightness(0.98) contrast(1.05) saturate(0.85) sepia(0.85)'
  },
  {
    id: 'grayscale',
    name: 'Grayscale',
    description: 'Escala de grises pura con contraste fotográfico B&N clásico',
    eraBadge: 'B&N',
    brightness: 102,
    contrast: 125,
    saturation: 0,
    sepia: 0,
    grayscale: 100,
    hueRotate: 0,
    vignette: false,
    overlayStyle: 'grayscale',
    cssFilter: 'brightness(1.02) contrast(1.25) grayscale(1)'
  },
  {
    id: 'vintage',
    name: 'Vintage',
    description: 'Estilo analógico retro con calidez, saturación y viñeteado',
    eraBadge: 'Vintage',
    brightness: 106,
    contrast: 115,
    saturation: 118,
    sepia: 36,
    grayscale: 0,
    hueRotate: -6,
    vignette: true,
    overlayStyle: 'vintage',
    cssFilter: 'brightness(1.06) contrast(1.15) saturate(1.18) sepia(0.36) hue-rotate(-6deg)'
  },
  {
    id: 'tuenti_2008',
    name: 'Tuenti 2008',
    description: 'Tonos cálidos y saturación digital clásica',
    eraBadge: 'Nostálgico',
    brightness: 106,
    contrast: 112,
    saturation: 120,
    sepia: 18,
    grayscale: 0,
    hueRotate: -8,
    vignette: false,
    overlayStyle: 'none',
    cssFilter: 'brightness(1.06) contrast(1.12) saturate(1.2) sepia(0.18) hue-rotate(-8deg)'
  },
  {
    id: 'digicam_flash',
    name: 'Digicam Flash',
    description: 'Exposición viva con flash de cámara compacta',
    eraBadge: 'Y2K Flash',
    brightness: 116,
    contrast: 124,
    saturation: 132,
    sepia: 4,
    grayscale: 0,
    hueRotate: 0,
    vignette: true,
    overlayStyle: 'none',
    cssFilter: 'brightness(1.16) contrast(1.24) saturate(1.32) sepia(0.04)'
  },
  {
    id: 'golden_hour',
    name: 'Golden Hour',
    description: 'Colores dorados veraniegos de vacaciones en la costa',
    eraBadge: 'Verano',
    brightness: 108,
    contrast: 108,
    saturation: 135,
    sepia: 32,
    grayscale: 0,
    hueRotate: -14,
    vignette: false,
    overlayStyle: 'warm',
    cssFilter: 'brightness(1.08) contrast(1.08) saturate(1.35) sepia(0.32) hue-rotate(-14deg)'
  },
  {
    id: 'lomo_retro',
    name: 'Lomo ToyCam',
    description: 'Colores vivos y viñeteado pronunciado',
    eraBadge: 'Lomography',
    brightness: 100,
    contrast: 138,
    saturation: 145,
    sepia: 12,
    grayscale: 0,
    hueRotate: 5,
    vignette: true,
    overlayStyle: 'none',
    cssFilter: 'brightness(1.0) contrast(1.38) saturate(1.45) sepia(0.12) hue-rotate(5deg)'
  },
  {
    id: 'emo_scene',
    name: 'Emo / Scene',
    description: 'Tonos fríos azulados, sombras marcadas y toque oscuro',
    eraBadge: '2009 Scene',
    brightness: 94,
    contrast: 128,
    saturation: 75,
    sepia: 12,
    grayscale: 0,
    hueRotate: 160,
    vignette: true,
    overlayStyle: 'cool',
    cssFilter: 'brightness(0.94) contrast(1.28) saturate(0.75) sepia(0.12) hue-rotate(160deg)'
  },
  // Aliases for backwards compatibility with any persisted photos
  {
    id: 'vintage_sepia',
    name: 'Sepia Fotolog',
    description: 'Tono marrón nostálgico vintage de los 2000s',
    eraBadge: 'Sepia',
    brightness: 98,
    contrast: 105,
    saturation: 85,
    sepia: 85,
    grayscale: 0,
    hueRotate: 0,
    vignette: false,
    overlayStyle: 'sepia',
    cssFilter: 'brightness(0.98) contrast(1.05) saturate(0.85) sepia(0.85)'
  },
  {
    id: 'bw_contrast',
    name: 'B&N Dramático',
    description: 'Blanco y negro con sombras profundas y contraste',
    eraBadge: 'B&N',
    brightness: 102,
    contrast: 125,
    saturation: 0,
    sepia: 0,
    grayscale: 100,
    hueRotate: 0,
    vignette: true,
    overlayStyle: 'grayscale',
    cssFilter: 'brightness(1.02) contrast(1.25) grayscale(1)'
  }
];

export const DEFAULT_EDIT_STATE: PhotoEditState = {
  rotation: 0,
  flipH: false,
  flipV: false,
  filterId: 'none',
  brightness: 100,
  contrast: 100,
  saturation: 100,
  sepia: 0,
  grayscale: 0,
  hueRotate: 0,
  addDateStamp: false,
  dateStampText: "'08 09 14",
  vignette: false,
  overlayStyle: 'none'
};

/**
 * Computes CSS filter string based on edit state
 */
export function getCssFilterString(state: PhotoEditState): string {
  const parts: string[] = [];
  if (state.brightness !== 100) parts.push(`brightness(${state.brightness / 100})`);
  if (state.contrast !== 100) parts.push(`contrast(${state.contrast / 100})`);
  if (state.saturation !== 100) parts.push(`saturate(${state.saturation / 100})`);
  if (state.grayscale && state.grayscale > 0) parts.push(`grayscale(${state.grayscale / 100})`);
  if (state.sepia > 0) parts.push(`sepia(${state.sepia / 100})`);
  if (state.hueRotate !== 0) parts.push(`hue-rotate(${state.hueRotate}deg)`);
  return parts.length > 0 ? parts.join(' ') : 'none';
}

/**
 * Computes CSS transform string for preview
 */
export function getCssTransformString(state: PhotoEditState): string {
  const transforms: string[] = [];
  if (state.rotation !== 0) transforms.push(`rotate(${state.rotation}deg)`);
  if (state.flipH || state.flipV) {
    transforms.push(`scale(${state.flipH ? -1 : 1}, ${state.flipV ? -1 : 1})`);
  }
  return transforms.length > 0 ? transforms.join(' ') : 'none';
}

/**
 * Bakes all edits (rotation, flips, filters, vignette, date stamp) onto an HTML5 Canvas
 * and returns the resulting JPEG data URL string.
 */
export async function bakeEditedImage(imageUrl: string, state: PhotoEditState): Promise<string> {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';

    img.onload = () => {
      try {
        const isRotated90or270 = state.rotation === 90 || state.rotation === 270;
        const width = isRotated90or270 ? img.naturalHeight : img.naturalWidth;
        const height = isRotated90or270 ? img.naturalWidth : img.naturalHeight;

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');

        if (!ctx) {
          resolve(imageUrl);
          return;
        }

        // Apply filters directly to canvas context
        const filterStr = getCssFilterString(state);
        if (filterStr !== 'none') {
          ctx.filter = filterStr;
        }

        ctx.save();
        // Move origin to center for rotation and flipping
        ctx.translate(width / 2, height / 2);
        if (state.rotation !== 0) {
          ctx.rotate((state.rotation * Math.PI) / 180);
        }
        if (state.flipH || state.flipV) {
          ctx.scale(state.flipH ? -1 : 1, state.flipV ? -1 : 1);
        }

        // Draw original image centered
        ctx.drawImage(
          img,
          -img.naturalWidth / 2,
          -img.naturalHeight / 2,
          img.naturalWidth,
          img.naturalHeight
        );
        ctx.restore();

        // Turn off filter for overlays
        ctx.filter = 'none';

        // Draw CSS-based filter overlay blends if active
        if (state.overlayStyle === 'sepia') {
          ctx.save();
          ctx.globalCompositeOperation = 'color';
          ctx.fillStyle = 'rgba(112, 66, 20, 0.16)';
          ctx.fillRect(0, 0, width, height);
          ctx.restore();
        } else if (state.overlayStyle === 'vintage') {
          ctx.save();
          ctx.globalCompositeOperation = 'soft-light';
          const grad = ctx.createLinearGradient(0, 0, width, height);
          grad.addColorStop(0, 'rgba(245, 180, 100, 0.22)');
          grad.addColorStop(0.5, 'rgba(0, 0, 0, 0)');
          grad.addColorStop(1, 'rgba(120, 60, 20, 0.26)');
          ctx.fillStyle = grad;
          ctx.fillRect(0, 0, width, height);
          ctx.restore();
        } else if (state.overlayStyle === 'warm') {
          ctx.save();
          ctx.globalCompositeOperation = 'soft-light';
          ctx.fillStyle = 'rgba(255, 160, 40, 0.15)';
          ctx.fillRect(0, 0, width, height);
          ctx.restore();
        } else if (state.overlayStyle === 'cool') {
          ctx.save();
          ctx.globalCompositeOperation = 'soft-light';
          ctx.fillStyle = 'rgba(0, 150, 220, 0.15)';
          ctx.fillRect(0, 0, width, height);
          ctx.restore();
        }

        // Draw Vignette if active
        if (state.vignette) {
          const radius = Math.max(width, height) * 0.75;
          const gradient = ctx.createRadialGradient(
            width / 2,
            height / 2,
            radius * 0.45,
            width / 2,
            height / 2,
            radius
          );
          gradient.addColorStop(0, 'rgba(0, 0, 0, 0)');
          gradient.addColorStop(0.75, 'rgba(0, 0, 0, 0.28)');
          gradient.addColorStop(1, 'rgba(0, 0, 0, 0.65)');

          ctx.fillStyle = gradient;
          ctx.fillRect(0, 0, width, height);
        }

        // Draw Retro LED Digital Camera Date Stamp
        if (state.addDateStamp) {
          const fontSize = Math.max(14, Math.round(height * 0.04));
          const dateText = state.dateStampText || "'08 09 14";
          
          ctx.save();
          ctx.font = `bold ${fontSize}px "Courier New", monospace, sans-serif`;
          ctx.textAlign = 'right';
          ctx.textBaseline = 'bottom';
          
          const paddingX = Math.round(width * 0.04);
          const paddingY = Math.round(height * 0.04);

          // Subtle shadow / glow for digital camera LED
          ctx.shadowColor = 'rgba(255, 100, 0, 0.8)';
          ctx.shadowBlur = Math.round(fontSize * 0.35);
          ctx.fillStyle = '#ff7b00'; // Classic digital camera amber/orange
          ctx.fillText(dateText, width - paddingX, height - paddingY);

          // Secondary crisp pass
          ctx.shadowBlur = 0;
          ctx.fillStyle = '#ff9900';
          ctx.fillText(dateText, width - paddingX, height - paddingY);
          ctx.restore();
        }

        const dataUrl = canvas.toDataURL('image/jpeg', 0.92);
        resolve(dataUrl);
      } catch (err) {
        console.warn('Canvas export fallback:', err);
        resolve(imageUrl);
      }
    };

    img.onerror = () => {
      // In case of CORS error on external images, resolve directly
      resolve(imageUrl);
    };

    img.src = imageUrl;
  });
}

export interface Camera2008Config {
  presetId: string;
  brightness: number; // 70 to 140
  contrast: number; // 70 to 150
  saturation: number; // 0 to 180
  warmth: number; // -30 to 50
  vignette: boolean;
  addDateStamp: boolean;
  dateStampText: string;
  dateStampColor: 'amber' | 'yellow' | 'red' | 'green';
  dateStampPosition: 'bottom-right' | 'bottom-left';
  addSensorGrain: boolean;
}

export interface Camera2008Preset {
  id: string;
  name: string;
  badge: string;
  description: string;
  config: Omit<Camera2008Config, 'presetId' | 'dateStampText'>;
}

export const CAMERA_2008_PRESETS: Camera2008Preset[] = [
  {
    id: 'tuenti_party',
    name: 'Tuenti Fiesta 2008',
    badge: '★ Más Clásico',
    description: 'Tonos cálidos y saturación viva típicos de las fotos de fin de semana en 2008',
    config: {
      brightness: 106,
      contrast: 114,
      saturation: 122,
      warmth: 18,
      vignette: true,
      addDateStamp: true,
      dateStampColor: 'amber',
      dateStampPosition: 'bottom-right',
      addSensorGrain: true
    }
  },
  {
    id: 'cybershot_5mp',
    name: 'Cyber-shot 5.0 MP Flash',
    badge: 'Compacta Y2K',
    description: 'Luz directa de flash de cámara de bolsillo, nitidez central y sombras suaves',
    config: {
      brightness: 114,
      contrast: 122,
      saturation: 128,
      warmth: 6,
      vignette: true,
      addDateStamp: true,
      dateStampColor: 'amber',
      dateStampPosition: 'bottom-right',
      addSensorGrain: true
    }
  },
  {
    id: 'discoteca_flash',
    name: 'Discoteca & Noche',
    badge: 'Clubbing',
    description: 'Fondo oscuro con caída de luz y resplandor directo sobre los amigos',
    config: {
      brightness: 102,
      contrast: 130,
      saturation: 135,
      warmth: 12,
      vignette: true,
      addDateStamp: true,
      dateStampColor: 'amber',
      dateStampPosition: 'bottom-right',
      addSensorGrain: true
    }
  },
  {
    id: 'lomography_retro',
    name: 'Lomografía ToyCam',
    badge: 'Lomo Retro',
    description: 'Viñeteado pronunciado, colores cruzados y calidez analógica',
    config: {
      brightness: 100,
      contrast: 136,
      saturation: 142,
      warmth: 32,
      vignette: true,
      addDateStamp: true,
      dateStampColor: 'yellow',
      dateStampPosition: 'bottom-right',
      addSensorGrain: false
    }
  },
  {
    id: 'nostalgia_sepia',
    name: 'Sepia Nostalgia',
    badge: 'Vintage 2000s',
    description: 'Tono marrón suave de álbum nostálgico con fecha LED naranja',
    config: {
      brightness: 98,
      contrast: 108,
      saturation: 85,
      warmth: 48,
      vignette: true,
      addDateStamp: true,
      dateStampColor: 'amber',
      dateStampPosition: 'bottom-right',
      addSensorGrain: true
    }
  },
  {
    id: 'fotolog_bw',
    name: 'B&N Fotolog',
    badge: 'Monocromo',
    description: 'Blanco y negro contrastado con sello de fecha digital naranja fluorescente',
    config: {
      brightness: 104,
      contrast: 132,
      saturation: 0,
      warmth: 0,
      vignette: true,
      addDateStamp: true,
      dateStampColor: 'amber',
      dateStampPosition: 'bottom-right',
      addSensorGrain: true
    }
  },
  {
    id: 'verano_costa',
    name: 'Verano & Costa 2008',
    badge: 'Golden Sun',
    description: 'Luz dorada de atardecer en la playa con calidez intensa',
    config: {
      brightness: 108,
      contrast: 110,
      saturation: 138,
      warmth: 36,
      vignette: false,
      addDateStamp: true,
      dateStampColor: 'yellow',
      dateStampPosition: 'bottom-right',
      addSensorGrain: false
    }
  }
];

export const DEFAULT_CAMERA_2008_CONFIG: Camera2008Config = {
  presetId: 'tuenti_party',
  brightness: 106,
  contrast: 114,
  saturation: 122,
  warmth: 18,
  vignette: true,
  addDateStamp: true,
  dateStampText: "'08 09 14",
  dateStampColor: 'amber',
  dateStampPosition: 'bottom-right',
  addSensorGrain: true
};

/**
 * Generates the default 2008 retro date stamp string (e.g. '08 09 14)
 */
export function getDefault2008DateStamp(): string {
  const now = new Date();
  const mm = String(now.getMonth() + 1).padStart(2, '0');
  const dd = String(now.getDate()).padStart(2, '0');
  return `'08 ${mm} ${dd}`;
}

/**
 * Renders the 2008 Camera effects onto an HTML5 Canvas context
 */
export function render2008CameraToCanvas(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement | HTMLCanvasElement,
  width: number,
  height: number,
  config: Camera2008Config
): void {
  // 1. Base filter setup
  const filters: string[] = [];
  if (config.brightness !== 100) filters.push(`brightness(${config.brightness / 100})`);
  if (config.contrast !== 100) filters.push(`contrast(${config.contrast / 100})`);
  if (config.saturation !== 100) filters.push(`saturate(${config.saturation / 100})`);
  if (config.warmth > 0) {
    filters.push(`sepia(${Math.min(100, config.warmth * 1.5) / 100})`);
    filters.push(`hue-rotate(-${Math.round(config.warmth * 0.4)}deg)`);
  } else if (config.warmth < 0) {
    filters.push(`hue-rotate(${Math.round(Math.abs(config.warmth) * 2)}deg)`);
  }

  ctx.filter = filters.length > 0 ? filters.join(' ') : 'none';
  ctx.drawImage(img, 0, 0, width, height);
  ctx.filter = 'none';

  // 2. Warm 2008 flash overlay
  if (config.warmth > 10) {
    ctx.save();
    ctx.globalCompositeOperation = 'soft-light';
    ctx.fillStyle = `rgba(255, 170, 50, ${Math.min(0.25, config.warmth / 140)})`;
    ctx.fillRect(0, 0, width, height);
    ctx.restore();
  }

  // 3. Vignette
  if (config.vignette) {
    ctx.save();
    const radius = Math.max(width, height) * 0.72;
    const gradient = ctx.createRadialGradient(
      width / 2,
      height / 2,
      radius * 0.42,
      width / 2,
      height / 2,
      radius
    );
    gradient.addColorStop(0, 'rgba(0, 0, 0, 0)');
    gradient.addColorStop(0.7, 'rgba(0, 0, 0, 0.22)');
    gradient.addColorStop(1, 'rgba(0, 0, 0, 0.62)');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);
    ctx.restore();
  }

  // 4. Subtle Digicam sensor grain
  if (config.addSensorGrain) {
    ctx.save();
    const grainCanvas = document.createElement('canvas');
    grainCanvas.width = Math.min(256, width);
    grainCanvas.height = Math.min(256, height);
    const gCtx = grainCanvas.getContext('2d');
    if (gCtx) {
      const gImgData = gCtx.createImageData(grainCanvas.width, grainCanvas.height);
      const data = gImgData.data;
      for (let i = 0; i < data.length; i += 4) {
        const val = (Math.random() - 0.5) * 45;
        data[i] = 128 + val;     // R
        data[i + 1] = 128 + val; // G
        data[i + 2] = 128 + val; // B
        data[i + 3] = 18;        // Alpha
      }
      gCtx.putImageData(gImgData, 0, 0);

      ctx.globalCompositeOperation = 'overlay';
      const pattern = ctx.createPattern(grainCanvas, 'repeat');
      if (pattern) {
        ctx.fillStyle = pattern;
        ctx.fillRect(0, 0, width, height);
      }
    }
    ctx.restore();
  }

  // 5. Analog LED Digital Camera Date Stamp
  if (config.addDateStamp && config.dateStampText) {
    ctx.save();
    const fontSize = Math.max(14, Math.round(height * 0.042));
    const paddingX = Math.round(width * 0.04);
    const paddingY = Math.round(height * 0.04);

    ctx.font = `bold ${fontSize}px "Courier New", "Consolas", monospace, sans-serif`;
    ctx.textBaseline = 'bottom';

    let posX = width - paddingX;
    if (config.dateStampPosition === 'bottom-left') {
      ctx.textAlign = 'left';
      posX = paddingX;
    } else {
      ctx.textAlign = 'right';
      posX = width - paddingX;
    }

    const posY = height - paddingY;

    // Color schemes for digital camera LED
    let glowColor = 'rgba(255, 110, 0, 0.85)';
    let primaryColor = '#ff7b00';
    let highlightColor = '#ff9900';

    if (config.dateStampColor === 'yellow') {
      glowColor = 'rgba(255, 230, 0, 0.85)';
      primaryColor = '#ffd000';
      highlightColor = '#ffea50';
    } else if (config.dateStampColor === 'red') {
      glowColor = 'rgba(255, 30, 0, 0.85)';
      primaryColor = '#ff2200';
      highlightColor = '#ff4422';
    } else if (config.dateStampColor === 'green') {
      glowColor = 'rgba(0, 255, 90, 0.85)';
      primaryColor = '#00dd55';
      highlightColor = '#33ff77';
    }

    // Pass 1: Dark drop shadow outline for high contrast on light backgrounds
    ctx.shadowColor = 'rgba(0, 0, 0, 0.9)';
    ctx.shadowBlur = Math.round(fontSize * 0.4);
    ctx.fillStyle = 'rgba(0, 0, 0, 0.85)';
    ctx.fillText(config.dateStampText, posX + 1, posY + 1);

    // Pass 2: LED glowing aura
    ctx.shadowColor = glowColor;
    ctx.shadowBlur = Math.round(fontSize * 0.45);
    ctx.fillStyle = primaryColor;
    ctx.fillText(config.dateStampText, posX, posY);

    // Pass 3: Crisp LED core
    ctx.shadowBlur = 0;
    ctx.fillStyle = highlightColor;
    ctx.fillText(config.dateStampText, posX, posY);

    ctx.restore();
  }
}

/**
 * Bakes the 2008 camera effects into a new JPEG data URL via HTML5 Canvas
 */
export async function bakeCamera2008Image(imageUrl: string, config: Camera2008Config): Promise<string> {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';

    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = img.naturalWidth || img.width;
        canvas.height = img.naturalHeight || img.height;
        const ctx = canvas.getContext('2d');

        if (!ctx) {
          resolve(imageUrl);
          return;
        }

        render2008CameraToCanvas(ctx, img, canvas.width, canvas.height, config);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.92);
        resolve(dataUrl);
      } catch (err) {
        console.warn('Camera 2008 bake fallback:', err);
        resolve(imageUrl);
      }
    };

    img.onerror = () => {
      resolve(imageUrl);
    };

    img.src = imageUrl;
  });
}

