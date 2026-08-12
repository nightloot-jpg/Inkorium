import { useEffect, useRef } from 'react';
import { Loader2 } from 'lucide-react';
import { useFeed } from '../hooks/useFeed';
import { PostCard } from './PostCard';

export function FeedList(){
 const loadMore=useRef<HTMLDivElement>(null); const {data,status,error,hasNextPage,fetchNextPage,isFetchingNextPage,likePost,unlikePost,addComment,deletePost,editPost}=useFeed();
 useEffect(()=>{const el=loadMore.current;if(!el||!hasNextPage)return;const obs=new IntersectionObserver(([entry])=>{if(entry.isIntersecting&&!isFetchingNextPage)fetchNextPage()},{rootMargin:'500px'});obs.observe(el);return()=>obs.disconnect()},[fetchNextPage,hasNextPage,isFetchingNextPage]);
 if(status==='pending')return <div className="ink-card flex min-h-44 items-center justify-center"><Loader2 className="animate-spin text-blue-600"/></div>;
 if(status==='error')return <div className="ink-card px-5 py-12 text-center"><p className="font-semibold text-red-600">No se ha podido cargar el feed.</p><p className="mt-2 text-xs text-slate-400">{error instanceof Error?error.message:'Error al consultar las publicaciones.'}</p></div>;
 const posts=data?.pages.flatMap(p=>p.data)??[];
 if(!posts.length)return <div className="ink-card px-5 py-14 text-center text-sm text-slate-500">Todavía no hay publicaciones.</div>;
 return <div className="flex flex-col gap-4">{data?.pages.map((page,pi)=>page.data.map((post,idx)=><PostCard key={post.id} post={post} musicVariant={pi===0&&idx<2} onLike={id=>likePost.mutate(id)} onUnlike={id=>unlikePost.mutate(id)} onAddComment={(id,content)=>addComment.mutate({postId:id,content})} onDelete={id=>deletePost.mutate(id)} onEdit={(id,content)=>editPost.mutate({postId:id,content})}/>))}<div ref={loadMore} className="flex min-h-12 items-center justify-center">{isFetchingNextPage?<Loader2 className="animate-spin text-blue-600"/>:hasNextPage?<span className="text-xs text-slate-400">Cargando más publicaciones...</span>:<span className="text-xs text-slate-400">No hay más publicaciones</span>}</div></div>;
}
