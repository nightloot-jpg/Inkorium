import React, { useState, useMemo } from 'react';
import { 
  Eye, Clock, Users, ArrowRight, MessageSquare, Mail, 
  ExternalLink, Sparkles, LayoutGrid, List, X, Calendar, 
  ShieldCheck, UserCheck, ChevronRight
} from 'lucide-react';
import { User, ProfileVisit, formatFullLocation } from '../types';
import { useInkorium } from '../context/InkoriumContext';

interface RecentProfileVisitsProps {
  profileUser: User;
  isOwnProfile: boolean;
  onViewUserProfile: (userId: string) => void;
  onOpenDirectMessage?: (userId: string) => void;
  onOpenChat?: (userId: string) => void;
}

// Format relative time with authentic Spanish Tuenti nostalgia
export function formatRelativeVisitTime(timestamp: number, fallbackStr?: string): string {
  if (!timestamp) return fallbackStr || 'Recientemente';
  const now = Date.now();
  const diffMs = Math.max(0, now - timestamp);
  const diffMinutes = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMinutes / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMinutes < 1) return 'Ahora mismo';
  if (diffMinutes === 1) return 'Hace 1 min';
  if (diffMinutes < 60) return `Hace ${diffMinutes} min`;

  const visitDate = new Date(timestamp);
  const currentDate = new Date();
  const isToday = visitDate.getDate() === currentDate.getDate() &&
                  visitDate.getMonth() === currentDate.getMonth() &&
                  visitDate.getFullYear() === currentDate.getFullYear();

  const yesterdayDate = new Date(currentDate);
  yesterdayDate.setDate(yesterdayDate.getDate() - 1);
  const isYesterday = visitDate.getDate() === yesterdayDate.getDate() &&
                      visitDate.getMonth() === yesterdayDate.getMonth() &&
                      visitDate.getFullYear() === yesterdayDate.getFullYear();

  const timeStr = visitDate.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });

  if (isToday) return `Hoy a las ${timeStr}`;
  if (isYesterday) return `Ayer a las ${timeStr}`;
  if (diffDays < 7) return `Hace ${diffDays} días`;

  return visitDate.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' });
}

// Short label for avatar badge
function formatShortBadgeTime(timestamp: number, fallbackStr?: string): string {
  if (!timestamp) return fallbackStr || 'Reciente';
  const now = Date.now();
  const diffMs = Math.max(0, now - timestamp);
  const diffMinutes = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMinutes / 60);

  if (diffMinutes < 5) return 'Ahora';
  if (diffMinutes < 60) return `${diffMinutes}m`;
  if (diffHours < 24) return `${diffHours}h`;
  
  const visitDate = new Date(timestamp);
  const currentDate = new Date();
  const isToday = visitDate.getDate() === currentDate.getDate() &&
                  visitDate.getMonth() === currentDate.getMonth() &&
                  visitDate.getFullYear() === currentDate.getFullYear();
  if (isToday) return 'Hoy';
  return 'Ayer';
}

export const RecentProfileVisits: React.FC<RecentProfileVisitsProps> = ({
  profileUser,
  isOwnProfile,
  onViewUserProfile,
  onOpenDirectMessage,
  onOpenChat
}) => {
  const { profileVisits, users, currentUser } = useInkorium();
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [showAllModal, setShowAllModal] = useState(false);
  const [historyFilter, setHistoryFilter] = useState<'todos' | 'hoy' | 'semana'>('todos');

  // Filter visits for this profile
  const userVisits = useMemo(() => {
    return profileVisits.filter(v => 
      v.visitedUserId === profileUser.id || 
      v.visitedUserId.replace(/^user-/, '') === profileUser.id.replace(/^user-/, '')
    );
  }, [profileVisits, profileUser.id]);

  // Enrich each visit with fresh data from users catalog
  const enrichedVisits = useMemo(() => {
    return userVisits.map(visit => {
      const matchedUser = users.find(u => 
        u.id === visit.visitorId || 
        u.id.replace(/^user-/, '') === visit.visitorId.replace(/^user-/, '')
      );

      const avatar = matchedUser?.avatar || visit.visitorAvatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80';
      const name = matchedUser 
        ? `${matchedUser.nombre} ${matchedUser.apellidos}`.trim() 
        : visit.visitorName;
      const firstName = matchedUser?.nombre || visit.visitorName.split(' ')[0] || 'Amigo';
      const isOnline = !!(matchedUser?.online || matchedUser?.presencia === 'conectado');
      const location = matchedUser ? formatFullLocation(matchedUser) : (visit.visitorProvincia || 'España');

      return {
        ...visit,
        matchedUser,
        avatar,
        name,
        firstName,
        isOnline,
        location,
        relativeTime: formatRelativeVisitTime(visit.timestamp, visit.fecha),
        shortBadgeTime: formatShortBadgeTime(visit.timestamp, visit.fecha)
      };
    });
  }, [userVisits, users]);

  // Visits statistics
  const now = Date.now();
  const visitsToday = useMemo(() => {
    return enrichedVisits.filter(v => (now - v.timestamp) < 24 * 60 * 60 * 1000);
  }, [enrichedVisits, now]);

  const visitsThisWeek = useMemo(() => {
    return enrichedVisits.filter(v => (now - v.timestamp) < 7 * 24 * 60 * 60 * 1000);
  }, [enrichedVisits, now]);

  // Total counter
  const totalCount = enrichedVisits.length;

  // Filtered visits for modal
  const modalVisits = useMemo(() => {
    if (historyFilter === 'hoy') return visitsToday;
    if (historyFilter === 'semana') return visitsThisWeek;
    return enrichedVisits;
  }, [historyFilter, enrichedVisits, visitsToday, visitsThisWeek]);

  return (
    <>
      <div 
        id="recent-profile-visits-widget"
        className="bg-white rounded border border-[#ccd5df] p-3 text-xs shadow-xs space-y-2.5 transition-all"
      >
        {/* Widget Header */}
        <div className="font-bold text-gray-800 pb-2 border-b border-gray-200 flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-gray-900">
            <div className="w-5 h-5 rounded-full bg-blue-50 text-[#3869A0] flex items-center justify-center">
              <Eye className="w-3.5 h-3.5" />
            </div>
            <span>Visitas al perfil</span>
          </div>

          <div className="flex items-center gap-1.5">
            {isOwnProfile && enrichedVisits.length > 0 && (
              <div className="flex items-center bg-gray-100 rounded p-0.5 border border-gray-200">
                <button
                  type="button"
                  onClick={() => setViewMode('grid')}
                  title="Ver en cuadrícula de avatares"
                  className={`p-1 rounded cursor-pointer transition ${
                    viewMode === 'grid' ? 'bg-white text-[#3869A0] shadow-2xs' : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  <LayoutGrid className="w-3 h-3" />
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode('list')}
                  title="Ver en lista detallada"
                  className={`p-1 rounded cursor-pointer transition ${
                    viewMode === 'list' ? 'bg-white text-[#3869A0] shadow-2xs' : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  <List className="w-3 h-3" />
                </button>
              </div>
            )}
            <span 
              id="profile-visits-total-counter"
              className="text-[10px] bg-[#3869A0] text-white font-bold px-2 py-0.5 rounded-full shadow-2xs"
            >
              {totalCount} {totalCount === 1 ? 'visita' : 'visitas'}
            </span>
          </div>
        </div>

        {/* Content based on own vs foreign profile */}
        {isOwnProfile ? (
          <div className="space-y-2.5">
            {/* Social Curiosity Subheader */}
            <div className="flex items-center justify-between text-[11px] text-gray-600 bg-blue-50/60 p-2 rounded border border-blue-100">
              <div className="flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                <span>¿Quién ha visto tu perfil?</span>
              </div>
              <div className="flex items-center gap-1 text-[10px] font-bold">
                {visitsToday.length > 0 && (
                  <span className="bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded">
                    +{visitsToday.length} hoy
                  </span>
                )}
                {visitsThisWeek.length > 0 && (
                  <span className="bg-blue-100 text-blue-800 px-1.5 py-0.5 rounded">
                    {visitsThisWeek.length} esta sem.
                  </span>
                )}
              </div>
            </div>

            {/* Empty state */}
            {enrichedVisits.length === 0 ? (
              <div className="py-4 px-2 text-center text-[11px] text-gray-500 space-y-1.5 bg-gray-50 rounded border border-dashed border-gray-200">
                <p className="font-semibold text-gray-700">Aún no tienes visitas registradas</p>
                <p className="text-[10px] text-gray-400">
                  Cuando tus amigos miren tus fotos, tu tablón o tu perfil en Inkorium, aparecerán aquí sus avatares.
                </p>
              </div>
            ) : viewMode === 'grid' ? (
              /* GRID OF AVATARS - Nostalgic Tuenti Style */
              <div className="grid grid-cols-4 gap-2 pt-1">
                {enrichedVisits.slice(0, 8).map((visit) => (
                  <div
                    key={visit.id}
                    onClick={() => onViewUserProfile(visit.visitorId)}
                    title={`${visit.name} (${visit.location}) • Visitó: ${visit.relativeTime}`}
                    className="group cursor-pointer flex flex-col items-center text-center transition"
                  >
                    <div className="relative w-full aspect-square max-w-[54px] rounded border border-gray-200 group-hover:border-[#3869A0] group-hover:shadow-xs transition overflow-hidden bg-gray-100">
                      <img
                        src={visit.avatar}
                        alt={visit.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition duration-200"
                        loading="lazy"
                      />
                      {/* Connection status indicator */}
                      <span
                        title={visit.isOnline ? 'En línea' : 'Desconectado'}
                        className={`absolute bottom-0.5 right-0.5 w-2.5 h-2.5 rounded-full ring-1 ring-white ${
                          visit.isOnline ? 'bg-emerald-500' : 'bg-gray-400'
                        }`}
                      />
                      {/* Badge of relative visit time */}
                      <span className="absolute top-0.5 left-0.5 px-1 py-0.2 bg-black/60 backdrop-blur-xs text-white text-[8px] font-bold rounded-xs leading-tight">
                        {visit.shortBadgeTime}
                      </span>
                    </div>
                    <span className="text-[10px] font-semibold text-gray-700 group-hover:text-[#3869A0] group-hover:underline truncate w-full mt-1">
                      {visit.firstName}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              /* LIST VIEW WITH FULL DETAILS */
              <div className="space-y-1.5 max-h-56 overflow-y-auto pr-0.5 divide-y divide-gray-100">
                {enrichedVisits.slice(0, 6).map((visit) => (
                  <div
                    key={visit.id}
                    onClick={() => onViewUserProfile(visit.visitorId)}
                    className="flex items-center justify-between p-1.5 hover:bg-blue-50/50 rounded cursor-pointer transition group"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="relative shrink-0">
                        <img
                          src={visit.avatar}
                          alt={visit.name}
                          className="w-8 h-8 rounded object-cover border border-gray-200 group-hover:border-[#3869A0]"
                        />
                        <span
                          className={`absolute bottom-0 right-0 w-2 h-2 rounded-full ring-1 ring-white ${
                            visit.isOnline ? 'bg-emerald-500' : 'bg-gray-400'
                          }`}
                        />
                      </div>
                      <div className="truncate">
                        <span className="font-semibold text-gray-800 group-hover:text-[#3869A0] text-[11px] block truncate">
                          {visit.name}
                        </span>
                        <span className="text-[10px] text-gray-400 block truncate">
                          {visit.location}
                        </span>
                      </div>
                    </div>
                    <span className="text-[10px] text-[#3869A0] font-medium shrink-0 ml-2">
                      {visit.relativeTime}
                    </span>
                  </div>
                ))}
              </div>
            )}

            {/* Footer with Expand Link and Privacy Badge */}
            <div className="pt-2 border-t border-gray-100 flex items-center justify-between text-[10px] text-gray-500">
              <span className="flex items-center gap-1 text-gray-400">
                <ShieldCheck className="w-3 h-3 text-emerald-600" />
                <span>Solo visible por ti</span>
              </span>

              {enrichedVisits.length > 0 && (
                <button
                  type="button"
                  onClick={() => setShowAllModal(true)}
                  className="text-[#3869A0] hover:underline font-bold flex items-center gap-0.5 cursor-pointer"
                >
                  <span>Ver todas ({enrichedVisits.length})</span>
                  <ChevronRight className="w-3 h-3" />
                </button>
              )}
            </div>
          </div>
        ) : (
          /* FOREIGN PROFILE VIEW */
          <div className="p-3 bg-gradient-to-b from-blue-50/70 to-white rounded border border-blue-100 text-center space-y-2">
            <div className="w-8 h-8 rounded-full bg-[#3869A0]/10 text-[#3869A0] flex items-center justify-center mx-auto">
              <Eye className="w-4 h-4" />
            </div>
            <div>
              <p className="text-[11px] font-bold text-gray-800">
                {profileUser.nombre} tiene {totalCount} {totalCount === 1 ? 'visita' : 'visitas'}
              </p>
              <p className="text-[10px] text-gray-500 mt-0.5 leading-relaxed">
                ¡Tu visita ha quedado registrada! Al entrar a su perfil, tu avatar aparecerá en su lista privada de amigos que le han visitado.
              </p>
            </div>
            <div className="pt-1 text-[9px] text-gray-400 flex items-center justify-center gap-1">
              <Sparkles className="w-3 h-3 text-amber-500" />
              <span>Curiosidad social de Inkorium</span>
            </div>
          </div>
        )}
      </div>

      {/* ================= MODAL: HISTORIAL COMPLETO DE VISITAS ================= */}
      {showAllModal && isOwnProfile && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4"
          onClick={() => setShowAllModal(false)}
        >
          <div 
            className="bg-white rounded-lg border border-gray-300 shadow-xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-150"
            onClick={e => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="bg-[#3869A0] text-white px-4 py-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Eye className="w-4 h-4" />
                <h3 className="font-bold text-sm">Historial de visitas a tu perfil</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowAllModal(false)}
                className="text-white/80 hover:text-white p-1 rounded hover:bg-white/10 transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Subheader & Filters */}
            <div className="p-3 bg-gray-50 border-b border-gray-200 flex flex-wrap items-center justify-between gap-2 text-xs">
              <div className="text-gray-600 font-medium">
                Total acumulado: <span className="font-bold text-[#3869A0]">{enrichedVisits.length} visitas</span>
              </div>

              <div className="flex items-center gap-1 bg-white p-0.5 rounded border border-gray-200">
                <button
                  type="button"
                  onClick={() => setHistoryFilter('todos')}
                  className={`px-2.5 py-1 rounded text-[11px] font-semibold transition cursor-pointer ${
                    historyFilter === 'todos' ? 'bg-[#3869A0] text-white shadow-2xs' : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Todas ({enrichedVisits.length})
                </button>
                <button
                  type="button"
                  onClick={() => setHistoryFilter('hoy')}
                  className={`px-2.5 py-1 rounded text-[11px] font-semibold transition cursor-pointer ${
                    historyFilter === 'hoy' ? 'bg-[#3869A0] text-white shadow-2xs' : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Hoy ({visitsToday.length})
                </button>
                <button
                  type="button"
                  onClick={() => setHistoryFilter('semana')}
                  className={`px-2.5 py-1 rounded text-[11px] font-semibold transition cursor-pointer ${
                    historyFilter === 'semana' ? 'bg-[#3869A0] text-white shadow-2xs' : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Esta semana ({visitsThisWeek.length})
                </button>
              </div>
            </div>

            {/* Visits List */}
            <div className="p-3 max-h-[380px] overflow-y-auto divide-y divide-gray-100">
              {modalVisits.length === 0 ? (
                <div className="py-8 text-center text-xs text-gray-500 space-y-1">
                  <p className="font-bold text-gray-700">No hay visitas en este periodo</p>
                  <p className="text-[11px] text-gray-400">Prueba a seleccionar el filtro de "Todas" las visitas.</p>
                </div>
              ) : (
                modalVisits.map((visit) => (
                  <div
                    key={visit.id}
                    className="py-2.5 px-1 flex items-center justify-between gap-3 hover:bg-gray-50 rounded transition"
                  >
                    <div 
                      onClick={() => {
                        setShowAllModal(false);
                        onViewUserProfile(visit.visitorId);
                      }}
                      className="flex items-center gap-3 cursor-pointer min-w-0 group"
                    >
                      <div className="relative shrink-0">
                        <img
                          src={visit.avatar}
                          alt={visit.name}
                          className="w-10 h-10 rounded object-cover border border-gray-200 group-hover:border-[#3869A0]"
                        />
                        <span
                          className={`absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full ring-2 ring-white ${
                            visit.isOnline ? 'bg-emerald-500' : 'bg-gray-400'
                          }`}
                        />
                      </div>
                      <div className="min-w-0">
                        <h4 className="font-bold text-xs text-gray-900 group-hover:text-[#3869A0] group-hover:underline truncate">
                          {visit.name}
                        </h4>
                        <p className="text-[11px] text-gray-500 truncate">
                          {visit.location}
                        </p>
                        <p className="text-[10px] text-[#3869A0] font-medium flex items-center gap-1 mt-0.5">
                          <Clock className="w-3 h-3" />
                          <span>{visit.relativeTime}</span>
                        </p>
                      </div>
                    </div>

                    {/* Quick actions for this visitor */}
                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        type="button"
                        onClick={() => {
                          setShowAllModal(false);
                          onViewUserProfile(visit.visitorId);
                        }}
                        className="px-2.5 py-1 bg-[#3869A0] hover:bg-[#2c537f] text-white text-[11px] font-bold rounded flex items-center gap-1 transition cursor-pointer shadow-2xs"
                        title="Visitar el perfil de este amigo"
                      >
                        <UserCheck className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline">Devolver visita</span>
                        <span className="sm:hidden">Visitar</span>
                      </button>

                      {onOpenChat && visit.visitorId !== currentUser.id && (
                        <button
                          type="button"
                          onClick={() => {
                            setShowAllModal(false);
                            onOpenChat(visit.visitorId);
                          }}
                          className="p-1.5 bg-gray-100 hover:bg-blue-50 text-gray-700 hover:text-[#3869A0] border border-gray-300 rounded transition cursor-pointer"
                          title="Abrir chat con este amigo"
                        >
                          <MessageSquare className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-3 bg-gray-50 border-t border-gray-200 flex items-center justify-between text-xs">
              <span className="text-[11px] text-gray-500">
                🔒 Tu lista de visitas es confidencial y solo tú puedes consultarla.
              </span>
              <button
                type="button"
                onClick={() => setShowAllModal(false)}
                className="px-3 py-1.5 bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold rounded text-xs transition cursor-pointer"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
