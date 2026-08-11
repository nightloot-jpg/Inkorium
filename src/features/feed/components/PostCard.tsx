import { useState } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import { Check, Edit, Heart, MessageCircle, MoreHorizontal, Share2, Trash, X } from 'lucide-react';
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

export function PostCard({ post, onLike, onUnlike, onAddComment, onDelete, onEdit }: PostCardProps) {
  const { user } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(post.content || '');
  const [showComments, setShowComments] = useState(false);
  const [commentContent, setCommentContent] = useState('');
  const [showOptions, setShowOptions] = useState(false);

  const isLiked = post.likes?.some((like) => like.user_id === user?.id);
  const isOwner = post.user_id === user?.id;

  const handleLikeToggle = () => {
    if (isLiked) onUnlike(post.id);
    else onLike(post.id);
  };

  const handleCommentSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!commentContent.trim()) return;
    onAddComment(post.id, commentContent);
    setCommentContent('');
  };

  const handleSaveEdit = () => {
    if (editContent.trim() !== post.content) onEdit(post.id, editContent);
    setIsEditing(false);
  };

  return (
    <article className="overflow-hidden border border-[#d9e0e8] bg-white shadow-[0_1px_3px_rgba(0,0,0,0.05)]">
      <header className="flex items-center gap-3 px-5 py-4">
        <img
          src={post.profiles?.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(post.profiles?.full_name || 'User')}`}
          alt={post.profiles?.full_name || 'User'}
          className="h-12 w-12 rounded-full border border-[#d9e0e8] object-cover"
        />
        <div className="min-w-0 flex-1">
          <p className="text-[15px] font-bold text-[#1e2e43]">{post.profiles?.full_name || 'Usuario'}</p>
          <p className="text-xs text-[#8290a3]">
            <span suppressHydrationWarning>{formatDistanceToNow(new Date(post.created_at), { addSuffix: true, locale: es })}</span> · 🌐
          </p>
        </div>

        {isOwner && (
          <div className="relative">
            <button onClick={() => setShowOptions((value) => !value)} className="rounded-full p-2 text-[#718096] hover:bg-[#f1f4f7]" aria-label="Más opciones">
              <MoreHorizontal size={20} />
            </button>
            {showOptions && (
              <div className="absolute right-0 top-10 z-10 w-32 border border-[#dce2ea] bg-white py-1 shadow-lg">
                <button onClick={() => { setIsEditing(true); setShowOptions(false); }} className="flex w-full items-center gap-2 px-4 py-2 text-left text-sm hover:bg-[#f5f7fa]"><Edit size={15} />Editar</button>
                <button onClick={() => { onDelete(post.id); setShowOptions(false); }} className="flex w-full items-center gap-2 px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50"><Trash size={15} />Eliminar</button>
              </div>
            )}
          </div>
        )}
      </header>

      {isEditing ? (
        <div className="px-5 pb-4">
          <textarea className="w-full resize-none border border-[#d4dce6] p-3 outline-none focus:border-[#5b8fd4]" rows={3} value={editContent} onChange={(event) => setEditContent(event.target.value)} />
          <div className="mt-2 flex justify-end gap-2">
            <button onClick={() => setIsEditing(false)} className="flex items-center gap-1 px-3 py-1.5 text-xs text-[#718096]"><X size={14} />Cancelar</button>
            <button onClick={handleSaveEdit} className="flex items-center gap-1 bg-[#315f9f] px-3 py-1.5 text-xs font-bold text-white"><Check size={14} />Guardar</button>
          </div>
        </div>
      ) : (
        post.content && <div className="px-5 pb-4 text-[15px] leading-6 text-[#33445b] whitespace-pre-wrap">{post.content}</div>
      )}

      {post.photos && post.photos.length > 0 && (
        <div className={`grid gap-1 px-5 ${post.photos.length === 1 ? 'grid-cols-1' : 'grid-cols-2'}`}>
          {post.photos.slice(0, 4).map((photo, index) => (
            <div key={photo.id} className={`relative aspect-square overflow-hidden ${post.photos.length === 3 && index === 0 ? 'col-span-2' : ''}`}>
              <img className="h-full w-full object-cover" src={photo.url} alt={photo.caption || ''} />
              {index === 3 && post.photos.length > 4 && <div className="absolute inset-0 grid place-items-center bg-black/50 text-2xl font-bold text-white">+{post.photos.length - 4}</div>}
            </div>
          ))}
        </div>
      )}

      <div className="mx-5 flex items-center justify-between border-b border-[#e8edf2] py-3 text-xs text-[#8290a3]">
        <span className="flex items-center gap-1"><Heart size={14} className={post.likes?.length ? 'fill-[#7c9dcc] text-[#7c9dcc]' : ''} /> {post.likes?.length || 0}</span>
        <span>{post.comments?.length || 0} comentarios · {post.post_shares?.length || 0} compartidos</span>
      </div>

      <div className="grid grid-cols-3 px-3 py-1">
        <PostAction icon={<Heart size={18} />} label="Me gusta" active={isLiked} onClick={handleLikeToggle} />
        <PostAction icon={<MessageCircle size={18} />} label="Comentar" onClick={() => setShowComments((value) => !value)} />
        <PostAction icon={<Share2 size={18} />} label="Compartir" />
      </div>

      {showComments && (
        <div className="border-t border-[#e8edf2] bg-[#f7f9fb] px-5 pb-4 pt-3">
          <div className="mb-4 max-h-60 space-y-3 overflow-y-auto">
            {post.comments?.map((comment) => (
              <div key={comment.id} className="flex gap-2">
                <img className="h-8 w-8 rounded-full border border-[#d9e0e8] object-cover" src={comment.profiles?.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(comment.profiles?.full_name || 'User')}`} alt="" />
                <p className="flex-1 text-sm"><span className="font-bold text-[#1e2e43]">{comment.profiles?.full_name}</span> <span className="text-[#4a5b71]">{comment.content}</span></p>
              </div>
            ))}
          </div>
          <form onSubmit={handleCommentSubmit} className="flex gap-2">
            <img className="h-8 w-8 rounded-full object-cover" src={user?.user_metadata?.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.user_metadata?.full_name || 'User')}`} alt="" />
            <input value={commentContent} onChange={(event) => setCommentContent(event.target.value)} placeholder="Escribe un comentario..." className="flex-1 border border-[#d4dce6] bg-white px-3 py-2 text-sm outline-none focus:border-[#5b8fd4]" />
          </form>
        </div>
      )}
    </article>
  );
}

function PostAction({ icon, label, active = false, onClick }: { icon: React.ReactNode; label: string; active?: boolean; onClick?: () => void }) {
  return (
    <button onClick={onClick} className={`flex items-center justify-center gap-2 px-2 py-3 text-sm font-semibold transition hover:bg-[#f5f7fa] ${active ? 'text-[#315f9f]' : 'text-[#77869a]'}`}>
      {icon}{label}
    </button>
  );
}
