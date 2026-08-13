import { StrictMode, useEffect, useState, type FormEvent } from "react";
import { createRoot } from "react-dom/client";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "./lib/supabase";
import "./styles.css";

function Brand() {
  return <div className="brand"><img className="brand-mark" src="/inkorium-logo-white.svg" alt="" /><span>inkorium</span></div>;
}

type Post = { id: number; text: string; time: string; likes: number };

const initialPosts: Post[] = [
  { id: 1, text: "Descubriendo nuevos sonidos para esta tarde. ¿Qué estáis escuchando?", time: "hace 31 min", likes: 6 },
  { id: 2, text: "Un espacio para compartir ideas, música y momentos.", time: "hace 1 h", likes: 3 },
];

function Feed({ session }: { session: Session }) {
  const username = session.user.email?.split("@")[0] || "usuario";
  const [draft, setDraft] = useState("");
  const [posts, setPosts] = useState(initialPosts);
  const [liked, setLiked] = useState<number[]>([]);

  function publish(event: FormEvent) {
    event.preventDefault();
    if (!draft.trim()) return;
    setPosts([{ id: Date.now(), text: draft.trim(), time: "ahora", likes: 0 }, ...posts]);
    setDraft("");
  }

  function toggleLike(id: number) {
    const alreadyLiked = liked.includes(id);
    setLiked(alreadyLiked ? liked.filter((item) => item !== id) : [...liked, id]);
    setPosts(posts.map((post) => post.id === id ? { ...post, likes: post.likes + (alreadyLiked ? -1 : 1) } : post));
  }

  return (
    <div className="feed-app">
      <header className="topbar">
        <Brand />
        <nav className="top-nav"><a className="active" href="#inicio">Inicio</a><a href="#mensajes">Mensajes</a><a href="#personas">Personas</a><a href="#musica">Música</a></nav>
        <div className="search">Buscar personas, música, vídeos…</div>
        <div className="top-actions"><span>♧</span><span>♫</span><span className="user-chip"><span className="avatar small">{username[0].toUpperCase()}</span>{username}⌄</span></div>
      </header>

      <div className="feed-layout">
        <aside className="left-column">
          <section className="profile-card panel"><div className="avatar profile-avatar">{username[0].toUpperCase()}</div><div><strong>{username}</strong><span>Más rápido</span><em>● En línea</em><a href="#perfil">Ver mi perfil »</a></div></section>
          <nav className="side-menu panel">
            {[["⌂", "Novedades"], ["▧", "Fotos"], ["▹", "Vídeos"], ["♫", "Música"], ["□", "Eventos"], ["♧", "Grupos"], ["⚑", "Páginas"], ["▥", "Encuestas"], ["▱", "Guardados"], ["⚙", "Configuración"]].map(([icon, label], index) => <a className={index === 0 ? "selected" : ""} href={`#${label.toLowerCase()}`} key={label}><span>{icon}</span>{label}</a>)}
          </nav>
          <section className="friends panel"><strong>AMIGOS CONECTADOS (1)</strong><div><span className="avatar tiny">B</span><a href="#amigo">bg9222361</a><i /></div><a className="see-all" href="#amigos">Ver todos »</a></section>
        </aside>

        <main className="stream">
          <section className="composer panel"><div className="composer-row"><div className="avatar">{username[0].toUpperCase()}</div><input value={draft} onChange={(event) => setDraft(event.target.value)} placeholder={`¿Qué estás pensando, ${username}?`} /></div><div className="composer-tools"><button>▧ Estado</button><button>▣ Foto</button><button>▹ Vídeo</button><button>♫ Música</button><button>▧ Encuesta</button><button>▤ Noticia</button><button>☷ Más⌄</button></div><div className="composer-footer"><span>◉ Público⌄</span><button className="publish" onClick={publish}>Publicar</button></div></section>
          {posts.map((post) => <article className="post panel" key={post.id}><div className="post-head"><div className="avatar">{username[0].toUpperCase()}</div><div><strong>{username}</strong><span>{post.time} · ◉</span></div><button className="more">⌄</button></div><p className="post-text">{post.text}</p><div className="post-actions"><button onClick={() => toggleLike(post.id)} className={liked.includes(post.id) ? "is-liked" : ""}>♡ Me gusta <small>{post.likes || ""}</small></button><button>◯ Comentar</button><button>♧ Compartir</button><span>♡ {post.likes}</span></div></article>)}
        </main>

        <aside className="right-column"><section className="panel right-card"><strong>SOLICITUDES</strong><a>Ver todas</a><p>No tienes solicitudes pendientes.</p></section><section className="panel right-card"><strong>EVENTOS DESTACADOS</strong><a>Ver todos</a><div className="event"><div className="event-image">♫</div><div><b>Descubre Inkorium</b><p>Comparte tus momentos y música.</p></div></div><button className="outline">Añadir a mi calendario</button></section><section className="panel calendar"><strong>CALENDARIO</strong><span>▣</span><h3>Agosto 2026</h3><div className="week">Lu　 Ma　 Mi　 Ju　 Vi　 Sá　 Do</div><div className="days">{Array.from({ length: 31 }, (_, index) => <i className={index === 12 ? "today" : ""} key={index}>{index + 1}</i>)}</div></section></aside>
      </div>
      <button className="chat">▢ Chat (0)</button>
      <button className="logout" onClick={() => void supabase.auth.signOut()}>Salir</button>
    </div>
  );
}

function Login() {
  const [email, setEmail] = useState(""); const [password, setPassword] = useState(""); const [mode, setMode] = useState<"login" | "signup">("login"); const [remember, setRemember] = useState(true); const [busy, setBusy] = useState(false); const [message, setMessage] = useState("");
  async function submit(event: FormEvent) { event.preventDefault(); setBusy(true); setMessage(""); const result = mode === "login" ? await supabase.auth.signInWithPassword({ email, password }) : await supabase.auth.signUp({ email, password }); setMessage(result.error ? result.error.message : mode === "login" ? "Sesión iniciada." : "Cuenta creada. Revisa tu correo si hace falta."); setBusy(false); }
  async function recoverPassword() { if (!email) { setMessage("Escribe tu email para recuperar la contraseña."); return; } setBusy(true); const result = await supabase.auth.resetPasswordForEmail(email, { redirectTo: `${window.location.origin}/` }); setMessage(result.error ? result.error.message : "Te hemos enviado un enlace para cambiar la contraseña."); setBusy(false); }
  return <main className="page"><Brand /><div className="card"><div className="card-heading"><h1>{mode === "login" ? "Iniciar sesión" : "Crear una cuenta"}</h1><p>{mode === "login" ? "Entra en tu espacio creativo." : "Empieza tu espacio creativo."}</p></div><form onSubmit={(event) => void submit(event)}><label>Email<input type="email" value={email} onChange={(event) => setEmail(event.target.value)} required autoComplete="email" /></label><label>Contraseña<input type="password" value={password} onChange={(event) => setPassword(event.target.value)} minLength={6} required autoComplete={mode === "login" ? "current-password" : "new-password"} /></label><div className="form-options"><label className="remember"><input type="checkbox" checked={remember} onChange={(event) => setRemember(event.target.checked)} /><span>Recordarme en este equipo</span></label><button type="button" className="text-button" onClick={() => void recoverPassword()}>¿Contraseña olvidada?</button></div><button className="primary-button" disabled={busy}>{busy ? "Cargando…" : mode === "login" ? "Entrar" : "Crear cuenta"}</button></form>{message && <p className="message">{message}</p>}</div><div className="page-links"><button className="text-button" onClick={() => { setMode(mode === "login" ? "signup" : "login"); setMessage(""); }}>{mode === "login" ? "¿Quieres crear una cuenta?" : "¿Ya tienes una cuenta?"}</button><span>|</span><button className="text-button" onClick={() => void recoverPassword()}>Recordar contraseña</button><button className="text-button home-link">Volver al inicio</button></div></main>;
}

function App() { const [session, setSession] = useState<Session | null>(null); useEffect(() => { void supabase.auth.getSession().then(({ data }) => setSession(data.session)); const { data } = supabase.auth.onAuthStateChange((_event, next) => setSession(next)); return () => data.subscription.unsubscribe(); }, []); return session ? <Feed session={session} /> : <Login />; }

createRoot(document.getElementById("root")!).render(<StrictMode><App /></StrictMode>);
