import { useState, useEffect } from 'react';
import { Link, useNavigate } from '@tanstack/react-router';
import { Home, Users, MessageSquare, Bell, Calendar, Image as ImageIcon, Music, Gamepad2, Settings, LogOut, Search, StickyNote } from 'lucide-react';
import { useAuthStore } from '../stores/authStore';

export function MainLayout({ children }: { children: React.ReactNode }) {
  const user = useAuthStore(state => state.user);
  const signOut = useAuthStore(state => state.signOut);
  const [isMounted, setIsMounted] = useState(false);
  useEffect(() => { setIsMounted(true); }, []);
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate({ to: '/login' });
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans">
      <header className="sticky top-0 z-50 flex h-[54px] items-center justify-between bg-gradient-to-r from-[#233B5D] to-[#1b2e49] text-white px-4 md:px-8">
        <div className="flex items-center gap-4">
          <Link to="/feed" className="text-2xl font-bold tracking-tighter text-white">
            Inkorium
          </Link>
          <div className="hidden md:flex relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
            <input
              type="text"
              placeholder="Buscar amigos, grupos..."
              className="h-8 w-96 rounded-sm bg-white text-slate-900 pl-10 pr-4 text-sm outline-none border border-transparent focus:border-slate-300"
            />
          </div>
        </div>

        <div className="flex items-center gap-4">
          <Link to="/profile/$username" params={{ username: (isMounted ? user?.user_metadata : null)?.username || 'me' }} className="hidden md:flex items-center gap-2 rounded-sm hover:bg-white/10 px-3 py-1.5 transition text-white">
            <img
              src={(isMounted ? user?.user_metadata : null)?.avatar_url || `https://ui-avatars.com/api/?name=${(isMounted ? user?.user_metadata : null)?.full_name || 'User'}`}
              alt="Profile"
              className="h-8 w-8 rounded-full"
            />
            <span className="text-sm font-medium">{(isMounted ? user?.user_metadata : null)?.full_name?.split(' ')[0] || 'Perfil'}</span>
          </Link>
          <button onClick={handleSignOut} className="rounded-sm p-2 text-white hover:bg-white/10 transition" aria-label="Cerrar sesión">
            <LogOut size={20} />
          </button>
        </div>
      </header>

      <div className="mx-auto flex max-w-7xl gap-4 p-4">
        <aside className="hidden w-[280px] shrink-0 lg:block">
          <nav className="sticky top-24 space-y-1">
            <NavItem to="/feed" icon={Home} label="Inicio" />
            <NavItem to="/profile/$username" params={{ username: (isMounted ? user?.user_metadata : null)?.username || 'me' }} icon={Users} label="Mi Perfil" />
            <NavItem to="/friends" icon={Users} label="Amigos" />
            <NavItem to="/messages" icon={MessageSquare} label="Mensajes" badge="3" />
            <NavItem to="/notifications" icon={Bell} label="Notificaciones" badge="5" />

            <div className="my-4 border-t border-slate-200"></div>

            <NavItem to="/inklog" icon={ImageIcon} label="Inklog" />
            <NavItem to="/events" icon={Calendar} label="Eventos" />
            <NavItem to="/notes" icon={StickyNote} label="Notas" />
            <NavItem to="/music" icon={Music} label="Música" />
            <NavItem to="/games" icon={Gamepad2} label="Juegos" />

            <div className="my-4 border-t border-slate-200"></div>

            <NavItem to="/settings" icon={Settings} label="Ajustes" />
          </nav>
        </aside>

        <main className="flex-1 min-w-0">
          {children}
        </main>

        <aside className="hidden w-[260px] shrink-0 xl:block">
          <div className="sticky top-24 space-y-4">

            <section className="rounded-sm border border-slate-200 bg-white p-4 shadow-none">
              <div className="flex justify-between items-center mb-3 border-b border-slate-100 pb-2">
                <h3 className="text-sm font-bold text-slate-700">Inklog</h3>
                <Link to="/inklog" className="text-xs text-[#233B5D] hover:underline">Ver todos →</Link>
              </div>
              <div className="grid grid-cols-3 gap-1">
                {[1,2,3,4,5,6].map(i => (
                  <Link key={i} to="/inklog" className="aspect-square bg-slate-100 hover:opacity-80 transition block border border-slate-200">
                     <img src={`https://picsum.photos/seed/${i+50}/100`} alt="" className="w-full h-full object-cover" />
                  </Link>
                ))}
              </div>
            </section>

            <section className="rounded-sm border border-slate-200 bg-white p-4 shadow-none">
              <h3 className="mb-3 text-sm font-bold text-slate-700 border-b border-slate-100 pb-2">Conectados ahora</h3>
              <div className="space-y-3">
                {[1,2,3].map(i => (
                  <div key={i} className="flex items-center gap-2 cursor-pointer hover:bg-slate-50 p-1 -mx-1 rounded-sm transition">
                    <div className="relative">
                      <img src={`https://i.pravatar.cc/150?img=${i+10}`} alt="User" className="h-10 w-10 rounded-full" />
                      <div className="absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-white bg-green-500"></div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="truncate text-sm font-medium">Amigo {i}</p>
                      <p className="truncate text-xs text-slate-500">Escuchando Spotify</p>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            <section className="rounded-sm border border-slate-200 bg-white p-4 shadow-none">
              <h3 className="mb-3 text-sm font-bold text-slate-700 border-b border-slate-100 pb-2">Próximos Eventos</h3>
              <div className="space-y-4">
                <div className="flex gap-3">
                  <div className="flex h-10 w-10 flex-col items-center justify-center rounded-sm bg-blue-50 border border-blue-100 text-blue-600">
                    <span className="text-xs font-bold uppercase">Oct</span>
                    <span className="text-lg font-bold leading-none">15</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="truncate font-medium text-sm">Fiesta Universitaria</p>
                    <p className="text-xs text-slate-500">22:00 · Sala Riviera</p>
                  </div>
                </div>
              </div>
            </section>
          </div>
        </aside>
      </div>
    </div>
  );
}

function NavItem({ to, params, icon: Icon, label, badge }: { to: string, params?: any, icon: any, label: string, badge?: string }) {
  return (
    <Link
      to={to as any} params={params}
      className="flex items-center justify-between rounded-sm px-2 py-1.5 text-slate-600 transition hover:bg-slate-200 [&.active]:bg-slate-200/50 [&.active]:text-[#233B5D] [&.active]:font-bold text-sm"
    >
      <div className="flex items-center gap-3">
        <Icon size={16} className="text-slate-500" />
        <span className="text-sm">{label}</span>
      </div>
      {badge && <span className="rounded-full bg-red-500 px-2 py-0.5 text-xs font-bold text-white">{badge}</span>}
    </Link>
  );
}
