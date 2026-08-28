import React, { Component, Suspense, lazy, type ErrorInfo, type ReactNode, useEffect } from 'react';
import { useAuthStore } from '../lib/store';
import { loadRouteStyles } from './feature-styles';
import './route-content-bridge.css';
import './route-content-bridge-header-stable-2026.css';

const MusicView = lazy(() => import('./music/MusicView').then(module => ({ default: module.MusicView })));
const VideoView = lazy(() => import('./videos/VideoView').then(module => ({ default: module.VideoView })));
const ProfileView = lazy(() => import('./profile/ProfileView').then(module => ({ default: module.ProfileView })));
const PeopleView = lazy(() => import('../PeopleView').then(module => ({ default: module.PeopleView })));

export const ROUTE_PAGES = new Set(['inicio','perfil','mensajes','personas','musica','buscar','fotos','videos','eventos']);
export const ROUTED_CONTENT_PAGES = new Set(['perfil','personas','musica','videos']);
export type RoutePage = 'inicio'|'perfil'|'mensajes'|'personas'|'musica'|'buscar'|'fotos'|'videos'|'eventos';
export type RouteState = { page: RoutePage; params?: Record<string, any> };

type Props = { route: RouteState; navigate: (page: RoutePage, params?: Record<string, any>) => void };
type ErrorBoundaryProps = { children: ReactNode };
type ErrorBoundaryState = { error: Error | null };

class RouteErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { error: null };
  static getDerivedStateFromError(error: Error) { return { error }; }
  componentDidCatch(error: Error, info: ErrorInfo) { console.error('[Inkorium route]', error, info); }
  render() {
    if (!this.state.error) return this.props.children;
    return <div style={{minHeight:'100%',padding:32,background:'#f3f6fa',color:'#26364d',fontFamily:'Arial,Helvetica,sans-serif'}}><div style={{maxWidth:720,margin:'0 auto',background:'#fff',border:'1px solid #e4e7ee',borderRadius:8,padding:24}}><h2 style={{margin:'0 0 8px'}}>No se ha podido cargar esta sección</h2><p style={{margin:0,color:'#66788b'}}>{this.state.error.message}</p></div></div>;
  }
}

export function normalizeRoutePath(pathname: string): RoutePage {
  const clean = pathname.replace(/\/+$/,'').split('/').filter(Boolean).pop()?.toLowerCase() || '';
  return ROUTE_PAGES.has(clean) ? clean as RoutePage : 'inicio';
}

export function parseRouteParams(search: string): Record<string, any> | undefined {
  const params = new URLSearchParams(search);
  const userId = params.get('userId');
  return userId ? { userId } : undefined;
}

export function routeUrl(page: RoutePage, params?: Record<string, any>) {
  const pathname = page === 'inicio' ? '/' : `/${page}`;
  return params?.userId ? `${pathname}?userId=${encodeURIComponent(params.userId)}` : pathname;
}

export function RouteContentBridge({ route, navigate }: Props) {
  const session = useAuthStore(state => state.session);
  const profile = useAuthStore(state => state.profile);
  const sessionReady = !!session;
  const username = profile?.username || profile?.full_name || session?.user?.email?.split('@')[0] || 'Usuario';

  useEffect(() => {
    const active = ROUTED_CONTENT_PAGES.has(route.page) && sessionReady;
    document.body.classList.toggle('inkorium-route-bridge-active', active);
    return () => document.body.classList.remove('inkorium-route-bridge-active');
  }, [route.page, sessionReady]);

  useEffect(() => {
    if (sessionReady) void loadRouteStyles(route.page as any);
  }, [route.page, sessionReady]);

  if (!sessionReady || !session || !ROUTED_CONTENT_PAGES.has(route.page)) return null;
  const visitedProfileId = typeof route.params?.userId === 'string' && route.params.userId.trim() ? route.params.userId.trim() : session.user.id;

  return <div id="inkorium-route-content-bridge" className="inkorium-route-bridge" data-route-page={route.page}>
    <RouteErrorBoundary>
      <Suspense fallback={<div style={{minHeight:'100%',padding:24,background:'#f3f6fa',color:'#66788b'}}>Cargando sección…</div>}>
        {route.page === 'perfil' && <ProfileView session={session} profile={profile} profileId={visitedProfileId} username={username} />}
        {route.page === 'personas' && <PeopleView session={session} navigate={navigate} />}
        {route.page === 'musica' && <MusicView session={session} navigate={navigate} />}
        {route.page === 'videos' && <VideoView session={session} navigate={navigate} />}
      </Suspense>
    </RouteErrorBoundary>
  </div>;
}

export function useRouteState(): [RouteState, (page: RoutePage, params?: Record<string, any>) => void] {
  const [route, setRoute] = React.useState<RouteState>(() => ({
    page: normalizeRoutePath(window.location.pathname),
    params: parseRouteParams(window.location.search),
  }));

  useEffect(() => {
    const sync = () => {
      const next = { page: normalizeRoutePath(window.location.pathname), params: parseRouteParams(window.location.search) };
      setRoute(next);
      window.dispatchEvent(new CustomEvent('inkorium-route-change', { detail: next }));
    };
    const onLegacyRouteChange = (event: Event) => {
      const detail = (event as CustomEvent).detail || {};
      const page = typeof detail === 'string' ? detail : detail.page;
      if (!ROUTE_PAGES.has(page)) return;
      const params = typeof detail === 'object' ? detail.params : undefined;
      const nextUrl = routeUrl(page as RoutePage, params);
      if (window.location.pathname + window.location.search !== nextUrl) window.history.pushState({ page, params }, '', nextUrl);
      setRoute({ page: page as RoutePage, params });
    };
    window.addEventListener('popstate', sync);
    window.addEventListener('inkorium-route-change', onLegacyRouteChange);
    return () => {
      window.removeEventListener('popstate', sync);
      window.removeEventListener('inkorium-route-change', onLegacyRouteChange);
    };
  }, []);

  const navigate = (page: RoutePage, params?: Record<string, any>) => {
    const nextUrl = routeUrl(page, params);
    window.history.pushState({ page, params }, '', nextUrl);
    const next = { page, params };
    setRoute(next);
    window.dispatchEvent(new CustomEvent('inkorium-route-change', { detail: next }));
  };
  return [route, navigate];
}
