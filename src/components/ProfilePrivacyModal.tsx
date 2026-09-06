import React from 'react';
import { X, Shield } from 'lucide-react';
import { ProfilePrivacySettingsSection } from './ProfilePrivacySettingsSection';

interface ProfilePrivacyModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ProfilePrivacyModal: React.FC<ProfilePrivacyModalProps> = ({
  isOpen,
  onClose
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div 
        className="bg-white dark:bg-[#0e1726] rounded-lg shadow-2xl border border-[#ccd5df] dark:border-gray-700 w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="bg-[#3869A0] text-white px-4 py-3 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-2 font-bold text-sm">
            <Shield className="w-4 h-4 text-blue-200" />
            <span>Configuración de Privacidad del Perfil</span>
          </div>
          <button
            onClick={onClose}
            className="text-white/80 hover:text-white p-1 hover:bg-white/10 rounded transition cursor-pointer"
            title="Cerrar ventana"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-4 overflow-y-auto flex-1 text-xs">
          <ProfilePrivacySettingsSection onSaved={onClose} compactMode={false} />
        </div>
      </div>
    </div>
  );
};
