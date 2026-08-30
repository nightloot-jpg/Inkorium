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

  const [generalQuery, setGeneralQuery] = useState('');
  const [nombre, setNombre] = useState('');
  const [apellidos, setApellidos] = useState('');
  const [sexo, setSexo] = useState<string>('');
  const [edadMenor, setEdadMenor] = useState<string>('');
  const [edadMayor, setEdadMayor] = useState<string>('');
  const [provincia, setProvincia] = useState<string>('all');
  const [page, setPage] = useState<number>(1);

  const ITEMS_PER_PAGE = 15;

  // Other users in database (excluding current user)
  const otherUsersInDb = useMemo(() => {
    return users.filter(u => !currentUser?.id || u.id !== currentUser.id);
  }, [users, currentUser?.id]);

  // Filtered list
  const filteredUsers = useMemo(() => {
    return otherUsersInDb.filter(user => {
      // 1. General search box (matches name, username, city, province)
      if (generalQuery.trim()) {
        const q = generalQuery.trim().toLowerCase();
        const matchesGeneral = 
          (user.nombre && user.nombre.toLowerCase().includes(q)) ||
          (user.apellidos && user.apellidos.toLowerCase().includes(q)) ||
          (user.username && user.username.toLowerCase().includes(q)) ||
          (user.full_name && user.full_name.toLowerCase().includes(q)) ||
          (user.ciudad && user.ciudad.toLowerCase().includes(q)) ||
          (user.provincia && user.provincia.toLowerCase().includes(q)) ||
          (user.email && user.email.toLowerCase().includes(q));

        if (!matchesGeneral) return false;
      }

      // 2. Filter by Name / Username
      if (nombre.trim()) {
        const nq = nombre.trim().toLowerCase();
        const matchesName = 
          (user.nombre && user.nombre.toLowerCase().includes(nq)) ||
          (user.username && user.username.toLowerCase().includes(nq)) ||
          (user.full_name && user.full_name.toLowerCase().includes(nq));
        if (!matchesName) return false;
      }

      // 3. Filter by Surname
      if (apellidos.trim()) {
        const aq = apellidos.trim().toLowerCase();
        const matchesSurname = 
          (user.apellidos && user.apellidos.toLowerCase().includes(aq)) ||
          (user.full_name && user.full_name.toLowerCase().includes(aq));
        if (!matchesSurname) return false;
      }

      // 4. Filter by Gender (only if specified)
      if (sexo && user.sexo !== sexo) {
        return false;
      }

      // 5. Filter by Province / City
      if (provincia !== 'all') {
        const pq = provincia.toLowerCase();
        const matchesLocation = 
          (user.provincia && user.provincia.toLowerCase().includes(pq)) ||
          (user.ciudad && user.ciudad.toLowerCase().includes(pq));
        if (!matchesLocation) return false;
      }

      // 6. Filter by Age (only if user explicitly specified min or max)
      const minAge = parseInt(edadMenor, 10);
      const maxAge = parseInt(edadMayor, 10);
      
      if (!isNaN(minAge) || !isNaN(maxAge)) {
        const birthYear = parseInt(user.fnac.split('-')[0], 10);
        if (!isNaN(birthYear)) {
          const userAge = new Date().getFullYear() - birthYear;
          if (!isNaN(minAge) && userAge < minAge) return false;
          if (!isNaN(maxAge) && userAge > maxAge) return false;
        }
      }

      return true;
    });
  }, [otherUsersInDb, generalQuery, nombre, apellidos, sexo, provincia, edadMenor, edadMayor]);

  const totalPages = Math.ceil(filteredUsers.length / ITEMS_PER_PAGE) || 1;
  const paginatedUsers = filteredUsers.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE);

  const handleResetFilters = () => {
    setGeneralQuery('');
    setNombre('');
    setApellidos('');
    setSexo('');
    setEdadMenor('');
    setEdadMayor('');
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

            {/* Búsqueda rápida */}
            <div>
              <label className="font-bold text-gray-700 block mb-1">Búsqueda rápida</label>
              <div className="relative">
                <input
                  type="text"
                  placeholder="Nombre, @usuario, ciudad..."
                  value={generalQuery}
                  onChange={e => { setGeneralQuery(e.target.value); setPage(1); }}
                  className="w-full p-2 pl-7 rounded border border-gray-300 text-xs focus:outline-none focus:border-[#3869A0]"
                />
                <Search className="w-3.5 h-3.5 text-gray-400 absolute left-2 top-2.5" />
              </div>
            </div>

            {/* Nombre o usuario */}
            <div>
              <label className="font-bold text-gray-700 block mb-1">Nombre o @usuario</label>
              <input
                type="text"
                placeholder="Ej. Bárbara, nightloot..."
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
                <option value="">Cualquiera (Todos)</option>
                <option value="m">Chica (Mujer)</option>
                <option value="h">Chico (Hombre)</option>
              </select>
            </div>

            {/* Edad */}
            <div>
              <label className="font-bold text-gray-700 block mb-1">Rango de edad (opcional)</label>
              <div className="flex items-center gap-2">
                <span className="text-gray-500">De</span>
                <input
                  type="number"
                  placeholder="Min"
                  min="1"
                  max="99"
                  value={edadMenor}
                  onChange={e => { setEdadMenor(e.target.value); setPage(1); }}
                  className="w-16 p-1.5 rounded border border-gray-300 text-xs text-center focus:outline-none focus:border-[#3869A0]"
                />
                <span className="text-gray-500">a</span>
                <input
                  type="number"
                  placeholder="Max"
                  min="1"
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
              <label className="font-bold text-gray-700 block mb-1">Por provincia o ciudad</label>
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
                💡 <b>Inkorium:</b> Conecta con personas reales en la comunidad, visualiza sus fotos y participa en sus tablones.
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
              {otherUsersInDb.length > 0 && (
                <span className="text-[11px] text-gray-500 font-medium">
                  Total en Inkorium: {otherUsersInDb.length} {otherUsersInDb.length === 1 ? 'usuario' : 'usuarios'}
                </span>
              )}
            </div>

            {/* Grid of Results */}
            {filteredUsers.length === 0 ? (
              <div className="text-center py-16 px-4 space-y-2">
                <Users className="w-10 h-10 text-gray-300 mx-auto" />
                <p className="text-gray-700 font-bold text-sm">
                  {otherUsersInDb.length === 0
                    ? 'Aún no hay otros usuarios registrados en la base de datos.' 
                    : 'No se han encontrado usuarios con los filtros aplicados.'}
                </p>
                <p className="text-gray-400 text-xs max-w-md mx-auto">
                  {otherUsersInDb.length === 0
                    ? 'Los perfiles que se registren en Supabase aparecerán aquí automáticamente.'
                    : 'Prueba a limpiar los filtros o buscar con otros términos como el nombre de usuario o ciudad.'}
                </p>
                {otherUsersInDb.length > 0 && (
                  <button
                    onClick={handleResetFilters}
                    className="mt-3 px-4 py-2 bg-[#3869A0] text-white font-bold text-xs rounded hover:bg-[#2e5786] transition cursor-pointer shadow-xs"
                  >
                    Restablecer filtros
                  </button>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
                {paginatedUsers.map(user => {
                  const birthYear = parseInt(user.fnac?.split('-')[0], 10);
                  const hasValidAge = !isNaN(birthYear) && birthYear > 1900 && birthYear < new Date().getFullYear();
                  const age = hasValidAge ? new Date().getFullYear() - birthYear : null;
                  
                  const friend = isFriend(currentUser.id, user.id);
                  const pending = hasPendingRequest(currentUser.id, user.id);

                  const displayName = user.full_name || 
                    (user.nombre && user.apellidos ? `${user.nombre} ${user.apellidos}` : (user.nombre || user.username || `Usuario ${user.id.substring(0, 5)}`));
                  const displayLocation = user.ciudad || user.provincia || 'España';

                  return (
                    <div
                      key={user.id}
                      className="border border-gray-200 hover:border-[#3869A0] rounded p-3 bg-white shadow-xs hover:shadow-md transition flex flex-col justify-between"
                    >
                      <div 
                        onClick={() => viewUserProfile(user.id)}
                        className="cursor-pointer group"
                      >
                        <div className="aspect-square rounded bg-gray-100 overflow-hidden mb-2 border border-gray-200 relative">
                          <img
                            src={user.avatar}
                            alt={displayName}
                            className="w-full h-full object-cover group-hover:scale-105 transition duration-200"
                            onError={(e) => {
                              (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=400&auto=format&fit=crop&q=80';
                            }}
                          />
                          {user.online && (
                            <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-emerald-500 rounded-full ring-2 ring-white shadow" title="Conectado" />
                          )}
                        </div>

                        <h3 className="font-bold text-xs text-[#3869A0] group-hover:underline truncate" title={displayName}>
                          {displayName}
                        </h3>
                        
                        {user.username && user.username !== displayName && (
                          <p className="text-[11px] text-gray-500 truncate font-mono">
                            @{user.username}
                          </p>
                        )}

                        <p className="text-[11px] text-gray-500 truncate flex items-center gap-1 mt-0.5">
                          <MapPin className="w-3 h-3 text-gray-400 flex-shrink-0" />
                          <span>{displayLocation}{age ? ` • ${age} años` : ''}</span>
                        </p>

                        {user.estado && (
                          <p className="text-[10px] text-gray-600 line-clamp-1 italic mt-1 bg-gray-50 p-1 rounded border border-gray-100">
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
