import { useDebounce } from "react-use";
import React, { StrictMode, useEffect, useState, useCallback, useRef, type ChangeEvent, type FormEvent } from "react";
import { useAuthStore, usePlayerStore, type ProfileData as StoreProfileData, type PlayerItem } from "./lib/store";
import { FloatingMusicPlayer, formatTime } from "./components_player";
import { MusicView } from "./features/music/MusicView";
import { createRoot } from "react-dom/client";
import { createPortal } from "react-dom";
import { NotificationsPortal } from "./components/NotificationsPortal";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "./lib/supabase";
import Cropper from 'react-easy-crop';
import { getCroppedImg } from "./lib/cropImage";
import { getDisplayName, formatPostTime } from "./utils";
import { Play, Pause, SkipBack, SkipForward, Volume2, VolumeX, MoreVertical, Minus, Plus, Upload, Move, X, Bell, Search, Image, Video, Music, BarChart3, Newspaper, List, ChevronDown, ChevronLeft, ChevronRight, Users, Globe, Heart, MessageCircle, Share2, MoreHorizontal, Copy, Send, Calendar, MapPin, Loader2, BadgeCheck, Palette, Shuffle, Repeat, Camera } from "lucide-react";
import "./styles.css";
import { YoutubePlaylist } from './YoutubePlaylist';
import { SingleSongPlayer } from './components/SingleSongPlayer';

import { Composer } from './components/Composer';
import { PhotosPage } from './components/PhotosPage';
import { ChatWidget } from './ChatWidget';
import { PeopleView } from './PeopleView';
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
      <div style={{height: 1, background: "var(--border)", margin: "4px 0" }} />
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
        return <div style={{width: '100%', marginTop: 10, maxHeight: 460, overflow: 'hidden', background: '#eef2f6'}}><img src={media.url} alt="Post media" style={{width: '100%', maxHeight: 460, objectFit: 'cover', display: 'block'}} /></div>;
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
  const [videoToShare, setVideoToShare] = useState<any>(null);

  useEffect(() => {
    const handleShare = (e: any) => setVideoToShare(e.detail);
    window.addEventListener("open-share-video", handleShare);
    return () => window.removeEventListener("open-share-video", handleShare);
  }, []);

  // IMPORTANT: this is the authenticated user's profile only.
  // A visited profile must never overwrite the auth store.
  const authProfile = useAuthStore(state => state.profile) || initialProfile;
  const username = getDisplayName(authProfile, session.user.email);
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
  };

  // ... existing Feed implementation unchanged from this point onward ...
