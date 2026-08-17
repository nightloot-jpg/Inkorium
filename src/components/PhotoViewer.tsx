import { useState, useEffect } from "react";
import { X, ChevronLeft, ChevronRight, Heart, Share2 } from "lucide-react";
import { supabase } from "../lib/supabase";
import type { Session } from "@supabase/supabase-js";
import { formatPostTime } from "../utils";

type Props = {
  photo: any;
  photos: any[];
  session: Session;
  onClose: () => void;
  onNavigate: (photo: any) => void;
};

export function PhotoViewer({ photo, photos, session, onClose, onNavigate }: Props) {
  const currentIndex = photos.findIndex(p => p.id === photo.id);
  const [likes, setLikes] = useState(0);
  const [hasLiked, setHasLiked] = useState(false);
  const [comments, setComments] = useState<any[]>([]);
  const [newComment, setNewComment] = useState("");

  useEffect(() => {
    let cancelled = false;
    
    async function fetchDetails() {
      // Likes
      const { count } = await supabase.from('photo_likes').select('*', { count: 'exact', head: true }).eq('photo_id', photo.id);
      const { data: myLike } = await supabase.from('photo_likes').select('id').eq('photo_id', photo.id).eq('user_id', session.user.id).maybeSingle();
      
      // Comments
      const { data: commentsData } = await supabase
        .from('photo_comments')
        .select('*, profiles!photo_comments_author_id_fkey(username, full_name, avatar_url)')
        .eq('photo_id', photo.id)
        .order('created_at', { ascending: true });

      if (!cancelled) {
        setLikes(count || 0);
        setHasLiked(!!myLike);
        setComments(commentsData || []);
      }
    }
    
    fetchDetails();
    return () => { cancelled = true; };
  }, [photo.id, session.user.id]);

  async function toggleLike() {
    if (hasLiked) {
      setHasLiked(false);
      setLikes(l => l - 1);
      await supabase.from('photo_likes').delete().match({ photo_id: photo.id, user_id: session.user.id });
    } else {
      setHasLiked(true);
      setLikes(l => l + 1);
      await supabase.from('photo_likes').insert({ photo_id: photo.id, user_id: session.user.id });
    }
  }

  async function postComment(e: React.FormEvent) {
    e.preventDefault();
    if (!newComment.trim()) return;

    const text = newComment.trim();
    setNewComment("");

    const { data } = await supabase
      .from('photo_comments')
      .insert({ photo_id: photo.id, author_id: session.user.id, content: text })
      .select('*, profiles!photo_comments_author_id_fkey(username, full_name, avatar_url)')
      .single();

    if (data) {
      setComments(prev => [...prev, data]);
    }
  }

  return (
    <div className="photos-viewer-overlay">
      <button className="photos-viewer-close" onClick={onClose}><X size={24} /></button>
      
      {currentIndex > 0 && (
        <button className="photos-viewer-nav prev" onClick={() => onNavigate(photos[currentIndex - 1])}>
          <ChevronLeft size={32} />
        </button>
      )}
      
      {currentIndex < photos.length - 1 && (
        <button className="photos-viewer-nav next" onClick={() => onNavigate(photos[currentIndex + 1])}>
          <ChevronRight size={32} />
        </button>
      )}

      <div className="photos-viewer-content" onClick={(e) => e.stopPropagation()}>
        <div className="photos-viewer-image-section">
          <img src={photo.url} alt={photo.caption || "Fotografía"} />
        </div>
        
        <div className="photos-viewer-sidebar">
          <div className="photos-viewer-header">
            <div className="avatar tiny" style={{ width: 32, height: 32 }}>
              {photo.profiles?.avatar_url ? <img src={photo.profiles.avatar_url} /> : (photo.profiles?.username?.[0] || 'U').toUpperCase()}
            </div>
            <div>
              <strong style={{ display: 'block' }}>{photo.profiles?.username || photo.profiles?.full_name || 'Usuario'}</strong>
              <small style={{ color: 'var(--text-light)' }}>{formatPostTime(photo.created_at)}</small>
            </div>
          </div>
          
          <div className="photos-viewer-details">
            {photo.caption && <p className="photos-viewer-caption">{photo.caption}</p>}
          </div>

          <div className="photos-viewer-actions">
            <button style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, color: hasLiked ? '#e0245e' : 'inherit' }} onClick={toggleLike}>
              <Heart size={20} fill={hasLiked ? '#e0245e' : 'none'} />
              <span>{likes}</span>
            </button>
            <button style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
              <Share2 size={20} />
            </button>
          </div>

          <div className="photos-viewer-comments">
            {comments.map(c => (
              <div key={c.id} style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
                <div className="avatar tiny" style={{ width: 24, height: 24, flexShrink: 0 }}>
                  {c.profiles?.avatar_url ? <img src={c.profiles.avatar_url} /> : (c.profiles?.username?.[0] || 'U').toUpperCase()}
                </div>
                <div>
                  <strong style={{ fontSize: '0.9em' }}>{c.profiles?.username || c.profiles?.full_name || 'Usuario'}</strong>
                  <p style={{ margin: '2px 0 0', fontSize: '0.95em' }}>{c.content}</p>
                </div>
              </div>
            ))}
          </div>
          
          <form onSubmit={postComment} style={{ padding: 16, borderTop: '1px solid var(--border)', display: 'flex', gap: 8 }}>
            <input 
              type="text" 
              placeholder="Añadir comentario..." 
              value={newComment}
              onChange={e => setNewComment(e.target.value)}
              style={{ flex: 1, padding: '8px 12px', borderRadius: 20, border: '1px solid var(--border)', background: 'var(--bg-color)' }}
            />
          </form>
        </div>
      </div>
    </div>
  );
}
