import { Loader2 } from 'lucide-react';
import { useFeed } from '../hooks/useFeed';
import { PostCard } from './PostCard';

export function FeedList() {
  const { data, status, error, toggleLike } = useFeed();

  if (status === 'pending') return <div className="feed-message"><Loader2 className="animate-spin text-[#4b86d7]" /></div>;

  if (status === 'error') {
    return <div className="feed-message text-center"><div><p className="font-semibold text-red-600">No se ha podido cargar el feed.</p><p className="mt-2 text-xs text-[#8a94a2]">{error instanceof Error ? error.message : 'Error al consultar las publicaciones.'}</p></div></div>;
  }

  if (!data?.length) return <div className="feed-message text-sm text-[#7b8795]">Todavía no hay publicaciones.</div>;

  return <div className="flex flex-col gap-4">{data.map((post) => <PostCard key={post.id} post={post} onLike={toggleLike} />)}</div>;
}
