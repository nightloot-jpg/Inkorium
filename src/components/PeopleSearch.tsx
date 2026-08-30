import React, { useState, useMemo } from 'react';
import { useInkorium } from '../context/InkoriumContext';
import { Search, UserPlus, Users, MapPin, Check, Filter } from 'lucide-react';
import { PROVINCIAS_ESPANA } from '../types';

export const PeopleSearch: React.FC = () => {
  const {
    currentUser,
    users,
    viewUserProfile,
    sendFriendRequest,
    isFriend,
    hasPendingRequest
  } = useInkorium();

  const [nombre, setNombre] = useState('');
  const [apellidos, setApellidos] = useState('');
  const [sexo, setSexo] = useState<string>('');
  const [edadMenor, setEdadMenor] = useState<string>('14');
  const [edadMayor, setEdadMayor] = useState<string>('60');
  const [provincia, setProvincia] = useState<string>('all');
  const [page, setPage] = useState<number>(1);

  const ITEMS_PER_PAGE = 15;

  // Filtered list
  const filteredUsers = useMemo(() => {
    return users.filter(user => {
      // Don't show current user in search results
      if (user.id === currentUser.id) return false;

      // Filter by name
      if (nombre.trim() && !user.nombre.toLowerCase().includes(nombre.trim().toLowerCase())) {
        return false;
      }

      // Filter by surname
      if (apellidos.trim() && !user.apellidos.toLowerCase().includes(apellidos.trim().toLowerCase())) {
        return false;
      }

      // Filter by gender
      if (sexo && user.sexo !== sexo) {
        return false;
      }

      // Filter by province
      if (provincia !== 'all' && user.provincia.toLowerCase() !== provincia.toLowerCase()) {
        return false;
      }

      // Filter by age
      const birthYear = parseInt(user.fnac.split('-')[0], 10) || 1993;
      const userAge = new Date().getFullYear() - birthYear;
      const minAge = parseInt(edadMenor, 10) || 14;
      const maxAge = parseInt(edadMayor, 10) || 100;

      if (userAge < minAge || userAge > maxAge) {
        return false;
      }

      return true;
    });
  }, [users, currentUser.id, nombre, apellidos, sexo, provincia, edadMenor, edadMayor]);

  const totalPages = Math.ceil(filteredUsers.length / ITEMS_PER_PAGE) || 1;
  const paginatedUsers = filteredUsers.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE);

  const handleResetFilters = () => {
    setNombre('');
    setApellidos('');
    setSexo('');
    setEdadMenor('14');
    setEdadMayor('60');
    setProvincia('all');
    setPage(1);
  };

  return (
    <div className="w-full max-w-[1720px] 2xl:max-w-[1850px] mx-auto px-3 sm:px-6 lg:px-8 py-4">
      <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
        {/* ================= COLUMNA DE FILTROS (SIDEBAR) ================= */}
        <div className="md:col-span-4 lg:col-span-3 space-y-4">
          <div className="bg-white rounded border border-[#ccd5df] p-4 shadow-xs space-y-3.5 text-xs">
            <div className="font-bold text-sm text-gray-800 pb-2 border-b border-gray-200 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Filter className="w-4 h-4 text-[#3869A0]" />
                <span>Buscar gente</span>
              </span>
              <button
                type="button"
                onClick={handleResetFilters}
                className="text-[11px] text-[#3869A0] hover:underline font-normal cursor-pointer"
              >
                Limpiar filtros
              </button>
            </div>

            {/* Nombre */}
            <div>
              <label className="font-bold text-gray-700 block mb-1">Nombre</label>
              <input
                type="text"
                placeholder="Escribe un nombre..."
                value={nombre}
                onChange={e => { setNombre(e.target.value); setPage(1); }}
                className="w-full p-2 rounded border border-gray-300 text-xs focus:outline-none focus:border-[#3869A0]"
              />
            </div>

            {/* Apellidos */}
            <div>
              <label className="font-bold text-gray-700 block mb-1">Apellidos</label>
              <input
                type="text"
                placeholder="Escribe un apellido..."
                value={apellidos}
                onChange={e => { setApellidos(e.target.value); setPage(1); }}
                className="w-full p-2 rounded border border-gray-300 text-xs focus:outline-none focus:border-[#3869A0]"
              />
            </div>

            {/* Sexo */}
            <div>
              <label className="font-bold text-gray-700 block mb-1">Por sexo</label>
              <select
                value={sexo}
                onChange={e => { setSexo(e.target.value); setPage(1); }}
                className="w-full p-2 rounded border border-gray-300 text-xs focus:outline-none focus:border-[#3869A0] bg-white"
              >
                <option value="">Ambos (Chico y Chica)</option>
                <option value="m">Chica (Mujer)</option>
                <option value="h">Chico (Hombre)</option>
              </select>
            </div>

            {/* Edad */}
            <div>
              <label className="font-bold text-gray-700 block mb-1">Por rango de edad</label>
              <div className="flex items-center gap-2">
                <span className="text-gray-500">De</span>
                <input
                  type="number"
                  min="14"
                  max="99"
                  value={edadMenor}
                  onChange={e => { setEdadMenor(e.target.value); setPage(1); }}
                  className="w-16 p-1.5 rounded border border-gray-300 text-xs text-center focus:outline-none focus:border-[#3869A0]"
                />
                <span className="text-gray-500">a</span>
                <input
                  type="number"
                  min="14"
                  max="99"
                  value={edadMayor}
                  onChange={e => { setEdadMayor(e.target.value); setPage(1); }}
                  className="w-16 p-1.5 rounded border border-gray-300 text-xs text-center focus:outline-none focus:border-[#3869A0]"
                />
                <span className="text-gray-500">años</span>
              </div>
            </div>

            {/* Provincia */}
            <div>
              <label className="font-bold text-gray-700 block mb-1">Por provincia</label>
              <select
                value={provincia}
                onChange={e => { setProvincia(e.target.value); setPage(1); }}
                className="w-full p-2 rounded border border-gray-300 text-xs focus:outline-none focus:border-[#3869A0] bg-white"
              >
                <option value="all">Todas las provincias</option>
                {PROVINCIAS_ESPANA.map(prov => (
                  <option key={prov} value={prov}>{prov}</option>
                ))}
              </select>
            </div>

            <div className="pt-2">
              <div className="p-2.5 bg-blue-50/70 border border-blue-200 rounded text-gray-600 text-[11px] leading-relaxed">
                💡 <b>Inkorium Tip:</b> Agrega a gente de tu misma ciudad o provincia para ver sus fotos y firmar en su tablón.
              </div>
            </div>
          </div>
        </div>

        {/* ================= COLUMNA DE RESULTADOS ================= */}
        <div className="md:col-span-8 lg:col-span-9 space-y-4">
          <div className="bg-white rounded border border-[#ccd5df] p-4 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-gray-200">
              <h1 className="text-base sm:text-lg font-bold text-gray-900 flex items-center gap-2">
                <Users className="w-5 h-5 text-[#3869A0]" />
                <span>Resultados de la búsqueda ({filteredUsers.length})</span>
              </h1>
            </div>

            {/* Grid of Results */}
            {filteredUsers.length === 0 ? (
              <div className="text-center py-16 text-gray-400 text-xs">
                No se han encontrado usuarios con estos filtros. Prueba ampliando los criterios de búsqueda.
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
                {paginatedUsers.map(user => {
                  const birthYear = parseInt(user.fnac.split('-')[0], 10) || 1993;
                  const age = new Date().getFullYear() - birthYear;
                  const friend = isFriend(currentUser.id, user.id);
                  const pending = hasPendingRequest(currentUser.id, user.id);

                  return (
                    <div
                      key={user.id}
                      className="border border-gray-200 hover:border-[#3869A0] rounded p-3 bg-white shadow-xs hover:shadow-md transition flex flex-col justify-between"
                    >
                      <div 
                        onClick={() => viewUserProfile(user.id)}
                        className="cursor-pointer group"
                      >
                        <div className="aspect-square rounded bg-gray-100 overflow-hidden mb-2 border relative">
                          <img
                            src={user.avatar}
                            alt={user.nombre}
                            className="w-full h-full object-cover group-hover:scale-105 transition duration-200"
                          />
                          {user.online && (
                            <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-emerald-500 rounded-full ring-2 ring-white shadow" title="Conectado" />
                          )}
                        </div>

                        <h3 className="font-bold text-xs text-[#3869A0] group-hover:underline truncate">
                          {user.nombre} {user.apellidos}
                        </h3>
                        <p className="text-[11px] text-gray-500 truncate flex items-center gap-1 mt-0.5">
                          <MapPin className="w-3 h-3 text-gray-400 flex-shrink-0" />
                          <span>{user.provincia} • {age} años</span>
                        </p>
                        {user.estado && (
                          <p className="text-[10px] text-gray-600 line-clamp-1 italic mt-1 bg-gray-50 p-1 rounded">
                            "{user.estado}"
                          </p>
                        )}
                      </div>

                      {/* Friendship button */}
                      <div className="mt-3 pt-2 border-t border-gray-100">
                        {friend ? (
                          <button
                            disabled
                            className="w-full py-1.5 bg-emerald-50 text-emerald-700 font-bold text-xs rounded border border-emerald-200 flex items-center justify-center gap-1 cursor-default"
                          >
                            <Check className="w-3.5 h-3.5" />
                            <span>Amigos</span>
                          </button>
                        ) : pending ? (
                          <button
                            disabled
                            className="w-full py-1.5 bg-gray-100 text-gray-500 font-semibold text-xs rounded border border-gray-200 cursor-default text-center"
                          >
                            Petición enviada
                          </button>
                        ) : (
                          <button
                            onClick={() => sendFriendRequest(user.id)}
                            className="w-full py-1.5 bg-[#3869A0] hover:bg-[#2c537f] text-white font-bold text-xs rounded transition flex items-center justify-center gap-1 shadow-xs cursor-pointer"
                          >
                            <UserPlus className="w-3.5 h-3.5" />
                            <span>Añadir amigo</span>
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-3 pt-4 border-t border-gray-200 text-xs">
                <button
                  onClick={() => setPage(prev => Math.max(1, prev - 1))}
                  disabled={page <= 1}
                  className="px-3 py-1.5 rounded bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                >
                  &lt; Anterior
                </button>

                <span className="font-bold text-gray-700">
                  Página {page} de {totalPages}
                </span>

                <button
                  onClick={() => setPage(prev => Math.min(totalPages, prev + 1))}
                  disabled={page >= totalPages}
                  className="px-3 py-1.5 rounded bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                >
                  Siguiente &gt;
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
