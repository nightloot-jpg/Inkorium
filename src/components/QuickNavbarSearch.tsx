import React, { useState, useRef, useEffect, useMemo } from 'react';
import { useInkorium } from '../context/InkoriumContext';
import { 
  Search, X, User, Users, MessageCircle, Mail, UserPlus, Check, 
  Building2, GraduationCap, Calendar, Flame, Sparkles, MapPin, 
  Heart, ExternalLink, Eye, ChevronRight, Star, ShieldCheck,
  Clock, School, PartyPopper, CheckCircle2, Send
} from 'lucide-react';
import { User as UserType, TuentiPage, CampusCommunity, SocialEvent } from '../types';

type SearchCategory = 'todos' | 'amigos' | 'grupos' | 'campus' | 'eventos';

export const QuickNavbarSearch: React.FC = () => {
  const { 
    currentUser, 
    users, 
    pages, 
    campusCommunities, 
    events,
    isFriend, 
    hasPendingRequest, 
    sendFriendRequest, 
    openChatWith, 
    openComposeMessage, 
    viewUserProfile,
    toggleFollowPage,
    setSelectedPageId,
    joinCampus,
    leaveCampus,
    setSelectedCampusId,
    rsvpEvent,
    setSelectedEventId,
    setActiveTab
  } = useInkorium();

  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [activeCategory, setActiveCategory] = useState<SearchCategory>('todos');
  const [friendsOnlyFilter, setFriendsOnlyFilter] = useState(false);
  
  // Quick peek preview item inside dropdown without changing views
  const [peekItem, setPeekItem] = useState<{
    type: 'user' | 'page' | 'campus' | 'event';
    id: string;
    data: any;
  } | null>(null);

  // Selected index for keyboard navigation
  const [selectedIndex, setSelectedIndex] = useState<number>(-1);
  // Mobile search drawer expansion
  const [isMobileSearchOpen, setIsMobileSearchOpen] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const mobileInputRef = useRef<HTMLInputElement>(null);

  // Keyboard shortcut Ctrl+K or / to focus search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger if user is typing in another input / textarea
      const targetTag = (e.target as HTMLElement)?.tagName?.toLowerCase();
      const isInput = targetTag === 'input' || targetTag === 'textarea' || (e.target as HTMLElement)?.isContentEditable;

      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        inputRef.current?.focus();
        setIsOpen(true);
      } else if (e.key === '/' && !isInput) {
        e.preventDefault();
        inputRef.current?.focus();
        setIsOpen(true);
      } else if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
        setIsMobileSearchOpen(false);
        setPeekItem(null);
        inputRef.current?.blur();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  // Click outside listener
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Filtered users
  const filteredUsers = useMemo(() => {
    if (!query.trim()) return [];
    const q = query.toLowerCase().trim();
    return users.filter(u => {
      if (u.id === currentUser.id) return false;
      const isUserFriend = isFriend(currentUser.id, u.id);
      if (friendsOnlyFilter && !isUserFriend) return false;

      const fullName = `${u.nombre} ${u.apellidos}`.toLowerCase();
      const username = (u.username || '').toLowerCase();
      const ciudad = (u.ciudad || '').toLowerCase();
      const provincia = (u.provincia || '').toLowerCase();
      const estado = (u.estado || '').toLowerCase();
      const intereses = (u.intereses || '').toLowerCase();

      return (
        fullName.includes(q) ||
        username.includes(q) ||
        ciudad.includes(q) ||
        provincia.includes(q) ||
        estado.includes(q) ||
        intereses.includes(q)
      );
    });
  }, [users, query, currentUser.id, isFriend, friendsOnlyFilter]);

  // Filtered pages / groups
  const filteredPages = useMemo(() => {
    if (!query.trim()) return [];
    const q = query.toLowerCase().trim();
    return pages.filter(p => {
      const nombre = p.nombre.toLowerCase();
      const desc = p.descripcion.toLowerCase();
      const cat = p.categoria.toLowerCase();
      const ubicacion = (p.ubicacion || '').toLowerCase();

      return nombre.includes(q) || desc.includes(q) || cat.includes(q) || ubicacion.includes(q);
    });
  }, [pages, query]);

  // Filtered campus communities
  const filteredCampus = useMemo(() => {
    if (!query.trim()) return [];
    const q = query.toLowerCase().trim();
    return campusCommunities.filter(c => {
      const nombre = c.nombre.toLowerCase();
      const siglas = (c.siglas || '').toLowerCase();
      const ciudad = c.ciudad.toLowerCase();
      const desc = c.descripcion.toLowerCase();
      const tipo = c.tipo.toLowerCase();

      return nombre.includes(q) || siglas.includes(q) || ciudad.includes(q) || desc.includes(q) || tipo.includes(q);
    });
  }, [campusCommunities, query]);

  // Filtered events
  const filteredEvents = useMemo(() => {
    if (!query.trim()) return [];
    const q = query.toLowerCase().trim();
    return events.filter(e => {
      const titulo = e.titulo.toLowerCase();
      const desc = e.descripcion.toLowerCase();
      const lugar = e.lugar.toLowerCase();
      const ciudad = (e.ciudad || '').toLowerCase();
      const cat = e.categoria.toLowerCase();

      return titulo.includes(q) || desc.includes(q) || lugar.includes(q) || ciudad.includes(q) || cat.includes(q);
    });
  }, [events, query]);

  const totalResultsCount = filteredUsers.length + filteredPages.length + filteredCampus.length + filteredEvents.length;

  const handleClear = () => {
    setQuery('');
    setPeekItem(null);
    setSelectedIndex(-1);
    inputRef.current?.focus();
  };

  const handleSelectUser = (u: UserType, action: 'profile' | 'chat' | 'message' | 'friend') => {
    if (action === 'profile') {
      viewUserProfile(u.id);
      setIsOpen(false);
      setIsMobileSearchOpen(false);
    } else if (action === 'chat') {
      openChatWith(u.id);
      // Notice: Do not change view or close completely if user wants to keep searching, or close smoothly
      setIsOpen(false);
      setIsMobileSearchOpen(false);
    } else if (action === 'message') {
      openComposeMessage(u.id);
      setIsOpen(false);
      setIsMobileSearchOpen(false);
    } else if (action === 'friend') {
      sendFriendRequest(u.id);
    }
  };

  const handleSelectPage = (page: TuentiPage, action: 'view' | 'toggleFollow') => {
    if (action === 'toggleFollow') {
      toggleFollowPage(page.id);
    } else {
      setSelectedPageId(page.id);
      setActiveTab('paginas');
      setIsOpen(false);
      setIsMobileSearchOpen(false);
    }
  };

  const handleSelectCampus = (campus: CampusCommunity, action: 'view' | 'toggleJoin') => {
    if (action === 'toggleJoin') {
      if (campus.miembros.includes(currentUser.id)) {
        leaveCampus(campus.id);
      } else {
        joinCampus(campus.id);
      }
    } else {
      setSelectedCampusId(campus.id);
      setActiveTab('campus');
      setIsOpen(false);
      setIsMobileSearchOpen(false);
    }
  };

  const handleSelectEvent = (event: SocialEvent, action: 'view' | 'rsvp') => {
    if (action === 'rsvp') {
      rsvpEvent(event.id, 'asistire');
    } else {
      setSelectedEventId(event.id);
      setActiveTab('eventos');
      setIsOpen(false);
      setIsMobileSearchOpen(false);
    }
  };

  // Helper to highlight matching query text
  const highlightMatch = (text: string, highlight: string) => {
    if (!highlight.trim() || !text) return text;
    const regex = new RegExp(`(${highlight.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
    const parts = text.split(regex);
    return parts.map((part, i) => 
      regex.test(part) ? (
        <span key={i} className="bg-amber-200 text-blue-950 font-bold px-0.5 rounded">
          {part}
        </span>
      ) : (
        part
      )
    );
  };

  return (
    <div className="relative" ref={containerRef}>
      {/* Desktop Search Bar */}
      <div className="hidden sm:flex items-center relative w-[220px] md:w-[260px] lg:w-[320px] 2xl:w-[360px]">
        <div className="relative w-full">
          <input
            ref={inputRef}
            type="text"
            id="quick-navbar-search-input"
            placeholder="Buscar amigos o grupos..."
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              if (!isOpen) setIsOpen(true);
            }}
            onFocus={() => {
              setIsOpen(true);
            }}
            className="w-full bg-[#274d77] placeholder-blue-200 text-white text-xs px-3 py-1.5 pl-8 pr-16 rounded border border-[#1f3f63] focus:outline-none focus:ring-2 focus:ring-blue-300 focus:bg-[#1e3c60] transition shadow-inner"
          />
          <Search className="w-3.5 h-3.5 text-blue-200 absolute left-2.5 top-2 pointer-events-none" />
          
          <div className="absolute right-2 top-1.5 flex items-center gap-1">
            {query ? (
              <button
                onClick={handleClear}
                className="p-0.5 rounded-full hover:bg-white/20 text-blue-200 hover:text-white transition cursor-pointer"
                title="Limpiar búsqueda"
              >
                <X className="w-3 h-3" />
              </button>
            ) : (
              <kbd className="hidden lg:inline-block text-[10px] font-sans font-medium text-blue-300 bg-[#1e3b5e] border border-blue-400/30 px-1 py-0.2 rounded shadow-xs select-none">
                Ctrl K
              </kbd>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Search Button in Header */}
      <button
        onClick={() => {
          setIsMobileSearchOpen(!isMobileSearchOpen);
          setIsOpen(!isMobileSearchOpen);
          setTimeout(() => mobileInputRef.current?.focus(), 50);
        }}
        className="sm:hidden p-1.5 rounded hover:bg-[#2f5988] text-blue-100 hover:text-white transition cursor-pointer flex items-center justify-center"
        title="Buscar amigos o grupos"
        id="quick-search-mobile-toggle-btn"
      >
        <Search className="w-4 h-4" />
      </button>

      {/* Mobile Expandable Search Bar Overlay */}
      {isMobileSearchOpen && (
        <div className="sm:hidden fixed top-[48px] left-0 right-0 bg-[#3869A0] p-2.5 border-b border-[#2b5380] shadow-lg z-50 flex items-center gap-2">
          <div className="relative flex-1">
            <input
              ref={mobileInputRef}
              type="text"
              placeholder="Buscar amigos, grupos, campus..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full bg-[#1e3c60] text-white placeholder-blue-200 text-xs px-3 py-2 pl-8 pr-8 rounded border border-blue-400/40 focus:outline-none focus:ring-1 focus:ring-white"
            />
            <Search className="w-3.5 h-3.5 text-blue-200 absolute left-2.5 top-2.5" />
            {query && (
              <button
                onClick={handleClear}
                className="absolute right-2.5 top-2.5 text-blue-200 hover:text-white"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
          <button
            onClick={() => {
              setIsMobileSearchOpen(false);
              setIsOpen(false);
            }}
            className="text-xs font-semibold text-white px-2 py-1.5 bg-[#274d77] rounded hover:bg-[#1f3f63]"
          >
            Cerrar
          </button>
        </div>
      )}

      {/* Instant Floating Quick Search Popover */}
      {isOpen && (
        <div 
          className={`absolute left-0 sm:left-auto sm:right-0 mt-1.5 w-[92vw] sm:w-[460px] md:w-[540px] lg:w-[620px] max-w-[620px] bg-white text-gray-800 rounded-xl shadow-2xl border border-gray-200 z-50 overflow-hidden flex flex-col max-h-[85vh] sm:max-h-[580px] ${
            isMobileSearchOpen ? 'top-[96px] fixed left-3 right-3 sm:static' : ''
          }`}
          id="quick-navbar-search-popover"
        >
          {/* Top category tabs & filters */}
          <div className="bg-[#f2f6fa] border-b border-gray-200 p-2 sm:px-3">
            <div className="flex items-center justify-between gap-1 overflow-x-auto pb-1 scrollbar-none text-[11px] font-semibold">
              <div className="flex items-center gap-1">
                <button
                  onClick={() => { setActiveCategory('todos'); setPeekItem(null); }}
                  className={`px-2.5 py-1 rounded-full transition flex items-center gap-1 cursor-pointer ${
                    activeCategory === 'todos'
                      ? 'bg-[#3869A0] text-white shadow-xs'
                      : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
                  }`}
                >
                  <Sparkles className="w-3 h-3" />
                  <span>Todos</span>
                  {query && <span className="text-[10px] opacity-80">({totalResultsCount})</span>}
                </button>

                <button
                  onClick={() => { setActiveCategory('amigos'); setPeekItem(null); }}
                  className={`px-2.5 py-1 rounded-full transition flex items-center gap-1 cursor-pointer ${
                    activeCategory === 'amigos'
                      ? 'bg-[#3869A0] text-white shadow-xs'
                      : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
                  }`}
                >
                  <Users className="w-3 h-3" />
                  <span>Gente & Amigos</span>
                  {query && <span className="text-[10px] opacity-80">({filteredUsers.length})</span>}
                </button>

                <button
                  onClick={() => { setActiveCategory('grupos'); setPeekItem(null); }}
                  className={`px-2.5 py-1 rounded-full transition flex items-center gap-1 cursor-pointer ${
                    activeCategory === 'grupos'
                      ? 'bg-[#3869A0] text-white shadow-xs'
                      : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
                  }`}
                >
                  <Building2 className="w-3 h-3" />
                  <span>Páginas & Grupos</span>
                  {query && <span className="text-[10px] opacity-80">({filteredPages.length})</span>}
                </button>

                <button
                  onClick={() => { setActiveCategory('campus'); setPeekItem(null); }}
                  className={`px-2.5 py-1 rounded-full transition flex items-center gap-1 cursor-pointer ${
                    activeCategory === 'campus'
                      ? 'bg-[#3869A0] text-white shadow-xs'
                      : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
                  }`}
                >
                  <GraduationCap className="w-3 h-3" />
                  <span>Campus</span>
                  {query && <span className="text-[10px] opacity-80">({filteredCampus.length})</span>}
                </button>
              </div>

              {/* Close popover button */}
              <button
                onClick={() => {
                  setIsOpen(false);
                  setIsMobileSearchOpen(false);
                }}
                className="p-1 text-gray-400 hover:text-gray-700 hover:bg-gray-200 rounded cursor-pointer hidden sm:block"
                title="Cerrar búsqueda rápida"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Sub-filter if in Amigos tab */}
            {activeCategory === 'amigos' && (
              <div className="mt-1.5 pt-1.5 border-t border-gray-200 flex items-center justify-between text-[11px]">
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => setFriendsOnlyFilter(false)}
                    className={`px-2 py-0.5 rounded cursor-pointer ${
                      !friendsOnlyFilter ? 'bg-blue-100 text-[#3869A0] font-bold' : 'text-gray-500 hover:text-gray-800'
                    }`}
                  >
                    Toda la comunidad ({users.length - 1})
                  </button>
                  <span className="text-gray-300">•</span>
                  <button
                    onClick={() => setFriendsOnlyFilter(true)}
                    className={`px-2 py-0.5 rounded cursor-pointer flex items-center gap-1 ${
                      friendsOnlyFilter ? 'bg-blue-100 text-[#3869A0] font-bold' : 'text-gray-500 hover:text-gray-800'
                    }`}
                  >
                    <Star className="w-3 h-3 text-amber-500" />
                    <span>Solo mis amigos</span>
                  </button>
                </div>
                <span className="text-[10px] text-gray-400 italic">Acciones directas sin salir de la vista</span>
              </div>
            )}
          </div>

          {/* Results Area */}
          <div className="flex-1 overflow-y-auto divide-y divide-gray-100 min-h-[160px] max-h-[420px]">
            {!query.trim() ? (
              <div className="p-6 text-center text-gray-500 space-y-3">
                <div className="w-12 h-12 rounded-full bg-blue-50 text-[#3869A0] flex items-center justify-center mx-auto shadow-inner">
                  <Search className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-xs font-bold text-gray-700">Búsqueda rápida en tiempo real</p>
                  <p className="text-[11px] text-gray-400 max-w-[320px] mx-auto mt-0.5">
                    Escribe el nombre de un amigo, @usuario, grupo de ocio o campus para chatear o interactuar directamente.
                  </p>
                </div>

                {/* Quick suggestions shortcuts */}
                <div className="pt-2 border-t border-gray-100 text-left">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-2">Sugerencias rápidas:</p>
                  <div className="flex flex-wrap gap-1.5">
                    {users.slice(0, 3).filter(u => u.id !== currentUser.id).map(u => (
                      <button
                        key={u.id}
                        onClick={() => {
                          setQuery(u.nombre);
                        }}
                        className="text-[11px] bg-gray-50 hover:bg-blue-50 text-gray-700 hover:text-[#3869A0] border border-gray-200 px-2 py-1 rounded flex items-center gap-1.5 transition cursor-pointer"
                      >
                        <img src={u.avatar} alt="" className="w-4 h-4 rounded object-cover" />
                        <span>{u.nombre} {u.apellidos}</span>
                      </button>
                    ))}
                    {pages.slice(0, 2).map(p => (
                      <button
                        key={p.id}
                        onClick={() => {
                          setQuery(p.nombre);
                        }}
                        className="text-[11px] bg-gray-50 hover:bg-blue-50 text-gray-700 hover:text-[#3869A0] border border-gray-200 px-2 py-1 rounded flex items-center gap-1.5 transition cursor-pointer"
                      >
                        <Building2 className="w-3.5 h-3.5 text-amber-600" />
                        <span>{p.nombre}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            ) : totalResultsCount === 0 ? (
              <div className="p-8 text-center text-gray-400">
                <Search className="w-8 h-8 mx-auto mb-2 text-gray-300 opacity-60" />
                <p className="font-semibold text-gray-600 text-xs">No se encontraron resultados para "{query}"</p>
                <p className="text-[11px] text-gray-400 mt-1">Prueba con otro nombre, provincia o temática.</p>
              </div>
            ) : (
              <div className="p-1 space-y-2">
                {/* 1. SECCIÓN AMIGOS & USUARIOS */}
                {(activeCategory === 'todos' || activeCategory === 'amigos') && filteredUsers.length > 0 && (
                  <div>
                    <div className="px-3 py-1 flex items-center justify-between text-[10px] font-bold text-gray-400 uppercase tracking-wider bg-gray-50/70 rounded">
                      <span className="flex items-center gap-1 text-[#3869A0]">
                        <Users className="w-3 h-3" />
                        <span>Gente ({filteredUsers.length})</span>
                      </span>
                      <span className="text-[9px] text-gray-400 font-normal lowercase">chatea o firma directamente</span>
                    </div>

                    <div className="divide-y divide-gray-50 mt-1">
                      {filteredUsers.slice(0, activeCategory === 'todos' ? 4 : 20).map(u => {
                        const isUserFriend = isFriend(currentUser.id, u.id);
                        const isPending = hasPendingRequest(currentUser.id, u.id) || hasPendingRequest(u.id, currentUser.id);

                        return (
                          <div
                            key={u.id}
                            className="p-2 sm:p-2.5 rounded-lg hover:bg-blue-50/60 transition group flex items-start gap-2.5"
                          >
                            {/* Avatar with online presence badge */}
                            <div 
                              className="relative cursor-pointer flex-shrink-0"
                              onClick={() => handleSelectUser(u, 'profile')}
                              title={`Ver perfil de ${u.nombre}`}
                            >
                              <img 
                                src={u.avatar} 
                                alt={u.nombre} 
                                className="w-10 h-10 rounded-md object-cover border border-gray-300 shadow-xs" 
                              />
                              <span 
                                className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-white ${
                                  u.online ? 'bg-emerald-500' : 'bg-gray-400'
                                }`} 
                                title={u.online ? '🟢 Conectado' : '⚪ Desconectado'}
                              />
                            </div>

                            {/* User details */}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <button
                                  onClick={() => handleSelectUser(u, 'profile')}
                                  className="text-xs font-bold text-[#3869A0] hover:underline truncate cursor-pointer text-left"
                                >
                                  {highlightMatch(`${u.nombre} ${u.apellidos}`, query)}
                                </button>

                                {isUserFriend && (
                                  <span className="inline-flex items-center gap-0.5 px-1.5 py-0.2 bg-amber-50 text-amber-800 border border-amber-300 text-[9px] font-bold rounded-full">
                                    <Star className="w-2.5 h-2.5 text-amber-500 fill-amber-500" />
                                    <span>Amigo</span>
                                  </span>
                                )}

                                {isPending && !isUserFriend && (
                                  <span className="inline-flex items-center gap-0.5 px-1.5 py-0.2 bg-blue-50 text-blue-700 border border-blue-200 text-[9px] font-semibold rounded-full">
                                    <Clock className="w-2.5 h-2.5 text-blue-500" />
                                    <span>Petición enviada</span>
                                  </span>
                                )}
                              </div>

                              <div className="text-[11px] text-gray-500 flex items-center gap-2 mt-0.5 truncate">
                                <span>{u.provincia || 'España'}</span>
                                {u.ciudad && <span>• {u.ciudad}</span>}
                                {u.username && <span className="text-gray-400">@{u.username}</span>}
                              </div>

                              {u.estado && (
                                <p className="text-[11px] text-gray-600 italic truncate mt-0.5 bg-gray-50/80 px-1.5 py-0.5 rounded border border-gray-100">
                                  "{highlightMatch(u.estado, query)}"
                                </p>
                              )}
                            </div>

                            {/* Direct in-place action buttons (WITHOUT changing view) */}
                            <div className="flex items-center gap-1 flex-shrink-0 self-center">
                              {/* 1. Chat instantáneo flotante */}
                              <button
                                onClick={() => handleSelectUser(u, 'chat')}
                                className="px-2 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-[10px] font-bold flex items-center gap-1 transition shadow-xs cursor-pointer"
                                title="Abrir ventana de chat directo sin cambiar de vista"
                              >
                                <MessageCircle className="w-3 h-3" />
                                <span className="hidden sm:inline">Chat</span>
                              </button>

                              {/* 2. Enviar Mensaje Privado */}
                              <button
                                onClick={() => handleSelectUser(u, 'message')}
                                className="p-1.5 bg-[#3869A0] hover:bg-[#2e5785] text-white rounded text-[10px] font-medium flex items-center gap-1 transition shadow-xs cursor-pointer"
                                title="Enviar mensaje privado"
                              >
                                <Mail className="w-3 h-3" />
                              </button>

                              {/* 3. Añadir amigo si no lo es */}
                              {!isUserFriend && !isPending && (
                                <button
                                  onClick={() => handleSelectUser(u, 'friend')}
                                  className="p-1.5 bg-gray-100 hover:bg-blue-100 text-gray-700 hover:text-[#3869A0] border border-gray-200 rounded text-[10px] font-medium flex items-center gap-1 transition cursor-pointer"
                                  title="Enviar petición de amistad directamente"
                                >
                                  <UserPlus className="w-3 h-3 text-[#3869A0]" />
                                </button>
                              )}

                              {/* 4. Ver perfil completo */}
                              <button
                                onClick={() => handleSelectUser(u, 'profile')}
                                className="p-1.5 text-gray-400 hover:text-[#3869A0] hover:bg-blue-50 rounded transition cursor-pointer"
                                title="Ir al perfil completo"
                              >
                                <ExternalLink className="w-3 h-3" />
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* 2. SECCIÓN PÁGINAS Y SITIOS DE TUENTI */}
                {(activeCategory === 'todos' || activeCategory === 'grupos') && filteredPages.length > 0 && (
                  <div className="pt-1">
                    <div className="px-3 py-1 flex items-center justify-between text-[10px] font-bold text-gray-400 uppercase tracking-wider bg-gray-50/70 rounded">
                      <span className="flex items-center gap-1 text-amber-700">
                        <Building2 className="w-3 h-3" />
                        <span>Páginas & Sitios ({filteredPages.length})</span>
                      </span>
                      <span className="text-[9px] text-gray-400 font-normal lowercase">hazte fan con 1 clic</span>
                    </div>

                    <div className="divide-y divide-gray-50 mt-1">
                      {filteredPages.slice(0, activeCategory === 'todos' ? 3 : 15).map(page => {
                        const isFan = page.seguidores.includes(currentUser.id);

                        return (
                          <div
                            key={page.id}
                            className="p-2 sm:p-2.5 rounded-lg hover:bg-amber-50/40 transition group flex items-start gap-2.5"
                          >
                            <img 
                              src={page.avatar} 
                              alt={page.nombre} 
                              className="w-10 h-10 rounded-md object-cover border border-amber-200 shadow-xs flex-shrink-0 cursor-pointer"
                              onClick={() => handleSelectPage(page, 'view')}
                            />

                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <button
                                  onClick={() => handleSelectPage(page, 'view')}
                                  className="text-xs font-bold text-gray-900 hover:text-[#3869A0] hover:underline truncate cursor-pointer text-left"
                                >
                                  {highlightMatch(page.nombre, query)}
                                </button>
                                <span className="text-[9px] font-bold px-1.5 py-0.2 bg-amber-100 text-amber-900 rounded uppercase">
                                  {page.categoria}
                                </span>
                              </div>

                              <p className="text-[11px] text-gray-500 truncate mt-0.5">
                                {highlightMatch(page.descripcion, query)}
                              </p>

                              <div className="text-[10px] text-gray-400 mt-0.5 flex items-center gap-2">
                                <span>👥 {page.seguidores.length} fans</span>
                                {page.ubicacion && <span>• 📍 {page.ubicacion}</span>}
                              </div>
                            </div>

                            {/* In-place Actions */}
                            <div className="flex items-center gap-1 flex-shrink-0 self-center">
                              {/* Hacerme Fan / Siguiendo toggle directly */}
                              <button
                                onClick={() => handleSelectPage(page, 'toggleFollow')}
                                className={`px-2 py-1 rounded text-[10px] font-bold flex items-center gap-1 transition shadow-xs cursor-pointer ${
                                  isFan 
                                    ? 'bg-amber-500 text-white hover:bg-amber-600' 
                                    : 'bg-white border border-amber-400 text-amber-800 hover:bg-amber-50'
                                }`}
                                title={isFan ? 'Dejar de seguir esta página' : 'Hacerte fan directamente'}
                              >
                                <Star className={`w-3 h-3 ${isFan ? 'fill-white' : 'text-amber-600'}`} />
                                <span>{isFan ? 'Fan ✓' : 'Hacerme fan'}</span>
                              </button>

                              {/* Ver página */}
                              <button
                                onClick={() => handleSelectPage(page, 'view')}
                                className="p-1.5 text-gray-400 hover:text-[#3869A0] hover:bg-blue-50 rounded transition cursor-pointer"
                                title="Ver página completa"
                              >
                                <ExternalLink className="w-3 h-3" />
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* 3. SECCIÓN CAMPUS & INSTITUTOS */}
                {(activeCategory === 'todos' || activeCategory === 'campus') && filteredCampus.length > 0 && (
                  <div className="pt-1">
                    <div className="px-3 py-1 flex items-center justify-between text-[10px] font-bold text-gray-400 uppercase tracking-wider bg-gray-50/70 rounded">
                      <span className="flex items-center gap-1 text-emerald-700">
                        <GraduationCap className="w-3 h-3" />
                        <span>Campus & Comunidades ({filteredCampus.length})</span>
                      </span>
                      <span className="text-[9px] text-gray-400 font-normal lowercase">unirse con 1 clic</span>
                    </div>

                    <div className="divide-y divide-gray-50 mt-1">
                      {filteredCampus.slice(0, activeCategory === 'todos' ? 3 : 15).map(campus => {
                        const isMember = campus.miembros.includes(currentUser.id);

                        return (
                          <div
                            key={campus.id}
                            className="p-2 sm:p-2.5 rounded-lg hover:bg-emerald-50/40 transition group flex items-start gap-2.5"
                          >
                            <img 
                              src={campus.avatar} 
                              alt={campus.nombre} 
                              className="w-10 h-10 rounded-md object-cover border border-emerald-200 shadow-xs flex-shrink-0 cursor-pointer"
                              onClick={() => handleSelectCampus(campus, 'view')}
                            />

                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <button
                                  onClick={() => handleSelectCampus(campus, 'view')}
                                  className="text-xs font-bold text-gray-900 hover:text-emerald-700 hover:underline truncate cursor-pointer text-left"
                                >
                                  {highlightMatch(campus.nombre, query)}
                                </button>
                                {campus.siglas && (
                                  <span className="text-[9px] font-black px-1.5 py-0.2 bg-emerald-100 text-emerald-800 rounded">
                                    {campus.siglas}
                                  </span>
                                )}
                              </div>

                              <p className="text-[11px] text-gray-500 truncate mt-0.5">
                                {highlightMatch(campus.descripcion, query)}
                              </p>

                              <div className="text-[10px] text-gray-400 mt-0.5 flex items-center gap-2">
                                <span>📍 {campus.ciudad}</span>
                                <span>• 👥 {campus.miembros.length} estudiantes/vecinos</span>
                              </div>
                            </div>

                            {/* In-place Actions */}
                            <div className="flex items-center gap-1 flex-shrink-0 self-center">
                              {/* Unirme / Miembro toggle directly */}
                              <button
                                onClick={() => handleSelectCampus(campus, 'toggleJoin')}
                                className={`px-2 py-1 rounded text-[10px] font-bold flex items-center gap-1 transition shadow-xs cursor-pointer ${
                                  isMember 
                                    ? 'bg-emerald-600 text-white hover:bg-emerald-700' 
                                    : 'bg-white border border-emerald-500 text-emerald-800 hover:bg-emerald-50'
                                }`}
                                title={isMember ? 'Salir del campus' : 'Unirte directamente al campus'}
                              >
                                <Check className={`w-3 h-3 ${isMember ? 'text-white' : 'text-emerald-600'}`} />
                                <span>{isMember ? 'Miembro ✓' : 'Unirme'}</span>
                              </button>

                              {/* Ver campus */}
                              <button
                                onClick={() => handleSelectCampus(campus, 'view')}
                                className="p-1.5 text-gray-400 hover:text-emerald-700 hover:bg-emerald-50 rounded transition cursor-pointer"
                                title="Ver campus y apuntes"
                              >
                                <ExternalLink className="w-3 h-3" />
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* 4. SECCIÓN EVENTOS Y QUEDADAS */}
                {(activeCategory === 'todos' || activeCategory === 'eventos') && filteredEvents.length > 0 && (
                  <div className="pt-1">
                    <div className="px-3 py-1 flex items-center justify-between text-[10px] font-bold text-gray-400 uppercase tracking-wider bg-gray-50/70 rounded">
                      <span className="flex items-center gap-1 text-purple-700">
                        <Calendar className="w-3 h-3" />
                        <span>Eventos & Quedadas ({filteredEvents.length})</span>
                      </span>
                      <span className="text-[9px] text-gray-400 font-normal lowercase">asistir directamente</span>
                    </div>

                    <div className="divide-y divide-gray-50 mt-1">
                      {filteredEvents.slice(0, activeCategory === 'todos' ? 2 : 10).map(event => {
                        const isAttending = event.asistentes.some(a => a.userId === currentUser.id && a.estado === 'asistire');

                        return (
                          <div
                            key={event.id}
                            className="p-2 sm:p-2.5 rounded-lg hover:bg-purple-50/40 transition group flex items-start gap-2.5"
                          >
                            <div className="w-10 h-10 rounded-md bg-purple-100 border border-purple-200 flex flex-col items-center justify-center text-purple-800 flex-shrink-0">
                              <Calendar className="w-4 h-4" />
                            </div>

                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <button
                                  onClick={() => handleSelectEvent(event, 'view')}
                                  className="text-xs font-bold text-gray-900 hover:text-purple-700 hover:underline truncate cursor-pointer text-left"
                                >
                                  {highlightMatch(event.titulo, query)}
                                </button>
                                <span className="text-[9px] font-bold px-1.5 py-0.2 bg-purple-100 text-purple-800 rounded capitalize">
                                  {event.categoria}
                                </span>
                              </div>

                              <p className="text-[11px] text-gray-500 truncate mt-0.5">
                                📍 {event.lugar} • 📅 {event.fechaTexto}
                              </p>

                              <div className="text-[10px] text-gray-400 mt-0.5 flex items-center gap-2">
                                <span>👥 {event.asistentes.length} confirmados</span>
                              </div>
                            </div>

                            {/* In-place Actions */}
                            <div className="flex items-center gap-1 flex-shrink-0 self-center">
                              <button
                                onClick={() => handleSelectEvent(event, 'rsvp')}
                                className={`px-2 py-1 rounded text-[10px] font-bold flex items-center gap-1 transition shadow-xs cursor-pointer ${
                                  isAttending
                                    ? 'bg-purple-600 text-white hover:bg-purple-700'
                                    : 'bg-white border border-purple-400 text-purple-800 hover:bg-purple-50'
                                }`}
                                title={isAttending ? 'Ya has confirmado asistencia' : 'Confirmar asistencia directa'}
                              >
                                <Check className="w-3 h-3" />
                                <span>{isAttending ? 'Asistiré ✓' : 'Asistiré'}</span>
                              </button>

                              <button
                                onClick={() => handleSelectEvent(event, 'view')}
                                className="p-1.5 text-gray-400 hover:text-purple-700 hover:bg-purple-50 rounded transition cursor-pointer"
                                title="Ver detalles del evento"
                              >
                                <ExternalLink className="w-3 h-3" />
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Bottom Footer Info Bar */}
          <div className="bg-[#f0f4f8] px-3 py-2 border-t border-gray-200 flex items-center justify-between text-[11px] text-gray-500">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-gray-700">Inkorium Quick Finder</span>
              <span className="text-gray-300">•</span>
              <span className="text-[10px] text-gray-500">Chat instantáneo, grupos y campus sin salir de tu pantalla actual</span>
            </div>
            <button
              onClick={() => {
                setActiveTab('gente');
                setIsOpen(false);
                setIsMobileSearchOpen(false);
              }}
              className="text-[#3869A0] font-bold hover:underline cursor-pointer text-[11px]"
            >
              Búsqueda avanzada →
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
