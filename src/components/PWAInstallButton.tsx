import React, { useState } from 'react';
import { Smartphone, Download, X, Share } from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';

interface PWAInstallButtonProps {
  variant?: 'nav' | 'banner' | 'menu';
}

export const PWAInstallButton: React.FC<PWAInstallButtonProps> = ({ variant = 'nav' }) => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showIOSGuide, setShowIOSGuide] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);

  // If already running as an installed PWA or dismissed, don't show intrusive banner
  if (isInstalled || isDismissed) {
    return null;
  }

  const handleClick = () => {
    if (isInstallable) {
      install();
    } else if (isIOS) {
      setShowIOSGuide(true);
    } else {
      // Fallback instruction for browsers without beforeinstallprompt
      setShowIOSGuide(true);
    }
  };

  if (variant === 'menu') {
    return (
      <>
        <button
          onClick={handleClick}
          className="w-full text-left px-3 py-2 hover:bg-blue-50 dark:hover:bg-slate-700 flex items-center justify-between cursor-pointer font-medium text-emerald-700 dark:text-emerald-400"
        >
          <div className="flex items-center gap-2">
            <Smartphone className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <span>Instalar App en el móvil</span>
          </div>
          <span className="text-[10px] bg-emerald-100 dark:bg-emerald-900/50 text-emerald-800 dark:text-emerald-300 font-bold px-1.5 py-0.5 rounded">
            PWA
          </span>
        </button>

        {showIOSGuide && (
          <IOSInstallModal onClose={() => setShowIOSGuide(false)} />
        )}
      </>
    );
  }

  if (variant === 'banner') {
    return (
      <>
        <div className="p-3 bg-gradient-to-r from-blue-50 to-emerald-50 dark:from-slate-800 dark:to-slate-800 border border-blue-200 dark:border-slate-700 rounded-lg shadow-xs flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="p-2 bg-[#3869A0] text-white rounded-lg shrink-0">
              <Smartphone className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <h4 className="text-xs font-bold text-gray-900 dark:text-white truncate">
                Lleva Inkorium en tu bolsillo
              </h4>
              <p className="text-[11px] text-gray-600 dark:text-gray-300 truncate">
                Instala la app en tu teléfono con notificaciones y zumbidos
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            <button
              onClick={handleClick}
              className="px-3 py-1.5 bg-[#3869A0] hover:bg-[#2e5785] text-white text-xs font-bold rounded-md shadow-xs flex items-center gap-1.5 cursor-pointer transition"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Instalar</span>
            </button>
            <button
              onClick={() => setIsDismissed(true)}
              className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 cursor-pointer"
              title="Cerrar aviso"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {showIOSGuide && (
          <IOSInstallModal onClose={() => setShowIOSGuide(false)} />
        )}
      </>
    );
  }

  // Navbar button default
  return (
    <>
      <button
        onClick={handleClick}
        className="px-2 py-1 rounded bg-[#294e77] hover:bg-[#1f3f63] text-emerald-300 hover:text-emerald-200 transition cursor-pointer flex items-center gap-1.5 text-xs font-bold border border-emerald-400/40 shadow-xs"
        title="Instalar Inkorium en la pantalla de inicio de tu móvil"
      >
        <Smartphone className="w-3.5 h-3.5 text-emerald-300" />
        <span className="hidden lg:inline">Instalar App</span>
      </button>

      {showIOSGuide && (
        <IOSInstallModal onClose={() => setShowIOSGuide(false)} />
      )}
    </>
  );
};

const IOSInstallModal: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="w-full max-w-sm rounded-xl bg-white p-5 shadow-2xl dark:bg-slate-900 border border-gray-200 dark:border-slate-800 text-left">
        <div className="flex items-center justify-between border-b pb-3 border-gray-100 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-[#3869A0] flex items-center justify-center text-white font-bold">
              :)
            </div>
            <div>
              <h3 className="text-sm font-bold text-gray-900 dark:text-white">
                Instalar Inkorium en tu teléfono
              </h3>
              <p className="text-[11px] text-gray-500 dark:text-gray-400">
                PWA para iPhone, iPad o Android
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-md text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="mt-4 space-y-3 text-xs text-gray-700 dark:text-gray-300">
          <div className="flex items-start gap-2.5 p-2 rounded bg-gray-50 dark:bg-slate-800/60 border border-gray-100 dark:border-slate-700">
            <span className="font-bold text-[#3869A0] bg-blue-100 dark:bg-blue-950 px-1.5 py-0.5 rounded text-[11px]">
              1
            </span>
            <span>
              Pulsa el botón de <strong>Compartir</strong> en la barra de Safari o el menú de <strong>tres puntos</strong> en Chrome.
              <Share className="inline-block w-3.5 h-3.5 ml-1 text-blue-600 dark:text-blue-400" />
            </span>
          </div>

          <div className="flex items-start gap-2.5 p-2 rounded bg-gray-50 dark:bg-slate-800/60 border border-gray-100 dark:border-slate-700">
            <span className="font-bold text-[#3869A0] bg-blue-100 dark:bg-blue-950 px-1.5 py-0.5 rounded text-[11px]">
              2
            </span>
            <span>
              Desliza hacia abajo y selecciona <strong>«Añadir a la pantalla de inicio»</strong> o <strong>«Instalar aplicación»</strong>.
            </span>
          </div>

          <div className="flex items-start gap-2.5 p-2 rounded bg-gray-50 dark:bg-slate-800/60 border border-gray-100 dark:border-slate-700">
            <span className="font-bold text-emerald-600 bg-emerald-100 dark:bg-emerald-950 px-1.5 py-0.5 rounded text-[11px]">
              3
            </span>
            <span>
              ¡Listo! Se abrirá a pantalla completa como una aplicación nativa, con chat y zumbidos en tiempo real.
            </span>
          </div>
        </div>

        <button
          onClick={onClose}
          className="mt-5 w-full rounded-lg bg-[#3869A0] hover:bg-[#2e5785] py-2 text-xs font-bold text-white transition cursor-pointer"
        >
          Entendido
        </button>
      </div>
    </div>
  );
};
