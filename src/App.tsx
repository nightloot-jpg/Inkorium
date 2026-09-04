import React, { useEffect, useMemo, useState } from 'react';
import { InkoriumProvider, useInkorium } from './context/InkoriumContext';
import { Navbar } from './components/Navbar';
import { HomeFeed } from './components/HomeFeed';
import { ProfileView } from './components/ProfileView';
import { PhotosView } from './components/PhotosView';
import { PeopleSearch } from './components/PeopleSearch';
import { MessagesView } from './components/MessagesView';
import { NotificationsView } from './components/NotificationsView';
import { SettingsView } from './components/SettingsView';
import { MusicView } from './components/MusicView';
import { EventsView } from './components/EventsView';
import { PagesView } from './components/PagesView';
import { GamesView } from './components/GamesView';
import { CampusView } from './components/CampusView';
import { OfflineIndicator } from './components/OfflineIndicator';
import { InvitationsModal } from './components/InvitationsModal';
import { PhotoLightbox } from './components/PhotoLightbox';
import { UploadModal } from './components/UploadModal';
import { AuthModal } from './components/AuthModal';
import { AuthPage } from './components/AuthPage';
import { ChatBar } from './components/ChatBar';
import { NotificationToasts } from './components/NotificationToasts';
import { FloatingMusicPlayer } from './components/FloatingMusicPlayer';
import { ErrorBoundary } from './components/ErrorBoundary';
import { PublicProfileSync } from './components/PublicProfileSync';
import { ProfileSignatureCloudSync } from './components/ProfileSignatureCloudSync';
import { ProfileRealtimeSync } from './components/ProfileRealtimeSync';

const AVATAR_RESOLVER_BASE = `${import.meta.env.VITE_SUPABASE_URL || 'https://zllwzmfsfzfedorljgtg.supabase.co'}/functions/v1/avatar-resolver`;
const PROFILE_UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const normalizeAvatarKey = (value: string) => {
  try {
    return new URL(value, window.location.href).href;
  } catch {
    return value.trim();
  }
};

const AvatarProxySync: React.FC = () => {
  const { users, currentUser } = useInkorium();

  const avatarMap = useMemo(() => {
    const map = new Map<string, string>();
    for (const user of [currentUser, ...users]) {
      if (!user?.id || !PROFILE_UUID.test(user.id)) continue;
      const avatar = String(user.avatar || '').trim();
      if (!avatar || avatar.startsWith('data:')) continue;
      if (!/^https?:\/\//i.test(avatar)) continue;
      const resolverUrl = `${AVATAR_RESOLVER_BASE}/${encodeURIComponent(user.id)}`;
      map.set(avatar, resolverUrl);
      map.set(normalizeAvatarKey(avatar), resolverUrl);
    }
    return map;
  }, [users, currentUser]);

  useEffect(() => {
    const rewriteImage = (img: HTMLImageElement) => {
      const raw = img.getAttribute('src') || '';
      if (!raw) return;
      const key = avatarMap.get(raw) || avatarMap.get(normalizeAvatarKey(raw));
      if (!key || img.src === key) return;
      img.setAttribute('src', key);
    };

    const scan = (root: ParentNode = document) => {
      root.querySelectorAll('img[src]').forEach(node => rewriteImage(node as HTMLImageElement));
    };

    scan();
    const observer = new MutationObserver(mutations => {
      for (const mutation of mutations) {
        if (mutation.type === 'attributes' && mutation.target instanceof HTMLImageElement) {
          rewriteImage(mutation.target);
          continue;
        }
        mutation.addedNodes.forEach(node => {
          if (node instanceof HTMLImageElement) rewriteImage(node);
          if (node instanceof Element) scan(node);
        });
      }
    });

    observer.observe(document.documentElement, {
      subtree: true,
      childList: true,
      attributes: true,
      attributeFilter: ['src'],
    });

    return () => observer.disconnect();
  }, [avatarMap]);

  return null;
};

const InkoriumAppContent: React.FC = () => {
  const { 
    activeTab, 
    setActiveTab, 
    isLoggedIn, 
    logout,
    isInvitationsModalOpen,
    setIsInvitationsModalOpen
  } = useInkorium();
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [isAuthOpen, setIsAuthOpen] = useState(false);

  if (!isLoggedIn) {
    return <AuthPage />;
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#e8eef4] dark:bg-[#0b111e] text-[#1c1e21] dark:text-[#f1f5f9] font-sans antialiased selection:bg-[#3869A0] selection:text-white transition-colors duration-150">
      <OfflineIndicator />
      <Navbar 
        onOpenUpload={() => setIsUploadOpen(true)}
        onOpenAuth={() => setIsAuthOpen(true)}
      />

      <main className="flex-1 pb-16">
        {activeTab === 'inicio' && <HomeFeed onOpenUpload={() => setIsUploadOpen(true)} />}
        {activeTab === 'perfil' && <ProfileView onOpenUpload={() => setIsUploadOpen(true)} />}
        {activeTab === 'fotos' && <PhotosView onOpenUpload={() => setIsUploadOpen(true)} />}
        {activeTab === 'gente' && <PeopleSearch />}
        {activeTab === 'eventos' && <EventsView />}
        {activeTab === 'campus' && <CampusView />}
        {activeTab === 'paginas' && <PagesView />}
        {activeTab === 'juegos' && <GamesView />}
        {activeTab === 'mensajes' && <MessagesView />}
        {activeTab === 'notificaciones' && <NotificationsView />}
        {activeTab === 'ajustes' && <SettingsView />}
        {activeTab === 'musica' && <MusicView />}
      </main>

      <footer className="bg-white dark:bg-[#0e1726] border-t border-[#ccd5df] dark:border-[#1d2b40] py-4 text-center text-xs text-gray-500 dark:text-gray-400 transition-colors">
        <div className="w-full max-w-[1720px] 2xl:max-w-[1850px] mx-auto px-3 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 font-bold text-[#3869A0] dark:text-blue-400">
            <span>Inkorium</span>
            <span className="text-gray-400 dark:text-gray-500 font-normal">© 2006–{new Date().getFullYear()}</span>
            <span className="text-gray-300 dark:text-gray-600">|</span>
            <span className="text-gray-500 dark:text-gray-400 font-normal">Inspirado en la mítica red social Tuenti & Nuenti</span>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-3 text-[11px]">
            <button onClick={() => setActiveTab('inicio')} className="hover:underline text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 cursor-pointer">Inicio</button>
            <button onClick={() => setActiveTab('perfil')} className="hover:underline text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 cursor-pointer">Mi Perfil</button>
            <button onClick={() => setActiveTab('fotos')} className="hover:underline text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 cursor-pointer">Fotos</button>
            <button onClick={() => setActiveTab('gente')} className="hover:underline text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 cursor-pointer">Gente</button>
            <button onClick={() => setActiveTab('eventos')} className="hover:underline text-[#3869A0] dark:text-blue-400 font-semibold cursor-pointer">Eventos</button>
            <button onClick={() => setActiveTab('campus')} className="hover:underline text-emerald-600 dark:text-emerald-400 font-bold cursor-pointer">🏫 Campus</button>
            <button onClick={() => setActiveTab('paginas')} className="hover:underline text-[#3869A0] dark:text-blue-400 font-semibold cursor-pointer">Páginas</button>
            <button onClick={() => setActiveTab('juegos')} className="hover:underline text-[#3869A0] dark:text-blue-400 font-semibold cursor-pointer">Juegos</button>
            <button onClick={() => setActiveTab('musica')} className="hover:underline text-[#3869A0] dark:text-blue-400 font-semibold cursor-pointer">Música</button>
            <button onClick={() => setActiveTab('notificaciones')} className="hover:underline text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 cursor-pointer">Avisos</button>
            <button onClick={() => setIsInvitationsModalOpen(true)} className="hover:underline text-amber-600 dark:text-amber-400 font-bold cursor-pointer">🎫 Invitaciones</button>
            <button onClick={() => setActiveTab('ajustes')} className="hover:underline text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 cursor-pointer">Ajustes</button>
            <button onClick={() => setIsAuthOpen(true)} className="hover:underline text-[#3869A0] dark:text-blue-400 font-semibold cursor-pointer">Cambiar cuenta</button>
            <button onClick={logout} className="hover:underline text-red-600 dark:text-red-400 font-semibold cursor-pointer">Cerrar sesión</button>
          </div>
        </div>
      </footer>

      <NotificationToasts />
      <PhotoLightbox />
      <FloatingMusicPlayer />
      <UploadModal isOpen={isUploadOpen} onClose={() => setIsUploadOpen(false)} />
      <AuthModal isOpen={isAuthOpen} onClose={() => setIsAuthOpen(false)} />
      <InvitationsModal isOpen={isInvitationsModalOpen} onClose={() => setIsInvitationsModalOpen(false)} />
      <ChatBar />
    </div>
  );
};

export function App() {
  return (
    <ErrorBoundary>
      <InkoriumProvider>
        <PublicProfileSync />
        <ProfileSignatureCloudSync />
        <ProfileRealtimeSync />
        <AvatarProxySync />
        <InkoriumAppContent />
      </InkoriumProvider>
    </ErrorBoundary>
  );
}

export default App;
