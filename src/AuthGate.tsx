import React, { useEffect, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "./lib/supabase";
import { useAuthStore } from "./lib/store";
import { App } from "./App";
import type { ProfileData } from "./features/feed/Feed";

type AuthState = { loading: boolean; session: Session | null; error: string | null };

function LoginScreen() {
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setMessage("");
    const result = mode === "login"
      ? await supabase.auth.signInWithPassword({ email: email.trim(), password })
      : await supabase.auth.signUp({ email: email.trim(), password });
    if (result.error) {
      setMessage(mode === "login" && result.error.message === "Invalid login credentials"
        ? "Correo o contraseña incorrectos."
        : mode === "signup"
          ? "No se ha podido crear la cuenta. Inténtalo de nuevo."
          : "No se ha podido iniciar sesión. Inténtalo de nuevo.");
    } else if (mode === "signup") {
      setMessage("Cuenta creada. Revisa tu correo para confirmar el registro.");
    }
    setBusy(false);
  }

  async function resetPassword() {
    const value = email.trim() || window.prompt("Introduce tu correo electrónico:")?.trim() || "";
    if (!value) return;
    setBusy(true);
    setMessage("");
    const { error } = await supabase.auth.resetPasswordForEmail(value);
    setMessage(error ? "No se ha podido enviar el correo de recuperación." : "Te hemos enviado un correo para restablecer tu contraseña.");
    setBusy(false);
  }

  return (
    <main style={{ minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "flex-start", padding: "18px 16px 30px", background: "#78afd1", fontFamily: "Arial,Helvetica,sans-serif", boxSizing: "border-box", color: "#5d6f7d" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 9, margin: "0 0 12px", height: 46 }}>
        <img src="/inkorium-logo-white.svg" alt="Inkorium" style={{ width: 38, height: 38, display: "block" }} />
        <span style={{ fontSize: 32, lineHeight: 1, fontWeight: 800, color: "#fff", letterSpacing: "-1.1px" }}>inkorium</span>
      </div>
      <section style={{ width: "min(100%,360px)", background: "#fff", border: "1px solid rgba(66,105,129,.18)", boxShadow: "0 2px 7px rgba(35,67,87,.18)" }}>
        <div style={{ height: 24, display: "flex", alignItems: "center", padding: "0 9px", background: "#d7ebf6", borderBottom: "1px solid #a9c8da", fontSize: 12, fontWeight: 700, color: "#516875" }}>{mode === "login" ? "Entrar" : "Crear cuenta"}</div>
        <form onSubmit={submit} style={{ padding: "15px 16px 13px" }}>
          <label style={{ display: "grid", gridTemplateColumns: "82px minmax(0,1fr)", alignItems: "center", gap: 8, marginBottom: 9, fontSize: 12, fontWeight: 700, color: "#7a858d", textAlign: "right" }}><span>E-mail</span><input type="email" required autoComplete="email" value={email} onChange={e => setEmail(e.target.value)} style={{ height: 26, padding: "4px 7px", border: "1px solid #c8cdd1", borderRadius: 2, boxSizing: "border-box", width: "100%" }} /></label>
          <label style={{ display: "grid", gridTemplateColumns: "82px minmax(0,1fr)", alignItems: "center", gap: 8, marginBottom: 9, fontSize: 12, fontWeight: 700, color: "#7a858d", textAlign: "right" }}><span>Contraseña</span><input type="password" required autoComplete={mode === "login" ? "current-password" : "new-password"} value={password} onChange={e => setPassword(e.target.value)} style={{ height: 26, padding: "4px 7px", border: "1px solid #c8cdd1", borderRadius: 2, boxSizing: "border-box", width: "100%" }} /></label>
          {message && <p style={{ margin: "0 0 8px", color: mode === "signup" && message.startsWith("Cuenta") ? "#267b4b" : "#c0392b", fontSize: 11, lineHeight: 1.35, textAlign: "center" }}>{message}</p>}
          <button type="submit" disabled={busy} style={{ display: "block", margin: "0 auto", padding: "5px 22px", border: "1px solid rgba(63,111,143,.35)", borderRadius: 2, background: "#67a4cd", color: "#fff", font: "700 12px Arial,Helvetica,sans-serif", cursor: busy ? "wait" : "pointer" }}>{busy ? "Procesando…" : mode === "login" ? "Entrar" : "Registrarme"}</button>
        </form>
        <div style={{ padding: "7px 9px", background: "#f3f3f3", borderTop: "1px solid #dfe3e6", textAlign: "center", fontSize: 11 }}><button type="button" onClick={() => void resetPassword()} disabled={busy} style={{ border: 0, background: "transparent", color: "#4e7d9d", cursor: "pointer" }}>¿Has olvidado tu contraseña?</button></div>
      </section>
      <button type="button" onClick={() => { setMode(mode === "login" ? "signup" : "login"); setMessage(""); }} style={{ marginTop: 13, border: 0, background: "transparent", color: "#fff", cursor: "pointer", fontSize: 11 }}>{mode === "login" ? "¿Todavía no tienes cuenta? Regístrate" : "¿Ya tienes una cuenta? Entrar"}</button>
    </main>
  );
}

export function AuthGate() {
  const [state, setState] = useState<AuthState>({ loading: true, session: null, error: null });

  useEffect(() => {
    let active = true;
    let lastSessionId: string | null = null;

    const loadSession = async () => {
      const { data, error } = await supabase.auth.getSession();
      if (!active) return;
      if (error) { setState({ loading: false, session: null, error: "No se pudo recuperar la sesión." }); return; }
      setState({ loading: false, session: data.session, error: null });
      lastSessionId = data.session?.user.id ?? null;
    };

    void loadSession();
    const { data: listener } = supabase.auth.onAuthStateChange((_, session) => {
      if (!active) return;
      const nextId = session?.user.id ?? null;
      if (nextId === lastSessionId && session) return;
      lastSessionId = nextId;
      setState({ loading: false, session, error: null });
    });

    return () => { active = false; listener.subscription.unsubscribe(); };
  }, []);

  const [profile, setProfile] = useState<ProfileData | null>(null);

  useEffect(() => {
    let active = true;
    if (!state.session) { setProfile(null); return () => { active = false; }; }
    const loadProfile = async () => {
      const { data } = await supabase.from("profiles").select("id, username, full_name, bio, city, avatar_url, banner_url").eq("id", state.session!.user.id).maybeSingle();
      if (!active) return;
      const nextProfile = (data as ProfileData | null) ?? null;
      useAuthStore.getState().setSession(state.session);
      useAuthStore.getState().setProfile(nextProfile);
      setProfile(nextProfile);
    };
    void loadProfile();
    return () => { active = false; };
  }, [state.session]);

  if (state.loading) return <div style={{ minHeight: "100vh", display: "grid", placeItems: "center", background: "#f3f6fa", fontFamily: "Arial,Helvetica,sans-serif", color: "#68788c" }}>Cargando Inkorium…</div>;
  if (state.error) return <div style={{ minHeight: "100vh", display: "grid", placeItems: "center", background: "#f3f6fa", fontFamily: "Arial,Helvetica,sans-serif", color: "#344457" }}><div style={{ padding: 24, background: "#fff", border: "1px solid #e6ebf1", borderRadius: 10 }}>{state.error}</div></div>;
  if (!state.session) return <LoginScreen />;
  return <App session={state.session} profile={profile} />;
}
