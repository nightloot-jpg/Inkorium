import { useState } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import { Check, Edit3, Heart, MessageCircle, MoreHorizontal, Play, Share2, Trash2, X } from 'lucide-react';
import { useAuth } from '../../../hooks/useAuth';
import type { Post } from '../types';

interface PostCardProps {
  post: Post;
  musicVariant?: boolean;
  onLike: (id: string) => void;
  onUnlike: (id: string) => void;
  onComment: (id: string, content: string) => void;
  onDelete: (id: string) => void;
  onEdit: (id: string, content: string) => void;
}

export function PostCard({ post, musicVariant = false, onLike, onUnlike, onComment, onDelete, onEdit }: PostCardProps) {
  const { user } = useAuth();
  const [editing, setEditing] = useState(false);
  const [editText, setEditText] = useState(post.content || '');
  const [commentText, setCommentText] = useState('');
  const [commentsOpen, setCommentsOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  const liked = !!post.likes?.some((like) => like.user_id === user?.id);
  const owner = post.user_id === user?.id;
  const profileName = post.profiles?.full_name || 'Usuario';
  const avatar = post.profiles?.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(profileName)}`;
  const title = post.content?.split('\n')[0] || 'MHR, EFY & SNEZ! - Hola';

  const submitComment = (event: React.FormEvent) => {
    event.preventDefault();
    const text = commentText.trim();
    if (!text) return;
    onComment(post.id, text);
    setCommentText('');
  };

  return (
    <article className="feed-post">
      <header className="feed-post-header">
        <img src={avatar} alt="" className="feed-avatar" style={{ width: 46, height: 46, flexBasis: 46 }} />
        <div className="feed-post-meta">
          <p className="feed-post-name">{profileName}</p>
          <p className="feed-post-time"><span suppressHydrationWarning>{formatDistanceToNow(new Date(post.created_at), { addSuffix: true, locale: es })}</span> · 🌐</p>
        </div>
        {owner && (
          <div style={{ position: 'relative' }}>
            <button type="button" onClick={() => setMenuOpen((open) => !open)} className="feed-post-button" style={{ borderRadius: 999, padding: 8 }} aria-label="Opciones">
              <MoreHorizontal size={19} />
            </button>
            {menuOpen && (
              <div style={{ position: 'absolute', right: 0, top: 42, zIndex: 20, width: 145, border: '1px solid #dfe5ec', background: '#fff', boxShadow: '0 8px 22px rgba(0,0,0,.12)' }}>
                <button type="button" onClick={() => { setEditing(true); setMenuOpen(false); }} className="feed-post-button" style={{ width: '100%', justifyContent: 'flex-start' }}><Edit3 size={15} />Editar</button>
                <button type="button" onClick={() => { onDelete(post.id); setMenuOpen(false); }} className="feed-post-button" style={{ width: '100%', justifyContent: 'flex-start', color: '#c62828' }}><Trash2 size={15} />Eliminar</button>
              </div>
            )}
          </div>
        )}
      </header>

      {editing ? (
        <div style={{ padding: '0 18px 18px' }}>
          <textarea value={editText} onChange={(event) => setEditText(event.target.value)} rows={4} className="feed-composer-input" />
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 8 }}>
            <button type="button" onClick={() => setEditing(false)} className="feed-post-button" style={{ border: '1px solid #dfe5ec' }}><X size={14} />Cancelar</button>
            <button type="button" onClick={() => { onEdit(post.id, editText.trim()); setEditing(false); }} className="feed-publish"><Check size={14} style={{ display: 'inline', marginRight: 5 }} />Guardar</button>
          </div>
        </div>
      ) : musicVariant ? (
        <div className="feed-music">
          <div className="feed-music-row">
            <div className="feed-music-thumb">
              {post.photos?.[0]?.url && <img src={post.photos[0].url} alt="" />}
              <span className="feed-play"><Play size={22} fill="white" /></span>
            </div>
            <div className="feed-music-copy">
              <p className="feed-music-title">{title}</p>
              <p className="feed-music-subtitle">MHR MUSIC</p>
            </div>
            <span className="feed-music-duration">5:05</span>
          </div>
        </div>
      ) : (
        <>
          {post.content && <div className="feed-post-content">{post.content}</div>}
          {post.photos?.length > 0 && (
            <div className={`feed-post-media ${post.photos.length > 1 ? 'two' : ''}`}>
              {post.photos.slice(0, 4).map((photo) => <img key={photo.id} src={photo.url} alt={photo.caption || ''} />)}
            </div>
          )}
        </>
      )}

      <div className="feed-post-stats">
        <span>{post.likes?.length || 0} Me gusta</span>
        <span>{post.comments?.length || 0} comentarios · {post.post_shares?.length || 0} compartidos</span>
      </div>

      <div className="feed-post-buttons">
        <button type="button" onClick={() => liked ? onUnlike(post.id) : onLike(post.id)} className="feed-post-button" style={{ color: liked ? '#075db0' : undefined }}><Heart size={18} fill={liked ? 'currentColor' : 'none'} />Me gusta</button>
        <button type="button" onClick={() => setCommentsOpen((open) => !open)} className="feed-post-button"><MessageCircle size={18} />Comentar</button>
        <button type="button" className="feed-post-button"><Share2 size={18} />Compartir</button>
      </div>

      {commentsOpen && (
        <div style={{ borderTop: '1px solid #edf0f4', background: '#f7f9fb', padding: '12px 18px' }}>
          <div style={{ marginBottom: 12, maxHeight: 220, overflowY: 'auto' }}>
            {post.comments?.map((comment) => {
              const commentName = comment.profiles?.full_name || 'Usuario';
              const commentAvatar = comment.profiles?.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(commentName)}`;
              return <div key={comment.id} style={{ display: 'flex', gap: 8, marginBottom: 8, fontSize: 13 }}><img src={commentAvatar} alt="" className="feed-avatar" style={{ width: 32, height: 32, flexBasis: 32 }} /><p style={{ margin: 5 }}><b>{commentName}</b> {comment.content}</p></div>;
            })}
          </div>
          <form onSubmit={submitComment} style={{ display: 'flex', gap: 8 }}>
            <img src={user?.user_metadata?.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.user_metadata?.full_name || 'User')}`} alt="" className="feed-avatar" style={{ width: 32, height: 32, flexBasis: 32 }} />
            <input value={commentText} onChange={(event) => setCommentText(event.target.value)} placeholder="Escribe un comentario..." style={{ minWidth: 0, flex: 1, border: '1px solid #d7dee7', padding: '8px 11px', background: '#fff', outline: 'none' }} />
          </form>
        </div>
      )}
    </article>
  );
}
