import React, { useState, useMemo } from 'react';
import { useInkorium } from '../context/InkoriumContext';
import { 
  Users, Folder, Calendar, Plus, Check, Search, 
  Sparkles, Camera, PartyPopper, CheckSquare, Square, X, Info
} from 'lucide-react';
import { SocialEvent } from '../types';

interface CollaborativeAlbumCreateModalProps {
  isOpen: boolean;
  onClose: () => void;
  preselectedEventId?: string;
  onCreated?: (albumId: string) => void;
}

export const CollaborativeAlbumCreateModal: React.FC<CollaborativeAlbumCreateModalProps> = ({
  isOpen,
  onClose,
  preselectedEventId,
  onCreated
}) => {
  const { 
    currentUser, 
    users, 
    events, 
    getFriendsOf, 
    createAlbum, 
    viewAlbum 
  } = useInkorium();

  const [nombre, setNombre] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [isCollaborative, setIsCollaborative] = useState(true);
  const [selectedEventId, setSelectedEventId] = useState<string>(preselectedEventId || '');
  const [permissionType, setPermissionType] = useState<'all_friends' | 'specific_friends'>('all_friends');
  const [selectedFriendIds, setSelectedFriendIds] = useState<string[]>([]);
  const [friendSearchQuery, setFriendSearchQuery] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Available friends list
  const friendsList = useMemo(() => {
    const friends = getFriendsOf(currentUser.id);
    return friends.length > 0 ? friends : users.filter(u => u.id !== currentUser.id);
  }, [getFriendsOf, currentUser.id, users]);

  // When preselectedEventId changes, select it and auto-fill title
  React.useEffect(() => {
    if (preselectedEventId) {
      setSelectedEventId(preselectedEventId);
      const ev = events.find(e => e.id === preselectedEventId);
      if (ev && !nombre) {
        setNombre(`Fotos: ${ev.titulo}`);
        setDescripcion(`Álbum colaborativo de fotos tras el evento "${ev.titulo}" (${ev.fechaTexto} en ${ev.lugar}).`);
      }
    }
  }, [preselectedEventId, events]);

  const filteredFriends = useMemo(() => {
    if (!friendSearchQuery.trim()) return friendsList;
    const q = friendSearchQuery.toLowerCase();
    return friendsList.filter(f => {
      const fullName = `${f.nombre} ${f.apellidos}`.toLowerCase();
      const userNick = (f.username || '').toLowerCase();
      const city = (f.ciudad || f.provincia || '').toLowerCase();
      return fullName.includes(q) || userNick.includes(q) || city.includes(q);
    });
  }, [friendsList, friendSearchQuery]);

  const toggleFriend = (id: string) => {
    setSelectedFriendIds(prev => 
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const handleSelectAllFriends = () => {
    setSelectedFriendIds(friendsList.map(f => f.id));
  };

  const handleDeselectAllFriends = () => {
    setSelectedFriendIds([]);
  };

  const handleSelectEvent = (eventId: string) => {
    setSelectedEventId(eventId);
    if (eventId) {
      const ev = events.find(e => e.id === eventId);
      if (ev) {
        if (!nombre.trim() || nombre.startsWith('Fotos: ')) {
          setNombre(`Fotos: ${ev.titulo}`);
        }
        if (!descripcion.trim() || descripcion.startsWith('Álbum colaborativo')) {
          setDescripcion(`Fotos compartidas de la fiesta "${ev.titulo}" en ${ev.lugar}. ¡Sube las tuyas!`);
        }
        // Auto-select event attendees if specific mode
        const attendeeIds = ev.asistentes.map(a => a.userId).filter(id => id !== currentUser.id);
        if (attendeeIds.length > 0 && selectedFriendIds.length === 0) {
          setSelectedFriendIds(attendeeIds);
        }
      }
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nombre.trim()) {
      setErrorMsg('Por favor introduce un nombre para el álbum.');
      return;
    }

    if (isCollaborative && permissionType === 'specific_friends' && selectedFriendIds.length === 0) {
      setErrorMsg('Selecciona al menos un amigo colaborador o elige "Todos mis amigos".');
      return;
    }

    setErrorMsg(null);

    const allowAllFriends = isCollaborative && permissionType === 'all_friends';
    const finalEvent = events.find(ev => ev.id === selectedEventId);

    const createdId = createAlbum(
      nombre.trim(),
      descripcion.trim() || undefined,
      isCollaborative,
      isCollaborative ? selectedFriendIds : [],
      selectedEventId || undefined,
      allowAllFriends,
      finalEvent?.titulo
    );

    if (createdId) {
      if (onCreated) onCreated(createdId);
      viewAlbum(createdId);
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-fade-in">
      <div className="bg-white dark:bg-[#0e1726] rounded-xl border border-gray-300 dark:border-slate-700 max-w-xl w-full p-4 sm:p-5 shadow-2xl space-y-4 max-h-[92vh] overflow-y-auto">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-gray-200 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-900/50 text-[#3869A0] dark:text-blue-300 flex items-center justify-center font-bold">
              <Users className="w-4.5 h-4.5" />
            </div>
            <div>
              <h2 className="font-bold text-sm sm:text-base text-gray-900 dark:text-white leading-tight">
                Crear Álbum Colaborativo
              </h2>
              <p className="text-[11px] text-gray-500 dark:text-gray-400">
                Permite a varios amigos subir fotos simultáneamente tras un evento o quedada
              </p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 text-lg font-bold cursor-pointer px-1.5 py-0.5 rounded hover:bg-gray-100 dark:hover:bg-slate-800"
          >
            ✕
          </button>
        </div>

        {errorMsg && (
          <div className="p-2.5 rounded-lg bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800/60 text-red-700 dark:text-red-300 text-xs flex items-center gap-2">
            <Info className="w-4 h-4 shrink-0 text-red-500" />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          
          {/* Tipo de Álbum Selector */}
          <div>
            <label className="font-bold text-gray-800 dark:text-gray-200 block mb-1.5">
              Tipo de Álbum:
            </label>
            <div className="grid grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={() => setIsCollaborative(true)}
                className={`p-3 rounded-lg border text-left transition cursor-pointer flex flex-col gap-1 ${
                  isCollaborative 
                    ? 'border-[#3869A0] bg-blue-50/70 dark:bg-blue-950/40 text-gray-900 dark:text-white ring-1 ring-[#3869A0]' 
                    : 'border-gray-200 dark:border-slate-700 hover:bg-gray-50 dark:hover:bg-slate-800/60 text-gray-600 dark:text-gray-300'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs flex items-center gap-1.5 text-[#3869A0] dark:text-blue-400">
                    <Users className="w-3.5 h-3.5" />
                    Colaborativo (Varios amigos)
                  </span>
                  {isCollaborative && <Check className="w-3.5 h-3.5 text-[#3869A0] dark:text-blue-400" />}
                </div>
                <p className="text-[10px] text-gray-500 dark:text-gray-400 leading-normal">
                  Ideal para fiestas, viajes o cumpleaños. Tus amigos suben sus fotos y se agrupan juntas.
                </p>
              </button>

              <button
                type="button"
                onClick={() => setIsCollaborative(false)}
                className={`p-3 rounded-lg border text-left transition cursor-pointer flex flex-col gap-1 ${
                  !isCollaborative 
                    ? 'border-[#3869A0] bg-blue-50/70 dark:bg-blue-950/40 text-gray-900 dark:text-white ring-1 ring-[#3869A0]' 
                    : 'border-gray-200 dark:border-slate-700 hover:bg-gray-50 dark:hover:bg-slate-800/60 text-gray-600 dark:text-gray-300'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs flex items-center gap-1.5 text-gray-800 dark:text-gray-200">
                    <Folder className="w-3.5 h-3.5" />
                    Personal (Solo tú)
                  </span>
                  {!isCollaborative && <Check className="w-3.5 h-3.5 text-[#3869A0] dark:text-blue-400" />}
                </div>
                <p className="text-[10px] text-gray-500 dark:text-gray-400 leading-normal">
                  Solo tú podrás subir fotos a este álbum personal.
                </p>
              </button>
            </div>
          </div>

          {/* Nombre y descripción */}
          <div className="space-y-3">
            <div>
              <label className="font-bold text-gray-700 dark:text-gray-200 block mb-1">
                Nombre del álbum: *
              </label>
              <input
                type="text"
                placeholder="Ej: Fiesta Fin de Curso 2009, Cumple de Laura, Festival..."
                value={nombre}
                onChange={e => setNombre(e.target.value)}
                className="w-full p-2.5 text-xs rounded-lg border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-[#3869A0] focus:border-[#3869A0]"
                required
              />
            </div>

            <div>
              <label className="font-bold text-gray-700 dark:text-gray-200 block mb-1">
                Descripción (opcional):
              </label>
              <textarea
                rows={2}
                placeholder="¡Subid aquí todas las fotos que hicisteis anoche para que no se pierda ninguna!"
                value={descripcion}
                onChange={e => setDescripcion(e.target.value)}
                className="w-full p-2 text-xs rounded-lg border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-[#3869A0] resize-none"
              />
            </div>
          </div>

          {/* Opciones Colaborativas avanzadas */}
          {isCollaborative && (
            <div className="p-3.5 rounded-lg bg-gray-50 dark:bg-slate-900/60 border border-gray-200 dark:border-slate-800 space-y-3.5">
              
              {/* Vincular a un Evento compartido */}
              <div>
                <label className="font-bold text-gray-800 dark:text-gray-200 block mb-1 flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-[#3869A0] dark:text-blue-400" />
                  <span>Vincular a un evento compartido (opcional):</span>
                </label>
                <select
                  value={selectedEventId}
                  onChange={e => handleSelectEvent(e.target.value)}
                  className="w-full p-2 text-xs rounded-lg border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-gray-900 dark:text-white focus:outline-none focus:border-[#3869A0]"
                >
                  <option value="">-- Sin evento vinculado (Quedada o álbum libre) --</option>
                  {events.map(ev => (
                    <option key={ev.id} value={ev.id}>
                      🎉 {ev.titulo} ({ev.fechaTexto} en {ev.lugar})
                    </option>
                  ))}
                </select>
                {selectedEventId && (
                  <p className="text-[10px] text-[#3869A0] dark:text-blue-400 mt-1 flex items-center gap-1">
                    <Sparkles className="w-3 h-3" />
                    El álbum se mostrará directamente en la ficha del evento para que los asistentes lo encuentren al instante.
                  </p>
                )}
              </div>

              {/* ¿Quién puede subir fotos? */}
              <div>
                <label className="font-bold text-gray-800 dark:text-gray-200 block mb-1.5">
                  ¿Quién tiene permiso para subir fotos?
                </label>
                <div className="space-y-1.5">
                  <label className="flex items-center gap-2 text-xs text-gray-700 dark:text-gray-300 cursor-pointer">
                    <input
                      type="radio"
                      name="permissionType"
                      checked={permissionType === 'all_friends'}
                      onChange={() => setPermissionType('all_friends')}
                      className="text-[#3869A0] focus:ring-[#3869A0]"
                    />
                    <span>Todos mis amigos agregados</span>
                  </label>

                  <label className="flex items-center gap-2 text-xs text-gray-700 dark:text-gray-300 cursor-pointer">
                    <input
                      type="radio"
                      name="permissionType"
                      checked={permissionType === 'specific_friends'}
                      onChange={() => setPermissionType('specific_friends')}
                      className="text-[#3869A0] focus:ring-[#3869A0]"
                    />
                    <span>Elegir amigos colaboradores específicos ({selectedFriendIds.length} seleccionados)</span>
                  </label>
                </div>
              </div>

              {/* Selector de amigos específicos */}
              {permissionType === 'specific_friends' && (
                <div className="pt-2 border-t border-gray-200 dark:border-slate-800 space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <div className="relative flex-1">
                      <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-gray-400" />
                      <input
                        type="text"
                        placeholder="Buscar amigos para añadir..."
                        value={friendSearchQuery}
                        onChange={e => setFriendSearchQuery(e.target.value)}
                        className="w-full pl-8 pr-2.5 py-1.5 text-xs rounded border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-gray-900 dark:text-white focus:outline-none"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={handleSelectAllFriends}
                      className="text-[11px] text-[#3869A0] dark:text-blue-400 hover:underline font-semibold"
                    >
                      Todos
                    </button>
                    <span className="text-gray-300">|</span>
                    <button
                      type="button"
                      onClick={handleDeselectAllFriends}
                      className="text-[11px] text-gray-500 hover:underline"
                    >
                      Ninguno
                    </button>
                  </div>

                  {/* List of friends with scroll */}
                  <div className="max-h-36 overflow-y-auto border border-gray-200 dark:border-slate-700 rounded bg-white dark:bg-slate-800 divide-y divide-gray-100 dark:divide-slate-800">
                    {filteredFriends.length === 0 ? (
                      <div className="p-3 text-center text-gray-400 text-[11px]">
                        No se encontraron amigos.
                      </div>
                    ) : (
                      filteredFriends.map(friend => {
                        const isSelected = selectedFriendIds.includes(friend.id);
                        return (
                          <div
                            key={friend.id}
                            onClick={() => toggleFriend(friend.id)}
                            className={`p-2 flex items-center justify-between cursor-pointer hover:bg-gray-50 dark:hover:bg-slate-700/50 transition ${
                              isSelected ? 'bg-blue-50/60 dark:bg-blue-950/40' : ''
                            }`}
                          >
                            <div className="flex items-center gap-2 min-w-0">
                              <img
                                src={friend.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100'}
                                alt=""
                                className="w-6 h-6 rounded-full object-cover border border-gray-200 dark:border-slate-600 shrink-0"
                              />
                              <div className="truncate">
                                <p className="font-bold text-gray-900 dark:text-white truncate text-[11px]">
                                  {friend.nombre} {friend.apellidos}
                                </p>
                                <p className="text-[10px] text-gray-400 truncate">
                                  {friend.ciudad || friend.provincia || 'España'}
                                </p>
                              </div>
                            </div>
                            {isSelected ? (
                              <CheckSquare className="w-4 h-4 text-[#3869A0] dark:text-blue-400 shrink-0" />
                            ) : (
                              <Square className="w-4 h-4 text-gray-300 dark:text-gray-600 shrink-0" />
                            )}
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              )}

              {/* Informative Notice */}
              <div className="p-2.5 rounded bg-blue-100/60 dark:bg-blue-900/30 text-gray-700 dark:text-blue-200 text-[10px] leading-relaxed flex items-start gap-2">
                <Sparkles className="w-3.5 h-3.5 text-[#3869A0] dark:text-blue-400 shrink-0 mt-0.5" />
                <span>
                  Cada foto subida mostrará el nombre y avatar del amigo que la capturó. Podréis ver el álbum completo juntos y filtrar por quién subió cada foto.
                </span>
              </div>
            </div>
          )}

          {/* Action buttons */}
          <div className="flex items-center justify-end gap-2 pt-3 border-t border-gray-200 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-1.5 rounded-lg bg-gray-100 dark:bg-slate-800 hover:bg-gray-200 dark:hover:bg-slate-700 text-gray-700 dark:text-gray-200 font-semibold cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={!nombre.trim()}
              className="px-4 py-1.5 rounded-lg bg-[#3869A0] hover:bg-[#2c537f] text-white font-bold cursor-pointer shadow-xs disabled:opacity-50 flex items-center gap-1.5"
            >
              {isCollaborative ? <Users className="w-3.5 h-3.5" /> : <Folder className="w-3.5 h-3.5" />}
              <span>Crear Álbum {isCollaborative ? 'Colaborativo' : ''}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
