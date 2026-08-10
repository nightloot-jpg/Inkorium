import { useEffect } from 'react';
import { useInView } from 'react-intersection-observer';
import { Loader2 } from 'lucide-react';
import { PostCard } from './PostCard';
import { useFeed } from '../hooks/useFeed';

export function FeedList() {
  const { ref, inView } = useInView();
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    status,
    likePost,
    unlikePost,
    addComment,
    deletePost,
    editPost
  } = useFeed();

  useEffect(() => {
    if (inView && hasNextPage) {
      fetchNextPage();
    }
  }, [inView, fetchNextPage, hasNextPage]);

  if (status === 'pending') {
    return <div className="flex justify-center py-8"><Loader2 className="animate-spin text-[#233B5D]" /></div>;
  }

  if (status === 'error') {
    return <div className="text-center py-8 text-red-500">Error al cargar el feed.</div>;
  }

  return (
    <div className="space-y-4">
      {data.pages.map((page, i) => (
        <div key={i} className="space-y-4">
          {page.data.map((post) => (
            <PostCard
              key={post.id}
              post={post}
              onLike={(id) => likePost.mutate(id)}
              onUnlike={(id) => unlikePost.mutate(id)}
              onAddComment={(id, content) => addComment.mutate({ postId: id, content })}
              onDelete={(id) => deletePost.mutate(id)}
              onEdit={(id, content) => editPost.mutate({ postId: id, content })}
            />
          ))}
        </div>
      ))}

      <div ref={ref} className="py-4 text-center">
        {isFetchingNextPage ? (
          <Loader2 className="animate-spin mx-auto text-[#233B5D]" />
        ) : hasNextPage ? (
          <span className="text-sm text-slate-500">Cargando más...</span>
        ) : (
          <span className="text-sm text-slate-500">No hay más publicaciones</span>
        )}
      </div>
    </div>
  );
}
