import { useEffect, useRef } from 'react';
import { Loader2 } from 'lucide-react';
import { useFeed } from '../hooks/useFeed';
import { PostCard } from './PostCard';

export function FeedList() {
  const sentinel = useRef<HTMLDivElement>(null);
  const { data, status, hasNextPage, fetchNextPage, isFetchingNextPage, likePost, unlikePost, addComment, deletePost, editPost } = useFeed();

  useEffect(() => {
    const node = sentinel.current;
    if (!node || !hasNextPage) return;
    const observer = new IntersectionObserver(([entry]) => { if (entry.isIntersecting && !isFetchingNextPage) fetchNextPage(); }, { rootMargin: '500px' });
    observer.observe(node);
    return () => observer.disconnect();
  }, [fetchNextPage, hasNextPage, isFetchingNextPage]);

  if (status === 'pending') return <div className="flex min-h-[180px] items-center justify-center rounded-sm border border-[#d9e1e8] bg-white"><Loader2 className="animate-spin text-[#4b86d7]"/></div>;
  if (status === 'error') return <div className="flex min-h-[180px] items-center justify-center rounded-sm border border-[#d9e1e8] bg-white text-center"><div><p className="font-semibold text-red-600">No se ha podido cargar el feed.</p><p className="mt-1 text-xs text-[#8a94a2]">La sesión o la conexión con el servidor no están disponibles.</p></div></div>;

  const posts = (data?.pages ?? []).flatMap((page) => page.data);
  if (!posts.length) return <div className="flex min-h-[180px] items-center justify-center rounded-sm border border-[#d9e1e8] bg-white text-sm text-[#7b8795]">Todavía no hay publicaciones.</div>;

  return <div className="flex flex-col gap-4">{posts.map((post, index) => <PostCard key={post.id} post={post} musicVariant={index < 2} onLike={(id)=>likePost.mutate(id)} onUnlike={(id)=>unlikePost.mutate(id)} onComment={(id,text)=>addComment.mutate({postId:id,content:text})} onDelete={(id)=>deletePost.mutate(id)} onEdit={(id,text)=>editPost.mutate({postId:id,content:text})}/>)}<div ref={sentinel} className="flex min-h-12 items-center justify-center text-xs text-[#8a94a2]">{isFetchingNextPage ? <Loader2 size={18} className="animate-spin"/> : hasNextPage ? 'Cargando más publicaciones…' : 'No hay más publicaciones'}</div></div>;
}
