import { StrictMode, useEffect, useState, useCallback, useRef, type ChangeEvent, type FormEvent } from "react";
import { useAuthStore, usePlayerStore, type ProfileData as StoreProfileData, type PlayerItem } from "./lib/store";
import { FloatingMusicPlayer, formatTime } from "./components_player";
import { createRoot } from "react-dom/client";
import { NotificationsPortal } from "./components/NotificationsPortal";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "./lib/supabase";
import Cropper from 'react-easy-crop';
import { getCroppedImg } from "./lib/cropImage";
import { getDisplayName, formatPostTime } from "./utils";
import { Play, Pause, SkipBack, SkipForward, Volume2, VolumeX, MoreVertical, Minus, Plus, Upload, Move, X, Bell, Search, Image, Video, Music, BarChart3, Newspaper, List, ChevronDown, Globe, Heart, MessageCircle, Share2, MoreHorizontal, Copy, Send, Calendar, MapPin, Loader2 } from "lucide-react";
import "./styles.css";
import { YoutubePlaylist } from './YoutubePlaylist';
import { SingleSongPlayer } from './components/SingleSongPlayer';

import { Composer } from './components/Composer';
import { PhotosPage } from './components/PhotosPage';
function Brand() { return <div className="brand"><img className="brand-mark" src="/inkorium-logo-white.svg" alt="" /><span>inkorium</span></div>; }
type Post = { id: string; text: string; time: string; likes: number; authorName?: string; authorAvatarUrl?: string | null; author_id: string; target_profile_id?: string | null; targetName?: string; shared_post_id?: string | null; originalPost?: { text: string; authorName: string; authorAvatarUrl?: string | null; time: string; author_id: string; }; commentsCount?: number; media_data?: any; poll_id?: string; };
type Page = "inicio" | "perfil" | "mensajes" | "personas" | "musica" | "buscar" | "fotos" | "videos";
export type ProfileData = { id?: string; username: string | null; full_name: string | null; bio: string | null; city: string | null; avatar_url: string | null; banner_url: string | null };
type NotificationData = { id: string; actor_id: string; type: string; entity_id: string; is_read: boolean; created_at: string; actor?: ProfileData };
 const songs = ["MHR, EFY & SNEZ! - Hola", "Inalcanzable", "Atardecer en Madrid", "Noches de verano"];






function CommentsSection({ postId, session, navigate }: { postId: string; session: Session; navigate: any }) {
  const [comments, setComments] = useState<any[]>([]);
  const [newComment, setNewComment] = useState("");
  const [loading, setLoading] = useState(!!import.meta.env.VITE_YOUTUBE_API_KEY);

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





const BG_GRADIENTS: Record<string, string> = {
    note: 'linear-gradient(135deg, #fef9c3, #fde68a)',
    ocean: 'linear-gradient(135deg, #38bdf8, #0ea5e9)',
    sunset: 'linear-gradient(135deg, #fb923c, #ef4444)',
    purple: 'linear-gradient(135deg, #a78bfa, #7c3aed)',
    forest: 'linear-gradient(135deg, #34d399, #059669)',
    slate: 'linear-gradient(135deg, #64748b, #1e293b)',
};

function formatEventDate(date?: string, time?: string) {
    if (!date) return '';
    try {
        const d = new Date(time ? `${date}T${time}` : `${date}T00:00`);
        const opts: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'long', year: 'numeric' };
        let out = d.toLocaleDateString('es-ES', opts);
        if (time) out += ` · ${time}`;
        return out;
    } catch (e) {
        return date;
    }
}

function PostMedia({ media, pollId, session, text }: { media?: any, pollId?: string, session: Session, text?: string }) {
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

    if (media?.type === "event") {
        return (
            <div style={{border: '1px solid var(--border)', borderRadius: 8, marginTop: 12, overflow: 'hidden'}}>
                <div style={{background: 'var(--primary)', color: '#fff', padding: '10px 16px', display: 'flex', alignItems: 'center', gap: 8}}>
                    <Calendar size={16} /> <strong>Evento</strong>
                </div>
                <div style={{padding: 16}}>
                    {text && <div style={{fontWeight: 600, marginBottom: 6}}>{text}</div>}
                    <div style={{fontSize: '0.9em', color: 'var(--text)'}}>{formatEventDate(media.date, media.time)}</div>
                    {media.location && <div style={{fontSize: '0.85em', marginTop: 4, opacity: 0.8}}>📍 {media.location}</div>}
                </div>
            </div>
        );
    }

    if (media?.type === "location") {
        const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(media.name)}`;
        return (
            <a href={mapsUrl} target="_blank" rel="noopener noreferrer" style={{display: 'flex', alignItems: 'center', gap: 8, marginTop: 12, padding: '10px 14px', border: '1px solid var(--border)', borderRadius: 8, textDecoration: 'none', color: 'inherit'}}>
                <MapPin size={18} style={{color: 'var(--primary)'}} /> <span>{media.name}</span>
            </a>
        );
    }

    if (media?.type === "background") {
        return (
            <div style={{
                minHeight: 160,
                borderRadius: 10,
                marginTop: 12,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                textAlign: 'center',
                padding: 24,
                color: '#fff',
                fontSize: '1.4em',
                fontWeight: 700,
                textShadow: '0 1px 3px rgba(0,0,0,0.25)',
                background: BG_GRADIENTS[media.style] || BG_GRADIENTS.note,
                wordBreak: 'break-word'
            }}>
                {text}
            </div>
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
  }; const [draft, setDraft] = useState(""); const [posts, setPosts] = useState<Post[]>([]); const [liked, setLiked] = useState<string[]>([]); const [feedError, setFeedError] = useState(""); const [openComments, setOpenComments] = useState<string | null>(null); const [shareMenu, setShareMenu] = useState<string | null>(null); const [postMenu, setPostMenu] = useState<string | null>(null); const [publishing, setPublishing] = useState(false); const [query, setQuery] = useState(""); const [notifications, setNotifications] = useState(false); const [unreadCount, setUnreadCount] = useState(0);
  const notificationsButtonRef = useRef<HTMLButtonElement>(null); const [userMenu, setUserMenu] = useState(false);
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


  const deletePost = async (id: string, mediaData: any) => {
    if (!window.confirm("¿Eliminar publicación?\n\nEsta acción no se puede deshacer.")) return;

    // First, try to delete the media from storage if it exists
    if (mediaData && mediaData.url) {
      try {
        const urlObj = new URL(mediaData.url);
        const pathParts = urlObj.pathname.split('/');
        const fileKey = pathParts.slice(pathParts.indexOf('post-media') + 1).join('/');

        if (fileKey) {
            await supabase.storage.from('post-media').remove([fileKey]);
        }
      } catch (e) {
        console.error("Failed to delete media from storage", e);
      }
    }

    const { error } = await supabase.from('posts').delete().eq('id', id);
    if (!error) {
      setPosts(posts => posts.filter(p => p.id !== id));
    } else {
      alert("Error al eliminar la publicación: " + error.message);
    }
    setPostMenu(null);
  };
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
    <header className="topbar"><button className="brand-button" onClick={() => navigate("inicio")}><Brand /></button><nav className="top-nav">{([["inicio", "Inicio"], ["perfil", "Perfil"], ["mensajes", "Mensajes"], ["personas", "Personas"], ["musica", "Musica"], ["fotos", "Fotos"]] as [Page, string][]).map(([id, label]) => <button className={page === id ? "active" : ""} onClick={() => navigate(id)} key={id}>{label}</button>)}</nav><form className="search-form" onSubmit={(event) => { event.preventDefault(); navigate("buscar"); }}><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Buscar personas, musica, videos..." /></form><div className="top-actions">
  <button className="icon-button" ref={notificationsButtonRef} onClick={() => setNotifications(!notifications)} aria-label="Notificaciones">
    <div className="bell-container">
      <Bell size={20} strokeWidth={2.5} />
      {unreadCount > 0 && <span className="notification-badge">{unreadCount > 99 ? '99+' : unreadCount}</span>}
    </div>
  </button>
  <button className="icon-button" onClick={() => playerState.isOpen ? playerState.closePlayer() : playerState.openPlayer()} aria-label="Reproductor">♫</button>
  <button className="user-chip" onClick={() => setUserMenu(!userMenu)}>
    <span className="avatar small">{username[0].toUpperCase()}</span>{username}
  </button>
</div><NotificationsPortal isOpen={notifications} onClose={() => setNotifications(false)} triggerRef={notificationsButtonRef}>
  <div className="popover notifications" style={{ position: "static", boxShadow: "0 8px 24px #18375b35" }}>
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
</div>
</NotificationsPortal>
{userMenu && <div className="popover user-menu"><strong>{username}</strong><button onClick={() => navigate("perfil")}>Mi perfil</button><button onClick={() => navigate("mensajes")}>Mis mensajes</button><hr /><span>Color de la web</span><div className="themes"><button className="theme-dot blue" onClick={() => setTheme("blue")} /><button className="theme-dot violet" onClick={() => setTheme("violet")} /><button className="theme-dot green" onClick={() => setTheme("green")} /><button className="theme-dot sunset" onClick={() => setTheme("sunset")} /></div><button onClick={() => void supabase.auth.signOut()}>Cerrar sesion</button></div>}</header>
    {page === "fotos" ? (
      <PhotosPage session={session} profileId={currentRoute.params?.userId} navigate={navigate} />
    ) : (
      <div className="feed-layout"><aside className="left-column"><section className="profile-card panel"><div className="avatar profile-avatar">{username[0].toUpperCase()}</div><div><strong>{username}</strong><span>Mas rapido</span><em>● En linea</em><button onClick={() => navigate("perfil")}>Ver mi perfil »</button></div></section><nav className="side-menu panel">{[["⌂", "Novedades", "inicio"], ["▧", "Fotos", "fotos"], ["▹", "Videos", "videos"], ["♫", "Musica", "musica"], ["□", "Eventos", "buscar"], ["♧", "Grupos", "personas"], ["⚑", "Paginas", "personas"], ["▥", "Encuestas", "buscar"], ["▱", "Guardados", "buscar"], ["⚙", "Configuracion", "personas"]].map(([icon, label, id], index) => <button className={page === id && index === 0 ? "selected" : ""} onClick={() => navigate(id as Page)} key={label}><span>{icon}</span>{label}</button>)}</nav><section className="friends panel"><strong>AMIGOS CONECTADOS (1)</strong><div><span className="avatar tiny">B</span><button onClick={() => navigate("personas")}>bg9222361</button><i /></div><button className="see-all" onClick={() => navigate("personas")}>Ver todos »</button></section></aside>
      <main className="stream">{page === "inicio" && <><Composer session={session} profile={profile} onPublish={(newPost) => setPosts(current => [newPost, ...current])} />{posts.length === 0 && !feedError && <p className="empty-feed">Todavia no hay publicaciones.</p>}{posts.map((post) => <article className="post panel" key={post.id}><div className="post-head">          <div style={{ position: "absolute", top: 12, right: 12 }}>            {post.author_id === session.user.id && (              <button className="icon-button" onClick={() => setPostMenu(postMenu === post.id ? null : post.id)}>                <MoreHorizontal size={16} />              </button>            )}            {postMenu === post.id && post.author_id === session.user.id && (              <div className="popover" style={{ top: 24, right: 0, minWidth: 150, zIndex: 10 }}>                <button onClick={() => deletePost(post.id, post.media_data)} style={{ color: "var(--error-color, #d32f2f)", textAlign: "left", width: "100%" }}>                  🗑 Eliminar publicación                </button>              </div>            )}          </div><UserLink userId={post.author_id} name={post.authorName || username} avatarUrl={post.authorAvatarUrl} navigate={navigate} />
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
          {post.media_data?.type !== "background" && post.text && <p className="post-text">{post.text}</p>}<PostMedia media={post.media_data} pollId={post.poll_id} session={session} text={post.text} />
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
          </article>)}</>}{page === "perfil" && <ProfileView session={session} visitedUserId={currentRoute.params?.userId} goBack={history.length > 1 ? goBack : undefined} navigate={navigate} />}{page === "buscar" && <SearchView query={query} navigate={navigate} goBack={history.length > 1 ? goBack : undefined} />}{page === "mensajes" && <MessagesView navigate={navigate} />}{page === "personas" && <PeopleView navigate={navigate} />}{page === "musica" && <MusicView onPlay={() => {}} />}{page === "videos" && <VideosView navigate={navigate} session={session} />}</main>
      <aside className="right-column"><section className="panel right-card"><strong>SOLICITUDES</strong><button>Ver todas</button><p>No tienes solicitudes pendientes.</p></section><section className="panel right-card"><strong>EVENTOS DESTACADOS</strong><button>Ver todos</button><div className="event"><div className="event-image">♫</div><div><b>Descubre Inkorium</b><p>Comparte tus momentos y musica.</p></div></div><button className="outline">Añadir a mi calendario</button></section><section className="panel calendar"><strong>CALENDARIO</strong><span>▣</span><h3>Agosto 2026</h3><div className="week">Lu　 Ma　 Mi　 Ju　 Vi　 Sa　 Do</div><div className="days">{Array.from({ length: 31 }, (_, index) => <i className={index === 12 ? "today" : ""} key={index}>{index + 1}</i>)}</div></section></aside></div>
    )}
    <button className="chat">▢ Chat (0)</button>
  </div>;
}

function PhotoEditor({ file, kind, onCancel, onSave }: { file: File; kind: "avatar" | "banner"; onCancel: () => void; onSave: (file: File) => void }) {
  const [preview, setPreview] = useState("");
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<{ x: number; y: number; width: number; height: number } | null>(null);
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

  useEffect(() => {
    const url = URL.createObjectURL(file);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  const onCropComplete = useCallback((croppedArea: any, croppedAreaPixels: any) => {
    setCroppedAreaPercentages(croppedArea);
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

        <div className="cropper-container">
          <Cropper
            image={preview}
            crop={crop}
            zoom={zoom}
            aspect={kind === "avatar" ? 1 : 1200 / 420}
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
            <input type="file" accept="image/*" onChange={(e) => {
              const newFile = e.target.files?.[0];
              if (newFile) {
                const url = URL.createObjectURL(newFile);
                setPreview(url);
                setZoom(1);
                setCrop({x:0, y:0});
                setHasInteracted(false);
              }
            }} style={{display: 'none'}}/>
          </label>
          <div className="footer-actions">
            <button onClick={onCancel} className="cancel-btn">Cancelar</button>
            <button className="publish" onClick={save}>
              {kind === "avatar" ? "Guardar foto" : "Guardar banner"}
            </button>
          </div>
        </footer>
      </section>
    </div>
  );
}

function ProfileViewLegacy({ session, visitedUserId, goBack, navigate }: { session: Session; visitedUserId?: string; goBack?: () => void; navigate: any }) {
  const fallbackName = "";
  const isOwnProfile = !visitedUserId || visitedUserId === session.user.id;
  const targetUserId = isOwnProfile ? session.user.id : visitedUserId;
  const [viewCount, setViewCount] = useState<number | null>(null);
  const profile = useAuthStore(state => state.profile);
  const setProfile = useAuthStore(state => state.setProfile); const [posts, setPosts] = useState<Post[]>([]); const [liked, setLiked] = useState<string[]>([]); const [draft, setDraft] = useState(""); const [saving, setSaving] = useState(false); const [uploading, setUploading] = useState<"avatar" | "banner" | "">(""); const [error, setError] = useState(""); const [profileNotFound, setProfileNotFound] = useState(false); const [openComments, setOpenComments] = useState<string | null>(null); const [shareMenu, setShareMenu] = useState<string | null>(null); const [postMenu, setPostMenu] = useState<string | null>(null);


  const deletePost = async (id: string, mediaData: any) => {
    if (!window.confirm("¿Eliminar publicación?\n\nEsta acción no se puede deshacer.")) return;

    // First, try to delete the media from storage if it exists
    if (mediaData && mediaData.url) {
      try {
        const urlObj = new URL(mediaData.url);
        const pathParts = urlObj.pathname.split('/');
        const fileKey = pathParts.slice(pathParts.indexOf('post-media') + 1).join('/');

        if (fileKey) {
            await supabase.storage.from('post-media').remove([fileKey]);
        }
      } catch (e) {
        console.error("Failed to delete media from storage", e);
      }
    }

    const { error } = await supabase.from('posts').delete().eq('id', id);
    if (!error) {
      setPosts(posts => posts.filter(p => p.id !== id));
    } else {
      alert("Error al eliminar la publicación: " + error.message);
    }
    setPostMenu(null);
  };
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
{error && <p className="message">{error}</p>}{posts.length ? posts.map((post) => <article className="post panel" key={post.id}><div className="post-head">          <div style={{ position: "absolute", top: 12, right: 12 }}>            {post.author_id === session.user.id && (              <button className="icon-button" onClick={() => setPostMenu(postMenu === post.id ? null : post.id)}>                <MoreHorizontal size={16} />              </button>            )}            {postMenu === post.id && post.author_id === session.user.id && (              <div className="popover" style={{ top: 24, right: 0, minWidth: 150, zIndex: 10 }}>                <button onClick={() => deletePost(post.id, post.media_data)} style={{ color: "var(--error-color, #d32f2f)", textAlign: "left", width: "100%" }}>                  🗑 Eliminar publicación                </button>              </div>            )}          </div><div className="avatar">{profile?.avatar_url ? <img src={profile.avatar_url} style={{width:"100%", height:"100%", borderRadius:"50%", objectFit:"cover"}}/> : initials}</div>
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
          {post.media_data?.type !== "background" && post.text && <p className="post-text">{post.text}</p>}<PostMedia media={post.media_data} pollId={post.poll_id} session={session} text={post.text} />
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

function Login() { const [email, setEmail] = useState(""); const [password, setPassword] = useState(""); const [mode, setMode] = useState<"login" | "signup">("login"); const [remember, setRemember] = useState(!!import.meta.env.VITE_YOUTUBE_API_KEY); const [busy, setBusy] = useState(false); const [message, setMessage] = useState(""); async function submit(event: FormEvent) { event.preventDefault(); setBusy(true); setMessage(""); const result = mode === "login" ? await supabase.auth.signInWithPassword({ email, password }) : await supabase.auth.signUp({ email, password }); setMessage(result.error ? result.error.message : mode === "login" ? "Sesion iniciada." : "Cuenta creada. Revisa tu correo si hace falta."); setBusy(false); } async function recoverPassword() { if (!email) { setMessage("Escribe tu email para recuperar la contraseña."); return; } setBusy(true); const result = await supabase.auth.resetPasswordForEmail(email, { redirectTo: `${window.location.origin}/` }); setMessage(result.error ? result.error.message : "Te hemos enviado un enlace para cambiar la contraseña."); setBusy(false); } return <main className="page"><Brand /><div className="card"><div className="card-heading"><h1>{mode === "login" ? "Iniciar sesión" : "Crear una cuenta"}</h1><p>{mode === "login" ? "Entra en tu espacio creativo." : "Empieza tu espacio creativo."}</p></div><form onSubmit={(event) => void submit(event)}><label>Email<input type="email" value={email} onChange={(event) => setEmail(event.target.value)} required /></label><label>Contraseña<input type="password" value={password} onChange={(event) => setPassword(event.target.value)} minLength={6} required /></label><div className="form-options"><label className="remember"><input type="checkbox" checked={remember} onChange={(event) => setRemember(event.target.checked)} /><span>Recordarme en este equipo</span></label><button type="button" className="text-button" onClick={() => void recoverPassword()}>¿Contraseña olvidada?</button></div><button className="primary-button" disabled={busy}>{busy ? "Cargando..." : mode === "login" ? "Entrar" : "Crear cuenta"}</button></form>{message && <p className="message">{message}</p>}</div><div className="page-links"><button className="text-button" onClick={() => { setMode(mode === "login" ? "signup" : "login"); setMessage(""); }}>{mode === "login" ? "¿Quieres crear una cuenta?" : "¿Ya tienes una cuenta?"}</button><span>|</span><button className="text-button" onClick={() => void recoverPassword()}>Recordar contraseña</button></div></main>; }

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


export function VideosView({ navigate, session }: { navigate: (page: Page) => void; session: any }) {
  const [youtubeSearch, setYoutubeSearch] = useState("");
  const [youtubeResults, setYoutubeResults] = useState<any[]>([]);
  const [youtubeSearching, setYoutubeSearching] = useState(false);
  const [youtubeHasKey, setYoutubeHasKey] = useState(!!import.meta.env.VITE_YOUTUBE_API_KEY);
  const playerState = usePlayerStore();

  async function searchYoutube(e: React.FormEvent) {
    e.preventDefault();
    if (!youtubeSearch.trim() || !youtubeHasKey) return;
    setYoutubeSearching(true);



    try {
      const apiKey = import.meta.env.VITE_YOUTUBE_API_KEY;
      const res = await fetch(`https://www.googleapis.com/youtube/v3/search?part=snippet&q=${encodeURIComponent(youtubeSearch)}&type=video&maxResults=12&key=${apiKey}`);
      if (!res.ok) throw new Error("Error en la API de YouTube");
      const data = await res.json();
      setYoutubeResults(data.items || []);
    } catch (err) {
      console.error(err);
      setYoutubeResults([]);
    } finally {
      setYoutubeSearching(false);
    }
  }

  return (
    <section className="content-view videos-view">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1>Vídeos</h1>
          <p className="view-subtitle">Busca y comparte vídeos con tus amigos.</p>
        </div>
        <button
          onClick={() => {
            window.dispatchEvent(new CustomEvent('open-composer-modal', { detail: { mode: 'upload' } }));
            setTimeout(() => window.dispatchEvent(new CustomEvent('open-composer-video', {})), 50);
          }}
          className="primary-button"
          style={{ height: '36px', padding: '0 16px', borderRadius: '4px' }}
        >
          + Subir vídeo
        </button>
      </div>

      <div className="panel" style={{ padding: '20px', marginTop: '16px' }}>
        <h2 style={{ fontSize: '15px', color: '#60758b', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          🎬 Buscar en YouTube
        </h2>

        <form onSubmit={searchYoutube} className="youtube-search-form" style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
          <div style={{ position: 'relative', flex: 1 }}>
            <Search size={16} style={{ position: 'absolute', left: '12px', top: '12px', color: '#a0b0c0' }} />
            <input
              value={youtubeSearch}
              onChange={(e) => setYoutubeSearch(e.target.value)}
              placeholder="Buscar vídeos en YouTube..."
              style={{ width: '100%', height: '40px', padding: '0 14px 0 36px', border: '1px solid #d5dce5', borderRadius: '4px' }}
            />
          </div>
          <button type="submit" disabled={!youtubeSearch.trim() || youtubeSearching} style={{ height: '40px', padding: '0 20px', background: '#0750A7', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 600 }}>
            {youtubeSearching ? <Loader2 size={16} className="spin" /> : "Buscar"}
          </button>
        </form>

        {!youtubeHasKey && (
          <div style={{ padding: '16px', background: '#ffebee', color: '#c62828', borderRadius: '4px', marginBottom: '20px' }}>
            La API Key de YouTube no está configurada. La búsqueda no funcionará.
          </div>
        )}

        {youtubeResults.length === 0 && !youtubeSearching && (
          <div style={{ textAlign: 'center', padding: '40px 0', color: '#8191a2' }}>
            Busca un vídeo en YouTube para empezar.
          </div>
        )}

        {youtubeResults.length > 0 && (
          <div className="youtube-results-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '16px' }}>
            {youtubeResults.map((item) => (
              <div key={item.id.videoId} className="youtube-result-card" style={{ border: '1px solid #e0e6ed', borderRadius: '4px', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
                <div style={{ position: 'relative', paddingTop: '56.25%', background: '#000' }}>
                  <img src={item.snippet.thumbnails?.high?.url || item.snippet.thumbnails?.medium?.url} alt="" style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
                </div>
                <div style={{ padding: '12px', display: 'flex', flexDirection: 'column', flex: 1 }}>
                  <strong style={{ fontSize: '13px', color: '#243a51', marginBottom: '4px', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{item.snippet.title}</strong>
                  <span style={{ fontSize: '11px', color: '#708196', marginBottom: '12px' }}>{item.snippet.channelTitle} · {new Date(item.snippet.publishedAt).toLocaleDateString()}</span>

                  <div style={{ display: 'flex', gap: '8px', marginTop: 'auto' }}>
                    <button
                      onClick={() => {
                        playerState.playSong({
                          video_id: item.id.videoId,
                          title: item.snippet.title,
                          thumbnail: item.snippet.thumbnails?.high?.url
                        });
                      }}
                      style={{ flex: 1, padding: '6px', background: '#f0f4f8', color: '#1760b0', border: '1px solid #d4dfeb', borderRadius: '3px', fontSize: '12px', cursor: 'pointer' }}
                    >
                      Ver
                    </button>
                    <button
                      onClick={() => {
                        window.dispatchEvent(new CustomEvent('open-composer-modal', { detail: { mode: 'youtube' } }));
                        setTimeout(() => window.dispatchEvent(new CustomEvent('open-composer-video', {
                          detail: {
                            youtube_id: item.id.videoId,
                            title: item.snippet.title,
                            thumbnail: item.snippet.thumbnails?.high?.url || item.snippet.thumbnails?.default?.url,
                            description: item.snippet.description,
                            channel: item.snippet.channelTitle
                          }
                        })), 50);
                      }}
                      style={{ flex: 1, padding: '6px', background: '#0750A7', color: '#fff', border: 'none', borderRadius: '3px', fontSize: '12px', cursor: 'pointer' }}
                    >
                      Compartir
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

createRoot(document.getElementById("root")!).render(<StrictMode><App /></StrictMode>);
