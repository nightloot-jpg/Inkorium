import React, { useState, useEffect } from 'react';
import { useInkorium } from '../context/InkoriumContext';
import { supabase } from '../lib/supabase';
import { 
  X, Check, Sparkles, MapPin, Heart, Briefcase, 
  Music, User as UserIcon, Calendar, Camera, Info, Save
} from 'lucide-react';
import { 
  COUNTRIES_LIST, 
  getZonesForCountry, 
  getCountryByZone, 
  RelationshipStatus, 
  Gender 
} from '../types';

interface EditProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenAvatarModal?: () => void;
}

export const EditProfileModal: React.FC<EditProfileModalProps> = ({ 
  isOpen, 
  onClose,
  onOpenAvatarModal
}) => {
  const { currentUser, updateUserData, pushNotification } = useInkorium();

  const [nombre, setNombre] = useState(currentUser.nombre || '');
  const [apellidos, setApellidos] = useState(currentUser.apellidos || '');
  const [sexo, setSexo] = useState<Gender>(currentUser.sexo || 'h');
  const [fnac, setFnac] = useState(currentUser.fnac || '1992-05-15');
  
  // Country & Province/Zone states
  const initialCountry = currentUser.pais || getCountryByZone(currentUser.provincia)?.name || 'España';
  const [pais, setPais] = useState<string>(initialCountry);
  const [provincia, setProvincia] = useState(currentUser.provincia || 'Madrid');
  const [ciudad, setCiudad] = useState(currentUser.ciudad || '');
  const [situacion, setSituacion] = useState<RelationshipStatus>(currentUser.situacionSentimental || 'Soltero/a');
  const [ocupacion, setOcupacion] = useState(currentUser.ocupacion || '');
  const [intereses, setIntereses] = useState(currentUser.intereses || '');
  const [musica, setMusica] = useState(currentUser.musica || '');
  const [estado, setEstado] = useState(currentUser.estado || '');

  const [isSaving, setIsSaving] = useState(false);
  const [showSuccessBadge, setShowSuccessBadge] = useState(false);

  // Available zones for current selected country
  const currentCountryObj = COUNTRIES_LIST.find(c => c.name.toLowerCase() === pais.toLowerCase()) || COUNTRIES_LIST[0];
  const availableZones = currentCountryObj?.zones || [];

  // Sync state when modal opens or currentUser updates
  useEffect(() => {
    if (isOpen) {
      const userCountry = currentUser.pais || getCountryByZone(currentUser.provincia)?.name || 'España';
      setNombre(currentUser.nombre || '');
      setApellidos(currentUser.apellidos || '');
      setSexo(currentUser.sexo || 'h');
      setFnac(currentUser.fnac || '1992-05-15');
      setPais(userCountry);
      setProvincia(currentUser.provincia || (userCountry === 'España' ? 'Madrid' : getZonesForCountry(userCountry)[0] || ''));
      setCiudad(currentUser.ciudad || '');
      setSituacion(currentUser.situacionSentimental || 'Soltero/a');
      setOcupacion(currentUser.ocupacion || '');
      setIntereses(currentUser.intereses || '');
      setMusica(currentUser.musica || '');
      setEstado(currentUser.estado || '');
      setShowSuccessBadge(false);
    }
  }, [isOpen, currentUser]);

  const handleCountryChange = (newCountryName: string) => {
    setPais(newCountryName);
    const zones = getZonesForCountry(newCountryName);
    if (zones.length > 0) {
      setProvincia(zones[0]);
    }
  };

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nombre.trim()) return;

    setIsSaving(true);

    const fullName = `${nombre.trim()} ${apellidos.trim()}`.trim();
    const profileInterests = intereses
      .split(',')
      .map(item => item.trim())
      .filter(Boolean);

    // Persist the profile to the shared Supabase row first. This is the
    // source of truth used when another device/account opens the profile.
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: fullName || null,
          avatar_url: currentUser.avatar || null,
          city: ciudad.trim() || null,
          country: pais || null,
          province: provincia || null,
          birth_date: fnac || null,
          user_status: estado.trim() || currentUser.estado || null,
          gender: sexo || null,
          relationship_status: situacion || null,
          occupation: ocupacion.trim() || null,
          profile_interests: profileInterests,
          music: musica.trim() || null
        })
        .eq('id', currentUser.id);

      if (error) {
        console.error('[Inkorium] Error guardando perfil en Supabase:', error);
        pushNotification({
          id: `notif-profile-edit-error-${Date.now()}`,
          tipo: 'sistema',
          userId: currentUser.id,
          fromUserId: currentUser.id,
          fromUserName: 'Inkorium Sistema',
          mensaje: 'No se han podido guardar tus cambios en el servidor. Inténtalo de nuevo.',
          fecha: 'Ahora mismo',
          leido: true
        });
        setIsSaving(false);
        return;
      }
    } catch (error) {
      console.error('[Inkorium] Error guardando perfil en Supabase:', error);
      pushNotification({
        id: `notif-profile-edit-error-${Date.now()}`,
        tipo: 'sistema',
        userId: currentUser.id,
        fromUserId: currentUser.id,
        fromUserName: 'Inkorium Sistema',
        mensaje: 'No se han podido guardar tus cambios en el servidor. Inténtalo de nuevo.',
        fecha: 'Ahora mismo',
        leido: true
      });
      setIsSaving(false);
      return;
    }
    
    // Keep the local UI/cache in sync after the cloud write succeeds.
    updateUserData({
      nombre: nombre.trim(),
      apellidos: apellidos.trim(),
      full_name: fullName,
      sexo,
      fnac,
      pais,
      provincia,
      ciudad: ciudad.trim() || undefined,
      situacionSentimental: situacion,
      ocupacion: ocupacion.trim(),
      intereses: intereses.trim(),
      musica: musica.trim(),
      estado: estado.trim() || currentUser.estado
    });

    setShowSuccessBadge(true);
    setIsSaving(false);

    // Notificación visual de guardado exitoso
    pushNotification({
      id: `notif-profile-edit-${Date.now()}`,
      tipo: 'sistema',
      userId: currentUser.id,
      fromUserId: currentUser.id,
      fromUserName: 'Inkorium Sistema',
      mensaje: 'Has actualizado tus datos personales correctamente.',
      fecha: 'Ahora mismo',
      leido: true
    });

    setTimeout(() => {
      onClose();
    }, 900);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-3 overflow-y-auto">
      <div 
        className="bg-white dark:bg-[#0e1726] border border-[#ccd5df] dark:border-[#1d2b40] rounded-lg shadow-2xl w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150 text-xs text-gray-800 dark:text-gray-100 my-8"
        role="dialog"
        aria-modal="true"
        aria-labelledby="edit-profile-modal-title"
      >
        {/* Modal Header */}
        <div className="bg-[#3869A0] dark:bg-[#152338] text-white px-4 py-2.5 flex items-center justify-between border-b border-[#2b5380] dark:border-[#1d2b40]">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-300" />
            <h2 id="edit-profile-modal-title" className="font-bold text-sm">
              Editar mis datos personales
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-white/80 hover:text-white hover:bg-white/10 p-1 rounded transition cursor-pointer"
            aria-label="Cerrar modal"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body / Form */}
        <form onSubmit={handleSubmit} className="p-4 sm:p-5 space-y-4 max-h-[80vh] overflow-y-auto">
          {showSuccessBadge && (
            <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 rounded flex items-center gap-2 text-xs font-bold animate-in fade-in">
              <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span>¡Datos guardados con éxito! Tu perfil se ha actualizado en tiempo real.</span>
            </div>
          )}

          {/* Avatar quick bar */}
          <div className="p-3 bg-[#f0f4f8] dark:bg-[#111c2e] rounded border border-[#ccd5df] dark:border-[#1d2b40] flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="relative w-12 h-12 rounded overflow-hidden border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-800 flex-shrink-0">
                <img
                  src={currentUser.avatar}
                  alt={currentUser.nombre}
                  className="w-full h-full object-cover"
                />
              </div>
              <div>
                <p className="font-bold text-gray-900 dark:text-white">Foto de perfil</p>
                <p className="text-[11px] text-gray-500 dark:text-gray-400">
                  Visible para todos los usuarios en tu perfil y novedades.
                </p>
              </div>
            </div>

            {onOpenAvatarModal && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenAvatarModal();
                }}
                className="px-3 py-1.5 bg-white dark:bg-[#1a273c] hover:bg-blue-50 dark:hover:bg-[#233550] text-[#3869A0] dark:text-blue-400 border border-[#3869A0]/40 rounded font-bold text-xs flex items-center gap-1.5 transition cursor-pointer shadow-2xs"
              >
                <Camera className="w-3.5 h-3.5" />
                <span>Cambiar foto</span>
              </button>
            )}
          </div>

          {/* Section: Identidad */}
          <div className="space-y-3">
            <h3 className="font-bold text-gray-700 dark:text-gray-300 border-b border-gray-200 dark:border-slate-800 pb-1 flex items-center gap-1.5 text-xs">
              <UserIcon className="w-3.5 h-3.5 text-[#3869A0] dark:text-blue-400" />
              <span>Identidad y Nombre</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="font-semibold block mb-1 text-gray-700 dark:text-gray-300">
                  Nombre: <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={nombre}
                  onChange={e => setNombre(e.target.value)}
                  placeholder="Tu nombre de pila"
                  className="w-full p-2 rounded border border-gray-300 dark:border-slate-700 bg-white dark:bg-[#111c2e] text-gray-900 dark:text-gray-100 focus:outline-none focus:border-[#3869A0] focus:ring-1 focus:ring-[#3869A0]"
                  required
                />
              </div>

              <div>
                <label className="font-semibold block mb-1 text-gray-700 dark:text-gray-300">
                  Apellidos:
                </label>
                <input
                  type="text"
                  value={apellidos}
                  onChange={e => setApellidos(e.target.value)}
                  placeholder="Tus apellidos"
                  className="w-full p-2 rounded border border-gray-300 dark:border-slate-700 bg-white dark:bg-[#111c2e] text-gray-900 dark:text-gray-100 focus:outline-none focus:border-[#3869A0] focus:ring-1 focus:ring-[#3869A0]"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="font-semibold block mb-1 text-gray-700 dark:text-gray-300">
                  Sexo:
                </label>
                <select
                  value={sexo}
                  onChange={e => setSexo(e.target.value as Gender)}
                  className="w-full p-2 rounded border border-gray-300 dark:border-slate-700 bg-white dark:bg-[#111c2e] text-gray-900 dark:text-gray-100 focus:outline-none focus:border-[#3869A0]"
                >
                  <option value="h">Chico (Hombre)</option>
                  <option value="m">Chica (Mujer)</option>
                  <option value="otro">Otro</option>
                </select>
              </div>

              <div>
                <label className="font-semibold block mb-1 text-gray-700 dark:text-gray-300 flex items-center justify-between">
                  <span>Fecha de nacimiento:</span>
                  <span className="text-[10px] text-gray-400 font-normal">Año-Mes-Día</span>
                </label>
                <input
                  type="date"
                  value={fnac}
                  onChange={e => setFnac(e.target.value)}
                  className="w-full p-2 rounded border border-gray-300 dark:border-slate-700 bg-white dark:bg-[#111c2e] text-gray-900 dark:text-gray-100 focus:outline-none focus:border-[#3869A0]"
                  required
                />
              </div>
            </div>
          </div>

          {/* Section: Ubicación y Situación */}
          <div className="space-y-3 pt-2">
            <h3 className="font-bold text-gray-700 dark:text-gray-300 border-b border-gray-200 dark:border-slate-800 pb-1 flex items-center gap-1.5 text-xs">
              <MapPin className="w-3.5 h-3.5 text-[#3869A0] dark:text-blue-400" />
              <span>Ubicación y Situación personal</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="font-semibold block mb-1 text-gray-700 dark:text-gray-300">
                  País:
                </label>
                <select
                  value={pais}
                  onChange={e => handleCountryChange(e.target.value)}
                  className="w-full p-2 rounded border border-gray-300 dark:border-slate-700 bg-white dark:bg-[#111c2e] text-gray-900 dark:text-gray-100 focus:outline-none focus:border-[#3869A0] cursor-pointer"
                >
                  {COUNTRIES_LIST.map(c => (
                    <option key={c.id} value={c.name}>
                      {c.flag} {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="font-semibold block mb-1 text-gray-700 dark:text-gray-300">
                  Provincia / Zona / Estado:
                </label>
                <select
                  value={provincia}
                  onChange={e => setProvincia(e.target.value)}
                  className="w-full p-2 rounded border border-gray-300 dark:border-slate-700 bg-white dark:bg-[#111c2e] text-gray-900 dark:text-gray-100 focus:outline-none focus:border-[#3869A0] cursor-pointer"
                >
                  {availableZones.map((z, idx) => (
                    <option key={`${z}-${idx}`} value={z}>{z}</option>
                  ))}
                  {provincia && !availableZones.includes(provincia) && (
                    <option key="custom-provincia" value={provincia}>{provincia}</option>
                  )}
                </select>
              </div>

              <div>
                <label className="font-semibold block mb-1 text-gray-700 dark:text-gray-300">
                  Ciudad / Municipio:
                </label>
                <input
                  type="text"
                  value={ciudad}
                  onChange={e => setCiudad(e.target.value)}
                  placeholder="Ej: Madrid centro, Malasaña..."
                  className="w-full p-2 rounded border border-gray-300 dark:border-slate-700 bg-white dark:bg-[#111c2e] text-gray-900 dark:text-gray-100 focus:outline-none focus:border-[#3869A0]"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="font-semibold block mb-1 text-gray-700 dark:text-gray-300 flex items-center gap-1">
                  <Heart className="w-3 h-3 text-red-500" />
                  <span>Situación sentimental:</span>
                </label>
                <select
                  value={situacion}
                  onChange={e => setSituacion(e.target.value as RelationshipStatus)}
                  className="w-full p-2 rounded border border-gray-300 dark:border-slate-700 bg-white dark:bg-[#111c2e] text-gray-900 dark:text-gray-100 focus:outline-none focus:border-[#3869A0]"
                >
                  <option value="Soltero/a">Soltero/a</option>
                  <option value="Con pareja">Con pareja</option>
                  <option value="Es complicado">Es complicado</option>
                  <option value="Casado/a">Casado/a</option>
                  <option value="En una relación abierta">En una relación abierta</option>
                  <option value="Buscando el amor">Buscando el amor</option>
                  <option value="Prefiero no decirlo">Prefiero no decirlo</option>
                </select>
              </div>

              <div>
                <label className="font-semibold block mb-1 text-gray-700 dark:text-gray-300 flex items-center gap-1">
                  <Briefcase className="w-3 h-3 text-amber-600 dark:text-amber-400" />
                  <span>Ocupación o Estudios:</span>
                </label>
                <input
                  type="text"
                  value={ocupacion}
                  onChange={e => setOcupacion(e.target.value)}
                  placeholder="Ej: Estudiante en Universidad / Diseñador..."
                  className="w-full p-2 rounded border border-gray-300 dark:border-slate-700 bg-white dark:bg-[#111c2e] text-gray-900 dark:text-gray-100 focus:outline-none focus:border-[#3869A0]"
                />
              </div>
            </div>
          </div>

          {/* Section: Gustos y Personalización */}
          <div className="space-y-3 pt-2">
            <h3 className="font-bold text-gray-700 dark:text-gray-300 border-b border-gray-200 dark:border-slate-800 pb-1 flex items-center gap-1.5 text-xs">
              <Sparkles className="w-3.5 h-3.5 text-[#3869A0] dark:text-blue-400" />
              <span>Intereses, Música y Estado</span>
            </h3>

            <div>
              <label className="font-semibold block mb-1 text-gray-700 dark:text-gray-300 flex items-center gap-1">
                <Music className="w-3 h-3 text-[#3869A0] dark:text-blue-400" />
                <span>Canción de tu perfil (Myspace/Tuenti Vibe):</span>
              </label>
              <input
                type="text"
                value={musica}
                onChange={e => setMusica(e.target.value)}
                placeholder="Ej: El Canto del Loco - Zapatillas / Pignoise - Nada que perder"
                className="w-full p-2 rounded border border-gray-300 dark:border-slate-700 bg-white dark:bg-[#111c2e] text-gray-900 dark:text-gray-100 focus:outline-none focus:border-[#3869A0]"
              />
              <p className="text-[10px] text-gray-400 mt-0.5">
                Esta canción sonará o destacará cuando los demás usuarios visiten tu perfil.
              </p>
            </div>

            <div>
              <label className="font-semibold block mb-1 text-gray-700 dark:text-gray-300">
                Intereses y aficiones:
              </label>
              <textarea
                value={intereses}
                onChange={e => setIntereses(e.target.value)}
                placeholder="Cine retro, fotografía, skate, música electrónica, salir con amigos..."
                rows={2}
                className="w-full p-2 rounded border border-gray-300 dark:border-slate-700 bg-white dark:bg-[#111c2e] text-gray-900 dark:text-gray-100 focus:outline-none focus:border-[#3869A0] resize-none"
              />
            </div>

            <div>
              <label className="font-semibold block mb-1 text-gray-700 dark:text-gray-300">
                Estado / Frase de perfil:
              </label>
              <input
                type="text"
                value={estado}
                onChange={e => setEstado(e.target.value)}
                placeholder="¿Qué estás pensando hoy?"
                maxLength={140}
                className="w-full p-2 rounded border border-gray-300 dark:border-slate-700 bg-white dark:bg-[#111c2e] text-gray-900 dark:text-gray-100 focus:outline-none focus:border-[#3869A0]"
              />
            </div>
          </div>

          {/* Footer Controls */}
          <div className="flex items-center justify-end gap-2 pt-3 border-t border-gray-200 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-gray-100 dark:bg-slate-800 hover:bg-gray-200 dark:hover:bg-slate-700 text-gray-700 dark:text-gray-300 font-bold rounded text-xs transition cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="px-5 py-2 bg-[#3869A0] hover:bg-[#2b5380] text-white font-bold rounded text-xs transition cursor-pointer flex items-center gap-1.5 shadow-xs disabled:opacity-50"
            >
              <Save className="w-3.5 h-3.5" />
              <span>{isSaving ? 'Guardando...' : 'Guardar cambios'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
