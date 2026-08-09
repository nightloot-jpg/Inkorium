import type { ReactNode } from 'react';
import { Link } from '@tanstack/react-router';
import {
  Bell,
  Bookmark,
  Calendar,
  ChevronDown,
  FileText,
  Gamepad2,
  Heart,
  Home,
  List,
  LogOut,
  Menu,
  MessageSquare,
  Music,
  Search,
  Settings,
  Star,
  User,
  Users,
  Users2,
} from 'lucide-react';
import { useLogout } from '../features/auth/hooks/useAuth';

interface MainLayoutProps {
  children: ReactNode;
}

const avatar = 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=96&q=80';

const navigation = [
  { to: '/feed', label: 'Inicio', icon: Home },
  { to: '/profile', label: 'Mi perfil', icon: User },
  { to: '/friends', label: 'Amigos', icon: Users },
  { to: '/messages', label: 'Mensajes', icon: MessageSquare, badge: '3' },
  { to: '/events', label: 'Eventos', icon: Calendar, badge: '2' },
  { to: '/groups', label: 'Grupos', icon: Users2 },
  { to: '/saved', label: 'Inklog', icon: Bookmark },
  { to: '/videos', label: 'Música', icon: Music },
  { to: '/saved', label: 'Notas', icon: FileText },
  { to: '/gaming', label: 'Juegos', icon: Gamepad2 },
  { to: '/saved', label: 'Favoritos', icon: Star },
  { to: '/saved', label: 'Guardados', icon: Bookmark },
  { to: '/settings', label: 'Listas', icon: List },
  { to: '/settings', label: 'Configuración', icon: Settings },
] as const;

const groups = [
  ['Inkarium Crew', '12.345 miembros', 'https://images.unsplash.com/photo-1516280440614-37939bbacd81?auto=format&fit=crop&w=80&q=80'],
  ['Fotografía Urbana', '6.432 miembros', 'https://images.unsplash.com/photo-1519608487953-e999c86e745d?auto=format&fit=crop&w=80&q=80'],
  ['Música Indie', '9.876 miembros', 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?auto=format&fit=crop&w=80&q=80'],
];

export function MainLayout({ children }: MainLayoutProps) {
  const logoutMutation = useLogout();

  return (
    <div className="min-h-screen bg-[#f5f7fb] text-[#0e1b33]">
      <header className="sticky top-0 z-40 h-16 border-b border-slate-200 bg-white/95 shadow-sm backdrop-blur">
        <div className="mx-auto flex h-full max-w-[1540px] items-center gap-4 px-4 sm:px-6">
          <button className="rounded-lg p-2 text-slate-800 hover:bg-slate-100 lg:hidden" aria-label="Abrir menú">
            <Menu size={22} />
          </button>

          <div className="hidden items-center gap-2 lg:flex">
            <button className="rounded-lg p-2 text-slate-800 hover:bg-slate-100" aria-label="Menú">
              <Menu size={22} />
            </button>
            <label className="flex h-9 w-72 items-center gap-2 rounded-lg bg-slate-50 px-3 text-sm text-slate-500 ring-1 ring-slate-200">
              <Search size={17} />
              <input className="w-full bg-transparent outline-none placeholder:text-slate-500" placeholder="Buscar personas, grupos, música..." />
            </label>
          </div>

          <Link to="/feed" className="absolute left-1/2 -translate-x-1/2 text-[32px] font-black tracking-[-0.11em] text-[#071535] sm:text-[36px]">
            inkorium
          </Link>

          <nav className="ml-auto flex h-full items-center gap-1 text-[#0a1b3e]">
            <Link to="/feed" className="flex h-full items-center border-b-[3px] border-[#1263e9] px-3 text-[#1263e9]" aria-label="Inicio">
              <Home size={23} fill="currentColor" />
            </Link>
            <Link to="/friends" className="hidden rounded-lg p-3 hover:bg-slate-100 sm:block" aria-label="Amigos"><Users size={22} /></Link>
            <Link to="/messages" className="relative rounded-lg p-3 hover:bg-slate-100" aria-label="Mensajes">
              <MessageSquare size={22} />
              <span className="absolute right-1 top-1 grid h-5 min-w-5 place-items-center rounded-full bg-[#1263e9] px-1 text-[10px] font-bold text-white">3</span>
            </Link>
            <Link to="/notifications" className="relative rounded-lg p-3 hover:bg-slate-100" aria-label="Notificaciones">
              <Bell size={22} />
              <span className="absolute right-1 top-1 grid h-5 min-w-5 place-items-center rounded-full bg-[#1263e9] px-1 text-[10px] font-bold text-white">2</span>
            </Link>
            <Link to="/videos" className="hidden rounded-lg p-3 hover:bg-slate-100 md:block" aria-label="Música"><Music size={22} /></Link>
            <button className="ml-1 flex items-center gap-1 rounded-lg p-1.5 hover:bg-slate-100" aria-label="Menú de usuario">
              <img className="h-9 w-9 rounded-full object-cover" src={avatar} alt="Andrés García" />
              <ChevronDown size={15} />
            </button>
          </nav>
        </div>
      </header>

      <div className="mx-auto grid max-w-[1540px] grid-cols-1 gap-5 px-4 py-4 xl:grid-cols-[282px_minmax(0,1fr)_350px] xl:px-6">
        <aside className="hidden xl:block">
          <div className="sticky top-20 space-y-4">
            <section className="rounded-xl border border-slate-100 bg-white p-4 shadow-sm">
              <div className="mb-4 flex items-center gap-3">
                <img className="h-14 w-14 rounded-full object-cover" src={avatar} alt="Andrés García" />
                <div>
                  <p className="font-bold">Andrés García</p>
                  <p className="text-sm text-slate-500">@andres</p>
                  <Link to="/profile" className="text-sm font-medium text-[#0759d6]">Ver mi perfil</Link>
                </div>
              </div>

              <nav className="space-y-0.5">
                {navigation.map(({ to, label, icon: Icon, badge }) => (
                  <Link
                    key={label}
                    to={to}
                    className="group flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 [&.active]:bg-[#1263e9] [&.active]:text-white"
                  >
                    <Icon size={18} />
                    <span className="flex-1">{label}</span>
                    {badge && <span className="grid h-5 min-w-5 place-items-center rounded-md bg-slate-100 px-1 text-[11px] font-bold text-[#0759d6] group-[.active]:bg-white/20 group-[.active]:text-white">{badge}</span>}
                  </Link>
                ))}
                <button onClick={() => logoutMutation.mutate()} className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50">
                  <LogOut size={18} /> Salir
                </button>
              </nav>
            </section>

            <section className="rounded-xl border border-slate-100 bg-white p-4 shadow-sm">
              <div className="mb-3 flex items-center justify-between">
                <h2 className="text-xs font-extrabold uppercase tracking-wide">Inkcrew destacados</h2>
                <Link to="/groups" className="text-xs font-semibold text-[#0759d6]">Ver todos</Link>
              </div>
              <div className="space-y-3">
                {groups.map(([name, members, image]) => (
                  <div key={name} className="flex items-center gap-3">
                    <img className="h-10 w-10 rounded-md object-cover" src={image} alt="" />
                    <div>
                      <p className="text-sm font-semibold">{name}</p>
                      <p className="text-xs text-slate-500">{members}</p>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </div>
        </aside>

        <main className="min-w-0">{children}</main>

        <aside className="hidden xl:block">
          <div className="sticky top-20 space-y-4">
            <section className="rounded-xl border border-slate-100 bg-white p-4 shadow-sm">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-sm font-extrabold uppercase">Próximos eventos</h2>
                <Link to="/events" className="text-xs font-semibold text-[#0759d6]">Ver todos</Link>
              </div>
              <div className="space-y-4">
                {[
                  ['24', 'MAY', 'Fiesta Universitaria 2024', 'Viernes, 24 Mayo · 23:00', 'Sala Ink · Madrid'],
                  ['25', 'MAY', 'Concierto: The Waves', 'Sábado, 25 Mayo · 21:30', 'La Riviera · Madrid'],
                  ['26', 'MAY', 'Cumple de Laura', 'Domingo, 26 Mayo · 17:00', 'En su casa'],
                ].map(([day, month, name, time, place]) => (
                  <div key={name} className="flex gap-3">
                    <div className="grid h-12 w-12 shrink-0 place-items-center rounded-lg bg-[#f3f6fc] text-center leading-none">
                      <strong className="text-base">{day}</strong>
                      <span className="text-[9px] font-bold text-slate-500">{month}</span>
                    </div>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-bold text-[#0759d6]">{name}</p>
                      <p className="text-xs text-slate-500">{time}</p>
                      <p className="text-xs text-slate-500">{place}</p>
                    </div>
                  </div>
                ))}
              </div>
              <Link to="/events" className="mt-4 block rounded-md bg-slate-50 py-2 text-center text-xs font-bold text-[#0759d6] ring-1 ring-slate-200">Crear evento</Link>
            </section>

            <section className="rounded-xl border border-slate-100 bg-white p-4 shadow-sm">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-sm font-extrabold uppercase">Música que suena</h2>
                <Link to="/videos" className="text-xs font-semibold text-[#0759d6]">Ver playlist</Link>
              </div>
              <div className="flex items-center gap-3">
                <img className="h-14 w-14 rounded-lg object-cover" src="https://images.unsplash.com/photo-1516280440614-37939bbacd81?auto=format&fit=crop&w=120&q=80" alt="" />
                <div><p className="text-sm font-bold">The Killers</p><p className="text-xs text-slate-500">Mr. Brightside</p></div>
              </div>
              <div className="mt-4 h-1 rounded-full bg-slate-200"><div className="h-1 w-1/4 rounded-full bg-[#1263e9]" /></div>
              <div className="mt-4 flex items-center justify-center gap-8 text-[#0a1b3e]">
                <button aria-label="Anterior">◀</button><button className="grid h-9 w-9 place-items-center rounded-full bg-[#0b1e46] text-white" aria-label="Reproducir">▶</button><button aria-label="Siguiente">▶</button>
              </div>
            </section>

            <section className="rounded-xl border border-slate-100 bg-white p-4 shadow-sm">
              <div className="mb-4 flex items-center justify-between"><h2 className="text-sm font-extrabold uppercase">Cumpleaños</h2><Link to="/friends" className="text-xs font-semibold text-[#0759d6]">Ver todos</Link></div>
              <div className="space-y-3 text-sm">
                {['Laura Sánchez · Hoy', 'Pablo Ruiz · Mañana', 'María López · 25 Mayo'].map((person) => <div key={person} className="flex items-center justify-between"><span>{person}</span><GiftIcon /></div>)}
              </div>
            </section>

            <section className="rounded-xl border border-slate-100 bg-white p-4 shadow-sm">
              <div className="mb-3 flex items-center justify-between"><h2 className="text-sm font-extrabold uppercase">Notas recientes</h2><Link to="/saved" className="text-xs font-semibold text-[#0759d6]">Ver todas</Link></div>
              {['Ideas para el nuevo proyecto', 'Lista de películas', 'Frases que inspiran'].map((note) => <div className="flex items-center gap-2 py-2 text-sm" key={note}><FileText size={16} className="text-slate-400" /><span>{note}</span></div>)}
            </section>
          </div>
        </aside>
      </div>

      <footer className="mx-auto hidden max-w-[1540px] gap-8 px-6 py-6 text-xs text-slate-500 xl:flex">
        <span>Inkorium © 2024</span><span>Español</span><span>Privacidad</span><span>Términos</span><span>Ayuda</span>
      </footer>
    </div>
  );
}

function GiftIcon() {
  return <span className="text-lg" aria-label="Regalo">🎁</span>;
}
