import { useEffect, useRef } from 'react';
import { Loader2 } from 'lucide-react';
import { useFeed } from '../hooks/useFeed';
import { PostCard } from './PostCard';

export function FeedList() {
  const loadMoreRef = useRef<HTMLDivElement | null>(null);
  const {
    data,
    status,
    hasNextPage,
    fetchNextPage,
    isFetchingNextPage,
    likePost,
    unlikePost,
    addComment,
    deletePost,
    editPost,
  } = useFeed();

  useEffect(() => {
    const element = loadMoreRef.current;
    if (!element || !hasNextPage) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !isFetchingNextPage) fetchNextPage();
      },
      { rootMargin: '400px 0px' },
    );

    observer.observe(element);
    return () => observer.disconnect();
  }, [fetchNextPage, hasNextPage, isFetchingNextPage]);

  if (status === 'pending') {
    return <div className="feed-message"><Loader2 className="animate-spin" style={{ color: '#075db0' }} /></div>;
  }

  if (status === 'error') {
    return (
      <div className="feed-message">
        <div style={{ textAlign: 'center' }}>
          <p style={{ margin: 0, color: '#d92727', fontWeight: 600 }}>No se ha podido cargar el feed.</p>
          <p style={{ margin: '6px 0 0', color: '#8a94a3', fontSize: 12 }}>Comprueba tu sesión e inténtalo de nuevo.</p>
        </div>
      </div>
    );
  }

  const pages = data?.pages ?? [];
  const posts = pages.flatMap((page) => page.data);

  if (posts.length === 0) {
    return <div className="feed-message"><span style={{ color: '#7b8797', fontSize: 14 }}>Todavía no hay publicaciones.</span></div>;
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
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
      <div ref={loadMoreRef} style={{ minHeight: 36, display: 'grid', placeItems: 'center', color: '#8a94a3', fontSize: 12 }}>
        {isFetchingNextPage ? <Loader2 className="animate-spin" size={18} /> : hasNextPage ? 'Cargando más publicaciones…' : 'No hay más publicaciones'}
      </div>
    </div>
  );
}
