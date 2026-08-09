import type { ReactNode } from 'react';
import { useUiStore } from '../stores/uiStore';
import { Link } from '@tanstack/react-router';
import { Home, User, Users, Image, Video, Calendar, Users2, MessageSquare, Bell, ShoppingBag, Gamepad2, Bookmark, Settings, LogOut } from 'lucide-react';
import { useTranslations } from '../hooks/useTranslations';
import { useLogout } from '../features/auth/hooks/useAuth';

interface MainLayoutProps {
  children: ReactNode;
}

export function MainLayout({ children }: MainLayoutProps) {
  const { isLeftSidebarOpen, isRightSidebarOpen } = useUiStore();
  const { t } = useTranslations();
  const logoutMutation = useLogout();

  const handleLogout = () => {
    logoutMutation.mutate();
  };

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col text-gray-900">
      {/* Header */}
      <header className="h-14 bg-[#233B5D] text-white fixed top-0 w-full z-50 flex items-center px-4 justify-between shadow-md">
        <div className="font-bold text-xl">Inkorium</div>
        <div className="flex items-center gap-4">
            <button className="p-2 hover:bg-white/10 rounded-full transition-colors"><Bell size={20} /></button>
            <button className="p-2 hover:bg-white/10 rounded-full transition-colors"><MessageSquare size={20} /></button>
        </div>
      </header>

      <div className="flex flex-1 pt-14 max-w-7xl mx-auto w-full">
        {/* Left Sidebar */}
        {isLeftSidebarOpen && (
          <aside className="w-64 fixed left-0 xl:static h-[calc(100vh-3.5rem)] overflow-y-auto bg-gray-50 border-r border-gray-200 hidden md:block">
            <nav className="p-4 flex flex-col gap-2">
              <Link to="/feed" className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-200 transition-colors [&.active]:bg-gray-200 [&.active]:font-semibold"><Home size={20} /> {t('navigation.feed')}</Link>
              <Link to="/profile" className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-200 transition-colors [&.active]:bg-gray-200 [&.active]:font-semibold"><User size={20} /> {t('navigation.profile')}</Link>
              <Link to="/friends" className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-200 transition-colors [&.active]:bg-gray-200 [&.active]:font-semibold"><Users size={20} /> {t('navigation.friends')}</Link>
              <Link to="/photos" className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-200 transition-colors [&.active]:bg-gray-200 [&.active]:font-semibold"><Image size={20} /> {t('navigation.photos')}</Link>
              <Link to="/videos" className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-200 transition-colors [&.active]:bg-gray-200 [&.active]:font-semibold"><Video size={20} /> {t('navigation.videos')}</Link>
              <Link to="/events" className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-200 transition-colors [&.active]:bg-gray-200 [&.active]:font-semibold"><Calendar size={20} /> {t('navigation.events')}</Link>
              <Link to="/groups" className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-200 transition-colors [&.active]:bg-gray-200 [&.active]:font-semibold"><Users2 size={20} /> {t('navigation.groups')}</Link>
              <Link to="/marketplace" className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-200 transition-colors [&.active]:bg-gray-200 [&.active]:font-semibold"><ShoppingBag size={20} /> {t('navigation.marketplace')}</Link>
              <Link to="/gaming" className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-200 transition-colors [&.active]:bg-gray-200 [&.active]:font-semibold"><Gamepad2 size={20} /> {t('navigation.gaming')}</Link>
              <Link to="/saved" className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-200 transition-colors [&.active]:bg-gray-200 [&.active]:font-semibold"><Bookmark size={20} /> {t('navigation.saved')}</Link>
              <Link to="/settings" className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-200 transition-colors [&.active]:bg-gray-200 [&.active]:font-semibold"><Settings size={20} /> {t('navigation.settings')}</Link>
              <button onClick={handleLogout} className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-200 transition-colors text-left text-red-600"><LogOut size={20} /> {t('navigation.logout')}</button>
            </nav>
          </aside>
        )}

        {/* Main Content */}
        <main className="flex-1 w-full flex justify-center">
            <div className="w-full max-w-2xl px-4 py-6">
                {children}
            </div>
        </main>

        {/* Right Sidebar */}
        {isRightSidebarOpen && (
          <aside className="w-80 fixed right-0 xl:static h-[calc(100vh-3.5rem)] overflow-y-auto bg-gray-50 border-l border-gray-200 hidden lg:block">
            <div className="p-4 flex flex-col gap-6">
              <div>
                <h3 className="font-semibold text-gray-500 mb-2 uppercase text-sm tracking-wider">Online Users</h3>
                <div className="space-y-2">
                   <div className="flex items-center gap-2 p-2 hover:bg-gray-200 rounded-lg cursor-pointer">
                     <div className="w-8 h-8 rounded-full bg-blue-200 flex-shrink-0 relative">
                        <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 border-2 border-white rounded-full"></span>
                     </div>
                     <span className="font-medium text-sm">Jane Doe</span>
                   </div>
                </div>
              </div>

               <div>
                <h3 className="font-semibold text-gray-500 mb-2 uppercase text-sm tracking-wider">Trending</h3>
                <div className="space-y-2 text-sm">
                   <div className="p-2 hover:bg-gray-200 rounded-lg cursor-pointer">#Inkorium</div>
                   <div className="p-2 hover:bg-gray-200 rounded-lg cursor-pointer">#NewUpdate</div>
                </div>
              </div>
            </div>
          </aside>
        )}
      </div>
    </div>
  );
}
