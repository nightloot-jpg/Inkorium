import { useState } from 'react';
import { Check, ChevronDown, Edit3, Heart, MessageCircle, Play, Share2, Trash2, X } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
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
  const [menuOpen, setMenuOpen] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editText, setEditText] = useState(post.content || '');
  const [commentsOpen, setCommentsOpen] = useState(false);
  const [commentText, setCommentText] = useState('');
  const liked = Boolean(post.likes?.some((like) => like.user_id === user?.id));
  const owner = post.user_id === user?.id;
  const name = post.profiles?.full_name || 'Usuario';
  const avatar = post.profiles?.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}`;

  const submitComment = (event: React.FormEvent) => {
    event.preventDefault();
    const value = commentText.trim();
    if (!value) return;
    onComment(post.id, value);
    setCommentText('');
  };

  return (
    <article className="feed-post">
      <header className="feed-post-header">
        <img src={avatar} alt="" className="feed-avatar" />
        <div className="feed-post-author">
          <strong>{name}</strong>
          <span><span suppressHydrationWarning>{formatDistanceToNow(new Date(post.created_at), { addSuffix: true, locale: es })}</span> · 🌐</span>
        </div>
        {owner && (
          <div className="feed-menu">
            <button type="button" onClick={() => setMenuOpen((value) => !value)} aria-label="Opciones"><ChevronDown size={18} /></button>
            {menuOpen && <div className="feed-menu-popover">
              <button type="button" onClick={() => { setEditing(true); setMenuOpen(false); }}><Edit3 size={14} />Editar</button>
              <button type="button" onClick={() => { onDelete(post.id); setMenuOpen(false); }} className="danger"><Trash2 size={14} />Eliminar</button>
            </div>}
          </div>
        )}
      </header>

      {editing ? (
        <div className="feed-edit">
          <textarea value={editText} onChange={(event) => setEditText(event.target.value)} rows={4} />
          <div><button type="button" onClick={() => setEditing(false)}><X size={14} />Cancelar</button><button type="button" className="primary" onClick={() => { onEdit(post.id, editText.trim()); setEditing(false); }}><Check size={14} />Guardar</button></div>
        </div>
      ) : musicVariant ? (
        <div className="feed-music">
          <div className="feed-music-thumb">
            {post.photos?.[0]?.url && <img src={post.photos[0].url} alt="" />}
            <span><Play size={22} fill="currentColor" /></span>
          </div>
          <div className="feed-music-info">
            <strong>{post.content?.split('\n')[0] || 'MHR, EFY & SNEZ! - Hola'}</strong>
            <span>MHR MUSIC</span>
          </div>
          <small>5:05</small>
        </div>
      ) : (
        <div className="feed-post-body">
          {post.content && <p>{post.content}</p>}
          {post.photos?.length > 0 && <div className={`feed-post-photos photos-${Math.min(post.photos.length, 4)}`}>{post.photos.slice(0, 4).map((photo) => <img key={photo.id} src={photo.url} alt={photo.caption || ''} />)}</div>}
        </div>
      )}

      <div className="feed-post-stats"><span>{post.likes?.length || 0} Me gusta</span><span>{post.comments?.length || 0} comentarios · {post.post_shares?.length || 0} compartidos</span></div>
      <div className="feed-post-actions">
        <button type="button" className={liked ? 'active' : ''} onClick={() => liked ? onUnlike(post.id) : onLike(post.id)}><Heart size={18} fill={liked ? 'currentColor' : 'none'} />Me gusta</button>
        <button type="button" onClick={() => setCommentsOpen((value) => !value)}><MessageCircle size={18} />Comentar</button>
        <button type="button"><Share2 size={18} />Compartir</button>
      </div>

      {commentsOpen && <div className="feed-comments">
        <div className="feed-comment-list">{post.comments?.map((comment) => <div key={comment.id} className="feed-comment"><img src={comment.profiles?.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(comment.profiles?.full_name || 'User')}`} alt="" /><p><strong>{comment.profiles?.full_name || 'Usuario'}</strong> {comment.content}</p></div>)}</div>
        <form onSubmit={submitComment} className="feed-comment-form"><img src={user?.user_metadata?.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.user_metadata?.full_name || 'User')}`} alt="" /><input value={commentText} onChange={(event) => setCommentText(event.target.value)} placeholder="Escribe un comentario…" /></form>
      </div>}
    </article>
  );
}
