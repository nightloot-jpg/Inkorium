import { Link, useNavigate, useRouter } from '@tanstack/react-router';
import { Bell, CalendarDays, ChevronDown, Home, Image as ImageIcon, LogOut, Music2, Settings, Users, Video } from 'lucide-react';
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
    <div className="min-h-screen bg-slate-50 text-slate-800">
      <header className="h-14 bg-blue-800 text-white shadow-sm">
        <div className="mx-auto flex h-full w-full max-w-screen-2xl items-center px-4">
          <Link to="/feed" className="flex h-full w-44 shrink-0 items-center gap-2">
            <img src="/tuenti_inkorium_logo.svg" alt="Inkorium" className="h-8 w-8 brightness-0 invert" />
            <span className="text-xl font-extrabold tracking-tight">inkorium</span>
          </Link>

          <nav className="hidden h-full md:flex">
            <HeaderLink to="/feed" label="Inicio" active />
            <HeaderLink to="/messages" label="Mensajes" badge="3" />
            <HeaderLink to="/friends" label="Personas" />
            <HeaderLink to="/events" label="Música" icon={<Music2 size={16} />} />
          </nav>

          <div className="mx-5 hidden min-w-0 flex-1 md:block">
            <input type="search" placeholder="Buscar personas, música, vídeos..." className="mx-auto block h-9 w-full max-w-2xl rounded-full border border-blue-950 bg-blue-700 px-4 text-sm text-white outline-none placeholder:text-blue-200" />
          </div>

          <div className="ml-auto flex shrink-0 items-center gap-1 sm:gap-3">
            <Link to="/notifications" className="relative rounded-full p-2 hover:bg-blue-700" aria-label="Notificaciones"><Bell size={19} /><span className="absolute right-0 top-0 min-w-4 rounded-full bg-red-500 px-1 text-center text-[9px] font-bold leading-4">5</span></Link>
            <button type="button" className="rounded-full p-2 hover:bg-blue-700" aria-label="Música"><Music2 size={19} /></button>
            <span className="mx-1 hidden h-7 w-px bg-blue-600 sm:block" />
            <Link to="/profile/$username" params={{ username: user?.user_metadata?.username || 'me' }} className="flex items-center gap-2 rounded-full px-1 py-1 hover:bg-blue-700">
              <img src={avatar} alt="Perfil" className="h-8 w-8 rounded-full border border-white/40 object-cover" />
              <span className="hidden max-w-28 truncate text-sm font-bold sm:block">{displayName}</span>
              <ChevronDown size={14} className="hidden sm:block" />
            </Link>
            <button type="button" onClick={handleSignOut} className="rounded-full p-2 hover:bg-blue-700" aria-label="Cerrar sesión"><LogOut size={18} /></button>
          </div>
        </div>
      </header>

      <div className="inkorium-content-grid">
        <aside className="inkorium-left-column">
          <div className="space-y-4">
            <section className="border border-slate-200 bg-white p-4 shadow-sm">
              <div className="flex items-center gap-3">
                <img src={avatar} alt="Perfil" className="h-24 w-24 rounded-xl border border-slate-200 object-cover" />
                <div className="min-w-0">
                  <p className="truncate text-base font-bold">{displayName}</p>
                  <p className="mt-1 text-sm text-slate-500">Más rápido</p>
                  <p className="mt-1 flex items-center gap-2 text-sm text-green-600"><span className="h-2.5 w-2.5 rounded-full bg-green-500" />En línea</p>
                  <Link to="/profile/$username" params={{ username: user?.user_metadata?.username || 'me' }} className="mt-1 inline-block text-sm font-semibold text-blue-700">Ver mi perfil »</Link>
                </div>
              </div>
            </section>

            <section className="border border-slate-200 bg-white p-3">
              <SideNavItem to="/feed" icon={<Home size={19} />} label="Novedades" active />
              <SideNavItem to="/feed" icon={<ImageIcon size={19} />} label="Fotos" />
              <SideNavItem to="/feed" icon={<Video size={19} />} label="Vídeos" />
              <SideNavItem to="/events" icon={<Music2 size={19} />} label="Música" />
              <SideNavItem to="/events" icon={<CalendarDays size={19} />} label="Eventos" />
              <SideNavItem to="/friends" icon={<Users size={19} />} label="Grupos" />
              <SideNavItem to="/friends" icon={<Users size={19} />} label="Páginas" />
              <SideNavItem to="/feed" icon={<span className="inline-flex h-5 w-5 items-end justify-center gap-0.5"><i className="h-2 w-0.5 bg-current" /><i className="h-3.5 w-0.5 bg-current" /><i className="h-5 w-0.5 bg-current" /></span>} label="Encuestas" />
              <SideNavItem to="/feed" icon={<span className="inline-flex h-5 w-5 items-center justify-center text-xl">♡</span>} label="Guardados" />
              <SideNavItem to="/feed" icon={<Settings size={19} />} label="Configuración" />
            </section>

            <section className="border border-slate-200 bg-white p-4">
              <div className="mb-2 flex items-center justify-between"><h3 className="text-xs font-bold uppercase tracking-wide text-slate-500">Amigos conectados (3)</h3><Link to="/friends" className="text-xs font-semibold text-blue-700">Ver todos »</Link></div>
              {friends.map((friend) => <div key={friend.name} className="flex items-center gap-3 py-2"><div className="relative shrink-0"><img src={`https://i.pravatar.cc/150?img=${friend.image}`} alt="" className="h-10 w-10 rounded-full object-cover" /><span className="absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-white bg-green-500" /></div><div className="min-w-0"><p className="text-sm font-semibold">{friend.name}</p><p className="truncate text-xs text-slate-500">{friend.music}</p></div></div>)}
            </section>
          </div>
        </aside>

        <main className="inkorium-center-column">{children}</main>

        <aside className="inkorium-right-column">
          <div className="space-y-4">
            <RightCard title="SOLICITUDES" action="Ver todas"><p className="text-sm text-slate-500">No tienes solicitudes pendientes.</p></RightCard>
            <RightCard title="EVENTOS PATROCINADOS" action="Ver todos">
              <div className="flex gap-3"><div className="grid h-16 w-20 shrink-0 place-items-center bg-slate-100 text-xs text-slate-500">Evento</div><div className="min-w-0"><p className="text-sm font-bold text-blue-700">Concierto Indie en Madrid</p><p className="mt-1 text-xs text-slate-500">Viernes, 24 de Mayo a las 21:00</p><p className="text-xs text-slate-500">Sala La Riviera</p><button type="button" className="mt-3 rounded-full border border-blue-500 px-3 py-1 text-xs font-semibold text-blue-700">Añadir a mi calendario</button></div></div>
            </RightCard>
            <section className="border border-slate-200 bg-white p-4">
              <div className="mb-4 flex items-center justify-between"><h3 className="text-xs font-bold uppercase tracking-wide text-slate-500">CALENDARIO</h3><CalendarDays size={17} className="text-slate-500" /></div>
              <div className="flex items-center justify-between px-2 text-sm font-semibold"><span>‹</span><span>Julio 2026</span><span>›</span></div>
              <div className="mt-5 grid grid-cols-7 gap-y-4 text-center text-xs text-slate-500">
                {['Lu','Ma','Mi','Ju','Vi','Sa','Do'].map((day) => <span key={day} className="font-semibold">{day}</span>)}
                {['29','30','1','2','3','4','5','6','7','8','9','10','11','12','13','14','15','16','17','18','19','20','21','22','23','24','25','26','27','28','29','30','31','1','2'].map((day, index) => <span key={`${day}-${index}`} className={index === 32 ? 'mx-auto grid h-7 w-7 place-items-center rounded-full border border-blue-600 text-blue-700' : ''}>{day}</span>)}
              </div>
            </section>
          </div>
        </aside>
      </div>
    </div>
  );
}

function HeaderLink({ to, label, active = false, badge, icon }: { to: '/feed' | '/messages' | '/friends' | '/events'; label: string; active?: boolean; badge?: string; icon?: React.ReactNode }) {
  return <Link to={to} className={`relative flex h-full items-center gap-2 px-4 text-sm font-bold ${active ? 'border-b-4 border-white bg-blue-700' : 'hover:bg-blue-700'}`}>{icon}{label}{badge && <span className="absolute right-1 top-1 rounded-full bg-red-500 px-1.5 text-[9px] leading-4">{badge}</span>}</Link>;
}

function SideNavItem({ to, icon, label, active = false }: { to: '/feed' | '/events' | '/friends'; icon: React.ReactNode; label: string; active?: boolean }) {
  return <Link to={to} className={`flex items-center gap-3 px-3 py-2.5 text-sm ${active ? 'rounded bg-slate-100 font-bold text-blue-800' : 'text-slate-700 hover:bg-slate-50'}`}>{icon}<span>{label}</span></Link>;
}

function RightCard({ title, action, children }: { title: string; action: string; children: React.ReactNode }) {
  return <section className="border border-slate-200 bg-white p-4"><div className="mb-4 flex items-center justify-between border-b border-slate-100 pb-3"><h3 className="text-xs font-bold text-slate-500">{title}</h3><button type="button" className="text-xs font-semibold text-blue-700">{action}</button></div>{children}</section>;
}
