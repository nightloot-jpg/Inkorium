import { Loader2 } from 'lucide-react';
import { useFeed } from '../hooks/useFeed';
import { PostCard } from './PostCard';

export function FeedList() {
  const { data, isPending, isError, toggleLike } = useFeed();

  if (isPending) return <div className="feed-message"><Loader2 className="animate-spin" style={{ color: '#075db0' }} /></div>;

  if (isError) return <div className="feed-message"><span style={{ color: '#d92727', fontSize: 14 }}>No se ha podido cargar el feed.</span></div>;

  const posts = data ?? [];
  if (!posts.length) return <div className="feed-message"><span style={{ color: '#7b8797', fontSize: 14 }}>Todavía no hay publicaciones.</span></div>;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {posts.map((post) => <PostCard key={post.id} post={post} onLike={toggleLike} />)}
    </div>
  );
}
