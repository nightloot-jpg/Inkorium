import React, { Component, type ErrorInfo, type ReactNode, useEffect, useState } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { supabase } from '../lib/supabase';
import { MusicView } from './music/MusicView';
import { VideoView } from './videos/VideoView';
import { EventsView } from './events/EventsView';

const BRIDGE_ID = 'inkorium-route-content-bridge';
const ROUTE_PAGES = new Set(['musica', 'videos', 'eventos']);

type RoutePage = 'musica' | 'videos' | 'eventos';

type RouteErrorBoundaryProps = { children: ReactNode };
type RouteErrorBoundaryState = { error: Error | null };

class RouteErrorBoundary extends Component<RouteErrorBoundaryProps, RouteErrorBoundaryState> {
  state: RouteErrorBoundaryState = { error: null };

  static getDerivedStateFromError(error: Error): RouteErrorBoundaryState {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('[Inkorium route]', error, info);
  }

  render() {
    if (this.state.error) {
      return (
        <div style={{ minHeight: '100%', padding: 32, background: '#f3f6fa', color: '#26364d', fontFamily: 'Arial, Helvetica, sans-serif' }}>
          <div style={{ maxWidth: 720, margin: '0 auto', background: '#fff', border: '1px solid #e4e7ee', borderRadius: 8, padding: 24 }}>
            <h2 style={{ margin: '0 0 8px' }}>No se ha podido cargar esta sección</h2>
            <p style={{ margin: 0, color: '#66788b' }}>{this.state.error.message}</p>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

function readRoute(): string {
  const hash = window.location.hash.replace(/^#/, '').trim();
  if (ROUTE_PAGES.has(hash)) return hash;
  return sessionStorage.getItem('inkorium-page') || 'inicio';
}

function setRoute(next: string): void {
  if (!ROUTE_PAGES.has(next)) return;
  sessionStorage.setItem('inkorium-page', next);
  window.dispatchEvent(new CustomEvent('inkorium-route-change', { detail: next }));
}

function RouteContentBridge() {
  const [page, setPage] = useState(() => readRoute());
  const [session, setSession] = useState<any>(null);
  const [sessionReady, setSessionReady] = useState(false);
  const [username, setUsername] = useState('');

  useEffect(() => {
    let active = true;

    async function loadSession() {
      const { data } = await supabase.auth.getSession();
      if (!active) return;
      setSession(data.session);
      setSessionReady(true);

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
      setSessionReady(true);
      if (!nextSession) setUsername('');
    });

    return () => {
      active = false;
      auth.data.subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    const syncRoute = () => setPage(readRoute());
    const onStorage = () => syncRoute();
    const onHash = () => syncRoute();
    const onRouteChange = () => syncRoute();

    window.addEventListener('storage', onStorage);
    window.addEventListener('hashchange', onHash);
    window.addEventListener('inkorium-route-change', onRouteChange);

    const handleNavigationClick = (event: MouseEvent) => {
      const target = event.target as HTMLElement | null;
      const candidate = target?.closest('button, a, [role="button"], [data-page], [data-route]') as HTMLElement | null;
      if (!candidate) return;

      const routeValue = candidate.getAttribute('data-page') || candidate.getAttribute('data-route');
      const label = candidate.textContent?.replace(/\s+/g, ' ').trim().toLowerCase();
      const next = routeValue || (label === 'eventos' ? 'eventos' : label === 'música' ? 'musica' : label === 'vídeos' ? 'videos' : '');
      if (!ROUTE_PAGES.has(next)) return;

      setRoute(next);
      setPage(next);

      if (next === 'eventos') {
        event.preventDefault();
        event.stopPropagation();
      }
    };

    document.addEventListener('click', handleNavigationClick, true);
    syncRoute();

    const timer = window.setInterval(syncRoute, 250);
    return () => {
      window.removeEventListener('storage', onStorage);
      window.removeEventListener('hashchange', onHash);
      window.removeEventListener('inkorium-route-change', onRouteChange);
      document.removeEventListener('click', handleNavigationClick, true);
      window.clearInterval(timer);
    };
  }, []);

  if (!sessionReady) return null;
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
        zIndex: 1000,
        overflow: 'auto',
        background: '#f3f6fa',
      }}
    >
      <RouteErrorBoundary>
        {routePage === 'musica' && <MusicView session={session} navigate={() => {}} />}
        {routePage === 'videos' && <VideoView session={session} navigate={() => {}} />}
        {routePage === 'eventos' && (
          <EventsView
            session={session}
            username={username}
            onExit={() => {
              sessionStorage.setItem('inkorium-page', 'inicio');
              window.history.replaceState({}, '', window.location.pathname);
              window.dispatchEvent(new Event('inkorium-route-change'));
              setPage('inicio');
            }}
          />
        )}
      </RouteErrorBoundary>
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
