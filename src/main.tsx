import { StrictMode, useEffect, useState, type FormEvent } from "react";
import { createRoot } from "react-dom/client";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "./lib/supabase";
import "./styles.css";

function Brand() {
  return (
    <div className="brand" aria-label="Inkorium">
      <svg className="brand-mark" viewBox="0 0 32 32" aria-hidden="true">
        <path d="M7 5h12.5A5.5 5.5 0 0 1 25 10.5V27H12.5A5.5 5.5 0 0 1 7 21.5V5Z" fill="currentColor" />
        <path d="M12 10h8M12 15h8M12 20h5" stroke="#7fa9cf" strokeWidth="2.2" strokeLinecap="round" />
      </svg>
      <span>inkorium</span>
    </div>
  );
}

function App() {
  const [session, setSession] = useState<Session | null>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [remember, setRemember] = useState(true);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    void supabase.auth.getSession().then(({ data }) => setSession(data.session));
    const { data } = supabase.auth.onAuthStateChange((_event, next) => setSession(next));
    return () => data.subscription.unsubscribe();
  }, []);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setMessage("");
    const result = mode === "login"
      ? await supabase.auth.signInWithPassword({ email, password })
      : await supabase.auth.signUp({ email, password });
    if (result.error) setMessage(result.error.message);
    else setMessage(mode === "login" ? "Sesión iniciada." : "Cuenta creada. Revisa tu correo si hace falta.");
    setBusy(false);
  }

  async function recoverPassword() {
    if (!email) {
      setMessage("Escribe tu email para recuperar la contraseña.");
      return;
    }
    setBusy(true);
    const result = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/`,
    });
    setMessage(result.error ? result.error.message : "Te hemos enviado un enlace para cambiar la contraseña.");
    setBusy(false);
  }

  if (session) {
    return (
      <main className="page">
        <Brand />
        <div className="card signed-in">
          <h1>Bienvenido de nuevo</h1>
          <p>{session.user.email}</p>
          <button onClick={() => void supabase.auth.signOut()}>Cerrar sesión</button>
        </div>
      </main>
    );
  }

  return (
    <main className="page">
      <Brand />
      <div className="card">
        <div className="card-heading">
          <h1>{mode === "login" ? "Iniciar sesión" : "Crear una cuenta"}</h1>
          <p>{mode === "login" ? "Entra en tu espacio creativo." : "Empieza tu espacio creativo."}</p>
        </div>
        <form onSubmit={(event) => void submit(event)}>
          <label>
            Email
            <input type="email" value={email} onChange={(event) => setEmail(event.target.value)} required autoComplete="email" />
          </label>
          <label>
            Contraseña
            <input type="password" value={password} onChange={(event) => setPassword(event.target.value)} minLength={6} required autoComplete={mode === "login" ? "current-password" : "new-password"} />
          </label>
          <div className="form-options">
            <label className="remember">
              <input type="checkbox" checked={remember} onChange={(event) => setRemember(event.target.checked)} />
              <span>Recordarme en este equipo</span>
            </label>
            <button type="button" className="text-button" onClick={() => void recoverPassword()} disabled={busy}>¿Contraseña olvidada?</button>
          </div>
          <button className="primary-button" disabled={busy}>
            {busy ? "Cargando…" : mode === "login" ? "Entrar" : "Crear cuenta"}
          </button>
        </form>
        {message && <p className="message" role="status">{message}</p>}
      </div>
      <div className="page-links">
        <button className="text-button" onClick={() => { setMode(mode === "login" ? "signup" : "login"); setMessage(""); }}>
          {mode === "login" ? "¿Quieres crear una cuenta?" : "¿Ya tienes una cuenta?"}
        </button>
        <span aria-hidden="true">|</span>
        <button className="text-button" onClick={() => void recoverPassword()}>Recordar contraseña</button>
        <button className="text-button home-link" onClick={() => window.location.assign("/")}>Volver al inicio</button>
      </div>
    </main>
  );
}

createRoot(document.getElementById("root")!).render(<StrictMode><App /></StrictMode>);
