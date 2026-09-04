import React, { useState, useMemo } from 'react';
import { useInkorium } from '../context/InkoriumContext';
import { 
  Building2, Music, Users, Sparkles, Plus, Search, Heart, 
  MessageSquare, CheckCircle2, ChevronRight, MapPin, Share2, 
  X, Check, Flame, ThumbsUp
} from 'lucide-react';
import { TuentiPage } from '../types';

const CATEGORY_NAMES: Record<TuentiPage['categoria'], { label: string; icon: React.ReactNode; color: string }> = {
  discoteca: { label: 'Discoteca / Fiesta', icon: <Flame className="w-3.5 h-3.5" />, color: 'bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-300' },
  musica: { label: 'Grupo de Música / Artista', icon: <Music className="w-3.5 h-3.5" />, color: 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300' },
  humor: { label: 'Humor & Frases Tuenti', icon: <Sparkles className="w-3.5 h-3.5" />, color: 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300' },
  universidad: { label: 'Universidad / Campus', icon: <Building2 className="w-3.5 h-3.5" />, color: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300' },
  comunidad: { label: 'Comunidad / Club', icon: <Users className="w-3.5 h-3.5" />, color: 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900/40 dark:text-cyan-300' },
  ocio: { label: 'Ocio & Planes', icon: <Sparkles className="w-3.5 h-3.5" />, color: 'bg-orange-100 text-orange-800 dark:bg-orange-900/40 dark:text-orange-300' },
  local: { label: 'Local / Bar de copas', icon: <Building2 className="w-3.5 h-3.5" />, color: 'bg-pink-100 text-pink-800 dark:bg-pink-900/40 dark:text-pink-300' }
};

export const PagesView: React.FC = () => {
  const { 
    pages, 
    currentUser, 
    createPage, 
    toggleFollowPage, 
    postPageComment, 
    viewUserProfile,
    selectedPageId,
    setSelectedPageId 
  } = useInkorium();

  const [activeCategory, setActiveCategory] = useState<string>('todos');
  const [searchQuery, setSearchQuery] = useState('');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [activePageDetail, setActivePageDetail] = useState<TuentiPage | null>(() => {
    if (selectedPageId) {
      return pages.find(p => p.id === selectedPageId) || null;
    }
    return null;
  });

  // Post in page state
  const [postText, setPostText] = useState('');

  // Create page form
  const [newName, setNewName] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newCategory, setNewCategory] = useState<TuentiPage['categoria']>('humor');
  const [newUbicacion, setNewUbicacion] = useState(currentUser.provincia || 'Madrid');
  const [newAvatar, setNewAvatar] = useState('https://images.unsplash.com/photo-1513151233558-d860c5398176?w=400&auto=format&fit=crop&q=80');
  const [newPortada, setNewPortada] = useState('https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=1200&auto=format&fit=crop&q=80');

  React.useEffect(() => {
    if (selectedPageId) {
      const found = pages.find(p => p.id === selectedPageId);
      if (found) setActivePageDetail(found);
    }
  }, [selectedPageId, pages]);

  const filteredPages = useMemo(() => {
    return pages.filter(p => {
      const matchesSearch = 
        p.nombre.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.descripcion.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (p.ubicacion && p.ubicacion.toLowerCase().includes(searchQuery.toLowerCase()));

      if (!matchesSearch) return false;
      if (activeCategory === 'todos') return true;
      if (activeCategory === 'mis_paginas') return p.seguidores.includes(currentUser.id);
      return p.categoria === activeCategory;
    });
  }, [pages, searchQuery, activeCategory, currentUser.id]);

  const isUserFan = (page: TuentiPage) => page.seguidores.includes(currentUser.id);

  const handleToggleFan = (pageId: string) => {
    toggleFollowPage(pageId);
    if (activePageDetail && activePageDetail.id === pageId) {
      setActivePageDetail(prev => {
        if (!prev) return null;
        const isFan = prev.seguidores.includes(currentUser.id);
        const nextSeguidores = isFan 
          ? prev.seguidores.filter(id => id !== currentUser.id)
          : [...prev.seguidores, currentUser.id];
        return { ...prev, seguidores: nextSeguidores };
      });
    }
  };

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim() || !newDesc.trim()) return;

    const newId = createPage({
      nombre: newName.trim(),
      categoria: newCategory,
      descripcion: newDesc.trim(),
      ubicacion: newUbicacion.trim(),
      avatar: newAvatar,
      portada: newPortada,
      verificada: false
    });

    setIsCreateModalOpen(false);
    setNewName('');
    setNewDesc('');

    const created = pages.find(p => p.id === newId);
    if (created) setActivePageDetail(created);
  };

  const handlePostSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activePageDetail || !postText.trim()) return;
    postPageComment(activePageDetail.id, postText.trim());
    setPostText('');

    setActivePageDetail(prev => {
      if (!prev) return null;
      return {
        ...prev,
        posts: [
          {
            id: `p-post-${Date.now()}`,
            autorId: currentUser.id,
            autorNombre: `${currentUser.nombre} ${currentUser.apellidos}`.trim() || currentUser.nombre,
            autorAvatar: currentUser.avatar,
            texto: postText.trim(),
            fecha: 'Ahora mismo',
            likes: []
          },
          ...prev.posts
        ]
      };
    });
  };

  return (
    <div className="w-full max-w-[1720px] 2xl:max-w-[1850px] mx-auto px-3 sm:px-6 lg:px-8 py-4">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-[#2a4d77] via-[#3869A0] to-[#254166] text-white rounded-t border border-[#254166] p-4 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-4">
        <div>
          <div className="flex items-center gap-2">
            <Building2 className="w-6 h-6 text-yellow-300" />
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight">Páginas y Sitios de Tuenti</h1>
            <span className="bg-yellow-400 text-gray-900 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
              Comunidades
            </span>
          </div>
          <p className="text-xs sm:text-sm text-blue-100 mt-1 max-w-2xl">
            Hazte fan de tus discotecas favoritas, bandas míticas (El Canto del Loco, Pignoise), comunidades de frases célebres y campus universitarios.
          </p>
        </div>

        <button
          onClick={() => setIsCreateModalOpen(true)}
          className="inline-flex items-center gap-1.5 px-4 py-2 bg-yellow-400 hover:bg-yellow-300 active:bg-yellow-500 text-gray-900 font-bold text-xs sm:text-sm rounded shadow-sm hover:shadow transition-all cursor-pointer whitespace-nowrap"
        >
          <Plus className="w-4 h-4" />
          <span>Crear una página</span>
        </button>
      </div>

      {/* Main Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        {/* Left Sidebar: Categories & Search */}
        <div className="lg:col-span-1 space-y-4">
          <div className="bg-white dark:bg-[#142032] border border-[#ccd5df] dark:border-[#1d2b40] rounded shadow-sm p-3">
            <h2 className="text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wide mb-2 px-1">
              Categorías
            </h2>
            <div className="space-y-1">
              <button
                onClick={() => setActiveCategory('todos')}
                className={`w-full text-left px-2.5 py-1.5 rounded text-xs font-medium flex items-center justify-between transition-colors ${
                  activeCategory === 'todos'
                    ? 'bg-[#3869A0] text-white font-bold'
                    : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-[#1a2942]'
                }`}
              >
                <span>Todas las páginas</span>
                <span className="text-[11px] opacity-80">{pages.length}</span>
              </button>
              <button
                onClick={() => setActiveCategory('mis_paginas')}
                className={`w-full text-left px-2.5 py-1.5 rounded text-xs font-medium flex items-center justify-between transition-colors ${
                  activeCategory === 'mis_paginas'
                    ? 'bg-[#3869A0] text-white font-bold'
                    : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-[#1a2942]'
                }`}
              >
                <span>Páginas de las que soy fan</span>
                <span className="text-[11px] opacity-80">
                  {pages.filter(p => p.seguidores.includes(currentUser.id)).length}
                </span>
              </button>
              <button
                onClick={() => setActiveCategory('discoteca')}
                className={`w-full text-left px-2.5 py-1.5 rounded text-xs font-medium flex items-center justify-between transition-colors ${
                  activeCategory === 'discoteca'
                    ? 'bg-[#3869A0] text-white font-bold'
                    : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-[#1a2942]'
                }`}
              >
                <span>Discotecas & Fiestas</span>
                <span className="text-[11px] opacity-80">{pages.filter(p => p.categoria === 'discoteca').length}</span>
              </button>
              <button
                onClick={() => setActiveCategory('musica')}
                className={`w-full text-left px-2.5 py-1.5 rounded text-xs font-medium flex items-center justify-between transition-colors ${
                  activeCategory === 'musica'
                    ? 'bg-[#3869A0] text-white font-bold'
                    : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-[#1a2942]'
                }`}
              >
                <span>Música & Artistas</span>
                <span className="text-[11px] opacity-80">{pages.filter(p => p.categoria === 'musica').length}</span>
              </button>
              <button
                onClick={() => setActiveCategory('humor')}
                className={`w-full text-left px-2.5 py-1.5 rounded text-xs font-medium flex items-center justify-between transition-colors ${
                  activeCategory === 'humor'
                    ? 'bg-[#3869A0] text-white font-bold'
                    : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-[#1a2942]'
                }`}
              >
                <span>Humor & Frases dosmileras</span>
                <span className="text-[11px] opacity-80">{pages.filter(p => p.categoria === 'humor').length}</span>
              </button>
              <button
                onClick={() => setActiveCategory('universidad')}
                className={`w-full text-left px-2.5 py-1.5 rounded text-xs font-medium flex items-center justify-between transition-colors ${
                  activeCategory === 'universidad'
                    ? 'bg-[#3869A0] text-white font-bold'
                    : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-[#1a2942]'
                }`}
              >
                <span>Universidades & Institutos</span>
                <span className="text-[11px] opacity-80">{pages.filter(p => p.categoria === 'universidad').length}</span>
              </button>
            </div>

            {/* Search */}
            <div className="mt-4 pt-3 border-t border-gray-200 dark:border-[#1d2b40]">
              <label className="text-[11px] font-bold text-gray-500 dark:text-gray-400 block mb-1">
                Buscar páginas:
              </label>
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-gray-400 absolute left-2.5 top-2.5" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  placeholder="Ej: Fabrik, Dani Martín, Complutense..."
                  className="w-full pl-8 pr-2.5 py-1.5 text-xs bg-gray-50 dark:bg-[#0e1726] border border-gray-300 dark:border-[#1d2b40] rounded focus:outline-none focus:ring-1 focus:ring-[#3869A0]"
                />
              </div>
            </div>
          </div>

          <div className="bg-[#f0f4f9] dark:bg-[#142032] border border-[#d2dce6] dark:border-[#1d2b40] rounded p-3 text-xs text-gray-600 dark:text-gray-300">
            <div className="flex items-center gap-1.5 font-bold text-[#3869A0] dark:text-blue-400 mb-1">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Nostalgia Tuenti</span>
            </div>
            <p className="leading-relaxed text-[11px]">
              En 2008, todos nos uníamos a páginas con nombres larguísimos tipo <em>"Yo también miraba la nada mientras escuchaba a Pignoise"</em> solo para que saliera en nuestro perfil.
            </p>
          </div>
        </div>

        {/* Right Area: Page Cards or Active Page Detail */}
        <div className="lg:col-span-3 space-y-4">
          {activePageDetail ? (
            /* DETALLE DE PÁGINA SELECCIONADA */
            <div className="bg-white dark:bg-[#142032] border border-[#ccd5df] dark:border-[#1d2b40] rounded shadow-sm overflow-hidden">
              {/* Back button */}
              <div className="bg-gray-100 dark:bg-[#101b2b] px-4 py-2 border-b border-gray-200 dark:border-[#1d2b40] flex items-center justify-between">
                <button
                  onClick={() => {
                    setActivePageDetail(null);
                    setSelectedPageId(null);
                  }}
                  className="text-xs font-semibold text-[#3869A0] dark:text-blue-400 hover:underline flex items-center gap-1 cursor-pointer"
                >
                  ← Volver al listado de páginas
                </button>
              </div>

              {/* Cover Banner */}
              <div className="relative h-44 sm:h-56 bg-gray-900 overflow-hidden">
                <img
                  src={activePageDetail.portada || 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=1200&auto=format&fit=crop&q=80'}
                  alt={activePageDetail.nombre}
                  className="w-full h-full object-cover opacity-80"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
              </div>

              {/* Page Profile Header */}
              <div className="px-4 sm:px-6 pb-4 pt-0 relative border-b border-gray-200 dark:border-[#1d2b40] bg-white dark:bg-[#142032]">
                <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between gap-4 -mt-12 sm:-mt-14 mb-4">
                  <div className="flex items-end gap-3.5">
                    <img
                      src={activePageDetail.avatar}
                      alt={activePageDetail.nombre}
                      className="w-20 h-20 sm:w-24 sm:h-24 rounded-lg object-cover border-4 border-white dark:border-[#142032] shadow-md bg-white"
                    />
                    <div className="mb-1">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <h1 className="text-lg sm:text-2xl font-bold text-gray-900 dark:text-gray-100">
                          {activePageDetail.nombre}
                        </h1>
                        {activePageDetail.verificada && (
                          <CheckCircle2 className="w-5 h-5 text-blue-500 fill-blue-50" />
                        )}
                      </div>
                      <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${CATEGORY_NAMES[activePageDetail.categoria]?.color || 'bg-gray-100'}`}>
                          {CATEGORY_NAMES[activePageDetail.categoria]?.label || 'Página'}
                        </span>
                        <span>•</span>
                        <span>{activePageDetail.seguidores.length} fans</span>
                        {activePageDetail.ubicacion && (
                          <>
                            <span>•</span>
                            <span className="flex items-center gap-0.5">
                              <MapPin className="w-3 h-3 text-red-500" />
                              {activePageDetail.ubicacion}
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Follow Button */}
                  <button
                    onClick={() => handleToggleFan(activePageDetail.id)}
                    className={`px-4 py-2 rounded text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 shadow-sm ${
                      isUserFan(activePageDetail)
                        ? 'bg-emerald-600 text-white hover:bg-emerald-700'
                        : 'bg-[#3869A0] text-white hover:bg-[#2c5282]'
                    }`}
                  >
                    {isUserFan(activePageDetail) ? (
                      <>
                        <Check className="w-4 h-4" />
                        <span>¡Ya eres fan!</span>
                      </>
                    ) : (
                      <>
                        <Heart className="w-4 h-4 fill-white" />
                        <span>Hacerme fan</span>
                      </>
                    )}
                  </button>
                </div>

                <p className="text-xs sm:text-sm text-gray-700 dark:text-gray-300 leading-relaxed max-w-3xl">
                  {activePageDetail.descripcion}
                </p>
              </div>

              {/* Page Wall / Tablón de publicaciones */}
              <div className="p-4 sm:p-6 bg-gray-50 dark:bg-[#0e1726]">
                <div className="max-w-2xl mx-auto space-y-4">
                  {/* Publicar en la página */}
                  <div className="bg-white dark:bg-[#142032] border border-[#ccd5df] dark:border-[#1d2b40] rounded p-3 shadow-xs">
                    <h3 className="text-xs font-bold text-gray-700 dark:text-gray-300 mb-2">
                      Escribir en el tablón de {activePageDetail.nombre}
                    </h3>
                    <form onSubmit={handlePostSubmit}>
                      <textarea
                        rows={2}
                        value={postText}
                        onChange={e => setPostText(e.target.value)}
                        placeholder="Comparte una anécdota, pregunta o mensaje para los fans..."
                        className="w-full px-3 py-2 text-xs bg-gray-50 dark:bg-[#0e1726] border border-gray-300 dark:border-[#1d2b40] rounded focus:outline-none focus:ring-1 focus:ring-[#3869A0] resize-none"
                      />
                      <div className="flex justify-end mt-2">
                        <button
                          type="submit"
                          disabled={!postText.trim()}
                          className="px-3 py-1.5 bg-[#3869A0] hover:bg-[#2c5282] text-white font-bold text-xs rounded transition-colors cursor-pointer disabled:opacity-50"
                        >
                          Firmar en la página
                        </button>
                      </div>
                    </form>
                  </div>

                  {/* Publicaciones */}
                  <div className="space-y-3">
                    {activePageDetail.posts.length === 0 ? (
                      <div className="text-center py-8 text-xs text-gray-400 bg-white dark:bg-[#142032] border border-dashed border-gray-300 dark:border-gray-800 rounded">
                        No hay publicaciones todavía en esta página. ¡Sé el primero en firmar!
                      </div>
                    ) : (
                      activePageDetail.posts.map(post => (
                        <div key={post.id} className="bg-white dark:bg-[#142032] border border-[#ccd5df] dark:border-[#1d2b40] rounded p-3 shadow-xs">
                          <div className="flex items-center gap-2.5 mb-2">
                            <img
                              src={post.autorAvatar}
                              alt={post.autorNombre}
                              className="w-8 h-8 rounded object-cover cursor-pointer"
                              onClick={() => viewUserProfile(post.autorId)}
                            />
                            <div>
                              <button
                                onClick={() => viewUserProfile(post.autorId)}
                                className="text-xs font-bold text-[#3869A0] dark:text-blue-400 hover:underline cursor-pointer"
                              >
                                {post.autorNombre}
                              </button>
                              <div className="text-[10px] text-gray-400">{post.fecha}</div>
                            </div>
                          </div>

                          <p className="text-xs text-gray-800 dark:text-gray-200 leading-relaxed mb-2 whitespace-pre-line">
                            {post.texto}
                          </p>

                          {post.fotoUrl && (
                            <img
                              src={post.fotoUrl}
                              alt="Foto del post"
                              className="rounded border border-gray-200 dark:border-[#1d2b40] max-h-64 object-cover w-full mb-2"
                            />
                          )}

                          <div className="pt-2 border-t border-gray-100 dark:border-[#1d2b40] flex items-center gap-4 text-xs text-gray-500">
                            <button
                              onClick={() => {
                                // Simple like toggle
                              }}
                              className="flex items-center gap-1 hover:text-[#3869A0] cursor-pointer"
                            >
                              <ThumbsUp className="w-3.5 h-3.5" />
                              <span>Me gusta ({post.likes.length})</span>
                            </button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            /* LISTADO DE PÁGINAS EN GRID */
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold text-gray-600 dark:text-gray-300">
                  Mostrando {filteredPages.length} páginas
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredPages.map(page => {
                  const isFan = isUserFan(page);
                  return (
                    <div
                      key={page.id}
                      className="bg-white dark:bg-[#142032] border border-[#ccd5df] dark:border-[#1d2b40] rounded overflow-hidden shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between"
                    >
                      <div>
                        {/* Header with Avatar & Badge */}
                        <div className="p-3 bg-gradient-to-r from-gray-50 to-[#f0f4f9] dark:from-[#111c2e] dark:to-[#142032] border-b border-gray-100 dark:border-[#1d2b40] flex items-center justify-between gap-3">
                          <div className="flex items-center gap-2.5 min-w-0">
                            <img
                              src={page.avatar}
                              alt={page.nombre}
                              className="w-11 h-11 rounded object-cover border border-gray-300 dark:border-[#1d2b40] bg-white shrink-0"
                            />
                            <div className="min-w-0">
                              <div className="flex items-center gap-1">
                                <h3
                                  onClick={() => setActivePageDetail(page)}
                                  className="text-xs sm:text-sm font-bold text-[#3869A0] dark:text-blue-400 hover:underline cursor-pointer truncate"
                                >
                                  {page.nombre}
                                </h3>
                                {page.verificada && (
                                  <CheckCircle2 className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                                )}
                              </div>
                              <span className={`inline-block text-[10px] font-bold px-1.5 py-0.2 rounded mt-0.5 ${CATEGORY_NAMES[page.categoria]?.color || 'bg-gray-100'}`}>
                                {CATEGORY_NAMES[page.categoria]?.label || 'Página'}
                              </span>
                            </div>
                          </div>

                          <button
                            onClick={() => handleToggleFan(page.id)}
                            className={`px-2.5 py-1 rounded text-[11px] font-bold transition-all cursor-pointer whitespace-nowrap ${
                              isFan
                                ? 'bg-emerald-600 text-white'
                                : 'bg-[#3869A0] text-white hover:bg-[#2c5282]'
                            }`}
                          >
                            {isFan ? '✔ Fan' : '+ Hacerme fan'}
                          </button>
                        </div>

                        {/* Description */}
                        <div className="p-3">
                          <p className="text-xs text-gray-700 dark:text-gray-300 line-clamp-3 leading-relaxed mb-2">
                            {page.descripcion}
                          </p>
                          {page.ubicacion && (
                            <div className="flex items-center gap-1 text-[11px] text-gray-400">
                              <MapPin className="w-3 h-3 text-red-500" />
                              <span>{page.ubicacion}</span>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Footer */}
                      <div className="px-3 py-2 bg-gray-50 dark:bg-[#0e1726] border-t border-gray-100 dark:border-[#1d2b40] flex items-center justify-between text-[11px] text-gray-500">
                        <span>{page.seguidores.length} fans</span>
                        <button
                          onClick={() => setActivePageDetail(page)}
                          className="font-bold text-[#3869A0] dark:text-blue-400 hover:underline flex items-center gap-0.5 cursor-pointer"
                        >
                          <span>Entrar a la página</span>
                          <ChevronRight className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* MODAL CREAR PÁGINA */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3">
          <div className="bg-white dark:bg-[#142032] border border-[#ccd5df] dark:border-[#1d2b40] rounded-lg shadow-xl w-full max-w-md overflow-hidden flex flex-col">
            <div className="bg-[#3869A0] text-white p-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Building2 className="w-4 h-4 text-yellow-300" />
                <h3 className="text-sm font-bold">Crear una Página o Sitio en Inkorium</h3>
              </div>
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="text-white/80 hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} className="p-4 space-y-3 text-xs">
              <div>
                <label className="font-bold text-gray-700 dark:text-gray-300 block mb-1">
                  Nombre de la página o grupo *
                </label>
                <input
                  type="text"
                  required
                  value={newName}
                  onChange={e => setNewName(e.target.value)}
                  placeholder="Ej: Discoteca Kapital / Fans de Pereza"
                  className="w-full px-3 py-1.5 border border-gray-300 dark:border-[#1d2b40] rounded bg-gray-50 dark:bg-[#0e1726] text-gray-900 dark:text-gray-100"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-gray-700 dark:text-gray-300 block mb-1">
                    Categoría
                  </label>
                  <select
                    value={newCategory}
                    onChange={e => setNewCategory(e.target.value as any)}
                    className="w-full px-2 py-1.5 border border-gray-300 dark:border-[#1d2b40] rounded bg-gray-50 dark:bg-[#0e1726] text-gray-900 dark:text-gray-100"
                  >
                    <option value="discoteca">Discoteca / Fiesta</option>
                    <option value="musica">Música / Artista</option>
                    <option value="humor">Humor & Frases</option>
                    <option value="universidad">Universidad / Campus</option>
                    <option value="comunidad">Comunidad</option>
                    <option value="local">Bar / Local</option>
                    <option value="ocio">Ocio</option>
                  </select>
                </div>

                <div>
                  <label className="font-bold text-gray-700 dark:text-gray-300 block mb-1">
                    Ciudad / Ubicación
                  </label>
                  <input
                    type="text"
                    value={newUbicacion}
                    onChange={e => setNewUbicacion(e.target.value)}
                    className="w-full px-3 py-1.5 border border-gray-300 dark:border-[#1d2b40] rounded bg-gray-50 dark:bg-[#0e1726] text-gray-900 dark:text-gray-100"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-gray-700 dark:text-gray-300 block mb-1">
                  Descripción
                </label>
                <textarea
                  rows={3}
                  required
                  value={newDesc}
                  onChange={e => setNewDesc(e.target.value)}
                  placeholder="¿De qué trata esta página? Explica a los fans por qué deberían unirse..."
                  className="w-full px-3 py-1.5 border border-gray-300 dark:border-[#1d2b40] rounded bg-gray-50 dark:bg-[#0e1726] text-gray-900 dark:text-gray-100 resize-none"
                />
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
                  Crear página
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
