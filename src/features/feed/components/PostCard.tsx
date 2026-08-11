import { useState } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import { Check, ChevronDown, Edit, Heart, MessageCircle, MoreHorizontal, Play, Share2, Trash, X } from 'lucide-react';
import { useAuth } from '../../../hooks/useAuth';
import type { Post } from '../types';

interface Props {
  post: Post;
  onLike: (id: string) => void;
  onUnlike: (id: string) => void;
  onAddComment: (id: string, content: string) => void;
  onDelete: (id: string) => void;
  onEdit: (id: string, content: string) => void;
  musicVariant?: boolean;
}

export function PostCard({ post, onLike, onUnlike, onAddComment, onDelete, onEdit, musicVariant = false }: Props) {
  const { user } = useAuth();
  const [editing, setEditing] = useState(false);
  const [editContent, setEditContent] = useState(post.content || '');
  const [commentsOpen, setCommentsOpen] = useState(false);
  const [comment, setComment] = useState('');
  const [optionsOpen, setOptionsOpen] = useState(false);
  const liked = !!post.likes?.some((like) => like.user_id === user?.id);
  const owner = post.user_id === user?.id;
  const avatar = post.profiles?.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(post.profiles?.full_name || 'User')}`;
  const title = post.content?.split('\n')[0] || (musicVariant ? 'MHR, EFY & SNEZ! - Hola' : 'Publicación');

  const submitComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!comment.trim()) return;
    onAddComment(post.id, comment.trim());
    setComment('');
  };

  return (
    <article className="overflow-hidden rounded-[2px] border border-[#dfe4ea] bg-white shadow-[0_1px_4px_rgba(0,0,0,.04)]">
      <header className="flex items-center gap-3 px-5 py-4">
        <img src={avatar} alt="" className="h-12 w-12 rounded-full object-cover" />
        <div className="min-w-0 flex-1">
          <p className="text-[15px] font-bold text-[#1d2c40]">{post.profiles?.full_name || 'Usuario'}</p>
          <p className="text-xs text-[#8592a3]"><span suppressHydrationWarning>{formatDistanceToNow(new Date(post.created_at), { addSuffix: true, locale: es })}</span> · ◉</p>
        </div>
        {owner && (
          <div className="relative">
            <button type="button" onClick={() => setOptionsOpen((v) => !v)} className="rounded-full p-2 text-[#65768b] hover:bg-[#f1f4f7]" aria-label="Opciones"><ChevronDown size={18} /></button>
            {optionsOpen && <div className="absolute right-0 top-9 z-20 w-32 border border-[#dce2ea] bg-white py-1 shadow-lg">
              <button type="button" onClick={() => { setEditing(true); setOptionsOpen(false); }} className="flex w-full gap-2 px-3 py-2 text-left text-xs hover:bg-[#f4f7fa]"><Edit size={14} />Editar</button>
              <button type="button" onClick={() => { onDelete(post.id); setOptionsOpen(false); }} className="flex w-full gap-2 px-3 py-2 text-left text-xs text-red-600 hover:bg-red-50"><Trash size={14} />Eliminar</button>
            </div>}
          </div>
        )}
      </header>

      {editing ? (
        <div className="px-5 pb-4">
          <textarea value={editContent} onChange={(e) => setEditContent(e.target.value)} rows={3} className="w-full border border-[#d5dce4] p-3 outline-none" />
          <div className="mt-2 flex justify-end gap-2"><button type="button" onClick={() => setEditing(false)} className="px-3 py-1.5 text-xs"><X size={14} /></button><button type="button" onClick={() => { onEdit(post.id, editContent); setEditing(false); }} className="flex items-center gap-1 bg-[#315f9f] px-3 py-1.5 text-xs font-bold text-white"><Check size={14} />Guardar</button></div>
        </div>
      ) : (
        <>
          {musicVariant ? (
            <div className="bg-[#151515] text-white">
              <div className="flex min-h-[112px] items-stretch">
                <div className="relative flex w-[125px] shrink-0 items-center justify-center overflow-hidden bg-[#6c6c6c]">
                  {post.photos?.[0]?.url ? <img src={post.photos[0].url} alt="" className="absolute inset-0 h-full w-full object-cover opacity-80" /> : <div className="absolute inset-0 bg-gradient-to-br from-[#5a5a5a] to-[#222]" />}
                  <span className="relative grid h-12 w-12 place-items-center rounded-full border border-white/70 bg-black/25"><Play size={23} fill="white" /></span>
                </div>
                <div className="min-w-0 flex-1 px-7 py-5">
                  <p className="truncate text-lg font-bold">{title}</p>
                  <p className="mt-1 text-sm text-[#b4b4b4]">MHR MUSIC</p>
                </div>
                <span className="px-5 pt-4 text-sm font-semibold">5:05</span>
              </div>
            </div>
          ) : (
            <>
              {post.content && <div className="px-5 pb-4 whitespace-pre-wrap text-[15px] leading-6 text-[#34445a]">{post.content}</div>}
              {post.photos?.length > 0 && <div className={`grid gap-1 px-5 pb-4 ${post.photos.length === 1 ? 'grid-cols-1' : 'grid-cols-2'}`}>{post.photos.slice(0, 4).map((photo) => <img key={photo.id} src={photo.url} alt={photo.caption || ''} className="aspect-square w-full object-cover" />)}</div>}
            </>
          )}
        </>
      )}

      <div className="flex items-center justify-between border-t border-[#edf0f3] px-5 py-3 text-xs text-[#8a96a6]">
        <span>{post.likes?.length || 0} Me gusta</span>
        <span>{post.comments?.length || 0} comentarios · {post.post_shares?.length || 0} compartidos</span>
      </div>
      <div className="grid grid-cols-3 border-t border-[#edf0f3] px-2">
        <button type="button" onClick={() => liked ? onUnlike(post.id) : onLike(post.id)} className={`flex items-center justify-center gap-2 py-3 text-sm font-semibold ${liked ? 'text-[#2e69b0]' : 'text-[#7d8999]'} hover:bg-[#f6f8fa]`}><Heart size={18} fill={liked ? 'currentColor' : 'none'} />Me gusta</button>
        <button type="button" onClick={() => setCommentsOpen((v) => !v)} className="flex items-center justify-center gap-2 py-3 text-sm font-semibold text-[#7d8999] hover:bg-[#f6f8fa]"><MessageCircle size={18} />Comentar</button>
        <button type="button" className="flex items-center justify-center gap-2 py-3 text-sm font-semibold text-[#7d8999] hover:bg-[#f6f8fa]"><Share2 size={18} />Compartir</button>
      </div>

      {commentsOpen && <div className="border-t border-[#edf0f3] bg-[#f7f9fb] px-5 pb-4 pt-3">
        <div className="mb-3 max-h-52 space-y-2 overflow-y-auto">{post.comments?.map((item) => <div key={item.id} className="flex gap-2 text-sm"><img src={item.profiles?.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(item.profiles?.full_name || 'User')}`} alt="" className="h-8 w-8 rounded-full" /><p><b>{item.profiles?.full_name}</b> {item.content}</p></div>)}</div>
        <form onSubmit={submitComment} className="flex gap-2"><img src={user?.user_metadata?.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.user_metadata?.full_name || 'User')}`} alt="" className="h-8 w-8 rounded-full" /><input value={comment} onChange={(e) => setComment(e.target.value)} placeholder="Escribe un comentario..." className="flex-1 border border-[#d5dce4] bg-white px-3 py-2 text-sm outline-none" /></form>
      </div>}
    </article>
  );
}
