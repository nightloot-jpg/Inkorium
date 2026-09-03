import React, { useState, useEffect } from 'react';
import { useInkorium } from '../context/InkoriumContext';
import { AvatarModal } from './AvatarModal';
import { 
  Settings, UserCheck, Shield, KeyRound, UserPlus, 
  Check, X, RefreshCw, Smartphone, Globe, Sparkles, Bell, Volume2, MessageSquare, Image as ImageIcon,
  Camera, Upload, Moon, Sun, Monitor, Palette
} from 'lucide-react';
import { 
  COUNTRIES_LIST, 
  getZonesForCountry, 
  getCountryByZone, 
  RelationshipStatus, 
  Gender, 
  ThemeMode 
} from '../types';
import { isSoundEnabled, toggleSound, playNotificationChime } from '../utils/sound';

export const SettingsView: React.FC = () => {
  const {
    currentUser,
    friendRequests,
    notifications,
    pushNotification,
    accessLogs,
    isRealtimeSimulationEnabled,
    setIsRealtimeSimulationEnabled,
    simulateIncomingMessage,
    simulateWallComment,
    simulateFriendRequest,
    simulatePhotoInteraction,
    markNotificationAsRead,
    markAllNotificationsAsRead,
    deleteNotification,
    updateUserData,
    acceptFriendRequest,
    ignoreFriendRequest,
    viewUserProfile,
    viewPhoto,
    setActiveTab,
    logout,
    resetToDefaultData,
    theme,
    isDarkMode,
    setTheme,
    toggleTheme
  } = useInkorium();

  const [section, setSection] = useState<'datos' | 'peticiones' | 'notificaciones' | 'ip' | 'seguridad' | 'apariencia'>('datos');
  const [soundActive, setSoundActive] = useState(isSoundEnabled());
  const [showAvatarModal, setShowAvatarModal] = useState(false);
  const [themeNotification, setThemeNotification] = useState<string | null>(null);

  // Form states for personal data
  const [nombre, setNombre] = useState(currentUser.nombre || '');
  const [apellidos, setApellidos] = useState(currentUser.apellidos || '');
  const [sexo, setSexo] = useState<Gender>(currentUser.sexo || 'h');
  const [fnac, setFnac] = useState(currentUser.fnac || '1992-05-15');
  const initialCountry = currentUser.pais || getCountryByZone(currentUser.provincia)?.name || 'España';
  const [pais, setPais] = useState<string>(initialCountry);
  const [provincia, setProvincia] = useState(currentUser.provincia || 'Madrid');
  const [ciudad, setCiudad] = useState(currentUser.ciudad || '');
  const [situacion, setSituacion] = useState<RelationshipStatus>(currentUser.situacionSentimental || 'Soltero/a');
  const [ocupacion, setOcupacion] = useState(currentUser.ocupacion || '');
  const [intereses, setIntereses] = useState(currentUser.intereses || '');
  const [musica, setMusica] = useState(currentUser.musica || '');
  const [savedSuccess, setSavedSuccess] = useState(false);

  // Available zones for selected country in settings
  const currentCountryObj = COUNTRIES_LIST.find(c => c.name.toLowerCase() === pais.toLowerCase()) || COUNTRIES_LIST[0];
  const availableZones = currentCountryObj?.zones || [];

  // Sync state when currentUser updates
  useEffect(() => {
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
  }, [currentUser]);

  const handleCountryChange = (newCountryName: string) => {
    setPais(newCountryName);
    const zones = getZonesForCountry(newCountryName);
    if (zones.length > 0) {
      setProvincia(zones[0]);
    }
  };

  // Security password & email change states
  const [newEmail, setNewEmail] = useState('');
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newPassword2, setNewPassword2] = useState('');
  const [securityMessage, setSecurityMessage] = useState<string | null>(null);

  const pendingRequests = friendRequests.filter(r => r.receptorId === currentUser.id && r.estado === 'pendiente');

  const handleSaveData = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nombre.trim()) return;

    updateUserData({
      nombre: nombre.trim(),
      apellidos: apellidos.trim(),
      full_name: `${nombre.trim()} ${apellidos.trim()}`.trim(),
      sexo,
      fnac,
      pais,
      provincia,
      ciudad: ciudad.trim() || undefined,
      situacionSentimental: situacion,
      ocupacion: ocupacion.trim(),
      intereses: intereses.trim(),
      musica: musica.trim()
    });

    setSavedSuccess(true);
    pushNotification({
      id: `notif-settings-save-${Date.now()}`,
      tipo: 'sistema',
      userId: currentUser.id,
      fromUserId: currentUser.id,
      fromUserName: 'Inkorium Sistema',
      mensaje: 'Has actualizado los datos de tu cuenta correctamente.',
      fecha: 'Ahora mismo',
      leido: true
    });
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  const handleSaveSecurity = (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword && newPassword !== newPassword2) {
      setSecurityMessage('❌ Las contraseñas nuevas no coinciden');
      return;
    }
    if (newEmail) {
      updateUserData({ email: newEmail.trim() });
    }
    setSecurityMessage('✅ Datos de seguridad actualizados con éxito');
    setNewEmail('');
    setOldPassword('');
    setNewPassword('');
    setNewPassword2('');
    setTimeout(() => setSecurityMessage(null), 3000);
  };

  return (
    <div className="w-full max-w-[1720px] 2xl:max-w-[1850px] mx-auto px-3 sm:px-6 lg:px-8 py-4">
      <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
        {/* ================= SIDEBAR (barra_izq) ================= */}
        <div className="md:col-span-4 lg:col-span-3 space-y-3">
          <div className="bg-white rounded border border-[#ccd5df] overflow-hidden text-xs shadow-xs">
            <div className="bg-[#f0f4f8] px-3 py-2 border-b border-[#ccd5df] font-bold text-gray-700 flex items-center gap-1.5">
              <Settings className="w-4 h-4 text-[#3869A0]" />
              <span>Ajustes y Configuración</span>
            </div>

            <div className="divide-y divide-gray-100 font-medium">
              <button
                onClick={() => setSection('datos')}
                className={`w-full text-left px-3 py-2.5 transition cursor-pointer flex items-center justify-between ${
                  section === 'datos' ? 'bg-[#3869A0] text-white font-bold' : 'hover:bg-blue-50 text-gray-800'
                }`}
              >
                <span>Datos de la cuenta</span>
              </button>

              <button
                onClick={() => setSection('peticiones')}
                className={`w-full text-left px-3 py-2.5 transition cursor-pointer flex items-center justify-between ${
                  section === 'peticiones' ? 'bg-[#3869A0] text-white font-bold' : 'hover:bg-blue-50 text-gray-800'
                }`}
              >
                <span>Peticiones de amistad</span>
                {pendingRequests.length > 0 && (
                  <span className="bg-red-500 text-white font-bold px-1.5 py-0.2 rounded-full text-[10px]">
                    {pendingRequests.length}
                  </span>
                )}
              </button>

              <button
                onClick={() => setSection('notificaciones')}
                className={`w-full text-left px-3 py-2.5 transition cursor-pointer flex items-center justify-between ${
                  section === 'notificaciones' ? 'bg-[#3869A0] text-white font-bold' : 'hover:bg-blue-50 text-gray-800'
                }`}
              >
                <div className="flex items-center gap-1.5">
                  <span>Notificaciones y Avisos</span>
                </div>
                <span className="bg-blue-100 text-[#3869A0] font-bold px-1.5 py-0.2 rounded text-[10px]">
                  En vivo
                </span>
              </button>

              <button
                onClick={() => setSection('ip')}
                className={`w-full text-left px-3 py-2.5 transition cursor-pointer flex items-center justify-between ${
                  section === 'ip' ? 'bg-[#3869A0] text-white font-bold' : 'hover:bg-blue-50 text-gray-800'
                }`}
              >
                <span>Control de acceso</span>
              </button>

              <button
                onClick={() => setSection('seguridad')}
                className={`w-full text-left px-3 py-2.5 transition cursor-pointer flex items-center justify-between ${
                  section === 'seguridad' ? 'bg-[#3869A0] text-white font-bold' : 'hover:bg-blue-50 text-gray-800'
                }`}
              >
                <span>Seguridad y Contraseña</span>
              </button>

              <button
                onClick={() => setSection('apariencia')}
                className={`w-full text-left px-3 py-2.5 transition cursor-pointer flex items-center justify-between ${
                  section === 'apariencia' ? 'bg-[#3869A0] text-white font-bold' : 'hover:bg-blue-50 text-gray-800'
                }`}
              >
                <div className="flex items-center gap-1.5">
                  <Palette className="w-3.5 h-3.5 text-[#3869A0] group-hover:text-blue-600" />
                  <span>Apariencia y Tema</span>
                </div>
                <span className={`px-1.5 py-0.2 rounded text-[10px] font-bold flex items-center gap-1 ${
                  theme === 'dark' ? 'bg-indigo-950 text-indigo-200' : theme === 'light' ? 'bg-amber-100 text-amber-800' : 'bg-blue-100 text-[#3869A0]'
                }`}>
                  {theme === 'dark' ? '🌙 Noche' : theme === 'light' ? '☀️ Día' : '💻 Auto'}
                </span>
              </button>
            </div>
          </div>

          {/* Logout Card */}
          <div className="bg-white rounded border border-[#ccd5df] p-3 text-xs shadow-xs space-y-2">
            <span className="font-bold text-gray-700 block">Sesión de usuario</span>
            <p className="text-[11px] text-gray-500">
              Conectado como <strong className="text-gray-800">{currentUser.nombre} {currentUser.apellidos}</strong> ({currentUser.email})
            </p>
            <button
              onClick={logout}
              className="w-full py-1.5 bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 rounded font-bold text-xs transition flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <span>Cerrar sesión</span>
            </button>
          </div>
        </div>

        {/* ================= MAIN SETTINGS SECTION ================= */}
        <div className="md:col-span-8 lg:col-span-9 space-y-4">
          <div className="bg-white dark:bg-[#0e1726] rounded border border-[#ccd5df] dark:border-[#1d2b40] p-4 shadow-xs min-h-[400px]">
            {/* ================= 1. DATOS DE LA CUENTA ================= */}
            {section === 'datos' && (
              <div className="space-y-4 text-xs text-gray-800 dark:text-gray-100">
                <div className="flex items-center justify-between pb-2 border-b border-gray-200 dark:border-slate-800">
                  <h2 className="font-bold text-sm text-gray-900 dark:text-white">Editar datos personales</h2>
                  {savedSuccess && (
                    <span className="text-emerald-700 dark:text-emerald-300 font-bold bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded border border-emerald-200 dark:border-emerald-800 flex items-center gap-1">
                      <Check className="w-3.5 h-3.5" /> Guardado correctamente
                    </span>
                  )}
                </div>

                {/* Avatar / Foto de Perfil Quick Card */}
                <div className="p-3.5 bg-gradient-to-r from-blue-50/70 to-slate-50 dark:from-[#152338]/60 dark:to-[#0f1b2c]/80 border border-blue-200/80 dark:border-[#1d2b40] rounded-lg flex flex-col sm:flex-row items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="relative group w-16 h-16 rounded-full overflow-hidden border-2 border-[#3869A0] shadow-xs flex-shrink-0 bg-white dark:bg-slate-800">
                      <img
                        src={currentUser.avatar}
                        alt={currentUser.nombre}
                        className="w-full h-full object-cover"
                      />
                      <div
                        onClick={() => setShowAvatarModal(true)}
                        className="absolute inset-0 bg-black/50 text-white flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition cursor-pointer"
                        title="Cambiar avatar"
                      >
                        <Camera className="w-3.5 h-3.5" />
                      </div>
                    </div>
                    <div>
                      <div className="font-bold text-gray-800 dark:text-gray-200 text-xs flex items-center gap-1.5">
                        <span>Foto de perfil / Avatar</span>
                        <span className="text-[10px] px-1.5 py-0.2 rounded bg-blue-100 dark:bg-blue-900/60 text-[#3869A0] dark:text-blue-300 font-semibold">Subida activa</span>
                      </div>
                      <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5">
                        Esta imagen se mostrará en tu perfil, tus tablones, fotos y comentarios.
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => setShowAvatarModal(true)}
                    className="px-3.5 py-1.5 bg-[#3869A0] hover:bg-[#2c537f] text-white font-bold rounded shadow-xs text-xs flex items-center gap-1.5 transition cursor-pointer flex-shrink-0"
                  >
                    <Camera className="w-3.5 h-3.5" />
                    <span>Cambiar avatar</span>
                  </button>
                </div>

                <form onSubmit={handleSaveData} className="space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="font-bold text-gray-700 dark:text-gray-300 block mb-1">Nombre:</label>
                      <input
                        type="text"
                        value={nombre}
                        onChange={e => setNombre(e.target.value)}
                        className="w-full p-2 text-xs rounded border border-gray-300 dark:border-slate-700 bg-white dark:bg-[#111c2e] text-gray-900 dark:text-gray-100 focus:outline-none focus:border-[#3869A0]"
                        required
                      />
                    </div>

                    <div>
                      <label className="font-bold text-gray-700 dark:text-gray-300 block mb-1">Apellidos:</label>
                      <input
                        type="text"
                        value={apellidos}
                        onChange={e => setApellidos(e.target.value)}
                        className="w-full p-2 text-xs rounded border border-gray-300 dark:border-slate-700 bg-white dark:bg-[#111c2e] text-gray-900 dark:text-gray-100 focus:outline-none focus:border-[#3869A0]"
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="font-bold text-gray-700 dark:text-gray-300 block mb-1">Sexo:</label>
                      <select
                        value={sexo}
                        onChange={e => setSexo(e.target.value as Gender)}
                        className="w-full p-2 text-xs rounded border border-gray-300 dark:border-slate-700 bg-white dark:bg-[#111c2e] text-gray-900 dark:text-gray-100 focus:outline-none focus:border-[#3869A0]"
                      >
                        <option value="h">Hombre (Chico)</option>
                        <option value="m">Mujer (Chica)</option>
                        <option value="otro">Otro</option>
                      </select>
                    </div>

                    <div>
                      <label className="font-bold text-gray-700 dark:text-gray-300 block mb-1">Fecha de nacimiento:</label>
                      <input
                        type="date"
                        value={fnac}
                        onChange={e => setFnac(e.target.value)}
                        className="w-full p-2 text-xs rounded border border-gray-300 dark:border-slate-700 bg-white dark:bg-[#111c2e] text-gray-900 dark:text-gray-100 focus:outline-none focus:border-[#3869A0]"
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="font-bold text-gray-700 dark:text-gray-300 block mb-1">País:</label>
                      <select
                        value={pais}
                        onChange={e => handleCountryChange(e.target.value)}
                        className="w-full p-2 text-xs rounded border border-gray-300 dark:border-slate-700 bg-white dark:bg-[#111c2e] text-gray-900 dark:text-gray-100 focus:outline-none focus:border-[#3869A0] cursor-pointer"
                      >
                        {COUNTRIES_LIST.map(c => (
                          <option key={c.id} value={c.name}>
                            {c.flag} {c.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="font-bold text-gray-700 dark:text-gray-300 block mb-1">Provincia / Zona / Estado:</label>
                      <select
                        value={provincia}
                        onChange={e => setProvincia(e.target.value)}
                        className="w-full p-2 text-xs rounded border border-gray-300 dark:border-slate-700 bg-white dark:bg-[#111c2e] text-gray-900 dark:text-gray-100 focus:outline-none focus:border-[#3869A0] cursor-pointer"
                      >
                        {availableZones.map(z => (
                          <option key={z} value={z}>{z}</option>
                        ))}
                        {provincia && !availableZones.includes(provincia) && (
                          <option key="custom-provincia" value={provincia}>{provincia}</option>
                        )}
                      </select>
                    </div>

                    <div>
                      <label className="font-bold text-gray-700 dark:text-gray-300 block mb-1">Ciudad / Municipio:</label>
                      <input
                        type="text"
                        value={ciudad}
                        onChange={e => setCiudad(e.target.value)}
                        placeholder="Ej: Madrid centro, Malasaña..."
                        className="w-full p-2 text-xs rounded border border-gray-300 dark:border-slate-700 bg-white dark:bg-[#111c2e] text-gray-900 dark:text-gray-100 focus:outline-none focus:border-[#3869A0]"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="font-bold text-gray-700 dark:text-gray-300 block mb-1">Situación sentimental:</label>
                    <select
                      value={situacion}
                      onChange={e => setSituacion(e.target.value as RelationshipStatus)}
                      className="w-full p-2 text-xs rounded border border-gray-300 dark:border-slate-700 bg-white dark:bg-[#111c2e] text-gray-900 dark:text-gray-100 focus:outline-none focus:border-[#3869A0]"
                    >
                      <option value="Soltero/a">Soltero/a</option>
                      <option value="Con pareja">Con pareja</option>
                      <option value="En una relación">En una relación</option>
                      <option value="Es complicado">Es complicado</option>
                      <option value="De fiesta en fiesta">De fiesta en fiesta</option>
                      <option value="Casado/a">Casado/a</option>
                      <option value="En una relación abierta">En una relación abierta</option>
                      <option value="Buscando el amor">Buscando el amor</option>
                      <option value="Prefiero no decirlo">Prefiero no decirlo</option>
                    </select>
                  </div>

                  <div>
                    <label className="font-bold text-gray-700 dark:text-gray-300 block mb-1">Ocupación / Qué haces:</label>
                    <input
                      type="text"
                      placeholder="Ej: Estudiante de Ingeniería, Diseño Gráfico..."
                      value={ocupacion}
                      onChange={e => setOcupacion(e.target.value)}
                      className="w-full p-2 text-xs rounded border border-gray-300 dark:border-slate-700 bg-white dark:bg-[#111c2e] text-gray-900 dark:text-gray-100 focus:outline-none focus:border-[#3869A0]"
                    />
                  </div>

                  <div>
                    <label className="font-bold text-gray-700 dark:text-gray-300 block mb-1">Intereses y aficiones:</label>
                    <input
                      type="text"
                      placeholder="Ej: Skate, fotografía analógica, videojuegos, salir..."
                      value={intereses}
                      onChange={e => setIntereses(e.target.value)}
                      className="w-full p-2 text-xs rounded border border-gray-300 dark:border-slate-700 bg-white dark:bg-[#111c2e] text-gray-900 dark:text-gray-100 focus:outline-none focus:border-[#3869A0]"
                    />
                  </div>

                  <div>
                    <label className="font-bold text-gray-700 dark:text-gray-300 block mb-1">Música favorita (Canción del perfil):</label>
                    <input
                      type="text"
                      placeholder="Ej: El Canto del Loco, Arctic Monkeys, Vetusta Morla..."
                      value={musica}
                      onChange={e => setMusica(e.target.value)}
                      className="w-full p-2 text-xs rounded border border-gray-300 dark:border-slate-700 bg-white dark:bg-[#111c2e] text-gray-900 dark:text-gray-100 focus:outline-none focus:border-[#3869A0]"
                    />
                  </div>

                  <div className="pt-3 border-t border-gray-200 dark:border-slate-800 flex justify-end">
                    <button
                      type="submit"
                      className="px-5 py-2 bg-[#3869A0] hover:bg-[#2c537f] text-white font-bold rounded transition shadow-xs cursor-pointer text-xs"
                    >
                      Guardar cambios
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* ================= 2. PETICIONES DE AMISTAD ================= */}
            {section === 'peticiones' && (
              <div className="space-y-4 text-xs">
                <h2 className="font-bold text-sm text-gray-900 pb-2 border-b border-gray-200">
                  Peticiones de amistad recibidas ({pendingRequests.length})
                </h2>

                {pendingRequests.length === 0 ? (
                  <div className="text-center py-16 text-gray-400">
                    No tienes peticiones de amistad pendientes en este momento.
                  </div>
                ) : (
                  <div className="divide-y divide-gray-100">
                    {pendingRequests.map(req => (
                      <div key={req.id} className="py-3 flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <img
                            src={req.emisorAvatar}
                            alt=""
                            className="w-11 h-11 rounded object-cover border border-gray-300 cursor-pointer hover:opacity-90"
                            onClick={() => viewUserProfile(req.emisorId)}
                          />
                          <div>
                            <h3
                              onClick={() => viewUserProfile(req.emisorId)}
                              className="font-bold text-[#3869A0] hover:underline cursor-pointer text-xs"
                            >
                              {req.emisorNombre}
                            </h3>
                            <p className="text-gray-500 text-[11px]">{req.emisorProvincia} • {req.fecha}</p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => acceptFriendRequest(req.id)}
                            className="px-3 py-1.5 bg-[#3869A0] hover:bg-[#2c537f] text-white font-bold rounded transition flex items-center gap-1 shadow-xs cursor-pointer text-xs"
                          >
                            <Check className="w-3.5 h-3.5" />
                            <span>Aceptar</span>
                          </button>

                          <button
                            onClick={() => ignoreFriendRequest(req.id)}
                            className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold rounded transition cursor-pointer text-xs"
                          >
                            Ignorar
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* ================= NOTIFICACIONES Y AVISOS ================= */}
            {section === 'notificaciones' && (
              <div className="space-y-5 text-xs">
                <div className="flex items-center justify-between pb-2 border-b border-gray-200">
                  <h2 className="font-bold text-sm text-gray-900 flex items-center gap-1.5">
                    <Bell className="w-4 h-4 text-[#3869A0]" />
                    <span>Configuración de Notificaciones y Avisos</span>
                  </h2>
                  <button
                    onClick={() => setActiveTab('notificaciones')}
                    className="px-3 py-1 bg-[#3869A0] hover:bg-[#2c537f] text-white font-bold rounded text-xs transition cursor-pointer shadow-xs"
                  >
                    Abrir Centro de Avisos Detallado →
                  </button>
                </div>

                {/* Sound & Audio preferences */}
                <div className="p-3 bg-gray-50 border border-gray-200 rounded flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <Volume2 className="w-4 h-4 text-[#3869A0]" />
                    <div>
                      <p className="font-bold text-gray-800 text-xs">Efectos de sonido retro</p>
                      <p className="text-[11px] text-gray-500">Sintetizador Web Audio API original de avisos y clics</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => playNotificationChime()}
                      className="px-2.5 py-1 bg-white hover:bg-gray-100 border border-gray-300 text-gray-700 rounded font-semibold text-xs transition cursor-pointer"
                    >
                      Probar sonido
                    </button>
                    <button
                      onClick={() => {
                        const state = toggleSound();
                        setSoundActive(state);
                      }}
                      className={`px-3 py-1 rounded font-bold text-xs transition cursor-pointer ${
                        soundActive ? 'bg-[#3869A0] text-white' : 'bg-gray-200 text-gray-700'
                      }`}
                    >
                      {soundActive ? 'Sonido activado' : 'Silenciado'}
                    </button>
                  </div>
                </div>

                {/* Full Notification History */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <h3 className="font-bold text-gray-800 text-xs">Historial de Notificaciones ({notifications.filter(n => n.userId === currentUser.id).length})</h3>
                    {notifications.filter(n => n.userId === currentUser.id).length > 0 && (
                      <button
                        onClick={markAllNotificationsAsRead}
                        className="text-[11px] text-[#3869A0] hover:underline font-semibold cursor-pointer"
                      >
                        Marcar todo como leído
                      </button>
                    )}
                  </div>

                  <div className="border border-gray-200 rounded overflow-hidden divide-y divide-gray-100 max-h-[320px] overflow-y-auto">
                    {notifications.filter(n => n.userId === currentUser.id).length === 0 ? (
                      <div className="p-8 text-center text-gray-400">
                        No hay notificaciones registradas todavía.
                      </div>
                    ) : (
                      notifications.filter(n => n.userId === currentUser.id).map(notif => (
                        <div
                          key={notif.id}
                          className={`p-3 flex items-start justify-between gap-3 hover:bg-blue-50/50 transition cursor-pointer ${
                            !notif.leido ? 'bg-blue-50/30 font-medium' : ''
                          }`}
                          onClick={() => {
                            markNotificationAsRead(notif.id);
                            if (notif.enlace === 'perfil' || notif.tipo === 'tablon') viewUserProfile(currentUser.id);
                            else if (notif.enlace === 'fotos' || notif.tipo === 'foto' || notif.tipo === 'etiqueta') {
                              if (notif.targetId) viewPhoto(notif.targetId);
                              else setActiveTab('fotos');
                            }
                            else if (notif.enlace === 'mensajes' || notif.tipo === 'mp') setActiveTab('mensajes');
                            else if (notif.enlace === 'ajustes' || notif.tipo === 'peticion') setSection('peticiones');
                          }}
                        >
                          <div className="flex items-start gap-2.5 flex-1 min-w-0">
                            <img src={notif.fromUserAvatar} alt="" className="w-8 h-8 rounded object-cover border border-gray-300 flex-shrink-0 mt-0.5" />
                            <div className="flex-1 min-w-0">
                              <p className="text-gray-900 text-xs">{notif.mensaje}</p>
                              {notif.detalle && (
                                <p className="text-[11px] text-gray-500 italic mt-0.5 truncate bg-gray-50 p-1 rounded border border-gray-200/60">
                                  "{notif.detalle}"
                                </p>
                              )}
                              <span className="text-[10px] text-gray-400 mt-1 block">{notif.fecha}</span>
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            {!notif.leido && (
                              <span className="w-2 h-2 rounded-full bg-[#3869A0] flex-shrink-0" title="No leído"></span>
                            )}
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                deleteNotification(notif.id);
                              }}
                              className="text-gray-400 hover:text-red-600 transition text-xs p-1"
                              title="Eliminar notificación"
                            >
                              ✕
                            </button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* ================= 3. CONTROL DE ACCESO (IP) ================= */}
            {section === 'ip' && (
              <div className="space-y-4 text-xs">
                <div className="flex items-center justify-between pb-2 border-b border-gray-200">
                  <h2 className="font-bold text-sm text-gray-900 flex items-center gap-1.5">
                    <Shield className="w-4 h-4 text-[#3869A0]" />
                    <span>Registro de accesos e inicios de sesión</span>
                  </h2>
                </div>

                <p className="text-gray-500 text-[11px]">
                  Aquí puedes consultar los últimos inicios de sesión realizados en tu cuenta de Inkorium.
                </p>

                <div className="overflow-x-auto border border-gray-200 rounded">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-gray-50 text-gray-700 font-bold border-b border-gray-200">
                      <tr>
                        <th className="p-2.5">Dirección IP</th>
                        <th className="p-2.5">Navegador y Sistema</th>
                        <th className="p-2.5">Ubicación</th>
                        <th className="p-2.5">Fecha y hora</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {accessLogs.map(log => (
                        <tr key={log.id} className="hover:bg-blue-50/40 transition">
                          <td className="p-2.5 font-mono text-[#3869A0] font-semibold">{log.ip}</td>
                          <td className="p-2.5 text-gray-700">{log.navegador}</td>
                          <td className="p-2.5 text-gray-600">{log.ubicacion}</td>
                          <td className="p-2.5 text-gray-500 text-[11px]">{log.fecha}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* ================= 4. SEGURIDAD Y CONTRASEÑA ================= */}
            {section === 'seguridad' && (
              <div className="space-y-4 text-xs">
                <h2 className="font-bold text-sm text-gray-900 pb-2 border-b border-gray-200 flex items-center gap-1.5">
                  <KeyRound className="w-4 h-4 text-[#3869A0]" />
                  <span>Seguridad de la cuenta</span>
                </h2>

                {securityMessage && (
                  <div className="p-2.5 bg-blue-50 border border-blue-200 rounded text-xs text-blue-900 font-medium">
                    {securityMessage}
                  </div>
                )}

                <form onSubmit={handleSaveSecurity} className="space-y-4 max-w-md">
                  <div>
                    <label className="font-bold text-gray-700 block mb-1">Email actual:</label>
                    <input
                      type="email"
                      value={currentUser.email}
                      disabled
                      className="w-full p-2 bg-gray-100 text-gray-500 rounded border border-gray-300 text-xs"
                    />
                  </div>

                  <div>
                    <label className="font-bold text-gray-700 block mb-1">Nuevo email (opcional):</label>
                    <input
                      type="email"
                      placeholder="nuevo@email.com"
                      value={newEmail}
                      onChange={e => setNewEmail(e.target.value)}
                      className="w-full p-2 rounded border border-gray-300 text-xs focus:outline-none focus:border-[#3869A0]"
                    />
                  </div>

                  <div className="pt-2 border-t border-gray-100">
                    <label className="font-bold text-gray-700 block mb-1">Nueva contraseña:</label>
                    <input
                      type="password"
                      placeholder="••••••••"
                      value={newPassword}
                      onChange={e => setNewPassword(e.target.value)}
                      className="w-full p-2 rounded border border-gray-300 text-xs focus:outline-none focus:border-[#3869A0]"
                    />
                  </div>

                  <div>
                    <label className="font-bold text-gray-700 block mb-1">Repite la nueva contraseña:</label>
                    <input
                      type="password"
                      placeholder="••••••••"
                      value={newPassword2}
                      onChange={e => setNewPassword2(e.target.value)}
                      className="w-full p-2 rounded border border-gray-300 text-xs focus:outline-none focus:border-[#3869A0]"
                    />
                  </div>

                  <div className="pt-2">
                    <button
                      type="submit"
                      className="px-5 py-2 bg-[#3869A0] hover:bg-[#2c537f] text-white font-bold rounded transition shadow-xs cursor-pointer text-xs"
                    >
                      Actualizar seguridad
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* SECTION: APARIENCIA Y TEMA (MODO OSCURO / CLARO) */}
            {section === 'apariencia' && (
              <div>
                <div className="border-b border-[#ccd5df] pb-3 mb-4">
                  <div className="flex items-center gap-2">
                    <div className="p-2 rounded bg-indigo-50 dark:bg-indigo-950/60 text-[#3869A0] dark:text-indigo-400">
                      <Palette className="w-5 h-5" />
                    </div>
                    <div>
                      <h2 className="font-bold text-base text-gray-900 dark:text-white">
                        Apariencia y Tema Visual
                      </h2>
                      <p className="text-gray-500 dark:text-gray-400 text-xs">
                        Personaliza la interfaz de Inkorium eligiendo entre el diseño clásico diurno, el modo oscuro nocturno o sincronización con tu sistema operativo.
                      </p>
                    </div>
                  </div>
                </div>

                {themeNotification && (
                  <div className="mb-4 p-3 bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 rounded flex items-center justify-between text-emerald-800 dark:text-emerald-300 text-xs animate-in fade-in duration-200">
                    <div className="flex items-center gap-2 font-semibold">
                      <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                      <span>{themeNotification}</span>
                    </div>
                    <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-mono">Guardado en LocalStorage</span>
                  </div>
                )}

                {/* Selector Cards Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
                  {/* Modo Claro */}
                  <div
                    onClick={() => {
                      setTheme('light');
                      setThemeNotification('Modo Claro (Clásico Tuenti) activado.');
                      setTimeout(() => setThemeNotification(null), 3500);
                    }}
                    className={`relative p-3.5 rounded-lg border-2 cursor-pointer transition-all duration-200 flex flex-col justify-between ${
                      theme === 'light'
                        ? 'border-[#3869A0] bg-blue-50/50 dark:bg-blue-950/20 shadow-md ring-2 ring-[#3869A0]/20'
                        : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800/80 hover:border-gray-300 dark:hover:border-gray-600'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between mb-2.5">
                        <div className="w-8 h-8 rounded-full bg-amber-100 dark:bg-amber-900/40 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                          <Sun className="w-4 h-4" />
                        </div>
                        {theme === 'light' && (
                          <span className="bg-[#3869A0] text-white text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                            <Check className="w-3 h-3" /> Activo
                          </span>
                        )}
                      </div>
                      <h3 className="font-bold text-xs text-gray-900 dark:text-white">Modo Claro</h3>
                      <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-1 leading-snug">
                        El aspecto clásico e icónico de la red social original (2006-2010) con fondo celeste y azul corporativo.
                      </p>
                    </div>

                    <div className="mt-3 pt-2.5 border-t border-gray-200/80 dark:border-gray-700/80 flex items-center justify-between">
                      <div className="flex items-center gap-1">
                        <span className="w-3.5 h-3.5 rounded-full bg-[#3869A0] border border-white" title="#3869A0 (Azul Tuenti)" />
                        <span className="w-3.5 h-3.5 rounded-full bg-[#e8eef4] border border-gray-300" title="#e8eef4 (Fondo claro)" />
                        <span className="w-3.5 h-3.5 rounded-full bg-white border border-gray-300" title="#ffffff (Tarjetas)" />
                      </div>
                      <span className="text-[10px] font-bold text-[#3869A0] dark:text-blue-400">
                        {theme === 'light' ? 'Seleccionado' : 'Elegir claro'}
                      </span>
                    </div>
                  </div>

                  {/* Modo Oscuro */}
                  <div
                    onClick={() => {
                      setTheme('dark');
                      setThemeNotification('Modo Oscuro (Noche Inkorium) activado.');
                      setTimeout(() => setThemeNotification(null), 3500);
                    }}
                    className={`relative p-3.5 rounded-lg border-2 cursor-pointer transition-all duration-200 flex flex-col justify-between ${
                      theme === 'dark'
                        ? 'border-[#60a5fa] bg-slate-900 shadow-md ring-2 ring-[#60a5fa]/30 text-white'
                        : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800/80 hover:border-gray-300 dark:hover:border-gray-600'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between mb-2.5">
                        <div className="w-8 h-8 rounded-full bg-indigo-900/60 text-indigo-300 flex items-center justify-center">
                          <Moon className="w-4 h-4" />
                        </div>
                        {theme === 'dark' && (
                          <span className="bg-blue-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                            <Check className="w-3 h-3" /> Activo
                          </span>
                        )}
                      </div>
                      <h3 className="font-bold text-xs text-gray-900 dark:text-white">Modo Oscuro</h3>
                      <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-1 leading-snug">
                        Paleta nocturna de alto contraste con tonos azul profundo y grafito para descansar la vista en la noche.
                      </p>
                    </div>

                    <div className="mt-3 pt-2.5 border-t border-gray-200/80 dark:border-gray-700/80 flex items-center justify-between">
                      <div className="flex items-center gap-1">
                        <span className="w-3.5 h-3.5 rounded-full bg-[#0b1120] border border-slate-700" title="#0b1120 (Fondo noche)" />
                        <span className="w-3.5 h-3.5 rounded-full bg-[#1e293b] border border-slate-700" title="#1e293b (Tarjetas oscuras)" />
                        <span className="w-3.5 h-3.5 rounded-full bg-[#3869A0] border border-slate-600" title="#3869A0 (Acento)" />
                      </div>
                      <span className="text-[10px] font-bold text-blue-500 dark:text-blue-400">
                        {theme === 'dark' ? 'Seleccionado' : 'Elegir oscuro'}
                      </span>
                    </div>
                  </div>

                  {/* Modo Automático */}
                  <div
                    onClick={() => {
                      setTheme('auto');
                      setThemeNotification('Modo Automático activado (Sincronizado con SO).');
                      setTimeout(() => setThemeNotification(null), 3500);
                    }}
                    className={`relative p-3.5 rounded-lg border-2 cursor-pointer transition-all duration-200 flex flex-col justify-between ${
                      theme === 'auto'
                        ? 'border-[#3869A0] dark:border-blue-400 bg-blue-50/50 dark:bg-blue-950/20 shadow-md ring-2 ring-[#3869A0]/20'
                        : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800/80 hover:border-gray-300 dark:hover:border-gray-600'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between mb-2.5">
                        <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 flex items-center justify-center">
                          <Monitor className="w-4 h-4" />
                        </div>
                        {theme === 'auto' && (
                          <span className="bg-[#3869A0] text-white text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                            <Check className="w-3 h-3" /> Activo
                          </span>
                        )}
                      </div>
                      <h3 className="font-bold text-xs text-gray-900 dark:text-white">Automático</h3>
                      <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-1 leading-snug">
                        Cambia automáticamente de claro a oscuro basándose en las preferencias de tema de tu sistema operativo o navegador.
                      </p>
                    </div>

                    <div className="mt-3 pt-2.5 border-t border-gray-200/80 dark:border-gray-700/80 flex items-center justify-between">
                      <span className="text-[10px] text-gray-500 font-mono">
                        Actual: {isDarkMode ? '🌙 Noche' : '☀️ Día'}
                      </span>
                      <span className="text-[10px] font-bold text-[#3869A0] dark:text-blue-400">
                        {theme === 'auto' ? 'Seleccionado' : 'Elegir auto'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Quick Toggle switch bar */}
                <div className="bg-[#f0f4f8] dark:bg-slate-900/80 p-3.5 rounded border border-[#ccd5df] dark:border-slate-700 mb-6 flex flex-col sm:flex-row items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-full bg-white dark:bg-slate-800 border border-gray-300 dark:border-slate-700 text-gray-700 dark:text-gray-300">
                      {isDarkMode ? <Moon className="w-4 h-4 text-indigo-400" /> : <Sun className="w-4 h-4 text-amber-500" />}
                    </div>
                    <div>
                      <p className="font-bold text-xs text-gray-800 dark:text-gray-200">
                        Alternancia rápida: {isDarkMode ? 'Tema Oscuro Activo' : 'Tema Claro Activo'}
                      </p>
                      <p className="text-[11px] text-gray-500 dark:text-gray-400">
                        Haz clic en el botón para alternar instantáneamente entre modo diurno y nocturno.
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={toggleTheme}
                    className="px-4 py-2 bg-[#3869A0] hover:bg-[#2c537f] text-white font-bold rounded transition text-xs flex items-center gap-1.5 shadow-xs cursor-pointer"
                  >
                    {isDarkMode ? <Sun className="w-3.5 h-3.5" /> : <Moon className="w-3.5 h-3.5" />}
                    <span>Cambiar a modo {isDarkMode ? 'Claro' : 'Oscuro'}</span>
                  </button>
                </div>

                {/* Live Simulation Preview Box */}
                <div className="border border-gray-200 dark:border-slate-700 rounded-lg p-4 bg-white dark:bg-slate-900/60 shadow-xs">
                  <div className="flex items-center justify-between pb-2 mb-3 border-b border-gray-200 dark:border-slate-700">
                    <div className="flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-[#3869A0] dark:text-blue-400" />
                      <span className="font-bold text-xs text-gray-900 dark:text-white">
                        Previsualización en Vivo de la Interfaz
                      </span>
                    </div>
                    <span className="text-[10px] px-2 py-0.5 rounded bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-gray-300 font-mono">
                      Modo {theme.toUpperCase()} ({isDarkMode ? 'Oscuro' : 'Claro'})
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    {/* Sample Post Preview */}
                    <div className="p-3 rounded border border-[#ccd5df] dark:border-slate-700 bg-white dark:bg-slate-800/90 shadow-2xs space-y-2">
                      <div className="flex items-center gap-2">
                        <img src={currentUser.avatar} alt="" className="w-7 h-7 rounded object-cover border border-gray-300 dark:border-slate-600" />
                        <div>
                          <p className="font-bold text-xs text-[#3869A0] dark:text-blue-400 leading-tight">
                            {currentUser.nombre} {currentUser.apellidos}
                          </p>
                          <span className="text-[10px] text-gray-400">Hace 5 minutos • en el tablón</span>
                        </div>
                      </div>
                      <p className="text-gray-800 dark:text-gray-200 text-xs">
                        ¡Probando el nuevo modo oscuro en Inkorium! Las clases globales de Tailwind y la persistencia local funcionan al 100%. ✨
                      </p>
                      <div className="flex items-center gap-2 text-[11px] pt-1 text-gray-500 dark:text-gray-400">
                        <span className="text-[#3869A0] dark:text-blue-400 font-bold">♥ Me gusta</span>
                        <span>•</span>
                        <span>Comentar (3)</span>
                      </div>
                    </div>

                    {/* Sample Badges & Chat preview */}
                    <div className="p-3 rounded border border-[#ccd5df] dark:border-slate-700 bg-[#f4f7fa] dark:bg-slate-800/50 shadow-2xs space-y-2 flex flex-col justify-between">
                      <div>
                        <p className="font-bold text-xs text-gray-800 dark:text-gray-200 mb-1">
                          Elementos visuales y estado
                        </p>
                        <div className="flex flex-wrap gap-1.5 mt-1">
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-100 dark:bg-blue-950 text-[#3869A0] dark:text-blue-300">
                            🟢 Conectado
                          </span>
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300">
                            💬 Chat activo
                          </span>
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-100 dark:bg-purple-950 text-purple-800 dark:text-purple-300">
                            📸 14 Fotos
                          </span>
                        </div>
                      </div>

                      <p className="text-[11px] text-gray-500 dark:text-gray-400 pt-2 border-t border-gray-200 dark:border-slate-700">
                        💾 Tu preferencia se guarda automáticamente en <code className="font-mono text-[10px] bg-gray-200 dark:bg-slate-700 px-1 py-0.5 rounded">localStorage['inkorium:theme']</code> para futuras visitas.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Avatar Modal */}
      <AvatarModal
        isOpen={showAvatarModal}
        onClose={() => setShowAvatarModal(false)}
      />
    </div>
  );
};
