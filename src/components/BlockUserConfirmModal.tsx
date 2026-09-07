import React, { useEffect } from 'react';
import { Ban, ShieldAlert, X, HeartCrack, EyeOff, MessageSquareOff, UserX } from 'lucide-react';
import type { User } from '../types';

interface BlockUserConfirmModalProps {
  isOpen: boolean;
  targetUser: User | null;
  onClose: () => void;
  onConfirm: () => void;
}

export const BlockUserConfirmModal: React.FC<BlockUserConfirmModalProps> = ({
  isOpen,
  targetUser,
  onClose,
  onConfirm
}) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !targetUser) return null;

  const displayName = targetUser.full_name || 
    `${targetUser.nombre || ''} ${targetUser.apellidos || ''}`.trim() || 
    targetUser.username || 
    targetUser.nombre || 
    'este usuario';

  return (
    <div 
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="block-modal-title"
    >
      <div 
        className="bg-white dark:bg-slate-900 w-full max-w-md rounded-xl border border-rose-200 dark:border-rose-900/60 shadow-2xl overflow-hidden animate-scale-up"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-rose-500 to-rose-600 px-5 py-4 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center shrink-0">
              <Ban className="w-4 h-4 text-white" />
            </div>
            <div>
              <h3 id="block-modal-title" className="font-bold text-sm sm:text-base leading-tight">
                ¿Bloquear a {targetUser.nombre || 'usuario'}?
              </h3>
              <p className="text-[11px] text-rose-100 font-normal">
                @{targetUser.username || targetUser.id}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-md text-white/80 hover:text-white hover:bg-white/10 transition cursor-pointer"
            aria-label="Cerrar modal"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body Content */}
        <div className="p-5 space-y-4 text-xs text-gray-700 dark:text-gray-200">
          {/* User Preview Banner */}
          <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-slate-800/60 border border-gray-200 dark:border-slate-700 rounded-lg">
            <img 
              src={targetUser.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'} 
              alt={displayName} 
              className="w-10 h-10 rounded-full object-cover border border-gray-300 dark:border-slate-600 shrink-0" 
            />
            <div className="min-w-0 flex-1">
              <p className="font-bold text-gray-900 dark:text-white text-xs truncate">
                {displayName}
              </p>
              <p className="text-[11px] text-gray-500 dark:text-gray-400 truncate">
                {targetUser.provincia ? `${targetUser.provincia}, España` : 'Inkorium'}
              </p>
            </div>
          </div>

          {/* Implications warning list */}
          <div className="space-y-2">
            <p className="font-semibold text-gray-900 dark:text-white text-xs flex items-center gap-1.5">
              <ShieldAlert className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400 shrink-0" />
              Al bloquear a este usuario ocurrirá lo siguiente:
            </p>

            <ul className="space-y-2 pl-1 text-[11.5px] leading-snug">
              <li className="flex items-start gap-2 text-gray-600 dark:text-gray-300">
                <EyeOff className="w-3.5 h-3.5 text-rose-500 shrink-0 mt-0.5" />
                <span>
                  <strong>Feed principal:</strong> Se eliminarán y ocultarán automáticamente sus publicaciones, fotos y comentarios.
                </span>
              </li>
              <li className="flex items-start gap-2 text-gray-600 dark:text-gray-300">
                <MessageSquareOff className="w-3.5 h-3.5 text-rose-500 shrink-0 mt-0.5" />
                <span>
                  <strong>Tablón de firmas:</strong> No podrá firmar ni comentar en tu tablón, y sus firmas previas quedarán ocultas.
                </span>
              </li>
              <li className="flex items-start gap-2 text-gray-600 dark:text-gray-300">
                <HeartCrack className="w-3.5 h-3.5 text-rose-500 shrink-0 mt-0.5" />
                <span>
                  <strong>Amistades y solicitudes:</strong> Se cancelará la amistad inmediatamente y se descartarán solicitudes mutuas.
                </span>
              </li>
              <li className="flex items-start gap-2 text-gray-600 dark:text-gray-300">
                <UserX className="w-3.5 h-3.5 text-rose-500 shrink-0 mt-0.5" />
                <span>
                  <strong>Mensajería y Chat:</strong> Se cerrarán las conversaciones activas y no podrá enviarte chats, zumbidos ni mensajes privados.
                </span>
              </li>
            </ul>
          </div>

          <div className="p-2.5 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 rounded-lg text-[11px] text-rose-800 dark:text-rose-300 leading-tight">
            ℹ️ Podrás desbloquear a {targetUser.nombre || 'este usuario'} en cualquier momento desde su perfil o en <strong>Ajustes &gt; Usuarios bloqueados</strong>.
          </div>
        </div>

        {/* Footer actions */}
        <div className="px-5 py-3.5 bg-gray-50 dark:bg-slate-800/80 border-t border-gray-200 dark:border-slate-800 flex items-center justify-end gap-2.5">
          <button
            type="button"
            onClick={onClose}
            className="px-3.5 py-1.5 rounded-lg border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-700 font-semibold text-xs transition cursor-pointer"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={() => {
              onConfirm();
              onClose();
            }}
            className="px-4 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-xs transition cursor-pointer"
          >
            <Ban className="w-3.5 h-3.5" />
            <span>Bloquear usuario</span>
          </button>
        </div>
      </div>
    </div>
  );
};
