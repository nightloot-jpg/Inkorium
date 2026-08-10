import { useEffect, useState } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import { Heart, MessageCircle } from 'lucide-react';
import type { Inklog } from '../types';

export function InklogCard({
 inklog }: { inklog: Inklog }) {
  const [isMounted, setIsMounted] = useState(false);
  useEffect(() => { setIsMounted(true); }, []);

  return (
    <article className="overflow-hidden rounded border border-slate-200 bg-white shadow-none">
      <div className="relative aspect-[4/5] bg-slate-100">
        <img className="h-full w-full object-cover" src={inklog.photo_url} alt={inklog.caption || ''} />
      </div>

      <div className="p-4">
        <div className="flex items-center gap-3 mb-3">
          <img className="h-8 w-8 rounded-full object-cover" src={inklog.profiles?.avatar_url || `https://ui-avatars.com/api/?name=${inklog.profiles?.full_name || 'User'}`} alt="" />
          <div className="flex-1 min-w-0">
            <p className="truncate text-sm font-bold">{inklog.profiles?.full_name}</p>
            <p className="text-xs text-slate-500">{isMounted ? formatDistanceToNow(new Date(inklog.created_at), { addSuffix: true, locale: es }) : "hace un momento"}</p>
          </div>
        </div>

        {inklog.caption && <p className="text-sm text-slate-700 mb-3">{inklog.caption}</p>}

        <div className="flex items-center gap-4 text-slate-500">
          <button className="flex items-center gap-1 hover:text-red-500 transition">
            <Heart size={18} className={inklog.likes?.length > 0 ? "fill-red-500 text-red-500" : ""} />
            <span className="text-xs font-medium">{inklog.likes?.length || 0}</span>
          </button>
          <button className="flex items-center gap-1 hover:text-[#233B5D] transition">
            <MessageCircle size={18} />
            <span className="text-xs font-medium">{inklog.comments?.length || 0}</span>
          </button>
        </div>
      </div>
    </article>
  );
}
