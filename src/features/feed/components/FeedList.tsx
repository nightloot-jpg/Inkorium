import { useEffect, useRef } from 'react';
import { Loader2 } from 'lucide-react';
import { useFeed } from '../hooks/useFeed';
import { PostCard } from './PostCard';

export function FeedList() {
  const sentinelRef = useRef<HTMLDivElement | null>(null);
  const { data, status, error, hasNextPage, fetchNextPage, isFetchingNextPage, likePost, unlikePost, addComment, deletePost, editPost } = useFeed();

  useEffect(() => {
    const node = sentinelRef.current;
    if (!node || !hasNextPage) return;
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting && !isFetchingNextPage) fetchNextPage();
    }, { rootMargin: '500px 0px' });
    observer.observe(node);
    return () => observer.disconnect();
  }, [fetchNextPage, hasNextPage, isFetchingNextPage]);

  if (status === 'pending') return <FeedState><Loader2 className="animate-spin text-blue-600" size={22} /></FeedState>;

  if (status === 'error') {
    return <FeedState><div className="text-center"><p className="text-sm font-semibold text-red-600">No se ha podido cargar el feed.</p><p className="mt-1 max-w-md text-xs text-slate-500">{error instanceof Error ? error.message : 'Comprueba la sesión e inténtalo de nuevo.'}</p></div></FeedState>;
  }

  const posts = data?.pages.flatMap((page) => page.data) ?? [];
  if (posts.length === 0) return <FeedState><span className="text-sm text-slate-500">Todavía no hay publicaciones.</span></FeedState>;

  return (
    <div className="flex flex-col gap-4">
      {posts.map((post, index) => (
        <PostCard
          key={post.id}
          post={post}
          musicVariant={index < 2 && post.type === 'music'}
          onLike={(id) => likePost.mutate(id)}
          onUnlike={(id) => unlikePost.mutate(id)}
          onComment={(id, content) => addComment.mutate({ postId: id, content })}
          onDelete={(id) => deletePost.mutate(id)}
          onEdit={(id, content) => editPost.mutate({ postId: id, content })}
        />
      ))}
      <div ref={sentinelRef} className="flex min-h-12 items-center justify-center">
        {isFetchingNextPage && <Loader2 className="animate-spin text-blue-600" size={20} />}
        {!isFetchingNextPage && hasNextPage && <span className="text-xs text-slate-400">Cargando más publicaciones…</span>}
        {!isFetchingNextPage && !hasNextPage && <span className="text-xs text-slate-400">No hay más publicaciones</span>}
      </div>
    </div>
  );
}

function FeedState({ children }: { children: React.ReactNode }) {
  return <div className="flex min-h-40 items-center justify-center border border-slate-200 bg-white p-6 shadow-sm">{children}</div>;
}
