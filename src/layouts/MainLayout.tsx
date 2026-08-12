import { Link, useNavigate, useRouter } from '@tanstack/react-router';
import { Bell, CalendarDays, ChevronDown, Home, Image as ImageIcon, LogOut, Music2, Settings, Users, Video } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { useLogout } from '../features/auth/hooks/useAuth';

const friends = [
  { name: 'Amigo 1', image: 21, music: 'Escuchando Spotify' },
  { name: 'Amigo 2', image: 22, music: 'Escuchando Spotify' },
  { name: 'Amigo 3', image: 23, music: 'Escuchando Spotify' },
];

export function MainLayout({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const logoutMutation = useLogout();
  const navigate = useNavigate();
  const router = useRouter();
  const avatar = user?.user_metadata?.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.user_metadata?.full_name || 'User')}`;
  const displayName = user?.user_metadata?.full_name || user?.user_metadata?.username || 'Usuario';

  const handleSignOut = () => logoutMutation.mutate(undefined, { onSuccess: async () => { await router.invalidate(); navigate({ to: '/login' }); } });

  return <div className="min-h-screen bg-[#f4f6f8] text-[#26364a]">
    <header className="h-14 bg-[#0750a5] text-white shadow-sm">
      <div className="mx-auto flex h-full w-full max-w-[1560px] items-center px-4">
        <Link to="/feed" className="flex h-full w-[175px] shrink-0 items-center gap-3"><img src="/tuenti_inkorium_logo.svg" alt="Inkorium" className="h-9 w-9 brightness-0 invert" /><span className="text-[21px] font-extrabold tracking-tight">inkorium</span></Link>
        <nav className="hidden h-full md:flex"><HeaderLink to="/feed" label="Inicio" active /><HeaderLink to="/messages" label="Mensajes" badge="3" /><HeaderLink to="/friends" label="Personas" /><HeaderLink to="/events" label="Música" icon={<Music2 size={16} />} /></nav>
        <div className="mx-5 hidden min-w-0 flex-1 md:block"><input type="search" placeholder="Buscar personas, música, vídeos..." className="mx-auto block h-9 w-full max-w-[700px] rounded-full border border-[#003e85] bg-[#064895] px-5 text-sm text-white outline-none placeholder:text-blue-200" /></div>
        <div className="ml-auto flex shrink-0 items-center gap-2"><Link to="/notifications" className="relative rounded-full p-2 hover:bg-[#06458f]" aria-label="Notificaciones"><Bell size={19} /><span className="absolute right-0 top-0 min-w-4 rounded-full bg-red-500 px-1 text-center text-[9px] font-bold leading-4">5</span></Link><button type="button" className="rounded-full p-2 hover:bg-[#06458f]" aria-label="Música"><Music2 size={19} /></button><span className="mx-1 h-7 w-px bg-blue-400/40" /><Link to="/profile/$username" params={{ username: user?.user_metadata?.username || 'me' }} className="flex items-center gap-2 rounded-full px-1 py-1 hover:bg-[#06458f]"><img src={avatar} alt="Perfil" className="h-8 w-8 rounded-full border border-white/40 object-cover" /><span className="hidden max-w-28 truncate text-sm font-bold sm:block">{displayName}</span><ChevronDown size={14} /></Link><button type="button" onClick={handleSignOut} className="rounded-full p-2 hover:bg-[#06458f]" aria-label="Cerrar sesión"><LogOut size={18} /></button></div>
      </div>
    </header>

    <div className="mx-auto w-full max-w-[1560px] px-4 py-4" style={{ display: 'grid', gridTemplateColumns: '320px minmax(0, 820px) 320px', gap: '24px', alignItems: 'start' }}>
      <aside className="min-w-0 space-y-4">
        <section className="border border-[#d9e1e8] bg-white p-4 shadow-sm"><div className="flex items-center gap-3"><img src={avatar} alt="Perfil" className="h-24 w-24 rounded-xl border border-[#d9e1e8] object-cover" /><div className="min-w-0"><p className="truncate text-base font-bold">{displayName}</p><p className="mt-1 text-sm text-[#6d7d90]">Más rápido</p><p className="mt-1 flex items-center gap-2 text-sm text-[#20b864]"><span className="h-2.5 w-2.5 rounded-full bg-[#20b864]" />En línea</p><Link to="/profile/$username" params={{ username: user?.user_metadata?.username || 'me' }} className="mt-1 inline-block text-sm font-semibold text-[#0750a5]">Ver mi perfil »</Link></div></div></section>
        <section className="border border-[#d9e1e8] bg-white p-3"><SideNavItem to="/feed" icon={<Home size={19} />} label="Novedades" active /><SideNavItem to="/feed" icon={<ImageIcon size={19} />} label="Fotos" /><SideNavItem to="/feed" icon={<Video size={19} />} label="Vídeos" /><SideNavItem to="/events" icon={<Music2 size={19} />} label="Música" /><SideNavItem to="/events" icon={<CalendarDays size={19} />} label="Eventos" /><SideNavItem to="/friends" icon={<Users size={19} />} label="Grupos" /><SideNavItem to="/friends" icon={<Users size={19} />} label="Páginas" /><SideNavItem to="/feed" icon={<span className="text-lg">▥</span>} label="Encuestas" /><SideNavItem to="/feed" icon={<span className="text-xl">♡</span>} label="Guardados" /><SideNavItem to="/feed" icon={<Settings size={19} />} label="Configuración" /></section>
        <section className="border border-[#d9e1e8] bg-white p-4"><div className="mb-2 flex items-center justify-between"><h3 className="text-xs font-bold uppercase tracking-wide text-[#6d7d90]">Amigos conectados (3)</h3><Link to="/friends" className="text-xs font-semibold text-[#0750a5]">Ver todos »</Link></div>{friends.map((friend) => <div key={friend.name} className="flex items-center gap-3 py-2"><div className="relative shrink-0"><img src={`https://i.pravatar.cc/150?img=${friend.image}`} alt="" className="h-10 w-10 rounded-full object-cover" /><span className="absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-white bg-[#20b864]" /></div><div className="min-w-0"><p className="text-sm font-semibold">{friend.name}</p><p className="truncate text-xs text-[#6d7d90]">{friend.music}</p></div></div>)}</section>
      </aside>

      <main className="min-w-0">{children}</main>

      <aside className="min-w-0 space-y-4"><RightCard title="SOLICITUDES" action="Ver todas"><p className="text-sm text-[#6d7d90]">No tienes solicitudes pendientes.</p></RightCard><RightCard title="EVENTOS PATROCINADOS" action="Ver todos"><div className="flex gap-3"><div className="grid h-16 w-20 shrink-0 place-items-center bg-[#eef2f6] text-xs text-[#6d7d90]">Evento</div><div className="min-w-0"><p className="text-sm font-bold text-[#0750a5]">Concierto Indie en Madrid</p><p className="mt-1 text-xs text-[#6d7d90]">Viernes, 24 de Mayo a las 21:00</p><p className="text-xs text-[#6d7d90]">Sala La Riviera</p><button type="button" className="mt-3 rounded-full border border-[#4f89cf] px-3 py-1 text-xs font-semibold text-[#0750a5]">Añadir a mi calendario</button></div></div></RightCard><section className="border border-[#d9e1e8] bg-white p-4"><div className="mb-4 flex items-center justify-between"><h3 className="text-xs font-bold uppercase tracking-wide text-[#6d7d90]">CALENDARIO</h3><CalendarDays size={17} className="text-[#6d7d90]" /></div><div className="flex items-center justify-between px-2 text-sm font-semibold"><span>‹</span><span>Julio 2026</span><span>›</span></div><div className="mt-5 grid grid-cols-7 gap-y-4 text-center text-xs text-[#6d7d90]">{['Lu','Ma','Mi','Ju','Vi','Sa','Do'].map((day) => <span key={day} className="font-semibold">{day}</span>)}{['29','30','1','2','3','4','5','6','7','8','9','10','11','12','13','14','15','16','17','18','19','20','21','22','23','24','25','26','27','28','29','30','31','1','2'].map((day, index) => <span key={`${day}-${index}`} className={index === 32 ? 'mx-auto grid h-7 w-7 place-items-center rounded-full border border-[#0750a5] text-[#0750a5]' : ''}>{day}</span>)}</div></section></aside>
    </div>
  </div>;
}

function HeaderLink({ to, label, active = false, badge, icon }: { to: '/feed' | '/messages' | '/friends' | '/events'; label: string; active?: boolean; badge?: string; icon?: React.ReactNode }) { return <Link to={to} className={`relative flex h-full items-center gap-2 px-4 text-sm font-bold ${active ? 'border-b-4 border-white bg-[#06458f]' : 'hover:bg-[#06458f]'}`}>{icon}{label}{badge && <span className="absolute right-1 top-1 rounded-full bg-red-500 px-1.5 text-[9px] leading-4">{badge}</span>}</Link>; }
function SideNavItem({ to, icon, label, active = false }: { to: '/feed' | '/events' | '/friends'; icon: React.ReactNode; label: string; active?: boolean }) { return <Link to={to} className={`flex items-center gap-3 rounded px-3 py-2.5 text-sm ${active ? 'bg-[#edf2f8] font-bold text-[#0750a5]' : 'text-[#26364a] hover:bg-[#f7f9fb]'}`}>{icon}<span>{label}</span></Link>; }
function RightCard({ title, action, children }: { title: string; action: string; children: React.ReactNode }) { return <section className="border border-[#d9e1e8] bg-white p-4"><div className="mb-4 flex items-center justify-between border-b border-[#edf0f3] pb-3"><h3 className="text-xs font-bold text-[#6d7d90]">{title}</h3><button type="button" className="text-xs font-semibold text-[#0750a5]">{action}</button></div>{children}</section>; }
