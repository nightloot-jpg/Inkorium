import { useEffect, useRef } from 'react';
import { Loader2 } from 'lucide-react';
import { useFeed } from '../hooks/useFeed';
import { PostCard } from './PostCard';

export function FeedList() {
  const loadMoreRef = useRef<HTMLDivElement | null>(null);
  const { data, status, hasNextPage, fetchNextPage, isFetchingNextPage, likePost, unlikePost, addComment, deletePost, editPost } = useFeed();

  useEffect(() => {
    const element = loadMoreRef.current;
    if (!element || !hasNextPage) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !isFetchingNextPage) fetchNextPage();
      },
      { rootMargin: '500px 0px' },
    );

    observer.observe(element);
    return () => observer.disconnect();
  }, [fetchNextPage, hasNextPage, isFetchingNextPage]);

  if (status === 'pending') {
    return <FeedMessage><Loader2 className="animate-spin text-blue-600" /></FeedMessage>;
  }

  if (status === 'error') {
    return <FeedMessage><span className="text-sm text-red-600">No se ha podido cargar el feed.</span></FeedMessage>;
  }

  const pages = data?.pages ?? [];
  const posts = pages.flatMap((page) => page.data);

  if (posts.length === 0) {
    return <FeedMessage><span className="text-sm text-slate-500">Todavía no hay publicaciones.</span></FeedMessage>;
  }

  return (
    <div className="flex flex-col gap-4">
      {pages.map((page, pageIndex) => page.data.map((post, postIndex) => (
        <PostCard
          key={post.id}
          post={post}
          musicVariant={pageIndex === 0 && postIndex < 2}
          onLike={(id) => likePost.mutate(id)}
          onUnlike={(id) => unlikePost.mutate(id)}
          onComment={(id, content) => addComment.mutate({ postId: id, content })}
          onDelete={(id) => deletePost.mutate(id)}
          onEdit={(id, content) => editPost.mutate({ postId: id, content })}
        />
      )))}

      <div ref={loadMoreRef} className="flex min-h-12 items-center justify-center py-2">
        {isFetchingNextPage ? <Loader2 className="animate-spin text-blue-600" /> : hasNextPage ? <span className="text-xs text-slate-400">Cargando más publicaciones...</span> : <span className="text-xs text-slate-400">No hay más publicaciones</span>}
      </div>
    </div>
  );
}

function FeedMessage({ children }: { children: React.ReactNode }) {
  return <div className="flex min-h-44 items-center justify-center border border-slate-200 bg-white shadow-sm">{children}</div>;
}
