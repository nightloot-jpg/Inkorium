import { StrictMode, useEffect, useState, type FormEvent } from "react";
import { createRoot } from "react-dom/client";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "./lib/supabase";
import "./styles.css";

function App() {
  const [session, setSession] = useState<Session | null>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [mode, setMode] = useState<"login" | "signup">("login");
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

  if (session) {
    return <main className="shell"><div className="card"><span className="eyebrow">INKORIUM</span><h1>Bienvenido de nuevo.</h1><p>{session.user.email}</p><button onClick={() => void supabase.auth.signOut()}>Cerrar sesión</button></div></main>;
  }

  return <main className="shell"><div className="card"><span className="eyebrow">INKORIUM</span><h1>Tu espacio empieza aquí.</h1><p className="muted">Base limpia, React + TypeScript y Supabase conectado desde el primer commit.</p><form onSubmit={(event) => void submit(event)}><label>Email<input type="email" value={email} onChange={(event) => setEmail(event.target.value)} required /></label><label>Contraseña<input type="password" value={password} onChange={(event) => setPassword(event.target.value)} minLength={6} required /></label><button disabled={busy}>{busy ? "Cargando…" : mode === "login" ? "Entrar" : "Crear cuenta"}</button></form>{message && <p className="message">{message}</p>}<button className="link" onClick={() => setMode(mode === "login" ? "signup" : "login")}>{mode === "login" ? "Crear una cuenta" : "Ya tengo una cuenta"}</button></div></main>;
}

createRoot(document.getElementById("root")!).render(<StrictMode><App /></StrictMode>);
