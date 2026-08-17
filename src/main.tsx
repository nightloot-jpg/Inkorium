import { StrictMode, useEffect, useState, useCallback, type ChangeEvent, type FormEvent } from "react";
<<<<<<< HEAD
=======
import { useAuthStore, usePlayerStore, type ProfileData as StoreProfileData, type PlayerItem } from "./lib/store";
import { FloatingMusicPlayer, formatTime } from "./components_player";
>>>>>>> origin/main
import { createRoot } from "react-dom/client";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "./lib/supabase";
import Cropper from 'react-easy-crop';
import { getCroppedImg } from "./lib/cropImage";
<<<<<<< HEAD
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
=======
import { getDisplayName, formatPostTime } from "./utils";
import { Play, Pause, SkipBack, SkipForward, Volume2, VolumeX, MoreVertical, Minus, Plus, Upload, Move, X, Bell, Search, Image, Video, Music, BarChart3, Newspaper, List, ChevronDown, Globe, Heart, MessageCircle, Share2, MoreHorizontal, Copy, Send } from "lucide-react";
import "./styles.css";
import { YoutubePlaylist } from './YoutubePlaylist';
import { SingleSongPlayer } from './components/SingleSongPlayer';

import { Composer } from './components/Composer';
function Brand() { return <div className="brand"><img className="brand-mark" src="/inkorium-logo-white.svg" alt="" /><span>inkorium</span></div>; }
type Post = { id: string; text: string; time: string; likes: number; authorName?: string; authorAvatarUrl?: string | null; author_id: string; target_profile_id?: string | null; targetName?: string; shared_post_id?: string | null; originalPost?: { text: string; authorName: string; authorAvatarUrl?: string | null; time: string; author_id: string; }; commentsCount?: number; media_data?: any; poll_id?: string; };
type Page = "inicio" | "perfil" | "mensajes" | "personas" | "musica" | "buscar";
export type ProfileData = { id?: string; username: string | null; full_name: string | null; bio: string | null; city: string | null; avatar_url: string | null; banner_url: string | null };
type NotificationData = { id: string; actor_id: string; type: string; entity_id: string; is_read: boolean; created_at: string; actor?: ProfileData };
 const songs = ["MHR, EFY & SNEZ! - Hola", "Inalcanzable", "Atardecer en Madrid", "Noches de verano"];






function CommentsSection({ postId, session, navigate }: { postId: string; session: Session; navigate: any }) {
  const [comments, setComments] = useState<any[]>([]);
  const [newComment, setNewComment] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function loadComments() {
      const { data, error } = await supabase
        .from("comments")
        .select("id, content, created_at, author_id, profiles!comments_author_id_fkey(username, full_name, avatar_url)")
        .eq("post_id", postId)
        .order("created_at", { ascending: true });

      if (!cancelled && !error && data) {
        setComments(data);
      }
      if (!cancelled) setLoading(false);
    }
    loadComments();
    return () => { cancelled = true; };
  }, [postId]);

  async function postComment() {
    if (!newComment.trim()) return;
    const txt = newComment.trim();
    setNewComment("");

    const { data, error } = await supabase
      .from("comments")
      .insert({ post_id: postId, author_id: session.user.id, content: txt })
      .select("id, content, created_at, author_id, profiles!comments_author_id_fkey(username, full_name, avatar_url)")
      .single();

    if (!error && data) {
      setComments((prev) => [...prev, data]);
    }
  }

  return (
    <div className="post-comments">
      {loading ? <p style={{fontSize: "0.85em", color: "var(--text-light)"}}>Cargando comentarios...</p> : (
        <div className="comment-list">
          {comments.map(c => {
            const author = c.profiles;
            const name = author.username || author.full_name || "Usuario";
            return (
              <div key={c.id} className="comment-item">
                <UserLink userId={c.author_id} name={name} avatarUrl={author.avatar_url} navigate={navigate} />
                <div style={{flex: 1}}>
                  <div className="comment-content">
                    {c.content}
                  </div>
                  <div className="comment-meta">{formatPostTime(c.created_at)}</div>
                </div>
              </div>
            );
          })}
        </div>
      )}
      <div className="comment-input-area">
        <input
          type="text"
          placeholder="Escribe un comentario..."
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          onKeyDown={(e) => { if(e.key === 'Enter') postComment(); }}
        />
        <button onClick={postComment} disabled={!newComment.trim()}><Send size={14} /></button>
      </div>
    </div>
  );
}

function ShareMenu({ post, session, onClose }: { post: Post; session: Session; onClose: () => void }) {
  const shareUrl = `${window.location.origin}/post/${post.id}`; // Simple URL for now

  async function shareToFeed() {
    onClose();
    await supabase.from("posts").insert({
      author_id: session.user.id,
      content: "", // Can be empty if just sharing
      visibility: "public",
      shared_post_id: post.shared_post_id || post.id // Share original if it's already a share
    });
    // Ideally we'd trigger a reload here, but let's rely on optimistic UI if needed, or just let them see it on refresh
    window.location.reload();
  }

  return (
    <div className="share-menu-popover" style={{right: 16}}>
      <strong>Compartir</strong>
      <button onClick={shareToFeed}><Share2 size={16} /> Compartir en mi feed</button>
      <div style={{height: 1, background: "var(--border)", margin: "4px 0"}} />
      <strong style={{marginTop: 4}}>Compartir fuera de Inkorium</strong>
      <button onClick={() => {
        window.open(`https://api.whatsapp.com/send?text=Mira esta publicación en Inkorium: ${encodeURIComponent(shareUrl)}`);
        onClose();
      }}>WhatsApp</button>
      <button onClick={() => {
        window.open(`sms:?body=Mira esta publicación en Inkorium: ${encodeURIComponent(shareUrl)}`);
        onClose();
      }}>Mensajes</button>
      <button onClick={() => {
        navigator.clipboard.writeText(shareUrl);
        alert("Enlace copiado al portapapeles");
        onClose();
      }}><Copy size={16} /> Copiar enlace</button>
      {navigator.share && (
        <button onClick={() => {
          navigator.share({
            title: 'Publicación en Inkorium',
            text: 'Mira esta publicación en Inkorium',
            url: shareUrl,
          });
          onClose();
        }}>Otras opciones nativas...</button>
      )}
    </div>
  );
}





function PostMedia({ media, pollId, session }: { media?: any, pollId?: string, session: Session }) {
    if (!media && !pollId) return null;

    if (media?.type === "photo") {
        return <div style={{width: '100%', borderRadius: 8, marginTop: 12, maxHeight: 500, overflow: 'hidden', background: '#000', display: 'flex', justifyContent: 'center', alignItems: 'center'}}><img src={media.url} alt="Post media" style={{maxWidth: '100%', maxHeight: 500, objectFit: 'contain'}} /></div>;
    }

    if (media?.type === "video") {
        return <div style={{width: '100%', borderRadius: 8, marginTop: 12, maxHeight: 500, overflow: 'hidden', background: '#000', display: 'flex', justifyContent: 'center', alignItems: 'center'}}><video src={media.url} controls style={{maxWidth: '100%', maxHeight: 500}} /></div>;
    }

    if (media?.type === "youtube_video" || media?.type === "youtube_song") {
        return <SingleSongPlayer media={{...media, youtube_id: media.youtube_id || media.video_id}} />;
    }

    if (media?.type === "youtube_playlist") {
        return <YoutubePlaylist media={media} />;
    }

    if (media?.type === "news") {
        return (
            <a href={media.url} target="_blank" rel="noopener noreferrer" style={{display: 'block', textDecoration: 'none', color: 'inherit', border: '1px solid var(--border)', borderRadius: 8, overflow: 'hidden', marginTop: 12}}>
                <div style={{padding: 16, background: 'var(--panel-bg)'}}>
                    <strong style={{display: 'block', fontSize: '1.1em', marginBottom: 4}}>{media.title || media.url}</strong>
                    <span style={{color: 'var(--primary)', fontSize: '0.9em'}}>{new URL(media.url).hostname}</span>
                </div>
            </a>
        );
    }

    if (pollId) {
        return <PollView pollId={pollId} session={session} />;
    }
    return null;
}


function PollView({ pollId, session }: { pollId: string, session: Session }) {
    const [options, setOptions] = useState<any[]>([]);
    const [votes, setVotes] = useState<any[]>([]);
    const [hasVoted, setHasVoted] = useState(false);

    useEffect(() => {
        let cancelled = false;
        async function load() {
            const { data: opts } = await supabase.from("poll_options").select("*").eq("poll_id", pollId).order("order_index");
            if (cancelled || !opts) return;
            setOptions(opts);

            const { data: vts } = await supabase.from("poll_votes").select("*, poll_options!inner(poll_id)").eq("poll_options.poll_id", pollId);
            if (!cancelled && vts) {
                setVotes(vts);
                setHasVoted(vts.some(v => v.user_id === session.user.id));
            }
        }
        load();
        return () => { cancelled = true; };
    }, [pollId, session.user.id]);

    const handleVote = async (optionId: string) => {
        if (hasVoted) return;
        const { error } = await supabase.from("poll_votes").insert({ poll_option_id: optionId, user_id: session.user.id });
        if (!error) {
            setVotes([...votes, { poll_option_id: optionId, user_id: session.user.id }]);
            setHasVoted(true);
        }
    };

    if (options.length === 0) return null;

    const totalVotes = votes.length;

    return (
        <div style={{border: '1px solid var(--border)', borderRadius: 8, padding: 16, marginTop: 12}}>
            <div style={{display: 'flex', flexDirection: 'column', gap: 8}}>
                {options.map(opt => {
                    const optVotes = votes.filter(v => v.poll_option_id === opt.id).length;
                    const percent = totalVotes > 0 ? Math.round((optVotes / totalVotes) * 100) : 0;

                    return (
                        <div key={opt.id} style={{position: 'relative', overflow: 'hidden', borderRadius: 6, border: '1px solid var(--border)', cursor: hasVoted ? 'default' : 'pointer'}} onClick={() => handleVote(opt.id)}>
                            {hasVoted && (
                                <div style={{position: 'absolute', top: 0, left: 0, bottom: 0, width: `${percent}%`, background: 'var(--primary)', opacity: 0.2}} />
                            )}
                            <div style={{display: 'flex', justifyContent: 'space-between', padding: '10px 12px', position: 'relative', zIndex: 1}}>
                                <span>{opt.text}</span>
                                {hasVoted && <span style={{fontWeight: 'bold'}}>{percent}%</span>}
                            </div>
                        </div>
                    );
                })}
            </div>
            <div style={{marginTop: 12, fontSize: '0.85em', color: 'var(--text)', opacity: 0.7}}>
                {totalVotes} voto{totalVotes !== 1 ? 's' : ''}
            </div>
        </div>
    );
}

function Feed({ session, profile: initialProfile }: { session: Session, profile: ProfileData | null }) {
  const profile = useAuthStore(state => state.profile) || initialProfile;
  const username = getDisplayName(profile, session.user.email);
  const [history, setHistory] = useState<{page: Page, params?: Record<string, any>}[]>(() => {
    const saved = sessionStorage.getItem("inkorium-history");
    if (saved) {
      try { return JSON.parse(saved); } catch (e) {}
    }
    return [{ page: (sessionStorage.getItem("inkorium-page") as Page) || "inicio" }];
  });
  const currentRoute = history[history.length - 1];
  const page = currentRoute.page;

  const navigate = (newPage: Page, params?: Record<string, any>) => {
    setHistory((prev) => {
      const next = [...prev, { page: newPage, params }];
      sessionStorage.setItem("inkorium-history", JSON.stringify(next));
      sessionStorage.setItem("inkorium-page", newPage);
      return next;
    });
    setNotifications(false);
    setUserMenu(false);
  };

  const goBack = () => {
    setHistory((prev) => {
      if (prev.length <= 1) return prev;
      const next = prev.slice(0, -1);
      sessionStorage.setItem("inkorium-history", JSON.stringify(next));
      sessionStorage.setItem("inkorium-page", next[next.length - 1].page);
      return next;
    });
  }; const [draft, setDraft] = useState(""); const [posts, setPosts] = useState<Post[]>([]); const [liked, setLiked] = useState<string[]>([]); const [feedError, setFeedError] = useState(""); const [openComments, setOpenComments] = useState<string | null>(null); const [shareMenu, setShareMenu] = useState<string | null>(null); const [publishing, setPublishing] = useState(false); const [query, setQuery] = useState(""); const [notifications, setNotifications] = useState(false); const [unreadCount, setUnreadCount] = useState(0); const [userMenu, setUserMenu] = useState(false);
  const [notificationItems, setNotificationItems] = useState<NotificationData[]>([]);
  const playerState = usePlayerStore();

  useEffect(() => {
    let cancelled = false;
    async function loadNotifications() {
      const { data, error } = await supabase.from('notifications').select('*, actor:actor_id(id, username, full_name, avatar_url)').order('created_at', { ascending: false }).limit(20);
      if (cancelled) return;
      if (!error && data) {
        setNotificationItems(data as NotificationData[]);
        setUnreadCount(data.filter((n: any) => !n.is_read).length);
      }
    }
    void loadNotifications();

    const channel = supabase
      .channel('realtime_notifications')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'notifications', filter: `user_id=eq.${session.user.id}` }, () => {
        void loadNotifications();
      })
      .subscribe();

    return () => {
      cancelled = true;
      supabase.removeChannel(channel);
    };
  }, [session.user.id]);

  async function markAllRead() {
    await supabase.from('notifications').update({ is_read: true }).eq('user_id', session.user.id).eq('is_read', false);
    setNotificationItems(items => items.map(i => ({ ...i, is_read: true })));
    setUnreadCount(0);
    setNotifications(false);
  }

  async function markRead(id: string) {
    await supabase.from('notifications').update({ is_read: true }).eq('id', id);
    setNotificationItems(items => items.map(i => i.id === id ? { ...i, is_read: true } : i));
    setUnreadCount(prev => Math.max(0, prev - 1));
  }  const [theme, setTheme] = useState("blue"); const [position, setPosition] = useState({ x: 24, y: 90 }); const [dragging, setDragging] = useState(false);
  useEffect(() => { let cancelled = false; async function loadPosts() { const [{ data: postsData, error: postsError }, { data: likesData }] = await Promise.all([
      supabase.from("posts").select("id, content, created_at, author_id, target_profile_id, shared_post_id, media_data, poll_id, post_likes(count), comments(count), original_post:shared_post_id(content, created_at, author_id, profiles!posts_author_id_fkey(username, full_name, avatar_url))").eq("visibility", "public").is("group_id", null).is("target_profile_id", null).order("created_at", { ascending: false }).limit(30),
      supabase.from("post_likes").select("post_id").eq("user_id", session.user.id)
    ]);
    if (cancelled) return;
    if (postsError) { setFeedError(postsError.message); return; }

    const rows = postsData ?? [];
    const authorIds = [...new Set(rows.map((row) => row.author_id).filter(Boolean))];
    const { data: profiles, error: profilesError } = authorIds.length ? await supabase.from("profiles").select("id, username, full_name, avatar_url").in("id", authorIds) : { data: [], error: null };
    if (cancelled) return;
    if (profilesError) { setFeedError(profilesError.message); }

    const profileMap = new Map((profiles ?? []).map((profile) => [profile.id, profile]));
    setPosts(rows.map((row: any) => ({
      id: row.id,
      text: row.content ?? "",
      time: formatPostTime(row.created_at),
      likes: row.post_likes?.[0]?.count ?? 0,
      authorName: profileMap.has(row.author_id) ? getDisplayName(profileMap.get(row.author_id) || null, undefined) : (row.author_id === session.user.id ? username : "usuario"),
      authorAvatarUrl: profileMap.get(row.author_id)?.avatar_url || (row.author_id === session.user.id ? profile?.avatar_url : null),
      media_data: row.media_data,
      author_id: row.author_id,
      target_profile_id: row.target_profile_id,
      shared_post_id: row.shared_post_id,
      originalPost: row.original_post ? {
        text: row.original_post.content || "",
        authorName: row.original_post.profiles?.username || row.original_post.profiles?.full_name || "Usuario",
        authorAvatarUrl: row.original_post.profiles?.avatar_url || null,
        time: formatPostTime(row.original_post.created_at),
        author_id: row.original_post.author_id
      } : undefined,
      commentsCount: row.comments?.[0]?.count || 0
    })));
    setLiked((likesData ?? []).map(l => l.post_id)); } void loadPosts(); return () => { cancelled = true; }; }, [session.user.id, username]);

  async function toggleLike(id: string) {
    const active = liked.includes(id);
    setLiked(active ? liked.filter((item) => item !== id) : [...liked, id]);
    setPosts(posts.map((post) => post.id === id ? { ...post, likes: post.likes + (active ? -1 : 1) } : post));

    if (active) {
      await supabase.from("post_likes").delete().eq("post_id", id).eq("user_id", session.user.id);
    } else {
      await supabase.from("post_likes").insert({ post_id: id, user_id: session.user.id });
    }
  }

  return <div className={`feed-app theme-${theme}`}>
    <FloatingMusicPlayer />
    <header className="topbar"><button className="brand-button" onClick={() => navigate("inicio")}><Brand /></button><nav className="top-nav">{([["inicio", "Inicio"], ["perfil", "Perfil"], ["mensajes", "Mensajes"], ["personas", "Personas"], ["musica", "Musica"]] as [Page, string][]).map(([id, label]) => <button className={page === id ? "active" : ""} onClick={() => navigate(id)} key={id}>{label}</button>)}</nav><form className="search-form" onSubmit={(event) => { event.preventDefault(); navigate("buscar"); }}><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Buscar personas, musica, videos..." /></form><div className="top-actions">
  <button className="icon-button" onClick={() => setNotifications(!notifications)} aria-label="Notificaciones">
    <div className="bell-container">
      <Bell size={20} strokeWidth={2.5} />
      {unreadCount > 0 && <span className="notification-badge">{unreadCount > 99 ? '99+' : unreadCount}</span>}
    </div>
  </button>
  <button className="icon-button" onClick={() => playerState.isOpen ? playerState.closePlayer() : playerState.openPlayer()} aria-label="Reproductor">♫</button>
  <button className="user-chip" onClick={() => setUserMenu(!userMenu)}>
    <span className="avatar small">{username[0].toUpperCase()}</span>{username}
  </button>
</div>{notifications && <div className="popover notifications">
  <strong>NOTIFICACIONES</strong>
  <div className="notifications-list">
    {notificationItems.length === 0 ? (
      <div className="empty-notifications">
        <Bell size={24} style={{ opacity: 0.5, margin: "0 auto 8px", display: "block" }} />
        <p>No tienes notificaciones nuevas.</p>
      </div>
    ) : (
      notificationItems.map(notif => {
        const actorName = getDisplayName(notif.actor as any, undefined);
        let text = "ha interactuado contigo";
        if (notif.type === 'like') text = "Le ha gustado tu publicación";
        else if (notif.type === 'comment') text = "Ha comentado tu publicación";
        else if (notif.type === 'friend_request') text = "Te ha enviado una solicitud";

        return (
          <div key={notif.id} className={`notification-item ${notif.is_read ? 'read' : 'unread'}`} onClick={() => !notif.is_read && void markRead(notif.id)}>
            <UserLink userId={notif.actor?.id || ""} name={actorName} avatarUrl={notif.actor?.avatar_url} navigate={navigate} />
            <div className="notification-content">
              <span><br/>{text}</span>
              <small>{formatPostTime(notif.created_at)}</small>
            </div>
            {!notif.is_read && <div className="unread-dot"></div>}
          </div>
        );
      })
    )}
  </div>
  {notificationItems.length > 0 && <button onClick={() => void markAllRead()}>Marcar todo como leído</button>}
</div>}{userMenu && <div className="popover user-menu"><strong>{username}</strong><button onClick={() => navigate("perfil")}>Mi perfil</button><button onClick={() => navigate("mensajes")}>Mis mensajes</button><hr /><span>Color de la web</span><div className="themes"><button className="theme-dot blue" onClick={() => setTheme("blue")} /><button className="theme-dot violet" onClick={() => setTheme("violet")} /><button className="theme-dot green" onClick={() => setTheme("green")} /><button className="theme-dot sunset" onClick={() => setTheme("sunset")} /></div><button onClick={() => void supabase.auth.signOut()}>Cerrar sesion</button></div>}</header>
    <div className="feed-layout"><aside className="left-column"><section className="profile-card panel"><div className="avatar profile-avatar">{username[0].toUpperCase()}</div><div><strong>{username}</strong><span>Mas rapido</span><em>● En linea</em><button onClick={() => navigate("perfil")}>Ver mi perfil »</button></div></section><nav className="side-menu panel">{[["⌂", "Novedades", "inicio"], ["▧", "Fotos", "buscar"], ["▹", "Videos", "buscar"], ["♫", "Musica", "musica"], ["□", "Eventos", "buscar"], ["♧", "Grupos", "personas"], ["⚑", "Paginas", "personas"], ["▥", "Encuestas", "buscar"], ["▱", "Guardados", "buscar"], ["⚙", "Configuracion", "personas"]].map(([icon, label, id], index) => <button className={page === id && index === 0 ? "selected" : ""} onClick={() => navigate(id as Page)} key={label}><span>{icon}</span>{label}</button>)}</nav><section className="friends panel"><strong>AMIGOS CONECTADOS (1)</strong><div><span className="avatar tiny">B</span><button onClick={() => navigate("personas")}>bg9222361</button><i /></div><button className="see-all" onClick={() => navigate("personas")}>Ver todos »</button></section></aside>
      <main className="stream">{page === "inicio" && <><Composer session={session} profile={profile} onPublish={(newPost) => setPosts(current => [newPost, ...current])} />{posts.length === 0 && !feedError && <p className="empty-feed">Todavia no hay publicaciones.</p>}{posts.map((post) => <article className="post panel" key={post.id}><div className="post-head"><UserLink userId={post.author_id} name={post.authorName || username} avatarUrl={post.authorAvatarUrl} navigate={navigate} />
          <div>
            {post.target_profile_id && post.target_profile_id !== post.author_id ? (
              <span className="signature-meta" style={{display: "block", fontSize: "0.85em", color: "var(--text-light)"}}>
                dejó un mensaje en el tablón de {post.targetName || "alguien"}
              </span>
            ) : null}
            <span>{post.time} · ◉</span>
          </div></div>
          {post.shared_post_id && post.originalPost && (
             <div style={{fontSize: "0.85em", color: "var(--text-light)", marginBottom: 8, marginLeft: 16}}>
               Compartió una publicación de <strong>{post.originalPost.authorName}</strong>
             </div>
          )}
          {post.text && <p className="post-text">{post.text}</p>}<PostMedia media={post.media_data} pollId={post.poll_id} session={session} />
          {post.shared_post_id && post.originalPost && (
            <div className="shared-post-ref">
               <div className="post-head">
                 <strong>{post.originalPost.authorName}</strong>
                 <span style={{fontSize: "0.85em", color: "var(--text-light)"}}>{post.originalPost.time}</span>
               </div>
               <p className="post-text">{post.originalPost.text}</p>
            </div>
          )}
          <div className="post-actions" style={{position: "relative"}}><button onClick={() => toggleLike(post.id)} className={liked.includes(post.id) ? "is-liked" : ""}><Heart size={16} fill={liked.includes(post.id) ? "currentColor" : "none"} /> Me gusta</button><button onClick={() => setOpenComments(post.id === openComments ? null : post.id)}><MessageCircle size={16} /> Comentar {post.commentsCount ? `(${post.commentsCount})` : ''}</button><button onClick={() => setShareMenu(post.id === shareMenu ? null : post.id)}><Share2 size={16} /> Compartir</button><span style={{marginLeft: "auto", display: "flex", alignItems: "center", fontSize: "0.85em", color: "var(--text-light)"}}><Heart size={14} style={{display:"inline", verticalAlign:"middle", marginRight: 4, opacity: 0.7}} /> {post.likes}</span>
          {shareMenu === post.id && <ShareMenu post={post} session={session} onClose={() => setShareMenu(null)} />}
          </div>
          {openComments === post.id && <CommentsSection postId={post.id} session={session} navigate={navigate} />}
          </article>)}</>}{page === "perfil" && <ProfileView session={session} visitedUserId={currentRoute.params?.userId} goBack={history.length > 1 ? goBack : undefined} navigate={navigate} />}{page === "buscar" && <SearchView query={query} navigate={navigate} goBack={history.length > 1 ? goBack : undefined} />}{page === "mensajes" && <MessagesView navigate={navigate} />}{page === "personas" && <PeopleView navigate={navigate} />}{page === "musica" && <MusicView onPlay={() => {}} />}</main>
      <aside className="right-column"><section className="panel right-card"><strong>SOLICITUDES</strong><button>Ver todas</button><p>No tienes solicitudes pendientes.</p></section><section className="panel right-card"><strong>EVENTOS DESTACADOS</strong><button>Ver todos</button><div className="event"><div className="event-image">♫</div><div><b>Descubre Inkorium</b><p>Comparte tus momentos y musica.</p></div></div><button className="outline">Añadir a mi calendario</button></section><section className="panel calendar"><strong>CALENDARIO</strong><span>▣</span><h3>Agosto 2026</h3><div className="week">Lu　 Ma　 Mi　 Ju　 Vi　 Sa　 Do</div><div className="days">{Array.from({ length: 31 }, (_, index) => <i className={index === 12 ? "today" : ""} key={index}>{index + 1}</i>)}</div></section></aside></div>
    <button className="chat">▢ Chat (0)</button>
  </div>;
}

>>>>>>> origin/main
function PhotoEditor({ file, kind, onCancel, onSave }: { file: File; kind: "avatar" | "banner"; onCancel: () => void; onSave: (file: File) => void }) {
  const [preview, setPreview] = useState("");
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<{ x: number; y: number; width: number; height: number } | null>(null);
<<<<<<< HEAD
=======
  const [croppedAreaPercentages, setCroppedAreaPercentages] = useState<{ x: number; y: number; width: number; height: number } | null>(null);
  const [hasInteracted, setHasInteracted] = useState(false);

  useEffect(() => {
    // Lock body scroll
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, []);
>>>>>>> origin/main

  useEffect(() => {
    const url = URL.createObjectURL(file);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

<<<<<<< HEAD
  const onCropComplete = useCallback((_croppedArea: any, croppedAreaPixels: any) => {
=======
  const onCropComplete = useCallback((croppedArea: any, croppedAreaPixels: any) => {
    setCroppedAreaPercentages(croppedArea);
>>>>>>> origin/main
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

<<<<<<< HEAD
  return (
    <div className="photo-editor-backdrop">
      <section className="photo-editor">
        <header>
          <strong>Editar {kind === "avatar" ? "foto de perfil" : "banner"}</strong>
          <button onClick={onCancel}>×</button>
        </header>
=======
  const handleInteraction = () => {
    if (!hasInteracted) setHasInteracted(true);
  };

  return (
    <div className="photo-editor-backdrop" onTouchMove={(e) => e.stopPropagation()}>
      <section className="photo-editor">
        <header>
          <div className="editor-header-text">
            <strong>Editar {kind === "avatar" ? "foto de perfil" : "banner"}</strong>
            <p className="editor-help-text">Ajusta tu foto</p>
          </div>
          <button className="close-btn" onClick={onCancel} aria-label="Cerrar"><X size={24} /></button>
        </header>

>>>>>>> origin/main
        <div className="cropper-container">
          <Cropper
            image={preview}
            crop={crop}
            zoom={zoom}
            aspect={kind === "avatar" ? 1 : 1200 / 420}
<<<<<<< HEAD
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
=======
            onCropChange={(c) => { setCrop(c); handleInteraction(); }}
            onCropComplete={onCropComplete}
            onZoomChange={(z) => { setZoom(z); handleInteraction(); }}
            onInteractionStart={handleInteraction}
            cropShape={kind === "avatar" ? "round" : "rect"}
            showGrid={false}
          />
          {!hasInteracted && (
            <div className="drag-indicator">
              <Move size={20} />
              <span>ARRASTRA PARA AJUSTAR</span>
            </div>
          )}
        </div>

        <div className="editor-controls">
          <div className="zoom-controls">
            <button onClick={() => { setZoom(Math.max(1, zoom - 0.1)); handleInteraction(); }} aria-label="Alejar"><Minus size={18} /></button>
            <input
              type="range"
              min={1}
              max={3}
              step={0.01}
              value={zoom}
              onChange={(e) => { setZoom(Number(e.target.value)); handleInteraction(); }}
            />
            <button onClick={() => { setZoom(Math.min(3, zoom + 0.1)); handleInteraction(); }} aria-label="Acercar"><Plus size={18} /></button>
          </div>

          <div className="preview-section">
            <span className="preview-label">Vista previa</span>
            <div className={`preview-container ${kind}`}>
               {croppedAreaPercentages && preview && (
                 <div className="preview-crop-window">
                   <img
                     src={preview}
                     alt="Preview"
                     style={{
                       position: 'absolute',
                       width: `${100 / croppedAreaPercentages.width * 100}%`,
                       height: `${100 / croppedAreaPercentages.height * 100}%`,
                       left: `-${croppedAreaPercentages.x / croppedAreaPercentages.width * 100}%`,
                       top: `-${croppedAreaPercentages.y / croppedAreaPercentages.height * 100}%`,
                       maxWidth: 'none',
                       maxHeight: 'none',
                       pointerEvents: 'none'
                     }}
                   />
                 </div>
               )}
            </div>
          </div>
        </div>

        <footer>
          <label className="change-image-btn">
            <Upload size={18} />
            <span>Cambiar foto</span>
>>>>>>> origin/main
            <input type="file" accept="image/*" onChange={(e) => {
              const newFile = e.target.files?.[0];
              if (newFile) {
                const url = URL.createObjectURL(newFile);
                setPreview(url);
                setZoom(1);
                setCrop({x:0, y:0});
<<<<<<< HEAD
=======
                setHasInteracted(false);
>>>>>>> origin/main
              }
            }} style={{display: 'none'}}/>
          </label>
          <div className="footer-actions">
<<<<<<< HEAD
            <button onClick={onCancel}>Cancelar</button>
            <button className="publish" onClick={save}>Guardar</button>
=======
            <button onClick={onCancel} className="cancel-btn">Cancelar</button>
            <button className="publish" onClick={save}>
              {kind === "avatar" ? "Guardar foto" : "Guardar banner"}
            </button>
>>>>>>> origin/main
          </div>
        </footer>
      </section>
    </div>
  );
}

<<<<<<< HEAD
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
=======
function ProfileViewLegacy({ session, visitedUserId, goBack, navigate }: { session: Session; visitedUserId?: string; goBack?: () => void; navigate: any }) {
  const fallbackName = "";
  const isOwnProfile = !visitedUserId || visitedUserId === session.user.id;
  const targetUserId = isOwnProfile ? session.user.id : visitedUserId;
  const [viewCount, setViewCount] = useState<number | null>(null);
  const profile = useAuthStore(state => state.profile);
  const setProfile = useAuthStore(state => state.setProfile); const [posts, setPosts] = useState<Post[]>([]); const [liked, setLiked] = useState<string[]>([]); const [draft, setDraft] = useState(""); const [saving, setSaving] = useState(false); const [uploading, setUploading] = useState<"avatar" | "banner" | "">(""); const [error, setError] = useState(""); const [profileNotFound, setProfileNotFound] = useState(false); const [openComments, setOpenComments] = useState<string | null>(null); const [shareMenu, setShareMenu] = useState<string | null>(null);

async function toggleLike(id: string) {
    const active = liked.includes(id);
    setLiked(active ? liked.filter((item) => item !== id) : [...liked, id]);
    setPosts(posts.map((post) => post.id === id ? { ...post, likes: post.likes + (active ? -1 : 1) } : post));

    if (active) {
      await supabase.from("post_likes").delete().eq("post_id", id).eq("user_id", session.user.id);
    } else {
      await supabase.from("post_likes").insert({ post_id: id, user_id: session.user.id });
    }
  }
  const name = getDisplayName(profile, isOwnProfile ? session.user.email : undefined); const initials = name.slice(0, 2).toUpperCase();
  async function uploadMedia(event: ChangeEvent<HTMLInputElement>, kind: "avatar" | "banner") { const file = event.target.files?.[0]; if (!file) return; if (!file.type.startsWith("image/")) { setError("Selecciona una imagen válida."); return; } if (file.size > 5 * 1024 * 1024) { setError("La imagen no puede superar los 5 MB."); return; } setUploading(kind); setError(""); const extension = file.name.split(".").pop()?.toLowerCase() || "jpg"; const path = `${session.user.id}/${kind}-${Date.now()}.${extension}`; const { error: uploadError } = await supabase.storage.from("profile-media").upload(path, file, { cacheControl: "3600", upsert: true, contentType: file.type }); if (uploadError) { setError(uploadError.message); setUploading(""); return; } const { data: publicData } = supabase.storage.from("profile-media").getPublicUrl(path); const field = kind === "avatar" ? "avatar_url" : "banner_url"; const { error: profileError } = await supabase.from("profiles").update({ [field]: publicData.publicUrl }).eq("id", session.user.id); if (profileError) setError(profileError.message); else useAuthStore.getState().updateProfile({ [field]: publicData.publicUrl }); setUploading(""); event.target.value = ""; }
  useEffect(() => { let cancelled = false; async function loadProfile() { const [{ data: profileData, error: profileError }, { data: postData, error: postError }, { data: likesData }] = await Promise.all([
      supabase.from("profiles").select("username, full_name, bio, city, avatar_url, banner_url").eq("id", targetUserId).maybeSingle(),
      supabase.from("posts").select("id, content, created_at, target_profile_id, author_id, shared_post_id, media_data, poll_id, post_likes(count), comments(count), original_post:shared_post_id(content, created_at, author_id, profiles!posts_author_id_fkey(username, full_name, avatar_url))").or(`author_id.eq.${targetUserId},target_profile_id.eq.${targetUserId}`).order("created_at", { ascending: false }).limit(30),
      supabase.from("post_likes").select("post_id").eq("user_id", session.user.id)
    ]);
    if (cancelled) return;
    if (profileError || postError || (!isOwnProfile && !profileData)) { setError((profileError || postError)?.message || "No se pudo cargar el perfil."); setProfileNotFound(true); return; }
    setProfile(profileData as ProfileData | null);

    const rows = postData ?? [];
    const authorIds = [...new Set(rows.map((row) => row.author_id).filter(Boolean))];
    const { data: authors } = authorIds.length ? await supabase.from("profiles").select("id, username, full_name, avatar_url").in("id", authorIds) : { data: [] };
    const authorMap = new Map((authors || []).map((a: any) => [a.id, a]));
    setPosts(rows.map((post: any) => ({
      id: post.id,
      text: post.content ?? "",
      time: formatPostTime(post.created_at),
      likes: post.post_likes?.[0]?.count ?? 0,
      authorName: authorMap.has(post.author_id) ? getDisplayName(authorMap.get(post.author_id) || null, undefined) : "Usuario",
      authorAvatarUrl: authorMap.get(post.author_id)?.avatar_url || null,
      media_data: post.media_data,
      author_id: post.author_id,
      target_profile_id: post.target_profile_id,
      targetName: name,
      shared_post_id: post.shared_post_id,
      originalPost: post.original_post ? {
        text: post.original_post.content || "",
        authorName: post.original_post.profiles?.username || post.original_post.profiles?.full_name || "Usuario",
        authorAvatarUrl: post.original_post.profiles?.avatar_url || null,
        time: formatPostTime(post.original_post.created_at),
        author_id: post.original_post.author_id
      } : undefined,
      commentsCount: post.comments?.[0]?.count || 0
    })));

    setLiked((likesData ?? []).map(l => l.post_id)); } void loadProfile();

    if (!isOwnProfile && targetUserId) {
      void supabase.rpc("record_profile_view", { visited_profile_id: targetUserId });
    } else if (isOwnProfile) {
      void supabase.from("profile_views").select("*", { count: "exact", head: true }).eq("profile_id", session.user.id).then(({ count }) => {
        if (!cancelled && count !== null) setViewCount(count);
      });
    }

    return () => { cancelled = true; }; }, [targetUserId, name]);

  if (profileNotFound) {
    return <section className="profile-page" style={{padding: '2rem', textAlign: 'center'}}>
      <h2>Usuario no encontrado</h2>
      <p>{error || "No se ha podido cargar este perfil."}</p>
      {goBack && <button onClick={goBack} className="primary-button" style={{marginTop: '1rem'}}>Atrás</button>}
    </section>;
  }
  return <section className="profile-page"><aside className="profile-left"><section className="panel profile-summary"><div className="profile-summary-cover" /><div className="profile-summary-avatar">{profile?.avatar_url ? <img src={profile.avatar_url} alt={name} /> : initials}</div><h2>{name}</h2><span className="online-dot">● En línea</span>
    {isOwnProfile && viewCount !== null && (
        <span className="profile-views" style={{display: 'block', fontSize: '0.85em', color: 'var(--text-light)', marginTop: '4px'}}>
            {viewCount === 1 ? "1 visita al perfil" : `${viewCount} visitas al perfil`}
        </span>
    )}
    <p>{profile?.city || "Sin especificar"}</p>{isOwnProfile && <p>Se unió en {new Date(session.user.created_at).toLocaleDateString("es-ES", { month: "long", year: "numeric" })}</p>}<p>0 amigos</p></section><section className="panel profile-side-card"><strong>ESCUCHANDO AHORA</strong><div className="profile-music-card"><span>♫</span><div><b>Inkorium Mix</b><small>Descubriendo sonidos...</small></div></div></section></aside><div className="profile-main"><section className="profile-hero panel"><div className="profile-cover" /><div className="profile-hero-body"><div className="profile-large-avatar">{profile?.avatar_url ? <img src={profile.avatar_url} alt={name} /> : initials}</div><div className="profile-heading"><h1>{name}</h1><p>{profile?.bio || "Comparte tus ideas, música y momentos en Inkorium."}</p><span>● En línea</span>
    {isOwnProfile && viewCount !== null && (
        <span className="profile-views" style={{display: 'block', fontSize: '0.85em', color: 'var(--text-light)', marginTop: '4px'}}>
            {viewCount === 1 ? "1 visita al perfil" : `${viewCount} visitas al perfil`}
        </span>
    )}
    </div>
    {goBack && <button onClick={goBack} className="profile-edit" style={{marginRight: 8}}>Atrás</button>}
    {isOwnProfile && <button className="profile-edit">Editar perfil</button>}<button className="profile-more">•••</button></div><nav className="profile-tabs"><button className="active">Tablón</button><button>Información</button><button>Fotos (0)</button><button>Vídeos (0)</button><button>Amigos</button></nav></section>
      {isOwnProfile ? (
        <Composer session={session} profile={profile} onPublish={(newPost) => setPosts(curr => [newPost, ...curr])} targetProfileId={session.user.id} />
      ) : (
        <Composer session={session} profile={profile} onPublish={(newPost) => setPosts(curr => [newPost, ...curr])} targetProfileId={targetUserId!} targetName={name} />
      )}
{error && <p className="message">{error}</p>}{posts.length ? posts.map((post) => <article className="post panel" key={post.id}><div className="post-head"><div className="avatar">{profile?.avatar_url ? <img src={profile.avatar_url} style={{width:"100%", height:"100%", borderRadius:"50%", objectFit:"cover"}}/> : initials}</div>
          <div>
            <strong>{post.authorName || (post as any).name || "Usuario"}</strong>
            {post.target_profile_id && post.target_profile_id !== post.author_id ? (
              <span className="signature-meta" style={{display: "block", fontSize: "0.85em", color: "var(--text-light)"}}>
                dejó un mensaje en el tablón de {post.targetName || "alguien"}
              </span>
            ) : null}
            <span>{post.time} · ◉</span>
          </div></div>
          {post.shared_post_id && post.originalPost && (
             <div style={{fontSize: "0.85em", color: "var(--text-light)", marginBottom: 8, marginLeft: 16}}>
               Compartió una publicación de <strong>{post.originalPost.authorName}</strong>
             </div>
          )}
          {post.text && <p className="post-text">{post.text}</p>}<PostMedia media={post.media_data} pollId={post.poll_id} session={session} />
          {post.shared_post_id && post.originalPost && (
            <div className="shared-post-ref">
               <div className="post-head">
                 <strong>{post.originalPost.authorName}</strong>
                 <span style={{fontSize: "0.85em", color: "var(--text-light)"}}>{post.originalPost.time}</span>
               </div>
               <p className="post-text">{post.originalPost.text}</p>
            </div>
          )}
          <div className="post-actions" style={{position: "relative"}}><button onClick={() => void toggleLike(post.id)} className={liked.includes(post.id) ? "is-liked" : ""}><Heart size={16} fill={liked.includes(post.id) ? "currentColor" : "none"} /> Me gusta</button><button onClick={() => setOpenComments(post.id === openComments ? null : post.id)}><MessageCircle size={16} /> Comentar {post.commentsCount ? `(${post.commentsCount})` : ''}</button><button onClick={() => setShareMenu(post.id === shareMenu ? null : post.id)}><Share2 size={16} /> Compartir</button><span style={{marginLeft: "auto", display: "flex", alignItems: "center", fontSize: "0.85em", color: "var(--text-light)"}}><Heart size={14} style={{display:"inline", verticalAlign:"middle", marginRight: 4, opacity: 0.7}} /> {post.likes}</span>
          {shareMenu === post.id && <ShareMenu post={post} session={session} onClose={() => setShareMenu(null)} />}
          </div>
          {openComments === post.id && <CommentsSection postId={post.id} session={session} navigate={navigate} />}
          </article>) : <div className="profile-empty panel">Todavía no hay publicaciones en tu tablón.</div>}</div><aside className="profile-side"><section className="panel profile-info"><div className="profile-section-title"><strong>INFORMACIÓN</strong><button>Editar</button></div><p><b>Usuario</b><span>{profile?.username || fallbackName}</span></p><p><b>Ciudad</b><span>{profile?.city || "Sin especificar"}</span></p>{isOwnProfile && <p><b>Se unió</b><span>{new Date(session.user.created_at).toLocaleDateString("es-ES", { month: "long", year: "numeric" })}</span></p>}</section><section className="panel profile-side-card"><strong>FOTOS</strong><p>Comparte tus primeras fotos con la comunidad.</p><button>Subir una foto</button></section><section className="panel profile-side-card"><strong>ESCUCHANDO AHORA</strong><div className="profile-music-card"><span>♫</span><div><b>Inkorium Mix</b><small>Descubriendo sonidos...</small></div></div></section></aside></section>;
}

function ProfileMedia({ session }: { session: Session }) { const [media, setMedia] = useState<{ avatar_url: string | null; banner_url: string | null }>({ avatar_url: null, banner_url: null }); useEffect(() => { void supabase.from("profiles").select("avatar_url, banner_url").eq("id", session.user.id).maybeSingle().then(({ data }) => { if (data) setMedia(data); }); }, [session.user.id]); return <div className="profile-upload-media">{media.banner_url && <div className="uploaded-banner" style={{ backgroundImage: `url(${media.banner_url})` }} />}{media.avatar_url && <img className="uploaded-avatar" src={media.avatar_url} alt="Foto de perfil" />}</div>; }

function ProfileView({ session, visitedUserId, goBack, navigate }: { session: Session; visitedUserId?: string; goBack?: () => void; navigate: any }) {
  const [uploading, setUploading] = useState(""); const [error, setError] = useState(""); const [profileNotFound, setProfileNotFound] = useState(false); const [openComments, setOpenComments] = useState<string | null>(null); const [shareMenu, setShareMenu] = useState<string | null>(null); const [editing, setEditing] = useState<{ file: File; kind: "avatar" | "banner" } | null>(null);
  function openEditor(event: ChangeEvent<HTMLInputElement>, kind: "avatar" | "banner") { const file = event.target.files?.[0]; if (!file) return; if (!file.type.startsWith("image/") || file.size > 5 * 1024 * 1024) { setError("Selecciona una imagen de hasta 5 MB."); return; } setEditing({ file, kind }); event.target.value = ""; }
  async function saveEdited(file: File) { if (!editing) return; const kind = editing.kind; setEditing(null); setUploading(kind); setError(""); const path = session.user.id + "/" + kind + "-" + Date.now() + ".jpg"; const { error: uploadError } = await supabase.storage.from("profile-media").upload(path, file, { upsert: true, contentType: file.type }); if (uploadError) setError(uploadError.message); else { const { data } = supabase.storage.from("profile-media").getPublicUrl(path); const field = kind === "avatar" ? "avatar_url" : "banner_url"; const { error: updateError } = await supabase.from("profiles").update({ [field]: data.publicUrl }).eq("id", session.user.id); if (updateError) setError(updateError.message); else { useAuthStore.getState().updateProfile({ [field]: data.publicUrl }); } } setUploading(""); }
  const isOwnProfile = !visitedUserId || visitedUserId === session.user.id;
  return <div className="profile-edit-shell"><ProfileViewLegacy session={session} visitedUserId={visitedUserId} goBack={goBack} navigate={navigate} />{isOwnProfile && <div className="profile-upload-zones"><label className="upload-banner" title="Cambiar banner"><input type="file" accept="image/*" onChange={(event) => openEditor(event, "banner")} />{uploading === "banner" && <span>Subiendo...</span>}</label><label className="upload-avatar" title="Cambiar foto de perfil"><input type="file" accept="image/*" onChange={(event) => openEditor(event, "avatar")} />{uploading === "avatar" && <span>...</span>}</label></div>}{error && <p className="message profile-upload-error">{error}</p>}{editing && <PhotoEditor file={editing.file} kind={editing.kind} onCancel={() => setEditing(null)} onSave={(file) => void saveEdited(file)} />}{isOwnProfile && <ProfileMedia session={session} />}</div>;
}

type SearchResult = { kind: "person" | "post" | "music" | "event"; id: string; title: string; subtitle: string | null; content: string | null; created_at: string | null };
function SearchView({ query, navigate, goBack }: { query: string; navigate: (page: Page, params?: Record<string, any>) => void; goBack?: () => void }) {
  const [results, setResults] = useState<SearchResult[]>([]); const [loading, setLoading] = useState(false); const [error, setError] = useState(""); const [profileNotFound, setProfileNotFound] = useState(false); const [openComments, setOpenComments] = useState<string | null>(null); const [shareMenu, setShareMenu] = useState<string | null>(null);
  useEffect(() => { let cancelled = false; const term = query.trim(); if (!term) { setResults([]); return; } setLoading(true); setError(""); const timer = window.setTimeout(async () => { const { data, error: searchError } = await supabase.rpc("search_inkorium", { search_text: term }); if (cancelled) return; if (searchError) setError(searchError.message); else setResults((data ?? []) as SearchResult[]); setLoading(false); }, 250); return () => { cancelled = true; window.clearTimeout(timer); }; }, [query]);
  const group = (kind: SearchResult["kind"]) => results.filter((item) => item.kind === kind);
  return <section className="content-view"><h1>Resultados de busqueda</h1><p className="view-subtitle">Resultados reales de Supabase para <strong>{query || "todo"}</strong></p>{loading && <p>Buscando...</p>}{error && <p className="message">No se pudo realizar la búsqueda: {error}</p>}<div className="result-grid"><div className="result-card panel"><h2>Personas</h2>{group("person").length ? group("person").map((person) => <button className="result-row" key={person.id}><UserLink userId={person.id} name={person.title} navigate={navigate} /><span><small>{person.subtitle}</small></span></button>) : !loading && <p>No hay personas.</p>}</div><div className="result-card panel"><h2>Musica</h2>{group("music").length ? group("music").map((song) => <button className="result-row" key={song.id}><span className="music-square">♫</span><span><strong>{song.title}</strong><small>{song.subtitle}</small></span></button>) : !loading && <p>No hay canciones.</p>}</div></div><div className="result-card panel"><h2>Publicaciones y eventos</h2>{[...group("post"), ...group("event")].length ? [...group("post"), ...group("event")].map((item) => <p className="search-post" key={item.id}><span><strong>{item.title}</strong><br />{item.content || item.subtitle}</span><small>{item.kind}</small></p>) : !loading && <p>No hay publicaciones ni eventos.</p>}</div><button className="back-button" onClick={() => goBack ? goBack() : navigate("inicio")}>Volver</button></section>;
}
function MessagesView({ navigate }: { navigate: (page: Page, params?: Record<string, any>) => void }) {
  const [users, setUsers] = useState<ProfileData[]>([]);
  useEffect(() => {
    supabase.from("profiles").select("*").limit(5).then(({ data }) => setUsers(data || []));
  }, []);

  return <section className="content-view"><h1>Mensajes</h1><p className="view-subtitle">Tus conversaciones en Inkorium.</p><div className="messages-layout panel">
  <div style={{display:"flex", flexDirection:"column", borderRight:"1px solid var(--border)", paddingRight: 16}}>
    {users.map(user => (
      <div key={user.id} className="conversation" style={{padding: 8, display: "flex", alignItems: "center", gap: 12}}>
        <UserLink userId={user.id!} name={user.username || user.full_name || "Usuario"} avatarUrl={user.avatar_url} navigate={navigate} />
      </div>
    ))}
    {users.length === 0 && <p style={{opacity: 0.5, padding: 12}}>No hay contactos.</p>}
  </div>
  <div className="empty-chat"><span>▢</span><h2>Selecciona una conversacion</h2><p>Elige un contacto para comenzar a hablar.</p></div></div></section>;
}
function PeopleView({ navigate }: { navigate: (page: Page, params?: Record<string, any>) => void }) {
  const [users, setUsers] = useState<ProfileData[]>([]);
  useEffect(() => {
    supabase.from("profiles").select("*").limit(20).then(({ data }) => setUsers(data || []));
  }, []);

  return <section className="content-view"><h1>Personas</h1><p className="view-subtitle">Encuentra gente con tus mismos intereses.</p><div className="people-grid">
    {users.map((person) => (
      <div className="person-card panel" key={person.id}>
        <div style={{marginBottom: 16}}>
          <UserLink userId={person.id!} name={person.username || person.full_name || "Usuario"} avatarUrl={person.avatar_url} navigate={navigate} />
        </div>
        <p>{person.bio || "Amante de la música y las ideas."}</p>
        <button onClick={() => navigate("mensajes")}>Enviar mensaje</button>
      </div>
    ))}
  </div></section>;
}
function MusicView({ onPlay }: { onPlay: () => void }) { return <section className="content-view"><h1>Musica</h1><p className="view-subtitle">Escucha, descubre y comparte nuevos sonidos.</p><div className="music-list panel">{songs.map((song, index) => <div className="song-row" key={song}><span className="music-square">♫</span><div><strong>{song}</strong><small>Inkorium Music · pista {index + 1}</small></div><button onClick={onPlay}>▶ Escuchar</button></div>)}</div></section>; }

function Login() { const [email, setEmail] = useState(""); const [password, setPassword] = useState(""); const [mode, setMode] = useState<"login" | "signup">("login"); const [remember, setRemember] = useState(true); const [busy, setBusy] = useState(false); const [message, setMessage] = useState(""); async function submit(event: FormEvent) { event.preventDefault(); setBusy(true); setMessage(""); const result = mode === "login" ? await supabase.auth.signInWithPassword({ email, password }) : await supabase.auth.signUp({ email, password }); setMessage(result.error ? result.error.message : mode === "login" ? "Sesion iniciada." : "Cuenta creada. Revisa tu correo si hace falta."); setBusy(false); } async function recoverPassword() { if (!email) { setMessage("Escribe tu email para recuperar la contraseña."); return; } setBusy(true); const result = await supabase.auth.resetPasswordForEmail(email, { redirectTo: `${window.location.origin}/` }); setMessage(result.error ? result.error.message : "Te hemos enviado un enlace para cambiar la contraseña."); setBusy(false); } return <main className="page"><Brand /><div className="card"><div className="card-heading"><h1>{mode === "login" ? "Iniciar sesión" : "Crear una cuenta"}</h1><p>{mode === "login" ? "Entra en tu espacio creativo." : "Empieza tu espacio creativo."}</p></div><form onSubmit={(event) => void submit(event)}><label>Email<input type="email" value={email} onChange={(event) => setEmail(event.target.value)} required /></label><label>Contraseña<input type="password" value={password} onChange={(event) => setPassword(event.target.value)} minLength={6} required /></label><div className="form-options"><label className="remember"><input type="checkbox" checked={remember} onChange={(event) => setRemember(event.target.checked)} /><span>Recordarme en este equipo</span></label><button type="button" className="text-button" onClick={() => void recoverPassword()}>¿Contraseña olvidada?</button></div><button className="primary-button" disabled={busy}>{busy ? "Cargando..." : mode === "login" ? "Entrar" : "Crear cuenta"}</button></form>{message && <p className="message">{message}</p>}</div><div className="page-links"><button className="text-button" onClick={() => { setMode(mode === "login" ? "signup" : "login"); setMessage(""); }}>{mode === "login" ? "¿Quieres crear una cuenta?" : "¿Ya tienes una cuenta?"}</button><span>|</span><button className="text-button" onClick={() => void recoverPassword()}>Recordar contraseña</button></div></main>; }

function UserLink({ userId, name, avatarUrl, navigate, onClick }: { userId: string; name: string; avatarUrl?: string | null; navigate: (page: Page, params?: Record<string, any>) => void; onClick?: () => void }) {
  return (
    <div
      className="user-link"
      style={{ display: "inline-flex", alignItems: "center", gap: "8px", cursor: "pointer", transition: "opacity 0.2s" }}
      onClick={(e) => {
        e.stopPropagation();
        if (onClick) onClick();
        navigate("perfil", { userId });
      }}
      onMouseEnter={(e) => e.currentTarget.style.opacity = "0.8"}
      onMouseLeave={(e) => e.currentTarget.style.opacity = "1"}
    >
      <div className="avatar tiny" style={{ flexShrink: 0, width: "24px", height: "24px" }}>
        {avatarUrl ? <img src={avatarUrl} alt={name} style={{ width: "100%", height: "100%", borderRadius: "50%", objectFit: "cover" }} /> : name[0]?.toUpperCase()}
      </div>
      <strong style={{ fontSize: "0.95em" }}>{name}</strong>
    </div>
  );
}

function App() {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<ProfileData | null>(null);

  useEffect(() => {
    void supabase.auth.getSession().then(({ data }) => setSession(data.session));
    const { data } = supabase.auth.onAuthStateChange((_event, next) => setSession(next));
    return () => data.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!session?.user?.id) return;
    let cancelled = false;
    supabase.from("profiles").select("id, username, full_name, bio, city, avatar_url, banner_url").eq("id", session.user.id).maybeSingle().then(({ data }) => {
      if (!cancelled && data) setProfile(data as ProfileData);
    });
    return () => { cancelled = true; };
  }, [session?.user?.id]);

  return session ? <Feed session={session} profile={profile} /> : <Login />;
}
>>>>>>> origin/main
createRoot(document.getElementById("root")!).render(<StrictMode><App /></StrictMode>);
