import React, { useEffect, useState } from 'react';
import { Search, Plus, Video, Loader2, ExternalLink, Trash2 } from 'lucide-react';
import { supabase } from '../../lib/supabase';

const blue = '#0750A7';
const border = '#dfe6ee';
const text = '#1f2e40';
const muted = '#718096';

type SavedVideo = { id:string; youtube_video_id:string|null; title:string; thumbnail:string|null; channel:string|null; url:string|null; created_at:string };
type YouTubeResult = { id:{videoId:string}; snippet:{title:string; channelTitle:string; thumbnails?:{high?:{url:string};medium?:{url:string};default?:{url:string}}} };

export function VideoView({ session }: { session:any; navigate:any }) {
  const [tab,setTab] = useState<'descubrir'|'mis-videos'>('descubrir');
  return <section className="content-view ink-video-view" style={{background:'#f3f6fa',minHeight:'100%',padding:'18px 20px'}}>
    <style>{`.
      feed-layout:has(.ink-video-view){grid-template-columns:minmax(190px,280px) minmax(0,1fr)!important}
      .feed-layout:has(.ink-video-view)> .right-column,.feed-layout:has(.ink-video-view) .right-column,body:has(.ink-video-view) .right-column{display:none!important}
      .ink-video-shell{max-width:1220px;margin:0 auto;display:grid;grid-template-columns:minmax(0,1fr) 300px;gap:18px}
      .ink-video-panel{background:#fff;border:1px solid ${border};border-radius:6px;box-shadow:0 1px 2px rgba(23,55,90,.03)}
      .ink-video-tabs{display:flex;gap:28px;border-bottom:1px solid #e5eaf0;overflow:auto}
      .ink-video-tab{border:0;background:transparent;border-bottom:2px solid transparent;padding:13px 4px 12px;color:#51657b;font-weight:700;cursor:pointer;display:flex;gap:7px;align-items:center;white-space:nowrap}
      .ink-video-tab.active{color:${blue};border-bottom-color:${blue}}
      .ink-video-search{display:flex;gap:10px}
      .ink-video-input{flex:1;min-width:0;height:44px;border:1px solid #d3dce6;border-radius:5px;padding:0 14px 0 40px;outline:0;color:${text}}
      .ink-video-input:focus{border-color:${blue};box-shadow:0 0 0 2px rgba(7,80,167,.1)}
      .ink-video-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:14px}
      .ink-video-card{overflow:hidden;border:1px solid ${border};background:#fff;border-radius:6px}
      .ink-video-thumb{display:block;width:100%;aspect-ratio:16/9;object-fit:cover;background:#eaf0f5}
      .ink-video-body{padding:12px}
      .ink-video-body button{display:inline-flex;align-items:center;gap:5px;border:1px solid #cbd7e4;background:#fff;color:#536b84;border-radius:5px;padding:7px 10px;cursor:pointer}
      .ink-video-body button:hover{border-color:${blue};color:${blue};background:#f5f9ff}
      @media(max-width:1000px){.ink-video-shell{grid-template-columns:1fr}}
      @media(max-width:700px){.feed-layout:has(.ink-video-view){grid-template-columns:1fr!important}.ink-video-view{padding:10px}.ink-video-grid{grid-template-columns:1fr}}
    `}</style>
    <div className="ink-video-shell">
      <div>
        <div className="ink-video-panel" style={{padding:22}}>
          <h1 style={{margin:0,color:text,fontSize:30}}>Vídeos</h1>
          <p style={{margin:'5px 0 12px',color:'#58708a'}}>Descubre vídeos y guarda tus favoritos en Inkorium.</p>
          <nav className="ink-video-tabs" aria-label="Secciones de vídeos">
            <button className={`ink-video-tab${tab==='descubrir'?' active':''}`} onClick={()=>setTab('descubrir')}><Video size={17}/>Descubrir</button>
            <button className={`ink-video-tab${tab==='mis-videos'?' active':''}`} onClick={()=>setTab('mis-videos')}><Plus size={17}/>Mis vídeos</button>
          </nav>
        </div>
        <div style={{marginTop:14}}>{tab==='descubrir'?<VideoDiscover session={session}/>:<SavedVideos session={session}/>}</div>
      </div>
      <aside className="ink-video-panel" style={{padding:18,height:'fit-content'}}>
        <strong style={{display:'block',color:text,fontSize:17,marginBottom:6}}>Vídeos en Inkorium</strong>
        <p style={{margin:0,color:muted,fontSize:13,lineHeight:1.5}}>Busca vídeos de YouTube, ábrelos en su reproductor y guárdalos para tenerlos a mano en Inkorium.</p>
      </aside>
    </div>
  </section>;
}

function VideoDiscover({session}:{session:any}){
  const [query,setQuery]=useState(''); const [results,setResults]=useState<YouTubeResult[]>([]); const [loading,setLoading]=useState(false); const [error,setError]=useState(''); const [notice,setNotice]=useState('');
  async function search(event:React.FormEvent){event.preventDefault();const value=query.trim();if(!value)return;setLoading(true);setError('');setNotice('');try{const apiKey=import.meta.env.VITE_YOUTUBE_API_KEY;if(!apiKey)throw new Error('Falta VITE_YOUTUBE_API_KEY');const response=await fetch(`https://www.googleapis.com/youtube/v3/search?part=snippet&q=${encodeURIComponent(value)}&type=video&maxResults=12&key=${apiKey}`);const data=await response.json();if(!response.ok)throw new Error(data?.error?.message||'No se pudieron cargar los vídeos.');setResults((data.items||[]).filter((item:YouTubeResult)=>item?.id?.videoId));if((data.items||[]).length===0)setNotice('No se han encontrado vídeos para esa búsqueda.')}catch(err:any){setError(err?.message||'No se pudo completar la búsqueda.')}finally{setLoading(false)}}
  async function save(item:YouTubeResult){const videoId=item.id.videoId;const thumbnail=item.snippet.thumbnails?.high?.url||item.snippet.thumbnails?.medium?.url||item.snippet.thumbnails?.default?.url||null;const {error}=await supabase.from('user_videos').insert({user_id:session.user.id,youtube_video_id:videoId,title:item.snippet.title,thumbnail,channel:item.snippet.channelTitle,url:`https://www.youtube.com/watch?v=${videoId}`,source:'youtube'});if(error){setNotice(error.code==='23505'?'Ese vídeo ya está guardado.':'No se pudo guardar el vídeo.');return}setNotice('Vídeo guardado en Mis vídeos.')}
  return <div className="ink-video-panel" style={{padding:16}}>
    <form onSubmit={search} className="ink-video-search" style={{marginBottom:14}}><div style={{position:'relative',flex:1,minWidth:0}}><Search size={18} color="#8192a5" style={{position:'absolute',left:13,top:13}}/><input className="ink-video-input" value={query} onChange={e=>setQuery(e.target.value)} placeholder="Buscar vídeos, canales, temas..."/></div><button type="submit" disabled={loading} style={{minWidth:96,border:0,borderRadius:5,background:blue,color:'#fff',fontWeight:700}}>{loading?<Loader2 size={18}/>: 'Buscar'}</button></form>
    {error&&<div style={{padding:12,marginBottom:14,borderRadius:5,color:'#a52828',background:'#fff1f1',border:'1px solid #f0caca',fontSize:13}}>{error}</div>}
    {notice&&<div style={{padding:12,marginBottom:14,borderRadius:5,color:'#24613b',background:'#effaf2',border:'1px solid #ccebd5',fontSize:13}}>{notice}</div>}
    {results.length===0&&!loading?<div style={{padding:'48px 15px',textAlign:'center',color:muted}}><Video size={42} color="#b8c5d2"/><p style={{margin:'12px 0 0'}}>Busca un vídeo para empezar.</p></div>:<div className="ink-video-grid">{results.map(item=>{const id=item.id.videoId;const thumbnail=item.snippet.thumbnails?.high?.url||item.snippet.thumbnails?.medium?.url||item.snippet.thumbnails?.default?.url;return <article className="ink-video-card" key={id}><img className="ink-video-thumb" src={thumbnail} alt=""/><div className="ink-video-body"><strong style={{display:'block',color:text,fontSize:14,lineHeight:1.35}}>{item.snippet.title}</strong><span style={{display:'block',marginTop:5,color:muted,fontSize:12}}>{item.snippet.channelTitle}</span><div style={{display:'flex',gap:8,marginTop:10}}><button onClick={()=>window.open(`https://www.youtube.com/watch?v=${id}`,'_blank','noopener,noreferrer')}><ExternalLink size={14}/>Ver</button><button onClick={()=>save(item)}><Plus size={14}/>Guardar</button></div></div></article>})}</div>}
  </div>;
}

function SavedVideos({session}:{session:any}){const[videos,setVideos]=useState<SavedVideo[]>([]);const[loading,setLoading]=useState(true);const[error,setError]=useState('');async function load(){setLoading(true);setError('');const{data,error}=await supabase.from('user_videos').select('*').eq('user_id',session.user.id).order('created_at',{ascending:false});if(error)setError('No se pudieron cargar tus vídeos.');else setVideos((data||[]) as SavedVideo[]);setLoading(false)}useEffect(()=>{void load()},[session.user.id]);async function remove(id:string){const{error}=await supabase.from('user_videos').delete().eq('id',id).eq('user_id',session.user.id);if(!error)setVideos(prev=>prev.filter(v=>v.id!==id))}if(loading)return <div className="ink-video-panel" style={{padding:30,textAlign:'center',color:muted}}><Loader2 size={20}/></div>;return <div className="ink-video-panel" style={{padding:16}}>{error&&<p style={{color:'#a52828'}}>{error}</p>}{videos.length===0&&!error?<div style={{padding:'48px 15px',textAlign:'center',color:muted}}><Video size={42} color="#b8c5d2"/><p style={{margin:'12px 0 0'}}>Todavía no has guardado ningún vídeo.</p></div>:<div className="ink-video-grid">{videos.map(video=><article className="ink-video-card" key={video.id}><img className="ink-video-thumb" src={video.thumbnail||'/default-avatar.png'} alt=""/><div className="ink-video-body"><strong style={{display:'block',color:text,fontSize:14}}>{video.title}</strong><span style={{display:'block',marginTop:5,color:muted,fontSize:12}}>{video.channel||'YouTube'}</span><div style={{display:'flex',gap:8,marginTop:10}}>{video.youtube_video_id&&<button onClick={()=>window.open(`https://www.youtube.com/watch?v=${video.youtube_video_id}`,'_blank','noopener,noreferrer')}><ExternalLink size={14}/>Ver</button>}<button onClick={()=>remove(video.id)}><Trash2 size={14}/>Eliminar</button></div></div></article>)}</div>}</div>}
