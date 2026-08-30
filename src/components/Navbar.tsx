import React, { useState, useRef, useEffect } from 'react';
import { useInkorium } from '../context/InkoriumContext';
import { 
  Home, User as UserIcon, Users, Image as ImageIcon, Mail, 
  Settings, Bell, Volume2, VolumeX, Search, LogOut, Check,
  UserPlus, MessageSquare, Sparkles
} from 'lucide-react';
import { isSoundEnabled, toggleSound } from '../utils/sound';

export const Navbar: React.FC<{ onOpenAuth: () => void }> = ({ onOpenAuth }) => {
  const { 
    currentUser, 
    users, 
    activeTab, 
    setActiveTab, 
    unreadMessagesCount, 
    unreadNotificationsCount, 
    pendingRequestsCount,
    notifications,
    markNotificationAsRead,
    markAllNotificationsAsRead,
    deleteNotification,
    viewUserProfile,
    viewPhoto,
    setCurrentUserById,
    logout,
    resetToDefaultData,
    simulateIncomingMessage,
    simulateWallComment,
    simulateFriendRequest,
    simulatePhotoInteraction,
    isRealtimeSimulationEnabled,
    setIsRealtimeSimulationEnabled
  } = useInkorium();

  const [soundOn, setSoundOn] = useState(isSoundEnabled());
  const [showNotifications, setShowNotifications] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<typeof users>([]);
  const [showSearchResults, setShowSearchResults] = useState(false);

  const notifRef = useRef<HTMLDivElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLDivElement>(null);

  // Close dropdowns on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(event.target as Node)) {
        setShowNotifications(false);
      }
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setShowUserMenu(false);
      }
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowSearchResults(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const q = e.target.value;
    setSearchQuery(q);
    if (q.trim().length > 0) {
      const lower = q.toLowerCase();
      const results = users.filter(u => 
        `${u.nombre} ${u.apellidos}`.toLowerCase().includes(lower) ||
        (u.full_name && u.full_name.toLowerCase().includes(lower)) ||
        (u.username && u.username.toLowerCase().includes(lower)) ||
        (u.ciudad && u.ciudad.toLowerCase().includes(lower)) ||
        (u.provincia && u.provincia.toLowerCase().includes(lower))
      );
      setSearchResults(results);
      setShowSearchResults(true);
    } else {
      setSearchResults([]);
      setShowSearchResults(false);
    }
  };

  const handleToggleSound = () => {
    const newState = toggleSound();
    setSoundOn(newState);
  };

  const totalBadgeCount = unreadMessagesCount + unreadNotificationsCount + pendingRequestsCount;

  return (
    <header className="sticky top-0 z-40 bg-[#3869A0] text-white shadow-md border-b border-[#2b5380]">
      <div className="w-full max-w-[1720px] 2xl:max-w-[1850px] mx-auto px-3 sm:px-6 lg:px-8 flex items-center justify-between h-[48px]">
        {/* Left: Brand Logo & Navigation */}
        <div className="flex items-center space-x-1 sm:space-x-4">
          {/* Inkorium Logo */}
          <button 
            onClick={() => setActiveTab('inicio')}
            className="flex items-center gap-1.5 px-2 py-1 rounded hover:bg-[#2f5988] transition text-left group cursor-pointer"
            title="Inkorium - Ir a Inicio"
          >
            {/* Retro Smiley Logo */}
            <div className="w-7 h-7 rounded-full bg-white flex items-center justify-center shadow-inner group-hover:scale-105 transition">
              <span className="text-[#3869A0] text-xs font-black select-none tracking-tighter">:)</span>
            </div>
            <span className="font-['Comfortaa',sans-serif] text-xl font-bold tracking-tight text-white select-none">
              inkorium
            </span>
          </button>

          {/* Primary Navigation Tabs */}
          <nav className="hidden md:flex items-center space-x-1 text-[13px] font-semibold">
            <button
              onClick={() => setActiveTab('inicio')}
              className={`px-3 py-1.5 rounded flex items-center gap-1.5 transition cursor-pointer ${
                activeTab === 'inicio' ? 'bg-[#294e77] text-white shadow-inner' : 'text-blue-100 hover:bg-[#2f5988] hover:text-white'
              }`}
            >
              <Home className="w-4 h-4" />
              <span>Inicio</span>
            </button>

            <button
              onClick={() => {
                setActiveTab('perfil');
              }}
              className={`px-3 py-1.5 rounded flex items-center gap-1.5 transition cursor-pointer ${
                activeTab === 'perfil' ? 'bg-[#294e77] text-white shadow-inner' : 'text-blue-100 hover:bg-[#2f5988] hover:text-white'
              }`}
            >
              <UserIcon className="w-4 h-4" />
              <span>Mi Perfil</span>
            </button>

            <button
              onClick={() => setActiveTab('gente')}
              className={`px-3 py-1.5 rounded flex items-center gap-1.5 transition cursor-pointer ${
                activeTab === 'gente' ? 'bg-[#294e77] text-white shadow-inner' : 'text-blue-100 hover:bg-[#2f5988] hover:text-white'
              }`}
            >
              <Users className="w-4 h-4" />
              <span>Gente</span>
            </button>

            <button
              onClick={() => setActiveTab('fotos')}
              className={`px-3 py-1.5 rounded flex items-center gap-1.5 transition cursor-pointer ${
                activeTab === 'fotos' ? 'bg-[#294e77] text-white shadow-inner' : 'text-blue-100 hover:bg-[#2f5988] hover:text-white'
              }`}
            >
              <ImageIcon className="w-4 h-4" />
              <span>Fotos</span>
            </button>

            <button
              onClick={() => setActiveTab('mensajes')}
              className={`px-3 py-1.5 rounded flex items-center gap-1.5 transition relative cursor-pointer ${
                activeTab === 'mensajes' ? 'bg-[#294e77] text-white shadow-inner' : 'text-blue-100 hover:bg-[#2f5988] hover:text-white'
              }`}
            >
              <Mail className="w-4 h-4" />
              <span>Mensajes</span>
              {unreadMessagesCount > 0 && (
                <span className="bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.2 rounded-full shadow animate-pulse">
                  {unreadMessagesCount}
                </span>
              )}
            </button>
          </nav>
        </div>

        {/* Center: Search Box */}
        <div className="relative flex-1 max-w-[240px] lg:max-w-[280px] mx-2 hidden sm:block" ref={searchRef}>
          <div className="relative">
            <input
              type="text"
              placeholder="Buscar en Inkorium..."
              value={searchQuery}
              onChange={handleSearchChange}
              onFocus={() => searchQuery.trim() && setShowSearchResults(true)}
              className="w-full bg-[#274d77] placeholder-blue-200 text-white text-xs px-3 py-1.5 pl-8 rounded border border-[#1f3f63] focus:outline-none focus:ring-1 focus:ring-white focus:bg-[#1e3c60]"
            />
            <Search className="w-3.5 h-3.5 text-blue-200 absolute left-2.5 top-2 pointer-events-none" />
          </div>

          {/* Search Dropdown */}
          {showSearchResults && searchResults.length > 0 && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-white text-gray-800 rounded shadow-xl border border-gray-200 py-1 z-50 max-h-[300px] overflow-y-auto">
              <div className="text-[11px] font-semibold text-gray-400 px-3 py-1 uppercase tracking-wider">Gente</div>
              {searchResults.map(user => (
                <div
                  key={user.id}
                  onClick={() => {
                    viewUserProfile(user.id);
                    setShowSearchResults(false);
                    setSearchQuery('');
                  }}
                  className="flex items-center gap-2.5 px-3 py-2 hover:bg-blue-50 cursor-pointer transition border-b border-gray-50 last:border-0"
                >
                  <img src={user.avatar} alt={user.nombre} className="w-7 h-7 rounded object-cover border border-gray-300" />
                  <div className="overflow-hidden">
                    <p className="text-xs font-semibold text-[#3869A0] truncate">{user.nombre} {user.apellidos}</p>
                    <p className="text-[10px] text-gray-500 truncate">{user.provincia} • {user.online ? '🟢 Conectado' : 'Desconectado'}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right Action Icons & User Profile */}
        <div className="flex items-center space-x-1 sm:space-x-2 text-xs">
          {/* Retro Sound toggle */}
          <button
            onClick={handleToggleSound}
            className="p-1.5 rounded hover:bg-[#2f5988] text-blue-100 hover:text-white transition cursor-pointer"
            title={soundOn ? 'Sonidos activados (Clic para silenciar)' : 'Sonidos silenciados (Clic para activar)'}
          >
            {soundOn ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4 text-red-300" />}
          </button>

          {/* Notifications Dropdown */}
          <div className="relative" ref={notifRef}>
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className="p-1.5 rounded hover:bg-[#2f5988] text-blue-100 hover:text-white transition relative cursor-pointer"
              title="Notificaciones"
            >
              <Bell className="w-4 h-4" />
              {totalBadgeCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.2 rounded-full shadow">
                  {totalBadgeCount}
                </span>
              )}
            </button>

            {showNotifications && (
              <div className="absolute right-0 mt-1 w-84 sm:w-96 bg-white text-gray-800 rounded-lg shadow-2xl border border-gray-200 z-50 overflow-hidden text-xs">
                <div className="bg-[#f0f4f8] px-3 py-2.5 border-b border-gray-200 flex justify-between items-center font-bold text-gray-700">
                  <div className="flex items-center gap-1.5">
                    <Bell className="w-3.5 h-3.5 text-[#3869A0]" />
                    <span>Notificaciones ({unreadNotificationsCount + pendingRequestsCount})</span>
                  </div>
                  {unreadNotificationsCount > 0 && (
                    <button
                      onClick={markAllNotificationsAsRead}
                      className="text-[11px] text-[#3869A0] hover:underline font-semibold cursor-pointer"
                    >
                      Marcar todo leído
                    </button>
                  )}
                </div>

                <div className="max-h-[360px] overflow-y-auto divide-y divide-gray-100">
                  {/* Friend Requests banner if any */}
                  {pendingRequestsCount > 0 && (
                    <div 
                      onClick={() => {
                        setActiveTab('ajustes');
                        setShowNotifications(false);
                      }}
                      className="p-2.5 bg-amber-50 hover:bg-amber-100 cursor-pointer flex items-center gap-2.5 text-amber-900 transition border-b border-amber-200/60"
                    >
                      <div className="w-7 h-7 rounded-full bg-amber-200 flex items-center justify-center flex-shrink-0">
                        <UserPlus className="w-4 h-4 text-amber-700" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-xs">¡Tienes {pendingRequestsCount} petición(es) de amistad pendiente!</p>
                        <p className="text-[11px] text-amber-700 font-medium">Haz clic aquí para responder</p>
                      </div>
                    </div>
                  )}

                  {/* Notifications list */}
                  {notifications.filter(n => n.userId === currentUser.id).length === 0 ? (
                    <div className="p-8 text-center text-gray-400">
                      <Bell className="w-8 h-8 mx-auto mb-2 text-gray-300 opacity-60" />
                      <p className="font-semibold text-gray-600">No tienes notificaciones nuevas</p>
                      <p className="text-[11px] text-gray-400 mt-1">Aquí verás avisos de fotos, comentarios y peticiones</p>
                    </div>
                  ) : (
                    notifications.filter(n => n.userId === currentUser.id).map(notif => (
                      <div
                        key={notif.id}
                        onClick={() => {
                          markNotificationAsRead(notif.id);
                          setShowNotifications(false);
                          if (notif.enlace === 'perfil' || notif.tipo === 'tablon') viewUserProfile(currentUser.id);
                          else if (notif.enlace === 'fotos' || notif.tipo === 'foto' || notif.tipo === 'etiqueta') {
                            if (notif.targetId) viewPhoto(notif.targetId);
                            else setActiveTab('fotos');
                          }
                          else if (notif.enlace === 'mensajes' || notif.tipo === 'mp') setActiveTab('mensajes');
                          else if (notif.enlace === 'ajustes' || notif.tipo === 'peticion') setActiveTab('ajustes');
                          else setActiveTab('inicio');
                        }}
                        className={`p-2.5 flex items-start gap-2.5 hover:bg-blue-50/80 cursor-pointer transition relative group ${
                          !notif.leido ? 'bg-blue-50/40 font-medium border-l-2 border-[#3869A0]' : ''
                        }`}
                      >
                        <img src={notif.fromUserAvatar} alt="" className="w-9 h-9 rounded-md object-cover border border-gray-300 flex-shrink-0 mt-0.5" />
                        <div className="flex-1 min-w-0 pr-4">
                          <p className="text-gray-900 text-xs leading-snug">
                            <span className="font-bold text-gray-800">{notif.fromUserName}</span> {notif.mensaje.replace(notif.fromUserName, '').trim()}
                          </p>
                          {notif.detalle && (
                            <p className="text-[11px] text-gray-500 italic mt-0.5 truncate bg-gray-50 px-1.5 py-0.5 rounded border border-gray-200/60">
                              "{notif.detalle}"
                            </p>
                          )}
                          <span className="text-[10px] text-gray-400 mt-1 block font-normal">{notif.fecha}</span>
                        </div>
                        
                        {!notif.leido && (
                          <div className="w-2 h-2 rounded-full bg-[#3869A0] mt-2 flex-shrink-0" title="No leído"></div>
                        )}

                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteNotification(notif.id);
                          }}
                          className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-600 transition p-1 absolute top-2 right-1.5"
                          title="Eliminar notificación"
                        >
                          ✕
                        </button>
                      </div>
                    ))
                  )}
                </div>

                <div className="bg-gray-100 px-3 py-2 text-center border-t border-gray-200">
                  <button 
                    onClick={() => { setActiveTab('ajustes'); setShowNotifications(false); }}
                    className="text-[11px] text-[#3869A0] font-semibold hover:underline"
                  >
                    Ver historial completo de notificaciones
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* User Profile Avatar & Menu */}
          <div className="relative" ref={userMenuRef}>
            <button
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="flex items-center gap-1.5 p-1 rounded hover:bg-[#2f5988] transition text-left cursor-pointer"
            >
              <img
                src={currentUser.avatar}
                alt={currentUser.nombre}
                className="w-6 h-6 rounded object-cover border border-white/60 shadow-sm"
              />
              <span className="font-semibold text-xs hidden lg:inline max-w-[100px] truncate">
                {currentUser.nombre}
              </span>
            </button>

            {showUserMenu && (
              <div className="absolute right-0 mt-1 w-64 bg-white text-gray-800 rounded shadow-2xl border border-gray-200 z-50 py-1 text-xs">
                {/* User Card Header */}
                <div className="px-3 py-2.5 bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-gray-200 flex items-center gap-2.5">
                  <img src={currentUser.avatar} alt="" className="w-10 h-10 rounded object-cover border-2 border-white shadow" />
                  <div className="overflow-hidden">
                    <p className="font-bold text-gray-900 truncate">{currentUser.nombre} {currentUser.apellidos}</p>
                    <p className="text-[11px] text-gray-500 truncate">{currentUser.email}</p>
                    <span className="inline-block mt-0.5 px-1.5 py-0.2 bg-blue-100 text-[#3869A0] text-[10px] font-bold rounded">
                      Inkorium Miembro
                    </span>
                  </div>
                </div>

                {/* Menu items */}
                <div className="py-1">
                  <button
                    onClick={() => {
                      viewUserProfile(currentUser.id);
                      setShowUserMenu(false);
                    }}
                    className="w-full text-left px-3 py-2 hover:bg-blue-50 flex items-center gap-2 cursor-pointer font-medium"
                  >
                    <UserIcon className="w-4 h-4 text-[#3869A0]" />
                    <span>Mi Perfil y Tablón</span>
                  </button>

                  <button
                    onClick={() => {
                      setActiveTab('ajustes');
                      setShowUserMenu(false);
                    }}
                    className="w-full text-left px-3 py-2 hover:bg-blue-50 flex items-center gap-2 cursor-pointer font-medium"
                  >
                    <Settings className="w-4 h-4 text-gray-600" />
                    <span>Ajustes de Cuenta</span>
                  </button>
                </div>

                {/* Bottom Actions */}
                <div className="border-t border-gray-200 py-1">
                  <button
                    onClick={() => {
                      setShowUserMenu(false);
                      logout();
                    }}
                    className="w-full text-left px-3 py-2 hover:bg-red-50 text-red-600 font-semibold flex items-center gap-2 cursor-pointer text-xs"
                  >
                    <LogOut className="w-4 h-4 text-red-600" />
                    <span>Cerrar sesión</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Secondary Tab Navigation */}
      <div className="md:hidden flex items-center justify-around bg-[#2e5785] border-t border-[#23456c] py-1.5 px-2 text-[11px]">
        <button 
          onClick={() => setActiveTab('inicio')} 
          className={`flex flex-col items-center gap-0.5 ${activeTab === 'inicio' ? 'text-white font-bold' : 'text-blue-200'}`}
        >
          <Home className="w-4 h-4" />
          <span>Inicio</span>
        </button>
        <button 
          onClick={() => setActiveTab('perfil')} 
          className={`flex flex-col items-center gap-0.5 ${activeTab === 'perfil' ? 'text-white font-bold' : 'text-blue-200'}`}
        >
          <UserIcon className="w-4 h-4" />
          <span>Perfil</span>
        </button>
        <button 
          onClick={() => setActiveTab('gente')} 
          className={`flex flex-col items-center gap-0.5 ${activeTab === 'gente' ? 'text-white font-bold' : 'text-blue-200'}`}
        >
          <Users className="w-4 h-4" />
          <span>Gente</span>
        </button>
        <button 
          onClick={() => setActiveTab('fotos')} 
          className={`flex flex-col items-center gap-0.5 ${activeTab === 'fotos' ? 'text-white font-bold' : 'text-blue-200'}`}
        >
          <ImageIcon className="w-4 h-4" />
          <span>Fotos</span>
        </button>
        <button 
          onClick={() => setActiveTab('mensajes')} 
          className={`flex flex-col items-center gap-0.5 relative ${activeTab === 'mensajes' ? 'text-white font-bold' : 'text-blue-200'}`}
        >
          <Mail className="w-4 h-4" />
          <span>Mensajes</span>
          {unreadMessagesCount > 0 && (
            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[9px] font-bold px-1 rounded-full">
              {unreadMessagesCount}
            </span>
          )}
        </button>
      </div>
    </header>
  );
};
