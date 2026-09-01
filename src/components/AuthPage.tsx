import React, { useState, useMemo } from 'react';
import { useInkorium } from '../context/InkoriumContext';
import { 
  LogIn, UserPlus, Sparkles, MessageSquare, 
  Users, ShieldCheck, AlertCircle, CheckCircle2,
  Camera, Lock, Mail, Check, X, ShieldAlert, KeyRound
} from 'lucide-react';
import { PROVINCIAS_ESPANA } from '../types';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import {
  validateName,
  validateSurname,
  validateEmail,
  validatePassword,
  validatePasswordConfirmation,
  validateBirthDate,
  calculatePasswordStrength
} from '../utils/validation';

export const AuthPage: React.FC = () => {
  const { login, registerNewUser, loginAsUser, users } = useInkorium();

  const [mode, setMode] = useState<'login' | 'registro'>('login');
  const [loading, setLoading] = useState(false);

  // Login form state
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(true);
  const [loginError, setLoginError] = useState('');

  // Register form state
  const [regNombre, setRegNombre] = useState('');
  const [regApellidos, setRegApellidos] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regPasswordConfirm, setRegPasswordConfirm] = useState('');
  const [regFnac, setRegFnac] = useState('2001-06-15');
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
  const passwordConfirmValidation = useMemo(
    () => validatePasswordConfirmation(regPassword, regPasswordConfirm),
    [regPassword, regPasswordConfirm]
  );
  const birthDateValidation = useMemo(() => validateBirthDate(regFnac), [regFnac]);

  const isRegisterFormValid = 
    nameValidation.isValid &&
    surnameValidation.isValid &&
    emailValidation.isValid &&
    passwordValidation.isValid &&
    passwordConfirmValidation.isValid &&
    birthDateValidation.isValid &&
    regTos;

  const markTouched = (field: string) => {
    setRegTouched(prev => ({ ...prev, [field]: true }));
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    if (!loginEmail.trim()) {
      setLoginError('Por favor, introduce tu correo electrónico.');
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
            return;
          }
        } catch (supaErr) {
          console.warn('Supabase auth attempt error:', supaErr);
        }
      }

      // Fallback to local / demo user login
      const result = login(loginEmail, loginPassword);
      if (!result.success) {
        setLoginError('No se ha podido iniciar sesión con ese correo.');
      }
    } catch (err: any) {
      // Direct context login fallback
      const result = login(loginEmail, loginPassword);
      if (!result.success) {
        setLoginError(err?.message || 'Error al iniciar sesión.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setRegError('');

    // Marcar todos los campos como tocados para mostrar errores si los hay
    setRegTouched({
      nombre: true,
      apellidos: true,
      email: true,
      password: true,
      passwordConfirm: true,
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
      setRegError(emailValidation.message || 'El correo electrónico no es válido o ya está en uso.');
      return;
    }

    if (!passwordValidation.isValid) {
      setRegError(passwordValidation.message || 'La contraseña debe contener al menos 6 caracteres.');
      return;
    }

    if (!passwordConfirmValidation.isValid) {
      setRegError(passwordConfirmValidation.message || 'Las contraseñas no coinciden.');
      return;
    }

    if (!birthDateValidation.isValid) {
      setRegError(birthDateValidation.message || 'Fecha de nacimiento no válida.');
      return;
    }

    if (!regTos) {
      setRegError('Debes aceptar las condiciones de servicio y privacidad de Inkorium.');
      return;
    }

    setLoading(true);

    try {
      if (isSupabaseConfigured && supabase && regPassword) {
        try {
          await supabase.auth.signUp({
            email: regEmail.trim(),
            password: regPassword,
            options: {
              data: {
                nombre: regNombre.trim(),
                apellidos: regApellidos.trim(),
                sexo: regSexo,
                provincia: regProvincia,
                fnac: regFnac,
              }
            }
          });
        } catch (supaErr) {
          console.warn('Supabase registration fallback:', supaErr);
        }
      }

      // Always ensure user is created in context and logged in
      registerNewUser(regNombre, regApellidos, regEmail, regSexo, regProvincia, regFnac);
    } catch (err: any) {
      registerNewUser(regNombre, regApellidos, regEmail, regSexo, regProvincia, regFnac);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#e8eef4] flex flex-col justify-between selection:bg-[#3869A0] selection:text-white">
      {/* Top Retro Header Bar */}
      <header className="bg-[#3869A0] text-white border-b border-[#2b5380] shadow-sm">
        <div className="w-full max-w-[1720px] 2xl:max-w-[1850px] mx-auto px-4 sm:px-8 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-full bg-white flex items-center justify-center shadow-inner">
              <span className="text-[#3869A0] text-sm font-black select-none tracking-tighter">:)</span>
            </div>
            <div>
              <span className="font-['Comfortaa',sans-serif] text-2xl font-bold tracking-tight text-white select-none">
                inkorium
              </span>
              <span className="hidden sm:inline-block ml-2 text-[11px] text-blue-100 font-medium tracking-wide">
                | La red social de tus amigos
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => { setMode('login'); setLoginError(''); }}
              className={`px-3.5 py-1.5 rounded text-xs font-bold transition cursor-pointer ${
                mode === 'login' 
                  ? 'bg-[#294e77] text-white shadow-inner' 
                  : 'bg-white/10 text-white hover:bg-white/20'
              }`}
            >
              Iniciar sesión
            </button>
            <button
              onClick={() => { setMode('registro'); setRegError(''); }}
              className={`px-3.5 py-1.5 rounded text-xs font-bold transition cursor-pointer ${
                mode === 'registro' 
                  ? 'bg-white text-[#3869A0] shadow-sm' 
                  : 'bg-emerald-500 hover:bg-emerald-600 text-white'
              }`}
            >
              Crear cuenta
            </button>
          </div>
        </div>
      </header>

      {/* Main Panoramic Container */}
      <main className="flex-1 w-full max-w-[1720px] 2xl:max-w-[1850px] mx-auto px-4 sm:px-8 py-8 sm:py-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
          
          {/* Left Column: Nostalgic Pitch & Features (7 cols) */}
          <div className="lg:col-span-7 space-y-6">
            <div className="space-y-3">
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-100 text-[#254b77] border border-blue-200 rounded-full text-xs font-bold shadow-xs">
                <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                <span>La era dorada de las redes sociales (2006–2011)</span>
              </div>
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-gray-900 tracking-tight leading-tight">
                Conecta con tu gente, comparte tus mejores fotos y revive los tablones.
              </h1>
              <p className="text-gray-600 text-sm sm:text-base leading-relaxed max-w-2xl">
                Inkorium es el homenaje a la red social que marcó a toda una generación. Sin algoritmos invasivos ni publicidad: solo tus amigos de verdad, fotos con fecha de cámara digital, firmas y chat en tiempo real.
              </p>
            </div>

            {/* Feature Cards Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-2">
              <div className="bg-white p-4 rounded-lg border border-gray-300 shadow-xs flex items-start gap-3 hover:border-[#3869A0] transition">
                <div className="w-10 h-10 rounded-lg bg-blue-50 text-[#3869A0] flex items-center justify-center flex-shrink-0 font-bold">
                  <Camera className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 text-sm">Álbumes y Fotos Retro</h3>
                  <p className="text-xs text-gray-500 mt-0.5">Sube fotos sin límite, aplica filtros estilo Tuenti/Y2K, rotación y etiqueta a tus amigos en las caras.</p>
                </div>
              </div>

              <div className="bg-white p-4 rounded-lg border border-gray-300 shadow-xs flex items-start gap-3 hover:border-[#3869A0] transition">
                <div className="w-10 h-10 rounded-lg bg-amber-50 text-amber-700 flex items-center justify-center flex-shrink-0 font-bold">
                  <MessageSquare className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 text-sm">Tablón de Firmas</h3>
                  <p className="text-xs text-gray-500 mt-0.5">Pásate por el perfil de tus amigos a dejar una firmita, responder comentarios y actualizar tu estado.</p>
                </div>
              </div>

              <div className="bg-white p-4 rounded-lg border border-gray-300 shadow-xs flex items-start gap-3 hover:border-[#3869A0] transition">
                <div className="w-10 h-10 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center flex-shrink-0 font-bold">
                  <Users className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 text-sm">Buscar Gente por Provincia</h3>
                  <p className="text-xs text-gray-500 mt-0.5">Encuentra a tus compañeros de clase, amigos de fiesta o gente de tu ciudad con el buscador clásico.</p>
                </div>
              </div>

              <div className="bg-white p-4 rounded-lg border border-gray-300 shadow-xs flex items-start gap-3 hover:border-[#3869A0] transition">
                <div className="w-10 h-10 rounded-lg bg-purple-50 text-purple-700 flex items-center justify-center flex-shrink-0 font-bold">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 text-sm">Chat Instantáneo con Sonido</h3>
                  <p className="text-xs text-gray-500 mt-0.5">Ventanas de chat flotantes en la barra inferior con el clásico sonido pop retro al recibir mensajes.</p>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Authentication Card (5 cols) */}
          <div className="lg:col-span-5">
            <div className="bg-white rounded-xl border border-gray-300 shadow-xl overflow-hidden">
              {/* Card Mode Tabs */}
              <div className="grid grid-cols-2 border-b border-gray-200 bg-gray-50 text-xs font-bold text-center">
                <button
                  type="button"
                  onClick={() => { setMode('login'); setLoginError(''); }}
                  className={`py-3.5 px-4 transition cursor-pointer flex items-center justify-center gap-2 ${
                    mode === 'login'
                      ? 'bg-white text-[#3869A0] border-b-2 border-[#3869A0] shadow-2xs font-extrabold'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                  }`}
                >
                  <LogIn className="w-4 h-4" />
                  <span>Iniciar sesión</span>
                </button>
                <button
                  type="button"
                  onClick={() => { setMode('registro'); setRegError(''); }}
                  className={`py-3.5 px-4 transition cursor-pointer flex items-center justify-center gap-2 ${
                    mode === 'registro'
                      ? 'bg-white text-[#3869A0] border-b-2 border-[#3869A0] shadow-2xs font-extrabold'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                  }`}
                >
                  <UserPlus className="w-4 h-4" />
                  <span>Crear nueva cuenta</span>
                </button>
              </div>

              <div className="p-6 sm:p-7">
                {/* ================= LOGIN MODE ================= */}
                {mode === 'login' ? (
                  <div className="space-y-5 text-xs">
                    <div>
                      <h2 className="text-lg font-bold text-gray-900">Entrar a tu cuenta</h2>
                      <p className="text-gray-500 text-xs">Introduce tus credenciales para acceder a tu perfil y tablón</p>
                    </div>

                    {loginError && (
                      <div className="p-3 bg-red-50 border border-red-200 rounded-md text-red-700 text-xs flex items-start gap-2">
                        <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
                        <span>{loginError}</span>
                      </div>
                    )}

                    <form onSubmit={handleLoginSubmit} className="space-y-3.5">
                      <div>
                        <label className="font-bold text-gray-700 block mb-1 flex items-center gap-1.5">
                          <Mail className="w-3.5 h-3.5 text-gray-500" />
                          <span>Correo electrónico:</span>
                        </label>
                        <input
                          type="email"
                          value={loginEmail}
                          onChange={e => setLoginEmail(e.target.value)}
                          placeholder="tu.email@ejemplo.com"
                          className="w-full p-2.5 text-xs rounded-md border border-gray-300 focus:outline-none focus:border-[#3869A0] focus:ring-1 focus:ring-[#3869A0] bg-white"
                          required
                        />
                      </div>

                      <div>
                        <label className="font-bold text-gray-700 block mb-1 flex items-center gap-1.5">
                          <Lock className="w-3.5 h-3.5 text-gray-500" />
                          <span>Contraseña:</span>
                        </label>
                        <input
                          type="password"
                          value={loginPassword}
                          onChange={e => setLoginPassword(e.target.value)}
                          placeholder="Introduce tu contraseña (opcional en preview)"
                          className="w-full p-2.5 text-xs rounded-md border border-gray-300 focus:outline-none focus:border-[#3869A0] focus:ring-1 focus:ring-[#3869A0] bg-white"
                        />
                      </div>

                      <div className="flex items-center justify-between text-xs pt-1">
                        <label className="flex items-center gap-2 text-gray-600 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={rememberMe}
                            onChange={e => setRememberMe(e.target.checked)}
                            className="rounded text-[#3869A0] focus:ring-0"
                          />
                          <span>Recordarme en este equipo</span>
                        </label>

                        <span className="text-[#3869A0] hover:underline cursor-pointer">
                          ¿Has olvidado tu contraseña?
                        </span>
                      </div>

                      <button
                        type="submit"
                        disabled={loading}
                        className="w-full py-2.5 bg-[#3869A0] hover:bg-[#2c537f] text-white font-bold rounded-md transition shadow-md cursor-pointer text-sm flex items-center justify-center gap-2 mt-2 disabled:opacity-50"
                      >
                        <LogIn className="w-4 h-4" />
                        <span>{loading ? 'Entrando...' : 'Entrar en Inkorium'}</span>
                      </button>
                    </form>
                  </div>
                ) : (
                  /* ================= REGISTER MODE ================= */
                  <div className="space-y-4 text-xs">
                    <div>
                      <h2 className="text-lg font-bold text-gray-900">Crear tu cuenta en Inkorium</h2>
                      <p className="text-gray-500 text-xs">Completa el formulario para unirte a la red social</p>
                    </div>

                    {regError && (
                      <div className="p-3 bg-red-50 border border-red-200 rounded-md text-red-700 text-xs flex items-start gap-2">
                        <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
                        <span>{regError}</span>
                      </div>
                    )}

                    <form onSubmit={handleRegisterSubmit} className="space-y-3">
                      {/* Nombre y Apellidos */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <div className="flex items-center justify-between mb-1">
                            <label className="font-bold text-gray-700">Nombre:</label>
                            {regTouched.nombre && (
                              <span className={`text-[10px] flex items-center gap-1 font-medium ${
                                nameValidation.isValid ? 'text-emerald-600' : 'text-red-600'
                              }`}>
                                {nameValidation.isValid ? (
                                  <><Check className="w-3 h-3" /> Correcto</>
                                ) : (
                                  <><X className="w-3 h-3" /> Requerido</>
                                )}
                              </span>
                            )}
                          </div>
                          <div className="relative">
                            <input
                              type="text"
                              value={regNombre}
                              onChange={e => { setRegNombre(e.target.value); markTouched('nombre'); }}
                              onBlur={() => markTouched('nombre')}
                              placeholder="Ej: Marcos"
                              className={`w-full p-2 pr-8 text-xs rounded border transition bg-white focus:outline-none ${
                                regTouched.nombre
                                  ? nameValidation.isValid
                                    ? 'border-emerald-400 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-400'
                                    : 'border-red-400 bg-red-50/30 focus:border-red-500 focus:ring-1 focus:ring-red-400'
                                  : 'border-gray-300 focus:border-[#3869A0]'
                              }`}
                              required
                            />
                            {regTouched.nombre && (
                              <div className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none">
                                {nameValidation.isValid ? (
                                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                                ) : (
                                  <AlertCircle className="w-3.5 h-3.5 text-red-500" />
                                )}
                              </div>
                            )}
                          </div>
                          {regTouched.nombre && !nameValidation.isValid && (
                            <p className="text-[10px] text-red-600 mt-1">{nameValidation.message}</p>
                          )}
                        </div>

                        <div>
                          <div className="flex items-center justify-between mb-1">
                            <label className="font-bold text-gray-700">Apellidos:</label>
                            {regTouched.apellidos && (
                              <span className={`text-[10px] flex items-center gap-1 font-medium ${
                                surnameValidation.isValid ? 'text-emerald-600' : 'text-red-600'
                              }`}>
                                {surnameValidation.isValid ? (
                                  <><Check className="w-3 h-3" /> Correcto</>
                                ) : (
                                  <><X className="w-3 h-3" /> Requerido</>
                                )}
                              </span>
                            )}
                          </div>
                          <div className="relative">
                            <input
                              type="text"
                              value={regApellidos}
                              onChange={e => { setRegApellidos(e.target.value); markTouched('apellidos'); }}
                              onBlur={() => markTouched('apellidos')}
                              placeholder="Ej: Navarro"
                              className={`w-full p-2 pr-8 text-xs rounded border transition bg-white focus:outline-none ${
                                regTouched.apellidos
                                  ? surnameValidation.isValid
                                    ? 'border-emerald-400 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-400'
                                    : 'border-red-400 bg-red-50/30 focus:border-red-500 focus:ring-1 focus:ring-red-400'
                                  : 'border-gray-300 focus:border-[#3869A0]'
                              }`}
                              required
                            />
                            {regTouched.apellidos && (
                              <div className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none">
                                {surnameValidation.isValid ? (
                                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                                ) : (
                                  <AlertCircle className="w-3.5 h-3.5 text-red-500" />
                                )}
                              </div>
                            )}
                          </div>
                          {regTouched.apellidos && !surnameValidation.isValid && (
                            <p className="text-[10px] text-red-600 mt-1">{surnameValidation.message}</p>
                          )}
                        </div>
                      </div>

                      {/* Correo electrónico */}
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <label className="font-bold text-gray-700">Correo electrónico:</label>
                          {regTouched.email && (
                            <span className={`text-[10px] flex items-center gap-1 font-medium ${
                              emailValidation.isValid ? 'text-emerald-600' : 'text-red-600'
                            }`}>
                              {emailValidation.isValid ? (
                                <><Check className="w-3 h-3" /> Disponible</>
                              ) : (
                                <><X className="w-3 h-3" /> No válido</>
                              )}
                            </span>
                          )}
                        </div>
                        <div className="relative">
                          <input
                            type="email"
                            value={regEmail}
                            onChange={e => { setRegEmail(e.target.value); markTouched('email'); }}
                            onBlur={() => markTouched('email')}
                            placeholder="tu.correo@ejemplo.com"
                            className={`w-full p-2 pr-8 text-xs rounded border transition bg-white focus:outline-none ${
                              regTouched.email
                                ? emailValidation.isValid
                                  ? 'border-emerald-400 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-400'
                                  : 'border-red-400 bg-red-50/30 focus:border-red-500 focus:ring-1 focus:ring-red-400'
                                : 'border-gray-300 focus:border-[#3869A0]'
                            }`}
                            required
                          />
                          <div className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none">
                            {regTouched.email && (
                              emailValidation.isValid ? (
                                <Check className="w-3.5 h-3.5 text-emerald-600" />
                              ) : (
                                <AlertCircle className="w-3.5 h-3.5 text-red-500" />
                              )
                            )}
                          </div>
                        </div>
                        {regTouched.email && !emailValidation.isValid && (
                          <p className="text-[10px] text-red-600 mt-1">{emailValidation.message}</p>
                        )}
                        {regTouched.email && emailValidation.isValid && (
                          <p className="text-[10px] text-emerald-600 mt-1">✓ Correo válido para el registro</p>
                        )}
                      </div>

                      {/* Contraseña y Confirmar Contraseña */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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
                          <div className="relative">
                            <input
                              type="password"
                              value={regPassword}
                              onChange={e => { setRegPassword(e.target.value); markTouched('password'); }}
                              onBlur={() => markTouched('password')}
                              placeholder="Mínimo 6 caracteres"
                              className={`w-full p-2 pr-8 text-xs rounded border transition bg-white focus:outline-none ${
                                regTouched.password
                                  ? passwordValidation.isValid
                                    ? 'border-emerald-400 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-400'
                                    : 'border-red-400 bg-red-50/30 focus:border-red-500 focus:ring-1 focus:ring-red-400'
                                  : 'border-gray-300 focus:border-[#3869A0]'
                              }`}
                              required
                            />
                            {regTouched.password && (
                              <div className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none">
                                {passwordValidation.isValid ? (
                                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                                ) : (
                                  <AlertCircle className="w-3.5 h-3.5 text-red-500" />
                                )}
                              </div>
                            )}
                          </div>

                          {/* Medidor de seguridad en tiempo real */}
                          {regPassword && (
                            <div className="mt-1.5 space-y-1">
                              <div className="w-full bg-gray-200 h-1.5 rounded-full overflow-hidden">
                                <div 
                                  className={`h-full transition-all duration-300 ${passwordStrength.color}`}
                                  style={{ width: `${passwordStrength.percent}%` }}
                                />
                              </div>
                              <p className="text-[10px] text-gray-500">
                                {passwordStrength.tips.length > 0 && passwordStrength.tips[0]}
                              </p>
                            </div>
                          )}
                        </div>

                        <div>
                          <div className="flex items-center justify-between mb-1">
                            <label className="font-bold text-gray-700">Confirmar contraseña:</label>
                            {regTouched.passwordConfirm && regPasswordConfirm && (
                              <span className={`text-[10px] flex items-center gap-1 font-medium ${
                                passwordConfirmValidation.isValid ? 'text-emerald-600' : 'text-red-600'
                              }`}>
                                {passwordConfirmValidation.isValid ? (
                                  <><Check className="w-3 h-3" /> Coinciden</>
                                ) : (
                                  <><X className="w-3 h-3" /> Diferentes</>
                                )}
                              </span>
                            )}
                          </div>
                          <div className="relative">
                            <input
                              type="password"
                              value={regPasswordConfirm}
                              onChange={e => { setRegPasswordConfirm(e.target.value); markTouched('passwordConfirm'); }}
                              onBlur={() => markTouched('passwordConfirm')}
                              placeholder="Repite la contraseña"
                              className={`w-full p-2 pr-8 text-xs rounded border transition bg-white focus:outline-none ${
                                regTouched.passwordConfirm && regPasswordConfirm
                                  ? passwordConfirmValidation.isValid
                                    ? 'border-emerald-400 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-400'
                                    : 'border-red-400 bg-red-50/30 focus:border-red-500 focus:ring-1 focus:ring-red-400'
                                  : 'border-gray-300 focus:border-[#3869A0]'
                              }`}
                              required
                            />
                            {regTouched.passwordConfirm && regPasswordConfirm && (
                              <div className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none">
                                {passwordConfirmValidation.isValid ? (
                                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                                ) : (
                                  <AlertCircle className="w-3.5 h-3.5 text-red-500" />
                                )}
                              </div>
                            )}
                          </div>
                          {regTouched.passwordConfirm && regPasswordConfirm && !passwordConfirmValidation.isValid && (
                            <p className="text-[10px] text-red-600 mt-1">{passwordConfirmValidation.message}</p>
                          )}
                        </div>
                      </div>

                      {/* Fecha de Nacimiento y Provincia */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <div className="flex items-center justify-between mb-1">
                            <label className="font-bold text-gray-700">Fecha de nacimiento:</label>
                            {birthDateValidation.isValid && birthDateValidation.age !== undefined && (
                              <span className="text-[10px] text-emerald-600 font-medium">
                                ({birthDateValidation.age} años)
                              </span>
                            )}
                          </div>
                          <input
                            type="date"
                            value={regFnac}
                            onChange={e => { setRegFnac(e.target.value); markTouched('fnac'); }}
                            onBlur={() => markTouched('fnac')}
                            max={new Date().toISOString().split('T')[0]}
                            className={`w-full p-2 text-xs rounded border transition bg-white focus:outline-none ${
                              regTouched.fnac && !birthDateValidation.isValid
                                ? 'border-red-400 bg-red-50/30 focus:border-red-500'
                                : 'border-gray-300 focus:border-[#3869A0]'
                            }`}
                            required
                          />
                          {regTouched.fnac && !birthDateValidation.isValid && (
                            <p className="text-[10px] text-red-600 mt-1">{birthDateValidation.message}</p>
                          )}
                        </div>

                        <div>
                          <label className="font-bold text-gray-700 block mb-1">Provincia:</label>
                          <select
                            value={regProvincia}
                            onChange={e => setRegProvincia(e.target.value)}
                            className="w-full p-2 text-xs rounded border border-gray-300 focus:outline-none focus:border-[#3869A0] bg-white cursor-pointer"
                          >
                            {PROVINCIAS_ESPANA.map(p => (
                              <option key={p} value={p}>{p}</option>
                            ))}
                          </select>
                        </div>
                      </div>

                      {/* Sexo */}
                      <div>
                        <label className="font-bold text-gray-700 block mb-1">Sexo:</label>
                        <div className="flex items-center gap-6 py-1">
                          <label className="flex items-center gap-2 cursor-pointer font-medium hover:text-[#3869A0]">
                            <input
                              type="radio"
                              name="sexo"
                              checked={regSexo === 'h'}
                              onChange={() => setRegSexo('h')}
                              className="text-[#3869A0] cursor-pointer"
                            />
                            <span>Chico (Hombre)</span>
                          </label>
                          <label className="flex items-center gap-2 cursor-pointer font-medium hover:text-[#3869A0]">
                            <input
                              type="radio"
                              name="sexo"
                              checked={regSexo === 'm'}
                              onChange={() => setRegSexo('m')}
                              className="text-[#3869A0] cursor-pointer"
                            />
                            <span>Chica (Mujer)</span>
                          </label>
                        </div>
                      </div>

                      {/* Términos */}
                      <div className="pt-1">
                        <label className="flex items-center gap-2 cursor-pointer text-gray-600 hover:text-gray-900">
                          <input
                            type="checkbox"
                            checked={regTos}
                            onChange={e => { setRegTos(e.target.checked); markTouched('tos'); }}
                            className="rounded text-[#3869A0] cursor-pointer"
                          />
                          <span className="text-[11px]">Acepto las condiciones de servicio y privacidad de Inkorium</span>
                        </label>
                        {regTouched.tos && !regTos && (
                          <p className="text-[10px] text-red-600 mt-1">Debes aceptar los términos para continuar.</p>
                        )}
                      </div>

                      {/* Botón de envío */}
                      <button
                        type="submit"
                        disabled={loading}
                        className={`w-full py-2.5 text-white font-bold rounded-md transition shadow-md cursor-pointer text-sm flex items-center justify-center gap-2 mt-3 ${
                          isRegisterFormValid
                            ? 'bg-emerald-600 hover:bg-emerald-700'
                            : 'bg-[#3869A0] hover:bg-[#2c537f]'
                        } disabled:opacity-50`}
                      >
                        <UserPlus className="w-4 h-4" />
                        <span>{loading ? 'Creando cuenta...' : 'Completar registro'}</span>
                      </button>
                    </form>
                  </div>
                )}
              </div>
            </div>
          </div>

        </div>
      </main>

      {/* Retro Classic Footer */}
      <footer className="bg-white border-t border-[#ccd5df] py-4 text-center text-xs text-gray-500">
        <div className="w-full max-w-[1720px] 2xl:max-w-[1850px] mx-auto px-4 sm:px-8 flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 font-bold text-[#3869A0]">
            <span>Inkorium</span>
            <span className="text-gray-400 font-normal">© 2006–{new Date().getFullYear()}</span>
            <span className="text-gray-300">|</span>
            <span className="text-gray-500 font-normal">La red social retro de España</span>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-4 text-[11px]">
            <span className="text-gray-600 hover:underline cursor-pointer">Condiciones de servicio</span>
            <span className="text-gray-600 hover:underline cursor-pointer">Privacidad</span>
            <span className="text-gray-600 hover:underline cursor-pointer">Ayuda</span>
            <span className="text-gray-600 hover:underline cursor-pointer">Contacto</span>
            <span className="text-gray-600 hover:underline cursor-pointer">Blog de Inkorium</span>
          </div>
        </div>
      </footer>
    </div>
  );
};
