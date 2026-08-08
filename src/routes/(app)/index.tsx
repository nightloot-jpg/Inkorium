import { createFileRoute } from '@tanstack/react-router';
import { useFeed } from '@/features/feed/hooks/useFeed';

export const Route = createFileRoute('/(app)/')({
  component: FeedPage,
});

function FeedPage() {
  const { data: posts, isLoading } = useFeed();

  return (
    <div className="max-w-2xl mx-auto w-full">
      <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 mb-6">
         Crear publicación (Placeholder)
      </div>
      {isLoading ? (
        <div className="text-center p-4">Cargando feed...</div>
      ) : (
        posts?.map((post) => (
          <div key={post.id} className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 mb-4">
             {post.content}
          </div>
        ))
      )}
    </div>
  );
}
