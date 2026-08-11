import { Link, useNavigate, useRouter } from '@tanstack/react-router';
import {
  Bell,
  CalendarDays,
  ChevronDown,
  Home,
  Image as ImageIcon,
  LogOut,
  MessageSquare,
  Music2,
  Search,
  Settings,
  Users,
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { useLogout } from '../features/auth/hooks/useAuth';

const friends = [
  { name: 'Amigo 1', image: 21, music: 'Escuchando Spotify' },
  { name: 'Amigo 2', image: 22, music: 'Escuchando Spotify' },
  { name: 'Amigo 3', image: 23, music: 'Escuchando Spotify' },
];

function avatarUrl(user: ReturnType<typeof useAuth>['user']) {
  return user?.user_metadata?.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.user_metadata?.full_name || 'User')}`;
}

export function MainLayout({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const logoutMutation = useLogout();
  const navigate = useNavigate();
  const router = useRouter();
  const avatar = avatarUrl(user);
  const firstName = user?.user_metadata?.full_name?.split(' ')[0] || 'Perfil';

  const handleSignOut = () => {
    logoutMutation.mutate(undefined, {
      onSuccess: async () => {
        await router.invalidate();
        navigate({ to: '/login' });
      },
    });
  };

  return (
    <div className="min-h-screen bg-[#f5f7fa] text-[#23344d] font-sans">
      <header className="sticky top-0 z-50 h-[58px] bg-[#06459b] text-white shadow-sm">
        <div className="mx-auto flex h-full max-w-[1540px] items-center px-5 lg:px-8">
          <Link to="/feed" className="flex w-[165px] shrink-0 items-center gap-2 border-r border-white/10 pr-6">
            <img src="/tuenti_inkorium_logo.svg" alt="Inkorium" className="h-7 w-7 brightness-0 invert" />
            <span className="text-[22px] font-extrabold tracking-tight">inkorium</span>
          </Link>

          <nav className="hidden h-full items-stretch md:flex">
            <HeaderLink to="/feed" label="Inicio" active />
            <HeaderLink to="/messages" label="Mensajes" badge="3" />
            <HeaderLink to="/friends" label="Personas" />
            <HeaderLink to="/events" label="Música" icon={<Music2 size={16} />} />
          </nav>

          <div className="mx-5 hidden min-w-0 flex-1 md:block lg:mx-8">
            <div className="relative max-w-[700px]">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-[#8da6c8]" size={17} />
              <input
                type="search"
                placeholder="Buscar personas, música, vídeos..."
                className="h-9 w-full rounded-full border border-[#003a86] bg-[#043d8a] px-11 text-sm text-white placeholder:text-[#b6c8df] outline-none focus:border-white/40 focus:bg-[#0a4da4]"
              />
            </div>
          </div>

          <div className="ml-auto flex items-center gap-3 sm:gap-5">
            <Link to="/notifications" className="relative rounded-full p-2 hover:bg-white/10" aria-label="Notificaciones">
              <Bell size={19} />
              <span className="absolute right-0 top-0 min-w-4 rounded-full bg-red-500 px-1 text-center text-[9px] font-bold leading-4">5</span>
            </Link>
            <button className="hidden rounded-full p-2 hover:bg-white/10 sm:block" aria-label="Música">
              <Music2 size={19} />
            </button>
            <span className="hidden h-7 w-px bg-white/20 sm:block" />
            <Link to="/profile/$username" params={{ username: user?.user_metadata?.username || 'me' }} className="flex items-center gap-2 rounded-full px-1 py-1 hover:bg-white/10">
              <img src={avatar} alt="Perfil" className="h-8 w-8 rounded-full border border-white/40 object-cover" />
              <span className="hidden text-sm font-bold sm:block">{firstName}</span>
              <ChevronDown size={14} className="hidden sm:block" />
            </Link>
            <button onClick={handleSignOut} className="rounded-full p-2 hover:bg-white/10" aria-label="Cerrar sesión">
              <LogOut size={18} />
            </button>
          </div>
        </div>
      </header>

      <div className="mx-auto flex max-w-[1540px] gap-7 px-4 py-4 lg:px-8">
        <aside className="hidden w-[355px] shrink-0 lg:block">
          <div className="space-y-4">
            <section className="border border-[#dce2ea] bg-white p-5 shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
              <div className="flex items-center gap-4">
                <img src={avatar} alt="Perfil" className="h-[92px] w-[92px] rounded-xl border border-[#d9e0e8] object-cover" />
                <div className="min-w-0">
                  <p className="text-[18px] font-bold text-[#17263c]">{user?.user_metadata?.full_name || 'Usuario'}</p>
                  <p className="mt-1 text-sm text-[#7c8da5]">Más rápido</p>
                  <p className="mt-2 flex items-center gap-2 text-sm text-[#23b85b]"><span className="h-2.5 w-2.5 rounded-full bg-[#2acb68]" /> En línea</p>
                  <Link to="/profile/$username" params={{ username: user?.user_metadata?.username || 'me' }} className="mt-2 inline-block text-sm font-semibold text-[#0758bd] hover:underline">Ver mi perfil »</Link>
                </div>
              </div>
            </section>

            <section className="border border-[#dce2ea] bg-white p-5">
              <SideNavItem to="/feed" icon={<Home size={20} />} label="Novedades" active />
              <SideNavItem to="/feed" icon={<ImageIcon size={20} />} label="Fotos" />
              <SideNavItem to="/feed" icon={<MessageSquare size={20} />} label="Vídeos" />
              <SideNavItem to="/events" icon={<Music2 size={20} />} label="Música" />
              <SideNavItem to="/events" icon={<CalendarDays size={20} />} label="Eventos" />
              <SideNavItem to="/friends" icon={<Users size={20} />} label="Grupos" />
              <SideNavItem to="/feed" icon={<Settings size={20} />} label="Configuración" />
            </section>

            <section className="border border-[#dce2ea] bg-white p-5">
              <div className="mb-3 flex items-center justify-between">
                <h3 className="text-xs font-bold uppercase tracking-wide text-[#718198]">Amigos conectados (12)</h3>
                <Link to="/friends" className="text-xs font-semibold text-[#0758bd]">Ver todos »</Link>
              </div>
              <div className="space-y-1">
                {friends.map((friend) => (
                  <div key={friend.name} className="flex items-center gap-3 px-1 py-2">
                    <div className="relative shrink-0">
                      <img src={`https://i.pravatar.cc/150?img=${friend.image}`} alt="" className="h-9 w-9 rounded-full object-cover" />
                      <span className="absolute bottom-0 right-[-1px] h-3 w-3 rounded-full border-2 border-white bg-[#24c96b]" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-[#26364d]">{friend.name}</p>
                      <p className="truncate text-xs text-[#8291a5]">{friend.music}</p>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </div>
        </aside>

        <main className="min-w-0 flex-1 lg:max-w-[820px]">
          {children}
        </main>

        <aside className="hidden w-[355px] shrink-0 xl:block">
          <div className="space-y-4">
            <RightCard title="SOLICITUDES" action="Ver todas">
              <p className="text-sm text-[#7c8da5]">No tienes solicitudes pendientes.</p>
            </RightCard>

            <RightCard title="EVENTOS PATROCINADOS" action="Ver todos">
              <div className="flex gap-3">
                <div className="grid h-16 w-20 shrink-0 place-items-center bg-[#edf2f7] text-xs text-[#7c8da5]">Evento</div>
                <div>
                  <p className="font-bold text-[#0758bd]">Concierto Indie en Madrid</p>
                  <p className="mt-1 text-xs text-[#7c8da5]">Viernes, 24 de Mayo a las 21:00</p>
                  <p className="text-xs text-[#7c8da5]">Sala La Riviera</p>
                  <button className="mt-3 rounded-full border border-[#3977c8] px-3 py-1 text-xs font-semibold text-[#1761b5]">Añadir a mi calendario</button>
                </div>
              </div>
            </RightCard>

            <section className="border border-[#dce2ea] bg-white p-5">
              <div className="mb-4 flex items-center justify-between">
                <h3 className="text-xs font-bold uppercase tracking-wide text-[#718198]">CALENDARIO</h3>
                <CalendarDays size={17} className="text-[#718198]" />
              </div>
              <div className="flex items-center justify-between px-3 text-sm font-semibold text-[#24354c]">
                <span>‹</span><span>Julio 2026</span><span>›</span>
              </div>
              <div className="mt-5 grid grid-cols-7 gap-y-4 text-center text-xs text-[#7b899d]">
                {['Lu','Ma','Mi','Ju','Vi','Sa','Do'].map((day) => <span key={day} className="font-semibold">{day}</span>)}
                {['29','30','1','2','3','4','5','6','7','8','9','10','11','12','13','14','15','16','17','18','19','20','21','22','23','24','25','26','27','28','29','30','31','1','2'].map((day, index) => (
                  <span key={`${day}-${index}`} className={day === '31' && index === 32 ? 'mx-auto grid h-7 w-7 place-items-center rounded-full border border-[#1764be] text-[#1764be]' : ''}>{day}</span>
                ))}
              </div>
            </section>
          </div>
        </aside>
      </div>
    </div>
  );
}

function HeaderLink({ to, label, active = false, badge, icon }: { to: '/feed' | '/messages' | '/friends' | '/events'; label: string; active?: boolean; badge?: string; icon?: React.ReactNode }) {
  return (
    <Link to={to} className={`relative flex h-full items-center gap-2 px-5 text-sm font-bold transition ${active ? 'border-b-4 border-white bg-white/10' : 'text-white/90 hover:bg-white/10'}`}>
      {icon}{label}
      {badge && <span className="absolute right-1 top-2 rounded-full bg-red-500 px-1.5 text-[9px] leading-4">{badge}</span>}
    </Link>
  );
}

function SideNavItem({ to, icon, label, active = false }: { to: '/feed' | '/events' | '/friends'; icon: React.ReactNode; label: string; active?: boolean }) {
  return (
    <Link to={to} className={`mb-1 flex items-center gap-4 px-4 py-3 text-sm transition ${active ? 'rounded bg-[#edf2f7] font-bold text-[#064a9f]' : 'text-[#33445b] hover:bg-[#f4f7fa]'}`}>
      {icon}<span>{label}</span>
    </Link>
  );
}

function RightCard({ title, action, children }: { title: string; action: string; children: React.ReactNode }) {
  return (
    <section className="border border-[#dce2ea] bg-white p-5">
      <div className="mb-4 flex items-center justify-between border-b border-[#edf0f4] pb-3">
        <h3 className="text-xs font-bold text-[#66778f]">{title}</h3>
        <button className="text-xs font-semibold text-[#0758bd]">{action}</button>
      </div>
      {children}
    </section>
  );
}
