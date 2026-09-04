import React, { useState, useMemo } from 'react';
import { useInkorium } from '../context/InkoriumContext';
import { 
  GraduationCap, School, MapPin, Users, Plus, MessageSquare, 
  Search, BookOpen, PartyPopper, HelpCircle, Heart, Send, 
  Check, ChevronRight, X, ArrowLeft, Building2, UserPlus
} from 'lucide-react';
import { CampusCommunity, CampusPost } from '../types';

const CATEGORY_BADGES: Record<CampusCommunity['tipo'], { label: string; icon: React.ReactNode; color: string }> = {
  universidad: { label: 'Universidad', icon: <GraduationCap className="w-3.5 h-3.5" />, color: 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300' },
  instituto: { label: 'Instituto / Colegio', icon: <School className="w-3.5 h-3.5" />, color: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300' },
  barrio: { label: 'Barrio / Zona Local', icon: <MapPin className="w-3.5 h-3.5" />, color: 'bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-300' }
};

const POST_TYPE_TAGS: Record<CampusPost['tipo'], { label: string; badge: string }> = {
  apuntes: { label: '📝 Apuntes', badge: 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300' },
  fiesta: { label: '🎉 Fiesta', badge: 'bg-pink-100 text-pink-800 dark:bg-pink-900/40 dark:text-pink-300' },
  quedada: { label: '🤝 Quedada', badge: 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900/40 dark:text-cyan-300' },
  duda: { label: '❓ Duda / Ayuda', badge: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/40 dark:text-indigo-300' },
  general: { label: '📢 General', badge: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300' }
};

export const CampusView: React.FC = () => {
  const { 
    campusCommunities, 
    currentUser, 
    users, 
    joinCampus, 
    leaveCampus, 
    postToCampus, 
    replyToCampusPost, 
    createCampus,
    viewUserProfile,
    sendFriendRequest,
    isFriend,
    hasPendingRequest,
    selectedCampusId,
    setSelectedCampusId
  } = useInkorium();

  const [activeCategory, setActiveCategory] = useState<'todos' | 'universidad' | 'instituto' | 'barrio'>('todos');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCommunityDetail, setActiveCommunityDetail] = useState<CampusCommunity | null>(() => {
    if (selectedCampusId) {
      return campusCommunities.find(c => c.id === selectedCampusId) || null;
    }
    return null;
  });

  // Post form state inside community
  const [postType, setPostType] = useState<CampusPost['tipo']>('general');
  const [postTitle, setPostTitle] = useState('');
  const [postText, setPostText] = useState('');
  const [replyInputs, setReplyInputs] = useState<Record<string, string>>({});
  const [isPublishing, setIsPublishing] = useState(false);

  // New Campus modal state
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newCampusNombre, setNewCampusNombre] = useState('');
  const [newCampusSiglas, setNewCampusSiglas] = useState('');
  const [newCampusTipo, setNewCampusTipo] = useState<CampusCommunity['tipo']>('universidad');
  const [newCampusCiudad, setNewCampusCiudad] = useState(currentUser.provincia || 'Madrid');
  const [newCampusDesc, setNewCampusDesc] = useState('');

  // Synchronize when external selectedCampusId changes
  React.useEffect(() => {
    if (selectedCampusId) {
      const found = campusCommunities.find(c => c.id === selectedCampusId);
      if (found) setActiveCommunityDetail(found);
    }
  }, [selectedCampusId, campusCommunities]);

  // Filtered communities
  const filteredCommunities = useMemo(() => {
    return campusCommunities.filter(c => {
      const matchesCategory = activeCategory === 'todos' || c.tipo === activeCategory;
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch = !q || 
        c.nombre.toLowerCase().includes(q) || 
        c.ciudad.toLowerCase().includes(q) || 
        (c.siglas && c.siglas.toLowerCase().includes(q)) ||
        c.descripcion.toLowerCase().includes(q);
      return matchesCategory && matchesSearch;
    });
  }, [campusCommunities, activeCategory, searchQuery]);

  // Current community in detail view
  const currentCommunity = useMemo(() => {
    if (!activeCommunityDetail) return null;
    return campusCommunities.find(c => c.id === activeCommunityDetail.id) || activeCommunityDetail;
  }, [campusCommunities, activeCommunityDetail]);

  const isCurrentMember = currentCommunity ? currentCommunity.miembros.includes(currentUser.id) : false;

  const handlePostSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentCommunity || !postText.trim()) return;
    setIsPublishing(true);
    postToCampus(currentCommunity.id, postType, postText, postTitle || undefined);
    setPostText('');
    setPostTitle('');
    setIsPublishing(false);
  };

  const handleReplySubmit = (postId: string) => {
    const text = replyInputs[postId];
    if (!currentCommunity || !text || !text.trim()) return;
    replyToCampusPost(currentCommunity.id, postId, text);
    setReplyInputs(prev => ({ ...prev, [postId]: '' }));
  };

  const handleCreateCampusSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCampusNombre.trim() || !newCampusCiudad.trim()) return;
    const defaultCovers: Record<CampusCommunity['tipo'], string> = {
      universidad: 'https://images.unsplash.com/photo-1541339907198-e08756dedf3f?w=1200&auto=format&fit=crop&q=80',
      instituto: 'https://images.unsplash.com/photo-1580582932707-520aed937b7b?w=1200&auto=format&fit=crop&q=80',
      barrio: 'https://images.unsplash.com/photo-1514933651103-005eec06c04b?w=1200&auto=format&fit=crop&q=80'
    };
    const newId = createCampus({
      nombre: newCampusNombre.trim(),
      siglas: newCampusSiglas.trim() || undefined,
      tipo: newCampusTipo,
      ciudad: newCampusCiudad.trim(),
      descripcion: newCampusDesc.trim() || `Comunidad de ${newCampusNombre.trim()} en ${newCampusCiudad.trim()}.`,
      avatar: defaultCovers[newCampusTipo],
      portada: defaultCovers[newCampusTipo]
    });
    setIsCreateModalOpen(false);
    setNewCampusNombre('');
    setNewCampusSiglas('');
    setNewCampusDesc('');
    const created = campusCommunities.find(c => c.id === newId);
    if (created) setActiveCommunityDetail(created);
  };

  return (
    <div className="w-full max-w-[1720px] 2xl:max-w-[1850px] mx-auto px-3 sm:px-6 lg:px-8 py-4">
      {/* If a community is selected, show its full dedicated space */}
      {currentCommunity ? (
        <div className="space-y-4">
          {/* Back button & Breadcrumbs */}
          <div className="flex items-center justify-between">
            <button
              onClick={() => {
                setActiveCommunityDetail(null);
                setSelectedCampusId(null);
              }}
              className="flex items-center gap-1.5 text-xs font-semibold text-[#3869A0] hover:underline cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Volver al directorio de Campus y Barrios</span>
            </button>
            <span className="text-xs text-gray-500 font-medium">
              {CATEGORY_BADGES[currentCommunity.tipo].label} en {currentCommunity.ciudad}
            </span>
          </div>

          {/* Hero Banner of Campus */}
          <div className="bg-white dark:bg-[#0e1726] rounded-lg border border-[#ccd5df] dark:border-[#1d2b40] overflow-hidden shadow-xs">
            <div className="h-40 sm:h-52 w-full relative bg-slate-800">
              <img 
                src={currentCommunity.portada} 
                alt={currentCommunity.nombre} 
                className="w-full h-full object-cover opacity-85"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
              <div className="absolute bottom-3 left-4 right-4 flex flex-col sm:flex-row sm:items-end justify-between gap-3 text-white">
                <div className="flex items-center gap-3">
                  <img 
                    src={currentCommunity.avatar} 
                    alt={currentCommunity.nombre} 
                    className="w-16 h-16 sm:w-20 sm:h-20 rounded-lg object-cover border-2 border-white shadow-md bg-white"
                  />
                  <div>
                    <div className="flex items-center gap-2">
                      <h1 className="text-xl sm:text-2xl font-bold">{currentCommunity.nombre}</h1>
                      {currentCommunity.siglas && (
                        <span className="text-xs bg-white/20 backdrop-blur-xs px-2 py-0.5 rounded font-mono font-bold">
                          {currentCommunity.siglas}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-gray-200 flex items-center gap-2 mt-0.5">
                      <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5" /> {currentCommunity.ciudad}</span>
                      <span>•</span>
                      <span className="flex items-center gap-1"><Users className="w-3.5 h-3.5" /> {currentCommunity.miembros.length} miembros</span>
                    </p>
                  </div>
                </div>

                {/* Join / Leave button */}
                <div>
                  {isCurrentMember ? (
                    <div className="flex items-center gap-2">
                      <span className="px-3 py-1.5 bg-emerald-500/90 text-white rounded text-xs font-bold flex items-center gap-1 backdrop-blur-xs">
                        <Check className="w-3.5 h-3.5" /> Eres miembro
                      </span>
                      <button
                        onClick={() => leaveCampus(currentCommunity.id)}
                        className="px-2.5 py-1.5 bg-black/40 hover:bg-black/60 text-gray-200 hover:text-white rounded text-xs transition cursor-pointer"
                      >
                        Salir
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => joinCampus(currentCommunity.id)}
                      className="px-4 py-2 bg-[#3869A0] hover:bg-[#2d5684] text-white rounded text-xs font-bold shadow-md transition flex items-center gap-1.5 cursor-pointer"
                    >
                      <UserPlus className="w-4 h-4" />
                      <span>Unirme a este espacio</span>
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Description bar */}
            <div className="p-3 bg-[#f8fafc] dark:bg-[#121c2d] border-t border-[#ccd5df] dark:border-[#1d2b40] text-xs text-gray-700 dark:text-gray-300">
              <p className="max-w-4xl">{currentCommunity.descripcion}</p>
            </div>
          </div>

          {/* Two columns: Main Board & Community Members */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
            {/* Left Column: Tablón Común (8 cols) */}
            <div className="md:col-span-8 space-y-4">
              {/* Publisher Card */}
              <div className="bg-white dark:bg-[#0e1726] rounded border border-[#ccd5df] dark:border-[#1d2b40] p-3 shadow-xs">
                <div className="flex items-center justify-between pb-2 border-b border-gray-100 dark:border-gray-800 mb-2">
                  <span className="font-bold text-xs text-gray-800 dark:text-gray-100 flex items-center gap-1.5">
                    <MessageSquare className="w-3.5 h-3.5 text-[#3869A0]" />
                    Publicar en el tablón de {currentCommunity.siglas || currentCommunity.nombre}
                  </span>
                  <div className="flex items-center gap-1">
                    {(['general', 'apuntes', 'fiesta', 'quedada', 'duda'] as CampusPost['tipo'][]).map(t => (
                      <button
                        key={t}
                        type="button"
                        onClick={() => setPostType(t)}
                        className={`text-[10px] px-2 py-0.5 rounded font-semibold transition cursor-pointer ${
                          postType === t 
                            ? 'bg-[#3869A0] text-white' 
                            : 'text-gray-500 hover:bg-gray-100 dark:hover:bg-slate-800'
                        }`}
                      >
                        {POST_TYPE_TAGS[t].label}
                      </button>
                    ))}
                  </div>
                </div>

                <form onSubmit={handlePostSubmit} className="space-y-2">
                  <input
                    type="text"
                    value={postTitle}
                    onChange={e => setPostTitle(e.target.value)}
                    placeholder="Título (opcional, ej: 'Apuntes de Matemáticas', 'Quedada en el bar')..."
                    className="w-full text-xs p-2 rounded border border-gray-300 dark:border-gray-700 dark:bg-slate-900 focus:outline-none focus:ring-1 focus:ring-[#3869A0]"
                  />
                  <textarea
                    value={postText}
                    onChange={e => setPostText(e.target.value)}
                    placeholder={`Escribe un mensaje para los miembros de ${currentCommunity.nombre}...`}
                    rows={2}
                    className="w-full text-xs p-2 rounded border border-gray-300 dark:border-gray-700 dark:bg-slate-900 focus:outline-none focus:ring-1 focus:ring-[#3869A0] resize-none"
                  />
                  <div className="flex items-center justify-between pt-1">
                    <span className="text-[10px] text-gray-400">
                      Visible para todos los estudiantes y vecinos de este espacio
                    </span>
                    <button
                      type="submit"
                      disabled={!postText.trim() || isPublishing}
                      className="px-3 py-1 bg-[#3869A0] hover:bg-[#2e5785] disabled:bg-gray-300 text-white rounded text-xs font-bold transition flex items-center gap-1 cursor-pointer disabled:cursor-not-allowed"
                    >
                      <Send className="w-3 h-3" />
                      <span>Publicar</span>
                    </button>
                  </div>
                </form>
              </div>

              {/* Posts List */}
              <div className="space-y-3">
                {currentCommunity.posts.length === 0 ? (
                  <div className="bg-white dark:bg-[#0e1726] rounded border border-[#ccd5df] dark:border-[#1d2b40] p-8 text-center text-xs text-gray-500">
                    Aún no hay publicaciones en este tablón. ¡Sé el primero en compartir algo!
                  </div>
                ) : (
                  currentCommunity.posts.map(post => (
                    <div 
                      key={post.id} 
                      className="bg-white dark:bg-[#0e1726] rounded border border-[#ccd5df] dark:border-[#1d2b40] p-3.5 shadow-xs space-y-2 text-xs"
                    >
                      {/* Post Header */}
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-2">
                          <img 
                            src={post.autorAvatar} 
                            alt={post.autorNombre}
                            className="w-8 h-8 rounded object-cover border border-gray-300 cursor-pointer hover:opacity-90"
                            onClick={() => viewUserProfile(post.autorId)}
                          />
                          <div>
                            <span 
                              onClick={() => viewUserProfile(post.autorId)}
                              className="font-bold text-[#3869A0] hover:underline cursor-pointer"
                            >
                              {post.autorNombre}
                            </span>
                            <span className="text-[10px] text-gray-400 block">{post.fecha}</span>
                          </div>
                        </div>

                        <span className={`text-[10px] px-2 py-0.5 rounded font-bold ${POST_TYPE_TAGS[post.tipo].badge}`}>
                          {POST_TYPE_TAGS[post.tipo].label}
                        </span>
                      </div>

                      {/* Post Content */}
                      {post.titulo && (
                        <h4 className="font-bold text-gray-900 dark:text-gray-100 text-sm leading-tight">
                          {post.titulo}
                        </h4>
                      )}
                      <p className="text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-line">
                        {post.texto}
                      </p>

                      {/* Post Footer & Replies */}
                      <div className="pt-2 border-t border-gray-100 dark:border-gray-800 space-y-2">
                        {/* Existing replies */}
                        {post.respuestas.length > 0 && (
                          <div className="space-y-1.5 pl-3 border-l-2 border-[#3869A0]/40">
                            {post.respuestas.map(r => (
                              <div key={r.id} className="bg-gray-50 dark:bg-slate-900/60 p-2 rounded text-xs flex items-start gap-2">
                                <img 
                                  src={r.autorAvatar} 
                                  alt="" 
                                  className="w-5 h-5 rounded object-cover cursor-pointer"
                                  onClick={() => viewUserProfile(r.autorId)}
                                />
                                <div className="flex-1">
                                  <div className="flex items-center justify-between">
                                    <span 
                                      onClick={() => viewUserProfile(r.autorId)}
                                      className="font-bold text-[#3869A0] text-[11px] hover:underline cursor-pointer"
                                    >
                                      {r.autorNombre}
                                    </span>
                                    <span className="text-[9px] text-gray-400">{r.fecha}</span>
                                  </div>
                                  <p className="text-gray-700 dark:text-gray-300 text-[11px] mt-0.5 leading-snug">{r.texto}</p>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}

                        {/* Reply input */}
                        <div className="flex items-center gap-1.5 pt-1">
                          <input
                            type="text"
                            value={replyInputs[post.id] || ''}
                            onChange={e => setReplyInputs(prev => ({ ...prev, [post.id]: e.target.value }))}
                            onKeyDown={e => {
                              if (e.key === 'Enter') {
                                e.preventDefault();
                                handleReplySubmit(post.id);
                              }
                            }}
                            placeholder="Escribe una respuesta..."
                            className="flex-1 text-xs px-2.5 py-1 rounded border border-gray-300 dark:border-gray-700 dark:bg-slate-900 focus:outline-none focus:ring-1 focus:ring-[#3869A0]"
                          />
                          <button
                            type="button"
                            onClick={() => handleReplySubmit(post.id)}
                            className="px-2.5 py-1 bg-[#3869A0] text-white rounded text-xs font-semibold hover:bg-[#2d5684] cursor-pointer"
                          >
                            Responder
                          </button>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Right Column: Members & Info (4 cols) */}
            <div className="md:col-span-4 space-y-4">
              <div className="bg-white dark:bg-[#0e1726] rounded border border-[#ccd5df] dark:border-[#1d2b40] p-3 text-xs shadow-xs space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-gray-200 dark:border-gray-800">
                  <span className="font-bold text-gray-800 dark:text-gray-100 flex items-center gap-1.5">
                    <Users className="w-4 h-4 text-[#3869A0]" />
                    Gente de este espacio ({currentCommunity.miembros.length})
                  </span>
                </div>

                <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
                  {currentCommunity.miembros.map(mId => {
                    const user = users.find(u => u.id === mId) || (mId === currentUser.id ? currentUser : null);
                    if (!user) return null;
                    const isMe = user.id === currentUser.id;
                    const alreadyFriend = isFriend(currentUser.id, user.id);
                    const pending = hasPendingRequest(currentUser.id, user.id);

                    return (
                      <div key={user.id} className="flex items-center justify-between p-1.5 rounded hover:bg-blue-50/60 dark:hover:bg-slate-800/60 transition">
                        <div 
                          onClick={() => viewUserProfile(user.id)}
                          className="flex items-center gap-2 cursor-pointer truncate"
                        >
                          <img src={user.avatar} alt="" className="w-7 h-7 rounded object-cover border border-gray-300" />
                          <div className="truncate">
                            <span className="font-bold text-[#3869A0] hover:underline block truncate text-xs">
                              {user.nombre} {user.apellidos}
                            </span>
                            <span className="text-[10px] text-gray-400 block truncate">{user.provincia}</span>
                          </div>
                        </div>

                        {!isMe && !alreadyFriend && (
                          <button
                            onClick={() => sendFriendRequest(user.id)}
                            disabled={pending}
                            className="text-[10px] px-2 py-0.5 bg-blue-100 text-[#3869A0] hover:bg-[#3869A0] hover:text-white rounded font-bold transition disabled:opacity-60 cursor-pointer"
                          >
                            {pending ? 'Enviada' : '+ Agregar'}
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* Main Directory View of all Campuses, Institutes and Barrios */
        <div className="space-y-4">
          {/* Header Banner */}
          <div className="bg-white dark:bg-[#0e1726] rounded border border-[#ccd5df] dark:border-[#1d2b40] p-4 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                  <GraduationCap className="w-6 h-6 text-[#3869A0]" />
                  Comunidades Locales & Campus
                </h1>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 max-w-2xl">
                  En lugar de algoritmos masivos, conecta con tu entorno real: facultades universitarias, institutos y barrios locales. Comparte apuntes, eventos y tablones comunitarios.
                </p>
              </div>

              <button
                onClick={() => setIsCreateModalOpen(true)}
                className="px-3.5 py-2 bg-[#3869A0] hover:bg-[#2e5785] text-white rounded text-xs font-bold shadow-xs transition flex items-center justify-center gap-1.5 cursor-pointer whitespace-nowrap"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Proponer nuevo Campus / Barrio</span>
              </button>
            </div>

            {/* Filter Bar & Search */}
            <div className="mt-4 pt-3 border-t border-gray-100 dark:border-gray-800 flex flex-col sm:flex-row items-center justify-between gap-2">
              <div className="flex items-center gap-1.5 flex-wrap w-full sm:w-auto">
                <button
                  onClick={() => setActiveCategory('todos')}
                  className={`px-3 py-1 rounded text-xs font-semibold transition cursor-pointer ${
                    activeCategory === 'todos' ? 'bg-[#3869A0] text-white' : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-800'
                  }`}
                >
                  Todos ({campusCommunities.length})
                </button>
                <button
                  onClick={() => setActiveCategory('universidad')}
                  className={`px-3 py-1 rounded text-xs font-semibold transition flex items-center gap-1 cursor-pointer ${
                    activeCategory === 'universidad' ? 'bg-[#3869A0] text-white' : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-800'
                  }`}
                >
                  <GraduationCap className="w-3.5 h-3.5" />
                  <span>Universidades</span>
                </button>
                <button
                  onClick={() => setActiveCategory('instituto')}
                  className={`px-3 py-1 rounded text-xs font-semibold transition flex items-center gap-1 cursor-pointer ${
                    activeCategory === 'instituto' ? 'bg-[#3869A0] text-white' : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-800'
                  }`}
                >
                  <School className="w-3.5 h-3.5" />
                  <span>Institutos</span>
                </button>
                <button
                  onClick={() => setActiveCategory('barrio')}
                  className={`px-3 py-1 rounded text-xs font-semibold transition flex items-center gap-1 cursor-pointer ${
                    activeCategory === 'barrio' ? 'bg-[#3869A0] text-white' : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-800'
                  }`}
                >
                  <MapPin className="w-3.5 h-3.5" />
                  <span>Barrios locales</span>
                </button>
              </div>

              <div className="relative w-full sm:w-64">
                <Search className="w-3.5 h-3.5 text-gray-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  placeholder="Buscar universidad, instituto o barrio..."
                  className="w-full pl-8 pr-3 py-1 text-xs rounded border border-gray-300 dark:border-gray-700 dark:bg-slate-900 focus:outline-none focus:ring-1 focus:ring-[#3869A0]"
                />
              </div>
            </div>
          </div>

          {/* Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredCommunities.map(community => {
              const isMember = community.miembros.includes(currentUser.id);
              const badge = CATEGORY_BADGES[community.tipo];

              return (
                <div
                  key={community.id}
                  className="bg-white dark:bg-[#0e1726] rounded border border-[#ccd5df] dark:border-[#1d2b40] overflow-hidden shadow-xs hover:border-[#3869A0] transition flex flex-col justify-between"
                >
                  <div>
                    {/* Header cover */}
                    <div className="h-28 w-full relative bg-slate-700">
                      <img 
                        src={community.portada} 
                        alt={community.nombre}
                        className="w-full h-full object-cover opacity-80"
                      />
                      <span className={`absolute top-2 right-2 text-[10px] px-2 py-0.5 rounded font-bold shadow-xs flex items-center gap-1 ${badge.color}`}>
                        {badge.icon}
                        <span>{badge.label}</span>
                      </span>
                    </div>

                    {/* Body */}
                    <div className="p-3.5 space-y-2">
                      <div className="flex items-start gap-2.5">
                        <img 
                          src={community.avatar} 
                          alt="" 
                          className="w-11 h-11 rounded object-cover border border-gray-300 shrink-0 -mt-6 bg-white shadow-xs"
                        />
                        <div className="overflow-hidden">
                          <h3 className="font-bold text-sm text-gray-900 dark:text-gray-100 truncate leading-tight">
                            {community.nombre}
                          </h3>
                          <div className="text-[11px] text-gray-500 flex items-center gap-1.5 mt-0.5">
                            <MapPin className="w-3 h-3 text-gray-400" />
                            <span>{community.ciudad}</span>
                            {community.siglas && (
                              <span className="font-mono text-[10px] bg-gray-100 dark:bg-slate-800 px-1 rounded font-bold">
                                {community.siglas}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      <p className="text-xs text-gray-600 dark:text-gray-300 line-clamp-2 leading-relaxed">
                        {community.descripcion}
                      </p>
                    </div>
                  </div>

                  {/* Card Bottom Actions */}
                  <div className="px-3.5 py-2.5 bg-gray-50 dark:bg-slate-900/40 border-t border-gray-100 dark:border-gray-800 flex items-center justify-between text-xs">
                    <span className="text-[11px] text-gray-500 flex items-center gap-1">
                      <Users className="w-3 h-3 text-gray-400" />
                      {community.miembros.length} miembros
                    </span>

                    <button
                      onClick={() => {
                        setActiveCommunityDetail(community);
                        setSelectedCampusId(community.id);
                      }}
                      className="px-3 py-1 bg-[#3869A0] hover:bg-[#2d5684] text-white rounded text-[11px] font-bold transition flex items-center gap-1 cursor-pointer"
                    >
                      <span>Entrar al espacio</span>
                      <ChevronRight className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Modal: Proponer nuevo Campus o Barrio */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3">
          <div className="bg-white dark:bg-[#0e1726] rounded-lg border border-[#ccd5df] dark:border-[#1d2b40] w-full max-w-lg shadow-xl overflow-hidden text-xs">
            <div className="px-4 py-3 bg-[#3869A0] text-white flex items-center justify-between font-bold text-sm">
              <span className="flex items-center gap-1.5">
                <Building2 className="w-4 h-4" />
                Crear nuevo Campus, Instituto o Barrio
              </span>
              <button 
                onClick={() => setIsCreateModalOpen(false)}
                className="text-white hover:opacity-80 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateCampusSubmit} className="p-4 space-y-3">
              <div>
                <label className="block font-bold text-gray-700 dark:text-gray-200 mb-1">Nombre del espacio *</label>
                <input
                  type="text"
                  required
                  value={newCampusNombre}
                  onChange={e => setNewCampusNombre(e.target.value)}
                  placeholder="Ej: Universidad de Granada, IES San Isidro, Barrio de Ruzafa..."
                  className="w-full p-2 border border-gray-300 dark:border-gray-700 rounded dark:bg-slate-900 focus:outline-none focus:ring-1 focus:ring-[#3869A0]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-gray-700 dark:text-gray-200 mb-1">Tipo de espacio *</label>
                  <select
                    value={newCampusTipo}
                    onChange={e => setNewCampusTipo(e.target.value as CampusCommunity['tipo'])}
                    className="w-full p-2 border border-gray-300 dark:border-gray-700 rounded dark:bg-slate-900 focus:outline-none focus:ring-1 focus:ring-[#3869A0]"
                  >
                    <option value="universidad">Universidad / Facultad</option>
                    <option value="instituto">Instituto / Colegio</option>
                    <option value="barrio">Barrio / Distrito Local</option>
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-gray-700 dark:text-gray-200 mb-1">Siglas (opcional)</label>
                  <input
                    type="text"
                    value={newCampusSiglas}
                    onChange={e => setNewCampusSiglas(e.target.value)}
                    placeholder="Ej: UGR, IES SI, RZF..."
                    className="w-full p-2 border border-gray-300 dark:border-gray-700 rounded dark:bg-slate-900 focus:outline-none focus:ring-1 focus:ring-[#3869A0]"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-gray-700 dark:text-gray-200 mb-1">Ciudad o Provincia *</label>
                <input
                  type="text"
                  required
                  value={newCampusCiudad}
                  onChange={e => setNewCampusCiudad(e.target.value)}
                  placeholder="Ej: Granada, Madrid, Valencia, Bilbao..."
                  className="w-full p-2 border border-gray-300 dark:border-gray-700 rounded dark:bg-slate-900 focus:outline-none focus:ring-1 focus:ring-[#3869A0]"
                />
              </div>

              <div>
                <label className="block font-bold text-gray-700 dark:text-gray-200 mb-1">Descripción</label>
                <textarea
                  rows={3}
                  value={newCampusDesc}
                  onChange={e => setNewCampusDesc(e.target.value)}
                  placeholder="¿De qué trata este espacio? Facultades, carreras, eventos o quedadas..."
                  className="w-full p-2 border border-gray-300 dark:border-gray-700 rounded dark:bg-slate-900 focus:outline-none focus:ring-1 focus:ring-[#3869A0] resize-none"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2 border-t border-gray-200 dark:border-gray-800">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-3 py-1.5 rounded border border-gray-300 text-gray-700 dark:text-gray-300 hover:bg-gray-100 cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-[#3869A0] hover:bg-[#2d5684] text-white rounded font-bold cursor-pointer"
                >
                  Crear espacio
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
