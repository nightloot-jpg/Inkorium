import React, { Component, type ErrorInfo, type ReactNode, useEffect, useState } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { supabase } from '../lib/supabase';
import { MusicView } from './music/MusicView';
import { VideoView } from './videos/VideoView';
import { EventsView } from './events/EventsView';
import { ProfileView } from './profile/ProfileView';

const BRIDGE_ID = 'inkorium-route-content-bridge';
const ROUTE_PAGES = new Set([
  'inicio', 'perfil', 'mensajes', 'personas', 'musica', 'buscar', 'fotos', 'videos', 'eventos',
]);
const BRIDGED_ROUTE_PAGES = new Set(['perfil', 'musica', 'videos', 'eventos']);

type RoutePage = 'inicio' | 'perfil' | 'mensajes' | 'personas' | 'musica' | 'buscar' | 'fotos' | 'videos' | 'eventos';
type RouteState = { page: string; params?: Record<string, any> };
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

function readRouteState(): RouteState {
  const hash = window.location.hash.replace(/^#/, '').trim().toLowerCase();
  const path = window.location.pathname.replace(/\/+$/, '').split('/').pop()?.toLowerCase() || '';
  const stored = sessionStorage.getItem('inkorium-page')?.trim().toLowerCase() || '';

  let page = 'inicio';
  if (ROUTE_PAGES.has(hash)) page = hash;
  else if (ROUTE_PAGES.has(path)) page = path;
  else if (ROUTE_PAGES.has(stored)) page = stored;

  let params: Record<string, any> | undefined;
  try {
    const raw = sessionStorage.getItem('inkorium-history');
    const history = raw ? JSON.parse(raw) : null;
    const current = Array.isArray(history) ? history[history.length - 1] : null;
    if (current?.page === page && current?.params && typeof current.params === 'object') {
      params = current.params;
    }
  } catch {
    params = undefined;
  }

  return { page, params };
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

  if (!candidate.closest('.top-nav, .side-menu')) return null;

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

function appendNavigationEntry(page: RoutePage, params?: Record<string, any>) {
  try {
    const raw = sessionStorage.getItem('inkorium-history');
    const history = raw ? JSON.parse(raw) : [];
    const next = Array.isArray(history) ? [...history, { page, params }] : [{ page, params }];
    sessionStorage.setItem('inkorium-history', JSON.stringify(next));
  } catch {
    sessionStorage.setItem('inkorium-history', JSON.stringify([{ page, params }]));
  }
  sessionStorage.setItem('inkorium-page', page);
  window.dispatchEvent(new CustomEvent('inkorium-route-change', { detail: page }));
}

function RouteContentBridge() {
  const [routeState, setRouteState] = useState<RouteState>(() => readRouteState());
  const [session, setSession] = useState<any>(null);
  const [sessionReady, setSessionReady] = useState(false);
  const [username, setUsername] = useState('');
  const [profile, setProfile] = useState<any>(null);

  useEffect(() => {
    let active = true;
    let profileRequest = 0;

    const loadUsername = async (nextSession: any) => {
      const requestId = ++profileRequest;
      if (!nextSession) {
        if (active) {
          setUsername('');
          setProfile(null);
        }
        return;
      }

      const fallback = nextSession.user.email?.split('@')[0] || 'Usuario';
      setUsername(fallback);

      const { data: profileData } = await supabase
        .from('profiles')
        .select('id, username, full_name, bio, city, avatar_url, banner_url')
        .eq('id', nextSession.user.id)
        .maybeSingle();

      if (!active || requestId !== profileRequest) return;
      setProfile(profileData || null);
      setUsername(profileData?.username || profileData?.full_name || fallback);
    };

    const applySession = (nextSession: any) => {
      if (!active) return;
      setSession(nextSession);
      setSessionReady(true);
      window.setTimeout(() => void loadUsername(nextSession), 0);
    };

    async function loadSession() {
      const { data, error } = await supabase.auth.getSession();
      if (!active) return;
      if (error) {
        setSession(null);
        setSessionReady(true);
        setUsername('');
        setProfile(null);
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
    const syncRoute = () => setRouteState(readRouteState());
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

      if (route === 'musica' || route === 'videos' || route === 'eventos' || route === 'perfil') {
        setRoute(route);
        setRouteState(readRouteState());

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

  const page = routeState.page;
  const routeParams = routeState.params;
  const isRoute = BRIDGED_ROUTE_PAGES.has(page);
  const isEvents = page === 'eventos';

  if (!isRoute) return null;
  if (!sessionReady) return null;
  if (!session) return null;

  const routePage = page as RoutePage;
  const bridgeNavigate = (nextPage: RoutePage, params?: Record<string, any>) => {
    appendNavigationEntry(nextPage, params);
    setRouteState(readRouteState());
  };
  const visitedProfileId = typeof routeParams?.userId === 'string' && routeParams.userId.trim()
    ? routeParams.userId.trim()
    : session.user.id;

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
        {routePage === 'perfil' && (
          <ProfileView
            session={session}
            profile={profile}
            profileId={visitedProfileId}
            username={username || session?.user?.email?.split('@')[0] || 'Usuario'}
          />
        )}
        {routePage === 'musica' && <MusicView session={session} navigate={bridgeNavigate} />}
        {routePage === 'videos' && <VideoView session={session} navigate={bridgeNavigate} />}
        {routePage === 'eventos' && (
          <EventsView
            session={session}
            username={username || session?.user?.email?.split('@')[0] || 'Usuario'}
            onExit={() => bridgeNavigate('inicio')}
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
