import { useEffect } from 'react';
import { Loader2 } from 'lucide-react';
import { useInView } from 'react-intersection-observer';
import { useFeed } from '../hooks/useFeed';
import { PostCard } from './PostCard';

export function FeedList() {
  const { ref, inView } = useInView({ rootMargin: '400px' });
  const { data, status, error, fetchNextPage, hasNextPage, isFetchingNextPage, likePost, unlikePost, addComment, deletePost, editPost } = useFeed();

  useEffect(() => {
    if (inView && hasNextPage && !isFetchingNextPage) fetchNextPage();
  }, [inView, hasNextPage, isFetchingNextPage, fetchNextPage]);

  if (status === 'pending') {
    return <div className="flex min-h-[180px] items-center justify-center rounded-md border border-slate-200 bg-white"><Loader2 className="animate-spin text-blue-600" /></div>;
  }

  if (status === 'error') {
    return <div className="rounded-md border border-red-100 bg-white px-5 py-12 text-center"><p className="text-sm font-semibold text-red-600">No se ha podido cargar el feed.</p><p className="mt-1 text-xs text-slate-400">{error instanceof Error ? error.message : 'Error al consultar las publicaciones.'}</p></div>;
  }

  const posts = data?.pages.flatMap((page) => page.data) ?? [];

  if (posts.length === 0) {
    return <div className="rounded-md border border-slate-200 bg-white px-5 py-14 text-center text-sm text-slate-500">Todavía no hay publicaciones.</div>;
  }

  return (
    <div className="flex flex-col gap-4">
      {data?.pages.flatMap((page, pageIndex) => page.data.map((post, postIndex) => (
        <PostCard
          key={post.id}
          post={post}
          musicVariant={pageIndex === 0 && postIndex < 2}
          onLike={(id) => likePost.mutate(id)}
          onUnlike={(id) => unlikePost.mutate(id)}
          onAddComment={(id, content) => addComment.mutate({ postId: id, content })}
          onDelete={(id) => deletePost.mutate(id)}
          onEdit={(id, content) => editPost.mutate({ postId: id, content })}
        />
      )))}
      <div ref={ref} className="flex min-h-12 items-center justify-center py-3">
        {isFetchingNextPage ? <Loader2 className="animate-spin text-blue-600" /> : hasNextPage ? <span className="text-xs text-slate-400">Cargando más publicaciones...</span> : <span className="text-xs text-slate-400">No hay más publicaciones</span>}
      </div>
    </div>
  );
}
