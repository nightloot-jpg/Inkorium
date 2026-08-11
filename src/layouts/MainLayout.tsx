import { Link, useNavigate, useRouter } from '@tanstack/react-router';
import { Home, Users, MessageSquare, Bell, Calendar, Image as ImageIcon, Music, Gamepad2, Settings, LogOut, Search, StickyNote } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { useLogout } from '../features/auth/hooks/useAuth';

export function MainLayout({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const logoutMutation = useLogout();
  const navigate = useNavigate();
  const router = useRouter();

  const handleSignOut = async () => {

    logoutMutation.mutate(undefined, { onSuccess: async () => { await router.invalidate(); navigate({ to: '/login' }); } });
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans">
      <header className="sticky top-0 z-50 flex h-[54px] items-center justify-between bg-gradient-to-r from-[#233B5D] to-[#1b2e49] text-white px-4 md:px-8">
        <div className="flex items-center gap-4">
          <Link to="/feed" className="flex items-center gap-2">
            <img src="/tuenti_inkorium_logo.svg" alt="Inkorium Logo" className="h-8 brightness-0 invert" />
            <span className="text-2xl font-bold tracking-tighter text-white hidden sm:block">Inkorium</span>
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

        {/* Mobile menu button could go here if needed, but per requirements we are matching the desktop view for now. The left aside hides and goes to a mobile menu, which we will handle by keeping it responsive. */}

        {/* Center Icons (Home, Messages, Notifications, Search) - Replicating classic Tuenti header feel */}
        <div className="hidden md:flex flex-1 items-center justify-center gap-6">
           <Link to="/feed" className="text-white/80 hover:text-white transition flex flex-col items-center gap-1">
             <Home size={20} />
             <span className="text-[10px] font-bold uppercase tracking-wider hidden lg:block">Inicio</span>
           </Link>
           <div className="relative group">
             <button className="text-white/80 hover:text-white transition flex flex-col items-center gap-1 relative">
               <MessageSquare size={20} />
               <span className="text-[10px] font-bold uppercase tracking-wider hidden lg:block">Mensajes</span>
               <span className="absolute -top-1 -right-2 bg-red-500 text-white text-[10px] font-bold px-1.5 rounded-full border border-[#233B5D]">3</span>
             </button>

             {/* Dropdown Mensajes */}
             <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 w-80 bg-white rounded-md shadow-xl border border-slate-200 hidden group-hover:block z-50 overflow-hidden">
               <div className="bg-slate-50 border-b border-slate-100 px-4 py-2 flex justify-between items-center">
                 <h3 className="text-xs font-bold text-[#233B5D]">Mensajes</h3>
                 <Link to="/messages" className="text-[10px] text-slate-500 hover:underline">Nuevo mensaje</Link>
               </div>
               <div className="max-h-80 overflow-y-auto">
                 {/* Item 1 */}
                 <div className="p-3 border-b border-slate-100 hover:bg-slate-50 cursor-pointer flex gap-3 items-start bg-blue-50/50">
                   <img src="https://i.pravatar.cc/150?img=15" className="h-10 w-10 rounded-sm object-cover" alt="User" />
                   <div className="flex-1 min-w-0">
                     <p className="text-xs font-bold text-[#233B5D] leading-tight">Laura Gómez</p>
                     <p className="text-xs text-slate-700 truncate mt-0.5">¿A qué hora nos vemos hoy?</p>
                     <p className="text-[10px] text-slate-400 mt-1">Hace 2 minutos</p>
                   </div>
                 </div>
                 {/* Item 2 */}
                 <div className="p-3 border-b border-slate-100 hover:bg-slate-50 cursor-pointer flex gap-3 items-start">
                   <img src="https://i.pravatar.cc/150?img=33" className="h-10 w-10 rounded-sm object-cover" alt="User" />
                   <div className="flex-1 min-w-0">
                     <p className="text-xs font-bold text-[#233B5D] leading-tight">Javi Fernández</p>
                     <p className="text-xs text-slate-500 truncate mt-0.5">Perfecto, gracias.</p>
                     <p className="text-[10px] text-slate-400 mt-1">Ayer</p>
                   </div>
                 </div>
               </div>
               <Link to="/messages" className="block text-center bg-slate-50 py-2 text-xs font-bold text-[#233B5D] hover:bg-slate-100 transition">
                 Ver todos los mensajes
               </Link>
             </div>
           </div>
           <div className="relative group">
             <button className="text-white/80 hover:text-white transition flex flex-col items-center gap-1 relative">
               <Bell size={20} />
               <span className="text-[10px] font-bold uppercase tracking-wider hidden lg:block">Notificaciones</span>
               <span className="absolute -top-1 -right-2 bg-red-500 text-white text-[10px] font-bold px-1.5 rounded-full border border-[#233B5D]">5</span>
             </button>

             {/* Dropdown Notificaciones */}
             <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 w-80 bg-white rounded-md shadow-xl border border-slate-200 hidden group-hover:block z-50 overflow-hidden">
               <div className="bg-slate-50 border-b border-slate-100 px-4 py-2 flex justify-between items-center">
                 <h3 className="text-xs font-bold text-[#233B5D]">Notificaciones</h3>
                 <button className="text-[10px] text-slate-500 hover:underline">Marcar leídas</button>
               </div>
               <div className="max-h-80 overflow-y-auto">
                 {/* Item 1 */}
                 <div className="p-3 border-b border-slate-100 hover:bg-slate-50 cursor-pointer flex gap-3 items-start">
                   <img src="https://i.pravatar.cc/150?img=1" className="h-10 w-10 rounded-sm object-cover" alt="User" />
                   <div className="flex-1 min-w-0">
                     <p className="text-xs text-slate-700 leading-tight">
                       <span className="font-bold text-[#233B5D]">Carlos</span> ha subido una nueva foto.
                     </p>
                     <p className="text-[10px] text-slate-400 mt-1">Hace 5 minutos</p>
                   </div>
                 </div>
                 {/* Item 2 */}
                 <div className="p-3 border-b border-slate-100 hover:bg-slate-50 cursor-pointer flex gap-3 items-start bg-blue-50/50">
                   <img src="https://i.pravatar.cc/150?img=5" className="h-10 w-10 rounded-sm object-cover" alt="User" />
                   <div className="flex-1 min-w-0">
                     <p className="text-xs text-slate-700 leading-tight">
                       <span className="font-bold text-[#233B5D]">María</span> te ha enviado una solicitud de amistad.
                     </p>
                     <p className="text-[10px] text-slate-400 mt-1">Hace 2 horas</p>
                   </div>
                 </div>
                  {/* Item 3 */}
                 <div className="p-3 border-b border-slate-100 hover:bg-slate-50 cursor-pointer flex gap-3 items-start">
                   <img src="https://i.pravatar.cc/150?img=10" className="h-10 w-10 rounded-sm object-cover" alt="User" />
                   <div className="flex-1 min-w-0">
                     <p className="text-xs text-slate-700 leading-tight">
                       <span className="font-bold text-[#233B5D]">David</span> ha comentado en tu estado.
                     </p>
                     <p className="text-[10px] text-slate-400 mt-1">Ayer a las 14:30</p>
                   </div>
                 </div>
               </div>
               <Link to="/notifications" className="block text-center bg-slate-50 py-2 text-xs font-bold text-[#233B5D] hover:bg-slate-100 transition">
                 Ver todas las notificaciones
               </Link>
             </div>
           </div>
        </div>

        <div className="flex items-center gap-2 md:gap-4">
          <Link to="/profile/$username" params={{ username: user?.user_metadata?.username || 'me' }} className="flex items-center gap-2 rounded-sm hover:bg-white/10 px-2 py-1 transition text-white">
            <img
              src={user?.user_metadata?.avatar_url || `https://ui-avatars.com/api/?name=${user?.user_metadata?.full_name || 'User'}`}
              alt="Profile"
              className="h-7 w-7 rounded-full border border-white/20"
            />
            <span className="text-sm font-bold hidden sm:block">{user?.user_metadata?.full_name?.split(' ')[0] || 'Perfil'}</span>
          </Link>

          <button onClick={handleSignOut} className="rounded-sm p-1.5 text-white/80 hover:text-white hover:bg-white/10 transition" aria-label="Cerrar sesión">
            <LogOut size={18} />
          </button>
        </div>
      </header>

      <div className="mx-auto flex max-w-7xl gap-4 p-4 lg:px-8">
        {/* Left Column */}
        <aside className="hidden w-[260px] shrink-0 md:block">
          <div className="sticky top-20 space-y-6">

            {/* User Profile Summary */}
            <div className="flex items-center gap-3">
              <img
                src={user?.user_metadata?.avatar_url || `https://ui-avatars.com/api/?name=${user?.user_metadata?.full_name || 'User'}`}
                alt="Profile"
                className="h-14 w-14 rounded-full border border-slate-200 object-cover"
              />
              <div>
                <p className="font-bold text-[#233B5D] leading-tight">{user?.user_metadata?.full_name || 'Usuario'}</p>
                <Link to="/profile/$username" params={{ username: user?.user_metadata?.username || 'me' }} className="text-xs text-slate-500 hover:underline">Ver mi perfil</Link>
              </div>
            </div>

            {/* Navigation Menu */}
            <nav className="space-y-0.5">
              <NavItem to="/feed" icon={Home} label="Inicio" />
              <NavItem to="/friends" icon={Users} label="Amigos" badge="142" />
              <NavItem to="/messages" icon={MessageSquare} label="Mensajes" badge="3" />
              <NavItem to="/notifications" icon={Bell} label="Notificaciones" badge="5" />
            </nav>

            <div className="border-t border-slate-200"></div>

            {/* Conectados ahora */}
            <section>
              <div className="flex justify-between items-center mb-2 px-2">
                 <h3 className="text-xs font-bold uppercase text-slate-500 tracking-wider">Amigos Conectados (12)</h3>
                 <Link to="/friends" className="text-xs text-[#233B5D] hover:underline">Ver todos</Link>
              </div>

              <div className="space-y-1">
                {[1,2,3,4,5].map(i => (
                  <div key={i} className="flex items-center gap-3 cursor-pointer hover:bg-slate-200/50 p-2 rounded-sm transition">
                    <div className="relative">
                      <img src={`https://i.pravatar.cc/150?img=${i+20}`} alt="User" className="h-8 w-8 rounded-full" />
                      <div className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full border-2 border-slate-50 bg-green-500"></div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="truncate text-sm font-medium text-slate-700">Amigo {i}</p>
                      {i === 2 && <p className="truncate text-[10px] text-slate-500">Escuchando a Melendi</p>}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </div>
        </aside>

        {/* Center Column - Feed/Content */}
        <main className="flex-1 min-w-0">
          {children}
        </main>

        {/* Right Column */}
        <aside className="hidden w-[280px] shrink-0 xl:block">
          <div className="sticky top-20 space-y-4">

            {/* Solicitudes de amistad */}
            <section className="rounded-md border border-slate-200 bg-white shadow-sm overflow-hidden">
              <div className="bg-slate-50 border-b border-slate-100 px-4 py-2 flex justify-between items-center">
                <h3 className="text-xs font-bold text-slate-700">Solicitudes de amistad</h3>
                <span className="text-xs font-bold text-slate-500">2</span>
              </div>
              <div className="p-3 space-y-3">
                <div className="flex gap-2">
                  <img src="https://i.pravatar.cc/150?img=12" alt="User" className="h-10 w-10 rounded-sm object-cover" />
                  <div className="flex-1 min-w-0">
                    <p className="truncate text-sm font-bold text-[#233B5D]">María López</p>
                    <p className="text-xs text-slate-500 mb-2">15 amigos en común</p>
                    <div className="flex gap-2">
                      <button className="flex-1 rounded bg-[#233B5D] py-1 text-xs font-bold text-white hover:bg-[#1a2c45]">Aceptar</button>
                      <button className="flex-1 rounded bg-slate-100 py-1 text-xs font-bold text-slate-600 hover:bg-slate-200 border border-slate-200">Ignorar</button>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* Eventos */}
            <section className="rounded-md border border-slate-200 bg-white shadow-sm overflow-hidden">
              <div className="bg-slate-50 border-b border-slate-100 px-4 py-2 flex justify-between items-center">
                <h3 className="text-xs font-bold text-slate-700">Eventos próximos</h3>
                <Link to="/events" className="text-xs text-[#233B5D] hover:underline">Ver todos</Link>
              </div>
              <div className="p-3 space-y-3">
                <div className="flex gap-3 items-center group cursor-pointer">
                  <div className="flex h-12 w-12 flex-col items-center justify-center rounded bg-slate-100 border border-slate-200 text-[#233B5D]">
                    <span className="text-[10px] font-bold uppercase text-red-500">Hoy</span>
                    <span className="text-lg font-bold leading-none">24</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="truncate font-bold text-sm text-[#233B5D] group-hover:underline">Cumpleaños de Laura</p>
                    <p className="text-xs text-slate-500">¡Escríbele algo en su tablón!</p>
                  </div>
                </div>

                <div className="flex gap-3 items-center group cursor-pointer">
                  <div className="flex h-12 w-12 flex-col items-center justify-center rounded bg-slate-100 border border-slate-200 text-[#233B5D]">
                    <span className="text-[10px] font-bold uppercase">Sáb</span>
                    <span className="text-lg font-bold leading-none">28</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="truncate font-bold text-sm text-[#233B5D] group-hover:underline">Concierto en la Plaza</p>
                    <p className="text-xs text-slate-500">22:00 · 3 amigos asisten</p>
                  </div>
                </div>
              </div>
            </section>

            {/* Publicidad o Banner Extra (opcional, como en el antiguo Tuenti) */}
            <div className="rounded-md border border-slate-200 bg-white p-2">
               <img src="https://picsum.photos/300/150" alt="Ad" className="w-full rounded h-[120px] object-cover opacity-80 hover:opacity-100 transition" />
            </div>

          </div>
        </aside>
      </div>

      {/* Floating Chat Button */}
      <button
        onClick={() => alert("Próximamente: El sistema de chat estará disponible pronto.")}
        className="fixed bottom-0 right-10 bg-[#233B5D] text-white px-6 py-2 rounded-t-md font-bold text-sm shadow-[0_-2px_10px_rgba(0,0,0,0.2)] hover:bg-[#1a2c45] transition flex items-center gap-2 z-50 border border-b-0 border-[#1a2c45]"
      >
        <MessageSquare size={16} />
        Chat (0)
      </button>
    </div>
  );
}

function NavItem({ to, params, icon: Icon, label, badge }: { to: string, params?: any, icon: any, label: string, badge?: string }) {
  return (
    <Link
      to={to as any} params={params}
      className="flex items-center justify-between rounded-sm px-3 py-2 text-slate-700 transition hover:bg-slate-200/50 [&.active]:bg-white [&.active]:border [&.active]:border-slate-200 [&.active]:text-[#233B5D] [&.active]:font-bold [&.active]:shadow-sm text-sm"
    >
      <div className="flex items-center gap-3">
        <Icon size={18} className="text-slate-500 [&.active]:text-[#233B5D]" />
        <span className="text-sm">{label}</span>
      </div>
      {badge && <span className="rounded-full bg-red-500 px-2 py-0.5 text-[10px] font-bold text-white leading-none">{badge}</span>}
    </Link>
  );
}
