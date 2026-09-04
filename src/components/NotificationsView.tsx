import React, { useState, useMemo } from 'react';
import { useInkorium } from '../context/InkoriumContext';
import { 
  Bell, UserPlus, Image as ImageIcon, MessageSquare, Tag, 
  Heart, Mail, Check, CheckCheck, Trash2, Search, Filter, 
  ExternalLink, ShieldAlert, ArrowRight, UserCheck, 
  Clock, X, MessageCircle
} from 'lucide-react';
import { InkoriumNotification } from '../types';

type NotificationFilter = 'todas' | 'peticiones' | 'fotos' | 'tablon' | 'no_leidas';

const TYPE_CONFIG = {
  peticion: {
    label: 'Solicitud de amistad',
    badgeBg: 'bg-amber-100 text-amber-800 border-amber-200',
    icon: UserPlus,
    iconColor: 'text-amber-600',
    iconBg: 'bg-amber-50'
  },
  foto: {
    label: 'Comentario en foto',
    badgeBg: 'bg-blue-100 text-blue-800 border-blue-200',
    icon: MessageSquare,
    iconColor: 'text-[#3869A0]',
    iconBg: 'bg-blue-50'
  },
  etiqueta: {
    label: 'Etiqueta en foto',
    badgeBg: 'bg-purple-100 text-purple-800 border-purple-200',
    icon: Tag,
    iconColor: 'text-purple-600',
    iconBg: 'bg-purple-50'
  },
  tablon: {
    label: 'Firma / Mención en tablón',
    badgeBg: 'bg-emerald-100 text-emerald-800 border-emerald-200',
    icon: MessageCircle,
    iconColor: 'text-emerald-600',
    iconBg: 'bg-emerald-50'
  },
  like: {
    label: 'Me gusta',
    badgeBg: 'bg-rose-100 text-rose-800 border-rose-200',
    icon: Heart,
    iconColor: 'text-rose-500',
    iconBg: 'bg-rose-50'
  },
  mp: {
    label: 'Mensaje privado',
    badgeBg: 'bg-sky-100 text-sky-800 border-sky-200',
    icon: Mail,
    iconColor: 'text-sky-600',
    iconBg: 'bg-sky-50'
  }
};

export const NotificationsView: React.FC = () => {
  const {
    currentUser,
    users,
    notifications,
    friendRequests,
    markNotificationAsRead,
    markAllNotificationsAsRead,
    deleteNotification,
    acceptFriendRequest,
    ignoreFriendRequest,
    viewUserProfile,
    viewPhoto,
    setActiveTab,
    unreadNotificationsCount,
    pendingRequestsCount
  } = useInkorium();

  const [activeFilter, setActiveFilter] = useState<NotificationFilter>('todas');
  const [searchQuery, setSearchQuery] = useState('');
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);

  const showFeedback = (msg: string) => {
    setFeedbackMessage(msg);
    setTimeout(() => setFeedbackMessage(null), 3000);
  };

  // Filter notifications for current user
  const userNotifications = useMemo(() => {
    return notifications.filter(
      n => n.userId === currentUser.id || !n.userId
    );
  }, [notifications, currentUser.id]);

  // Filtered by category and search
  const filteredNotifications = useMemo(() => {
    return userNotifications.filter(item => {
      // Filter tab
      if (activeFilter === 'no_leidas' && item.leido) return false;
      if (activeFilter === 'peticiones' && item.tipo !== 'peticion') return false;
      if (activeFilter === 'fotos' && item.tipo !== 'foto' && item.tipo !== 'etiqueta') return false;
      if (activeFilter === 'tablon' && item.tipo !== 'tablon') return false;

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesUser = item.fromUserName.toLowerCase().includes(q);
        const matchesMsg = item.mensaje.toLowerCase().includes(q);
        const matchesDetail = item.detalle ? item.detalle.toLowerCase().includes(q) : false;
        return matchesUser || matchesMsg || matchesDetail;
      }
      return true;
    });
  }, [userNotifications, activeFilter, searchQuery]);

  // Counts by category
  const counts = useMemo(() => {
    const total = userNotifications.length;
    const noLeidas = userNotifications.filter(n => !n.leido).length;
    const peticiones = userNotifications.filter(n => n.tipo === 'peticion').length;
    const fotos = userNotifications.filter(n => n.tipo === 'foto' || n.tipo === 'etiqueta').length;
    const tablon = userNotifications.filter(n => n.tipo === 'tablon').length;
    return { total, noLeidas, peticiones, fotos, tablon };
  }, [userNotifications]);

  // Pending friend requests
  const pendingRequests = useMemo(() => {
    return friendRequests.filter(
      r => r.receptorId === currentUser.id && r.estado === 'pendiente'
    );
  }, [friendRequests, currentUser.id]);

  // Handle clicking notification target
  const handleOpenNotification = (notif: InkoriumNotification) => {
    markNotificationAsRead(notif.id);

    if (notif.tipo === 'foto' || notif.tipo === 'etiqueta') {
      if (notif.targetId) {
        viewPhoto(notif.targetId);
      } else {
        setActiveTab('fotos');
      }
    } else if (notif.tipo === 'tablon') {
      viewUserProfile(currentUser.id);
    } else if (notif.tipo === 'peticion') {
      if (notif.fromUserId) {
        viewUserProfile(notif.fromUserId);
      } else {
        setActiveTab('gente');
      }
    } else if (notif.tipo === 'mp') {
      setActiveTab('mensajes');
    } else {
      if (notif.enlace === 'perfil') viewUserProfile(currentUser.id);
      else if (notif.enlace === 'fotos') setActiveTab('fotos');
      else if (notif.enlace === 'gente') setActiveTab('gente');
      else if (notif.enlace === 'mensajes') setActiveTab('mensajes');
      else setActiveTab('inicio');
    }
  };

  return (
    <div className="w-full max-w-[1720px] 2xl:max-w-[1850px] mx-auto px-3 sm:px-6 lg:px-8 py-4">
      {/* Toast feedback banner */}
      {feedbackMessage && (
        <div className="mb-3 p-2.5 bg-emerald-50 border border-emerald-300 rounded text-emerald-800 text-xs font-semibold flex items-center justify-between shadow-xs animate-in fade-in">
          <div className="flex items-center gap-2">
            <Check className="w-4 h-4 text-emerald-600" />
            <span>{feedbackMessage}</span>
          </div>
          <button onClick={() => setFeedbackMessage(null)} className="text-emerald-600 hover:text-emerald-800">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Main Top Header */}
      <div className="bg-white rounded-lg border border-[#ccd5df] p-4 mb-4 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-[#3869A0]/10 border border-[#3869A0]/20 flex items-center justify-center text-[#3869A0]">
              <Bell className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base sm:text-lg font-bold text-gray-900 font-['Comfortaa',sans-serif]">
                  Centro de Notificaciones y Avisos
                </h1>
                {unreadNotificationsCount > 0 && (
                  <span className="bg-red-500 text-white text-[11px] font-bold px-2 py-0.5 rounded-full shadow-xs animate-pulse">
                    {unreadNotificationsCount} nuevas
                  </span>
                )}
              </div>
              <p className="text-xs text-gray-500 mt-0.5">
                Historial completo de solicitudes de amistad, comentarios en fotos, firmas y menciones en tu tablón.
              </p>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="flex items-center gap-2 flex-wrap">
            {unreadNotificationsCount > 0 && (
              <button
                onClick={() => {
                  markAllNotificationsAsRead();
                  showFeedback('Todas las notificaciones han sido marcadas como leídas.');
                }}
                className="px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-[#3869A0] border border-blue-200 rounded text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
                title="Marcar todas las notificaciones como leídas"
              >
                <CheckCheck className="w-3.5 h-3.5" />
                <span>Marcar todo leído</span>
              </button>
            )}

            <button
              onClick={() => setActiveTab('ajustes')}
              className="px-3 py-1.5 bg-gray-50 hover:bg-gray-100 text-gray-700 border border-gray-300 rounded text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
            >
              <span>Ajustes de avisos</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Grid: Left Filters & Stats + Right Notification List */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
        {/* ================= LEFT SIDEBAR (Filtros y Resumen) ================= */}
        <div className="md:col-span-4 lg:col-span-3 space-y-4">
          {/* Navigation Filter Tabs */}
          <div className="bg-white rounded-lg border border-[#ccd5df] overflow-hidden shadow-xs">
            <div className="bg-[#f0f4f8] px-3 py-2 border-b border-[#ccd5df] font-bold text-xs text-gray-700 flex items-center justify-between">
              <span>Categorías</span>
              <span className="text-[10px] text-gray-500 font-normal">Filtro rápido</span>
            </div>

            <div className="divide-y divide-gray-100 text-xs">
              <button
                onClick={() => setActiveFilter('todas')}
                className={`w-full text-left px-3 py-2.5 flex items-center justify-between transition cursor-pointer ${
                  activeFilter === 'todas'
                    ? 'bg-[#3869A0] text-white font-bold'
                    : 'hover:bg-blue-50 text-gray-800'
                }`}
              >
                <div className="flex items-center gap-2">
                  <Bell className="w-4 h-4" />
                  <span>Todas las notificaciones</span>
                </div>
                <span className={`text-[10px] px-1.5 py-0.2 rounded font-bold ${
                  activeFilter === 'todas' ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-600'
                }`}>
                  {counts.total}
                </span>
              </button>

              <button
                onClick={() => setActiveFilter('peticiones')}
                className={`w-full text-left px-3 py-2.5 flex items-center justify-between transition cursor-pointer ${
                  activeFilter === 'peticiones'
                    ? 'bg-[#3869A0] text-white font-bold'
                    : 'hover:bg-blue-50 text-gray-800'
                }`}
              >
                <div className="flex items-center gap-2">
                  <UserPlus className="w-4 h-4 text-amber-500" />
                  <span>Solicitudes de amistad</span>
                </div>
                <div className="flex items-center gap-1">
                  {pendingRequests.length > 0 && (
                    <span className="bg-amber-500 text-white text-[9px] font-bold px-1.5 py-0.2 rounded-full animate-pulse">
                      {pendingRequests.length} pend.
                    </span>
                  )}
                  <span className={`text-[10px] px-1.5 py-0.2 rounded font-bold ${
                    activeFilter === 'peticiones' ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-600'
                  }`}>
                    {counts.peticiones}
                  </span>
                </div>
              </button>

              <button
                onClick={() => setActiveFilter('fotos')}
                className={`w-full text-left px-3 py-2.5 flex items-center justify-between transition cursor-pointer ${
                  activeFilter === 'fotos'
                    ? 'bg-[#3869A0] text-white font-bold'
                    : 'hover:bg-blue-50 text-gray-800'
                }`}
              >
                <div className="flex items-center gap-2">
                  <ImageIcon className="w-4 h-4 text-blue-500" />
                  <span>Fotos y Etiquetas</span>
                </div>
                <span className={`text-[10px] px-1.5 py-0.2 rounded font-bold ${
                  activeFilter === 'fotos' ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-600'
                }`}>
                  {counts.fotos}
                </span>
              </button>

              <button
                onClick={() => setActiveFilter('tablon')}
                className={`w-full text-left px-3 py-2.5 flex items-center justify-between transition cursor-pointer ${
                  activeFilter === 'tablon'
                    ? 'bg-[#3869A0] text-white font-bold'
                    : 'hover:bg-blue-50 text-gray-800'
                }`}
              >
                <div className="flex items-center gap-2">
                  <MessageCircle className="w-4 h-4 text-emerald-500" />
                  <span>Tablón y Menciones</span>
                </div>
                <span className={`text-[10px] px-1.5 py-0.2 rounded font-bold ${
                  activeFilter === 'tablon' ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-600'
                }`}>
                  {counts.tablon}
                </span>
              </button>

              <button
                onClick={() => setActiveFilter('no_leidas')}
                className={`w-full text-left px-3 py-2.5 flex items-center justify-between transition cursor-pointer ${
                  activeFilter === 'no_leidas'
                    ? 'bg-[#3869A0] text-white font-bold'
                    : 'hover:bg-blue-50 text-gray-800'
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-red-500 inline-block" />
                  <span>Solo No Leídas</span>
                </div>
                <span className={`text-[10px] px-1.5 py-0.2 rounded font-bold ${
                  activeFilter === 'no_leidas' ? 'bg-white/20 text-white' : 'bg-red-100 text-red-700'
                }`}>
                  {counts.noLeidas}
                </span>
              </button>
            </div>
          </div>

          {/* Pending Friend Requests Highlight Box */}
          {pendingRequests.length > 0 && (
            <div className="bg-amber-50 rounded-lg border border-amber-200 p-3.5 shadow-xs text-xs space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-bold text-amber-900 flex items-center gap-1.5">
                  <UserPlus className="w-4 h-4 text-amber-700" />
                  <span>Peticiones pendientes ({pendingRequests.length})</span>
                </span>
              </div>
              <p className="text-[11px] text-amber-800">
                Tienes solicitudes de amistad esperando tu respuesta.
              </p>

              <div className="space-y-2">
                {pendingRequests.map(req => (
                  <div key={req.id} className="bg-white rounded border border-amber-200 p-2.5 flex items-center justify-between gap-2 shadow-2xs">
                    <div className="flex items-center gap-2 min-w-0">
                      <img
                        src={req.emisorAvatar}
                        alt=""
                        className="w-8 h-8 rounded object-cover border border-gray-300 flex-shrink-0 cursor-pointer"
                        onClick={() => viewUserProfile(req.emisorId)}
                      />
                      <div className="min-w-0">
                        <p
                          onClick={() => viewUserProfile(req.emisorId)}
                          className="font-bold text-[#3869A0] truncate hover:underline cursor-pointer text-[11px]"
                        >
                          {req.emisorNombre}
                        </p>
                        <p className="text-[10px] text-gray-500 truncate">{req.emisorProvincia || 'España'}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-1 flex-shrink-0">
                      <button
                        onClick={() => {
                          acceptFriendRequest(req.id);
                          showFeedback(`Has aceptado la solicitud de ${req.emisorNombre}. ¡Ahora sois amigos!`);
                        }}
                        className="p-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-[10px] font-bold transition cursor-pointer"
                        title="Aceptar solicitud"
                      >
                        <Check className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => {
                          ignoreFriendRequest(req.id);
                          showFeedback(`Solicitud de ${req.emisorNombre} rechazada.`);
                        }}
                        className="p-1.5 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded text-[10px] transition cursor-pointer"
                        title="Ignorar solicitud"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Quick Informational Box */}
          <div className="bg-white rounded-lg border border-[#ccd5df] p-3 text-xs shadow-xs space-y-2">
            <span className="font-bold text-gray-800 block text-xs">Acerca de los avisos</span>
            <p className="text-[11px] text-gray-500 leading-relaxed">
              En Inkorium recibes alertas cada vez que alguien firma en tu tablón, comenta una foto donde apareces o te envía una petición de amistad.
            </p>
            <div className="pt-2 border-t border-gray-100 flex items-center justify-between text-[11px] text-gray-500">
              <span>Sonidos retro:</span>
              <span className="text-emerald-700 font-bold">Activados 🔊</span>
            </div>
          </div>
        </div>

        {/* ================= RIGHT MAIN NOTIFICATIONS FEED ================= */}
        <div className="md:col-span-8 lg:col-span-9 space-y-3">
          {/* Search bar & active filter display */}
          <div className="bg-white rounded-lg border border-[#ccd5df] p-2.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2 shadow-xs">
            <div className="relative flex-1 max-w-md">
              <input
                type="text"
                placeholder="Buscar por usuario o mensaje..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full text-xs rounded border border-gray-300 py-1.5 pl-8 pr-3 bg-gray-50 focus:bg-white focus:outline-none focus:border-[#3869A0]"
              />
              <Search className="w-3.5 h-3.5 text-gray-400 absolute left-2.5 top-2 pointer-events-none" />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-2 text-gray-400 hover:text-gray-600"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            <div className="flex items-center gap-2 text-xs text-gray-500">
              <span>Mostrando <strong>{filteredNotifications.length}</strong> avisos</span>
            </div>
          </div>

          {/* Notification List Container */}
          <div className="bg-white rounded-lg border border-[#ccd5df] shadow-xs overflow-hidden">
            {filteredNotifications.length === 0 ? (
              <div className="p-12 text-center text-gray-400 space-y-3">
                <div className="w-14 h-14 rounded-full bg-gray-100 text-gray-300 flex items-center justify-center mx-auto">
                  <Bell className="w-7 h-7" />
                </div>
                <div>
                  <h3 className="font-bold text-gray-700 text-sm">No hay notificaciones para mostrar</h3>
                  <p className="text-xs text-gray-400 mt-1 max-w-sm mx-auto">
                    {searchQuery
                      ? 'No se encontraron avisos que coincidan con tu búsqueda.'
                      : activeFilter === 'no_leidas'
                      ? '¡Estás al día! No tienes notificaciones pendientes de leer.'
                      : 'Cuando tus amigos interactúen contigo en Inkorium aparecerán aquí.'}
                  </p>
                </div>
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="px-3 py-1 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded text-xs font-semibold cursor-pointer"
                  >
                    Borrar búsqueda
                  </button>
                )}
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {filteredNotifications.map(notif => {
                  const typeCfg = TYPE_CONFIG[notif.tipo] || TYPE_CONFIG.mp;
                  const IconComp = typeCfg.icon;
                  const isUnread = !notif.leido;

                  return (
                    <div
                      key={notif.id}
                      onClick={() => handleOpenNotification(notif)}
                      className={`p-3 sm:p-4 flex items-start gap-3 transition cursor-pointer relative group ${
                        isUnread ? 'bg-blue-50/40 hover:bg-blue-50/70 border-l-3 border-[#3869A0]' : 'hover:bg-gray-50'
                      }`}
                    >
                      {/* Avatar with type badge */}
                      <div className="relative flex-shrink-0">
                        <img
                          src={notif.fromUserAvatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80'}
                          alt=""
                          className="w-11 h-11 sm:w-12 sm:h-12 rounded-lg object-cover border border-gray-300 shadow-2xs"
                        />
                        <div className={`absolute -bottom-1 -right-1 w-5 h-5 rounded-full ${typeCfg.iconBg} border border-gray-200 flex items-center justify-center shadow-2xs`}>
                          <IconComp className={`w-3 h-3 ${typeCfg.iconColor}`} />
                        </div>
                      </div>

                      {/* Main Details Body */}
                      <div className="flex-1 min-w-0 pr-6">
                        <div className="flex flex-wrap items-center gap-1.5 mb-1">
                          <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded border ${typeCfg.badgeBg}`}>
                            {typeCfg.label}
                          </span>
                          <span className="text-[11px] text-gray-400 flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            <span>{notif.fecha}</span>
                          </span>
                          {isUnread && (
                            <span className="text-[10px] font-bold text-[#3869A0] bg-blue-100 px-1.5 py-0.2 rounded">
                              Nueva
                            </span>
                          )}
                        </div>

                        {/* Message Description */}
                        <p className="text-xs text-gray-800 leading-snug">
                          <strong
                            onClick={(e) => {
                              e.stopPropagation();
                              viewUserProfile(notif.fromUserId);
                            }}
                            className="text-[#3869A0] hover:underline cursor-pointer font-bold"
                          >
                            {notif.fromUserName}
                          </strong>{' '}
                          <span>{notif.mensaje.replace(notif.fromUserName, '').trim()}</span>
                        </p>

                        {/* Detail Quote Box (for comments, mentions, signatures) */}
                        {notif.detalle && (
                          <div className="mt-2 p-2 bg-gray-50/90 border-l-2 border-[#3869A0] rounded-r text-[11px] text-gray-700 italic flex items-start gap-1.5 shadow-2xs">
                            <span className="text-[#3869A0] font-bold text-sm leading-none select-none">“</span>
                            <span className="flex-1">{notif.detalle}</span>
                            <span className="text-[#3869A0] font-bold text-sm leading-none select-none">”</span>
                          </div>
                        )}

                        {/* Special Actions for Friend Request Notifications */}
                        {notif.tipo === 'peticion' && notif.estadoPeticion === 'pendiente' && (
                          <div className="mt-2.5 flex items-center gap-2" onClick={e => e.stopPropagation()}>
                            <button
                              onClick={() => {
                                if (notif.targetId) acceptFriendRequest(notif.targetId);
                                else {
                                  markNotificationAsRead(notif.id);
                                }
                                showFeedback(`Has aceptado la solicitud de ${notif.fromUserName}.`);
                              }}
                              className="px-3 py-1 bg-[#3869A0] hover:bg-[#2c537f] text-white font-bold rounded text-[11px] shadow-2xs flex items-center gap-1 transition cursor-pointer"
                            >
                              <Check className="w-3 h-3" />
                              <span>Aceptar solicitud</span>
                            </button>
                            <button
                              onClick={() => {
                                if (notif.targetId) ignoreFriendRequest(notif.targetId);
                                else deleteNotification(notif.id);
                                showFeedback(`Solicitud ignorada.`);
                              }}
                              className="px-2.5 py-1 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded text-[11px] font-semibold transition cursor-pointer"
                            >
                              Ignorar
                            </button>
                            <button
                              onClick={() => viewUserProfile(notif.fromUserId)}
                              className="px-2 py-1 text-[11px] text-[#3869A0] hover:underline font-semibold"
                            >
                              Ver perfil
                            </button>
                          </div>
                        )}

                        {notif.tipo === 'peticion' && notif.estadoPeticion === 'aceptada' && (
                          <div className="mt-2 flex items-center gap-1.5 text-[11px] text-emerald-700 font-semibold bg-emerald-50 px-2 py-1 rounded border border-emerald-200/60 inline-flex">
                            <UserCheck className="w-3.5 h-3.5 text-emerald-600" />
                            <span>Solicitud aceptada. ¡Ahora sois amigos!</span>
                          </div>
                        )}

                        {/* Direct action jump link */}
                        <div className="mt-2 flex items-center gap-3 text-[11px]">
                          <span className="text-[#3869A0] font-semibold flex items-center gap-1 group-hover:underline">
                            <span>Ver detalles y responder</span>
                            <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition" />
                          </span>
                        </div>
                      </div>

                      {/* Right Thumbnail for photo comments/tags */}
                      {notif.targetPhotoUrl && (
                        <div
                          onClick={(e) => {
                            e.stopPropagation();
                            if (notif.targetId) viewPhoto(notif.targetId);
                            else setActiveTab('fotos');
                          }}
                          className="w-14 h-14 sm:w-16 sm:h-16 rounded-md overflow-hidden border border-gray-300 flex-shrink-0 relative group/photo hover:scale-105 transition shadow-xs cursor-pointer bg-gray-100"
                          title="Ver foto asociada"
                        >
                          <img
                            src={notif.targetPhotoUrl}
                            alt=""
                            className="w-full h-full object-cover"
                          />
                          <div className="absolute inset-0 bg-black/20 group-hover/photo:bg-black/0 transition" />
                        </div>
                      )}

                      {/* Top-Right Item Actions (Delete, Toggle Read) */}
                      <div
                        onClick={e => e.stopPropagation()}
                        className="opacity-0 group-hover:opacity-100 transition absolute top-2.5 right-2.5 flex items-center gap-1 bg-white/90 p-0.5 rounded border border-gray-200 shadow-xs"
                      >
                        <button
                          onClick={() => {
                            if (notif.leido) {
                              // If already read, let user mark unread if desired or just re-read
                            } else {
                              markNotificationAsRead(notif.id);
                              showFeedback('Aviso marcado como leído.');
                            }
                          }}
                          className="p-1 text-gray-500 hover:text-[#3869A0] transition rounded hover:bg-gray-100"
                          title={notif.leido ? 'Leída' : 'Marcar como leída'}
                        >
                          <Check className={`w-3.5 h-3.5 ${notif.leido ? 'text-gray-400' : 'text-blue-600'}`} />
                        </button>
                        <button
                          onClick={() => {
                            deleteNotification(notif.id);
                            showFeedback('Notificación eliminada.');
                          }}
                          className="p-1 text-gray-400 hover:text-red-600 transition rounded hover:bg-red-50"
                          title="Eliminar notificación"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
