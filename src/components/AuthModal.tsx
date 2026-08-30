import React, { useState } from 'react';
import { useInkorium } from '../context/InkoriumContext';
import { LogIn, UserPlus, Sparkles, Check, X } from 'lucide-react';
import { PROVINCIAS_ESPANA } from '../types';

export const AuthModal: React.FC<{ isOpen: boolean; onClose: () => void }> = ({ isOpen, onClose }) => {
  const { users, setCurrentUserById, registerNewUser } = useInkorium();

  const [mode, setMode] = useState<'login' | 'registro'>('login');

  // Login form
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginError, setLoginError] = useState('');

  // Register form
  const [regNombre, setRegNombre] = useState('');
  const [regApellidos, setRegApellidos] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regFnac, setRegFnac] = useState('2000-01-01');
  const [regProvincia, setRegProvincia] = useState('Madrid');
  const [regSexo, setRegSexo] = useState<'h' | 'm'>('h');
  const [regTos, setRegTos] = useState(true);
  const [regError, setRegError] = useState('');

  if (!isOpen) return null;

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const user = users.find(u => u.email.toLowerCase() === loginEmail.trim().toLowerCase());
    if (user) {
      setCurrentUserById(user.id);
      onClose();
    } else {
      setLoginError('El email introducido no está registrado. Puedes seleccionar una cuenta demo abajo o registrarte.');
    }
  };

  const handleRegisterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!regNombre.trim() || !regApellidos.trim() || !regEmail.trim()) {
      setRegError('Por favor, completa todos los campos requeridos.');
      return;
    }
    if (!regTos) {
      setRegError('Debes aceptar los términos y condiciones de uso.');
      return;
    }

    registerNewUser(regNombre, regApellidos, regEmail, regSexo, regProvincia, regFnac);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in">
      <div className="bg-white rounded-lg border border-gray-300 max-w-lg w-full p-5 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto text-xs">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-gray-200">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-[#3869A0] text-white flex items-center justify-center font-bold text-xs">
              :)
            </div>
            <div>
              <h2 className="font-bold text-base text-gray-900 leading-tight">Inkorium</h2>
              <p className="text-[11px] text-gray-500">Revive la magia de la auténtica red social</p>
            </div>
          </div>

          <button 
            onClick={onClose}
            className="text-gray-400 hover:text-gray-700 text-lg font-bold cursor-pointer"
          >
            ✕
          </button>
        </div>

        {/* Mode Selector Tabs */}
        <div className="grid grid-cols-2 gap-1 bg-gray-100 p-1 rounded font-bold text-xs">
          <button
            onClick={() => { setMode('login'); setLoginError(''); }}
            className={`py-1.5 rounded text-center transition cursor-pointer ${
              mode === 'login' ? 'bg-white text-[#3869A0] shadow-xs' : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Iniciar sesión
          </button>

          <button
            onClick={() => { setMode('registro'); setRegError(''); }}
            className={`py-1.5 rounded text-center transition cursor-pointer ${
              mode === 'registro' ? 'bg-white text-[#3869A0] shadow-xs' : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Registro de nuevo usuario
          </button>
        </div>

        {/* ================= LOGIN MODE ================= */}
        {mode === 'login' ? (
          <div className="space-y-4">
            {loginError && (
              <div className="p-2.5 bg-red-50 border border-red-200 rounded text-red-700 text-xs">
                {loginError}
              </div>
            )}

            <form onSubmit={handleLoginSubmit} className="space-y-3">
              <div>
                <label className="font-bold text-gray-700 block mb-1">Email:</label>
                <input
                  type="email"
                  placeholder="ejemplo@inkorium.com"
                  value={loginEmail}
                  onChange={e => setLoginEmail(e.target.value)}
                  className="w-full p-2 text-xs rounded border border-gray-300 focus:outline-none focus:border-[#3869A0]"
                  required
                />
              </div>

              <div>
                <label className="font-bold text-gray-700 block mb-1">Contraseña:</label>
                <input
                  type="password"
                  placeholder="Contraseña"
                  value={loginPassword}
                  onChange={e => setLoginPassword(e.target.value)}
                  className="w-full p-2 text-xs rounded border border-gray-300 focus:outline-none focus:border-[#3869A0]"
                />
              </div>

              <div className="pt-2 flex items-center justify-between">
                <button
                  type="submit"
                  className="w-full py-2 bg-[#3869A0] hover:bg-[#2c537f] text-white font-bold rounded transition shadow-xs cursor-pointer text-xs flex items-center justify-center gap-1.5"
                >
                  <LogIn className="w-3.5 h-3.5" />
                  <span>Entrar en Inkorium</span>
                </button>
              </div>
            </form>

            {/* Quick 1-click test accounts */}
            <div className="pt-3 border-t border-gray-200">
              <span className="font-bold text-gray-600 block mb-2 flex items-center gap-1 text-[11px]">
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                <span>O entra directamente como una cuenta existente (1-clic):</span>
              </span>

              <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto">
                {users.map(u => (
                  <button
                    key={u.id}
                    onClick={() => {
                      setCurrentUserById(u.id);
                      onClose();
                    }}
                    className="p-2 border border-gray-200 hover:border-[#3869A0] rounded flex items-center gap-2 text-left bg-gray-50/70 hover:bg-blue-50 transition cursor-pointer"
                  >
                    <img src={u.avatar} alt="" className="w-7 h-7 rounded object-cover border" />
                    <div className="overflow-hidden">
                      <p className="font-bold text-[#3869A0] truncate text-[11px]">{u.nombre} {u.apellidos}</p>
                      <p className="text-[10px] text-gray-500 truncate">{u.provincia}</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        ) : (
          /* ================= REGISTRO MODE ================= */
          <div className="space-y-4">
            {regError && (
              <div className="p-2.5 bg-red-50 border border-red-200 rounded text-red-700 text-xs">
                {regError}
              </div>
            )}

            <form onSubmit={handleRegisterSubmit} className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div>
                  <label className="font-bold text-gray-700 block mb-1">Nombre:</label>
                  <input
                    type="text"
                    placeholder="Tu nombre"
                    value={regNombre}
                    onChange={e => setRegNombre(e.target.value)}
                    className="w-full p-1.5 text-xs rounded border border-gray-300 focus:outline-none focus:border-[#3869A0]"
                    required
                  />
                </div>

                <div>
                  <label className="font-bold text-gray-700 block mb-1">Apellidos:</label>
                  <input
                    type="text"
                    placeholder="Tus apellidos"
                    value={regApellidos}
                    onChange={e => setRegApellidos(e.target.value)}
                    className="w-full p-1.5 text-xs rounded border border-gray-300 focus:outline-none focus:border-[#3869A0]"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-gray-700 block mb-1">Email:</label>
                <input
                  type="email"
                  placeholder="tu@email.com"
                  value={regEmail}
                  onChange={e => setRegEmail(e.target.value)}
                  className="w-full p-1.5 text-xs rounded border border-gray-300 focus:outline-none focus:border-[#3869A0]"
                  required
                />
              </div>

              <div>
                <label className="font-bold text-gray-700 block mb-1">Contraseña:</label>
                <input
                  type="password"
                  placeholder="Crea tu contraseña"
                  value={regPassword}
                  onChange={e => setRegPassword(e.target.value)}
                  className="w-full p-1.5 text-xs rounded border border-gray-300 focus:outline-none focus:border-[#3869A0]"
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div>
                  <label className="font-bold text-gray-700 block mb-1">Fecha de nacimiento:</label>
                  <input
                    type="date"
                    value={regFnac}
                    onChange={e => setRegFnac(e.target.value)}
                    className="w-full p-1.5 text-xs rounded border border-gray-300 focus:outline-none focus:border-[#3869A0]"
                    required
                  />
                </div>

                <div>
                  <label className="font-bold text-gray-700 block mb-1">Provincia:</label>
                  <select
                    value={regProvincia}
                    onChange={e => setRegProvincia(e.target.value)}
                    className="w-full p-1.5 text-xs rounded border border-gray-300 focus:outline-none focus:border-[#3869A0] bg-white"
                  >
                    {PROVINCIAS_ESPANA.map(p => (
                      <option key={p} value={p}>{p}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="font-bold text-gray-700 block mb-1">Sexo:</label>
                <div className="flex items-center gap-4">
                  <label className="flex items-center gap-1.5 cursor-pointer font-medium">
                    <input
                      type="radio"
                      name="sexo"
                      checked={regSexo === 'h'}
                      onChange={() => setRegSexo('h')}
                    />
                    <span>Hombre (Chico)</span>
                  </label>
                  <label className="flex items-center gap-1.5 cursor-pointer font-medium">
                    <input
                      type="radio"
                      name="sexo"
                      checked={regSexo === 'm'}
                      onChange={() => setRegSexo('m')}
                    />
                    <span>Mujer (Chica)</span>
                  </label>
                </div>
              </div>

              <div className="pt-1">
                <label className="flex items-center gap-2 cursor-pointer text-gray-600">
                  <input
                    type="checkbox"
                    checked={regTos}
                    onChange={e => setRegTos(e.target.checked)}
                  />
                  <span>Acepto los términos y condiciones de uso de Inkorium</span>
                </label>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  className="w-full py-2 bg-[#3869A0] hover:bg-[#2c537f] text-white font-bold rounded transition shadow-xs cursor-pointer text-xs flex items-center justify-center gap-1.5"
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  <span>Completar registro</span>
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};
