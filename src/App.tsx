import React, { useState } from 'react';
import { useInkorium } from './context/InkoriumContext';
import { Navbar } from './components/Navbar';
import { HomeFeed } from './components/HomeFeed';
import { ProfileView } from './components/ProfileView';
import { PhotosView } from './components/PhotosView';
import { PeopleSearch } from './components/PeopleSearch';
import { MessagesView } from './components/MessagesView';
import { SettingsView } from './components/SettingsView';
import { PhotoLightbox } from './components/PhotoLightbox';
import { UploadModal } from './components/UploadModal';
import { AuthModal } from './components/AuthModal';
import { ChatBar } from './components/ChatBar';
import { NotificationToasts } from './components/NotificationToasts';

const InkoriumAppContent: React.FC = () => {
  const { activeTab, setActiveTab } = useInkorium();
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [isAuthOpen, setIsAuthOpen] = useState(false);

  return (
    <div className="min-h-screen flex flex-col bg-[#e8eef4] text-[#1c1e21] font-sans antialiased selection:bg-[#3869A0] selection:text-white">
      <Navbar onOpenAuth={() => setIsAuthOpen(true)} />
      <main className="flex-1 pb-16">
        {activeTab === 'inicio' && <HomeFeed onOpenUpload={() => setIsUploadOpen(true)} />}
        {activeTab === 'perfil' && <ProfileView />}
        {activeTab === 'fotos' && <PhotosView onOpenUpload={() => setIsUploadOpen(true)} />}
        {activeTab === 'gente' && <PeopleSearch />}
        {activeTab === 'mensajes' && <MessagesView />}
        {activeTab === 'ajustes' && <SettingsView />}
      </main>
      <footer className="bg-white border-t border-[#ccd5df] py-4 text-center text-xs text-gray-500">
        <div className="w-full max-w-[1720px] 2xl:max-w-[1850px] mx-auto px-3 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 font-bold text-[#3869A0]"><span>Inkorium</span><span className="text-gray-400 font-normal">© 2006–{new Date().getFullYear()}</span><span className="text-gray-300">|</span><span className="text-gray-500 font-normal">Red social retro con Supabase + almacenamiento externo</span></div>
          <div className="flex flex-wrap items-center justify-center gap-3 text-[11px]">
            <button onClick={() => setActiveTab('inicio')} className="hover:underline text-gray-600">Inicio</button>
            <button onClick={() => setActiveTab('perfil')} className="hover:underline text-gray-600">Mi Perfil</button>
            <button onClick={() => setActiveTab('fotos')} className="hover:underline text-gray-600">Fotos</button>
            <button onClick={() => setActiveTab('gente')} className="hover:underline text-gray-600">Buscar Gente</button>
            <button onClick={() => setActiveTab('ajustes')} className="hover:underline text-gray-600">Ajustes</button>
          </div>
        </div>
      </footer>
      <NotificationToasts />
      <PhotoLightbox />
      <UploadModal isOpen={isUploadOpen} onClose={() => setIsUploadOpen(false)} />
      <AuthModal isOpen={isAuthOpen} onClose={() => setIsAuthOpen(false)} />
      <ChatBar />
    </div>
  );
};

export function App() {
  return <InkoriumAppContent />;
}

export default App;
