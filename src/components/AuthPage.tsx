import React, { useState } from 'react';
import { useInkorium } from '../context/InkoriumContext';
import { 
  LogIn, UserPlus, Sparkles, MessageSquare, 
  Users, ShieldCheck, AlertCircle,
  Camera, Lock, Mail
} from 'lucide-react';
import { PROVINCIAS_ESPANA } from '../types';
import { supabase, isSupabaseConfigured } from '../lib/supabase';

export const AuthPage: React.FC = () => {
  const { login, registerNewUser } = useInkorium();

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

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    if (!loginEmail.trim() || !loginPassword.trim()) {
      setLoginError('Por favor, introduce tu correo electrónico y contraseña.');
      return;
    }

    setLoading(true);

    try {
      if (isSupabaseConfigured && supabase) {
        const { error } = await supabase.auth.signInWithPassword({
          email: loginEmail.trim(),
          password: loginPassword,
        });

        if (error) {
          setLoginError(error.message || 'Credenciales incorrectas.');
          setLoading(false);
          return;
        }
      }

      // Context state login
      const result = login(loginEmail, loginPassword);
      if (!result.success && result.error && !isSupabaseConfigured) {
        setLoginError(result.error);
      }
    } catch (err: any) {
      setLoginError(err?.message || 'Error al iniciar sesión.');
    } finally {
      setLoading(false);
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setRegError('');

    if (!regNombre.trim() || !regApellidos.trim() || !regEmail.trim() || !regPassword.trim()) {
      setRegError('Por favor, completa todos los campos obligatorios para registrarte.');
      return;
    }

    if (regPassword.length < 6) {
      setRegError('La contraseña debe contener al menos 6 caracteres.');
      return;
    }

    if (regPassword !== regPasswordConfirm) {
      setRegError('Las contraseñas no coinciden. Por favor verifícalas.');
      return;
    }

    if (!regTos) {
      setRegError('Debes aceptar las condiciones de servicio de Inkorium.');
      return;
    }

    setLoading(true);

    try {
      if (isSupabaseConfigured && supabase) {
        const { error } = await supabase.auth.signUp({
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

        if (error) {
          setRegError(error.message);
          setLoading(false);
          return;
        }
      }

      registerNewUser(regNombre, regApellidos, regEmail, regSexo, regProvincia, regFnac);
    } catch (err: any) {
      setRegError(err?.message || 'Error al procesar el registro.');
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
                          placeholder="Tu contraseña"
                          className="w-full p-2.5 text-xs rounded-md border border-gray-300 focus:outline-none focus:border-[#3869A0] focus:ring-1 focus:ring-[#3869A0] bg-white"
                          required
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
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="font-bold text-gray-700 block mb-1">Nombre:</label>
                          <input
                            type="text"
                            value={regNombre}
                            onChange={e => setRegNombre(e.target.value)}
                            placeholder="Ej: Marcos"
                            className="w-full p-2 text-xs rounded border border-gray-300 focus:outline-none focus:border-[#3869A0]"
                            required
                          />
                        </div>
                        <div>
                          <label className="font-bold text-gray-700 block mb-1">Apellidos:</label>
                          <input
                            type="text"
                            value={regApellidos}
                            onChange={e => setRegApellidos(e.target.value)}
                            placeholder="Ej: Navarro"
                            className="w-full p-2 text-xs rounded border border-gray-300 focus:outline-none focus:border-[#3869A0]"
                            required
                          />
                        </div>
                      </div>

                      <div>
                        <label className="font-bold text-gray-700 block mb-1">Correo electrónico:</label>
                        <input
                          type="email"
                          value={regEmail}
                          onChange={e => setRegEmail(e.target.value)}
                          placeholder="tu.correo@ejemplo.com"
                          className="w-full p-2 text-xs rounded border border-gray-300 focus:outline-none focus:border-[#3869A0]"
                          required
                        />
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="font-bold text-gray-700 block mb-1">Contraseña:</label>
                          <input
                            type="password"
                            value={regPassword}
                            onChange={e => setRegPassword(e.target.value)}
                            placeholder="Mínimo 6 caracteres"
                            className="w-full p-2 text-xs rounded border border-gray-300 focus:outline-none focus:border-[#3869A0]"
                            required
                          />
                        </div>
                        <div>
                          <label className="font-bold text-gray-700 block mb-1">Confirmar contraseña:</label>
                          <input
                            type="password"
                            value={regPasswordConfirm}
                            onChange={e => setRegPasswordConfirm(e.target.value)}
                            placeholder="Repite la contraseña"
                            className="w-full p-2 text-xs rounded border border-gray-300 focus:outline-none focus:border-[#3869A0]"
                            required
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="font-bold text-gray-700 block mb-1">Fecha de nacimiento:</label>
                          <input
                            type="date"
                            value={regFnac}
                            onChange={e => setRegFnac(e.target.value)}
                            className="w-full p-2 text-xs rounded border border-gray-300 focus:outline-none focus:border-[#3869A0] bg-white"
                            required
                          />
                        </div>
                        <div>
                          <label className="font-bold text-gray-700 block mb-1">Provincia:</label>
                          <select
                            value={regProvincia}
                            onChange={e => setRegProvincia(e.target.value)}
                            className="w-full p-2 text-xs rounded border border-gray-300 focus:outline-none focus:border-[#3869A0] bg-white"
                          >
                            {PROVINCIAS_ESPANA.map(p => (
                              <option key={p} value={p}>{p}</option>
                            ))}
                          </select>
                        </div>
                      </div>

                      <div>
                        <label className="font-bold text-gray-700 block mb-1">Sexo:</label>
                        <div className="flex items-center gap-6 py-1">
                          <label className="flex items-center gap-2 cursor-pointer font-medium">
                            <input
                              type="radio"
                              name="sexo"
                              checked={regSexo === 'h'}
                              onChange={() => setRegSexo('h')}
                              className="text-[#3869A0]"
                            />
                            <span>Chico (Hombre)</span>
                          </label>
                          <label className="flex items-center gap-2 cursor-pointer font-medium">
                            <input
                              type="radio"
                              name="sexo"
                              checked={regSexo === 'm'}
                              onChange={() => setRegSexo('m')}
                              className="text-[#3869A0]"
                            />
                            <span>Chica (Mujer)</span>
                          </label>
                        </div>
                      </div>

                      <div className="pt-2">
                        <label className="flex items-center gap-2 cursor-pointer text-gray-600">
                          <input
                            type="checkbox"
                            checked={regTos}
                            onChange={e => setRegTos(e.target.checked)}
                            className="rounded text-[#3869A0]"
                          />
                          <span>Acepto las condiciones de servicio y privacidad de Inkorium</span>
                        </label>
                      </div>

                      <button
                        type="submit"
                        disabled={loading}
                        className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-md transition shadow-md cursor-pointer text-sm flex items-center justify-center gap-2 mt-3 disabled:opacity-50"
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
