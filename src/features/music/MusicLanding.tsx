import React from 'react';
import { Music, Search, Play } from 'lucide-react';
import { supabase } from '../../lib/supabase';

export function MusicLanding({ session }: { session:any }) {
  const [tracks,setTracks]=React.useState<any[]>([]);
  const [loading,setLoading]=React.useState(true);
  const [error,setError]=React.useState('');
  React.useEffect(()=>{let cancelled=false;(async()=>{const {data,error}=await supabase.from('music_tracks').select('*').order('created_at',{ascending:false}).limit(12);if(cancelled)return;if(error){setError('No se pudo cargar la música.');setTracks([])}else setTracks(data||[]);setLoading(false)})();return()=>{cancelled=true}},[]);
  return <div style={{background:'#f3f6fa',padding:'18px 20px',minHeight:'100%'}}><div style={{maxWidth:1120,margin:'0 auto'}}>
    <div style={{background:'#fff',border:'1px solid #dfe6ee',borderRadius:6,padding:22}}><div style={{display:'flex',alignItems:'center',gap:10}}><Music size={24} color="#0750A7"/><h1 style={{margin:0,color:'#1f2e40'}}>Música</h1></div><p style={{margin:'6px 0 0',color:'#718096'}}>Escucha y descubre música en Inkorium.</p></div>
    <div style={{marginTop:14,background:'#fff',border:'1px solid #dfe6ee',borderRadius:6,padding:16}}>
      {loading?<p style={{color:'#718096'}}>Cargando música…</p>:error?<p style={{color:'#a52828'}}>{error}</p>:tracks.length===0?<div style={{padding:'50px 15px',textAlign:'center',color:'#718096'}}><Music size={42} color="#b8c5d2"/><p>No hay canciones disponibles todavía.</p></div>:<div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(220px,1fr))',gap:14}}>{tracks.map((track:any)=><article key={track.id} style={{border:'1px solid #e3e9ef',borderRadius:6,overflow:'hidden'}}><div style={{aspectRatio:'1',background:'#edf2f7'}}>{track.cover_url&&<img src={track.cover_url} alt="" style={{width:'100%',height:'100%',objectFit:'cover'}}/>}</div><div style={{padding:12}}><strong style={{display:'block',color:'#1f2e40'}}>{track.title}</strong><span style={{display:'block',marginTop:4,color:'#718096',fontSize:13}}>{track.artist||'Artista desconocido'}</span><button onClick={()=>track.youtube_id&&window.open(`https://www.youtube.com/watch?v=${track.youtube_id}`,'_blank','noopener,noreferrer')} style={{marginTop:10,display:'inline-flex',alignItems:'center',gap:6,border:'1px solid #cbd7e4',background:'#fff',color:'#0750A7',borderRadius:5,padding:'7px 10px',cursor:'pointer'}}><Play size={14}/>Reproducir</button></div></article>)}</div>}
    </div>
  </div></div>;
}
