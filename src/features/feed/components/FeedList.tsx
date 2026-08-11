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
          {page.data.map((post, postIndex) => {
            // Mock a music player visually on the first post of the first page to match the reference
            const isMockMusicPost = i === 0 && postIndex === 0;

            return (
              <div key={post.id}>
                 <PostCard
                  post={post}
                  onLike={(id) => likePost.mutate(id)}
                  onUnlike={(id) => unlikePost.mutate(id)}
                  onAddComment={(id, content) => addComment.mutate({ postId: id, content })}
                  onDelete={(id) => deletePost.mutate(id)}
                  onEdit={(id, content) => editPost.mutate({ postId: id, content })}
                />

                {isMockMusicPost && (
                  <div className="overflow-hidden rounded border border-slate-200 bg-white shadow-none mb-4 -mt-2">
                    <header className="flex items-center gap-3 px-4 pt-4 relative">
                      <img className="h-12 w-12 rounded-sm object-cover border border-slate-200" src="https://i.pravatar.cc/150?img=5" alt="User" />
                      <div className="flex-1">
                        <p className="text-sm font-bold text-[#233B5D] hover:underline cursor-pointer">Carlos Ruiz</p>
                        <p className="text-xs text-slate-500">hace 2 horas</p>
                      </div>
                    </header>
                    <div className="px-4 py-3 text-sm leading-6">
                      <p>¡Qué temazo!</p>
                    </div>

                    <div className="px-4 pb-2">
                      <div className="bg-[#181818] rounded flex p-3 gap-4 items-center">
                         <img src="https://picsum.photos/100/100?random=1" alt="Album cover" className="w-16 h-16 rounded object-cover shadow-lg" />
                         <div className="flex-1 text-white">
                           <p className="font-bold text-sm">Canción de ejemplo</p>
                           <p className="text-xs text-slate-400">Artista Desconocido</p>
                           <div className="mt-2 w-full bg-slate-700 h-1.5 rounded-full overflow-hidden">
                             <div className="bg-[#1DB954] w-1/3 h-full"></div>
                           </div>
                         </div>
                         <button className="h-10 w-10 bg-white rounded-full flex items-center justify-center shrink-0 hover:scale-105 transition">
                           <div className="w-0 h-0 border-t-8 border-t-transparent border-l-12 border-l-black border-b-8 border-b-transparent ml-1"></div>
                         </button>
                      </div>
                    </div>

                    <div className="mx-4 mt-1 flex items-center gap-4 border-t border-slate-100 pt-3 pb-3 text-xs font-bold text-[#233B5D]">
                      <button className="hover:underline flex items-center gap-1">
                         Me gusta (12)
                      </button>
                      <span className="text-slate-300">•</span>
                      <button className="hover:underline flex items-center gap-1">
                        Comentar (3)
                      </button>
                      <span className="text-slate-300">•</span>
                      <button className="hover:underline flex items-center gap-1">
                        Compartir
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
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
