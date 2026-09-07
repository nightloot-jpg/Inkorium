import React, { useState, useMemo } from 'react';
import { useInkorium } from '../context/InkoriumContext';
import { 
  Users, UserPlus, Trash2, Check, Search, CheckSquare, 
  Square, Shield, Sparkles, X, AlertCircle
} from 'lucide-react';
import { Album } from '../types';

interface CollaboratorsManageModalProps {
  isOpen: boolean;
  onClose: () => void;
  album: Album;
}

export const CollaboratorsManageModal: React.FC<CollaboratorsManageModalProps> = ({
  isOpen,
  onClose,
  album
}) => {
  const { 
    currentUser, 
    users, 
    getFriendsOf, 
    addCollaboratorsToAlbum, 
    removeCollaboratorFromAlbum, 
    updateAlbum 
  } = useInkorium();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedToAdd, setSelectedToAdd] = useState<string[]>([]);
  const [allowAllFriends, setAllowAllFriends] = useState(album.allowAllFriends || false);

  const friendsList = useMemo(() => {
    const friends = getFriendsOf(currentUser.id);
    return friends.length > 0 ? friends : users.filter(u => u.id !== currentUser.id);
  }, [getFriendsOf, currentUser.id, users]);

  // Current collaborators
  const currentCollaboratorIds = useMemo(() => {
    return Array.isArray(album.colaboradoresIds) ? album.colaboradoresIds : [];
  }, [album.colaboradoresIds]);

  const currentCollaboratorUsers = useMemo(() => {
    return users.filter(u => currentCollaboratorIds.includes(u.id));
  }, [users, currentCollaboratorIds]);

  // Friends not yet added as collaborators
  const availableFriendsToAdd = useMemo(() => {
    return friendsList.filter(f => !currentCollaboratorIds.includes(f.id));
  }, [friendsList, currentCollaboratorIds]);

  const filteredFriends = useMemo(() => {
    if (!searchQuery.trim()) return availableFriendsToAdd;
    const q = searchQuery.toLowerCase();
    return availableFriendsToAdd.filter(f => {
      const name = `${f.nombre} ${f.apellidos}`.toLowerCase();
      const nick = (f.username || '').toLowerCase();
      return name.includes(q) || nick.includes(q);
    });
  }, [availableFriendsToAdd, searchQuery]);

  const toggleToAdd = (id: string) => {
    setSelectedToAdd(prev => 
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const handleAddSelected = () => {
    if (selectedToAdd.length === 0) return;
    addCollaboratorsToAlbum(album.id, selectedToAdd);
    setSelectedToAdd([]);
  };

  const handleRemoveCollaborator = (userId: string) => {
    removeCollaboratorFromAlbum(album.id, userId);
  };

  const handleToggleAllowAll = (val: boolean) => {
    setAllowAllFriends(val);
    updateAlbum(album.id, { allowAllFriends: val, isCollaborative: true });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-fade-in">
      <div className="bg-white dark:bg-[#0e1726] rounded-xl border border-gray-300 dark:border-slate-700 max-w-lg w-full p-4 sm:p-5 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-gray-200 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-950 text-[#3869A0] dark:text-blue-400 flex items-center justify-center font-bold">
              <Users className="w-4.5 h-4.5" />
            </div>
            <div>
              <h2 className="font-bold text-sm sm:text-base text-gray-900 dark:text-white leading-tight">
                Colaboradores de "{album.nombre}"
              </h2>
              <p className="text-[11px] text-gray-500 dark:text-gray-400">
                Gestiona qué amigos pueden subir fotos a este álbum
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

        {/* Global Permission Switch */}
        <div className="p-3 rounded-lg bg-blue-50/70 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900/60 flex items-center justify-between gap-3 text-xs">
          <div>
            <span className="font-bold text-gray-900 dark:text-white block">
              Permitir a todos mis amigos
            </span>
            <span className="text-[11px] text-gray-500 dark:text-gray-400">
              Cualquiera de tus amigos podrá subir fotos sin invitación previa
            </span>
          </div>
          <input
            type="checkbox"
            checked={allowAllFriends}
            onChange={e => handleToggleAllowAll(e.target.checked)}
            className="w-4 h-4 text-[#3869A0] rounded focus:ring-[#3869A0] cursor-pointer"
          />
        </div>

        {/* Current Collaborators List */}
        <div className="space-y-2">
          <h3 className="font-bold text-xs text-gray-700 dark:text-gray-200 flex items-center justify-between">
            <span>Colaboradores actuales ({currentCollaboratorUsers.length + 1})</span>
          </h3>

          <div className="max-h-40 overflow-y-auto border border-gray-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 divide-y divide-gray-100 dark:divide-slate-700/60">
            {/* Owner item */}
            <div className="p-2.5 flex items-center justify-between bg-amber-50/50 dark:bg-amber-950/20">
              <div className="flex items-center gap-2 min-w-0">
                <img
                  src={currentUser.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100'}
                  alt=""
                  className="w-7 h-7 rounded-full object-cover border border-amber-300"
                />
                <div className="truncate">
                  <p className="font-bold text-gray-900 dark:text-white text-xs truncate">
                    {currentUser.nombre} {currentUser.apellidos} (Tú)
                  </p>
                  <span className="text-[10px] text-amber-600 dark:text-amber-400 font-semibold flex items-center gap-1">
                    <Shield className="w-3 h-3" /> Creador y Propietario
                  </span>
                </div>
              </div>
            </div>

            {/* Added Collaborators */}
            {currentCollaboratorUsers.map(collab => (
              <div key={collab.id} className="p-2.5 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-slate-700/40 transition">
                <div className="flex items-center gap-2 min-w-0">
                  <img
                    src={collab.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100'}
                    alt=""
                    className="w-7 h-7 rounded-full object-cover border border-gray-200 dark:border-slate-600"
                  />
                  <div className="truncate">
                    <p className="font-bold text-gray-900 dark:text-white text-xs truncate">
                      {collab.nombre} {collab.apellidos}
                    </p>
                    <span className="text-[10px] text-gray-400">
                      Colaborador activo
                    </span>
                  </div>
                </div>

                <button
                  onClick={() => handleRemoveCollaborator(collab.id)}
                  className="text-gray-400 hover:text-red-600 p-1.5 rounded cursor-pointer transition"
                  title="Quitar permisos a este amigo"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Add more friends */}
        <div className="space-y-2 pt-2 border-t border-gray-200 dark:border-slate-800">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-xs text-gray-700 dark:text-gray-200 flex items-center gap-1.5">
              <UserPlus className="w-3.5 h-3.5 text-[#3869A0] dark:text-blue-400" />
              <span>Añadir nuevos amigos colaboradores</span>
            </h3>
            {selectedToAdd.length > 0 && (
              <button
                type="button"
                onClick={handleAddSelected}
                className="px-3 py-1 bg-[#3869A0] hover:bg-[#2c537f] text-white rounded text-xs font-bold transition flex items-center gap-1 cursor-pointer"
              >
                <Check className="w-3 h-3" />
                <span>Añadir ({selectedToAdd.length})</span>
              </button>
            )}
          </div>

          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar amigo por nombre..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-2.5 py-1.5 text-xs rounded-lg border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-gray-900 dark:text-white focus:outline-none"
            />
          </div>

          <div className="max-h-36 overflow-y-auto border border-gray-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 divide-y divide-gray-100 dark:divide-slate-700/60">
            {filteredFriends.length === 0 ? (
              <div className="p-3 text-center text-gray-400 text-xs">
                {availableFriendsToAdd.length === 0 ? 'Todos tus amigos ya son colaboradores.' : 'No se encontraron amigos con esa búsqueda.'}
              </div>
            ) : (
              filteredFriends.map(friend => {
                const isSelected = selectedToAdd.includes(friend.id);
                return (
                  <div
                    key={friend.id}
                    onClick={() => toggleToAdd(friend.id)}
                    className={`p-2 flex items-center justify-between cursor-pointer hover:bg-gray-50 dark:hover:bg-slate-700/50 transition ${
                      isSelected ? 'bg-blue-50 dark:bg-blue-950/40' : ''
                    }`}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <img
                        src={friend.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100'}
                        alt=""
                        className="w-6 h-6 rounded-full object-cover"
                      />
                      <div className="truncate">
                        <p className="font-bold text-gray-900 dark:text-white text-xs truncate">
                          {friend.nombre} {friend.apellidos}
                        </p>
                        <p className="text-[10px] text-gray-400 truncate">
                          {friend.ciudad || friend.provincia || 'España'}
                        </p>
                      </div>
                    </div>
                    {isSelected ? (
                      <CheckSquare className="w-4 h-4 text-[#3869A0] dark:text-blue-400" />
                    ) : (
                      <Square className="w-4 h-4 text-gray-300 dark:text-gray-600" />
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end pt-3 border-t border-gray-200 dark:border-slate-800">
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-gray-100 dark:bg-slate-800 hover:bg-gray-200 dark:hover:bg-slate-700 text-gray-700 dark:text-gray-200 font-bold text-xs cursor-pointer"
          >
            Listo
          </button>
        </div>
      </div>
    </div>
  );
};
