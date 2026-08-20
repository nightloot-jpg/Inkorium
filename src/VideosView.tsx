import React, { useEffect, useRef, useState } from 'react';
import { Search, Play, Share2, Heart, UploadCloud, Trash2, Loader2, Video } from 'lucide-react';
import { usePlayerStore } from './lib/store';
import { supabase } from './lib/supabase';

type Page = 'inicio' | 'perfil' | 'mensajes' | 'personas' | 'musica' | 'buscar' | 'fotos' | 'videos';

type YouTubeItem = {
  id: { videoId: string };
  snippet: {
    title: string;
    description?: string;
    channelTitle: string;
    publishedAt?: string;
    thumbnails?: { high?: { url: string }; medium?: { url: string }; default?: { url: string } };
  };
};

export function VideosView({ navigate, session }: { navigate: (page: Page, params?: Record<string, any>) => void; session: any }) {
  const [activeTab, setActiveTab] = useState<'buscar' | 'mis_videos' | 'subidos'>('buscar');
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<YouTubeItem[]>([]);
  const [searching, setSearching] = useState(false);
  const [error, setError] = useState('');
  const [savedVideos, setSavedVideos] = useState<any[]>([]);
  const [uploadedVideos, setUploadedVideos] = useState<any[]>([]);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const player = usePlayerStore();
  const hasYoutubeKey = Boolean(import.meta.env.VITE_YOUTUBE_API_KEY);

  const loadSavedVideos = async () => {
    const { data } = await supabase.from('user_videos').select('*').eq('user_id', session.user.id).eq('source', 'youtube').order('created_at', { ascending: false });
    setSavedVideos(data || []);
  };

  const loadUploadedVideos = async () => {
    const { data } = await supabase.from('user_videos').select('*').eq('user_id', session.user.id).eq('source', 'uploaded').order('created_at', { ascending: false });
    setUploadedVideos(data || []);
  };

  useEffect(() => {
    if (activeTab === 'mis_videos') void loadSavedVideos();
    if (activeTab === 'subidos') void loadUploadedVideos();
  }, [activeTab, session.user.id]);

  async function searchVideos(event: React.FormEvent) {
    event.preventDefault();
    const value = query.trim();
    if (!value) return;
    if (!hasYoutubeKey) {
      setError('La API Key de YouTube no está configurada.');
      return;
    }
    setSearching(true);
    setError('');
    try {
      const response = await fetch(`https://www.googleapis.com/youtube/v3/search?part=snippet&q=${encodeURIComponent(value)}&type=video&maxResults=15&key=${import.meta.env.VITE_YOUTUBE_API_KEY}`);
      const data = await response.json();
      if (!response.ok) throw new Error(data?.error?.message || 'No se pudo buscar en YouTube.');
      setResults((data.items || []).filter((item: YouTubeItem) => item?.id?.videoId));
    } catch (err: any) {
      setResults([]);
      setError(err?.message || 'No se pudo completar la búsqueda.');
    } finally {
      setSearching(false);
    }
  }

  async function saveVideo(item: YouTubeItem) {
    const video = {
      user_id: session.user.id,
      youtube_video_id: item.id.videoId,
      title: item.snippet.title,
      thumbnail: item.snippet.thumbnails?.high?.url || item.snippet.thumbnails?.medium?.url || item.snippet.thumbnails?.default?.url,
      channel: item.snippet.channelTitle,
      source: 'youtube'
    };
    const { error: saveError } = await supabase.from('user_videos').insert(video);
    if (saveError) {
      setError(saveError.code === '23505' ? 'Este vídeo ya está guardado.' : saveError.message);
      return;
    }
    await loadSavedVideos();
  }

  async function removeVideo(id: string) {
    const { error: removeError } = await supabase.from('user_videos').delete().eq('id', id).eq('user_id', session.user.id);
    if (!removeError) setSavedVideos(current => current.filter(video => video.id !== id));
  }

  async function uploadVideo(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    if (!file.type.startsWith('video/')) {
      setError('Selecciona un archivo de vídeo válido.');
      return;
    }
    if (file.size > 1024 * 1024 * 1024) {
      setError('El vídeo no puede superar 1 GB.');
      return;
    }
    setUploading(true);
    setError('');
    try {
      const extension = file.name.split('.').pop()?.toLowerCase() || 'mp4';
      const path = `${session.user.id}/video-${Date.now()}.${extension}`;
      const { error: storageError } = await supabase.storage.from('post-media').upload(path, file, { cacheControl: '3600', upsert: true, contentType: file.type });
      if (storageError) throw storageError;
      const { data: publicData } = supabase.storage.from('post-media').getPublicUrl(path);
      const { error: dbError } = await supabase.from('user_videos').insert({ user_id: session.user.id, title: file.name, url: publicData.publicUrl, source: 'uploaded' });
      if (dbError) throw dbError;
      await loadUploadedVideos();
      setActiveTab('subidos');
    } catch (err: any) {
      setError(`No se pudo subir el vídeo: ${err?.message || 'error desconocido'}`);
    } finally {
      setUploading(false);
    }
  }

  const playYoutube = (id: string, title: string, thumbnail?: string) => {
    player.playSong({ video_id: id, title, thumbnail });
  };

  const shareVideo = (video: any) => {
    window.dispatchEvent(new CustomEvent('open-share-video', { detail: video }));
  };

  return (
    <section className="content-view videos-view" style={{ background: '#f3f6fa', minHeight: '100%', padding: '18px 20px' }}>
      <div className="panel" style={{ padding: 22 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 16 }}>
          <div>
            <h1 style={{ margin: 0, color: '#1f2e40', fontSize: 30 }}>Vídeos</h1>
            <p style={{ margin: '5px 0 0', color: '#58708a' }}>Busca, guarda y comparte vídeos con tus amigos.</p>
          </div>
          <button className="primary-button" onClick={() => fileInputRef.current?.click()} disabled={uploading} style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
            {uploading ? <Loader2 size={16} className="spin" /> : <UploadCloud size={16} />} Subir vídeo
          </button>
          <input ref={fileInputRef} type="file" accept="video/*" hidden onChange={uploadVideo} />
        </div>

        <div style={{ display: 'flex', gap: 24, borderBottom: '1px solid #e5eaf0', marginTop: 18 }}>
          {[
            ['buscar', '🎬 Buscar vídeos'],
            ['mis_videos', '📹 Mis vídeos'],
            ['subidos', '⬆ Vídeos subidos']
          ].map(([id, label]) => (
            <button key={id} onClick={() => setActiveTab(id as any)} style={{ background: 'transparent', border: 0, borderBottom: activeTab === id ? '2px solid #0750A7' : '2px solid transparent', padding: '12px 4px', color: activeTab === id ? '#0750A7' : '#60758b', fontWeight: activeTab === id ? 700 : 500, cursor: 'pointer' }}>{label}</button>
          ))}
        </div>
      </div>

      {error && <div style={{ marginTop: 14, padding: 12, border: '1px solid #f0caca', background: '#fff1f1', color: '#a52828', borderRadius: 6 }}>{error}</div>}

      {activeTab === 'buscar' && (
        <div className="panel" style={{ padding: 20, marginTop: 14 }}>
          <form onSubmit={searchVideos} style={{ display: 'flex', gap: 10 }}>
            <div style={{ position: 'relative', flex: 1 }}>
              <Search size={17} style={{ position: 'absolute', left: 13, top: 12, color: '#8192a5' }} />
              <input value={query} onChange={event => setQuery(event.target.value)} placeholder="Buscar vídeos en YouTube..." style={{ width: '100%', height: 42, boxSizing: 'border-box', padding: '0 14px 0 40px', border: '1px solid #d3dce6', borderRadius: 5 }} />
            </div>
            <button type="submit" className="primary-button" disabled={searching}>{searching ? <Loader2 size={17} className="spin" /> : 'Buscar'}</button>
          </form>
          {!hasYoutubeKey && <p style={{ margin: '16px 0 0', color: '#718096' }}>Configura <code>VITE_YOUTUBE_API_KEY</code> para activar la búsqueda.</p>}
          {searching && <div style={{ padding: 36, textAlign: 'center', color: '#718096' }}><Loader2 size={28} className="spin" /><p>Buscando vídeos...</p></div>}
          {!searching && results.length === 0 && <div style={{ padding: 45, textAlign: 'center', color: '#8191a2' }}><Video size={42} /><p>{query ? 'No se encontraron vídeos.' : 'Busca un vídeo en YouTube para empezar.'}</p></div>}
          {results.length > 0 && <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(210px, 1fr))', gap: 16, marginTop: 18 }}>
            {results.map(item => {
              const thumbnail = item.snippet.thumbnails?.high?.url || item.snippet.thumbnails?.medium?.url || item.snippet.thumbnails?.default?.url;
              return <VideoCard key={item.id.videoId} title={item.snippet.title} channel={item.snippet.channelTitle} thumbnail={thumbnail} onPlay={() => playYoutube(item.id.videoId, item.snippet.title, thumbnail)} onShare={() => shareVideo({ youtube_id: item.id.videoId, title: item.snippet.title, thumbnail, description: item.snippet.description, channel: item.snippet.channelTitle })} onSave={() => void saveVideo(item)} saveLabel="Guardar" />;
            })}
          </div>}
        </div>
      )}

      {activeTab === 'mis_videos' && <div className="panel" style={{ padding: 20, marginTop: 14 }}>
        {savedVideos.length === 0 ? <EmptyState icon={<Heart size={36} />} text="No tienes vídeos guardados todavía." /> : <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(210px, 1fr))', gap: 16 }}>{savedVideos.map(video => <VideoCard key={video.id} title={video.title} channel={video.channel} thumbnail={video.thumbnail} onPlay={() => playYoutube(video.youtube_video_id, video.title, video.thumbnail)} onShare={() => shareVideo({ youtube_id: video.youtube_video_id, title: video.title, thumbnail: video.thumbnail, channel: video.channel })} onRemove={() => void removeVideo(video.id)} saveLabel="Quitar" />)}</div>}
      </div>}

      {activeTab === 'subidos' && <div className="panel" style={{ padding: 20, marginTop: 14 }}>
        {uploadedVideos.length === 0 ? <EmptyState icon={<UploadCloud size={36} />} text="No has subido ningún vídeo todavía." /> : <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 16 }}>{uploadedVideos.map(video => <div key={video.id} style={{ border: '1px solid #e0e6ed', borderRadius: 6, overflow: 'hidden', background: '#fff' }}><div style={{ background: '#000', aspectRatio: '16/9' }}><video src={video.url} controls preload="metadata" style={{ width: '100%', height: '100%', objectFit: 'contain' }} /></div><div style={{ padding: 12, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}><strong style={{ fontSize: 13, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{video.title}</strong><button onClick={() => void removeVideo(video.id)} aria-label="Eliminar vídeo" style={{ border: 0, background: 'transparent', color: '#c62828', cursor: 'pointer' }}><Trash2 size={16} /></button></div></div>)}</div>}
      </div>}
    </section>
  );
}

function EmptyState({ icon, text }: { icon: React.ReactNode; text: string }) {
  return <div style={{ padding: 50, textAlign: 'center', color: '#8191a2' }}>{icon}<p>{text}</p></div>;
}

function VideoCard({ title, channel, thumbnail, onPlay, onShare, onSave, onRemove, saveLabel }: { title: string; channel?: string; thumbnail?: string; onPlay: () => void; onShare: () => void; onSave?: () => void; onRemove?: () => void; saveLabel: string }) {
  return <div style={{ border: '1px solid #e0e6ed', borderRadius: 6, overflow: 'hidden', background: '#fff', display: 'flex', flexDirection: 'column' }}>
    <button onClick={onPlay} style={{ padding: 0, border: 0, background: '#000', aspectRatio: '16/9', cursor: 'pointer' }} aria-label={`Reproducir ${title}`}><img src={thumbnail || '/default-video.png'} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} /></button>
    <div style={{ padding: 12, display: 'flex', flexDirection: 'column', gap: 5, flex: 1 }}>
      <strong style={{ color: '#243a51', fontSize: 13, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{title}</strong>
      {channel && <span style={{ color: '#708196', fontSize: 11 }}>{channel}</span>}
      <div style={{ display: 'flex', gap: 7, marginTop: 'auto', paddingTop: 10 }}>
        <button onClick={onPlay} style={{ flex: 1, padding: 7, border: '1px solid #d4dfeb', background: '#f0f4f8', color: '#1760b0', borderRadius: 4, cursor: 'pointer' }}><Play size={13} /> Ver</button>
        <button onClick={onShare} style={{ flex: 1, padding: 7, border: 0, background: '#0750A7', color: '#fff', borderRadius: 4, cursor: 'pointer' }}><Share2 size={13} /> Compartir</button>
      </div>
      {onSave && <button onClick={onSave} style={{ padding: 7, border: '1px solid #0750A7', background: '#fff', color: '#0750A7', borderRadius: 4, cursor: 'pointer' }}>{saveLabel}</button>}
      {onRemove && <button onClick={onRemove} style={{ padding: 7, border: '1px solid #c62828', background: '#fff', color: '#c62828', borderRadius: 4, cursor: 'pointer' }}>{saveLabel}</button>}
    </div>
  </div>;
}
