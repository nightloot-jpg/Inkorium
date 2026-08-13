import { StrictMode, useEffect, useState, useCallback, type ChangeEvent, type FormEvent } from "react";
import { createRoot } from "react-dom/client";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "./lib/supabase";
import Cropper from 'react-easy-crop';
import { getCroppedImg } from "./lib/cropImage";
import "./styles.css";

function Brand() { return <div className="brand"><img className="brand-mark" src="/inkorium-logo-white.svg" alt="" /><span>inkorium</span></div>; }
type Post = { id: string; text: string; time: string; likes: number; authorName?: string; authorId?: string; authorAvatar?: string | null };
type Page = "inicio" | "perfil" | "mensajes" | "personas" | "musica" | "buscar";
const people = [{id: "1", name: "bg9222361"}, {id: "2", name: "Marta Creativa"}, {id: "3", name: "Alex Sonidos"}, {id: "4", name: "Clara Visual"}]; const songs = ["MHR, EFY & SNEZ! - Hola", "Inalcanzable", "Atardecer en Madrid", "Noches de verano"];

function formatPostTime(value: string) {
  const minutes = Math.max(0, Math.floor((Date.now() - new Date(value).getTime()) / 60000));
  if (minutes < 1) return "ahora";
  if (minutes < 60) return `hace ${minutes} min`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `hace ${hours} h`;
  return `hace ${Math.floor(hours / 24)} d`;
}

function Feed({ session, profile }: { session: Session, profile: ProfileData | null }) {
  const username = session.user.email?.split("@")[0] || "usuario";
  const [page, setPage] = useState<Page>((sessionStorage.getItem("inkorium-page") as Page) || "inicio");
  const [visitedUserId, setVisitedUserId] = useState<string | null>(sessionStorage.getItem("inkorium-visited") || null);
  const [previousPage, setPreviousPage] = useState<Page | null>((sessionStorage.getItem("inkorium-previous") as Page) || null); const [draft, setDraft] = useState(""); const [posts, setPosts] = useState<Post[]>([]); const [liked, setLiked] = useState<string[]>([]); const [feedError, setFeedError] = useState(""); const [publishing, setPublishing] = useState(false); const [query, setQuery] = useState(""); const [notifications, setNotifications] = useState(false); const [notificationItems, setNotificationItems] = useState<any[]>([]); async function markAllRead() { setNotificationItems(items => items.map(i => ({...i, is_read: true}))); } const [userMenu, setUserMenu] = useState(false); const [player, setPlayer] = useState(false); const [theme, setTheme] = useState("blue"); const [position, setPosition] = useState({ x: 24, y: 90 }); const [dragging, setDragging] = useState(false);
  useEffect(() => { let cancelled = false; async function loadPosts() { const { data, error } = await supabase.from("posts").select("id, content, created_at, author_id").eq("visibility", "public").is("group_id", null).order("created_at", { ascending: false }).limit(30); if (cancelled) return; if (error) { setFeedError(error.message); return; } const rows = data ?? []; const authorIds = [...new Set(rows.map((row) => row.author_id).filter(Boolean))]; const { data: profiles, error: profilesError } = authorIds.length ? await supabase.from("profiles").select("id, username, full_name, avatar_url").in("id", authorIds) : { data: [], error: null }; if (cancelled) return; if (profilesError) { setFeedError(profilesError.message); } const profileNames = new Map((profiles ?? []).map((profile) => [profile.id, profile.username || profile.full_name || "usuario"])); const profileAvatars = new Map((profiles ?? []).map((profile) => [profile.id, profile.avatar_url]));
setPosts(rows.map((row) => ({ id: row.id, text: row.content ?? "", time: formatPostTime(row.created_at), likes: 0, authorName: profileNames.get(row.author_id) ?? (row.author_id === session.user.id ? username : "usuario"), authorId: row.author_id, authorAvatar: profileAvatars.get(row.author_id) }))); } void loadPosts(); return () => { cancelled = true; }; }, [session.user.id, username]);
  async function publish(event: FormEvent) { event.preventDefault(); const content = draft.trim(); if (!content || publishing) return; setPublishing(true); setFeedError(""); const { data, error } = await supabase.from("posts").insert({ author_id: session.user.id, content, visibility: "public" }).select("id, content, created_at").single(); if (error) setFeedError(error.message); else if (data) { setPosts((current) => [{ id: data.id, text: data.content ?? content, time: "ahora", likes: 0, authorName: username, authorId: session.user.id, authorAvatar: profile?.avatar_url }, ...current]); setDraft(""); } setPublishing(false); }
  function toggleLike(id: string) { const active = liked.includes(id); setLiked(active ? liked.filter((item) => item !== id) : [...liked, id]); setPosts(posts.map((post) => post.id === id ? { ...post, likes: post.likes + (active ? -1 : 1) } : post)); }
  const navigate = (next: Page, userId?: string) => {
    if (next === "perfil" && userId) {
      setPreviousPage(page);
      sessionStorage.setItem("inkorium-previous", page);
      setVisitedUserId(userId);
      sessionStorage.setItem("inkorium-visited", userId);
    } else if (next !== "perfil") {
      setVisitedUserId(null);
      sessionStorage.removeItem("inkorium-visited");
      setPreviousPage(null);
      sessionStorage.removeItem("inkorium-previous");
    } else if (next === "perfil" && !userId) {
       // own profile
      setVisitedUserId(null);
      sessionStorage.removeItem("inkorium-visited");
      setPreviousPage(null);
      sessionStorage.removeItem("inkorium-previous");
    }
    setPage(next);
    sessionStorage.setItem("inkorium-page", next);
    setNotifications(false);
    setUserMenu(false);
  };
  return <div className={`feed-app theme-${theme}`}>
    <header className="topbar"><button className="brand-button" onClick={() => navigate("inicio")}><Brand /></button><nav className="top-nav">{([["inicio", "Inicio"], ["perfil", "Perfil"], ["mensajes", "Mensajes"], ["personas", "Personas"], ["musica", "Musica"]] as [Page, string][]).map(([id, label]) => <button className={page === id ? "active" : ""} onClick={() => navigate(id)} key={id}>{label}</button>)}</nav><form className="search-form" onSubmit={(event) => { event.preventDefault(); navigate("buscar"); }}><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Buscar personas, musica, videos..." /></form><div className="top-actions"><button className="icon-button" onClick={() => setNotifications(!notifications)} aria-label="Notificaciones">♧</button><button className="icon-button" onClick={() => setPlayer(!player)} aria-label="Reproductor">♫</button><button className="user-chip" onClick={() => setUserMenu(!userMenu)}><span className="avatar small">{username[0].toUpperCase()}</span>{username}⌄</button></div>{notifications && <div className="popover notifications"><strong>NOTIFICACIONES</strong>{notificationItems.length === 0 ? <p>No tienes notificaciones.</p> : notificationItems.map(n => <div key={n.id} className="notification-row">{n.actor ? <UserLink userId={n.actor_id} name={n.actor.full_name || n.actor.username || "usuario"} avatarUrl={n.actor.avatar_url} onClick={(id) => navigate("perfil", id)} /> : <span className="avatar tiny">?</span>}<p>{n.type === 'like' ? 'Le ha gustado tu publicación' : n.type === 'friend' ? 'Te envió una solicitud de amistad' : 'Nueva notificación'}</p></div>)}<button onClick={() => { void markAllRead(); setNotifications(false); }}>Marcar todo como leído</button></div>}{userMenu && <div className="popover user-menu"><strong>{username}</strong><button onClick={() => navigate("perfil")}>Mi perfil</button><button onClick={() => navigate("mensajes")}>Mis mensajes</button><hr /><span>Color de la web</span><div className="themes"><button className="theme-dot blue" onClick={() => setTheme("blue")} /><button className="theme-dot violet" onClick={() => setTheme("violet")} /><button className="theme-dot green" onClick={() => setTheme("green")} /><button className="theme-dot sunset" onClick={() => setTheme("sunset")} /></div><button onClick={() => void supabase.auth.signOut()}>Cerrar sesion</button></div>}</header>
    <div className="feed-layout"><aside className="left-column"><section className="profile-card panel"><UserLink userId={session.user.id} name={username} avatarUrl={profile?.avatar_url} onClick={() => navigate("perfil")} /><div><span>Mas rapido</span><em>● En linea</em><button onClick={() => navigate("perfil")}>Ver mi perfil »</button></div></section><nav className="side-menu panel">{[["⌂", "Novedades", "inicio"], ["▧", "Fotos", "buscar"], ["▹", "Videos", "buscar"], ["♫", "Musica", "musica"], ["□", "Eventos", "buscar"], ["♧", "Grupos", "personas"], ["⚑", "Paginas", "personas"], ["▥", "Encuestas", "buscar"], ["▱", "Guardados", "buscar"], ["⚙", "Configuracion", "personas"]].map(([icon, label, id], index) => <button className={page === id && index === 0 ? "selected" : ""} onClick={() => navigate(id as Page)} key={label}><span>{icon}</span>{label}</button>)}</nav><section className="friends panel"><strong>AMIGOS CONECTADOS (1)</strong><div><UserLink userId="1" name="bg9222361" onClick={(id) => navigate("perfil", id)} /><i /></div><button className="see-all" onClick={() => navigate("personas")}>Ver todos »</button></section></aside>
      <main className="stream">{page === "inicio" && <><section className="composer panel"><div className="composer-row"><UserLink userId={session.user.id} name={username} avatarUrl={profile?.avatar_url} onClick={() => navigate("perfil")} /><input value={draft} onChange={(event) => setDraft(event.target.value)} placeholder={`Que estas pensando, ${username}?`} /></div><div className="composer-tools"><button>▧ Estado</button><button>▣ Foto</button><button>▹ Video</button><button onClick={() => { setPlayer(true); }}>♫ Musica</button><button>▧ Encuesta</button><button>▤ Noticia</button><button>☷ Mas⌄</button></div><div className="composer-footer"><span>◉ Publico⌄</span><button className="publish" onClick={publish} disabled={publishing}>{publishing ? "Guardando..." : "Publicar"}</button></div>{feedError && <p className="message">{feedError}</p>}</section>{posts.length === 0 && !feedError && <p className="empty-feed">Todavia no hay publicaciones.</p>}{posts.map((post) => <article className="post panel" key={post.id}><div className="post-head"><UserLink userId={post.authorId || session.user.id} name={post.authorName || username} avatarUrl={post.authorAvatar} onClick={(id) => navigate("perfil", id)} /><div><span>{post.time} · ◉</span></div><button className="more">⌄</button></div><p className="post-text">{post.text}</p><div className="post-actions"><button onClick={() => toggleLike(post.id)} className={liked.includes(post.id) ? "is-liked" : ""}>♡ Me gusta <small>{post.likes || ""}</small></button><button>◯ Comentar</button><button>♧ Compartir</button><span>♡ {post.likes}</span></div></article>)}</>}{page === "perfil" && <ProfileView session={session} visitedUserId={visitedUserId} previousPage={previousPage} navigate={navigate} />}{page === "buscar" && <SearchView query={query} navigate={navigate} />}{page === "mensajes" && <MessagesView navigate={navigate} />}{page === "personas" && <PeopleView navigate={navigate} />}{page === "musica" && <MusicView onPlay={() => setPlayer(true)} />}</main>
      <aside className="right-column"><section className="panel right-card"><strong>SOLICITUDES</strong><button>Ver todas</button><p>No tienes solicitudes pendientes.</p></section><section className="panel right-card"><strong>EVENTOS DESTACADOS</strong><button>Ver todos</button><div className="event"><div className="event-image">♫</div><div><b>Descubre Inkorium</b><p>Comparte tus momentos y musica.</p></div></div><button className="outline">Añadir a mi calendario</button></section><section className="panel calendar"><strong>CALENDARIO</strong><span>▣</span><h3>Agosto 2026</h3><div className="week">Lu　 Ma　 Mi　 Ju　 Vi　 Sa　 Do</div><div className="days">{Array.from({ length: 31 }, (_, index) => <i className={index === 12 ? "today" : ""} key={index}>{index + 1}</i>)}</div></section></aside></div>
    <button className="chat">▢ Chat (0)</button>{player && <div className="mini-player" style={{ left: position.x, top: position.y }} onPointerDown={() => setDragging(true)} onPointerMove={(event) => { if (dragging) setPosition({ x: Math.max(5, event.clientX - 150), y: Math.max(65, event.clientY - 25) }); }} onPointerUp={() => setDragging(false)}><span className="drag-handle">⠿</span><button onClick={() => setPlayer(false)}>×</button><div className="album">♫</div><div><strong>Inkorium Mix</strong><small>Descubriendo sonidos...</small></div><span className="play">▶</span></div>}
  </div>;
}


function UserLink({ userId, name, avatarUrl, onClick, className = "" }: { userId: string; name: string; avatarUrl?: string | null; onClick?: (id: string) => void; className?: string }) {
  const initials = name.slice(0, 2).toUpperCase();
  return (
    <button className={`user-link ${className}`} onClick={(e) => { if (onClick) { e.stopPropagation(); onClick(userId); } }}>
      <div className="avatar">{avatarUrl ? <img src={avatarUrl} alt={name} /> : initials}</div>
      <strong>{name}</strong>
    </button>
  );
}

type ProfileData = { username: string | null; full_name: string | null; bio: string | null; city: string | null; avatar_url: string | null; banner_url: string | null };
function PhotoEditor({ file, kind, onCancel, onSave }: { file: File; kind: "avatar" | "banner"; onCancel: () => void; onSave: (file: File) => void }) {
  const [preview, setPreview] = useState("");
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<{ x: number; y: number; width: number; height: number } | null>(null);

  useEffect(() => {
    const url = URL.createObjectURL(file);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  const onCropComplete = useCallback((_croppedArea: any, croppedAreaPixels: any) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  const save = useCallback(async () => {
    if (!croppedAreaPixels) return;
    try {
      const croppedImage = await getCroppedImg(
        preview,
        croppedAreaPixels,
        kind === "avatar" ? 600 : 1200,
        kind === "avatar" ? 600 : 420,
        kind
      );
      if (croppedImage) {
        onSave(croppedImage);
      }
    } catch (e) {
      console.error(e);
    }
  }, [croppedAreaPixels, preview, kind, onSave]);

  return (
    <div className="photo-editor-backdrop">
      <section className="photo-editor">
        <header>
          <strong>Editar {kind === "avatar" ? "foto de perfil" : "banner"}</strong>
          <button onClick={onCancel}>×</button>
        </header>
        <div className="cropper-container">
          <Cropper
            image={preview}
            crop={crop}
            zoom={zoom}
            aspect={kind === "avatar" ? 1 : 1200 / 420}
            onCropChange={setCrop}
            onCropComplete={onCropComplete}
            onZoomChange={setZoom}
            cropShape={kind === "avatar" ? "round" : "rect"}
            showGrid={false}
          />
        </div>
        <div className="zoom-controls">
           <button onClick={() => setZoom(Math.max(1, zoom - 0.1))}>-</button>
           <label>Zoom</label>
           <button onClick={() => setZoom(Math.min(3, zoom + 0.1))}>+</button>
        </div>
        <footer>
          <label className="change-image-btn">
            Cambiar imagen
            <input type="file" accept="image/*" onChange={(e) => {
              const newFile = e.target.files?.[0];
              if (newFile) {
                const url = URL.createObjectURL(newFile);
                setPreview(url);
                setZoom(1);
                setCrop({x:0, y:0});
              }
            }} style={{display: 'none'}}/>
          </label>
          <div className="footer-actions">
            <button onClick={onCancel}>Cancelar</button>
            <button className="publish" onClick={save}>Guardar</button>
          </div>
        </footer>
      </section>
    </div>
  );
}

function ProfileViewLegacy({ session, visitedUserId, previousPage, navigate }: { session: Session; visitedUserId?: string | null; previousPage?: Page | null; navigate?: (page: Page, userId?: string) => void }) {
  const fallbackName = session.user.email?.split("@")[0] || "usuario";
  const [profile, setProfile] = useState<ProfileData | null>(null); const [posts, setPosts] = useState<Post[]>([]); const [draft, setDraft] = useState(""); const [saving, setSaving] = useState(false); const [uploading, setUploading] = useState<"avatar" | "banner" | "">(""); const [error, setError] = useState("");
  const name = profile?.full_name || profile?.username || fallbackName; const initials = name.slice(0, 2).toUpperCase();
  async function uploadMedia(event: ChangeEvent<HTMLInputElement>, kind: "avatar" | "banner") { const file = event.target.files?.[0]; if (!file) return; if (!file.type.startsWith("image/")) { setError("Selecciona una imagen válida."); return; } if (file.size > 5 * 1024 * 1024) { setError("La imagen no puede superar los 5 MB."); return; } setUploading(kind); setError(""); const extension = file.name.split(".").pop()?.toLowerCase() || "jpg"; const path = `${session.user.id}/${kind}-${Date.now()}.${extension}`; const { error: uploadError } = await supabase.storage.from("profile-media").upload(path, file, { cacheControl: "3600", upsert: true, contentType: file.type }); if (uploadError) { setError(uploadError.message); setUploading(""); return; } const { data: publicData } = supabase.storage.from("profile-media").getPublicUrl(path); const field = kind === "avatar" ? "avatar_url" : "banner_url"; const { error: profileError } = await supabase.from("profiles").update({ [field]: publicData.publicUrl }).eq("id", session.user.id); if (profileError) setError(profileError.message); else setProfile((current) => ({ ...(current || { username: null, full_name: null, bio: null, city: null, avatar_url: null, banner_url: null }), [field]: publicData.publicUrl })); setUploading(""); event.target.value = ""; }
  const targetUserId = visitedUserId || session.user.id;
  const isOwnProfile = targetUserId === session.user.id;
  useEffect(() => { let cancelled = false; async function loadProfile() {
    let postQuery = supabase.from("posts").select("id, content, created_at").eq("author_id", targetUserId).order("created_at", { ascending: false }).limit(30);
    if (!isOwnProfile) { postQuery = postQuery.eq("visibility", "public"); }
    const [{ data: profileData, error: profileError }, { data: postData, error: postError }] = await Promise.all([
      supabase.from("profiles").select("id, username, full_name, bio, city, avatar_url, banner_url").eq("id", targetUserId).maybeSingle(),
      postQuery
    ]);
    if (cancelled) return;
    if (!profileData && !profileError) { setError("Usuario no encontrado"); return; }
    if (profileError || postError) { setError((profileError || postError)?.message || "No se pudo cargar el perfil."); return; }
    setProfile(profileData as ProfileData | null);
    setPosts((postData ?? []).map((post) => ({ id: post.id, text: post.content ?? "", time: formatPostTime(post.created_at), likes: 0, authorName: name })));
  } void loadProfile(); return () => { cancelled = true; }; }, [targetUserId, name, isOwnProfile]);
  async function publish(event: FormEvent) { event.preventDefault(); const content = draft.trim(); if (!content || saving) return; setSaving(true); setError(""); const { data, error: insertError } = await supabase.from("posts").insert({ author_id: session.user.id, content, visibility: "public" }).select("id, content, created_at").single(); if (insertError) setError(insertError.message); else if (data) { setPosts((current) => [{ id: data.id, text: data.content ?? content, time: "ahora", likes: 0, authorName: name }, ...current]); setDraft(""); } setSaving(false); }
  return <section className="profile-page">{!isOwnProfile && previousPage && <button className="back-button" onClick={() => navigate?.(previousPage)}>← Volver</button>}<aside className="profile-left"><section className="panel profile-summary"><div className="profile-summary-cover" /><div className="profile-summary-avatar">{profile?.avatar_url ? <img src={profile.avatar_url} alt={name} /> : initials}</div><h2>{name}</h2><span className="online-dot">● En línea</span><p>{profile?.city || "Sin especificar"}</p><p>Se unió en {new Date(session.user.created_at).toLocaleDateString("es-ES", { month: "long", year: "numeric" })}</p><p>0 amigos</p></section><section className="panel profile-side-card"><strong>ESCUCHANDO AHORA</strong><div className="profile-music-card"><span>♫</span><div><b>Inkorium Mix</b><small>Descubriendo sonidos...</small></div></div></section></aside><div className="profile-main"><section className="profile-hero panel"><div className="profile-cover" /><div className="profile-hero-body"><div className="profile-large-avatar">{profile?.avatar_url ? <img src={profile.avatar_url} alt={name} /> : initials}</div><div className="profile-heading"><h1>{name}</h1><p>{profile?.bio || "Comparte tus ideas, música y momentos en Inkorium."}</p><span>● En línea</span></div>{isOwnProfile ? <button className="profile-edit">Editar perfil</button> : <button className="profile-edit" onClick={() => navigate?.("mensajes")}>Mensaje</button>}<button className="profile-more">•••</button></div><nav className="profile-tabs"><button className="active">Tablón</button><button>Información</button><button>Fotos (0)</button><button>Vídeos (0)</button><button>Amigos</button></nav></section>{isOwnProfile ? <form className="profile-composer panel" onSubmit={(event) => void publish(event)}><div className="profile-mini-avatar">{initials}</div><input value={draft} onChange={(event) => setDraft(event.target.value)} placeholder="Escribe en tu tablón..." /><button className="publish" disabled={saving}>{saving ? "Guardando..." : "Publicar"}</button></form> : null}{error && <p className="message">{error}</p>}{posts.length ? posts.map((post) => <article className="post panel" key={post.id}><div className="post-head"><UserLink userId={targetUserId} name={name} avatarUrl={profile?.avatar_url} onClick={(id) => navigate?.("perfil", id)} /><div><span>{post.time} · ◉</span></div><button className="more">⌄</button></div><p className="post-text">{post.text}</p><div className="post-actions"><button>♡ Me gusta</button><button>◯ Comentar</button><button>♧ Compartir</button></div></article>) : <div className="profile-empty panel">{isOwnProfile ? "Todavía no hay publicaciones en tu tablón." : "No hay publicaciones públicas."}</div>}</div><aside className="profile-side"><section className="panel profile-info"><div className="profile-section-title"><strong>INFORMACIÓN</strong>{isOwnProfile && <button>Editar</button>}</div><p><b>Usuario</b><span>{profile?.username || fallbackName}</span></p><p><b>Ciudad</b><span>{profile?.city || "Sin especificar"}</span></p><p><b>Se unió</b><span>{new Date(session.user.created_at).toLocaleDateString("es-ES", { month: "long", year: "numeric" })}</span></p></section><section className="panel profile-side-card"><strong>FOTOS</strong><p>Comparte tus primeras fotos con la comunidad.</p><button>Subir una foto</button></section><section className="panel profile-side-card"><strong>ESCUCHANDO AHORA</strong><div className="profile-music-card"><span>♫</span><div><b>Inkorium Mix</b><small>Descubriendo sonidos...</small></div></div></section></aside></section>;
}

function ProfileMedia({ session, visitedUserId }: { session: Session; visitedUserId?: string | null }) { const [media, setMedia] = useState<{ avatar_url: string | null; banner_url: string | null }>({ avatar_url: null, banner_url: null }); const targetId = visitedUserId || session.user.id; useEffect(() => { void supabase.from("profiles").select("avatar_url, banner_url").eq("id", targetId).maybeSingle().then(({ data }) => { if (data) setMedia(data); }); }, [targetId]); return <div className="profile-upload-media">{media.banner_url && <div className="uploaded-banner" style={{ backgroundImage: `url(${media.banner_url})` }} />}{media.avatar_url && <img className="uploaded-avatar" src={media.avatar_url} alt="Foto de perfil" />}</div>; }

function ProfileView({ session, visitedUserId, previousPage, navigate }: { session: Session; visitedUserId?: string | null; previousPage?: Page | null; navigate?: (page: Page, userId?: string) => void }) {
  const [uploading, setUploading] = useState(""); const [error, setError] = useState(""); const [editing, setEditing] = useState<{ file: File; kind: "avatar" | "banner" } | null>(null);
  function openEditor(event: ChangeEvent<HTMLInputElement>, kind: "avatar" | "banner") { const file = event.target.files?.[0]; if (!file) return; if (!file.type.startsWith("image/") || file.size > 5 * 1024 * 1024) { setError("Selecciona una imagen de hasta 5 MB."); return; } setEditing({ file, kind }); event.target.value = ""; }
  async function saveEdited(file: File) { if (!editing) return; const kind = editing.kind; setEditing(null); setUploading(kind); setError(""); const path = session.user.id + "/" + kind + "-" + Date.now() + ".jpg"; const { error: uploadError } = await supabase.storage.from("profile-media").upload(path, file, { upsert: true, contentType: file.type }); if (uploadError) setError(uploadError.message); else { const { data } = supabase.storage.from("profile-media").getPublicUrl(path); const field = kind === "avatar" ? "avatar_url" : "banner_url"; const { error: updateError } = await supabase.from("profiles").update({ [field]: data.publicUrl }).eq("id", session.user.id); if (updateError) setError(updateError.message); else window.location.reload(); } setUploading(""); }
  return <div className="profile-edit-shell"><ProfileViewLegacy session={session} visitedUserId={visitedUserId} previousPage={previousPage} navigate={navigate} />{(visitedUserId == null || visitedUserId === session.user.id) ? <div className="profile-upload-zones"><label className="upload-banner" title="Cambiar banner"><input type="file" accept="image/*" onChange={(event) => openEditor(event, "banner")} />{uploading === "banner" && <span>Subiendo...</span>}</label><label className="upload-avatar" title="Cambiar foto de perfil"><input type="file" accept="image/*" onChange={(event) => openEditor(event, "avatar")} />{uploading === "avatar" && <span>...</span>}</label></div> : null}{error && <p className="message profile-upload-error">{error}</p>}{editing && <PhotoEditor file={editing.file} kind={editing.kind} onCancel={() => setEditing(null)} onSave={(file) => void saveEdited(file)} />}<ProfileMedia session={session} visitedUserId={visitedUserId} /></div>;
}

type SearchResult = { kind: "person" | "post" | "music" | "event"; id: string; title: string; subtitle: string | null; content: string | null; created_at: string | null };
function SearchView({ query, navigate }: { query: string; navigate: (page: Page, userId?: string) => void }) {
  const [results, setResults] = useState<SearchResult[]>([]); const [loading, setLoading] = useState(false); const [error, setError] = useState("");
  useEffect(() => { let cancelled = false; const term = query.trim(); if (!term) { setResults([]); return; } setLoading(true); setError(""); const timer = window.setTimeout(async () => { const { data, error: searchError } = await supabase.rpc("search_inkorium", { search_text: term }); if (cancelled) return; if (searchError) setError(searchError.message); else setResults((data ?? []) as SearchResult[]); setLoading(false); }, 250); return () => { cancelled = true; window.clearTimeout(timer); }; }, [query]);
  const group = (kind: SearchResult["kind"]) => results.filter((item) => item.kind === kind);
  return <section className="content-view"><h1>Resultados de busqueda</h1><p className="view-subtitle">Resultados reales de Supabase para <strong>{query || "todo"}</strong></p>{loading && <p>Buscando...</p>}{error && <p className="message">No se pudo realizar la búsqueda: {error}</p>}<div className="result-grid"><div className="result-card panel"><h2>Personas</h2>{group("person").length ? group("person").map((person) => <button className="result-row" key={person.id} onClick={() => navigate("perfil", person.id)}><UserLink userId={person.id} name={person.title} onClick={(id) => navigate("perfil", id)} /><span><small>{person.subtitle}</small></span></button>) : !loading && <p>No hay personas.</p>}</div><div className="result-card panel"><h2>Musica</h2>{group("music").length ? group("music").map((song) => <button className="result-row" key={song.id}><span className="music-square">♫</span><span><strong>{song.title}</strong><small>{song.subtitle}</small></span></button>) : !loading && <p>No hay canciones.</p>}</div></div><div className="result-card panel"><h2>Publicaciones y eventos</h2>{[...group("post"), ...group("event")].length ? [...group("post"), ...group("event")].map((item) => <p className="search-post" key={item.id}><span><strong>{item.title}</strong><br />{item.content || item.subtitle}</span><small>{item.kind}</small></p>) : !loading && <p>No hay publicaciones ni eventos.</p>}</div><button className="back-button" onClick={() => navigate("inicio")}>Volver al inicio</button></section>;
}
function MessagesView({ navigate }: { navigate: (page: Page, userId?: string) => void }) { return <section className="content-view"><h1>Mensajes</h1><p className="view-subtitle">Tus conversaciones en Inkorium.</p><div className="messages-layout panel"><div className="conversation selected"><UserLink userId="1" name="bg9222361" onClick={(id) => navigate("perfil", id)} /><div><small>Conectado ahora</small></div><b>›</b></div><div className="empty-chat"><span>▢</span><h2>Selecciona una conversacion</h2><p>Elige un contacto para comenzar a hablar.</p></div></div></section>; }
function PeopleView({ navigate }: { navigate: (page: Page, userId?: string) => void }) { return <section className="content-view"><h1>Personas</h1><p className="view-subtitle">Encuentra gente con tus mismos intereses.</p><div className="people-grid">{people.map((person) => <div className="person-card panel" key={person.id}><UserLink userId={person.id} name={person.name} onClick={(id) => navigate("perfil", id)} /><p>Amante de la musica y las ideas.</p><button onClick={() => navigate("mensajes")}>Enviar mensaje</button></div>)}</div></section>; }
function MusicView({ onPlay }: { onPlay: () => void }) { return <section className="content-view"><h1>Musica</h1><p className="view-subtitle">Escucha, descubre y comparte nuevos sonidos.</p><div className="music-list panel">{songs.map((song, index) => <div className="song-row" key={song}><span className="music-square">♫</span><div><strong>{song}</strong><small>Inkorium Music · pista {index + 1}</small></div><button onClick={onPlay}>▶ Escuchar</button></div>)}</div></section>; }

function Login() { const [email, setEmail] = useState(""); const [password, setPassword] = useState(""); const [mode, setMode] = useState<"login" | "signup">("login"); const [remember, setRemember] = useState(true); const [busy, setBusy] = useState(false); const [message, setMessage] = useState(""); async function submit(event: FormEvent) { event.preventDefault(); setBusy(true); setMessage(""); const result = mode === "login" ? await supabase.auth.signInWithPassword({ email, password }) : await supabase.auth.signUp({ email, password }); setMessage(result.error ? result.error.message : mode === "login" ? "Sesion iniciada." : "Cuenta creada. Revisa tu correo si hace falta."); setBusy(false); } async function recoverPassword() { if (!email) { setMessage("Escribe tu email para recuperar la contraseña."); return; } setBusy(true); const result = await supabase.auth.resetPasswordForEmail(email, { redirectTo: `${window.location.origin}/` }); setMessage(result.error ? result.error.message : "Te hemos enviado un enlace para cambiar la contraseña."); setBusy(false); } return <main className="page"><Brand /><div className="card"><div className="card-heading"><h1>{mode === "login" ? "Iniciar sesión" : "Crear una cuenta"}</h1><p>{mode === "login" ? "Entra en tu espacio creativo." : "Empieza tu espacio creativo."}</p></div><form onSubmit={(event) => void submit(event)}><label>Email<input type="email" value={email} onChange={(event) => setEmail(event.target.value)} required /></label><label>Contraseña<input type="password" value={password} onChange={(event) => setPassword(event.target.value)} minLength={6} required /></label><div className="form-options"><label className="remember"><input type="checkbox" checked={remember} onChange={(event) => setRemember(event.target.checked)} /><span>Recordarme en este equipo</span></label><button type="button" className="text-button" onClick={() => void recoverPassword()}>¿Contraseña olvidada?</button></div><button className="primary-button" disabled={busy}>{busy ? "Cargando..." : mode === "login" ? "Entrar" : "Crear cuenta"}</button></form>{message && <p className="message">{message}</p>}</div><div className="page-links"><button className="text-button" onClick={() => { setMode(mode === "login" ? "signup" : "login"); setMessage(""); }}>{mode === "login" ? "¿Quieres crear una cuenta?" : "¿Ya tienes una cuenta?"}</button><span>|</span><button className="text-button" onClick={() => void recoverPassword()}>Recordar contraseña</button></div></main>; }
function App() { const [session, setSession] = useState<Session | null>(null); const [profile, setProfile] = useState<ProfileData | null>(null); useEffect(() => { void supabase.auth.getSession().then(({ data }) => setSession(data.session)); const { data } = supabase.auth.onAuthStateChange((_event, next) => setSession(next)); return () => data.subscription.unsubscribe(); }, []); useEffect(() => { if (!session?.user?.id) return; let cancelled = false; supabase.from("profiles").select("username, full_name, bio, city, avatar_url, banner_url").eq("id", session.user.id).maybeSingle().then(({ data }) => { if (!cancelled && data) setProfile(data as ProfileData); }); return () => { cancelled = true; }; }, [session?.user?.id]); return session ? <Feed session={session} profile={profile} /> : <Login />; }
createRoot(document.getElementById("root")!).render(<StrictMode><App /></StrictMode>);
