import { Link } from '@tanstack/react-router';
import { Search, Bell, MessageCircle, Music, Menu } from 'lucide-react';
import { useUIStore } from '@/stores/uiStore';
import { Logo } from '@/components/ui/Logo';
import { Avatar, AvatarFallback } from '@/components/ui/Avatar';

export const Navbar = () => {
  const toggleSidebar = useUIStore((state) => state.toggleSidebar);

  return (
    <header className="fixed top-0 left-0 right-0 h-16 bg-white border-b z-50 flex items-center px-4 justify-between">
      <div className="flex items-center gap-4">
        <button onClick={toggleSidebar} className="md:hidden p-2">
          <Menu className="w-6 h-6 text-slate-600" />
        </button>
        <Link to="/" className="text-xl font-bold text-[#233B5D]">
          <Logo />
        </Link>
        <div className="hidden md:flex relative ml-4">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input type="text" placeholder="Buscar..." className="pl-10 pr-4 py-2 rounded-full bg-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-[#233B5D]" />
        </div>
      </div>
      <div className="flex items-center gap-3">
        <button className="p-2 hover:bg-slate-100 rounded-full"><Music className="w-5 h-5 text-slate-600" /></button>
        <button className="p-2 hover:bg-slate-100 rounded-full"><MessageCircle className="w-5 h-5 text-slate-600" /></button>
        <button className="p-2 hover:bg-slate-100 rounded-full"><Bell className="w-5 h-5 text-slate-600" /></button>
        <Link to="/profile">
          <Avatar>
            <AvatarFallback>U</AvatarFallback>
          </Avatar>
        </Link>
      </div>
    </header>
  );
};
