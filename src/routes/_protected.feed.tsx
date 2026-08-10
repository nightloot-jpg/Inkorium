import { createFileRoute } from '@tanstack/react-router';
import { PostComposer, FeedList } from '../features/feed/components';
import { useFeed } from '../features/feed/hooks/useFeed';
import { Link } from '@tanstack/react-router';

export const Route = createFileRoute('/_protected/feed')({
  component: Feed,
});

function Feed() {
  const { createPost } = useFeed();

  const handleCreatePost = (content: string, type: string, photos: File[]) => {
    createPost.mutate({ content, type, photos });
  };

  return (
    <div className="mx-auto max-w-[770px] space-y-4 pt-4">

      <div className="mb-4 bg-white border border-slate-200 rounded p-4">
        <div className="flex justify-between items-center mb-3">
          <h2 className="text-sm font-bold text-slate-800">Inklog</h2>
          <Link to="/inklog" className="text-xs text-blue-600 hover:underline">Ver todos los Inklogs →</Link>
        </div>
        <div className="grid grid-cols-5 gap-2">
          {[1,2,3,4,5,6,7,8,9,10].map(i => (
            <Link key={i} to="/inklog" className="aspect-square bg-slate-100 hover:opacity-80 transition block border border-slate-200">
               <img src={`https://picsum.photos/seed/${i+50}/200`} alt="" className="w-full h-full object-cover" />
            </Link>
          ))}
        </div>
      </div>
      <PostComposer onSubmit={handleCreatePost} isLoading={createPost.isPending} />
      <FeedList />
    </div>
  );
}
