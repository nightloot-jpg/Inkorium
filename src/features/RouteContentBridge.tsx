import React, { useEffect, useState } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { supabase } from '../lib/supabase';
import { MusicView } from './music/MusicView';
import { VideoView } from './videos/VideoView';

const BRIDGE_ID = 'inkorium-route-content-bridge';

function RouteContentBridge() {
  const [page, setPage] = useState(() => sessionStorage.getItem('inkorium-page') || 'inicio');
  const [session, setSession] = useState<any>(null);

  useEffect(() => {
    let active = true;
    supabase.auth.getSession().then(({ data }) => {
      if (active) setSession(data.session);
    });
    const auth = supabase.auth.onAuthStateChange((_event, nextSession) => {
      if (active) setSession(nextSession);
    });
    return () => {
      active = false;
      auth.data.subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    let last = sessionStorage.getItem('inkorium-page') || 'inicio';
    const timer = window.setInterval(() => {
      const next = sessionStorage.getItem('inkorium-page') || 'inicio';
      if (next !== last) {
        last = next;
        setPage(next);
      }
    }, 150);
    return () => window.clearInterval(timer);
  }, []);

  if (!session || (page !== 'musica' && page !== 'videos')) return null;

  return (
    <div
      className="inkorium-route-bridge"
      style={{
        position: 'fixed',
        top: 57,
        left: '320px',
        right: 0,
        bottom: 0,
        zIndex: 40,
        overflow: 'auto',
        background: '#f3f6fa',
      }}
    >
      {page === 'musica' ? <MusicView session={session} navigate={() => {}} /> : <VideoView session={session} navigate={() => {}} />}
    </div>
  );
}

export function mountRouteContentBridge() {
  if (document.getElementById(BRIDGE_ID)) return;
  const host = document.createElement('div');
  host.id = BRIDGE_ID;
  document.body.appendChild(host);
  const root: Root = createRoot(host);
  root.render(<RouteContentBridge />);
}

mountRouteContentBridge();
