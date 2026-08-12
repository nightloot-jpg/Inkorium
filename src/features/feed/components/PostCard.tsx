import { useState } from 'react';
import { Check, Edit3, Heart, MessageCircle, MoreHorizontal, Play, Share2, Trash2, X } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import { useAuth } from '../../../hooks/useAuth';
import type { Post } from '../types';

interface Props {
  post: Post;
  musicVariant?: boolean;
  onLike: (id: string) => void;
  onUnlike: (id: string) => void;
  onComment: (id: string, content: string) => void;
  onDelete: (id: string) => void;
  onEdit: (id: string, content: string) => void;
}

export function PostCard({ post, musicVariant = false, onLike, onUnlike, onComment, onDelete, onEdit }: Props) {
  const { user } = useAuth();
  const [commentsOpen, setCommentsOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editText, setEditText] = useState(post.content || '');
  const [commentText, setCommentText] = useState('');
  const liked = !!post.likes?.some((like) => like.user_id === user?.id);
  const owner = post.user_id === user?.id;
  const name = post.profiles?.full_name || 'Usuario';
  const avatar = post.profiles?.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}`;
  const title = post.content?.split('\n')[0] || 'MHR, EFY & SNEZ! - Hola';

  const submitComment = (event: React.FormEvent) => {
    event.preventDefault();
    const text = commentText.trim();
    if (!text) return;
    onComment(post.id, text);
    setCommentText('');
  };

  return (
    <article className="overflow-hidden border border-slate-200 bg-white shadow-sm">
      <header className="flex items-center gap-3 px-5 py-4">
        <img src={avatar} alt="" className="h-11 w-11 rounded-full object-cover" />
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-bold text-slate-800">{name}</p>
          <p className="text-xs text-slate-500"><span suppressHydrationWarning>{formatDistanceToNow(new Date(post.created_at), { addSuffix: true, locale: es })}</span> · Público</p>
        </div>
        {owner && <div className="relative"><button type="button" onClick={() => setMenuOpen((v) => !v)} className="rounded-full p-2 text-slate-500 hover:bg-slate-100"><MoreHorizontal size={19} /></button>{menuOpen && <div className="absolute right-0 top-10 z-10 w-36 border border-slate-200 bg-white py-1 shadow-lg"><button type="button" onClick={() => { setEditing(true); setMenuOpen(false); }} className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm"><Edit3 size={15} />Editar</button><button type="button" onClick={() => { onDelete(post.id); setMenuOpen(false); }} className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-red-600"><Trash2 size={15} />Eliminar</button></div>}</div>}
      </header>

      {editing ? (
        <div className="px-5 pb-5"><textarea value={editText} onChange={(event) => setEditText(event.target.value)} rows={4} className="w-full border border-slate-300 p-3 text-sm outline-none focus:border-blue-500" /><div className="mt-2 flex justify-end gap-2"><button type="button" onClick={() => setEditing(false)} className="flex items-center gap-1 border px-3 py-2 text-xs"><X size={14} />Cancelar</button><button type="button" onClick={() => { onEdit(post.id, editText.trim()); setEditing(false); }} className="flex items-center gap-1 bg-blue-600 px-3 py-2 text-xs font-bold text-white"><Check size={14} />Guardar</button></div></div>
      ) : musicVariant ? (
        <div className="bg-[#171717] text-white"><div className="flex min-h-28 items-stretch"><div className="relative flex w-32 shrink-0 items-center justify-center overflow-hidden bg-slate-700">{post.photos?.[0]?.url && <img src={post.photos[0].url} alt="" className="absolute inset-0 h-full w-full object-cover opacity-70" />}<span className="relative grid h-12 w-12 place-items-center rounded-full bg-black/50 ring-1 ring-white/70"><Play size={22} fill="white" /></span></div><div className="min-w-0 flex-1 px-6 py-5"><p className="truncate text-lg font-bold">{title}</p><p className="mt-1 text-sm text-slate-400">MHR MUSIC</p></div><span className="px-4 pt-4 text-sm font-semibold">5:05</span></div></div>
      ) : (
        <>
          {post.content && <div className="whitespace-pre-wrap px-5 pb-4 text-sm leading-6 text-slate-700">{post.content}</div>}
          {post.photos?.length > 0 && <div className={`grid gap-1 px-5 pb-4 ${post.photos.length === 1 ? 'grid-cols-1' : 'grid-cols-2'}`}>{post.photos.slice(0, 4).map((photo) => <img key={photo.id} src={photo.url} alt={photo.caption || ''} className="aspect-square w-full object-cover" />)}</div>}
        </>
      )}

      <div className="flex items-center justify-between border-t border-slate-100 px-5 py-2.5 text-xs text-slate-500"><span>{post.likes?.length || 0} Me gusta</span><span>{post.comments?.length || 0} comentarios · {post.post_shares?.length || 0} compartidos</span></div>
      <div className="grid grid-cols-3 border-t border-slate-100"><button type="button" onClick={() => liked ? onUnlike(post.id) : onLike(post.id)} className={`flex items-center justify-center gap-2 py-3 text-sm font-semibold hover:bg-slate-50 ${liked ? 'text-blue-700' : 'text-slate-500'}`}><Heart size={18} fill={liked ? 'currentColor' : 'none'} />Me gusta</button><button type="button" onClick={() => setCommentsOpen((v) => !v)} className="flex items-center justify-center gap-2 py-3 text-sm font-semibold text-slate-500 hover:bg-slate-50"><MessageCircle size={18} />Comentar</button><button type="button" className="flex items-center justify-center gap-2 py-3 text-sm font-semibold text-slate-500 hover:bg-slate-50"><Share2 size={18} />Compartir</button></div>
      {commentsOpen && <div className="border-t border-slate-100 bg-slate-50 px-5 py-3"><div className="mb-3 max-h-52 space-y-2 overflow-y-auto">{post.comments?.map((comment) => { const commentName = comment.profiles?.full_name || 'Usuario'; const commentAvatar = comment.profiles?.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(commentName)}`; return <div key={comment.id} className="flex gap-2 text-sm"><img src={commentAvatar} alt="" className="h-8 w-8 rounded-full object-cover" /><p><b>{commentName}</b> {comment.content}</p></div>; })}</div><form onSubmit={submitComment} className="flex gap-2"><img src={avatar} alt="" className="h-8 w-8 rounded-full object-cover" /><input value={commentText} onChange={(event) => setCommentText(event.target.value)} placeholder="Escribe un comentario..." className="min-w-0 flex-1 border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-blue-500" /></form></div>}
    </article>
  );
}
