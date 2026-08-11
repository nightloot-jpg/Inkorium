import { Link, useNavigate, useRouter } from '@tanstack/react-router';
import {
  Bell,
  CalendarDays,
  Camera,
  ChevronDown,
  Home,
  Image as ImageIcon,
  LogOut,
  MessageSquare,
  Music2,
  Search,
  Settings,
  Users,
  Video,
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
  const displayName = user?.user_metadata?.full_name || user?.user_metadata?.username || 'Usuario';

  const handleSignOut = () => {
    logoutMutation.mutate(undefined, {
      onSuccess: async () => {
        await router.invalidate();
        navigate({ to: '/login' });
      },
    });
  };

  return (
    <div className="min-h-screen bg-[#f5f7fa] text-[#26364d]">
      <header className="h-14 bg-[#0750a6] text-white shadow-[0_1px_4px_rgba(0,0,0,.18)]">
        <div className="mx-auto flex h-full w-full max-w-[1440px] items-center px-4">
          <Link to="/feed" className="flex h-full w-[180px] shrink-0 items-center gap-2">
            <img src="/tuenti_inkorium_logo.svg" alt="Inkorium" className="h-7 w-7 brightness-0 invert" />
            <span className="text-[21px] font-extrabold tracking-tight">inkorium</span>
          </Link>

          <nav className="hidden h-full md:flex">
            <HeaderLink to="/feed" label="Inicio" active />
            <HeaderLink to="/messages" label="Mensajes" badge="3" />
            <HeaderLink to="/friends" label="Personas" />
            <HeaderLink to="/events" label="Música" icon={<Music2 size={16} />} />
          </nav>

          <div className="mx-5 hidden min-w-0 flex-1 md:block">
            <div className="mx-auto max-w-[620px]">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-[#91add1]" size={17} />
                <input
                  type="search"
                  placeholder="Buscar personas, música, vídeos..."
                  className="h-9 w-full rounded-full border border-[#003f8e] bg-[#06499b] px-11 text-sm text-white outline-none placeholder:text-[#b7c9df] focus:border-white/40"
                />
              </div>
            </div>
          </div>

          <div className="ml-auto flex shrink-0 items-center gap-1 sm:gap-3">
            <Link to="/notifications" className="relative rounded-full p-2 hover:bg-white/10" aria-label="Notificaciones">
              <Bell size={19} />
              <span className="absolute right-0 top-0 min-w-4 rounded-full bg-[#ef4444] px-1 text-center text-[9px] font-bold leading-4">5</span>
            </Link>
            <button type="button" className="rounded-full p-2 hover:bg-white/10" aria-label="Música"><Music2 size={19} /></button>
            <span className="mx-1 hidden h-7 w-px bg-white/20 sm:block" />
            <Link to="/profile/$username" params={{ username: user?.user_metadata?.username || 'me' }} className="flex items-center gap-2 rounded-full px-1 py-1 hover:bg-white/10">
              <img src={avatar} alt="Perfil" className="h-8 w-8 rounded-full border border-white/40 object-cover" />
              <span className="hidden max-w-28 truncate text-sm font-bold sm:block">{displayName}</span>
              <ChevronDown size={14} className="hidden sm:block" />
            </Link>
            <button type="button" onClick={handleSignOut} className="rounded-full p-2 hover:bg-white/10" aria-label="Cerrar sesión">
              <LogOut size={18} />
            </button>
          </div>
        </div>
      </header>

      <div className="mx-auto grid w-full max-w-[1440px] grid-cols-1 gap-5 px-4 py-4 lg:grid-cols-[250px_minmax(0,1fr)] xl:grid-cols-[250px_minmax(0,1fr)_290px]">
        <aside className="hidden lg:block">
          <div className="space-y-4">
            <section className="border border-[#d8e0e9] bg-white p-4 shadow-[0_1px_3px_rgba(0,0,0,.04)]">
              <div className="flex items-center gap-3">
                <img src={avatar} alt="Perfil" className="h-[88px] w-[88px] rounded-xl border border-[#dbe2ea] object-cover" />
                <div className="min-w-0">
                  <p className="truncate text-[16px] font-bold text-[#1d2c40]">{displayName}</p>
                  <p className="mt-1 text-sm text-[#7a899d]">Más rápido</p>
                  <p className="mt-1 flex items-center gap-2 text-sm text-[#25b95d]"><span className="h-2.5 w-2.5 rounded-full bg-[#28c96b]" />En línea</p>
                  <Link to="/profile/$username" params={{ username: user?.user_metadata?.username || 'me' }} className="mt-1 inline-block text-sm font-semibold text-[#0758bd]">Ver mi perfil »</Link>
                </div>
              </div>
            </section>

            <section className="border border-[#d8e0e9] bg-white p-3">
              <SideNavItem to="/feed" icon={<Home size={19} />} label="Novedades" active />
              <SideNavItem to="/feed" icon={<ImageIcon size={19} />} label="Fotos" />
              <SideNavItem to="/feed" icon={<Video size={19} />} label="Vídeos" />
              <SideNavItem to="/events" icon={<Music2 size={19} />} label="Música" />
              <SideNavItem to="/events" icon={<CalendarDays size={19} />} label="Eventos" />
              <SideNavItem to="/friends" icon={<Users size={19} />} label="Grupos" />
              <SideNavItem to="/friends" icon={<Users size={19} />} label="Páginas" />
              <SideNavItem to="/feed" icon={<BarIcon />} label="Encuestas" />
              <SideNavItem to="/feed" icon={<BookmarkIcon />} label="Guardados" />
              <SideNavItem to="/feed" icon={<Settings size={19} />} label="Configuración" />
            </section>

            <section className="border border-[#d8e0e9] bg-white p-4">
              <div className="mb-2 flex items-center justify-between">
                <h3 className="text-[11px] font-bold uppercase tracking-wide text-[#738299]">Amigos conectados (1)</h3>
                <Link to="/friends" className="text-[11px] font-semibold text-[#0758bd]">Ver todos »</Link>
              </div>
              {friends.map((friend) => (
                <div key={friend.name} className="flex items-center gap-3 py-2">
                  <div className="relative shrink-0">
                    <img src={`https://i.pravatar.cc/150?img=${friend.image}`} alt="" className="h-9 w-9 rounded-full object-cover" />
                    <span className="absolute bottom-0 right-[-1px] h-3 w-3 rounded-full border-2 border-white bg-[#27c96b]" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold">{friend.name}</p>
                    <p className="truncate text-xs text-[#7c8da5]">{friend.music}</p>
                  </div>
                </div>
              ))}
            </section>
          </div>
        </aside>

        <main className="min-w-0">{children}</main>

        <aside className="hidden xl:block">
          <div className="space-y-4">
            <RightCard title="SOLICITUDES" action="Ver todas">
              <p className="text-sm text-[#7a899d]">No tienes solicitudes pendientes.</p>
            </RightCard>

            <RightCard title="EVENTOS PATROCINADOS" action="Ver todos">
              <div className="flex gap-3">
                <div className="grid h-16 w-[70px] shrink-0 place-items-center bg-[#eef2f6] text-xs text-[#8492a5]">Evento</div>
                <div className="min-w-0">
                  <p className="text-sm font-bold text-[#0758bd]">Concierto Indie en Madrid</p>
                  <p className="mt-1 text-xs text-[#7a899d]">Viernes, 24 de Mayo a las 21:00</p>
                  <p className="text-xs text-[#7a899d]">Sala La Riviera</p>
                  <button type="button" className="mt-3 rounded-full border border-[#3977c8] px-3 py-1 text-xs font-semibold text-[#1761b5]">Añadir a mi calendario</button>
                </div>
              </div>
            </RightCard>

            <section className="border border-[#d8e0e9] bg-white p-4">
              <div className="mb-4 flex items-center justify-between">
                <h3 className="text-[11px] font-bold uppercase tracking-wide text-[#738299]">CALENDARIO</h3>
                <CalendarDays size={17} className="text-[#738299]" />
              </div>
              <div className="flex items-center justify-between px-2 text-sm font-semibold text-[#26364d]"><span>‹</span><span>Julio 2026</span><span>›</span></div>
              <div className="mt-5 grid grid-cols-7 gap-y-4 text-center text-xs text-[#7d8ba0]">
                {['Lu','Ma','Mi','Ju','Vi','Sa','Do'].map((day) => <span key={day} className="font-semibold">{day}</span>)}
                {['29','30','1','2','3','4','5','6','7','8','9','10','11','12','13','14','15','16','17','18','19','20','21','22','23','24','25','26','27','28','29','30','31','1','2'].map((day, index) => <span key={`${day}-${index}`} className={index === 32 ? 'mx-auto grid h-7 w-7 place-items-center rounded-full border border-[#1764be] text-[#1764be]' : ''}>{day}</span>)}
              </div>
            </section>
          </div>
        </aside>
      </div>
    </div>
  );
}

function HeaderLink({ to, label, active = false, badge, icon }: { to: '/feed' | '/messages' | '/friends' | '/events'; label: string; active?: boolean; badge?: string; icon?: React.ReactNode }) {
  return <Link to={to} className={`relative flex h-full items-center gap-2 px-5 text-sm font-bold ${active ? 'border-b-4 border-white bg-white/10' : 'hover:bg-white/10'}`}>{icon}{label}{badge && <span className="absolute right-1 top-1 rounded-full bg-red-500 px-1.5 text-[9px] leading-4">{badge}</span>}</Link>;
}

function SideNavItem({ to, icon, label, active = false }: { to: '/feed' | '/events' | '/friends'; icon: React.ReactNode; label: string; active?: boolean }) {
  return <Link to={to} className={`flex items-center gap-3 px-3 py-2.5 text-sm ${active ? 'rounded bg-[#edf2f7] font-bold text-[#064a9f]' : 'text-[#33445b] hover:bg-[#f5f7fa]'}`}>{icon}<span>{label}</span></Link>;
}

function RightCard({ title, action, children }: { title: string; action: string; children: React.ReactNode }) {
  return <section className="border border-[#d8e0e9] bg-white p-4"><div className="mb-4 flex items-center justify-between border-b border-[#edf0f4] pb-3"><h3 className="text-[11px] font-bold text-[#66778f]">{title}</h3><button type="button" className="text-xs font-semibold text-[#0758bd]">{action}</button></div>{children}</section>;
}

function BarIcon() { return <span className="inline-flex h-[19px] w-[19px] items-end justify-center gap-[2px]"><i className="h-2 w-[3px] bg-current" /><i className="h-3.5 w-[3px] bg-current" /><i className="h-5 w-[3px] bg-current" /></span>; }
function BookmarkIcon() { return <span className="inline-flex h-[19px] w-[19px] items-center justify-center text-[20px] leading-none">♡</span>; }
