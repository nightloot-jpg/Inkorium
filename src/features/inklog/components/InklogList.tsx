import { useEffect } from 'react';
import { useInView } from 'react-intersection-observer';
import { Loader2 } from 'lucide-react';
import { InklogCard } from './InklogCard';
import { useInklog } from '../hooks/useInklog';

export function InklogList() {
  const { ref, inView } = useInView();
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    status,
  } = useInklog();

  useEffect(() => {
    if (inView && hasNextPage) {
      fetchNextPage();
    }
  }, [inView, fetchNextPage, hasNextPage]);

  if (status === 'pending') {
    return <div className="flex justify-center py-8"><Loader2 className="animate-spin text-[#233B5D]" /></div>;
  }

  if (status === 'error') {
    return <div className="text-center py-8 text-red-500">Error al cargar los inklogs.</div>;
  }

  return (
    <div className="columns-1 sm:columns-2 gap-4">
      {data.pages.map((page, i) => (
        <div key={i} className="contents">
          {page.data.map((inklog) => (
            <InklogCard key={inklog.id} inklog={inklog} />
          ))}
        </div>
      ))}

      <div ref={ref} className="py-4 text-center w-full col-span-full">
        {isFetchingNextPage ? (
          <Loader2 className="animate-spin mx-auto text-[#233B5D]" />
        ) : hasNextPage ? (
          <span className="text-sm text-slate-500">Cargando más...</span>
        ) : (
          <span className="text-sm text-slate-500">No hay más inklogs</span>
        )}
      </div>
    </div>
  );
}
