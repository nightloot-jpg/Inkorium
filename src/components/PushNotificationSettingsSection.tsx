import React, { useState, useEffect } from 'react';
import { 
  Bell, 
  BellRing, 
  BellOff, 
  Cpu, 
  CheckCircle2, 
  AlertTriangle, 
  XCircle, 
  RefreshCw, 
  Send, 
  Sparkles, 
  ShieldCheck, 
  Volume2, 
  VolumeX, 
  MessageSquare, 
  FileText, 
  Users, 
  Image as ImageIcon, 
  Calendar,
  ExternalLink,
  Laptop,
  Smartphone
} from 'lucide-react';
import { useInkorium } from '../context/InkoriumContext';
import { 
  getDetailedServiceWorkerStatus, 
  requestPushNotificationPermission, 
  subscribeUserToPushNotifications, 
  unsubscribeUserFromPushNotifications,
  savePushPreferences,
  getStoredPushPreferences,
  triggerTestPushNotification,
  getOrRegisterServiceWorker
} from '../lib/pushSubscription';
import { PushNotificationPreferences, ServiceWorkerStatusInfo } from '../types';

export const PushNotificationSettingsSection: React.FC = () => {
  const { currentUser } = useInkorium();

  const [loading, setLoading] = useState(false);
  const [testSending, setTestSending] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [testType, setTestType] = useState<'mensaje' | 'tablon' | 'amigo'>('tablon');

  const [swStatus, setSwStatus] = useState<ServiceWorkerStatusInfo>({
    isSupported: true,
    isRegistered: false,
    state: 'not-registered',
    permission: 'default',
    isSubscribed: false
  });

  const [preferences, setPreferences] = useState<PushNotificationPreferences>(() => {
    return currentUser ? getStoredPushPreferences(currentUser.id) : {
      enabled: true,
      mensajes: true,
      comentarios_tablon: true,
      amigos: true,
      etiquetas: true,
      eventos: true,
      sonido: true,
    };
  });

  const [saveFeedback, setSaveFeedback] = useState<string | null>(null);

  // Cargar estado real del Service Worker
  const refreshStatus = async () => {
    try {
      const status = await getDetailedServiceWorkerStatus();
      setSwStatus(status);
    } catch (e) {
      console.warn('Error refreshing SW status:', e);
    }
  };

  useEffect(() => {
    refreshStatus();
    if (currentUser) {
      const stored = getStoredPushPreferences(currentUser.id);
      setPreferences(stored);
    }
  }, [currentUser]);

  // Manejar el toggle maestro de notificaciones Push
  const handleMasterToggle = async () => {
    if (!currentUser) return;
    setLoading(true);
    setSaveFeedback(null);

    try {
      if (!preferences.enabled || !swStatus.isSubscribed) {
        // Suscribir
        const res = await subscribeUserToPushNotifications(currentUser.id, {
          ...preferences,
          enabled: true
        });

        if (res.success) {
          const updated = { ...preferences, enabled: true };
          setPreferences(updated);
          setSaveFeedback('✅ Notificaciones push activadas y suscritas en el Service Worker.');
        } else {
          setSaveFeedback(`❌ ${res.error || 'No se pudo completar la suscripción'}`);
        }
      } else {
        // Desuscribir
        const res = await unsubscribeUserFromPushNotifications(currentUser.id);
        if (res.success) {
          const updated = { ...preferences, enabled: false };
          setPreferences(updated);
          setSaveFeedback('🔕 Notificaciones push desactivadas para este navegador.');
        } else {
          setSaveFeedback(`❌ ${res.error || 'Error al cancelar la suscripción'}`);
        }
      }
      await refreshStatus();
    } catch (err: any) {
      setSaveFeedback(`❌ Error: ${err?.message || 'Fallo inesperado'}`);
    } finally {
      setLoading(false);
      setTimeout(() => setSaveFeedback(null), 5000);
    }
  };

  // Guardar cambio en una preferencia específica
  const handlePreferenceChange = async (key: keyof PushNotificationPreferences) => {
    if (!currentUser) return;
    const updated = {
      ...preferences,
      [key]: !preferences[key]
    };
    setPreferences(updated);
    await savePushPreferences(currentUser.id, updated);
    setSaveFeedback('Preferencias guardadas');
    setTimeout(() => setSaveFeedback(null), 2500);
  };

  // Re-registrar Service Worker
  const handleReregisterSW = async () => {
    setLoading(true);
    try {
      await getOrRegisterServiceWorker();
      await refreshStatus();
      setSaveFeedback('⚡ Service Worker verificado y activo.');
    } catch (e: any) {
      setSaveFeedback(`❌ Error al re-registrar: ${e?.message || 'Error desconocido'}`);
    } finally {
      setLoading(false);
      setTimeout(() => setSaveFeedback(null), 4000);
    }
  };

  // Solicitar permisos de notificación
  const handleRequestPermission = async () => {
    const perm = await requestPushNotificationPermission();
    await refreshStatus();
    if (perm === 'granted') {
      setSaveFeedback('✅ Permiso de notificaciones concedido por el navegador.');
    } else if (perm === 'denied') {
      setSaveFeedback('⚠️ Permiso denegado por el usuario.');
    }
    setTimeout(() => setSaveFeedback(null), 4000);
  };

  // Enviar prueba
  const handleSendTestPush = async () => {
    if (!currentUser) return;
    setTestSending(true);
    setTestResult(null);
    try {
      const res = await triggerTestPushNotification(currentUser.id, testType);
      setTestResult(res);
    } catch (err: any) {
      setTestResult({
        success: false,
        message: err?.message || 'Error al emitir la notificación de prueba'
      });
    } finally {
      setTestSending(false);
      await refreshStatus();
    }
  };

  return (
    <div id="push-notifications-settings" className="space-y-6">
      {/* 1. Header & Master Switch */}
      <div className="bg-white border border-[#B8D0EB] rounded p-5 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div className={`p-3 rounded-lg flex items-center justify-center ${
              preferences.enabled && swStatus.isSubscribed
                ? 'bg-[#EBF2FA] text-[#3869A0] border border-[#B8D0EB]'
                : 'bg-gray-100 text-gray-400 border border-gray-200'
            }`}>
              {preferences.enabled && swStatus.isSubscribed ? (
                <BellRing className="w-7 h-7 animate-bounce text-[#3869A0]" />
              ) : (
                <BellOff className="w-7 h-7 text-gray-500" />
              )}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-bold text-[#1E3A5F]">Notificaciones Push de Inkorium</h3>
                <span className="text-[10px] px-2 py-0.5 font-bold uppercase tracking-wider bg-[#3869A0] text-white rounded">
                  PWA Web Push
                </span>
              </div>
              <p className="text-xs text-gray-600 mt-1 max-w-xl leading-relaxed">
                Recibe avisos inmediatos en tu escritorio o dispositivo móvil sobre mensajes privados, 
                firmas en tu tablón y nuevas amistades, incluso cuando la ventana esté en segundo plano.
              </p>
            </div>
          </div>

          <div className="flex flex-col items-end gap-1 shrink-0">
            <button
              id="master-push-toggle-btn"
              type="button"
              disabled={loading}
              onClick={handleMasterToggle}
              className={`px-5 py-2.5 rounded text-sm font-bold shadow-sm transition-all flex items-center gap-2 cursor-pointer ${
                preferences.enabled && swStatus.isSubscribed
                  ? 'bg-emerald-600 hover:bg-emerald-700 text-white border border-emerald-700'
                  : 'bg-[#3869A0] hover:bg-[#2C5584] text-white border border-[#23446A]'
              } ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              {loading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Procesando...</span>
                </>
              ) : preferences.enabled && swStatus.isSubscribed ? (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Push Activado</span>
                </>
              ) : (
                <>
                  <Bell className="w-4 h-4" />
                  <span>Activar Notificaciones</span>
                </>
              )}
            </button>
            <span className="text-[11px] text-gray-500 font-medium">
              {preferences.enabled && swStatus.isSubscribed
                ? 'Suscripción activa en este navegador'
                : 'Haz clic para permitir y suscribirte'}
            </span>
          </div>
        </div>

        {saveFeedback && (
          <div className="mt-3.5 p-2.5 bg-[#EBF2FA] border border-[#B8D0EB] text-xs font-semibold text-[#1E3A5F] rounded flex items-center justify-between animate-fadeIn">
            <span>{saveFeedback}</span>
            <button onClick={() => setSaveFeedback(null)} className="text-gray-400 hover:text-gray-600">×</button>
          </div>
        )}
      </div>

      {/* 2. Monitor de Estado del Service Worker */}
      <div className="bg-[#F8FAFC] border border-[#CBD5E1] rounded overflow-hidden shadow-xs">
        <div className="bg-[#E2E8F0] px-4 py-2.5 border-b border-[#CBD5E1] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Cpu className="w-4 h-4 text-[#334155]" />
            <h4 className="text-xs font-bold text-[#1E293B] uppercase tracking-wider">
              Diagnóstico del Service Worker & Entorno PWA
            </h4>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={refreshStatus}
              title="Actualizar diagnóstico"
              className="text-xs flex items-center gap-1 text-[#334155] hover:text-[#0F172A] font-semibold px-2 py-1 bg-white border border-[#CBD5E1] rounded shadow-2xs cursor-pointer hover:bg-slate-50"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Verificar</span>
            </button>
          </div>
        </div>

        <div className="p-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
          {/* Tarjeta: Registro de SW */}
          <div className="bg-white p-3 rounded border border-slate-200">
            <span className="text-[11px] font-semibold text-slate-500 block mb-1">Service Worker</span>
            <div className="flex items-center gap-1.5">
              {swStatus.isRegistered ? (
                <>
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
                  <span className="font-bold text-emerald-700">Registrado y Activo</span>
                </>
              ) : (
                <>
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
                  <span className="font-bold text-amber-700">No Registrado</span>
                </>
              )}
            </div>
            <span className="text-[10px] text-slate-400 block mt-1 truncate">
              Script: {swStatus.scriptUrl || '/sw.js'}
            </span>
          </div>

          {/* Tarjeta: Permiso del Navegador */}
          <div className="bg-white p-3 rounded border border-slate-200">
            <span className="text-[11px] font-semibold text-slate-500 block mb-1">Permiso del Navegador</span>
            <div className="flex items-center gap-1.5">
              {swStatus.permission === 'granted' ? (
                <>
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span className="font-bold text-emerald-700">Concedido</span>
                </>
              ) : swStatus.permission === 'denied' ? (
                <>
                  <XCircle className="w-4 h-4 text-red-600" />
                  <span className="font-bold text-red-700">Bloqueado / Denegado</span>
                </>
              ) : (
                <>
                  <AlertTriangle className="w-4 h-4 text-amber-600" />
                  <span className="font-bold text-amber-700">Pendiente de Solicitud</span>
                </>
              )}
            </div>
            {swStatus.permission !== 'granted' && (
              <button
                onClick={handleRequestPermission}
                className="mt-1 text-[10px] text-[#3869A0] font-bold underline hover:text-[#23446A] cursor-pointer"
              >
                Solicitar permiso ahora →
              </button>
            )}
          </div>

          {/* Tarjeta: Suscripción Web Push */}
          <div className="bg-white p-3 rounded border border-slate-200">
            <span className="text-[11px] font-semibold text-slate-500 block mb-1">Suscripción Web Push</span>
            <div className="flex items-center gap-1.5">
              {swStatus.isSubscribed ? (
                <>
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  <span className="font-bold text-emerald-700">Conectado (PushManager)</span>
                </>
              ) : (
                <>
                  <AlertTriangle className="w-4 h-4 text-slate-400" />
                  <span className="font-bold text-slate-600">Inactiva</span>
                </>
              )}
            </div>
            <span className="text-[10px] text-slate-400 block mt-1 truncate">
              {swStatus.endpoint ? `Endpoint: ${swStatus.endpoint.slice(0, 24)}...` : 'Sin endpoint activo'}
            </span>
          </div>

          {/* Tarjeta: Alcance y Acciones */}
          <div className="bg-white p-3 rounded border border-slate-200 flex flex-col justify-between">
            <div>
              <span className="text-[11px] font-semibold text-slate-500 block mb-1">Alcance (Scope)</span>
              <span className="font-mono text-[11px] font-bold text-slate-700">
                {swStatus.registrationScope || '/'}
              </span>
            </div>
            <button
              onClick={handleReregisterSW}
              className="mt-2 text-[10px] text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 px-2 py-1 rounded border border-slate-300 font-semibold cursor-pointer text-center"
            >
              Re-inicializar SW
            </button>
          </div>
        </div>
      </div>

      {/* 3. Preferencias Granulares por Tipo */}
      <div className="bg-white border border-[#B8D0EB] rounded overflow-hidden shadow-sm">
        <div className="bg-[#EBF2FA] px-4 py-3 border-b border-[#B8D0EB]">
          <h4 className="text-sm font-bold text-[#1E3A5F] flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-[#3869A0]" />
            <span>Preferencias de Notificación por Tipo de Actividad</span>
          </h4>
          <p className="text-xs text-gray-600 mt-0.5">
            Personaliza qué eventos deben generar un aviso emergente en tu dispositivo.
          </p>
        </div>

        <div className="p-4 space-y-3.5">
          {/* Tipo 1: Mensajes Privados */}
          <div className="flex items-center justify-between p-3 rounded-md hover:bg-slate-50 border border-transparent hover:border-slate-200 transition-colors">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-blue-50 text-blue-700 rounded border border-blue-200 shrink-0 mt-0.5">
                <MessageSquare className="w-4 h-4" />
              </div>
              <div>
                <span className="text-sm font-bold text-gray-900 block">Mensajes Privados (MPs)</span>
                <span className="text-xs text-gray-500 block mt-0.5">
                  Recibe avisos inmediatos cuando un amigo o usuario te envíe un mensaje a tu buzón.
                </span>
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={preferences.mensajes}
                onChange={() => handlePreferenceChange('mensajes')}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#3869A0]"></div>
            </label>
          </div>

          {/* Tipo 2: Tablón de firmas y comentarios */}
          <div className="flex items-center justify-between p-3 rounded-md hover:bg-slate-50 border border-transparent hover:border-slate-200 transition-colors">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-amber-50 text-amber-700 rounded border border-amber-200 shrink-0 mt-0.5">
                <FileText className="w-4 h-4" />
              </div>
              <div>
                <span className="text-sm font-bold text-gray-900 block">Firmas y Comentarios en tu Tablón</span>
                <span className="text-xs text-gray-500 block mt-0.5">
                  Notifícame cada vez que alguien escriba una firma en mi perfil o comente en mis posts.
                </span>
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={preferences.comentarios_tablon}
                onChange={() => handlePreferenceChange('comentarios_tablon')}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#3869A0]"></div>
            </label>
          </div>

          {/* Tipo 3: Nuevos Amigos y Peticiones */}
          <div className="flex items-center justify-between p-3 rounded-md hover:bg-slate-50 border border-transparent hover:border-slate-200 transition-colors">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-emerald-50 text-emerald-700 rounded border border-emerald-200 shrink-0 mt-0.5">
                <Users className="w-4 h-4" />
              </div>
              <div>
                <span className="text-sm font-bold text-gray-900 block">Nuevos Amigos y Solicitudes de Amistad</span>
                <span className="text-xs text-gray-500 block mt-0.5">
                  Avisos cuando alguien te envíe una solicitud de amistad o acepte tu petición.
                </span>
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={preferences.amigos}
                onChange={() => handlePreferenceChange('amigos')}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#3869A0]"></div>
            </label>
          </div>

          {/* Tipo 4: Etiquetas en Fotos */}
          <div className="flex items-center justify-between p-3 rounded-md hover:bg-slate-50 border border-transparent hover:border-slate-200 transition-colors">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-purple-50 text-purple-700 rounded border border-purple-200 shrink-0 mt-0.5">
                <ImageIcon className="w-4 h-4" />
              </div>
              <div>
                <span className="text-sm font-bold text-gray-900 block">Etiquetas en Fotos</span>
                <span className="text-xs text-gray-500 block mt-0.5">
                  Avisos cuando te etiqueten en una foto o álbum de recuerdos.
                </span>
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={preferences.etiquetas}
                onChange={() => handlePreferenceChange('etiquetas')}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#3869A0]"></div>
            </label>
          </div>

          {/* Tipo 5: Eventos y Quedadas */}
          <div className="flex items-center justify-between p-3 rounded-md hover:bg-slate-50 border border-transparent hover:border-slate-200 transition-colors">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-indigo-50 text-indigo-700 rounded border border-indigo-200 shrink-0 mt-0.5">
                <Calendar className="w-4 h-4" />
              </div>
              <div>
                <span className="text-sm font-bold text-gray-900 block">Eventos y Quedadas</span>
                <span className="text-xs text-gray-500 block mt-0.5">
                  Invitaciones a eventos y confirmaciones de tus amigos.
                </span>
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={preferences.eventos}
                onChange={() => handlePreferenceChange('eventos')}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#3869A0]"></div>
            </label>
          </div>

          {/* Tipo 6: Sonido retro */}
          <div className="flex items-center justify-between p-3 rounded-md bg-slate-50/70 border border-slate-200">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-slate-200 text-slate-700 rounded border border-slate-300 shrink-0 mt-0.5">
                {preferences.sonido ? <Volume2 className="w-4 h-4 text-[#3869A0]" /> : <VolumeX className="w-4 h-4 text-gray-400" />}
              </div>
              <div>
                <span className="text-sm font-bold text-gray-900 block">Tono de Notificación Retro</span>
                <span className="text-xs text-gray-500 block mt-0.5">
                  Reproducir el icónico sonido de notificación nostálgico al recibir avisos en pantalla.
                </span>
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={preferences.sonido}
                onChange={() => handlePreferenceChange('sonido')}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#3869A0]"></div>
            </label>
          </div>
        </div>
      </div>

      {/* 4. Banco de Pruebas en Vivo */}
      <div className="bg-white border border-[#B8D0EB] rounded p-5 shadow-sm">
        <div className="flex items-center justify-between border-b border-gray-100 pb-3 mb-4">
          <div className="flex items-center gap-2">
            <Send className="w-4 h-4 text-[#3869A0]" />
            <h4 className="text-sm font-bold text-[#1E3A5F]">Probar Entrega de Notificación Push</h4>
          </div>
          <span className="text-[11px] text-gray-500 font-mono">Service Worker Test Channel</span>
        </div>

        <p className="text-xs text-gray-600 mb-4 leading-relaxed">
          Comprueba instantáneamente que el Service Worker y el sistema de notificaciones de tu navegador 
          reciben y muestran las notificaciones de Inkorium.
        </p>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <div className="flex rounded border border-gray-300 overflow-hidden text-xs font-semibold">
            <button
              type="button"
              onClick={() => setTestType('tablon')}
              className={`px-3.5 py-2 cursor-pointer transition-colors ${
                testType === 'tablon' ? 'bg-[#3869A0] text-white' : 'bg-white text-gray-700 hover:bg-gray-50'
              }`}
            >
              📝 Firma Tablón
            </button>
            <button
              type="button"
              onClick={() => setTestType('mensaje')}
              className={`px-3.5 py-2 cursor-pointer border-l border-gray-300 transition-colors ${
                testType === 'mensaje' ? 'bg-[#3869A0] text-white' : 'bg-white text-gray-700 hover:bg-gray-50'
              }`}
            >
              💬 Mensaje Privado
            </button>
            <button
              type="button"
              onClick={() => setTestType('amigo')}
              className={`px-3.5 py-2 cursor-pointer border-l border-gray-300 transition-colors ${
                testType === 'amigo' ? 'bg-[#3869A0] text-white' : 'bg-white text-gray-700 hover:bg-gray-50'
              }`}
            >
              👥 Nueva Amistad
            </button>
          </div>

          <button
            id="send-test-push-btn"
            type="button"
            disabled={testSending || swStatus.permission === 'denied'}
            onClick={handleSendTestPush}
            className={`px-4 py-2 bg-[#3869A0] hover:bg-[#2C5584] text-white text-xs font-bold rounded shadow-sm flex items-center justify-center gap-2 cursor-pointer transition-colors ${
              testSending || swStatus.permission === 'denied' ? 'opacity-50 cursor-not-allowed' : ''
            }`}
          >
            {testSending ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                <span>Enviando prueba...</span>
              </>
            ) : (
              <>
                <Send className="w-3.5 h-3.5" />
                <span>Emitir Notificación de Prueba</span>
              </>
            )}
          </button>
        </div>

        {testResult && (
          <div className={`mt-3.5 p-3 rounded text-xs font-medium flex items-center gap-2 border ${
            testResult.success
              ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
              : 'bg-red-50 text-red-800 border-red-200'
          }`}>
            {testResult.success ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : (
              <XCircle className="w-4 h-4 text-red-600 shrink-0" />
            )}
            <span>{testResult.message}</span>
          </div>
        )}
      </div>

      {/* 5. Guía de Dispositivos y Navegadores */}
      <div className="bg-[#FAFBFD] border border-slate-200 rounded p-4 text-xs text-slate-600 space-y-2">
        <div className="font-bold text-slate-800 flex items-center gap-1.5">
          <Laptop className="w-4 h-4 text-[#3869A0]" />
          <span>Compatibilidad con Navegadores y Móviles (PWA)</span>
        </div>
        <p className="text-[11px] leading-relaxed text-slate-600">
          • <strong>Google Chrome / Edge / Firefox (PC y Mac)</strong>: Soporte completo nativo con avisos flotantes en el escritorio.<br />
          • <strong>Android</strong>: Funciona con Chrome, Edge y al instalar la PWA de Inkorium en la pantalla de inicio.<br />
          • <strong>iOS / Safari (iPhone/iPad)</strong>: Requiere iOS 16.4 o superior añadiendo la app a la Pantalla de Inicio ("Compartir" → "Añadir a la pantalla de inicio").
        </p>
      </div>
    </div>
  );
};
