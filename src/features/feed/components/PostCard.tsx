import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import { Heart, MessageCircle, Play, Share2 } from 'lucide-react';
import { useHydrated } from '../../../hooks/useHydrated';
import type { FeedPost } from '../types';

export function PostCard({ post, onLike }: { post: FeedPost; onLike: (id: string) => void }) {
  const hydrated = useHydrated();
  const date = new Date(post.createdAt);
  const time = hydrated ? formatDistanceToNow(date, { addSuffix: true, locale: es }) : date.toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' });

  return (
    <article className="overflow-hidden border border-slate-200 bg-white shadow-sm">
      <header className="flex items-center gap-3 px-5 py-4">
        <img src={post.authorAvatar} alt="" className="h-11 w-11 shrink-0 rounded-full border border-slate-200 object-cover" />
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-bold text-slate-800">{post.authorName}</p>
          <p className="text-xs text-slate-500"><span suppressHydrationWarning>{time}</span> · Público</p>
        </div>
        <button type="button" className="rounded-full px-2 text-xl leading-none text-slate-400 hover:bg-slate-100" aria-label="Opciones">⌄</button>
      </header>

      {post.kind === 'music' ? (
        <div className="bg-[#171717] text-white">
          <div className="flex min-h-[116px] items-stretch">
            <div className="relative grid w-32 shrink-0 place-items-center overflow-hidden bg-slate-600">
              {post.image && <img src={post.image} alt="" className="absolute inset-0 h-full w-full object-cover opacity-70" />}
              <span className="relative grid h-12 w-12 place-items-center rounded-full border border-white/80 bg-black/40"><Play size={22} fill="white" /></span>
            </div>
            <div className="min-w-0 flex-1 px-6 py-5">
              <p className="truncate text-lg font-bold">{post.title || post.content || 'Publicación musical'}</p>
              <p className="mt-1 text-sm text-slate-400">{post.subtitle || 'MHR MUSIC'}</p>
            </div>
            <span className="px-4 pt-4 text-sm font-semibold">{post.duration || '5:05'}</span>
          </div>
        </div>
      ) : (
        <>
          {post.content && <div className="whitespace-pre-wrap px-5 pb-4 text-sm leading-6 text-slate-700">{post.content}</div>}
          {post.image && <div className="px-5 pb-4"><img src={post.image} alt="" className="block max-h-[620px] w-full object-cover" /></div>}
        </>
      )}

      <div className="flex items-center justify-between border-t border-slate-100 px-5 py-2.5 text-xs text-slate-500"><span>{post.likes} Me gusta</span><span>{post.comments} comentarios · {post.shares} compartidos</span></div>
      <div className="grid grid-cols-3 border-t border-slate-100">
        <button type="button" onClick={() => onLike(post.id)} className={`flex items-center justify-center gap-2 py-3 text-sm font-semibold ${post.liked ? 'text-blue-700' : 'text-slate-500'} hover:bg-slate-50`}><Heart size={18} fill={post.liked ? 'currentColor' : 'none'} />Me gusta</button>
        <button type="button" className="flex items-center justify-center gap-2 py-3 text-sm font-semibold text-slate-500 hover:bg-slate-50"><MessageCircle size={18} />Comentar</button>
        <button type="button" className="flex items-center justify-center gap-2 py-3 text-sm font-semibold text-slate-500 hover:bg-slate-50"><Share2 size={18} />Compartir</button>
      </div>
    </article>
  );
}
