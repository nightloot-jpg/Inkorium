import { Loader2 } from 'lucide-react';
import { useFeed } from '../hooks/useFeed';
import { PostCard } from './PostCard';

export function FeedList() {
  const { data, status, error, toggleLike } = useFeed();
  if (status === 'pending') return <div style={messageStyle}><Loader2 size={26} style={{animation:'spin 1s linear infinite',color:'#0755b8'}}/></div>;
  if (status === 'error') return <div style={messageStyle}><div style={{textAlign:'center'}}><b style={{color:'#dc2626'}}>No se ha podido cargar el feed.</b><div style={{marginTop:8,color:'#7b8795',fontSize:12,maxWidth:560}}>{error instanceof Error ? error.message : 'Error al consultar las publicaciones.'}</div></div></div>;
  if (!data?.length) return <div style={{...messageStyle,color:'#7b8795',fontSize:14}}>Todavía no hay publicaciones.</div>;
  return <div style={{display:'grid',gap:16,width:'100%',minWidth:0}}>{data.map(post=><PostCard key={post.id} post={post} onLike={toggleLike}/>)}</div>;
}
const messageStyle: React.CSSProperties = { minHeight:180, display:'flex', alignItems:'center', justifyContent:'center', background:'#fff', border:'1px solid #d9e1e8' };
