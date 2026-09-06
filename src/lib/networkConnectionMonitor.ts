type RealtimeConnectionEvent = CustomEvent<{ url?: string; reason?: string }>;

const EVENT_RECONNECTING = 'inkorium:realtime-reconnecting';
const EVENT_CONNECTED = 'inkorium:realtime-connected';
const INSTALL_GUARD = '__inkoriumRealtimeWebSocketInterceptorInstalled';

const emitConnectionEvent = (type: string, detail: { url?: string; reason?: string }) => {
  if (typeof window === 'undefined') return;
  try {
    window.dispatchEvent(new CustomEvent(type, { detail }));
  } catch {
    // Best-effort UI signal only.
  }
};

const isSupabaseRealtimeWebSocket = (url: string): boolean => {
  try {
    const parsed = new URL(url, typeof window !== 'undefined' ? window.location.origin : undefined);
    return parsed.protocol === 'wss:' && /(^|\.)supabase\.co$/i.test(parsed.hostname) && parsed.pathname.includes('/realtime/');
  } catch {
    return false;
  }
};

export const notifyRealtimeReconnect = (reason = 'channel_error') => {
  emitConnectionEvent(EVENT_RECONNECTING, { reason });
};

export const notifyRealtimeConnected = (reason = 'channel_subscribed') => {
  emitConnectionEvent(EVENT_CONNECTED, { reason });
};

export const installRealtimeWebSocketInterceptor = (): void => {
  if (typeof window === 'undefined' || typeof window.WebSocket !== 'function') return;

  const win = window as Window & {
    [INSTALL_GUARD]?: boolean;
  };
  if (win[INSTALL_GUARD]) return;
  win[INSTALL_GUARD] = true;

  const NativeWebSocket = window.WebSocket;
  let failedConnections = 0;

  class MonitoredWebSocket extends NativeWebSocket {
    private readonly monitoredUrl: string;
    private opened = false;

    constructor(url: string | URL, protocols?: string | string[]) {
      super(url, protocols as any);
      this.monitoredUrl = String(url);

      if (!isSupabaseRealtimeWebSocket(this.monitoredUrl)) return;

      this.addEventListener('open', () => {
        this.opened = true;
        if (failedConnections > 0) {
          failedConnections = 0;
          emitConnectionEvent(EVENT_CONNECTED, { url: this.monitoredUrl });
        }
      });

      this.addEventListener('error', () => {
        failedConnections += 1;
        notifyRealtimeReconnect('websocket_error');
      });

      this.addEventListener('close', (event) => {
        if (event.wasClean && this.opened) return;
        failedConnections += 1;
        notifyRealtimeReconnect(event.reason || `close_${event.code || 'unknown'}`);
      });
    }
  }

  Object.defineProperties(MonitoredWebSocket, {
    CONNECTING: { value: NativeWebSocket.CONNECTING },
    OPEN: { value: NativeWebSocket.OPEN },
    CLOSING: { value: NativeWebSocket.CLOSING },
    CLOSED: { value: NativeWebSocket.CLOSED }
  });

  window.WebSocket = MonitoredWebSocket;
};

export const isRealtimeReconnectEvent = (event: Event): boolean => event.type === EVENT_RECONNECTING;
export const isRealtimeConnectedEvent = (event: Event): boolean => event.type === EVENT_CONNECTED;
export type { RealtimeConnectionEvent };

// Install before the Supabase client is created so every Realtime socket is intercepted centrally.
installRealtimeWebSocketInterceptor();
