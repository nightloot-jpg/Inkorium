import React, { useState } from 'react';
import { useInkorium } from '../context/InkoriumContext';
import { ActivityLog } from './ActivityLog';
import { AvatarModal } from './AvatarModal';
import { 
  UserPlus, Mail, MessageSquare, Edit3, Image as ImageIcon, 
  Heart, Calendar, MapPin, Briefcase, Music, Sparkles, 
  Trash2, Send, Check, Shield, UserCheck, Camera, Upload
} from 'lucide-react';

export const ProfileView: React.FC<{ onOpenUpload: () => void }> = ({ onOpenUpload }) => {
  const {
    currentUser,
    users,
    selectedUserId,
    photos,
    albums,
    wallComments,
    postWallComment,
    deleteWallComment,
    viewUserProfile,
    viewPhoto,
    viewAlbum,
    sendFriendRequest,
    isFriend,
    hasPendingRequest,
    getFriendsOf,
    sendPrivateMessage,
    openChatWith,
    updateUserData,
    setActiveTab
  } = useInkorium();

  const profileUser = users.find(u => u.id === selectedUserId) || currentUser;
  const isOwnProfile = profileUser.id === currentUser.id;
  const friendsList = getFriendsOf(profileUser.id);
  const alreadyFriend = isFriend(currentUser.id, profileUser.id);
  const pendingReq = hasPendingRequest(currentUser.id, profileUser.id);

  const [wallInput, setWallInput] = useState('');
  const [editingStatus, setEditingStatus] = useState(false);
  const [newStatusText, setNewStatusText] = useState(profileUser.estado);
  const [showDirectMessageModal, setShowDirectMessageModal] = useState(false);
  const [showAvatarModal, setShowAvatarModal] = useState(false);
  const [mpSubject, setMpSubject] = useState('');
  const [mpBody, setMpBody] = useState('');

  // Photos of this user
  const userPhotos = photos.filter(p => p.uploaderId === profileUser.id);
  // Tagged photos
  const taggedPhotos = photos.filter(p => p.etiquetas.some(t => t.userId === profileUser.id));
  // User's custom albums
  const userAlbums = albums.filter(a => a.userId === profileUser.id);

  // Wall comments for this user
  const userWallComments = wallComments.filter(w => w.receptorId === profileUser.id);

  // Calculate age from fnac
  const birthYear = parseInt(profileUser.fnac.split('-')[0], 10) || 1993;
  const userAge = new Date().getFullYear() - birthYear;

  const handleSendWall = (e: React.FormEvent) => {
    e.preventDefault();
    if (!wallInput.trim()) return;
    postWallComment(profileUser.id, wallInput);
    setWallInput('');
  };

  const handleSaveStatus = () => {
    if (newStatusText.trim()) {
      updateUserData({ estado: newStatusText.trim(), estadoFecha: 'Ahora mismo' });
    }
    setEditingStatus(false);
  };

  const handleSendMp = (e: React.FormEvent) => {
    e.preventDefault();
    if (!mpBody.trim()) return;
    sendPrivateMessage(profileUser.id, mpSubject || 'Mensaje desde el perfil', mpBody);
    setMpSubject('');
    setMpBody('');
    setShowDirectMessageModal(false);
  };

  return (
    <div className="w-full max-w-[1720px] 2xl:max-w-[1850px] mx-auto px-3 sm:px-6 lg:px-8 py-4 space-y-4">
      {/* ================= PROFILE HEADER BANNER ================= */}
      <div className="bg-white rounded border border-[#ccd5df] p-4 shadow-xs">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          {/* Avatar & Main details */}
          <div className="flex items-center gap-4">
            <div className="relative group">
              <img
                src={profileUser.avatar}
                alt={profileUser.nombre}
                className="w-20 h-20 sm:w-24 sm:h-24 rounded object-cover border-2 border-gray-200 shadow-sm"
              />
              {isOwnProfile && (
                <button
                  onClick={() => setShowAvatarModal(true)}
                  className="absolute inset-0 bg-black/60 text-white text-[10px] font-bold opacity-0 group-hover:opacity-100 transition rounded flex flex-col items-center justify-center cursor-pointer"
                  title="Cambiar foto de perfil / Avatar"
                >
                  <Camera className="w-4 h-4 mb-0.5" />
                  <span>Cambiar foto</span>
                </button>
              )}
            </div>

            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-bold text-gray-900 leading-tight">
                  {profileUser.nombre} {profileUser.apellidos}
                </h1>
                {profileUser.online ? (
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-xs" title="En línea ahora" />
                ) : (
                  <span className="w-2.5 h-2.5 rounded-full bg-gray-300" title="Desconectado" />
                )}
              </div>

              <p className="text-xs text-gray-600 font-medium flex items-center gap-2">
                <span>{userAge} años</span>
                <span>•</span>
                <span className="flex items-center gap-0.5"><MapPin className="w-3 h-3 text-gray-400" /> {profileUser.ciudad || profileUser.provincia}</span>
                <span>•</span>
                <span className="text-[#3869A0] font-semibold">{profileUser.situacionSentimental}</span>
              </p>

              {/* Status Quote bubble */}
              {!editingStatus ? (
                <div className="p-2 bg-[#f4f7fa] rounded border border-gray-200 text-xs text-gray-700 italic relative max-w-xl">
                  <span className="text-[#3869A0] font-serif font-bold text-sm leading-none">“</span>
                  <span>{profileUser.estado}</span>
                  <span className="text-[#3869A0] font-serif font-bold text-sm leading-none">”</span>
                  {isOwnProfile && (
                    <button
                      onClick={() => {
                        setNewStatusText(profileUser.estado);
                        setEditingStatus(true);
                      }}
                      className="ml-2 text-[10px] text-[#3869A0] hover:underline not-italic font-bold cursor-pointer"
                    >
                      Editar
                    </button>
                  )}
                </div>
              ) : (
                <div className="flex items-center gap-2 mt-1">
                  <input
                    type="text"
                    value={newStatusText}
                    onChange={e => setNewStatusText(e.target.value)}
                    className="text-xs p-1.5 rounded border border-[#3869A0] bg-white w-full max-w-md focus:outline-none"
                    placeholder="Escribe tu nuevo estado..."
                    autoFocus
                  />
                  <button
                    onClick={handleSaveStatus}
                    className="px-2.5 py-1 bg-[#3869A0] text-white text-xs font-bold rounded hover:bg-[#2c537f] cursor-pointer"
                  >
                    Guardar
                  </button>
                  <button
                    onClick={() => setEditingStatus(false)}
                    className="px-2.5 py-1 bg-gray-200 text-gray-700 text-xs rounded hover:bg-gray-300 cursor-pointer"
                  >
                    Cancelar
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Action buttons (Friendship, MP, Chat, Edit) */}
          <div className="flex flex-wrap items-center gap-2 self-start sm:self-center">
            {!isOwnProfile ? (
              <>
                {alreadyFriend ? (
                  <div className="flex items-center gap-1 px-3 py-1.5 bg-emerald-50 text-emerald-700 border border-emerald-300 rounded text-xs font-bold">
                    <UserCheck className="w-3.5 h-3.5" />
                    <span>Sois amigos</span>
                  </div>
                ) : pendingReq ? (
                  <div className="px-3 py-1.5 bg-gray-100 text-gray-600 rounded text-xs font-medium">
                    Petición enviada
                  </div>
                ) : (
                  <button
                    onClick={() => sendFriendRequest(profileUser.id)}
                    className="px-3 py-1.5 bg-[#3869A0] hover:bg-[#2c537f] text-white rounded text-xs font-bold flex items-center gap-1.5 shadow-xs transition cursor-pointer"
                  >
                    <UserPlus className="w-3.5 h-3.5" />
                    <span>Añadir amigo</span>
                  </button>
                )}

                <button
                  onClick={() => setShowDirectMessageModal(true)}
                  className="px-3 py-1.5 bg-white hover:bg-gray-50 text-gray-700 border border-gray-300 rounded text-xs font-bold flex items-center gap-1.5 shadow-xs transition cursor-pointer"
                >
                  <Mail className="w-3.5 h-3.5 text-[#3869A0]" />
                  <span>Mensaje</span>
                </button>

                <button
                  onClick={() => openChatWith(profileUser.id)}
                  className="px-3 py-1.5 bg-[#e8f0fe] hover:bg-[#d2e3fc] text-[#3869A0] border border-[#bcd0ee] rounded text-xs font-bold flex items-center gap-1.5 shadow-xs transition cursor-pointer"
                >
                  <MessageSquare className="w-3.5 h-3.5" />
                  <span>Chat en vivo</span>
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={() => setShowAvatarModal(true)}
                  className="px-3 py-1.5 bg-white hover:bg-gray-50 text-gray-700 border border-gray-300 rounded text-xs font-bold flex items-center gap-1.5 shadow-xs transition cursor-pointer"
                >
                  <Camera className="w-3.5 h-3.5 text-[#3869A0]" />
                  <span>Cambiar avatar</span>
                </button>
                <button
                  onClick={() => setActiveTab('ajustes')}
                  className="px-3 py-1.5 bg-white hover:bg-gray-50 text-gray-700 border border-gray-300 rounded text-xs font-bold flex items-center gap-1.5 shadow-xs transition cursor-pointer"
                >
                  <Edit3 className="w-3.5 h-3.5 text-gray-600" />
                  <span>Editar mis datos</span>
                </button>
                <button
                  onClick={onOpenUpload}
                  className="px-3 py-1.5 bg-[#3869A0] hover:bg-[#2c537f] text-white rounded text-xs font-bold flex items-center gap-1.5 shadow-xs transition cursor-pointer"
                >
                  <ImageIcon className="w-3.5 h-3.5" />
                  <span>Subir fotos</span>
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* ================= THREE COLUMN PROFILE CONTENT ================= */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* ================= LEFT COLUMN: PERSONAL INFO ================= */}
        <div className="lg:col-span-3 space-y-4">
          {/* Datos Personales Card */}
          <div className="bg-white rounded border border-[#ccd5df] p-3 text-xs shadow-xs space-y-3">
            <div className="font-bold text-gray-800 pb-1.5 border-b border-gray-200 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-[#3869A0]" />
              <span>Información personal</span>
            </div>

            <div className="space-y-2 text-gray-700">
              <div className="flex items-start justify-between">
                <span className="text-gray-400 font-medium">Nombre:</span>
                <span className="font-semibold text-right">{profileUser.nombre} {profileUser.apellidos}</span>
              </div>
              <div className="flex items-start justify-between">
                <span className="text-gray-400 font-medium">Cumpleaños:</span>
                <span className="font-semibold text-right">{profileUser.fnac} ({userAge} años)</span>
              </div>
              <div className="flex items-start justify-between">
                <span className="text-gray-400 font-medium">Sexo:</span>
                <span className="font-semibold text-right">{profileUser.sexo === 'h' ? 'Chico (Hombre)' : 'Chica (Mujer)'}</span>
              </div>
              <div className="flex items-start justify-between">
                <span className="text-gray-400 font-medium">Provincia:</span>
                <span className="font-semibold text-right">{profileUser.provincia}</span>
              </div>
              <div className="flex items-start justify-between">
                <span className="text-gray-400 font-medium">Situación:</span>
                <span className="font-semibold text-right text-[#3869A0]">{profileUser.situacionSentimental}</span>
              </div>

              {profileUser.ocupacion && (
                <div className="pt-1 border-t border-gray-100">
                  <span className="text-gray-400 font-medium block mb-0.5">Ocupación / Estudios:</span>
                  <p className="font-semibold text-gray-800">{profileUser.ocupacion}</p>
                </div>
              )}

              {profileUser.intereses && (
                <div className="pt-1 border-t border-gray-100">
                  <span className="text-gray-400 font-medium block mb-0.5">Intereses y aficiones:</span>
                  <p className="text-gray-700">{profileUser.intereses}</p>
                </div>
              )}

              {profileUser.musica && (
                <div className="pt-1 border-t border-gray-100">
                  <span className="text-gray-400 font-medium block mb-0.5 flex items-center gap-1">
                    <Music className="w-3 h-3 text-[#3869A0]" />
                    <span>Música favorita:</span>
                  </span>
                  <p className="text-gray-700">{profileUser.musica}</p>
                </div>
              )}

              <div className="pt-2 border-t border-gray-100 text-[10px] text-gray-400">
                Registrado en Inkorium el {profileUser.fechaReg}
              </div>
            </div>
          </div>
        </div>

        {/* ================= CENTER COLUMN: ALBUMS & TABLÓN (WALL) ================= */}
        <div className="lg:col-span-6 space-y-4">
          {/* Albums & Tagged Photos Preview */}
          <div className="bg-white rounded border border-[#ccd5df] p-3 text-xs shadow-xs space-y-3">
            <div className="font-bold text-gray-800 pb-2 border-b border-gray-200 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <ImageIcon className="w-3.5 h-3.5 text-[#3869A0]" />
                <span>Fotos y Álbumes ({userPhotos.length + taggedPhotos.length} fotos)</span>
              </span>
              <button
                onClick={() => setActiveTab('fotos')}
                className="text-[11px] text-[#3869A0] hover:underline font-semibold cursor-pointer"
              >
                Ver todos los álbumes
              </button>
            </div>

            {/* Quick mini albums showcase */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {/* Fotos subidas */}
              <div 
                onClick={() => setActiveTab('fotos')}
                className="border border-gray-200 rounded p-2 hover:bg-blue-50/50 cursor-pointer transition text-center group"
              >
                <div className="h-28 rounded bg-gray-100 overflow-hidden mb-1.5 flex items-center justify-center border">
                  {userPhotos[0] ? (
                    <img src={userPhotos[0].archivo} alt="" className="w-full h-full object-cover group-hover:scale-105 transition" />
                  ) : (
                    <ImageIcon className="w-8 h-8 text-gray-300" />
                  )}
                </div>
                <p className="font-bold text-[#3869A0] group-hover:underline text-[11px] truncate">Fotos subidas</p>
                <span className="text-[10px] text-gray-400">{userPhotos.length} foto(s)</span>
              </div>

              {/* Fotos etiquetadas */}
              <div 
                onClick={() => setActiveTab('fotos')}
                className="border border-gray-200 rounded p-2 hover:bg-blue-50/50 cursor-pointer transition text-center group"
              >
                <div className="h-28 rounded bg-gray-100 overflow-hidden mb-1.5 flex items-center justify-center border">
                  {taggedPhotos[0] ? (
                    <img src={taggedPhotos[0].archivo} alt="" className="w-full h-full object-cover group-hover:scale-105 transition" />
                  ) : (
                    <ImageIcon className="w-8 h-8 text-gray-300" />
                  )}
                </div>
                <p className="font-bold text-[#3869A0] group-hover:underline text-[11px] truncate">Fotos etiquetadas</p>
                <span className="text-[10px] text-gray-400">{taggedPhotos.length} foto(s)</span>
              </div>

              {/* Custom albums */}
              {userAlbums.slice(0, 2).map(alb => {
                const albPhoto = photos.find(p => p.albumId === alb.id);
                return (
                  <div 
                    key={alb.id}
                    onClick={() => viewAlbum(alb.id)}
                    className="border border-gray-200 rounded p-2 hover:bg-blue-50/50 cursor-pointer transition text-center group"
                  >
                    <div className="h-28 rounded bg-gray-100 overflow-hidden mb-1.5 flex items-center justify-center border">
                      {albPhoto ? (
                        <img src={albPhoto.archivo} alt="" className="w-full h-full object-cover group-hover:scale-105 transition" />
                      ) : (
                        <ImageIcon className="w-8 h-8 text-gray-300" />
                      )}
                    </div>
                    <p className="font-bold text-[#3869A0] group-hover:underline text-[11px] truncate">{alb.nombre}</p>
                    <span className="text-[10px] text-gray-400">Álbum personal</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* ================= TABLÓN DE COMENTARIOS (WALL) ================= */}
          <div className="bg-white rounded border border-[#ccd5df] p-3 text-xs shadow-xs space-y-3">
            <div className="font-bold text-gray-800 pb-2 border-b border-gray-200 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <MessageSquare className="w-3.5 h-3.5 text-[#3869A0]" />
                <span>Tablón de firmas de {profileUser.nombre} ({userWallComments.length})</span>
              </span>
            </div>

            {/* Input to write on wall */}
            <form onSubmit={handleSendWall} className="space-y-2">
              <textarea
                value={wallInput}
                onChange={e => setWallInput(e.target.value)}
                placeholder={`Escribe algo en el tablón de ${isOwnProfile ? 'tu perfil' : profileUser.nombre}...`}
                rows={2}
                className="w-full p-2.5 text-xs rounded border border-gray-300 focus:outline-none focus:ring-1 focus:ring-[#3869A0] focus:border-[#3869A0] resize-none"
              />
              <div className="flex justify-between items-center">
                <span className="text-[10px] text-gray-400">
                  ¡Déjale una firma o saludo nostálgico! :)
                </span>
                <button
                  type="submit"
                  disabled={!wallInput.trim()}
                  className="px-3.5 py-1.5 bg-[#3869A0] hover:bg-[#2c537f] disabled:bg-gray-300 text-white font-bold text-xs rounded transition flex items-center gap-1.5 cursor-pointer disabled:cursor-not-allowed shadow-xs"
                >
                  <Send className="w-3 h-3" />
                  <span>Firmar tablón</span>
                </button>
              </div>
            </form>

            {/* Wall Comments Stream */}
            <div className="divide-y divide-gray-100 pt-2 space-y-3">
              {userWallComments.length === 0 ? (
                <div className="py-8 text-center text-gray-400 text-xs">
                  Todavía no hay comentarios en este tablón. ¡Sé el primero en firmar!
                </div>
              ) : (
                userWallComments.map(comment => (
                  <div key={comment.id} className="pt-3 first:pt-0 flex items-start gap-3 group">
                    <img
                      src={comment.emisorAvatar}
                      alt={comment.emisorNombre}
                      className="w-10 h-10 rounded object-cover border border-gray-300 cursor-pointer hover:opacity-90 flex-shrink-0"
                      onClick={() => viewUserProfile(comment.emisorId)}
                    />
                    <div className="flex-1 bg-[#f9fafb] p-2.5 rounded border border-gray-200 space-y-1">
                      <div className="flex items-center justify-between">
                        <span
                          onClick={() => viewUserProfile(comment.emisorId)}
                          className="font-bold text-[#3869A0] hover:underline cursor-pointer text-xs"
                        >
                          {comment.emisorNombre}
                        </span>
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] text-gray-400">{comment.fecha}</span>
                          {(isOwnProfile || comment.emisorId === currentUser.id) && (
                            <button
                              onClick={() => deleteWallComment(comment.id)}
                              className="text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition cursor-pointer"
                              title="Borrar comentario del tablón"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </div>
                      <p className="text-gray-800 text-xs whitespace-pre-line leading-relaxed">
                        {comment.comentario}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* ================= RIGHT COLUMN: FRIENDS & ACTIVITY LOG WIDGET ================= */}
        <div className="lg:col-span-3 space-y-4">
          {/* Friends Grid */}
          <div className="bg-white rounded border border-[#ccd5df] p-3 text-xs shadow-xs">
            <div className="font-bold text-gray-800 pb-2 border-b border-gray-200 mb-2.5 flex items-center justify-between">
              <span>Amigos de {profileUser.nombre} ({friendsList.length})</span>
            </div>

            {friendsList.length === 0 ? (
              <p className="text-gray-400 py-3 text-center">Todavía no tiene amigos agregados.</p>
            ) : (
              <div className="grid grid-cols-3 gap-2">
                {friendsList.slice(0, 9).map(friend => (
                  <div
                    key={friend.id}
                    onClick={() => viewUserProfile(friend.id)}
                    className="cursor-pointer group text-center space-y-1"
                  >
                    <img
                      src={friend.avatar}
                      alt={friend.nombre}
                      className="w-full aspect-square object-cover rounded border border-gray-200 group-hover:opacity-80 transition"
                    />
                    <p className="text-[10px] font-semibold text-[#3869A0] group-hover:underline truncate">
                      {friend.nombre}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* ================= REGISTRO DE ACTIVIDAD (ACTIVITY LOG WIDGET) ================= */}
          <ActivityLog 
            userId={profileUser.id} 
            userName={profileUser.nombre} 
            isOwnProfile={isOwnProfile} 
          />
        </div>
      </div>

      {/* ================= PRIVATE MESSAGE MODAL ================= */}
      {showDirectMessageModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white rounded-lg border border-gray-300 max-w-md w-full p-4 shadow-2xl space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-gray-200">
              <h3 className="font-bold text-sm text-gray-800">
                Enviar mensaje privado a {profileUser.nombre}
              </h3>
              <button 
                onClick={() => setShowDirectMessageModal(false)}
                className="text-gray-400 hover:text-gray-700 text-base font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSendMp} className="space-y-2.5 text-xs">
              <div>
                <label className="font-semibold text-gray-700 block mb-1">Asunto:</label>
                <input
                  type="text"
                  placeholder="Escribe el asunto..."
                  value={mpSubject}
                  onChange={e => setMpSubject(e.target.value)}
                  className="w-full p-2 text-xs rounded border border-gray-300 focus:outline-none focus:border-[#3869A0]"
                />
              </div>

              <div>
                <label className="font-semibold text-gray-700 block mb-1">Mensaje:</label>
                <textarea
                  rows={4}
                  placeholder="Escribe tu mensaje privado..."
                  value={mpBody}
                  onChange={e => setMpBody(e.target.value)}
                  className="w-full p-2 text-xs rounded border border-gray-300 focus:outline-none focus:border-[#3869A0] resize-none"
                  required
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowDirectMessageModal(false)}
                  className="px-3 py-1.5 rounded bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={!mpBody.trim()}
                  className="px-4 py-1.5 rounded bg-[#3869A0] hover:bg-[#2c537f] text-white font-bold cursor-pointer shadow-xs disabled:opacity-50"
                >
                  Enviar mensaje
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Avatar Upload / Change Modal */}
      <AvatarModal
        isOpen={showAvatarModal}
        onClose={() => setShowAvatarModal(false)}
      />
    </div>
  );
};
