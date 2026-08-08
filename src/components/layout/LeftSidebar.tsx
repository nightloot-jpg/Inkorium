import { Link } from '@tanstack/react-router';
import { useTranslations } from '@/hooks/useTranslations';
import {
  Home, User, Users, Image, Video, Calendar,
  MessagesSquare, Store, Gamepad2, Bookmark, Settings, LogOut
} from 'lucide-react';

export const LeftSidebar = () => {
  const { t } = useTranslations();

  const links = [
    { to: '/', icon: Home, label: t('nav.feed') },
    { to: '/profile', icon: User, label: t('nav.profile') },
    { to: '/friends', icon: Users, label: t('nav.friends') },
    { to: '/photos', icon: Image, label: t('nav.photos') },
    { to: '/videos', icon: Video, label: t('nav.videos') },
    { to: '/events', icon: Calendar, label: t('nav.events') },
    { to: '/groups', icon: Users, label: t('nav.groups') },
    { to: '/messages', icon: MessagesSquare, label: t('nav.messages') },
    { to: '/marketplace', icon: Store, label: t('nav.marketplace') },
    { to: '/gaming', icon: Gamepad2, label: t('nav.gaming') },
    { to: '/memories', icon: Calendar, label: t('nav.memories') },
    { to: '/saved', icon: Bookmark, label: t('nav.saved') },
    { to: '/settings', icon: Settings, label: t('nav.settings') },
  ];

  return (
    <div className="p-4 flex flex-col gap-2">
      {links.map((link) => (
        <Link
          key={link.to}
          to={link.to}
          className="flex items-center gap-3 p-3 rounded-lg hover:bg-slate-100 text-slate-700 transition-colors [&.active]:bg-slate-200 [&.active]:text-[#233B5D] [&.active]:font-semibold"
        >
          <link.icon className="w-5 h-5" />
          <span>{link.label}</span>
        </Link>
      ))}
      <hr className="my-2 border-slate-200" />
      <button className="flex items-center gap-3 p-3 rounded-lg hover:bg-red-50 text-red-600 transition-colors w-full text-left">
        <LogOut className="w-5 h-5" />
        <span>{t('nav.logout')}</span>
      </button>
    </div>
  );
};
