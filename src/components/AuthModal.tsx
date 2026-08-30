import React, { useState } from 'react';
import { useInkorium } from '../context/InkoriumContext';
import { supabase } from '../lib/supabase';
import { LogIn, UserPlus } from 'lucide-react';
import { PROVINCIAS_ESPANA } from '../types';

export const AuthModal: React.FC<{ isOpen: boolean; onClose: () => void }> = ({ isOpen, onClose }) => {
  const { setCurrentUserById } = useInkorium();
  const [mode, setMode] = useState<'login' | 'registro'>('login');
  const [loginEmail, setLoginEmail] = useState(''); const [loginPassword, setLoginPassword] = useState('');
  const [regNombre, setRegNombre] = useState(''); const [regApellidos, setRegApellidos] = useState(''); const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState(''); const [regFnac, setRegFnac] = useState('2000-01-01'); const [regProvincia, setRegProvincia] = useState('Madrid');
  const [regSexo, setRegSexo] = useState<'h' | 'm'>('h'); const [regTos, setRegTos] = useState(true);
  const [message, setMessage] = useState(''); const [busy, setBusy] = useState(false);
  if (!isOpen) return null;

  const login = async (e: React.FormEvent) => {
    e.preventDefault(); setMessage(''); setBusy(true);
    try { const { data, error } = await supabase.auth.signInWithPassword({ email: loginEmail.trim(), password: loginPassword }); if (error) throw error; if (data.user) { setCurrentUserById(data.user.id); onClose(); } }
    catch (error) { setMessage(error instanceof Error ? error.message : 'No se pudo iniciar sesión.'); }
    finally { setBusy(false); }
  };

  const register = async (e: React.FormEvent) => {
    e.preventDefault(); setMessage('');
    if (!regNombre.trim() || !regApellidos.trim() || !regEmail.trim() || !regPassword) { setMessage('Completa todos los campos requeridos.'); return; }
    if (!regTos) { setMessage('Debes aceptar los términos y condiciones.'); return; }
    setBusy(true);
    try {
      const { data, error } = await supabase.auth.signUp({ email: regEmail.trim(), password: regPassword });
      if (error) throw error; if (!data.user) throw new Error('Supabase no devolvió el usuario registrado.');
      const uid = data.user.id;
      const { error: profileError } = await supabase.from('profiles').upsert({ id: uid, username: regEmail.split('@')[0], full_name: `${regNombre} ${regApellidos}`.trim(), city: regProvincia, birth_date: regFnac || null });
      if (profileError) throw profileError;
      setCurrentUserById(uid);
      setMessage(data.session ? 'Cuenta creada correctamente.' : 'Cuenta creada. Revisa tu correo para confirmar la cuenta.');
      if (data.session) onClose();
    } catch (error) { setMessage(error instanceof Error ? error.message : 'No se pudo crear la cuenta.'); }
    finally { setBusy(false); }
  };

  return <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
    <div className="bg-white rounded-lg border border-gray-300 max-w-lg w-full p-5 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto text-xs">
      <div className="flex items-center justify-between pb-3 border-b border-gray-200">
        <div className="flex items-center gap-2"><div className="w-8 h-8 rounded-full bg-[#3869A0] text-white flex items-center justify-center font-bold">:)</div><div><h2 className="font-bold text-base text-gray-900">Inkorium</h2><p className="text-[11px] text-gray-500">Cuenta conectada a Supabase</p></div></div>
        <button onClick={onClose} className="text-gray-400 hover:text-gray-700 text-lg font-bold">✕</button>
      </div>
      <div className="grid grid-cols-2 gap-1 bg-gray-100 p-1 rounded font-bold">
        <button onClick={() => { setMode('login'); setMessage(''); }} className={`py-1.5 rounded ${mode === 'login' ? 'bg-white text-[#3869A0] shadow-xs' : 'text-gray-600'}`}>Iniciar sesión</button>
        <button onClick={() => { setMode('registro'); setMessage(''); }} className={`py-1.5 rounded ${mode === 'registro' ? 'bg-white text-[#3869A0] shadow-xs' : 'text-gray-600'}`}>Registrarse</button>
      </div>
      {message && <div className="p-2.5 bg-blue-50 border border-blue-200 rounded text-blue-800">{message}</div>}
      {mode === 'login' ? <form onSubmit={login} className="space-y-3">
        <div><label className="font-bold block mb-1">Email</label><input type="email" required value={loginEmail} onChange={e => setLoginEmail(e.target.value)} className="w-full p-2 rounded border border-gray-300" /></div>
        <div><label className="font-bold block mb-1">Contraseña</label><input type="password" required value={loginPassword} onChange={e => setLoginPassword(e.target.value)} className="w-full p-2 rounded border border-gray-300" /></div>
        <button disabled={busy} className="w-full py-2 bg-[#3869A0] text-white font-bold rounded flex items-center justify-center gap-1.5"><LogIn className="w-3.5 h-3.5" />Entrar</button>
      </form> : <form onSubmit={register} className="space-y-3">
        <div className="grid grid-cols-2 gap-2.5"><div><label className="font-bold block mb-1">Nombre</label><input required value={regNombre} onChange={e => setRegNombre(e.target.value)} className="w-full p-1.5 rounded border" /></div><div><label className="font-bold block mb-1">Apellidos</label><input required value={regApellidos} onChange={e => setRegApellidos(e.target.value)} className="w-full p-1.5 rounded border" /></div></div>
        <div><label className="font-bold block mb-1">Email</label><input required type="email" value={regEmail} onChange={e => setRegEmail(e.target.value)} className="w-full p-1.5 rounded border" /></div>
        <div><label className="font-bold block mb-1">Contraseña</label><input required minLength={6} type="password" value={regPassword} onChange={e => setRegPassword(e.target.value)} className="w-full p-1.5 rounded border" /></div>
        <div className="grid grid-cols-2 gap-2.5"><div><label className="font-bold block mb-1">Nacimiento</label><input type="date" value={regFnac} onChange={e => setRegFnac(e.target.value)} className="w-full p-1.5 rounded border" /></div><div><label className="font-bold block mb-1">Provincia</label><select value={regProvincia} onChange={e => setRegProvincia(e.target.value)} className="w-full p-1.5 rounded border bg-white">{PROVINCIAS_ESPANA.map(p => <option key={p}>{p}</option>)}</select></div></div>
        <div className="flex items-center gap-4"><label><input type="radio" checked={regSexo === 'h'} onChange={() => setRegSexo('h')} /> Hombre</label><label><input type="radio" checked={regSexo === 'm'} onChange={() => setRegSexo('m')} /> Mujer</label></div>
        <label className="flex items-center gap-2"><input type="checkbox" checked={regTos} onChange={e => setRegTos(e.target.checked)} /><span>Acepto los términos y condiciones</span></label>
        <button disabled={busy} className="w-full py-2 bg-[#3869A0] text-white font-bold rounded flex items-center justify-center gap-1.5"><UserPlus className="w-3.5 h-3.5" />Crear cuenta</button>
      </form>}
    </div>
  </div>;
};
