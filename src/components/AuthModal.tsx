import React, { useState, useMemo } from 'react';
import { useInkorium } from '../context/InkoriumContext';
import { LogIn, UserPlus, Sparkles, Check, X, AlertCircle } from 'lucide-react';
import { PROVINCIAS_ESPANA } from '../types';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import {
  validateName,
  validateSurname,
  validateEmail,
  validatePassword,
  validateBirthDate,
  calculatePasswordStrength
} from '../utils/validation';

export const AuthModal: React.FC<{ isOpen: boolean; onClose: () => void }> = ({ isOpen, onClose }) => {
  const { login, registerNewUser, loginAsUser, users } = useInkorium();

  const [mode, setMode] = useState<'login' | 'registro'>('login');
  const [loading, setLoading] = useState(false);

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
  const [regTouched, setRegTouched] = useState<Record<string, boolean>>({});

  // Real-time validations
  const nameValidation = useMemo(() => validateName(regNombre), [regNombre]);
  const surnameValidation = useMemo(() => validateSurname(regApellidos), [regApellidos]);
  const emailValidation = useMemo(() => validateEmail(regEmail, users), [regEmail, users]);
  const passwordValidation = useMemo(() => validatePassword(regPassword), [regPassword]);
  const passwordStrength = useMemo(() => calculatePasswordStrength(regPassword), [regPassword]);
  const birthDateValidation = useMemo(() => validateBirthDate(regFnac), [regFnac]);

  const isRegisterFormValid = 
    nameValidation.isValid &&
    surnameValidation.isValid &&
    emailValidation.isValid &&
    passwordValidation.isValid &&
    birthDateValidation.isValid &&
    regTos;

  const markTouched = (field: string) => {
    setRegTouched(prev => ({ ...prev, [field]: true }));
  };

  if (!isOpen) return null;

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    if (!loginEmail.trim()) {
      setLoginError('Por favor introduce tu correo.');
      return;
    }
    setLoading(true);

    try {
      if (isSupabaseConfigured && supabase) {
        try {
          const { error } = await supabase.auth.signInWithPassword({
            email: loginEmail.trim(),
            password: loginPassword || '123456',
          });

          if (!error) {
            setLoading(false);
            onClose();
            return;
          }
        } catch (supaErr) {
          console.warn('Supabase sign-in error:', supaErr);
        }
      }

      const result = login(loginEmail.trim(), loginPassword);
      setLoading(false);
      if (result.success) {
        onClose();
      } else {
        setLoginError(result.error || 'Credenciales no válidas.');
      }
    } catch (err: any) {
      const result = login(loginEmail.trim(), loginPassword);
      setLoading(false);
      if (result.success) {
        onClose();
      } else {
        setLoginError(err?.message || 'Error al iniciar sesión.');
      }
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setRegError('');

    setRegTouched({
      nombre: true,
      apellidos: true,
      email: true,
      password: true,
      fnac: true,
      tos: true
    });

    if (!nameValidation.isValid) {
      setRegError(nameValidation.message || 'El nombre no es válido.');
      return;
    }

    if (!surnameValidation.isValid) {
      setRegError(surnameValidation.message || 'Los apellidos no son válidos.');
      return;
    }

    if (!emailValidation.isValid) {
      setRegError(emailValidation.message || 'El correo no es válido.');
      return;
    }

    if (!passwordValidation.isValid) {
      setRegError(passwordValidation.message || 'La contraseña debe tener al menos 6 caracteres.');
      return;
    }

    if (!birthDateValidation.isValid) {
      setRegError(birthDateValidation.message || 'Fecha de nacimiento no válida.');
      return;
    }

    if (!regTos) {
      setRegError('Debes aceptar los términos y condiciones de uso.');
      return;
    }

    setLoading(true);

    try {
      if (isSupabaseConfigured && supabase && regPassword) {
        try {
          const { data, error } = await supabase.auth.signUp({
            email: regEmail.trim(),
            password: regPassword,
            options: {
              data: {
                nombre: regNombre.trim(),
                apellidos: regApellidos.trim(),
                provincia: regProvincia,
                fnac: regFnac,
                sexo: regSexo,
                avatar: regSexo === 'h'
                  ? 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=400&auto=format&fit=crop&q=80'
                  : 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80',
              }
            }
          });

          if (data?.user) {
            await (supabase.from('profiles') as any).upsert({
              id: data.user.id,
              nombre: regNombre.trim(),
              apellidos: regApellidos.trim(),
              email: regEmail.trim(),
              provincia: regProvincia,
              ciudad: regProvincia,
              sexo: regSexo,
              fnac: regFnac,
              avatar: regSexo === 'h'
                ? 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=400&auto=format&fit=crop&q=80'
                : 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80',
              online: true,
              estado: '¡Recién llegado a Inkorium!',
              fecha_reg: new Date().toLocaleDateString('es-ES')
            }).select();
          }
        } catch (supaErr) {
          console.warn('Supabase registration error:', supaErr);
        }
      }

      registerNewUser(regNombre, regApellidos, regEmail, regSexo, regProvincia, regFnac);
      setLoading(false);
      onClose();
    } catch (err: any) {
      registerNewUser(regNombre, regApellidos, regEmail, regSexo, regProvincia, regFnac);
      setLoading(false);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in">
      <div className="bg-white rounded-lg border border-gray-300 max-w-md w-full p-5 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto text-xs">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-gray-200">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-[#3869A0] text-white flex items-center justify-center font-bold text-xs">
              :)
            </div>
            <div>
              <h2 className="font-bold text-base text-gray-900 leading-tight">Inkorium</h2>
              <p className="text-[11px] text-gray-500">Inicia sesión con tu cuenta de Supabase</p>
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
            Registro
          </button>
        </div>

        {/* ================= LOGIN MODE ================= */}
        {mode === 'login' ? (
          <div className="space-y-4">
            {loginError && (
              <div className="p-2.5 bg-red-50 border border-red-200 rounded text-red-700 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{loginError}</span>
              </div>
            )}

            <form onSubmit={handleLoginSubmit} className="space-y-3">
              <div>
                <label className="font-bold text-gray-700 block mb-1">Correo electrónico:</label>
                <input
                  type="email"
                  placeholder="usuario@ejemplo.com"
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
                  placeholder="Introduce tu contraseña (opcional)"
                  value={loginPassword}
                  onChange={e => setLoginPassword(e.target.value)}
                  className="w-full p-2 text-xs rounded border border-gray-300 focus:outline-none focus:border-[#3869A0]"
                />
              </div>

              <div className="pt-2 space-y-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-2 bg-[#3869A0] hover:bg-[#2c537f] text-white font-bold rounded transition shadow-xs cursor-pointer text-xs flex items-center justify-center gap-1.5 disabled:opacity-50"
                >
                  <LogIn className="w-3.5 h-3.5" />
                  <span>{loading ? 'Entrando...' : 'Entrar en Inkorium'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    login('nightloot@gmail.com');
                    onClose();
                  }}
                  className="w-full py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded transition shadow-xs cursor-pointer text-xs flex items-center justify-center gap-1.5"
                >
                  <Sparkles className="w-3 h-3" />
                  <span>Acceso rápido: Night Loot</span>
                </button>
              </div>
            </form>

            {/* Quick Demo Access */}
            <div className="pt-3 border-t border-gray-200">
              <span className="text-[11px] font-bold text-gray-700 block mb-1.5">
                Acceso rápido con perfiles de prueba:
              </span>
              <div className="grid grid-cols-2 gap-1.5">
                {users.slice(0, 4).map(demoUser => (
                  <button
                    key={demoUser.id}
                    type="button"
                    onClick={() => {
                      loginAsUser(demoUser.id);
                      onClose();
                    }}
                    className="flex items-center gap-1.5 p-1.5 rounded border border-gray-200 hover:bg-blue-50 text-left transition"
                  >
                    <img
                      src={demoUser.avatar}
                      alt={demoUser.nombre}
                      className="w-6 h-6 rounded-full object-cover"
                    />
                    <span className="text-[11px] font-medium text-gray-800 truncate">
                      {demoUser.nombre}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        ) : (
          /* ================= REGISTRO MODE ================= */
          <div className="space-y-4">
            {regError && (
              <div className="p-2.5 bg-red-50 border border-red-200 rounded text-red-700 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{regError}</span>
              </div>
            )}

            <form onSubmit={handleRegisterSubmit} className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="font-bold text-gray-700">Nombre:</label>
                    {regTouched.nombre && (
                      <span className={`text-[10px] flex items-center gap-0.5 font-medium ${
                        nameValidation.isValid ? 'text-emerald-600' : 'text-red-600'
                      }`}>
                        {nameValidation.isValid ? <Check className="w-3 h-3" /> : <X className="w-3 h-3" />}
                      </span>
                    )}
                  </div>
                  <input
                    type="text"
                    placeholder="Tu nombre"
                    value={regNombre}
                    onChange={e => { setRegNombre(e.target.value); markTouched('nombre'); }}
                    onBlur={() => markTouched('nombre')}
                    className={`w-full p-1.5 text-xs rounded border transition bg-white focus:outline-none ${
                      regTouched.nombre
                        ? nameValidation.isValid
                          ? 'border-emerald-400 focus:border-emerald-500'
                          : 'border-red-400 bg-red-50/30 focus:border-red-500'
                        : 'border-gray-300 focus:border-[#3869A0]'
                    }`}
                    required
                  />
                  {regTouched.nombre && !nameValidation.isValid && (
                    <p className="text-[10px] text-red-600 mt-0.5">{nameValidation.message}</p>
                  )}
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="font-bold text-gray-700">Apellidos:</label>
                    {regTouched.apellidos && (
                      <span className={`text-[10px] flex items-center gap-0.5 font-medium ${
                        surnameValidation.isValid ? 'text-emerald-600' : 'text-red-600'
                      }`}>
                        {surnameValidation.isValid ? <Check className="w-3 h-3" /> : <X className="w-3 h-3" />}
                      </span>
                    )}
                  </div>
                  <input
                    type="text"
                    placeholder="Tus apellidos"
                    value={regApellidos}
                    onChange={e => { setRegApellidos(e.target.value); markTouched('apellidos'); }}
                    onBlur={() => markTouched('apellidos')}
                    className={`w-full p-1.5 text-xs rounded border transition bg-white focus:outline-none ${
                      regTouched.apellidos
                        ? surnameValidation.isValid
                          ? 'border-emerald-400 focus:border-emerald-500'
                          : 'border-red-400 bg-red-50/30 focus:border-red-500'
                        : 'border-gray-300 focus:border-[#3869A0]'
                    }`}
                    required
                  />
                  {regTouched.apellidos && !surnameValidation.isValid && (
                    <p className="text-[10px] text-red-600 mt-0.5">{surnameValidation.message}</p>
                  )}
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="font-bold text-gray-700">Email:</label>
                  {regTouched.email && (
                    <span className={`text-[10px] flex items-center gap-0.5 font-medium ${
                      emailValidation.isValid ? 'text-emerald-600' : 'text-red-600'
                    }`}>
                      {emailValidation.isValid ? <><Check className="w-3 h-3" /> Válido</> : <><X className="w-3 h-3" /> No válido</>}
                    </span>
                  )}
                </div>
                <input
                  type="email"
                  placeholder="tu@email.com"
                  value={regEmail}
                  onChange={e => { setRegEmail(e.target.value); markTouched('email'); }}
                  onBlur={() => markTouched('email')}
                  className={`w-full p-1.5 text-xs rounded border transition bg-white focus:outline-none ${
                    regTouched.email
                      ? emailValidation.isValid
                        ? 'border-emerald-400 focus:border-emerald-500'
                        : 'border-red-400 bg-red-50/30 focus:border-red-500'
                      : 'border-gray-300 focus:border-[#3869A0]'
                  }`}
                  required
                />
                {regTouched.email && !emailValidation.isValid && (
                  <p className="text-[10px] text-red-600 mt-0.5">{emailValidation.message}</p>
                )}
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="font-bold text-gray-700">Contraseña:</label>
                  {regPassword && (
                    <span className={`text-[10px] font-bold ${
                      passwordStrength.score >= 3 ? 'text-emerald-600' : passwordStrength.score === 2 ? 'text-amber-600' : 'text-red-500'
                    }`}>
                      {passwordStrength.label}
                    </span>
                  )}
                </div>
                <input
                  type="password"
                  placeholder="Mínimo 6 caracteres"
                  value={regPassword}
                  onChange={e => { setRegPassword(e.target.value); markTouched('password'); }}
                  onBlur={() => markTouched('password')}
                  className={`w-full p-1.5 text-xs rounded border transition bg-white focus:outline-none ${
                    regTouched.password
                      ? passwordValidation.isValid
                        ? 'border-emerald-400 focus:border-emerald-500'
                        : 'border-red-400 bg-red-50/30 focus:border-red-500'
                      : 'border-gray-300 focus:border-[#3869A0]'
                  }`}
                  required
                />
                {regPassword && (
                  <div className="mt-1 w-full bg-gray-200 h-1 rounded-full overflow-hidden">
                    <div 
                      className={`h-full transition-all duration-300 ${passwordStrength.color}`}
                      style={{ width: `${passwordStrength.percent}%` }}
                    />
                  </div>
                )}
                {regTouched.password && !passwordValidation.isValid && (
                  <p className="text-[10px] text-red-600 mt-0.5">{passwordValidation.message}</p>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="font-bold text-gray-700">Fecha de nacimiento:</label>
                    {birthDateValidation.isValid && birthDateValidation.age !== undefined && (
                      <span className="text-[10px] text-emerald-600 font-medium">({birthDateValidation.age} años)</span>
                    )}
                  </div>
                  <input
                    type="date"
                    value={regFnac}
                    onChange={e => { setRegFnac(e.target.value); markTouched('fnac'); }}
                    onBlur={() => markTouched('fnac')}
                    max={new Date().toISOString().split('T')[0]}
                    className={`w-full p-1.5 text-xs rounded border transition bg-white focus:outline-none ${
                      regTouched.fnac && !birthDateValidation.isValid
                        ? 'border-red-400 bg-red-50/30 focus:border-red-500'
                        : 'border-gray-300 focus:border-[#3869A0]'
                    }`}
                    required
                  />
                  {regTouched.fnac && !birthDateValidation.isValid && (
                    <p className="text-[10px] text-red-600 mt-0.5">{birthDateValidation.message}</p>
                  )}
                </div>

                <div>
                  <label className="font-bold text-gray-700 block mb-1">Provincia:</label>
                  <select
                    value={regProvincia}
                    onChange={e => setRegProvincia(e.target.value)}
                    className="w-full p-1.5 text-xs rounded border border-gray-300 focus:outline-none focus:border-[#3869A0] bg-white cursor-pointer"
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
                  <label className="flex items-center gap-1.5 cursor-pointer font-medium hover:text-[#3869A0]">
                    <input
                      type="radio"
                      name="modal_sexo"
                      checked={regSexo === 'h'}
                      onChange={() => setRegSexo('h')}
                      className="cursor-pointer text-[#3869A0]"
                    />
                    <span>Hombre (Chico)</span>
                  </label>
                  <label className="flex items-center gap-1.5 cursor-pointer font-medium hover:text-[#3869A0]">
                    <input
                      type="radio"
                      name="modal_sexo"
                      checked={regSexo === 'm'}
                      onChange={() => setRegSexo('m')}
                      className="cursor-pointer text-[#3869A0]"
                    />
                    <span>Mujer (Chica)</span>
                  </label>
                </div>
              </div>

              <div className="pt-1">
                <label className="flex items-center gap-2 cursor-pointer text-gray-600 hover:text-gray-900">
                  <input
                    type="checkbox"
                    checked={regTos}
                    onChange={e => { setRegTos(e.target.checked); markTouched('tos'); }}
                    className="cursor-pointer rounded text-[#3869A0]"
                  />
                  <span>Acepto los términos y condiciones de uso</span>
                </label>
                {regTouched.tos && !regTos && (
                  <p className="text-[10px] text-red-600 mt-0.5">Debes aceptar los términos para registrarte.</p>
                )}
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={loading}
                  className={`w-full py-2 text-white font-bold rounded transition shadow-xs cursor-pointer text-xs flex items-center justify-center gap-1.5 ${
                    isRegisterFormValid
                      ? 'bg-emerald-600 hover:bg-emerald-700'
                      : 'bg-[#3869A0] hover:bg-[#2c537f]'
                  } disabled:opacity-50`}
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  <span>{loading ? 'Creando cuenta...' : 'Completar registro'}</span>
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};
