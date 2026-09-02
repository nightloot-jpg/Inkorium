import React, { useState } from 'react';
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
import { PhotoLightbox } from './components/PhotoLightbox';
import { UploadModal } from './components/UploadModal';
import { AuthModal } from './components/AuthModal';
import { AuthPage } from './components/AuthPage';
import { ChatBar } from './components/ChatBar';
import { NotificationToasts } from './components/NotificationToasts';
import { FloatingMusicPlayer } from './components/FloatingMusicPlayer';

const InkoriumAppContent: React.FC = () => {
  const { activeTab, setActiveTab, isLoggedIn, logout } = useInkorium();
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [isAuthOpen, setIsAuthOpen] = useState(false);

  // If user is not logged in, render the dedicated Login/Register Page
  if (!isLoggedIn) {
    return <AuthPage />;
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#e8eef4] dark:bg-[#0b111e] text-[#1c1e21] dark:text-[#f1f5f9] font-sans antialiased selection:bg-[#3869A0] selection:text-white transition-colors duration-150">
      {/* Top Main Navigation */}
      <Navbar 
        onOpenUpload={() => setIsUploadOpen(true)}
        onOpenAuth={() => setIsAuthOpen(true)}
      />

      {/* Main Content Area based on activeTab */}
      <main className="flex-1 pb-16">
        {activeTab === 'inicio' && <HomeFeed onOpenUpload={() => setIsUploadOpen(true)} />}
        {activeTab === 'perfil' && <ProfileView />}
        {activeTab === 'fotos' && <PhotosView onOpenUpload={() => setIsUploadOpen(true)} />}
        {activeTab === 'gente' && <PeopleSearch />}
        {activeTab === 'mensajes' && <MessagesView />}
        {activeTab === 'notificaciones' && <NotificationsView />}
        {activeTab === 'ajustes' && <SettingsView />}
        {activeTab === 'musica' && <MusicView />}
      </main>

      {/* Footer */}
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
            <button onClick={() => setActiveTab('gente')} className="hover:underline text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 cursor-pointer">Buscar Gente</button>
            <button onClick={() => setActiveTab('musica')} className="hover:underline text-[#3869A0] dark:text-blue-400 font-semibold cursor-pointer">Música</button>
            <button onClick={() => setActiveTab('notificaciones')} className="hover:underline text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 cursor-pointer">Avisos</button>
            <button onClick={() => setActiveTab('ajustes')} className="hover:underline text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 cursor-pointer">Ajustes</button>
            <button onClick={() => setIsAuthOpen(true)} className="hover:underline text-[#3869A0] dark:text-blue-400 font-semibold cursor-pointer">Cambiar cuenta</button>
            <button onClick={logout} className="hover:underline text-red-600 dark:text-red-400 font-semibold cursor-pointer">Cerrar sesión</button>
          </div>
        </div>
      </footer>

      {/* Global Overlays & Real-time Live Toasts */}
      <NotificationToasts />
      <PhotoLightbox />
      <FloatingMusicPlayer />
      <UploadModal isOpen={isUploadOpen} onClose={() => setIsUploadOpen(false)} />
      <AuthModal isOpen={isAuthOpen} onClose={() => setIsAuthOpen(false)} />
      <ChatBar />
    </div>
  );
};

export function App() {
  return (
    <InkoriumProvider>
      <InkoriumAppContent />
    </InkoriumProvider>
  );
}

export default App;
