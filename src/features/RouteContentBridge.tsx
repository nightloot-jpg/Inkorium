import React, { useEffect, useState } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { supabase } from '../lib/supabase';
import { MusicView } from './music/MusicView';
import { VideoView } from './videos/VideoView';
import { EventsView } from './events/EventsView';

const BRIDGE_ID = 'inkorium-route-content-bridge';
const ROUTE_PAGES = new Set(['musica', 'videos', 'eventos']);

type RoutePage = 'musica' | 'videos' | 'eventos';

function RouteContentBridge() {
  const [page, setPage] = useState(() => sessionStorage.getItem('inkorium-page') || 'inicio');
  const [session, setSession] = useState<any>(null);
  const [username, setUsername] = useState('');

  useEffect(() => {
    let active = true;

    async function loadSession() {
      const { data } = await supabase.auth.getSession();
      if (!active) return;
      setSession(data.session);

      if (data.session) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('username, full_name')
          .eq('id', data.session.user.id)
          .maybeSingle();
        if (!active) return;
        setUsername(profile?.username || profile?.full_name || data.session.user.email?.split('@')[0] || 'Usuario');
      }
    }

    void loadSession();

    const auth = supabase.auth.onAuthStateChange((_event, nextSession) => {
      if (!active) return;
      setSession(nextSession);
      if (!nextSession) setUsername('');
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
    }, 100);
    return () => window.clearInterval(timer);
  }, []);

  if (!session || !ROUTE_PAGES.has(page)) return null;

  const routePage = page as RoutePage;

  return (
    <div
      className="inkorium-route-bridge"
      data-route-page={routePage}
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
      {routePage === 'musica' && <MusicView session={session} navigate={() => {}} />}
      {routePage === 'videos' && <VideoView session={session} navigate={() => {}} />}
      {routePage === 'eventos' && (
        <EventsView
          session={session}
          username={username}
          onExit={() => {
            sessionStorage.setItem('inkorium-page', 'inicio');
            window.dispatchEvent(new Event('inkorium-route-change'));
          }}
        />
      )}
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
