import { useEffect } from 'react';
import { useInView } from 'react-intersection-observer';
import { Loader2, MessageCircle, PlayCircle, Share2 } from 'lucide-react';
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
    editPost,
  } = useFeed();

  useEffect(() => {
    if (inView && hasNextPage) fetchNextPage();
  }, [inView, fetchNextPage, hasNextPage]);

  if (status === 'pending') {
    return <div className="flex justify-center py-10"><Loader2 className="animate-spin text-[#315f9f]" /></div>;
  }

  if (status === 'error') {
    return <div className="border border-[#d9e0e8] bg-white py-10 text-center text-red-500">Error al cargar el feed.</div>;
  }

  return (
    <div className="space-y-4">
      {data.pages.map((page, pageIndex) => (
        <div key={pageIndex} className="space-y-4">
          {page.data.map((post, postIndex) => {
            const isFeaturedMusicPost = pageIndex === 0 && postIndex === 0;

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

                {isFeaturedMusicPost && (
                  <article className="mt-[-1px] overflow-hidden border border-[#d9e0e8] bg-white shadow-[0_1px_3px_rgba(0,0,0,0.05)]">
                    <header className="flex items-center gap-3 px-5 py-4">
                      <img src="https://i.pravatar.cc/150?img=5" alt="Carlos Ruiz" className="h-12 w-12 rounded-full border border-[#d9e0e8] object-cover" />
                      <div>
                        <p className="text-[15px] font-bold text-[#1e2e43]">Carlos Ruiz</p>
                        <p className="text-xs text-[#8290a3]">hace 2 horas · 🌐</p>
                      </div>
                    </header>

                    <div className="bg-[#151515] text-white">
                      <div className="flex min-h-[112px] items-center">
                        <div className="relative grid h-28 w-28 shrink-0 place-items-center overflow-hidden bg-[#272727]">
                          <img src="https://picsum.photos/seed/inkorium-music/240/240" alt="Portada musical" className="h-full w-full object-cover opacity-90" />
                          <PlayCircle size={48} className="absolute text-white drop-shadow-lg" />
                        </div>
                        <div className="min-w-0 flex-1 px-6 py-4">
                          <p className="truncate text-lg font-bold">MHR, EFY & SNEZ! - Hola</p>
                          <p className="mt-1 text-sm text-[#a9a9a9]">MHR MUSIC</p>
                        </div>
                        <span className="self-start px-5 pt-4 text-sm font-semibold text-white">5:05</span>
                      </div>
                    </div>

                    <div className="grid grid-cols-3 border-t border-[#edf0f4] px-3 py-1">
                      <button className="flex items-center justify-center gap-2 py-3 text-sm font-semibold text-[#7a8798] hover:bg-[#f5f7fa]"><span>♡</span> Me gusta</button>
                      <button className="flex items-center justify-center gap-2 py-3 text-sm font-semibold text-[#7a8798] hover:bg-[#f5f7fa]"><MessageCircle size={17} /> Comentar</button>
                      <button className="flex items-center justify-center gap-2 py-3 text-sm font-semibold text-[#7a8798] hover:bg-[#f5f7fa]"><Share2 size={17} /> Compartir</button>
                    </div>
                  </article>
                )}
              </div>
            );
          })}
        </div>
      ))}

      <div ref={ref} className="py-5 text-center">
        {isFetchingNextPage ? <Loader2 className="mx-auto animate-spin text-[#315f9f]" /> : hasNextPage ? <span className="text-sm text-[#8290a3]">Cargando más...</span> : <span className="text-sm text-[#8290a3]">No hay más publicaciones</span>}
      </div>
    </div>
  );
}
