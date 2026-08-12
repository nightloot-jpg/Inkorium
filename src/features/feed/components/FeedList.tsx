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

  if (status === 'pending') return <div className="feed-state"><Loader2 className="feed-spin" size={22} /></div>;
  if (status === 'error') return <div className="feed-state feed-error"><strong>No se ha podido cargar el feed.</strong><span>{error instanceof Error ? error.message : 'Comprueba la sesión e inténtalo de nuevo.'}</span></div>;

  const posts = data?.pages.flatMap((page) => page.data) ?? [];
  if (posts.length === 0) return <div className="feed-state">Todavía no hay publicaciones.</div>;

  return <div className="feed-list">
    {posts.map((post, index) => <PostCard key={post.id} post={post} musicVariant={index < 2} onLike={(id) => likePost.mutate(id)} onUnlike={(id) => unlikePost.mutate(id)} onComment={(id, content) => addComment.mutate({ postId: id, content })} onDelete={(id) => deletePost.mutate(id)} onEdit={(id, content) => editPost.mutate({ postId: id, content })} />)}
    <div ref={sentinelRef} className="feed-loading-more">{isFetchingNextPage ? <Loader2 className="feed-spin" size={20} /> : hasNextPage ? 'Cargando más publicaciones…' : 'No hay más publicaciones'}</div>
  </div>;
}
