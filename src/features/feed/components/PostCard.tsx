import { useState } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import { Heart, MessageCircle, Share2, MoreHorizontal, Edit, Trash, Check, X } from 'lucide-react';
import { useAuth } from '../../../hooks/useAuth';
import type { Post } from '../types';

interface PostCardProps {
  post: Post;
  onLike: (postId: string) => void;
  onUnlike: (postId: string) => void;
  onAddComment: (postId: string, content: string) => void;
  onDelete: (postId: string) => void;
  onEdit: (postId: string, content: string) => void;
}

export function PostCard({
 post, onLike, onUnlike, onAddComment, onDelete, onEdit }: PostCardProps) {
  const { user } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(post.content || '');
  const [showComments, setShowComments] = useState(false);
  const [commentContent, setCommentContent] = useState('');
  const [showOptions, setShowOptions] = useState(false);

  const isLiked = post.likes?.some(like => like.user_id === user?.id);
  const isOwner = post.user_id === user?.id;

  const handleLikeToggle = () => {
    if (isLiked) {
      onUnlike(post.id);
    } else {
      onLike(post.id);
    }
  };

  const handleCommentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentContent.trim()) return;
    onAddComment(post.id, commentContent);
    setCommentContent('');
  };

  const handleSaveEdit = () => {
    if (editContent.trim() !== post.content) {
      onEdit(post.id, editContent);
    }
    setIsEditing(false);
  };

  return (
    <article className="overflow-hidden rounded border border-slate-200 bg-white shadow-none mb-3">
      <header className="flex items-center gap-3 px-4 pt-3 relative">
        <img className="h-11 w-11 rounded-full object-cover" src={post.profiles?.avatar_url || `https://ui-avatars.com/api/?name=${post.profiles?.full_name || 'User'}`} alt={post.profiles?.full_name || 'User'} />
        <div className="flex-1">
          <p className="text-sm font-bold">{post.profiles?.full_name}</p>
          <p className="text-xs text-slate-500">
            <span suppressHydrationWarning>{formatDistanceToNow(new Date(post.created_at), { addSuffix: true, locale: es })}</span> · 🌐
          </p>
        </div>

        {isOwner && (
          <div className="relative">
            <button
              onClick={() => setShowOptions(!showOptions)}
              className="rounded-lg p-2 text-slate-600 hover:bg-slate-100"
              aria-label="Más opciones"
            >
              <MoreHorizontal size={20} />
            </button>
            {showOptions && (
              <div className="absolute right-0 top-10 w-32 bg-white border border-slate-100 rounded-sm shadow-lg z-10 py-1">
                <button
                  onClick={() => { setIsEditing(true); setShowOptions(false); }}
                  className="flex items-center gap-2 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 w-full text-left"
                >
                  <Edit size={16} /> Editar
                </button>
                <button
                  onClick={() => { onDelete(post.id); setShowOptions(false); }}
                  className="flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50 w-full text-left"
                >
                  <Trash size={16} /> Eliminar
                </button>
              </div>
            )}
          </div>
        )}
      </header>

      <div className="px-4 py-3 text-sm leading-6">
        {isEditing ? (
          <div className="space-y-2">
            <textarea
              className="w-full resize-none rounded-lg border border-slate-200 p-3 outline-none focus:border-[#233B5D]"
              rows={3}
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
            />
            <div className="flex justify-end gap-2">
              <button onClick={() => setIsEditing(false)} className="flex items-center gap-1 rounded px-3 py-1 text-xs text-slate-600 hover:bg-slate-100"><X size={14}/> Cancelar</button>
              <button onClick={handleSaveEdit} className="flex items-center gap-1 rounded bg-[#233B5D] px-3 py-1 text-xs text-white hover:bg-[#1a2c45]"><Check size={14}/> Guardar</button>
            </div>
          </div>
        ) : (
          <p className="whitespace-pre-wrap">{post.content}</p>
        )}
      </div>

      {post.photos && post.photos.length > 0 && (
        <div className={`grid gap-1 px-4 ${post.photos.length === 1 ? 'grid-cols-1' : post.photos.length === 2 ? 'grid-cols-2' : 'grid-cols-2'}`}>
          {post.photos.slice(0, 4).map((photo, index) => (
            <div className={`relative aspect-square overflow-hidden rounded-sm ${post.photos.length === 3 && index === 0 ? 'col-span-2' : ''}`} key={photo.id}>
              <img className="h-full w-full object-cover" src={photo.url} alt={photo.caption || ''} />
              {index === 3 && post.photos.length > 4 && (
                <div className="absolute inset-0 grid place-items-center bg-slate-950/55 text-2xl font-bold text-white">
                  +{post.photos.length - 4}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      <div className="mx-5 mt-4 flex items-center justify-between border-b border-slate-100 pb-3 text-xs text-slate-500">
        <span className="flex items-center gap-1"><Heart size={14} className={post.likes?.length > 0 ? "fill-red-500 text-red-500" : ""} /> {post.likes?.length || 0}</span>
        <span>{post.comments?.length || 0} comentarios · {post.post_shares?.length || 0} compartidos</span>
      </div>

      <div className="grid grid-cols-3 px-3 py-2">
        <PostAction icon={Heart} label="Me gusta" active={isLiked} onClick={handleLikeToggle} activeClass="text-red-500" />
        <PostAction icon={MessageCircle} label="Comentar" onClick={() => setShowComments(!showComments)} />
        <PostAction icon={Share2} label="Compartir" />
      </div>

      {showComments && (
        <div className="px-4 pb-4 pt-2 border-t border-slate-50 bg-slate-50/50">
          <div className="space-y-4 mb-4 max-h-60 overflow-y-auto pr-2">
            {post.comments?.map(comment => (
              <div key={comment.id} className="flex gap-2">
                <img className="h-8 w-8 rounded-full object-cover" src={comment.profiles?.avatar_url || `https://ui-avatars.com/api/?name=${comment.profiles?.full_name || 'User'}`} alt="" />
                <div className="flex-1 bg-white p-3 rounded-lg border border-slate-100 shadow-sm text-sm">
                  <p className="font-bold mb-1">{comment.profiles?.full_name}</p>
                  <p className="text-slate-700">{comment.content}</p>
                </div>
              </div>
            ))}
          </div>
          <form onSubmit={handleCommentSubmit} className="flex gap-2">
            <img className="h-8 w-8 rounded-full object-cover" src={user?.user_metadata?.avatar_url || `https://ui-avatars.com/api/?name=${user?.user_metadata?.full_name || 'User'}`} alt="" />
            <input
              type="text"
              value={commentContent}
              onChange={(e) => setCommentContent(e.target.value)}
              placeholder="Escribe un comentario..."
              className="flex-1 rounded-full border border-slate-200 bg-white px-4 py-1.5 text-sm outline-none focus:border-[#233B5D]"
            />
          </form>
        </div>
      )}
    </article>
  );
}

function PostAction({ icon: Icon, label, active, onClick, activeClass }: { icon: typeof Heart; label: string; active?: boolean; onClick?: () => void; activeClass?: string }) {
  return (
    <button onClick={onClick} className={`flex items-center justify-center gap-2 rounded-sm py-2 text-sm font-medium transition hover:bg-slate-50 ${active ? activeClass || 'text-[#233B5D]' : 'text-slate-700'}`}>
      <Icon size={18} className={active ? 'fill-current' : ''} />
      {label}
    </button>
  );
}
