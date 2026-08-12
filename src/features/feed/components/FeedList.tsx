import { Loader2 } from 'lucide-react';
import { useFeed } from '../hooks/useFeed';
import { PostCard } from './PostCard';

export function FeedList() {
  const { data, status, error, toggleLike } = useFeed();

  if (status === 'pending') {
    return <div className="grid min-h-40 place-items-center border border-slate-200 bg-white shadow-sm"><Loader2 className="animate-spin text-blue-600" /></div>;
  }

  if (status === 'error') {
    return (
      <div className="flex min-h-40 items-center justify-center border border-slate-200 bg-white px-6 text-center shadow-sm">
        <div>
          <p className="font-semibold text-red-600">No se ha podido cargar el feed.</p>
          <p className="mt-2 break-words text-xs text-slate-500">{error instanceof Error ? error.message : 'Error al consultar las publicaciones.'}</p>
        </div>
      </div>
    );
  }

  if (!data?.length) {
    return <div className="grid min-h-40 place-items-center border border-slate-200 bg-white text-sm text-slate-500 shadow-sm">Todavía no hay publicaciones.</div>;
  }

  return <div className="flex w-full flex-col gap-4">{data.map((post) => <PostCard key={post.id} post={post} onLike={toggleLike} />)}</div>;
}
