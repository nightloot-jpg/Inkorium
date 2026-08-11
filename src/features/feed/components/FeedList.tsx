import { useEffect } from 'react';
import { useInView } from 'react-intersection-observer';
import { Loader2 } from 'lucide-react';
import { PostCard } from './PostCard';
import { useFeed } from '../hooks/useFeed';

export function FeedList() {
  const { ref, inView } = useInView({ rootMargin: '300px' });
  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, status, likePost, unlikePost, addComment, deletePost, editPost } = useFeed();

  useEffect(() => {
    if (inView && hasNextPage && !isFetchingNextPage) fetchNextPage();
  }, [inView, hasNextPage, isFetchingNextPage, fetchNextPage]);

  if (status === 'pending') return <div className="flex min-h-[180px] items-center justify-center rounded-[2px] border border-[#dfe4ea] bg-white"><Loader2 className="animate-spin text-[#3c72b6]" /></div>;
  if (status === 'error') return <div className="rounded-[2px] border border-[#dfe4ea] bg-white px-5 py-12 text-center text-red-500">Error al cargar el feed.</div>;

  return (
    <div className="space-y-4">
      {data.pages.map((page, pageIndex) => page.data.map((post, postIndex) => (
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

      <div ref={ref} className="flex min-h-14 items-center justify-center py-4">
        {isFetchingNextPage ? <Loader2 className="animate-spin text-[#3c72b6]" /> : hasNextPage ? <span className="text-xs text-[#8491a3]">Cargando más publicaciones...</span> : <span className="text-xs text-[#9aa5b3]">No hay más publicaciones</span>}
      </div>
    </div>
  );
}
