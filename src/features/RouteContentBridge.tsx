import React, { Component, type ErrorInfo, type ReactNode, useEffect, useState } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { supabase } from '../lib/supabase';
import { MusicView } from './music/MusicView';
import { VideoView } from './videos/VideoView';
import { EventsView } from './events/EventsView';

const BRIDGE_ID = 'inkorium-route-content-bridge';
const ROUTE_PAGES = new Set([
  'inicio', 'perfil', 'mensajes', 'personas', 'musica', 'buscar', 'fotos', 'videos', 'eventos',
]);
const BRIDGED_ROUTE_PAGES = new Set(['musica', 'videos', 'eventos']);

type RoutePage = 'inicio' | 'perfil' | 'mensajes' | 'personas' | 'musica' | 'buscar' | 'fotos' | 'videos' | 'eventos';
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
  const hash = window.location.hash.replace(/^#/, '').trim().toLowerCase();
  const path = window.location.pathname.replace(/\/+$/, '').split('/').pop()?.toLowerCase() || '';
  const stored = sessionStorage.getItem('inkorium-page')?.trim().toLowerCase() || '';
  if (ROUTE_PAGES.has(hash)) return hash;
  if (ROUTE_PAGES.has(path)) return path;
  if (ROUTE_PAGES.has(stored)) return stored;
  return 'inicio';
}

function setRoute(next: RoutePage): void {
  sessionStorage.setItem('inkorium-page', next);
  window.dispatchEvent(new CustomEvent('inkorium-route-change', { detail: next }));
}

function normalizeRouteLabel(value: string): string {
  return value
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase()
    .replace(/^[^a-záéíóúüñ]+/i, '')
    .replace(/[^a-záéíóúüñ]+$/i, '');
}

function routeFromLabel(value: string): RoutePage | null {
  const label = normalizeRouteLabel(value);
  if (!label) return null;
  if (label.includes('inicio') || label.includes('novedades')) return 'inicio';
  if (label.includes('perfil')) return 'perfil';
  if (label.includes('mensajes')) return 'mensajes';
  if (label.includes('personas')) return 'personas';
  if (label.includes('música') || label.includes('musica')) return 'musica';
  if (label.includes('buscar')) return 'buscar';
  if (label.includes('fotos')) return 'fotos';
  if (label.includes('vídeos') || label.includes('videos')) return 'videos';
  if (label.includes('eventos')) return 'eventos';
  if (label.includes('grupos') || label.includes('páginas') || label.includes('paginas') || label.includes('configuracion')) return 'personas';
  if (label.includes('encuestas') || label.includes('guardados')) return 'buscar';
  return null;
}

function getClickedRoute(target: HTMLElement | null): RoutePage | null {
  if (!target) return null;
  const candidate = target.closest('button, a, [role="button"], [data-page], [data-route]') as HTMLElement | null;
  if (!candidate) return null;

  const routeValue = candidate.getAttribute('data-page') || candidate.getAttribute('data-route');
  if (routeValue) {
    const route = routeFromLabel(routeValue);
    if (route) return route;
  }

  return routeFromLabel(candidate.textContent || '');
}

function findShellNavigationButton(route: RoutePage): HTMLElement | null {
  const selectors = ['.top-nav button', '.side-menu button'];
  const candidates = selectors.flatMap((selector) => Array.from(document.querySelectorAll<HTMLElement>(selector)));
  return candidates.find((button) => routeFromLabel(button.textContent || '') === route) || null;
}

function RouteContentBridge() {
  const [page, setPage] = useState(() => readRoute());
  const [session, setSession] = useState<any>(null);
  const [sessionReady, setSessionReady] = useState(false);
  const [username, setUsername] = useState('');

  useEffect(() => {
    let active = true;
    let profileRequest = 0;

    const loadUsername = async (nextSession: any) => {
      const requestId = ++profileRequest;
      if (!nextSession) {
        if (active) setUsername('');
        return;
      }

      // Always show a stable identity immediately. The profile lookup can fail
      // because of a transient RLS/network issue, but that must never make the
      // authenticated user look logged out on Events.
      const fallback = nextSession.user.email?.split('@')[0] || 'Usuario';
      setUsername(fallback);

      const { data: profile } = await supabase
        .from('profiles')
        .select('username, full_name')
        .eq('id', nextSession.user.id)
        .maybeSingle();

      if (!active || requestId !== profileRequest) return;
      setUsername(profile?.username || profile?.full_name || fallback);
    };

    const applySession = (nextSession: any) => {
      if (!active) return;
      setSession(nextSession);
      setSessionReady(true);
      // Supabase auth callbacks run inside the auth lock. Defer the profile
      // query until the callback has returned so navigation cannot interfere
      // with session hydration.
      window.setTimeout(() => void loadUsername(nextSession), 0);
    };

    async function loadSession() {
      const { data, error } = await supabase.auth.getSession();
      if (!active) return;
      if (error) {
        setSession(null);
        setSessionReady(true);
        setUsername('');
        return;
      }
      setSession(data.session);
      setSessionReady(true);
      void loadUsername(data.session);
    }

    void loadSession();

    const auth = supabase.auth.onAuthStateChange((_event, nextSession) => {
      applySession(nextSession);
    });

    return () => {
      active = false;
      profileRequest += 1;
      auth.data.subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    const syncRoute = () => setPage(readRoute());
    const onStorage = () => syncRoute();
    const onHash = () => syncRoute();
    const onRouteChange = () => syncRoute();
    let replayingShellNavigation = false;

    window.addEventListener('storage', onStorage);
    window.addEventListener('hashchange', onHash);
    window.addEventListener('inkorium-route-change', onRouteChange);

    const handleNavigationClick = (event: MouseEvent) => {
      if (replayingShellNavigation) return;

      const route = getClickedRoute(event.target as HTMLElement | null);
      if (!route) return;

      if (route === 'musica' || route === 'videos' || route === 'eventos') {
        setRoute(route);
        setPage(route);

        if (route === 'eventos') {
          event.preventDefault();
          event.stopPropagation();
          window.history.replaceState({}, '', `${window.location.pathname}#eventos`);
        }
        return;
      }

      const shellButton = findShellNavigationButton(route);
      if (!shellButton) return;

      event.preventDefault();
      event.stopPropagation();
      replayingShellNavigation = true;
      try {
        shellButton.click();
      } finally {
        replayingShellNavigation = false;
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

  const isRoute = BRIDGED_ROUTE_PAGES.has(page);
  const isEvents = page === 'eventos';

  // The bridge is only responsible for standalone Music, Videos and Events.
  // Shell pages such as Feed, Profile and Messages already render inside the
  // application's normal layout. Rendering a fixed bridge for those routes
  // would cover the shell with an empty opaque layer and make the Feed look
  // collapsed while also hiding the global chat launcher.
  if (!isRoute) return null;
  if (!isEvents && !sessionReady) {
    return (
      <div style={{ position: 'fixed', inset: 0, zIndex: 10000, display: 'grid', placeItems: 'center', background: '#f3f6fa', color: '#5b2db5', fontFamily: 'Arial, Helvetica, sans-serif' }}>
        Cargando Inkorium…
      </div>
    );
  }
  if (!isEvents && !session) return null;

  const routePage = page as RoutePage;

  return (
    <div
      className="inkorium-route-bridge"
      data-route-page={routePage}
      style={{
        position: 'fixed',
        top: isEvents ? 0 : 57,
        left: isEvents ? 0 : 320,
        right: 0,
        bottom: 0,
        zIndex: 10000,
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
            username={username || session?.user?.email?.split('@')[0] || 'Usuario'}
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
