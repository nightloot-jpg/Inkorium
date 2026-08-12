import { Loader2 } from 'lucide-react';
import { useFeed } from '../hooks/useFeed';
import { PostCard } from './PostCard';

export function FeedList() {
  const { data, status, toggleLike } = useFeed();

  if (status === 'pending') {
    return (
      <div className="feed-message" aria-live="polite">
        <Loader2 className="animate-spin text-[#4b86d7]" />
      </div>
    );
  }

  const posts = data ?? [];

  if (status === 'error' && posts.length === 0) {
    return (
      <div className="feed-message text-center">
        <p className="font-semibold text-red-600">No se ha podido cargar el feed.</p>
        <p className="mt-1 text-xs text-[#8a94a2]">Vuelve a intentarlo en unos segundos.</p>
      </div>
    );
  }

  if (!posts.length) {
    return (
      <div className="feed-message text-sm text-[#7b8795]">
        Todavía no hay publicaciones.
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {posts.map((post) => (
        <PostCard key={post.id} post={post} onLike={toggleLike} />
      ))}
    </div>
  );
}
