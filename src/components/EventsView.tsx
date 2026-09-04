import React, { useState, useMemo } from 'react';
import { useInkorium } from '../context/InkoriumContext';
import { 
  Calendar, MapPin, Users, Plus, MessageSquare, Clock, Check, 
  HelpCircle, X, Sparkles, Search, PartyPopper, Cake, Wine, 
  Music, Trophy, ChevronRight, Share2, AlertCircle, Camera, CheckCircle2,
  Upload, Eye, Heart, Image as ImageIcon, Flame
} from 'lucide-react';
import { SocialEvent, EventAttendanceStatus, EventPhoto } from '../types';

const CATEGORY_ICONS: Record<SocialEvent['categoria'], { label: string; icon: React.ReactNode; badgeBg: string }> = {
  fiesta: { label: 'Fiesta', icon: <PartyPopper className="w-3.5 h-3.5" />, badgeBg: 'bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-300' },
  cumpleanos: { label: 'Cumpleaños', icon: <Cake className="w-3.5 h-3.5" />, badgeBg: 'bg-pink-100 text-pink-800 dark:bg-pink-900/40 dark:text-pink-300' },
  botellon: { label: 'Botellón / Quedada', icon: <Wine className="w-3.5 h-3.5" />, badgeBg: 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300' },
  concierto: { label: 'Concierto / Música', icon: <Music className="w-3.5 h-3.5" />, badgeBg: 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300' },
  deporte: { label: 'Deporte / Partido', icon: <Trophy className="w-3.5 h-3.5" />, badgeBg: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300' },
  quedada: { label: 'Quedada informal', icon: <Users className="w-3.5 h-3.5" />, badgeBg: 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900/40 dark:text-cyan-300' },
  otro: { label: 'Evento', icon: <Calendar className="w-3.5 h-3.5" />, badgeBg: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300' }
};

const PRESET_COVERS = [
  { label: 'Fiesta / Luces', url: 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=1200&auto=format&fit=crop&q=80' },
  { label: 'Festival / Concierto', url: 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=1200&auto=format&fit=crop&q=80' },
  { label: 'Cumpleaños', url: 'https://images.unsplash.com/photo-1513151233558-d860c5398176?w=1200&auto=format&fit=crop&q=80' },
  { label: 'Noche / Discoteca', url: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=1200&auto=format&fit=crop&q=80' },
  { label: 'Parque / Retiro', url: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=1200&auto=format&fit=crop&q=80' }
];

const PARTY_PHOTO_SAMPLES = [
  { label: 'Brindis con amigos', url: 'https://images.unsplash.com/photo-1519671482749-fd09be7ccebf?w=800&auto=format&fit=crop&q=80' },
  { label: 'Foto de grupo', url: 'https://images.unsplash.com/photo-1543807535-eceef0bc6599?w=800&auto=format&fit=crop&q=80' },
  { label: 'En la pista', url: 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=800&auto=format&fit=crop&q=80' },
  { label: 'Risas en el botellón', url: 'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=800&auto=format&fit=crop&q=80' }
];

export const EventsView: React.FC = () => {
  const { 
    events, 
    currentUser, 
    createEvent, 
    rsvpEvent, 
    commentEvent, 
    deleteEvent,
    addEventPhoto,
    viewUserProfile,
    setActiveTab,
    selectedEventId,
    setSelectedEventId
  } = useInkorium();

  const [activeFilter, setActiveFilter] = useState<'todos' | 'proximos' | 'mis_eventos' | 'asistiendo'>('todos');
  const [searchQuery, setSearchQuery] = useState('');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [activeEventDetail, setActiveEventDetail] = useState<SocialEvent | null>(() => {
    if (selectedEventId) {
      return events.find(e => e.id === selectedEventId) || null;
    }
    return null;
  });

  // Keep active event reactive to events updates
  const currentEvent = useMemo(() => {
    if (!activeEventDetail) return null;
    return events.find(e => e.id === activeEventDetail.id) || activeEventDetail;
  }, [events, activeEventDetail]);

  // Collaborative Album State
  const [isAddPhotoModalOpen, setIsAddPhotoModalOpen] = useState(false);
  const [newPhotoUrl, setNewPhotoUrl] = useState('');
  const [newPhotoCaption, setNewPhotoCaption] = useState('');
  const [applyRetroFilter, setApplyRetroFilter] = useState(true);
  const [previewingEventPhoto, setPreviewingEventPhoto] = useState<EventPhoto | null>(null);

  // Create Form State
  const [newTitle, setNewTitle] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newLugar, setNewLugar] = useState('');
  const [newCiudad, setNewCiudad] = useState(currentUser.provincia || 'Madrid');
  const [newFechaTexto, setNewFechaTexto] = useState('');
  const [newCategoria, setNewCategoria] = useState<SocialEvent['categoria']>('fiesta');
  const [newPortada, setNewPortada] = useState(PRESET_COVERS[0].url);
  const [commentInput, setCommentInput] = useState('');

  // Synchronize when selectedEventId changes from external context
  React.useEffect(() => {
    if (selectedEventId) {
      const found = events.find(e => e.id === selectedEventId);
      if (found) setActiveEventDetail(found);
    }
  }, [selectedEventId, events]);

  const filteredEvents = useMemo(() => {
    return events.filter(evt => {
      const matchesSearch = 
        evt.titulo.toLowerCase().includes(searchQuery.toLowerCase()) ||
        evt.lugar.toLowerCase().includes(searchQuery.toLowerCase()) ||
        evt.descripcion.toLowerCase().includes(searchQuery.toLowerCase()) ||
        evt.creadorNombre.toLowerCase().includes(searchQuery.toLowerCase());

      if (!matchesSearch) return false;

      if (activeFilter === 'mis_eventos') {
        return evt.creadorId === currentUser.id;
      }
      if (activeFilter === 'asistiendo') {
        return evt.asistentes.some(a => a.userId === currentUser.id && a.estado === 'asistire');
      }
      return true;
    });
  }, [events, searchQuery, activeFilter, currentUser.id]);

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newLugar.trim()) return;

    const newId = createEvent({
      titulo: newTitle.trim(),
      descripcion: newDesc.trim() || '¡Quedada con amigos de Inkorium!',
      lugar: newLugar.trim(),
      ciudad: newCiudad.trim(),
      provincia: newCiudad.trim(),
      fechaHora: new Date().toISOString(),
      fechaTexto: newFechaTexto.trim() || 'Este fin de semana',
      categoria: newCategoria,
      portada: newPortada,
      privacidad: 'publico'
    });

    setIsCreateModalOpen(false);
    setNewTitle('');
    setNewDesc('');
    setNewLugar('');
    setNewFechaTexto('');
    
    // Open the newly created event
    const created = events.find(ev => ev.id === newId);
    if (created) setActiveEventDetail(created);
  };

  const handleRsvp = (eventId: string, status: EventAttendanceStatus) => {
    rsvpEvent(eventId, status);
    if (activeEventDetail && activeEventDetail.id === eventId) {
      setActiveEventDetail(prev => {
        if (!prev) return null;
        const exists = prev.asistentes.find(a => a.userId === currentUser.id);
        let updatedAttendees = [...prev.asistentes];
        if (exists) {
          updatedAttendees = updatedAttendees.map(a => 
            a.userId === currentUser.id ? { ...a, estado: status, fecha: 'Ahora mismo' } : a
          );
        } else {
          updatedAttendees.push({
            userId: currentUser.id,
            userName: `${currentUser.nombre} ${currentUser.apellidos}`.trim() || currentUser.nombre,
            userAvatar: currentUser.avatar,
            estado: status,
            fecha: 'Ahora mismo'
          });
        }
        return { ...prev, asistentes: updatedAttendees };
      });
    }
  };

  const handleCommentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeEventDetail || !commentInput.trim()) return;
    commentEvent(activeEventDetail.id, commentInput.trim());
    setCommentInput('');
    
    // Update local preview immediately
    setActiveEventDetail(prev => {
      if (!prev) return null;
      return {
        ...prev,
        comentarios: [
          ...prev.comentarios,
          {
            id: `cmt-${Date.now()}`,
            autorId: currentUser.id,
            autorNombre: `${currentUser.nombre} ${currentUser.apellidos}`.trim() || currentUser.nombre,
            autorAvatar: currentUser.avatar,
            texto: commentInput.trim(),
            fecha: 'Ahora mismo'
          }
        ]
      };
    });
  };

  const currentEventRsvp = (event: SocialEvent): EventAttendanceStatus | null => {
    const found = event.asistentes.find(a => a.userId === currentUser.id);
    return found ? found.estado : null;
  };

  return (
    <div className="w-full max-w-[1720px] 2xl:max-w-[1850px] mx-auto px-3 sm:px-6 lg:px-8 py-4">
      {/* Top Banner Nostálgico */}
      <div className="bg-gradient-to-r from-[#2c5282] via-[#3869A0] to-[#2b4c7e] text-white rounded-t border border-[#2b4c7e] p-4 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-4">
        <div>
          <div className="flex items-center gap-2">
            <Calendar className="w-6 h-6 text-yellow-300" />
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight">Eventos & Quedadas</h1>
            <span className="bg-yellow-400 text-gray-900 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
              Tuenti Clásico
            </span>
          </div>
          <p className="text-xs sm:text-sm text-blue-100 mt-1 max-w-2xl">
            El motor de la vida real de Tuenti: organiza las fiestas del finde, botellones, cumpleaños y conciertos. Confirma quién asiste y comenta en el tablón del evento.
          </p>
        </div>

        <button
          onClick={() => setIsCreateModalOpen(true)}
          className="inline-flex items-center gap-1.5 px-4 py-2 bg-yellow-400 hover:bg-yellow-300 active:bg-yellow-500 text-gray-900 font-bold text-xs sm:text-sm rounded shadow-sm hover:shadow transition-all cursor-pointer whitespace-nowrap"
        >
          <Plus className="w-4 h-4" />
          <span>Crear nuevo evento</span>
        </button>
      </div>

      {/* Main Content Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        {/* Left Sidebar: Filters & Stats */}
        <div className="lg:col-span-1 space-y-4">
          <div className="bg-white dark:bg-[#142032] border border-[#ccd5df] dark:border-[#1d2b40] rounded shadow-sm p-3">
            <h2 className="text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wide mb-2 px-1">
              Filtrar Eventos
            </h2>
            <div className="space-y-1">
              <button
                onClick={() => setActiveFilter('todos')}
                className={`w-full text-left px-2.5 py-1.5 rounded text-xs font-medium flex items-center justify-between transition-colors ${
                  activeFilter === 'todos'
                    ? 'bg-[#3869A0] text-white font-bold'
                    : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-[#1a2942]'
                }`}
              >
                <span>Todos los eventos</span>
                <span className="text-[11px] opacity-80">{events.length}</span>
              </button>
              <button
                onClick={() => setActiveFilter('asistiendo')}
                className={`w-full text-left px-2.5 py-1.5 rounded text-xs font-medium flex items-center justify-between transition-colors ${
                  activeFilter === 'asistiendo'
                    ? 'bg-[#3869A0] text-white font-bold'
                    : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-[#1a2942]'
                }`}
              >
                <span>Eventos a los que asisto</span>
                <span className="text-[11px] opacity-80">
                  {events.filter(e => e.asistentes.some(a => a.userId === currentUser.id && a.estado === 'asistire')).length}
                </span>
              </button>
              <button
                onClick={() => setActiveFilter('mis_eventos')}
                className={`w-full text-left px-2.5 py-1.5 rounded text-xs font-medium flex items-center justify-between transition-colors ${
                  activeFilter === 'mis_eventos'
                    ? 'bg-[#3869A0] text-white font-bold'
                    : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-[#1a2942]'
                }`}
              >
                <span>Eventos que organizo</span>
                <span className="text-[11px] opacity-80">
                  {events.filter(e => e.creadorId === currentUser.id).length}
                </span>
              </button>
            </div>

            {/* Search */}
            <div className="mt-4 pt-3 border-t border-gray-200 dark:border-[#1d2b40]">
              <label className="text-[11px] font-bold text-gray-500 dark:text-gray-400 block mb-1">
                Buscar evento o lugar:
              </label>
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-gray-400 absolute left-2.5 top-2.5" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  placeholder="Ej: Cumpleaños, Fabrik, Retiro..."
                  className="w-full pl-8 pr-2.5 py-1.5 text-xs bg-gray-50 dark:bg-[#0e1726] border border-gray-300 dark:border-[#1d2b40] rounded focus:outline-none focus:ring-1 focus:ring-[#3869A0]"
                />
              </div>
            </div>
          </div>

          {/* Tips Nostálgicos */}
          <div className="bg-[#f0f4f9] dark:bg-[#142032] border border-[#d2dce6] dark:border-[#1d2b40] rounded p-3 text-xs text-gray-600 dark:text-gray-300">
            <div className="flex items-center gap-1.5 font-bold text-[#3869A0] dark:text-blue-400 mb-1">
              <Sparkles className="w-3.5 h-3.5" />
              <span>¿Sabías que...?</span>
            </div>
            <p className="leading-relaxed text-[11px]">
              En el Tuenti de 2008, si no confirmabas tu asistencia en el evento antes del viernes por la tarde, ¡te quedabas fuera de las listas de entrada reducida en las discotecas!
            </p>
          </div>
        </div>

        {/* Right Area: Event Cards or Active Detail */}
        <div className="lg:col-span-3 space-y-4">
          {activeEventDetail ? (
            /* DETALLE COMPLETO DEL EVENTO SELECCIONADO */
            <div className="bg-white dark:bg-[#142032] border border-[#ccd5df] dark:border-[#1d2b40] rounded shadow-sm overflow-hidden">
              {/* Back button */}
              <div className="bg-gray-100 dark:bg-[#101b2b] px-4 py-2 border-b border-gray-200 dark:border-[#1d2b40] flex items-center justify-between">
                <button
                  onClick={() => {
                    setActiveEventDetail(null);
                    setSelectedEventId(null);
                  }}
                  className="text-xs font-semibold text-[#3869A0] dark:text-blue-400 hover:underline flex items-center gap-1 cursor-pointer"
                >
                  ← Volver al listado de eventos
                </button>
                {activeEventDetail.creadorId === currentUser.id && (
                  <button
                    onClick={() => {
                      if (confirm('¿Eliminar este evento definitivamente?')) {
                        deleteEvent(activeEventDetail.id);
                        setActiveEventDetail(null);
                        setSelectedEventId(null);
                      }
                    }}
                    className="text-xs text-red-600 hover:text-red-700 hover:underline cursor-pointer"
                  >
                    Eliminar evento
                  </button>
                )}
              </div>

              {/* Event Hero Cover */}
              <div className="relative h-56 sm:h-72 w-full bg-gray-900 overflow-hidden">
                <img
                  src={activeEventDetail.portada || PRESET_COVERS[0].url}
                  alt={activeEventDetail.titulo}
                  className="w-full h-full object-cover opacity-85"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent flex flex-col justify-end p-4 sm:p-6 text-white">
                  <div className="flex flex-wrap items-center gap-2 mb-2">
                    <span className={`inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full ${CATEGORY_ICONS[activeEventDetail.categoria]?.badgeBg || 'bg-blue-600'}`}>
                      {CATEGORY_ICONS[activeEventDetail.categoria]?.icon}
                      {CATEGORY_ICONS[activeEventDetail.categoria]?.label || 'Evento'}
                    </span>
                    <span className="bg-black/50 backdrop-blur-sm text-[11px] px-2 py-0.5 rounded text-gray-200">
                      {activeEventDetail.ciudad || 'Madrid'}
                    </span>
                  </div>
                  <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold drop-shadow">
                    {activeEventDetail.titulo}
                  </h1>
                  <div className="flex flex-wrap items-center gap-4 text-xs sm:text-sm text-gray-200 mt-2">
                    <div className="flex items-center gap-1.5">
                      <Clock className="w-4 h-4 text-yellow-300" />
                      <span>{activeEventDetail.fechaTexto}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <MapPin className="w-4 h-4 text-red-400" />
                      <span>{activeEventDetail.lugar}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* RSVP Action Bar */}
              <div className="bg-[#eef3f8] dark:bg-[#0e1726] p-3 sm:p-4 border-b border-[#ccd5df] dark:border-[#1d2b40] flex flex-col sm:flex-row items-center justify-between gap-3">
                <div className="flex items-center gap-2 text-xs font-semibold text-gray-700 dark:text-gray-300">
                  <span>¿Asistirás a este evento?</span>
                  {currentEventRsvp(activeEventDetail) && (
                    <span className="text-emerald-600 dark:text-emerald-400 font-bold">
                      (Has respondido: {
                        currentEventRsvp(activeEventDetail) === 'asistire' ? 'Asistiré' :
                        currentEventRsvp(activeEventDetail) === 'quizas' ? 'Quizás' : 'No asistiré'
                      })
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <button
                    onClick={() => handleRsvp(activeEventDetail.id, 'asistire')}
                    className={`flex-1 sm:flex-none px-3 py-1.5 rounded text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1 ${
                      currentEventRsvp(activeEventDetail) === 'asistire'
                        ? 'bg-emerald-600 text-white shadow'
                        : 'bg-white dark:bg-[#1a2942] border border-gray-300 dark:border-gray-600 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-50'
                    }`}
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>Asistiré</span>
                  </button>
                  <button
                    onClick={() => handleRsvp(activeEventDetail.id, 'quizas')}
                    className={`flex-1 sm:flex-none px-3 py-1.5 rounded text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1 ${
                      currentEventRsvp(activeEventDetail) === 'quizas'
                        ? 'bg-amber-600 text-white shadow'
                        : 'bg-white dark:bg-[#1a2942] border border-gray-300 dark:border-gray-600 text-amber-700 dark:text-amber-400 hover:bg-amber-50'
                    }`}
                  >
                    <HelpCircle className="w-3.5 h-3.5" />
                    <span>Quizás</span>
                  </button>
                  <button
                    onClick={() => handleRsvp(activeEventDetail.id, 'no_asistire')}
                    className={`flex-1 sm:flex-none px-3 py-1.5 rounded text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1 ${
                      currentEventRsvp(activeEventDetail) === 'no_asistire'
                        ? 'bg-red-600 text-white shadow'
                        : 'bg-white dark:bg-[#1a2942] border border-gray-300 dark:border-gray-600 text-red-700 dark:text-red-400 hover:bg-red-50'
                    }`}
                  >
                    <X className="w-3.5 h-3.5" />
                    <span>No asistiré</span>
                  </button>
                </div>
              </div>

              {/* Event Body: Info + Attendees + Comments */}
              <div className="p-4 sm:p-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left: Description & Attendees */}
                <div className="lg:col-span-2 space-y-6">
                  <div>
                    <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
                      Información del evento
                    </h3>
                    <p className="text-sm text-gray-800 dark:text-gray-200 leading-relaxed whitespace-pre-line bg-gray-50 dark:bg-[#0e1726] p-3 rounded border border-gray-200 dark:border-[#1d2b40]">
                      {activeEventDetail.descripcion}
                    </p>
                  </div>

                  {/* Organizado por */}
                  <div className="flex items-center gap-3 p-3 bg-[#f5f8fc] dark:bg-[#111c2e] rounded border border-[#ccd5df] dark:border-[#1d2b40]">
                    <img
                      src={activeEventDetail.creadorAvatar}
                      alt={activeEventDetail.creadorNombre}
                      className="w-10 h-10 rounded-full object-cover border border-[#3869A0]"
                    />
                    <div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">Organizado por:</div>
                      <button
                        onClick={() => viewUserProfile(activeEventDetail.creadorId)}
                        className="text-xs font-bold text-[#3869A0] dark:text-blue-400 hover:underline cursor-pointer"
                      >
                        {activeEventDetail.creadorNombre}
                      </button>
                    </div>
                  </div>

                  {/* Álbum Colaborativo Post-Fiesta / Post-Evento */}
                  <div className="bg-[#fbfcff] dark:bg-[#101b2d] border border-[#ccd5df] dark:border-[#1d2b40] rounded-lg p-4 space-y-3">
                    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-gray-200 dark:border-[#1d2b40] pb-3">
                      <div>
                        <h3 className="text-sm font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                          <Camera className="w-4 h-4 text-[#3869A0]" />
                          <span>Álbum Colaborativo Post-Evento</span>
                          <span className="bg-blue-100 dark:bg-blue-900/50 text-[#3869A0] dark:text-blue-300 text-xs px-2 py-0.5 rounded-full font-bold">
                            {(currentEvent?.fotosColaborativas || []).length} fotos
                          </span>
                        </h3>
                        <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5">
                          Todos los amigos que asistieron pueden volcar sus fotos aquí en lugar de tenerlas dispersas en chats de mensajería.
                        </p>
                      </div>

                      <button
                        onClick={() => setIsAddPhotoModalOpen(true)}
                        className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-md shadow-xs flex items-center gap-1.5 transition-all cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Subir fotos a este álbum</span>
                      </button>
                    </div>

                    {/* Collaborative photos grid */}
                    {(currentEvent?.fotosColaborativas || []).length === 0 ? (
                      <div className="p-6 text-center border-2 border-dashed border-gray-200 dark:border-gray-700/60 rounded-lg">
                        <Camera className="w-8 h-8 text-gray-400 mx-auto mb-2 opacity-60" />
                        <h4 className="text-xs font-bold text-gray-700 dark:text-gray-300">
                          El álbum colaborativo está esperando tus recuerdos
                        </h4>
                        <p className="text-[11px] text-gray-500 dark:text-gray-400 max-w-sm mx-auto mt-1 mb-3">
                          ¿Asististe o estás en esta quedada? Sube tus fotos de la fiesta para compartirlas con todos los amigos que fueron.
                        </p>
                        <button
                          onClick={() => setIsAddPhotoModalOpen(true)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#3869A0] hover:bg-[#2a517c] text-white font-bold text-xs rounded shadow-xs cursor-pointer"
                        >
                          <Upload className="w-3.5 h-3.5" />
                          <span>Añadir la primera foto</span>
                        </button>
                      </div>
                    ) : (
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-1">
                        {currentEvent?.fotosColaborativas.map(foto => (
                          <div
                            key={foto.id}
                            onClick={() => setPreviewingEventPhoto(foto)}
                            className="group bg-white dark:bg-[#152238] border border-gray-200 dark:border-[#1d2b40] rounded-md p-1.5 shadow-2xs hover:shadow-md transition-all cursor-pointer relative"
                          >
                            <div className="relative aspect-4/3 rounded overflow-hidden bg-black/5">
                              <img
                                src={foto.url}
                                alt={foto.caption || 'Foto del evento'}
                                className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                              />
                              {/* Analog 2008 retro date stamp */}
                              <div className="absolute bottom-1 right-1.5 font-mono text-[10px] font-bold text-[#ff9000] drop-shadow-[0_1px_2px_rgba(0,0,0,0.9)] select-none tracking-widest">
                                '08 09 14
                              </div>
                            </div>
                            <div className="mt-1.5 px-1">
                              {foto.caption && (
                                <p className="text-[11px] text-gray-800 dark:text-gray-200 font-medium truncate">
                                  {foto.caption}
                                </p>
                              )}
                              <div className="flex items-center justify-between text-[9px] text-gray-400 mt-0.5">
                                <span className="truncate">Por {foto.uploaderName}</span>
                                <span>{foto.fecha}</span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Tablón de comentarios del evento */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider flex items-center gap-1.5">
                        <MessageSquare className="w-4 h-4 text-[#3869A0]" />
                        <span>Tablón de la fiesta / Comentarios ({activeEventDetail.comentarios.length})</span>
                      </h3>
                    </div>

                    <form onSubmit={handleCommentSubmit} className="mb-4">
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={commentInput}
                          onChange={e => setCommentInput(e.target.value)}
                          placeholder="¿Quién lleva los vasos? Deja una firma en el tablón del evento..."
                          className="flex-1 px-3 py-2 text-xs bg-gray-50 dark:bg-[#0e1726] border border-gray-300 dark:border-[#1d2b40] rounded focus:outline-none focus:ring-1 focus:ring-[#3869A0]"
                        />
                        <button
                          type="submit"
                          disabled={!commentInput.trim()}
                          className="px-3 py-2 bg-[#3869A0] hover:bg-[#2c5282] text-white font-bold text-xs rounded transition-colors cursor-pointer disabled:opacity-50"
                        >
                          Publicar
                        </button>
                      </div>
                    </form>

                    <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
                      {activeEventDetail.comentarios.length === 0 ? (
                        <div className="text-center py-6 text-xs text-gray-400 border border-dashed border-gray-200 dark:border-gray-800 rounded">
                          Aún no hay comentarios. ¡Sé el primero en firmar en el tablón del evento!
                        </div>
                      ) : (
                        activeEventDetail.comentarios.map(c => (
                          <div key={c.id} className="p-2.5 bg-gray-50 dark:bg-[#0e1726] rounded border border-gray-200 dark:border-[#1d2b40] flex items-start gap-2.5">
                            <img
                              src={c.autorAvatar}
                              alt={c.autorNombre}
                              className="w-8 h-8 rounded object-cover cursor-pointer"
                              onClick={() => viewUserProfile(c.autorId)}
                            />
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between">
                                <button
                                  onClick={() => viewUserProfile(c.autorId)}
                                  className="text-xs font-bold text-[#3869A0] dark:text-blue-400 hover:underline cursor-pointer"
                                >
                                  {c.autorNombre}
                                </button>
                                <span className="text-[10px] text-gray-400">{c.fecha}</span>
                              </div>
                              <p className="text-xs text-gray-700 dark:text-gray-300 mt-0.5 break-words">
                                {c.texto}
                              </p>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>

                {/* Right: Attendee Lists by Status */}
                <div className="space-y-4">
                  <div className="bg-gray-50 dark:bg-[#0e1726] p-3 rounded border border-gray-200 dark:border-[#1d2b40]">
                    <h4 className="text-xs font-bold text-emerald-700 dark:text-emerald-400 mb-2 flex items-center justify-between">
                      <span>✔ Asistirán ({activeEventDetail.asistentes.filter(a => a.estado === 'asistire').length})</span>
                    </h4>
                    <div className="flex flex-wrap gap-1.5 max-h-48 overflow-y-auto">
                      {activeEventDetail.asistentes.filter(a => a.estado === 'asistire').map(a => (
                        <div
                          key={a.userId}
                          onClick={() => viewUserProfile(a.userId)}
                          title={`${a.userName} (${a.fecha})`}
                          className="flex items-center gap-1 bg-white dark:bg-[#142032] border border-emerald-200 dark:border-emerald-900/50 rounded px-1.5 py-0.5 text-[11px] cursor-pointer hover:border-emerald-500"
                        >
                          <img src={a.userAvatar} alt={a.userName} className="w-4 h-4 rounded-full object-cover" />
                          <span className="font-medium text-gray-800 dark:text-gray-200 truncate max-w-[80px]">
                            {a.userName.split(' ')[0]}
                          </span>
                        </div>
                      ))}
                      {activeEventDetail.asistentes.filter(a => a.estado === 'asistire').length === 0 && (
                        <span className="text-[11px] text-gray-400">Nadie confirmado todavía.</span>
                      )}
                    </div>
                  </div>

                  <div className="bg-gray-50 dark:bg-[#0e1726] p-3 rounded border border-gray-200 dark:border-[#1d2b40]">
                    <h4 className="text-xs font-bold text-amber-700 dark:text-amber-400 mb-2">
                      ❓ Quizás ({activeEventDetail.asistentes.filter(a => a.estado === 'quizas').length})
                    </h4>
                    <div className="flex flex-wrap gap-1.5 max-h-36 overflow-y-auto">
                      {activeEventDetail.asistentes.filter(a => a.estado === 'quizas').map(a => (
                        <div
                          key={a.userId}
                          onClick={() => viewUserProfile(a.userId)}
                          title={a.userName}
                          className="flex items-center gap-1 bg-white dark:bg-[#142032] border border-amber-200 dark:border-amber-900/50 rounded px-1.5 py-0.5 text-[11px] cursor-pointer hover:border-amber-500"
                        >
                          <img src={a.userAvatar} alt={a.userName} className="w-4 h-4 rounded-full object-cover" />
                          <span className="font-medium text-gray-800 dark:text-gray-200 truncate max-w-[80px]">
                            {a.userName.split(' ')[0]}
                          </span>
                        </div>
                      ))}
                      {activeEventDetail.asistentes.filter(a => a.estado === 'quizas').length === 0 && (
                        <span className="text-[11px] text-gray-400">Sin indecisos.</span>
                      )}
                    </div>
                  </div>

                  <div className="bg-gray-50 dark:bg-[#0e1726] p-3 rounded border border-gray-200 dark:border-[#1d2b40]">
                    <h4 className="text-xs font-bold text-red-700 dark:text-red-400 mb-2">
                      ✖ No asistirán ({activeEventDetail.asistentes.filter(a => a.estado === 'no_asistire').length})
                    </h4>
                    <div className="flex flex-wrap gap-1.5 max-h-36 overflow-y-auto">
                      {activeEventDetail.asistentes.filter(a => a.estado === 'no_asistire').map(a => (
                        <div
                          key={a.userId}
                          onClick={() => viewUserProfile(a.userId)}
                          title={a.userName}
                          className="flex items-center gap-1 bg-white dark:bg-[#142032] border border-red-200 dark:border-red-900/50 rounded px-1.5 py-0.5 text-[11px] cursor-pointer hover:border-red-500"
                        >
                          <img src={a.userAvatar} alt={a.userName} className="w-4 h-4 rounded-full object-cover" />
                          <span className="font-medium text-gray-800 dark:text-gray-200 truncate max-w-[80px]">
                            {a.userName.split(' ')[0]}
                          </span>
                        </div>
                      ))}
                      {activeEventDetail.asistentes.filter(a => a.estado === 'no_asistire').length === 0 && (
                        <span className="text-[11px] text-gray-400">Nadie ha rechazado.</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            /* LISTADO DE EVENTOS EN GRID DE TARJETAS */
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold text-gray-600 dark:text-gray-300">
                  Mostrando {filteredEvents.length} eventos
                </span>
              </div>

              {filteredEvents.length === 0 ? (
                <div className="bg-white dark:bg-[#142032] border border-[#ccd5df] dark:border-[#1d2b40] rounded p-8 text-center">
                  <Calendar className="w-12 h-12 mx-auto text-gray-400 mb-2 opacity-60" />
                  <h3 className="text-sm font-bold text-gray-700 dark:text-gray-200 mb-1">
                    No se encontraron eventos
                  </h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400 max-w-md mx-auto mb-4">
                    Sé el primero en organizar la quedada o fiesta del próximo fin de semana.
                  </p>
                  <button
                    onClick={() => setIsCreateModalOpen(true)}
                    className="px-4 py-2 bg-[#3869A0] text-white font-bold text-xs rounded hover:bg-[#2c5282] transition-colors cursor-pointer"
                  >
                    Crear mi primer evento
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {filteredEvents.map(evt => {
                    const myRsvp = currentEventRsvp(evt);
                    const numAsistire = evt.asistentes.filter(a => a.estado === 'asistire').length;
                    const numQuizas = evt.asistentes.filter(a => a.estado === 'quizas').length;

                    return (
                      <div
                        key={evt.id}
                        className="bg-white dark:bg-[#142032] border border-[#ccd5df] dark:border-[#1d2b40] rounded overflow-hidden shadow-sm hover:shadow-md transition-shadow flex flex-col"
                      >
                        {/* Card Image */}
                        <div
                          onClick={() => setActiveEventDetail(evt)}
                          className="relative h-36 bg-gray-900 cursor-pointer overflow-hidden group"
                        >
                          <img
                            src={evt.portada || PRESET_COVERS[0].url}
                            alt={evt.titulo}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300 opacity-90"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/30 p-2.5 flex flex-col justify-between">
                            <div className="flex items-center justify-between">
                              <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full ${CATEGORY_ICONS[evt.categoria]?.badgeBg || 'bg-blue-600 text-white'}`}>
                                {CATEGORY_ICONS[evt.categoria]?.icon}
                                {CATEGORY_ICONS[evt.categoria]?.label || 'Evento'}
                              </span>
                              {myRsvp && (
                                <span className="bg-black/60 backdrop-blur-sm text-yellow-300 text-[10px] font-bold px-2 py-0.5 rounded">
                                  {myRsvp === 'asistire' ? '✔ Asistirás' : myRsvp === 'quizas' ? '❓ Quizás' : '✖ No'}
                                </span>
                              )}
                            </div>
                            <div>
                              <span className="text-[10px] text-yellow-300 font-semibold block">
                                {evt.fechaTexto}
                              </span>
                              <h3 className="text-sm font-bold text-white leading-snug drop-shadow line-clamp-1">
                                {evt.titulo}
                              </h3>
                            </div>
                          </div>
                        </div>

                        {/* Card Content */}
                        <div className="p-3 flex-1 flex flex-col justify-between space-y-2.5">
                          <div>
                            <div className="flex items-center gap-1 text-[11px] text-gray-500 dark:text-gray-400 mb-1">
                              <MapPin className="w-3.5 h-3.5 text-red-500 shrink-0" />
                              <span className="truncate">{evt.lugar} ({evt.ciudad || 'Madrid'})</span>
                            </div>
                            <p className="text-xs text-gray-700 dark:text-gray-300 line-clamp-2 leading-relaxed">
                              {evt.descripcion}
                            </p>
                          </div>

                          {/* Footer Stats & Quick Buttons */}
                          <div className="pt-2 border-t border-gray-100 dark:border-[#1d2b40] flex items-center justify-between">
                            <div className="text-[11px] text-gray-600 dark:text-gray-400 flex items-center gap-2">
                              <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                                ✔ {numAsistire} asistirán
                              </span>
                              {numQuizas > 0 && (
                                <span className="text-amber-600 dark:text-amber-400">
                                  • {numQuizas} quizás
                                </span>
                              )}
                            </div>

                            <button
                              onClick={() => setActiveEventDetail(evt)}
                              className="text-xs font-bold text-[#3869A0] dark:text-blue-400 hover:underline flex items-center gap-0.5 cursor-pointer"
                            >
                              <span>Ver evento</span>
                              <ChevronRight className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* MODAL CREAR EVENTO */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3">
          <div className="bg-white dark:bg-[#142032] border border-[#ccd5df] dark:border-[#1d2b40] rounded-lg shadow-xl w-full max-w-lg overflow-hidden max-h-[90vh] flex flex-col">
            <div className="bg-[#3869A0] text-white p-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-yellow-300" />
                <h3 className="text-sm font-bold">Crear nuevo Evento en Inkorium</h3>
              </div>
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="text-white/80 hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} className="p-4 overflow-y-auto space-y-3 flex-1 text-xs">
              <div>
                <label className="font-bold text-gray-700 dark:text-gray-300 block mb-1">
                  Nombre del evento *
                </label>
                <input
                  type="text"
                  required
                  value={newTitle}
                  onChange={e => setNewTitle(e.target.value)}
                  placeholder="Ej: Cumple de Laura ★ Botellón en Ciudad Universitaria"
                  className="w-full px-3 py-1.5 border border-gray-300 dark:border-[#1d2b40] rounded bg-gray-50 dark:bg-[#0e1726] text-gray-900 dark:text-gray-100"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-gray-700 dark:text-gray-300 block mb-1">
                    Categoría
                  </label>
                  <select
                    value={newCategoria}
                    onChange={e => setNewCategoria(e.target.value as any)}
                    className="w-full px-2 py-1.5 border border-gray-300 dark:border-[#1d2b40] rounded bg-gray-50 dark:bg-[#0e1726] text-gray-900 dark:text-gray-100"
                  >
                    <option value="fiesta">Fiesta nocturna</option>
                    <option value="cumpleanos">Cumpleaños</option>
                    <option value="botellon">Botellón / Quedada</option>
                    <option value="concierto">Concierto / Música</option>
                    <option value="deporte">Deporte / Torneo</option>
                    <option value="quedada">Quedada informal</option>
                    <option value="otro">Otro</option>
                  </select>
                </div>
                <div>
                  <label className="font-bold text-gray-700 dark:text-gray-300 block mb-1">
                    Fecha y Hora *
                  </label>
                  <input
                    type="text"
                    required
                    value={newFechaTexto}
                    onChange={e => setNewFechaTexto(e.target.value)}
                    placeholder="Ej: Este Viernes - 22:30h"
                    className="w-full px-3 py-1.5 border border-gray-300 dark:border-[#1d2b40] rounded bg-gray-50 dark:bg-[#0e1726] text-gray-900 dark:text-gray-100"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-gray-700 dark:text-gray-300 block mb-1">
                    Lugar o Sitio *
                  </label>
                  <input
                    type="text"
                    required
                    value={newLugar}
                    onChange={e => setNewLugar(e.target.value)}
                    placeholder="Ej: Campas de Farmacia / Sala Caracol"
                    className="w-full px-3 py-1.5 border border-gray-300 dark:border-[#1d2b40] rounded bg-gray-50 dark:bg-[#0e1726] text-gray-900 dark:text-gray-100"
                  />
                </div>
                <div>
                  <label className="font-bold text-gray-700 dark:text-gray-300 block mb-1">
                    Ciudad / Provincia
                  </label>
                  <input
                    type="text"
                    value={newCiudad}
                    onChange={e => setNewCiudad(e.target.value)}
                    className="w-full px-3 py-1.5 border border-gray-300 dark:border-[#1d2b40] rounded bg-gray-50 dark:bg-[#0e1726] text-gray-900 dark:text-gray-100"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-gray-700 dark:text-gray-300 block mb-1">
                  Descripción y detalles para los amigos
                </label>
                <textarea
                  rows={3}
                  value={newDesc}
                  onChange={e => setNewDesc(e.target.value)}
                  placeholder="Explica qué se celebra, qué llevar (bebida, disfraces, etc.) o cómo llegar..."
                  className="w-full px-3 py-1.5 border border-gray-300 dark:border-[#1d2b40] rounded bg-gray-50 dark:bg-[#0e1726] text-gray-900 dark:text-gray-100 resize-none"
                />
              </div>

              <div>
                <label className="font-bold text-gray-700 dark:text-gray-300 block mb-1">
                  Foto de portada para el evento
                </label>
                <div className="grid grid-cols-5 gap-1.5 mb-2">
                  {PRESET_COVERS.map(cover => (
                    <div
                      key={cover.url}
                      onClick={() => setNewPortada(cover.url)}
                      className={`h-12 rounded cursor-pointer overflow-hidden border-2 transition-all ${
                        newPortada === cover.url ? 'border-[#3869A0] scale-105' : 'border-transparent opacity-70 hover:opacity-100'
                      }`}
                    >
                      <img src={cover.url} alt={cover.label} className="w-full h-full object-cover" />
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-2 border-t border-gray-200 dark:border-[#1d2b40] flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-3 py-1.5 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 font-semibold rounded cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-[#3869A0] hover:bg-[#2c5282] text-white font-bold rounded cursor-pointer"
                >
                  Publicar evento
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Añadir foto al Álbum Colaborativo */}
      {isAddPhotoModalOpen && currentEvent && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-fade-in">
          <div className="bg-white dark:bg-[#152238] rounded-lg max-w-lg w-full p-5 border border-[#ccd5df] dark:border-[#1d2b40] shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-gray-200 dark:border-gray-700 pb-2">
              <h3 className="font-bold text-sm text-gray-900 dark:text-gray-100 flex items-center gap-2">
                <Camera className="w-4 h-4 text-emerald-600" />
                <span>Añadir foto a "{currentEvent.titulo}"</span>
              </h3>
              <button
                onClick={() => setIsAddPhotoModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form
              onSubmit={e => {
                e.preventDefault();
                if (!newPhotoUrl.trim()) return;
                addEventPhoto(currentEvent.id, {
                  url: newPhotoUrl.trim(),
                  caption: newPhotoCaption.trim()
                });
                setNewPhotoUrl('');
                setNewPhotoCaption('');
                setIsAddPhotoModalOpen(false);
              }}
              className="space-y-3 text-xs"
            >
              <div>
                <label className="font-bold text-gray-700 dark:text-gray-300 block mb-1">
                  Elige una foto de la fiesta o pega una URL
                </label>
                <div className="grid grid-cols-4 gap-2 mb-2">
                  {PARTY_PHOTO_SAMPLES.map(sample => (
                    <div
                      key={sample.url}
                      onClick={() => setNewPhotoUrl(sample.url)}
                      className={`h-16 rounded cursor-pointer overflow-hidden border-2 transition-all relative ${
                        newPhotoUrl === sample.url ? 'border-emerald-600 scale-105 shadow-xs' : 'border-transparent opacity-70 hover:opacity-100'
                      }`}
                      title={sample.label}
                    >
                      <img src={sample.url} alt={sample.label} className="w-full h-full object-cover" />
                      <span className="absolute bottom-0 inset-x-0 bg-black/60 text-white text-[8px] truncate px-1 text-center">
                        {sample.label}
                      </span>
                    </div>
                  ))}
                </div>

                <input
                  type="url"
                  value={newPhotoUrl}
                  onChange={e => setNewPhotoUrl(e.target.value)}
                  placeholder="O pega una URL de imagen (https://...)"
                  className="w-full px-3 py-1.5 border border-gray-300 dark:border-[#1d2b40] rounded bg-gray-50 dark:bg-[#0e1726] text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-1 focus:ring-emerald-600"
                  required
                />
              </div>

              {/* Retro filter toggle */}
              <div className="bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 p-2.5 rounded flex items-start gap-2.5">
                <input
                  type="checkbox"
                  id="retroFilter"
                  checked={applyRetroFilter}
                  onChange={e => setApplyRetroFilter(e.target.checked)}
                  className="mt-0.5 rounded text-amber-600 focus:ring-amber-500 cursor-pointer"
                />
                <label htmlFor="retroFilter" className="cursor-pointer">
                  <span className="font-bold text-amber-900 dark:text-amber-200 block text-xs">
                    📸 Estética "Cámara 2008" con fecha analógica
                  </span>
                  <span className="text-[11px] text-amber-800 dark:text-amber-300 leading-tight block mt-0.5">
                    Añade el sello de fecha clásico en naranja ('08 09 14) y calidez vintage al álbum colaborativo.
                  </span>
                </label>
              </div>

              <div>
                <label className="font-bold text-gray-700 dark:text-gray-300 block mb-1">
                  Pie de foto o recuerdo
                </label>
                <input
                  type="text"
                  value={newPhotoCaption}
                  onChange={e => setNewPhotoCaption(e.target.value)}
                  placeholder="Ej: Con Laura y Dani antes de que cerrara la carpa..."
                  className="w-full px-3 py-1.5 border border-gray-300 dark:border-[#1d2b40] rounded bg-gray-50 dark:bg-[#0e1726] text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-1 focus:ring-emerald-600"
                />
              </div>

              <div className="pt-2 border-t border-gray-200 dark:border-[#1d2b40] flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddPhotoModalOpen(false)}
                  className="px-3 py-1.5 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 font-semibold rounded cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={!newPhotoUrl.trim()}
                  className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold rounded cursor-pointer flex items-center gap-1.5"
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>Publicar en el álbum</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Visualizador en detalle de Foto Colaborativa */}
      {previewingEventPhoto && (
        <div 
          onClick={() => setPreviewingEventPhoto(null)}
          className="fixed inset-0 bg-black/90 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-fade-in"
        >
          <div 
            onClick={e => e.stopPropagation()}
            className="bg-[#111c2e] border border-gray-800 rounded-lg max-w-2xl w-full overflow-hidden shadow-2xl space-y-0"
          >
            <div className="p-3 bg-black/40 flex items-center justify-between border-b border-gray-800 text-white text-xs">
              <div className="flex items-center gap-2">
                <img
                  src={previewingEventPhoto.uploaderAvatar}
                  alt={previewingEventPhoto.uploaderName}
                  className="w-6 h-6 rounded-full object-cover border border-emerald-500"
                />
                <div>
                  <span className="font-bold text-gray-200">{previewingEventPhoto.uploaderName}</span>
                  <span className="text-gray-400 text-[10px] ml-2">{previewingEventPhoto.fecha}</span>
                </div>
              </div>
              <button
                onClick={() => setPreviewingEventPhoto(null)}
                className="text-gray-400 hover:text-white p-1 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="relative bg-black flex items-center justify-center max-h-[70vh]">
              <img
                src={previewingEventPhoto.url}
                alt={previewingEventPhoto.caption || 'Foto del evento'}
                className="max-h-[70vh] w-auto object-contain"
              />
              <div className="absolute bottom-3 right-4 font-mono text-sm font-bold text-[#ff9000] drop-shadow-[0_1px_3px_rgba(0,0,0,0.95)] select-none tracking-widest">
                '08 09 14
              </div>
            </div>

            {previewingEventPhoto.caption && (
              <div className="p-3 bg-[#152238] border-t border-gray-800 text-xs text-gray-200">
                <p className="italic">"{previewingEventPhoto.caption}"</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
