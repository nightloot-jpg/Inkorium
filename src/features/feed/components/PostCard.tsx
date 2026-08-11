import { useState } from 'react';
import { Check, Edit3, Heart, MessageCircle, MoreHorizontal, Play, Share2, Trash2, X } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import { useAuth } from '../../../hooks/useAuth';
import type { Post } from '../types';

interface Props { post: Post; musicVariant?: boolean; onLike: (id: string) => void; onUnlike: (id: string) => void; onComment: (id: string, text: string) => void; onDelete: (id: string) => void; onEdit: (id: string, text: string) => void; }

export function PostCard({ post, musicVariant = false, onLike, onUnlike, onComment, onDelete, onEdit }: Props) {
  const { user } = useAuth();
  const [editing, setEditing] = useState(false); const [editText, setEditText] = useState(post.content || ''); const [comment, setComment] = useState(''); const [commentsOpen, setCommentsOpen] = useState(false); const [menuOpen, setMenuOpen] = useState(false);
  const liked = !!post.likes?.some((like) => like.user_id === user?.id); const owner = post.user_id === user?.id;
  const name = post.profiles?.full_name || 'Usuario'; const avatar = post.profiles?.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}`;
  const title = post.content?.split('\n')[0] || 'MHR, EFY & SNEZ! - Hola';

  const submitComment = (e: React.FormEvent) => { e.preventDefault(); const text = comment.trim(); if (!text) return; onComment(post.id, text); setComment(''); };

  return <article className="overflow-hidden rounded-sm border border-[#d9e1e8] bg-white shadow-[0_1px_3px_rgba(0,0,0,.05)]">
    <header className="flex items-center gap-3 px-5 py-4">
      <img src={avatar} alt="" className="h-11 w-11 rounded-full object-cover" />
      <div className="min-w-0 flex-1"><div className="truncate text-[15px] font-bold text-[#263241]">{name}</div><div className="text-xs text-[#8994a2]"><span suppressHydrationWarning>{formatDistanceToNow(new Date(post.created_at), { addSuffix: true, locale: es })}</span> · Público</div></div>
      {owner && <div className="relative"><button type="button" onClick={() => setMenuOpen(!menuOpen)} className="rounded-full p-2 text-[#7b8795] hover:bg-[#f3f6f8]"><MoreHorizontal size={19} /></button>{menuOpen && <div className="absolute right-0 top-10 z-20 w-36 border border-[#dce3e8] bg-white py-1 shadow-lg"><button type="button" onClick={() => { setEditing(true); setMenuOpen(false); }} className="flex w-full gap-2 px-3 py-2 text-left text-sm hover:bg-[#f5f7f9]"><Edit3 size={15}/>Editar</button><button type="button" onClick={() => { onDelete(post.id); setMenuOpen(false); }} className="flex w-full gap-2 px-3 py-2 text-left text-sm text-red-600 hover:bg-red-50"><Trash2 size={15}/>Eliminar</button></div>}</div>}
    </header>

    {editing ? <div className="px-5 pb-5"><textarea value={editText} onChange={(e) => setEditText(e.target.value)} rows={4} className="w-full border border-[#d4dce4] p-3 text-sm outline-none focus:border-[#4b86d7]"/><div className="mt-2 flex justify-end gap-2"><button type="button" onClick={() => setEditing(false)} className="flex items-center gap-1 border px-3 py-2 text-xs"><X size={14}/>Cancelar</button><button type="button" onClick={() => { onEdit(post.id, editText.trim()); setEditing(false); }} className="flex items-center gap-1 bg-[#4b86d7] px-3 py-2 text-xs font-bold text-white"><Check size={14}/>Guardar</button></div></div>
    : musicVariant ? <div className="bg-[#171717] text-white"><div className="flex min-h-[116px]"><div className="relative flex w-[125px] shrink-0 items-center justify-center overflow-hidden bg-[#555]">{post.photos?.[0]?.url && <img src={post.photos[0].url} alt="" className="absolute inset-0 h-full w-full object-cover opacity-70"/>}<span className="relative grid h-12 w-12 place-items-center rounded-full bg-black/45 ring-1 ring-white/80"><Play size={22} fill="white"/></span></div><div className="min-w-0 flex-1 px-6 py-5"><p className="truncate text-lg font-bold">{title}</p><p className="mt-1 text-sm text-[#aeb4bb]">MHR MUSIC</p></div><span className="px-4 pt-4 text-sm font-semibold">5:05</span></div></div>
    : <><div className="whitespace-pre-wrap px-5 pb-4 text-[15px] leading-6 text-[#3e4a59]">{post.content}</div>{post.photos?.length > 0 && <div className="grid grid-cols-2 gap-1 px-5 pb-4">{post.photos.slice(0,4).map((photo) => <img key={photo.id} src={photo.url} alt={photo.caption || ''} className="aspect-square w-full object-cover"/>)}</div>}</>}

    <div className="flex items-center justify-between border-t border-[#edf0f3] px-5 py-2.5 text-xs text-[#8994a2]"><span>{post.likes?.length || 0} Me gusta</span><span>{post.comments?.length || 0} comentarios · {post.post_shares?.length || 0} compartidos</span></div>
    <div className="grid grid-cols-3 border-t border-[#edf0f3]"><button type="button" onClick={() => liked ? onUnlike(post.id) : onLike(post.id)} className={`flex items-center justify-center gap-2 py-3 text-sm font-semibold hover:bg-[#f7f9fa] ${liked ? 'text-[#1d65b8]' : 'text-[#697584]'}`}><Heart size={18} fill={liked ? 'currentColor' : 'none'}/>Me gusta</button><button type="button" onClick={() => setCommentsOpen(!commentsOpen)} className="flex items-center justify-center gap-2 py-3 text-sm font-semibold text-[#697584] hover:bg-[#f7f9fa]"><MessageCircle size={18}/>Comentar</button><button type="button" className="flex items-center justify-center gap-2 py-3 text-sm font-semibold text-[#697584] hover:bg-[#f7f9fa]"><Share2 size={18}/>Compartir</button></div>
    {commentsOpen && <div className="border-t border-[#edf0f3] bg-[#f7f9fa] px-5 py-3"><div className="mb-3 max-h-52 space-y-2 overflow-y-auto">{post.comments?.map((item) => { const n=item.profiles?.full_name || 'Usuario'; const a=item.profiles?.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(n)}`; return <div key={item.id} className="flex gap-2 text-sm"><img src={a} alt="" className="h-8 w-8 rounded-full object-cover"/><p><b>{n}</b> {item.content}</p></div>; })}</div><form onSubmit={submitComment} className="flex gap-2"><input value={comment} onChange={(e)=>setComment(e.target.value)} placeholder="Escribe un comentario..." className="min-w-0 flex-1 border border-[#d5dde5] bg-white px-3 py-2 text-sm outline-none focus:border-[#4b86d7]"/></form></div>}
  </article>;
}
