import React, { useState, useRef } from 'react';
import { useInkorium } from '../context/InkoriumContext';
import { 
  Send, Image as ImageIcon, Smile, MessageCircle, Heart, 
  UserPlus, Sparkles, Clock, CheckCircle2, ChevronRight,
  Upload, Camera, Loader2, X
} from 'lucide-react';
import { FeedItem } from '../types';
import { uploadMediaFile } from '../lib/storage';

export const HomeFeed: React.FC<{ onOpenUpload: () => void }> = ({ onOpenUpload }) => {
  const {
    currentUser,
    users,
    photos,
    feed,
    publishStatus,
    likeFeedItem,
    commentFeedItem,
    viewUserProfile,
    viewPhoto,
    unreadMessagesCount,
    unreadNotificationsCount,
    pendingRequestsCount,
    setActiveTab,
    sendFriendRequest,
    isFriend,
    hasPendingRequest,
    openChatWith,
    setChatEstado
  } = useInkorium();

  const [statusText, setStatusText] = useState('');
  const [attachedPhotoUrl, setAttachedPhotoUrl] = useState('');
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const [showPhotoInput, setShowPhotoInput] = useState(false);
  const [activeFilter, setActiveFilter] = useState<'todos' | 'estados' | 'fotos' | 'tablon'>('todos');
  const [commentInputs, setCommentInputs] = useState<Record<string, string>>({});
  const [openComments, setOpenComments] = useState<Record<string, boolean>>({});

  const feedFileInputRef = useRef<HTMLInputElement>(null);

  const handleFeedFileSelect = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      alert('Por favor selecciona una imagen válida.');
      return;
    }
    setIsUploadingPhoto(true);
    setShowPhotoInput(true);
    try {
      const url = await uploadMediaFile(file, 'wall');
      setAttachedPhotoUrl(url);
    } catch (err) {
      console.error('Error subiendo foto al estado:', err);
    } finally {
      setIsUploadingPhoto(false);
    }
  };

  const handlePublish = (e: React.FormEvent) => {
    e.preventDefault();
    if (!statusText.trim() && !attachedPhotoUrl) return;
    publishStatus(statusText, attachedPhotoUrl || undefined);
    setStatusText('');
    setAttachedPhotoUrl('');
    setShowPhotoInput(false);
  };

  const handleAddComment = (feedId: string) => {
    const text = commentInputs[feedId];
    if (!text || !text.trim()) return;
    commentFeedItem(feedId, text);
    setCommentInputs(prev => ({ ...prev, [feedId]: '' }));
  };

  // Filter feed items
  const filteredFeed = feed.filter(item => {
    if (activeFilter === 'estados') return item.tipo === 'estado';
    if (activeFilter === 'fotos') return item.tipo === 'foto' || item.tipo === 'album';
    if (activeFilter === 'tablon') return item.tipo === 'tablon';
    return true;
  });

  // Recommended users (not friends yet)
  const nonFriends = users.filter(u => u.id !== currentUser.id && !isFriend(currentUser.id, u.id));

  return (
    <div className="w-full max-w-[1720px] 2xl:max-w-[1850px] mx-auto px-3 sm:px-6 lg:px-8 py-4 grid grid-cols-1 md:grid-cols-12 gap-4">
      {/* ================= LEFT SIDEBAR (barra_izq) ================= */}
      <div className="md:col-span-3 space-y-3">
        {/* User Mini Profile Card */}
        <div className="bg-white rounded border border-[#ccd5df] p-3 shadow-xs">
          <div className="flex items-center gap-3">
            <img 
              src={currentUser.avatar} 
              alt={currentUser.nombre} 
              className="w-14 h-14 rounded object-cover border border-gray-300 shadow-xs cursor-pointer hover:opacity-90"
              onClick={() => viewUserProfile(currentUser.id)}
            />
            <div className="overflow-hidden">
              <h3 
                onClick={() => viewUserProfile(currentUser.id)}
                className="font-bold text-sm text-[#3869A0] hover:underline cursor-pointer truncate"
              >
                {currentUser.nombre} {currentUser.apellidos}
              </h3>
              <p className="text-[11px] text-gray-500 truncate">{currentUser.provincia}</p>
              <button 
                onClick={() => viewUserProfile(currentUser.id)}
                className="text-[10px] text-gray-600 hover:text-[#3869A0] underline mt-0.5 block"
              >
                Ver mi perfil
              </button>
            </div>
          </div>

          {/* Current Status snippet */}
          <div className="mt-2.5 p-2 bg-[#f4f7fa] rounded border border-gray-200 text-xs text-gray-700 italic relative">
            <span className="text-[#3869A0] font-serif font-bold text-base leading-none">“</span>
            <span className="text-[11px]">{currentUser.estado}</span>
            <span className="text-[#3869A0] font-serif font-bold text-base leading-none">”</span>
            <span className="block text-[9px] text-gray-400 text-right mt-0.5 not-italic">{currentUser.estadoFecha || 'Hoy'}</span>
          </div>
        </div>

        {/* Notifications Alert Box (if any) */}
        {(pendingRequestsCount > 0 || unreadMessagesCount > 0 || unreadNotificationsCount > 0) && (
          <div className="bg-[#fff9e6] border border-[#f0d48b] rounded p-3 text-xs space-y-1.5 shadow-xs">
            <p className="font-bold text-[#8a6d3b] text-xs uppercase tracking-wider flex items-center gap-1">
              <Sparkles className="w-3 h-3" /> Notificaciones pendientes
            </p>
            {pendingRequestsCount > 0 && (
              <p 
                onClick={() => setActiveTab('ajustes')}
                className="text-[#3869A0] hover:underline cursor-pointer font-semibold flex items-center justify-between"
              >
                <span>• Tienes {pendingRequestsCount} petición(es) de amistad</span>
                <ChevronRight className="w-3 h-3" />
              </p>
            )}
            {unreadMessagesCount > 0 && (
              <p 
                onClick={() => setActiveTab('mensajes')}
                className="text-[#3869A0] hover:underline cursor-pointer font-semibold flex items-center justify-between"
              >
                <span>• Tienes {unreadMessagesCount} mensaje(s) privado(s)</span>
                <ChevronRight className="w-3 h-3" />
              </p>
            )}
            {unreadNotificationsCount > 0 && (
              <p 
                onClick={() => setActiveTab('perfil')}
                className="text-[#3869A0] hover:underline cursor-pointer font-semibold flex items-center justify-between"
              >
                <span>• Tienes nuevas novedades en tu perfil</span>
                <ChevronRight className="w-3 h-3" />
              </p>
            )}
          </div>
        )}

        {/* Quick Menu / Navigation Links */}
        <div className="bg-white rounded border border-[#ccd5df] overflow-hidden text-xs shadow-xs">
          <div className="bg-[#f0f4f8] px-3 py-1.5 border-b border-[#ccd5df] font-bold text-gray-700">
            Accesos directos
          </div>
          <div className="divide-y divide-gray-100 font-medium">
            <button 
              onClick={onOpenUpload}
              className="w-full text-left px-3 py-2 hover:bg-blue-50 text-[#3869A0] flex items-center gap-2 cursor-pointer"
            >
              <Upload className="w-3.5 h-3.5" />
              <span>Subir fotos</span>
            </button>
            <button 
              onClick={() => setActiveTab('gente')}
              className="w-full text-left px-3 py-2 hover:bg-blue-50 text-gray-700 flex items-center gap-2 cursor-pointer"
            >
              <UserPlus className="w-3.5 h-3.5 text-gray-500" />
              <span>Buscar gente / amigos</span>
            </button>
            <button 
              onClick={() => setActiveTab('mensajes')}
              className="w-full text-left px-3 py-2 hover:bg-blue-50 text-gray-700 flex items-center gap-2 cursor-pointer"
            >
              <MessageCircle className="w-3.5 h-3.5 text-gray-500" />
              <span>Redactar mensaje privado</span>
            </button>
            <button 
              onClick={() => setActiveTab('ajustes')}
              className="w-full text-left px-3 py-2 hover:bg-blue-50 text-gray-700 flex items-center gap-2 cursor-pointer"
            >
              <span className="text-gray-500">⚙️</span>
              <span>Ajustes de mi cuenta</span>
            </button>
          </div>
        </div>

        {/* Mini Chat Widget */}
        <div className="bg-white rounded border border-[#ccd5df] p-3 text-xs shadow-xs">
          <div className="flex items-center justify-between pb-2 border-b border-gray-200 mb-2">
            <span className="font-bold text-gray-800 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              Chat de Inkorium
            </span>
            <button 
              onClick={() => setChatEstado(currentUser.chatEstado === '1' ? '0' : '1')}
              className="text-[10px] text-[#3869A0] hover:underline cursor-pointer font-medium"
            >
              {currentUser.chatEstado === '1' ? 'Desactivar' : 'Activar'}
            </button>
          </div>

          {currentUser.chatEstado === '1' ? (
            <div className="space-y-1.5 max-h-48 overflow-y-auto">
              {users.filter(u => u.id !== currentUser.id).map(user => (
                <div 
                  key={user.id}
                  onClick={() => openChatWith(user.id)}
                  className="flex items-center justify-between p-1 rounded hover:bg-blue-50 cursor-pointer transition"
                >
                  <div className="flex items-center gap-2 truncate">
                    <div className="relative">
                      <img src={user.avatar} alt="" className="w-5 h-5 rounded object-cover" />
                      <span className={`absolute -bottom-0.5 -right-0.5 w-1.5 h-1.5 rounded-full ${user.online ? 'bg-emerald-500' : 'bg-gray-400'}`}></span>
                    </div>
                    <span className="text-xs text-gray-800 truncate">{user.nombre} {user.apellidos}</span>
                  </div>
                  <span className="text-[10px] text-gray-400">{user.online ? 'Conectado' : 'Ausente'}</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-3 text-gray-400">
              <p>El chat está desconectado</p>
              <button 
                onClick={() => setChatEstado('1')}
                className="mt-1 px-3 py-1 bg-[#3869A0] text-white rounded text-[11px] font-bold hover:bg-[#2e5785] cursor-pointer"
              >
                Conectar al chat
              </button>
            </div>
          )}
        </div>
      </div>

      {/* ================= CENTER FEED (barra_centro) ================= */}
      <div className="md:col-span-6 space-y-4">
        {/* Status Publisher Form ("¿Qué estás haciendo?") */}
        <div className="bg-white rounded border border-[#ccd5df] p-3 shadow-xs">
          <div className="flex items-center gap-2 pb-2 border-b border-gray-100">
            <span className="font-bold text-xs text-gray-800">¿Qué estás pensando o haciendo?</span>
          </div>

          <form onSubmit={handlePublish} className="mt-2 space-y-2">
            <textarea
              value={statusText}
              onChange={e => setStatusText(e.target.value)}
              placeholder="Escribe tu estado para que lo vean todos tus amigos..."
              rows={2}
              className="w-full text-xs p-2.5 rounded border border-gray-300 focus:outline-none focus:ring-1 focus:ring-[#3869A0] focus:border-[#3869A0] resize-none"
            />

            {showPhotoInput && (
              <div className="p-2.5 bg-blue-50/80 rounded border border-blue-200 text-xs space-y-2">
                <div className="flex items-center justify-between">
                  <label className="font-bold text-gray-800 block text-[11px]">Adjuntar foto a tu estado:</label>
                  <button
                    type="button"
                    onClick={() => { setShowPhotoInput(false); setAttachedPhotoUrl(''); }}
                    className="text-gray-400 hover:text-gray-600 text-xs font-bold cursor-pointer"
                  >
                    ✕
                  </button>
                </div>

                <div className="flex flex-col sm:flex-row items-center gap-2">
                  <input
                    ref={feedFileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={e => e.target.files?.[0] && handleFeedFileSelect(e.target.files[0])}
                    className="hidden"
                  />

                  <button
                    type="button"
                    onClick={() => feedFileInputRef.current?.click()}
                    disabled={isUploadingPhoto}
                    className="w-full sm:w-auto px-3 py-1.5 bg-[#3869A0] hover:bg-[#2c537f] text-white rounded font-bold text-xs flex items-center justify-center gap-1.5 transition cursor-pointer shadow-xs"
                  >
                    {isUploadingPhoto ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        <span>Subiendo foto...</span>
                      </>
                    ) : (
                      <>
                        <Upload className="w-3.5 h-3.5" />
                        <span>Subir desde tu equipo</span>
                      </>
                    )}
                  </button>

                  <span className="text-[10px] text-gray-400 font-semibold">o escribe enlace:</span>

                  <input
                    type="url"
                    placeholder="https://..."
                    value={attachedPhotoUrl.startsWith('data:') ? 'Foto local cargada' : attachedPhotoUrl}
                    onChange={e => setAttachedPhotoUrl(e.target.value)}
                    disabled={attachedPhotoUrl.startsWith('data:')}
                    className="flex-1 w-full p-1.5 text-xs bg-white rounded border border-gray-300 focus:outline-none"
                  />
                </div>

                {attachedPhotoUrl && (
                  <div className="mt-1 flex items-center gap-2 p-1.5 bg-white rounded border border-gray-200">
                    <img src={attachedPhotoUrl} alt="Preview" className="w-14 h-14 object-cover rounded border border-gray-300 shadow-2xs" />
                    <div>
                      <span className="text-[11px] font-bold text-emerald-700 block">✓ Foto adjuntada lista para publicar</span>
                      <button 
                        type="button" 
                        onClick={() => setAttachedPhotoUrl('')}
                        className="text-red-500 text-[10px] hover:underline font-semibold cursor-pointer mt-0.5"
                      >
                        Quitar foto
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            <div className="flex items-center justify-between pt-1">
              <div className="flex items-center gap-2 text-gray-500 text-xs">
                <button
                  type="button"
                  onClick={() => setShowPhotoInput(!showPhotoInput)}
                  className="flex items-center gap-1 hover:text-[#3869A0] px-2 py-1 rounded hover:bg-gray-100 transition cursor-pointer"
                  title="Adjuntar foto al estado"
                >
                  <Camera className="w-3.5 h-3.5 text-gray-600" />
                  <span className="text-[11px]">Foto</span>
                </button>

                <button
                  type="button"
                  onClick={() => setStatusText(prev => prev + ' :)')}
                  className="flex items-center gap-1 hover:text-[#3869A0] px-2 py-1 rounded hover:bg-gray-100 transition cursor-pointer"
                  title="Añadir emoticono retro"
                >
                  <Smile className="w-3.5 h-3.5 text-gray-600" />
                  <span className="text-[11px]">Emoticono</span>
                </button>
              </div>

              <button
                type="submit"
                disabled={!statusText.trim() && !attachedPhotoUrl}
                className="px-4 py-1.5 bg-[#3869A0] hover:bg-[#2c537f] disabled:bg-gray-300 text-white font-bold text-xs rounded transition shadow-xs flex items-center gap-1.5 cursor-pointer disabled:cursor-not-allowed"
              >
                <Send className="w-3 h-3" />
                <span>Publicar</span>
              </button>
            </div>
          </form>
        </div>

        {/* Novedades Filter Tabs */}
        <div className="flex items-center justify-between border-b border-[#ccd5df] pb-1 px-1 text-xs">
          <div className="flex items-center gap-1 sm:gap-2 font-semibold">
            <span className="font-bold text-gray-800 mr-1 text-sm">Novedades</span>
            <button
              onClick={() => setActiveFilter('todos')}
              className={`px-2.5 py-1 rounded transition cursor-pointer ${
                activeFilter === 'todos' ? 'bg-[#3869A0] text-white shadow-xs' : 'text-gray-600 hover:bg-gray-200'
              }`}
            >
              Todas
            </button>
            <button
              onClick={() => setActiveFilter('estados')}
              className={`px-2.5 py-1 rounded transition cursor-pointer ${
                activeFilter === 'estados' ? 'bg-[#3869A0] text-white shadow-xs' : 'text-gray-600 hover:bg-gray-200'
              }`}
            >
              Estados
            </button>
            <button
              onClick={() => setActiveFilter('fotos')}
              className={`px-2.5 py-1 rounded transition cursor-pointer ${
                activeFilter === 'fotos' ? 'bg-[#3869A0] text-white shadow-xs' : 'text-gray-600 hover:bg-gray-200'
              }`}
            >
              Fotos
            </button>
            <button
              onClick={() => setActiveFilter('tablon')}
              className={`px-2.5 py-1 rounded transition cursor-pointer ${
                activeFilter === 'tablon' ? 'bg-[#3869A0] text-white shadow-xs' : 'text-gray-600 hover:bg-gray-200'
              }`}
            >
              Tablón
            </button>
          </div>
        </div>

        {/* Feed Items List */}
        <div className="space-y-3">
          {filteredFeed.length === 0 ? (
            <div className="bg-white rounded border border-[#ccd5df] p-8 text-center text-gray-500 text-xs">
              No hay novedades para este filtro. ¡Sé el primero en compartir algo!
            </div>
          ) : (
            filteredFeed.map(item => (
              <div key={item.id} className="bg-white rounded border border-[#ccd5df] p-3 shadow-xs space-y-2.5 text-xs">
                {/* Header: Propietario / Event info */}
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2.5">
                    <img
                      src={item.propietarioAvatar}
                      alt={item.propietarioNombre}
                      className="w-9 h-9 rounded object-cover border border-gray-300 cursor-pointer hover:opacity-90"
                      onClick={() => viewUserProfile(item.propietarioId)}
                    />
                    <div>
                      <div className="font-bold text-gray-900 leading-tight">
                        <span 
                          onClick={() => viewUserProfile(item.propietarioId)}
                          className="text-[#3869A0] hover:underline cursor-pointer"
                        >
                          {item.propietarioNombre}
                        </span>

                        {item.tipo === 'amistad' && item.visitanteNombre && (
                          <span className="text-gray-600 font-normal">
                            {' '}y{' '}
                            <span 
                              onClick={() => item.visitanteId && viewUserProfile(item.visitanteId)}
                              className="text-[#3869A0] font-bold hover:underline cursor-pointer"
                            >
                              {item.visitanteNombre}
                            </span>
                            {' '}ahora son amigos en Inkorium.
                          </span>
                        )}

                        {item.tipo === 'tablon' && item.visitanteNombre && (
                          <span className="text-gray-600 font-normal">
                            {' '}ha recibido una firma en su tablón de{' '}
                            <span 
                              onClick={() => item.visitanteId && viewUserProfile(item.visitanteId)}
                              className="text-[#3869A0] font-bold hover:underline cursor-pointer"
                            >
                              {item.visitanteNombre}
                            </span>
                          </span>
                        )}

                        {item.tipo === 'foto' && (
                          <span className="text-gray-600 font-normal"> ha subido una nueva foto</span>
                        )}
                      </div>
                      <div className="text-[10px] text-gray-400 flex items-center gap-1 mt-0.5">
                        <Clock className="w-3 h-3" />
                        <span>{item.fecha}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Content body */}
                {item.datos && (
                  <p className="text-gray-800 text-xs whitespace-pre-line leading-relaxed pl-1">
                    {item.datos}
                  </p>
                )}

                {/* Attached Photo */}
                {item.fotoUrl && (
                  <div 
                    onClick={() => viewPhoto(item.fotoId || null)}
                    className="rounded overflow-hidden border border-gray-200 cursor-pointer max-h-80 bg-black/5 flex items-center justify-center group relative"
                  >
                    <img 
                      src={item.fotoUrl} 
                      alt="" 
                      className="w-full max-h-80 object-cover group-hover:scale-[1.01] transition duration-200"
                    />
                    <div className="absolute inset-0 bg-black/10 opacity-0 group-hover:opacity-100 transition flex items-center justify-center text-white font-semibold text-xs">
                      <span className="bg-black/60 px-3 py-1.5 rounded-full backdrop-blur-xs">
                        Ver foto completa
                      </span>
                    </div>
                  </div>
                )}

                {/* Bottom Actions: Likes & Comment toggle */}
                <div className="flex items-center justify-between pt-2 border-t border-gray-100 text-[11px] text-gray-500">
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => likeFeedItem(item.id)}
                      className={`flex items-center gap-1 font-semibold transition cursor-pointer ${
                        item.likes.includes(currentUser.id) ? 'text-red-500' : 'hover:text-[#3869A0]'
                      }`}
                    >
                      <Heart className={`w-3.5 h-3.5 ${item.likes.includes(currentUser.id) ? 'fill-current' : ''}`} />
                      <span>{item.likes.length > 0 ? `${item.likes.length} Me gusta` : 'Me gusta'}</span>
                    </button>

                    <button
                      onClick={() => setOpenComments(prev => ({ ...prev, [item.id]: !prev[item.id] }))}
                      className="flex items-center gap-1 hover:text-[#3869A0] font-semibold transition cursor-pointer"
                    >
                      <MessageCircle className="w-3.5 h-3.5" />
                      <span>{item.comentarios.length > 0 ? `${item.comentarios.length} comentarios` : 'Comentar'}</span>
                    </button>
                  </div>
                </div>

                {/* Comments Section */}
                {(openComments[item.id] || item.comentarios.length > 0) && (
                  <div className="bg-[#f7f9fb] p-2.5 rounded border border-gray-200 space-y-2 mt-2">
                    {/* Comments list */}
                    {item.comentarios.map(c => (
                      <div key={c.id} className="flex items-start gap-2 text-xs">
                        <img src={c.avatar} alt="" className="w-6 h-6 rounded object-cover border border-gray-300 mt-0.5" />
                        <div className="flex-1 bg-white p-2 rounded border border-gray-200">
                          <div className="flex justify-between items-center mb-0.5">
                            <span 
                              onClick={() => viewUserProfile(c.userId)}
                              className="font-bold text-[#3869A0] hover:underline cursor-pointer"
                            >
                              {c.nombre}
                            </span>
                            <span className="text-[9px] text-gray-400">{c.fecha}</span>
                          </div>
                          <p className="text-gray-700 leading-snug">{c.texto}</p>
                        </div>
                      </div>
                    ))}

                    {/* New comment input */}
                    <div className="flex items-center gap-2 pt-1">
                      <img src={currentUser.avatar} alt="" className="w-6 h-6 rounded object-cover" />
                      <input
                        type="text"
                        placeholder="Escribe un comentario..."
                        value={commentInputs[item.id] || ''}
                        onChange={e => setCommentInputs(prev => ({ ...prev, [item.id]: e.target.value }))}
                        onKeyDown={e => {
                          if (e.key === 'Enter') handleAddComment(item.id);
                        }}
                        className="flex-1 bg-white px-2.5 py-1 text-xs rounded border border-gray-300 focus:outline-none focus:border-[#3869A0]"
                      />
                      <button
                        onClick={() => handleAddComment(item.id)}
                        disabled={!commentInputs[item.id]?.trim()}
                        className="px-2.5 py-1 bg-[#3869A0] hover:bg-[#2d5583] disabled:bg-gray-300 text-white font-bold text-[11px] rounded transition cursor-pointer"
                      >
                        Enviar
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>

      {/* ================= RIGHT SIDEBAR ================= */}
      <div className="md:col-span-3 space-y-3">
        {/* Últimas Fotos Widget */}
        <div className="bg-white rounded border border-[#ccd5df] p-3 shadow-xs">
          <div className="font-bold text-xs text-gray-800 pb-2 border-b border-gray-200 mb-2.5 flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <Camera className="w-3.5 h-3.5 text-[#3869A0]" />
              <span>Últimas fotos</span>
            </span>
            <button 
              onClick={() => setActiveTab('fotos')}
              className="text-[10px] text-[#3869A0] hover:underline font-normal cursor-pointer"
            >
              Ver todas ({photos.length})
            </button>
          </div>

          {photos.length === 0 ? (
            <div className="text-center py-4 text-gray-400 text-xs">
              <p>Aún no hay fotos subidas.</p>
              <button
                onClick={onOpenUpload}
                className="mt-2 text-[11px] font-bold text-[#3869A0] hover:underline cursor-pointer"
              >
                + Subir primera foto
              </button>
            </div>
          ) : (
            <div>
              <div className="grid grid-cols-3 gap-1.5">
                {photos.slice(0, 6).map(photo => {
                  const uploader = users.find(u => u.id === photo.uploaderId);
                  return (
                    <div
                      key={photo.id}
                      onClick={() => viewPhoto(photo.id)}
                      className="group relative aspect-square rounded overflow-hidden border border-gray-200 bg-gray-100 cursor-pointer shadow-2xs hover:border-[#3869A0] transition"
                      title={`${photo.titulo || 'Foto'} - ${uploader ? uploader.nombre : ''}`}
                    >
                      <img
                        src={photo.archivo}
                        alt={photo.titulo || 'Foto'}
                        className="w-full h-full object-cover group-hover:scale-105 transition duration-150"
                      />
                      <div className="absolute inset-0 bg-black/35 opacity-0 group-hover:opacity-100 transition flex items-end p-1 text-[9px] text-white font-medium">
                        <span className="truncate drop-shadow-xs">{uploader?.nombre || 'Foto'}</span>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="mt-2.5 pt-2 border-t border-gray-100 flex items-center justify-between text-[11px]">
                <button
                  onClick={onOpenUpload}
                  className="text-[#3869A0] font-bold hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <Upload className="w-3 h-3" />
                  <span>Subir foto</span>
                </button>
                <button
                  onClick={() => setActiveTab('fotos')}
                  className="text-gray-500 hover:text-gray-800 hover:underline cursor-pointer flex items-center gap-0.5"
                >
                  <span>Álbumes</span>
                  <ChevronRight className="w-3 h-3" />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* People You May Know */}
        <div className="bg-white rounded border border-[#ccd5df] p-3 shadow-xs">
          <div className="font-bold text-xs text-gray-800 pb-2 border-b border-gray-200 mb-2 flex items-center justify-between">
            <span>Gente que quizá conozcas</span>
            <button 
              onClick={() => setActiveTab('gente')}
              className="text-[10px] text-[#3869A0] hover:underline font-normal"
            >
              Ver más
            </button>
          </div>

          <div className="space-y-3">
            {nonFriends.slice(0, 4).map(user => {
              const pending = hasPendingRequest(currentUser.id, user.id);
              return (
                <div key={user.id} className="flex items-start gap-2.5">
                  <img
                    src={user.avatar}
                    alt={user.nombre}
                    className="w-10 h-10 rounded object-cover border border-gray-300 cursor-pointer hover:opacity-90 flex-shrink-0"
                    onClick={() => viewUserProfile(user.id)}
                  />
                  <div className="flex-1 overflow-hidden">
                    <h4 
                      onClick={() => viewUserProfile(user.id)}
                      className="font-bold text-xs text-[#3869A0] hover:underline cursor-pointer truncate"
                    >
                      {user.nombre} {user.apellidos}
                    </h4>
                    <p className="text-[10px] text-gray-500 truncate">{user.provincia}</p>
                    
                    {pending ? (
                      <span className="inline-block mt-1 text-[10px] text-gray-500 bg-gray-100 px-2 py-0.5 rounded font-medium">
                        Petición enviada
                      </span>
                    ) : (
                      <button
                        onClick={() => sendFriendRequest(user.id)}
                        className="mt-1 px-2 py-0.5 bg-[#e8f0fe] hover:bg-[#d2e3fc] text-[#3869A0] text-[10px] font-bold rounded flex items-center gap-1 transition cursor-pointer"
                      >
                        <UserPlus className="w-2.5 h-2.5" />
                        <span>Añadir amigo</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Nostalgic Tuenti Banner Widget */}
        <div className="bg-gradient-to-br from-[#3869A0] to-[#254b77] text-white rounded p-3 text-xs shadow-xs space-y-2">
          <div className="flex items-center gap-1.5 font-bold text-sm">
            <span>🎉</span>
            <span>Inkorium 2009 Vibes</span>
          </div>
          <p className="text-blue-100 text-[11px] leading-relaxed">
            Revive la época dorada de las redes sociales: tablón de firmas, fotos etiquetadas, chat en directo y tus amigos de siempre.
          </p>
          <div className="bg-white/10 p-2 rounded border border-white/20 text-[10px] text-blue-100 space-y-1">
            <p>🎧 <b>Hit de la semana:</b> <i>El Canto del Loco - Zapatillas</i></p>
            <p>📸 <b>Tip:</b> ¡Haz clic en las fotos para etiquetar a tus amigos!</p>
          </div>
        </div>

        {/* Spanish Provinces quick search */}
        <div className="bg-white rounded border border-[#ccd5df] p-3 text-xs shadow-xs">
          <div className="font-bold text-gray-800 pb-2 border-b border-gray-200 mb-2">
            Explora por provincia
          </div>
          <div className="flex flex-wrap gap-1">
            {['Madrid', 'Barcelona', 'Valencia', 'Sevilla', 'Málaga', 'Vizcaya', 'Zaragoza', 'Salamanca'].map(prov => (
              <button
                key={prov}
                onClick={() => setActiveTab('gente')}
                className="px-2 py-1 bg-gray-100 hover:bg-blue-50 hover:text-[#3869A0] text-gray-700 rounded text-[10px] font-medium transition cursor-pointer"
              >
                {prov}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
