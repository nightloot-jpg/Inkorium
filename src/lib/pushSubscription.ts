import { PushNotificationPreferences, ServiceWorkerStatusInfo } from '../types';

export const DEFAULT_PUSH_PREFERENCES: PushNotificationPreferences = {
  enabled: true,
  mensajes: true,
  comentarios_tablon: true,
  amigos: true,
  etiquetas: true,
  eventos: true,
  sonido: true,
};

const PREFS_STORAGE_KEY_PREFIX = 'inkorium:push_preferences:';

/**
 * Convierte una clave VAPID pública en formato Base64 URL a un Uint8Array para el PushManager
 */
export function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding)
    .replace(/-/g, '+')
    .replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

/**
 * Comprueba si el entorno y el navegador soportan Service Workers y Push Notifications
 */
export function isPushNotificationSupported(): boolean {
  if (typeof window === 'undefined') return false;
  return (
    'serviceWorker' in navigator &&
    'PushManager' in window &&
    'Notification' in window
  );
}

/**
 * Obtiene el estado actual del permiso de notificaciones del navegador
 */
export function getNotificationPermissionState(): NotificationPermission {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return 'denied';
  }
  return Notification.permission;
}

/**
 * Obtiene las preferencias guardadas localmente para el usuario
 */
export function getStoredPushPreferences(userId: string): PushNotificationPreferences {
  if (typeof window === 'undefined') return DEFAULT_PUSH_PREFERENCES;
  try {
    const raw = localStorage.getItem(`${PREFS_STORAGE_KEY_PREFIX}${userId}`);
    if (raw) {
      return { ...DEFAULT_PUSH_PREFERENCES, ...JSON.parse(raw) };
    }
  } catch (err) {
    console.warn('[Push] Error reading stored preferences:', err);
  }
  return DEFAULT_PUSH_PREFERENCES;
}

/**
 * Guarda las preferencias en localStorage y sincroniza con el backend
 */
export async function savePushPreferences(
  userId: string,
  prefs: PushNotificationPreferences
): Promise<PushNotificationPreferences> {
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(`${PREFS_STORAGE_KEY_PREFIX}${userId}`, JSON.stringify(prefs));
    } catch {}
  }

  try {
    await fetch(`/api/push/preferences/${encodeURIComponent(userId)}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(prefs)
    });
  } catch (err) {
    console.warn('[Push] Could not sync preferences with server:', err);
  }

  return prefs;
}

/**
 * Registra o recupera el registro del Service Worker
 */
export async function getOrRegisterServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  if (!isPushNotificationSupported()) return null;

  try {
    // 1. Verificar si ya hay un registro existente
    let registration = await navigator.serviceWorker.getRegistration();
    if (registration) {
      return registration;
    }

    // 2. Registrar sw.js o el service worker principal
    registration = await navigator.serviceWorker.register('/sw.js', {
      scope: '/'
    });

    // Esperar a que el service worker esté listo
    await navigator.serviceWorker.ready;
    return registration;
  } catch (err) {
    console.warn('[Push] Service Worker registration failed, attempting ready promise:', err);
    try {
      return await navigator.serviceWorker.ready;
    } catch {
      return null;
    }
  }
}

/**
 * Obtiene el diagnóstico completo del Service Worker y Push
 */
export async function getDetailedServiceWorkerStatus(): Promise<ServiceWorkerStatusInfo> {
  const isSupported = isPushNotificationSupported();
  const permission = getNotificationPermissionState();

  if (!isSupported) {
    return {
      isSupported: false,
      isRegistered: false,
      state: 'not-registered',
      permission,
      isSubscribed: false
    };
  }

  try {
    const registration = await navigator.serviceWorker.getRegistration();
    if (!registration) {
      return {
        isSupported: true,
        isRegistered: false,
        state: 'not-registered',
        permission,
        isSubscribed: false,
        lastUpdated: new Date().toLocaleTimeString()
      };
    }

    const sw = registration.active || registration.installing || registration.waiting;
    let subscription: PushSubscription | null = null;
    
    if (registration.pushManager) {
      try {
        subscription = await registration.pushManager.getSubscription();
      } catch (e) {
        console.warn('[Push] Error getting pushManager subscription:', e);
      }
    }

    return {
      isSupported: true,
      isRegistered: true,
      registrationScope: registration.scope,
      scriptUrl: sw?.scriptURL || '/sw.js',
      state: sw ? (sw.state as any) : 'installed',
      permission,
      isSubscribed: Boolean(subscription),
      endpoint: subscription ? subscription.endpoint : undefined,
      lastUpdated: new Date().toLocaleTimeString()
    };
  } catch (err) {
    return {
      isSupported: true,
      isRegistered: false,
      state: 'not-registered',
      permission,
      isSubscribed: false,
      lastUpdated: new Date().toLocaleTimeString()
    };
  }
}

/**
 * Solicita permisos de notificación al usuario
 */
export async function requestPushNotificationPermission(): Promise<NotificationPermission> {
  if (!('Notification' in window)) {
    return 'denied';
  }
  try {
    const permission = await Notification.requestPermission();
    return permission;
  } catch (err) {
    console.warn('[Push] Notification permission request error:', err);
    return Notification.permission;
  }
}

/**
 * Obtiene la clave VAPID pública desde el backend
 */
export async function fetchVapidPublicKey(): Promise<string> {
  try {
    const res = await fetch('/api/push/vapid-public-key');
    if (res.ok) {
      const data = await res.json();
      if (data.publicKey) return data.publicKey;
    }
  } catch (err) {
    console.warn('[Push] Failed to fetch VAPID key from server:', err);
  }
  // Clave VAPID pública fallback por defecto para el entorno
  return 'BEl62iUYgUivxIkv69yViEuiBIa-Ib9-SkvMeAtA3LFgDzkrxZJjSgSnfckjBJuBkr3qBUYIHBQFLXYp5Nksh8U';
}

/**
 * Suscribe al usuario al servicio de notificaciones Push del navegador
 */
export async function subscribeUserToPushNotifications(
  userId: string,
  userPreferences?: PushNotificationPreferences
): Promise<{ success: boolean; subscription?: PushSubscription; error?: string }> {
  if (!isPushNotificationSupported()) {
    return { success: false, error: 'Las notificaciones push no están soportadas en este navegador o ventana.' };
  }

  try {
    // 1. Solicitar permisos de notificación
    const permission = await requestPushNotificationPermission();
    if (permission !== 'granted') {
      return { 
        success: false, 
        error: permission === 'denied' 
          ? 'Has bloqueado los permisos de notificación en tu navegador. Debes permitirlos en los ajustes del sitio.' 
          : 'Se requiere permiso de notificaciones para continuar.' 
      };
    }

    // 2. Obtener el Service Worker activo
    const registration = await getOrRegisterServiceWorker();
    if (!registration) {
      return { success: false, error: 'No se pudo inicializar el Service Worker del PWA.' };
    }

    // 3. Obtener la clave VAPID
    const vapidKey = await fetchVapidPublicKey();
    const convertedKey = urlBase64ToUint8Array(vapidKey);

    // 4. Suscribir a PushManager
    let subscription = await registration.pushManager.getSubscription();
    if (!subscription) {
      subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: convertedKey
      });
    }

    const currentPrefs = userPreferences || getStoredPushPreferences(userId);

    // 5. Enviar la suscripción al servidor Inkorium
    const subJSON = subscription.toJSON();
    const payload = {
      userId,
      subscription: subJSON,
      preferences: currentPrefs,
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'Unknown'
    };

    const serverRes = await fetch('/api/push/subscribe', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (!serverRes.ok) {
      console.warn('[Push] Backend subscription response not OK:', serverRes.status);
    }

    // 6. Guardar localmente
    savePushPreferences(userId, { ...currentPrefs, enabled: true });

    return { success: true, subscription };
  } catch (err: any) {
    console.error('[Push] Error subscribing to push:', err);
    return { 
      success: false, 
      error: err?.message || 'Ocurrió un error al registrar la suscripción Push en el navegador.' 
    };
  }
}

/**
 * Cancela la suscripción Push del navegador
 */
export async function unsubscribeUserFromPushNotifications(
  userId: string
): Promise<{ success: boolean; error?: string }> {
  if (!isPushNotificationSupported()) {
    return { success: true };
  }

  try {
    const registration = await navigator.serviceWorker.getRegistration();
    if (registration) {
      const subscription = await registration.pushManager.getSubscription();
      if (subscription) {
        await subscription.unsubscribe();
        
        // Notificar al backend
        try {
          await fetch('/api/push/unsubscribe', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              userId,
              endpoint: subscription.endpoint
            })
          });
        } catch (e) {}
      }
    }

    // Actualizar preferencia local
    const currentPrefs = getStoredPushPreferences(userId);
    savePushPreferences(userId, { ...currentPrefs, enabled: false });

    return { success: true };
  } catch (err: any) {
    console.error('[Push] Error unsubscribing:', err);
    return { success: false, error: err?.message || 'Error al cancelar la suscripción.' };
  }
}

/**
 * Envía una notificación de prueba a través del Service Worker y el backend
 */
export async function triggerTestPushNotification(
  userId: string,
  type: 'mensaje' | 'tablon' | 'amigo' | 'sistema' = 'tablon'
): Promise<{ success: boolean; message: string }> {
  // 1. Intentar enviar a través del backend push
  try {
    const res = await fetch('/api/push/test', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, type })
    });

    if (res.ok) {
      const data = await res.json();
      return { 
        success: true, 
        message: data.message || 'Notificación push enviada con éxito desde el Service Worker.' 
      };
    }
  } catch (err) {
    console.warn('[Push] Test push server call failed, trying local SW fallback:', err);
  }

  // 2. Fallback local mediante Service Worker registration.showNotification
  try {
    const reg = await navigator.serviceWorker.getRegistration();
    if (reg) {
      let title = 'Inkorium - Notificación de prueba';
      let body = '¡El Service Worker está funcionando correctamente en Inkorium!';
      
      if (type === 'mensaje') {
        title = '💬 Nuevo mensaje privado';
        body = 'Sara Gómez: "¿Vienes este sábado a la quedada? Confírmame cuando puedas!"';
      } else if (type === 'tablon') {
        title = '📝 Nueva firma en tu tablón';
        body = 'Alejandro Ramos ha firmado en tu tablón: "¡Qué buenas fotos las del finde! Un abrazo :)"';
      } else if (type === 'amigo') {
        title = '👥 Nueva solicitud de amistad';
        body = 'Lucía Navarro te ha añadido a sus amigos en Inkorium.';
      }

      await reg.showNotification(title, {
        body,
        icon: '/pwa-192x192.png',
        badge: '/pwa-192x192.png',
        tag: `test-push-${Date.now()}`,
        vibrate: [200, 100, 200],
        data: {
          url: '/',
          tab: type === 'mensaje' ? 'mensajes' : type === 'tablon' ? 'perfil' : 'notificaciones',
          type
        }
      } as any);

      return {
        success: true,
        message: 'Notificación de prueba mostrada a través del Service Worker registrado.'
      };
    }
  } catch (err: any) {
    return {
      success: false,
      message: `No se pudo mostrar la notificación: ${err?.message || 'Permiso denegado'}`
    };
  }

  return {
    success: false,
    message: 'El Service Worker no está disponible o las notificaciones están bloqueadas.'
  };
}
