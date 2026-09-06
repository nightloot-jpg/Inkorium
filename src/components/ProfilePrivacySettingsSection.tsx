import React, { useState, useEffect } from 'react';
import { useInkorium } from '../context/InkoriumContext';
import { 
  Shield, Lock, Globe, Users, Camera, MessageSquare, 
  Check, Save, Eye, Sparkles, AlertCircle, Info, RefreshCw, Star
} from 'lucide-react';
import type { ProfilePrivacySettings, PrivacyAudience } from '../types';
import { DEFAULT_PROFILE_PRIVACY } from '../types';
import { getProfilePrivacy, calculatePrivacyLevel } from '../utils/privacy';

interface ProfilePrivacySettingsSectionProps {
  onSaved?: () => void;
  compactMode?: boolean;
}

export const ProfilePrivacySettingsSection: React.FC<ProfilePrivacySettingsSectionProps> = ({
  onSaved,
  compactMode = false
}) => {
  const { currentUser, updateUserData, pushNotification, setActiveTab, viewUserProfile } = useInkorium();

  // Local form state initialized from current user or defaults
  const [privacy, setPrivacy] = useState<ProfilePrivacySettings>(() => getProfilePrivacy(currentUser));
  const [isSaving, setIsSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  // Sync state if currentUser changes from external update
  useEffect(() => {
    const current = getProfilePrivacy(currentUser);
    setPrivacy(current);
    setHasChanges(false);
  }, [currentUser.id]);

  const updateSetting = <K extends keyof ProfilePrivacySettings>(
    key: K, 
    value: ProfilePrivacySettings[K]
  ) => {
    setPrivacy(prev => {
      const next = { ...prev, [key]: value };
      setHasChanges(true);
      return next;
    });
    setSavedSuccess(false);
  };

  const handleSave = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setIsSaving(true);

    try {
      // Save directly to user object via context and local persistence
      updateUserData({
        privacidadPerfil: privacy
      });

      // Visual feedback
      setSavedSuccess(true);
      setHasChanges(false);

      pushNotification({
        id: `priv_${Date.now()}`,
        userId: currentUser.id,
        fromUserId: 'system',
        fromUserName: 'Inkorium',
        tipo: 'sistema',
        mensaje: 'La configuración de privacidad de tu perfil ha sido guardada con éxito.',
        fecha: 'Ahora',
        leido: false
      });

      if (onSaved) {
        onSaved();
      }

      setTimeout(() => {
        setSavedSuccess(false);
      }, 4000);
    } catch (err) {
      console.error('Error saving privacy settings:', err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleResetDefaults = () => {
    setPrivacy({ ...DEFAULT_PROFILE_PRIVACY });
    setHasChanges(true);
    setSavedSuccess(false);
  };

  const privacyLevel = calculatePrivacyLevel(privacy);

  return (
    <div className={`space-y-5 text-gray-800 dark:text-gray-200 ${compactMode ? 'p-1' : ''}`}>
      {/* Header Banner */}
      {!compactMode && (
        <div className="border-b border-[#ccd5df] dark:border-gray-700 pb-3">
          <div className="flex items-start justify-between flex-wrap gap-2">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded bg-blue-50 dark:bg-blue-950/60 text-[#3869A0] dark:text-blue-400 border border-blue-200/60 dark:border-blue-900">
                <Shield className="w-5 h-5" />
              </div>
              <div>
                <h2 className="font-bold text-base text-gray-900 dark:text-white flex items-center gap-2">
                  <span>Configuración de Privacidad del Perfil</span>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold border ${privacyLevel.badgeClass}`}>
                    Nivel: {privacyLevel.label}
                  </span>
                </h2>
                <p className="text-gray-500 dark:text-gray-400 text-xs">
                  Elige qué información (fotos, tablón, amigos) es visible para personas fuera de tu lista de amigos o usuarios no registrados.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                viewUserProfile(currentUser.id);
                setActiveTab('perfil');
              }}
              className="text-xs text-[#3869A0] hover:text-[#2c537f] dark:text-blue-400 font-bold flex items-center gap-1 px-2.5 py-1.5 bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/50 rounded border border-blue-200 dark:border-blue-900 transition cursor-pointer"
              title="Abrir tu perfil para ver el resultado"
            >
              <Eye className="w-3.5 h-3.5" />
              <span>Ver mi perfil</span>
            </button>
          </div>
        </div>
      )}

      {/* Success Notification Alert */}
      {savedSuccess && (
        <div className="p-3 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-800 rounded flex items-center justify-between text-xs text-emerald-800 dark:text-emerald-200 animate-in fade-in">
          <div className="flex items-center gap-2 font-medium">
            <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
            <span>Configuración de privacidad guardada correctamente. Tu perfil ahora aplica estas restricciones.</span>
          </div>
          <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold font-mono">Actualizado</span>
        </div>
      )}

      {/* Status Card: Current Privacy Summary */}
      <div className="p-3.5 bg-gray-50 dark:bg-[#141f32] rounded border border-[#ccd5df] dark:border-gray-700/80 space-y-2">
        <div className="flex items-center justify-between">
          <span className="font-bold text-xs text-gray-800 dark:text-gray-200 flex items-center gap-1.5">
            <Lock className="w-3.5 h-3.5 text-[#3869A0] dark:text-blue-400" />
            <span>Resumen de visibilidad de tu cuenta</span>
          </span>
          <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${privacyLevel.badgeClass}`}>
            {privacyLevel.label}
          </span>
        </div>
        <p className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed">
          {privacyLevel.description}
        </p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 text-[11px]">
          <div className="bg-white dark:bg-[#0e1726] p-2 rounded border border-gray-200 dark:border-gray-700 flex flex-col">
            <span className="text-gray-400 dark:text-gray-500 font-medium">Fotos:</span>
            <span className="font-bold text-gray-800 dark:text-gray-200 flex items-center gap-1 mt-0.5">
              {privacy.fotos === 'amigos' ? (
                <><Lock className="w-3 h-3 text-emerald-600" /> Solo amigos</>
              ) : (
                <><Globe className="w-3 h-3 text-amber-500" /> Todo el mundo</>
              )}
            </span>
          </div>

          <div className="bg-white dark:bg-[#0e1726] p-2 rounded border border-gray-200 dark:border-gray-700 flex flex-col">
            <span className="text-gray-400 dark:text-gray-500 font-medium">Tablón:</span>
            <span className="font-bold text-gray-800 dark:text-gray-200 flex items-center gap-1 mt-0.5">
              {privacy.tablon === 'amigos' ? (
                <><Lock className="w-3 h-3 text-emerald-600" /> Solo amigos</>
              ) : (
                <><Globe className="w-3 h-3 text-amber-500" /> Todo el mundo</>
              )}
            </span>
          </div>

          <div className="bg-white dark:bg-[#0e1726] p-2 rounded border border-gray-200 dark:border-gray-700 flex flex-col">
            <span className="text-gray-400 dark:text-gray-500 font-medium">Amigos:</span>
            <span className="font-bold text-gray-800 dark:text-gray-200 flex items-center gap-1 mt-0.5">
              {privacy.amigos === 'amigos' ? (
                <><Lock className="w-3 h-3 text-emerald-600" /> Solo amigos</>
              ) : (
                <><Globe className="w-3 h-3 text-amber-500" /> Todo el mundo</>
              )}
            </span>
          </div>

          <div className="bg-white dark:bg-[#0e1726] p-2 rounded border border-gray-200 dark:border-gray-700 flex flex-col">
            <span className="text-gray-400 dark:text-gray-500 font-medium">No registrados:</span>
            <span className="font-bold text-gray-800 dark:text-gray-200 flex items-center gap-1 mt-0.5">
              {privacy.permitirNoRegistrados ? (
                <><Globe className="w-3 h-3 text-blue-500" /> Permitido</>
              ) : (
                <><Lock className="w-3 h-3 text-emerald-600" /> Bloqueado</>
              )}
            </span>
          </div>
        </div>
      </div>

      {/* Main Form Settings */}
      <form onSubmit={handleSave} className="space-y-4">
        {/* 1. SECCIÓN FOTOS */}
        <div className="bg-white dark:bg-[#141f32] p-4 rounded border border-[#ccd5df] dark:border-gray-700 shadow-xs space-y-3">
          <div className="flex items-center gap-2 pb-2 border-b border-gray-100 dark:border-gray-700/80">
            <div className="p-1.5 bg-blue-50 dark:bg-blue-950/70 text-[#3869A0] dark:text-blue-400 rounded">
              <Camera className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-xs text-gray-900 dark:text-white">
                1. Visibilidad de tus Fotos y Álbumes
              </h3>
              <p className="text-[11px] text-gray-500 dark:text-gray-400">
                Determina quién tiene acceso a tus álbumes personales, fotos subidas y fotos etiquetadas.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
            {/* Opción Solo Amigos */}
            <label 
              className={`p-3 rounded border cursor-pointer transition flex items-start gap-2.5 ${
                privacy.fotos === 'amigos'
                  ? 'border-[#3869A0] bg-blue-50/70 dark:bg-blue-950/40 text-gray-900 dark:text-white ring-1 ring-[#3869A0]'
                  : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-[#0e1726] hover:bg-gray-50 dark:hover:bg-[#19263e]'
              }`}
            >
              <input
                type="radio"
                name="privacidad_fotos"
                value="amigos"
                checked={privacy.fotos === 'amigos'}
                onChange={() => updateSetting('fotos', 'amigos')}
                className="mt-0.5 text-[#3869A0] focus:ring-[#3869A0]"
              />
              <div className="space-y-1 text-xs">
                <div className="font-bold flex items-center gap-1.5">
                  <Users className="w-3.5 h-3.5 text-[#3869A0]" />
                  <span>Solo mis amigos (Recomendado)</span>
                </div>
                <p className="text-[11px] text-gray-500 dark:text-gray-400 leading-normal">
                  Solo las personas que estén en tu lista de amigos pueden ver tus fotos. Los no amigos o visitantes sin registrar verán un aviso protegido con candado.
                </p>
              </div>
            </label>

            {/* Opción Todo el Mundo */}
            <label 
              className={`p-3 rounded border cursor-pointer transition flex items-start gap-2.5 ${
                privacy.fotos === 'todos'
                  ? 'border-[#3869A0] bg-blue-50/70 dark:bg-blue-950/40 text-gray-900 dark:text-white ring-1 ring-[#3869A0]'
                  : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-[#0e1726] hover:bg-gray-50 dark:hover:bg-[#19263e]'
              }`}
            >
              <input
                type="radio"
                name="privacidad_fotos"
                value="todos"
                checked={privacy.fotos === 'todos'}
                onChange={() => updateSetting('fotos', 'todos')}
                className="mt-0.5 text-[#3869A0] focus:ring-[#3869A0]"
              />
              <div className="space-y-1 text-xs">
                <div className="font-bold flex items-center gap-1.5">
                  <Globe className="w-3.5 h-3.5 text-amber-600" />
                  <span>Todo el mundo (Público)</span>
                </div>
                <p className="text-[11px] text-gray-500 dark:text-gray-400 leading-normal">
                  Cualquier persona que visite tu perfil (amigos, personas ajenas y visitantes) podrá ver tu galería de fotos y álbumes.
                </p>
              </div>
            </label>
          </div>
        </div>

        {/* 2. SECCIÓN TABLÓN */}
        <div className="bg-white dark:bg-[#141f32] p-4 rounded border border-[#ccd5df] dark:border-gray-700 shadow-xs space-y-3">
          <div className="flex items-center gap-2 pb-2 border-b border-gray-100 dark:border-gray-700/80">
            <div className="p-1.5 bg-blue-50 dark:bg-blue-950/70 text-[#3869A0] dark:text-blue-400 rounded">
              <MessageSquare className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-xs text-gray-900 dark:text-white">
                2. Visibilidad y Firmas en tu Tablón
              </h3>
              <p className="text-[11px] text-gray-500 dark:text-gray-400">
                Elige quién puede leer los comentarios de tu tablón y quién tiene permiso para firmar.
              </p>
            </div>
          </div>

          <div className="space-y-3 pt-1">
            <div>
              <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5">
                ¿Quién puede VER los mensajes y comentarios de tu tablón?
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <label 
                  className={`p-2.5 rounded border cursor-pointer transition flex items-center gap-2 text-xs ${
                    privacy.tablon === 'amigos'
                      ? 'border-[#3869A0] bg-blue-50/70 dark:bg-blue-950/40 font-bold text-[#3869A0] dark:text-blue-300 ring-1 ring-[#3869A0]'
                      : 'border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-[#19263e]'
                  }`}
                >
                  <input
                    type="radio"
                    name="privacidad_tablon"
                    value="amigos"
                    checked={privacy.tablon === 'amigos'}
                    onChange={() => updateSetting('tablon', 'amigos')}
                    className="text-[#3869A0]"
                  />
                  <Users className="w-3.5 h-3.5" />
                  <span>Solo mis amigos (Privado a extraños)</span>
                </label>

                <label 
                  className={`p-2.5 rounded border cursor-pointer transition flex items-center gap-2 text-xs ${
                    privacy.tablon === 'todos'
                      ? 'border-[#3869A0] bg-blue-50/70 dark:bg-blue-950/40 font-bold text-[#3869A0] dark:text-blue-300 ring-1 ring-[#3869A0]'
                      : 'border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-[#19263e]'
                  }`}
                >
                  <input
                    type="radio"
                    name="privacidad_tablon"
                    value="todos"
                    checked={privacy.tablon === 'todos'}
                    onChange={() => updateSetting('tablon', 'todos')}
                    className="text-[#3869A0]"
                  />
                  <Globe className="w-3.5 h-3.5 text-amber-600" />
                  <span>Todo el mundo (Tablón público)</span>
                </label>
              </div>
            </div>

            <div className="pt-2 border-t border-gray-100 dark:border-gray-700/60">
              <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5">
                ¿Quién puede FIRMAR o escribir en tu tablón?
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <label 
                  className={`p-2.5 rounded border cursor-pointer transition flex items-center gap-2 text-xs ${
                    privacy.comentarTablon === 'amigos'
                      ? 'border-[#3869A0] bg-blue-50/70 dark:bg-blue-950/40 font-bold text-[#3869A0] dark:text-blue-300 ring-1 ring-[#3869A0]'
                      : 'border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-[#19263e]'
                  }`}
                >
                  <input
                    type="radio"
                    name="comentar_tablon"
                    value="amigos"
                    checked={privacy.comentarTablon === 'amigos'}
                    onChange={() => updateSetting('comentarTablon', 'amigos')}
                    className="text-[#3869A0]"
                  />
                  <Lock className="w-3.5 h-3.5" />
                  <span>Solo mis amigos agregados</span>
                </label>

                <label 
                  className={`p-2.5 rounded border cursor-pointer transition flex items-center gap-2 text-xs ${
                    privacy.comentarTablon === 'todos'
                      ? 'border-[#3869A0] bg-blue-50/70 dark:bg-blue-950/40 font-bold text-[#3869A0] dark:text-blue-300 ring-1 ring-[#3869A0]'
                      : 'border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-[#19263e]'
                  }`}
                >
                  <input
                    type="radio"
                    name="comentar_tablon"
                    value="todos"
                    checked={privacy.comentarTablon === 'todos'}
                    onChange={() => updateSetting('comentarTablon', 'todos')}
                    className="text-[#3869A0]"
                  />
                  <Users className="w-3.5 h-3.5" />
                  <span>Cualquier usuario de Inkorium</span>
                </label>
              </div>
            </div>
          </div>
        </div>

        {/* 3. SECCIÓN AMIGOS */}
        <div className="bg-white dark:bg-[#141f32] p-4 rounded border border-[#ccd5df] dark:border-gray-700 shadow-xs space-y-3">
          <div className="flex items-center gap-2 pb-2 border-b border-gray-100 dark:border-gray-700/80">
            <div className="p-1.5 bg-blue-50 dark:bg-blue-950/70 text-[#3869A0] dark:text-blue-400 rounded">
              <Star className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-xs text-gray-900 dark:text-white">
                3. Visibilidad de tu Lista de Amigos y Top Amigos
              </h3>
              <p className="text-[11px] text-gray-500 dark:text-gray-400">
                Controla si personas desconocidas o visitantes pueden ver quiénes son tus amigos y a quién tienes en tu Top Amigos.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
            {/* Solo Amigos */}
            <label 
              className={`p-3 rounded border cursor-pointer transition flex items-start gap-2.5 ${
                privacy.amigos === 'amigos'
                  ? 'border-[#3869A0] bg-blue-50/70 dark:bg-blue-950/40 text-gray-900 dark:text-white ring-1 ring-[#3869A0]'
                  : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-[#0e1726] hover:bg-gray-50 dark:hover:bg-[#19263e]'
              }`}
            >
              <input
                type="radio"
                name="privacidad_amigos"
                value="amigos"
                checked={privacy.amigos === 'amigos'}
                onChange={() => updateSetting('amigos', 'amigos')}
                className="mt-0.5 text-[#3869A0] focus:ring-[#3869A0]"
              />
              <div className="space-y-1 text-xs">
                <div className="font-bold flex items-center gap-1.5">
                  <Users className="w-3.5 h-3.5 text-[#3869A0]" />
                  <span>Solo mis amigos (Recomendado)</span>
                </div>
                <p className="text-[11px] text-gray-500 dark:text-gray-400 leading-normal">
                  Solo tus amigos mutuos podrán ver tu lista de contactos y tu cuadrícula de Top Amigos. Las personas ajenas verán un candado de privacidad.
                </p>
              </div>
            </label>

            {/* Todo el Mundo */}
            <label 
              className={`p-3 rounded border cursor-pointer transition flex items-start gap-2.5 ${
                privacy.amigos === 'todos'
                  ? 'border-[#3869A0] bg-blue-50/70 dark:bg-blue-950/40 text-gray-900 dark:text-white ring-1 ring-[#3869A0]'
                  : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-[#0e1726] hover:bg-gray-50 dark:hover:bg-[#19263e]'
              }`}
            >
              <input
                type="radio"
                name="privacidad_amigos"
                value="todos"
                checked={privacy.amigos === 'todos'}
                onChange={() => updateSetting('amigos', 'todos')}
                className="mt-0.5 text-[#3869A0] focus:ring-[#3869A0]"
              />
              <div className="space-y-1 text-xs">
                <div className="font-bold flex items-center gap-1.5">
                  <Globe className="w-3.5 h-3.5 text-amber-600" />
                  <span>Todo el mundo (Lista pública)</span>
                </div>
                <p className="text-[11px] text-gray-500 dark:text-gray-400 leading-normal">
                  Cualquier persona registrada o visitante web podrá ver a quién tienes agregado y tus mejores amigos.
                </p>
              </div>
            </label>
          </div>
        </div>

        {/* 4. SECCIÓN INFORMACIÓN PERSONAL DETALLADA */}
        <div className="bg-white dark:bg-[#141f32] p-4 rounded border border-[#ccd5df] dark:border-gray-700 shadow-xs space-y-3">
          <div className="flex items-center gap-2 pb-2 border-b border-gray-100 dark:border-gray-700/80">
            <div className="p-1.5 bg-blue-50 dark:bg-blue-950/70 text-[#3869A0] dark:text-blue-400 rounded">
              <Info className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-xs text-gray-900 dark:text-white">
                4. Información Personal Detallada
              </h3>
              <p className="text-[11px] text-gray-500 dark:text-gray-400">
                Fecha de nacimiento/edad, situación sentimental, ocupación, gustos musicales e intereses.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
            <label 
              className={`p-3 rounded border cursor-pointer transition flex items-start gap-2.5 ${
                privacy.info === 'amigos'
                  ? 'border-[#3869A0] bg-blue-50/70 dark:bg-blue-950/40 text-gray-900 dark:text-white ring-1 ring-[#3869A0]'
                  : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-[#0e1726] hover:bg-gray-50 dark:hover:bg-[#19263e]'
              }`}
            >
              <input
                type="radio"
                name="privacidad_info"
                value="amigos"
                checked={privacy.info === 'amigos'}
                onChange={() => updateSetting('info', 'amigos')}
                className="mt-0.5 text-[#3869A0] focus:ring-[#3869A0]"
              />
              <div className="space-y-1 text-xs">
                <div className="font-bold flex items-center gap-1.5">
                  <Users className="w-3.5 h-3.5 text-[#3869A0]" />
                  <span>Solo mis amigos</span>
                </div>
                <p className="text-[11px] text-gray-500 dark:text-gray-400 leading-normal">
                  Los datos personales ampliados solo serán mostrados a quienes estén en tu lista de amigos.
                </p>
              </div>
            </label>

            <label 
              className={`p-3 rounded border cursor-pointer transition flex items-start gap-2.5 ${
                privacy.info === 'todos'
                  ? 'border-[#3869A0] bg-blue-50/70 dark:bg-blue-950/40 text-gray-900 dark:text-white ring-1 ring-[#3869A0]'
                  : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-[#0e1726] hover:bg-gray-50 dark:hover:bg-[#19263e]'
              }`}
            >
              <input
                type="radio"
                name="privacidad_info"
                value="todos"
                checked={privacy.info === 'todos'}
                onChange={() => updateSetting('info', 'todos')}
                className="mt-0.5 text-[#3869A0] focus:ring-[#3869A0]"
              />
              <div className="space-y-1 text-xs">
                <div className="font-bold flex items-center gap-1.5">
                  <Globe className="w-3.5 h-3.5 text-amber-600" />
                  <span>Todo el mundo</span>
                </div>
                <p className="text-[11px] text-gray-500 dark:text-gray-400 leading-normal">
                  Cualquier usuario o visitante podrá ver tus datos de presentación e intereses personales.
                </p>
              </div>
            </label>
          </div>
        </div>

        {/* 5. SECCIÓN ACCESO DE USUARIOS NO REGISTRADOS */}
        <div className="bg-white dark:bg-[#141f32] p-4 rounded border border-[#ccd5df] dark:border-gray-700 shadow-xs space-y-3">
          <div className="flex items-center gap-2 pb-2 border-b border-gray-100 dark:border-gray-700/80">
            <div className="p-1.5 bg-blue-50 dark:bg-blue-950/70 text-[#3869A0] dark:text-blue-400 rounded">
              <Globe className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-xs text-gray-900 dark:text-white">
                5. Visibilidad para Usuarios No Registrados (Enlace público web)
              </h3>
              <p className="text-[11px] text-gray-500 dark:text-gray-400">
                Permite o bloquea que visitantes que aún no tengan cuenta o no hayan iniciado sesión puedan ver tu perfil público.
              </p>
            </div>
          </div>

          <label className="flex items-start gap-3 p-3 rounded border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-[#19263e] cursor-pointer transition">
            <input
              type="checkbox"
              checked={Boolean(privacy.permitirNoRegistrados)}
              onChange={e => updateSetting('permitirNoRegistrados', e.target.checked)}
              className="mt-1 w-4 h-4 rounded text-[#3869A0] focus:ring-[#3869A0] border-gray-300 cursor-pointer"
            />
            <div className="space-y-1 text-xs">
              <span className="font-bold text-gray-900 dark:text-white block">
                Permitir que personas no registradas vean mi perfil básico en la web
              </span>
              <p className="text-[11px] text-gray-500 dark:text-gray-400 leading-relaxed">
                Si está marcado, los visitantes sin cuenta podrán ver tu nombre, foto de perfil y las secciones que hayas configurado como visibles para "Todo el mundo". Si está desmarcado, se les requerirá obligatoriamente iniciar sesión o registrarse para acceder.
              </p>
            </div>
          </label>
        </div>

        {/* Action Buttons Footer */}
        <div className="pt-3 border-t border-gray-200 dark:border-gray-700 flex items-center justify-between flex-wrap gap-2">
          <button
            type="button"
            onClick={handleResetDefaults}
            className="px-3 py-1.5 text-xs text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:underline transition cursor-pointer flex items-center gap-1.5"
          >
            <RefreshCw className="w-3 h-3" />
            <span>Restablecer recomendados</span>
          </button>

          <div className="flex items-center gap-2">
            {hasChanges && (
              <span className="text-[11px] text-amber-600 dark:text-amber-400 font-medium">
                Tienes cambios sin guardar
              </span>
            )}

            <button
              type="submit"
              disabled={isSaving}
              className="px-5 py-2 bg-[#3869A0] hover:bg-[#2c537f] disabled:bg-gray-300 text-white font-bold rounded text-xs transition flex items-center gap-1.5 shadow-xs cursor-pointer disabled:cursor-not-allowed"
            >
              {isSaving ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Guardando...</span>
                </>
              ) : savedSuccess ? (
                <>
                  <Check className="w-3.5 h-3.5" />
                  <span>¡Guardado!</span>
                </>
              ) : (
                <>
                  <Save className="w-3.5 h-3.5" />
                  <span>Guardar configuración de privacidad</span>
                </>
              )}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};
