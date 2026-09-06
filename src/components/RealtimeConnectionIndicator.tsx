import React, { useEffect, useState } from 'react';
import { LoaderCircle, Wifi } from 'lucide-react';
import {
  isRealtimeConnectedEvent,
  isRealtimeReconnectEvent
} from '../lib/networkConnectionMonitor';

export const RealtimeConnectionIndicator: React.FC = () => {
  const [isReconnecting, setIsReconnecting] = useState(false);

  useEffect(() => {
    const handleReconnect = (event: Event) => {
      if (isRealtimeReconnectEvent(event)) setIsReconnecting(true);
    };

    const handleConnected = (event: Event) => {
      if (isRealtimeConnectedEvent(event)) setIsReconnecting(false);
    };

    window.addEventListener('inkorium:realtime-reconnecting', handleReconnect);
    window.addEventListener('inkorium:realtime-connected', handleConnected);

    return () => {
      window.removeEventListener('inkorium:realtime-reconnecting', handleReconnect);
      window.removeEventListener('inkorium:realtime-connected', handleConnected);
    };
  }, []);

  if (!isReconnecting) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed bottom-4 left-1/2 z-[60] -translate-x-1/2 flex items-center gap-2 rounded-full border border-slate-200 bg-white/95 px-4 py-2 text-xs font-semibold text-slate-700 shadow-xl backdrop-blur dark:border-slate-700 dark:bg-[#152338]/95 dark:text-slate-100"
    >
      <LoaderCircle className="h-4 w-4 animate-spin text-[#3869A0]" aria-hidden="true" />
      <span>Reconectando...</span>
      <Wifi className="h-3.5 w-3.5 opacity-60" aria-hidden="true" />
    </div>
  );
};
