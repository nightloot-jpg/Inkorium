import { Link, useNavigate } from '@tanstack/react-router';
import { Home, Users, MessageSquare, Bell, Calendar, Image as ImageIcon, Music, Gamepad2, Settings, LogOut, Search, StickyNote } from 'lucide-react';
import { useAuthStore } from '../stores/authStore';

export function MainLayout({ children }: { children: React.ReactNode }) {
  const { user, signOut } = useAuthStore();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate({ to: '/login' });
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans">
      <header className="sticky top-0 z-50 flex h-16 items-center justify-between border-b border-slate-200 bg-white px-4 md:px-8">
        <div className="flex items-center gap-6">
          <Link to="/feed" className="text-2xl font-bold tracking-tighter text-[#233B5D]">
            Inkorium
          </Link>
          <div className="hidden md:flex relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input
              type="text"
              placeholder="Buscar amigos, grupos..."
              className="h-10 w-64 rounded-full bg-slate-100 pl-10 pr-4 text-sm outline-none focus:bg-white focus:ring-2 focus:ring-[#233B5D]"
            />
          </div>
        </div>

        <div className="flex items-center gap-4">
          <Link to="/profile/$username" params={{ username: user?.user_metadata?.username || 'me' }} className="hidden md:flex items-center gap-2 rounded-full hover:bg-slate-100 px-3 py-1.5 transition">
            <img
              src={user?.user_metadata?.avatar_url || `https://ui-avatars.com/api/?name=${user?.user_metadata?.full_name || 'User'}`}
              alt="Profile"
              className="h-8 w-8 rounded-full"
            />
            <span className="text-sm font-medium">{user?.user_metadata?.full_name?.split(' ')[0] || 'Perfil'}</span>
          </Link>
          <button onClick={handleSignOut} className="rounded-full p-2 text-slate-600 hover:bg-slate-100 transition" aria-label="Cerrar sesión">
            <LogOut size={20} />
          </button>
        </div>
      </header>

      <div className="mx-auto flex max-w-7xl gap-6 p-4 md:p-6">
        <aside className="hidden w-64 shrink-0 lg:block">
          <nav className="sticky top-24 space-y-1">
            <NavItem to="/feed" icon={Home} label="Inicio" />
            <NavItem to="/profile/$username" params={{ username: user?.user_metadata?.username || 'me' }} icon={Users} label="Mi Perfil" />
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

        <aside className="hidden w-80 shrink-0 xl:block">
          <div className="sticky top-24 space-y-6">
            <section className="rounded-xl border border-slate-100 bg-white p-5 shadow-sm">
              <h3 className="mb-4 font-bold text-slate-800">Conectados ahora</h3>
              <div className="space-y-3">
                {[1,2,3].map(i => (
                  <div key={i} className="flex items-center gap-3 cursor-pointer hover:bg-slate-50 p-2 -mx-2 rounded-lg transition">
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

            <section className="rounded-xl border border-slate-100 bg-white p-5 shadow-sm">
              <h3 className="mb-4 font-bold text-slate-800">Próximos Eventos</h3>
              <div className="space-y-4">
                <div className="flex gap-3">
                  <div className="flex h-12 w-12 flex-col items-center justify-center rounded-lg bg-blue-50 text-blue-600">
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
      className="flex items-center justify-between rounded-lg px-3 py-2.5 text-slate-700 transition hover:bg-white hover:shadow-sm [&.active]:bg-white [&.active]:text-[#233B5D] [&.active]:shadow-sm [&.active]:font-semibold"
    >
      <div className="flex items-center gap-3">
        <Icon size={20} className="text-slate-400 group-hover:text-[#233B5D]" />
        <span className="text-sm">{label}</span>
      </div>
      {badge && <span className="rounded-full bg-red-500 px-2 py-0.5 text-xs font-bold text-white">{badge}</span>}
    </Link>
  );
}
