import React, { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { usePlayerStore } from '../../lib/store';
import { Search, Heart, Share2, Plus, Music, Play, ListPlus, Loader2, UploadCloud, X, Users } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';

const blue = '#0750A7';
const border = '#dfe6ee';
const text = '#1f2e40';
const muted = '#718096';

type MusicTrack = {
  id?: string;
  title: string;
  artist?: string | null;
  source_type?: 'youtube' | 'local';
  youtube_id?: string | null;
  cover_url?: string | null;
};

type YouTubeResult = {
  id: { videoId: string };
  snippet: {
    title: string;
    channelTitle: string;
    thumbnails?: { high?: { url: string }; medium?: { url: string }; default?: { url: string } };
  };
};

export function MusicView({ session }: { session: any; navigate: any }) {
  const [activeTab, setActiveTab] = useState<'descubrir' | 'buscar' | 'mi-musica' | 'playlists' | 'subir'>('descubrir');

  return (
    <section className="content-view music-view" style={{ background: '#f3f6fa', minHeight: '100%', padding: '18px 20px' }}>
      <style>{`
        .feed-layout:has(.music-view) { grid-template-columns: minmax(190px, 280px) minmax(0, 1fr) !important; }
        .feed-layout:has(.music-view) > .right-column,
        .feed-layout:has(.music-view) .right-column,
        body:has(.music-view) .right-column { display: none !important; }
        .music-shell { display:grid; grid-template-columns:minmax(0,1fr) 300px; gap:18px; max-width:1220px; margin:0 auto; }
        .music-panel { background:#fff; border:1px solid ${border}; border-radius:6px; box-shadow:0 1px 2px rgba(23,55,90,.03); }
        .music-tabs { display:flex; gap:26px; border-bottom:1px solid #e5eaf0; overflow:auto; }
        .music-tab { display:flex; align-items:center; gap:7px; padding:13px 4px 12px; border:0; border-bottom:2px solid transparent; background:transparent; color:#51657b; font-weight:600; white-space:nowrap; cursor:pointer; }
        .music-tab.active { color:${blue}; border-bottom-color:${blue}; }
        .music-search-row { display:flex; gap:10px; }
        .music-search-input { flex:1; min-width:0; height:44px; padding:0 14px 0 40px; border:1px solid #d3dce6; border-radius:5px; outline:0; color:${text}; background:#fff; }
        .music-search-input:focus { border-color:${blue}; box-shadow:0 0 0 2px rgba(7,80,167,.10); }
        .music-result { display:flex; align-items:center; gap:14px; padding:11px 0; border-bottom:1px solid #edf1f5; }
        .music-result:last-child { border-bottom:0; }
        .music-cover { width:72px; height:72px; flex:0 0 72px; border-radius:5px; object-fit:cover; background:#edf2f7; }
        .music-action { display:grid; place-items:center; width:36px; height:36px; padding:0; border:1px solid #cbd7e4; border-radius:5px; color:#536b84; background:#fff; cursor:pointer; }
        .music-action:hover { border-color:${blue}; color:${blue}; background:#f5f9ff; }
        .music-action.primary { color:#fff; border-color:${blue}; background:${blue}; }
        .music-action.primary:hover { background:#06458f; color:#fff; }
        .music-card { padding:16px; }
        .music-side-card { padding:17px; }
        .music-side-item { display:flex; gap:10px; padding:10px 0; border-bottom:1px solid #edf1f5; }
        .music-side-item:last-child { border-bottom:0; }
        .music-avatar { width:34px; height:34px; flex:0 0 34px; border-radius:50%; object-fit:cover; background:#e7eef6; }
        .music-modal-backdrop { position:fixed; inset:0; z-index:2000; display:grid; place-items:center; padding:20px; background:rgba(20,34,52,.35); }
        .music-modal { width:min(520px,100%); max-height:min(680px,90vh); overflow:auto; background:#fff; border:1px solid ${border}; border-radius:8px; box-shadow:0 20px 60px rgba(20,34,52,.25); }
        @media(max-width:900px){ .music-shell{grid-template-columns:1fr}.music-sidebar{order:2} }
        @media(max-width:700px){ .feed-layout:has(.music-view){grid-template-columns:1fr !important}.music-view{padding:10px}.music-result{align-items:flex-start}.music-result-actions{flex-wrap:wrap}.music-cover{width:64px;height:64px;flex-basis:64px} }
      `}</style>

      <div className="music-shell">
        <div className="music-main">
          <div className="music-panel" style={{ padding: '22px' }}>
            <header style={{ marginBottom: 8 }}>
              <h1 style={{ margin: 0, color: text, fontSize: 30 }}>Música</h1>
              <p style={{ margin: '5px 0 0', color: '#58708a', fontSize: 16 }}>Escucha, comparte y descubre música con tus amigos.</p>
            </header>
            <nav className="music-tabs" aria-label="Secciones de música">
              <Tab active={activeTab === 'descubrir'} onClick={() => setActiveTab('descubrir')} icon={<Heart size={17} />} label="Descubrir" />
              <Tab active={activeTab === 'buscar'} onClick={() => setActiveTab('buscar')} icon={<Search size={17} />} label="Buscar" />
              <Tab active={activeTab === 'mi-musica'} onClick={() => setActiveTab('mi-musica')} icon={<Music size={17} />} label="Mi música" />
              <Tab active={activeTab === 'playlists'} onClick={() => setActiveTab('playlists')} icon={<ListPlus size={17} />} label="Playlists" />
              <Tab active={activeTab === 'subir'} onClick={() => setActiveTab('subir')} icon={<UploadCloud size={17} />} label="Subir canción" />
            </nav>
          </div>
          <div style={{ marginTop: 14 }}>
            {activeTab === 'buscar' && <MusicSearch session={session} />}
            {activeTab === 'descubrir' && <MusicDiscover onSearch={() => setActiveTab('buscar')} />}
            {activeTab === 'mi-musica' && <MyMusic session={session} />}
            {activeTab === 'playlists' && <PlaylistsTab session={session} />}
            {activeTab === 'subir' && <MusicUpload session={session} onDone={() => setActiveTab('mi-musica')} />}
          </div>
        </div>
        <aside className="music-sidebar" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <MusicActivitySidebar />
          <FriendsPlaylistsSidebar session={session} />
        </aside>
      </div>
    </section>
  );
}

function Tab({ active, onClick, icon, label }: { active: boolean; onClick: () => void; icon: React.ReactNode; label: string }) {
  return <button className={`music-tab${active ? ' active' : ''}`} onClick={onClick}>{icon}{label}</button>;
}

function Card({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return <div className="music-panel music-card" style={style}>{children}</div>;
}

function MusicActivitySidebar() {
  const [activities, setActivities] = useState<any[]>([]);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data, error } = await supabase
        .from('music_activity')
        .select('*, profiles:user_id(username, full_name, avatar_url), music_tracks:track_id(*)')
        .order('created_at', { ascending: false })
        .limit(100);
      if (!cancelled && !error && data) setActivities(data);
      if (error) console.error('No se pudo cargar la actividad musical:', error);
    })();
    return () => { cancelled = true; };
  }, []);

  const visibleActivities = expanded ? activities : activities.slice(0, 6);

  return <div className="music-panel music-side-card">
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, marginBottom: 6 }}>
      <button
        type="button"
        onClick={() => setExpanded((value) => !value)}
        aria-expanded={expanded}
        style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0, padding: 0, border: 0, background: 'transparent', color: text, cursor: 'pointer', font: 'inherit', textAlign: 'left' }}
      >
        <Music size={18} color={blue} />
        <strong style={{ fontSize: 17 }}>Actividad musical</strong>
        <span aria-hidden="true" style={{ color: muted, fontSize: 14, marginLeft: 2 }}>{expanded ? '▴' : '▾'}</span>
      </button>
      {activities.length > 0 && <span style={{ color: muted, fontSize: 11, whiteSpace: 'nowrap' }}>{activities.length} actividades</span>}
    </div>

    {activities.length === 0 ? (
      <p style={{ margin: '16px 0 4px', color: muted, fontStyle: 'italic', fontSize: 14 }}>No hay actividad reciente.</p>
    ) : (
      <>
        <div style={{ maxHeight: expanded ? 520 : 'none', overflowY: expanded ? 'auto' : 'visible', paddingRight: expanded ? 5 : 0 }}>
          {visibleActivities.map((activity) => <div className="music-side-item" key={activity.id}>
            <img className="music-avatar" src={activity.profiles?.avatar_url || '/default-avatar.png'} alt="" />
            <div style={{ minWidth: 0, fontSize: 13 }}>
              <strong style={{ color: text }}>{activity.profiles?.full_name || activity.profiles?.username || 'Usuario'}</strong>
              <span style={{ color: '#5d7187' }}>{activity.action === 'listened' ? ' escuchó ' : activity.action === 'shared' ? ' compartió ' : activity.action === 'saved' ? ' guardó ' : ' creó una playlist '}</span>
              <strong style={{ color: text }}>{activity.music_tracks?.title || 'una canción'}</strong>
              <div style={{ color: '#9aa8b6', fontSize: 11, marginTop: 3 }}>{relativeTime(activity.created_at)}</div>
            </div>
          </div>)}
        </div>

        {activities.length > 6 && (
          <button
            type="button"
            onClick={() => setExpanded((value) => !value)}
            style={{ width: '100%', marginTop: 8, padding: '8px 10px', border: '1px solid #d8e1eb', borderRadius: 5, background: '#f7f9fc', color: blue, fontWeight: 700, cursor: 'pointer' }}
          >
            {expanded ? 'Mostrar menos' : `Ver todas (${activities.length})`}
          </button>
        )}
      </>
    )}
  </div>;
}

function FriendsPlaylistsSidebar({ session }: { session: any }) {
  const [playlists, setPlaylists] = useState<any[]>([]);
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data } = await supabase.from('music_playlists').select('*, profiles:user_id(username, full_name, avatar_url)').eq('is_public', true).neq('user_id', session.user.id).order('created_at', { ascending: false }).limit(5);
      if (!cancelled && data) setPlaylists(data);
    })();
    return () => { cancelled = true; };
  }, [session.user.id]);
  return <div className="music-panel music-side-card">
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}><Users size={18} color={blue} /><strong style={{ color: text, fontSize: 17 }}>Playlists de amigos</strong></div>
    {playlists.length === 0 ? <p style={{ margin: '16px 0 4px', color: muted, fontStyle: 'italic', fontSize: 14 }}>No hay playlists públicas de amigos.</p> : playlists.map((playlist) => <div className="music-side-item" key={playlist.id}>
      <div style={{ width: 44, height: 44, flex: '0 0 44px', borderRadius: 5, overflow: 'hidden', background: '#edf2f7', display: 'grid', placeItems: 'center' }}>{playlist.cover_url ? <img src={playlist.cover_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <ListPlus size={18} color={muted} />}</div>
      <div style={{ minWidth: 0 }}><strong style={{ display: 'block', color: text, fontSize: 13, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{playlist.name}</strong><span style={{ color: muted, fontSize: 11 }}>Por {playlist.profiles?.full_name || playlist.profiles?.username || 'Usuario'}</span></div>
    </div>)}
  </div>;
}

function MusicSearch({ session }: { session: any }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<YouTubeResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [error, setError] = useState('');
  const [selectedTrack, setSelectedTrack] = useState<MusicTrack | null>(null);
  const [notice, setNotice] = useState('');
  async function handleSearch(event: React.FormEvent) {
    event.preventDefault();
    const value = query.trim();
    if (!value) return;
    setSearching(true); setError(''); setNotice('');
    try {
      const apiKey = import.meta.env.VITE_YOUTUBE_API_KEY;
      if (!apiKey) throw new Error('Falta VITE_YOUTUBE_API_KEY');
      const response = await fetch(`https://www.googleapis.com/youtube/v3/search?part=snippet&q=${encodeURIComponent(value)}&type=video&maxResults=15&key=${apiKey}`);
      const data = await response.json();
      if (!response.ok) throw new Error(data?.error?.message || 'No se pudo buscar música.');
      setResults((data.items || []).filter((item: YouTubeResult) => item?.id?.videoId));
    } catch (err: any) { console.error(err); setError(err?.message || 'No se pudo completar la búsqueda.'); }
    finally { setSearching(false); }
  }
  return <Card>
    <h2 style={{ margin: '0 0 15px', color: text, fontSize: 22 }}>Buscar música</h2>
    <form onSubmit={handleSearch} className="music-search-row" style={{ marginBottom: 18 }}>
      <div style={{ position: 'relative', flex: 1, minWidth: 0 }}><Search size={18} color="#8192a5" style={{ position: 'absolute', left: 13, top: 13 }} /><input className="music-search-input" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Buscar canciones, artistas, vídeos..." /></div>
      <button type="submit" disabled={searching} style={{ minWidth: 96, borderRadius: 5, color: '#fff', background: blue, fontWeight: 700 }}>{searching ? <Loader2 size={18} className="spin" /> : 'Buscar'}</button>
    </form>
    {error && <div style={{ padding: 12, marginBottom: 14, borderRadius: 5, color: '#a52828', background: '#fff1f1', border: '1px solid #f0caca', fontSize: 13 }}>{error}</div>}
    {notice && <div style={{ padding: 12, marginBottom: 14, borderRadius: 5, color: '#24613b', background: '#effaf2', border: '1px solid #ccebd5', fontSize: 13 }}>{notice}</div>}
    {results.length === 0 && !searching ? <div style={{ padding: '45px 15px', textAlign: 'center', color: muted }}><Search size={42} color="#b8c5d2" /><p style={{ margin: '12px 0 0' }}>Busca una canción para ver su carátula, artista y acciones.</p></div> : <div>{results.map((item) => { const cover = item.snippet.thumbnails?.high?.url || item.snippet.thumbnails?.medium?.url || item.snippet.thumbnails?.default?.url; const track: MusicTrack = { source_type: 'youtube', youtube_id: item.id.videoId, title: stripHtml(item.snippet.title), artist: item.snippet.channelTitle, cover_url: cover }; return <SearchResult key={item.id.videoId} track={track} onNotice={setNotice} onAdd={() => setSelectedTrack(track)} session={session} />; })}</div>}
    {selectedTrack && <PlaylistPicker track={selectedTrack} session={session} onClose={() => setSelectedTrack(null)} onDone={() => { setSelectedTrack(null); setNotice('Canción añadida a la playlist.'); }} />}
  </Card>;
}

function SearchResult({ track, session, onNotice, onAdd }: { track: MusicTrack; session: any; onNotice: (message: string) => void; onAdd: () => void }) {
  const player = usePlayerStore();
  const [saved, setSaved] = useState(false);
  const [busy, setBusy] = useState(false);
  async function ensureTrack() {
    if (track.id) return track.id;
    const { data: existing } = await supabase.from('music_tracks').select('id').eq('source_type', 'youtube').eq('youtube_id', track.youtube_id).maybeSingle();
    if (existing?.id) return existing.id;
    const { data, error } = await supabase.from('music_tracks').insert({ user_id: session.user.id, title: track.title, artist: track.artist, source_type: 'youtube', youtube_id: track.youtube_id, cover_url: track.cover_url }).select('id').single();
    if (error) throw error;
    return data.id;
  }
  async function saveFavorite() {
    setBusy(true);
    try { const id = await ensureTrack(); const { error } = await supabase.from('music_favorites').upsert({ user_id: session.user.id, track_id: id }, { onConflict: 'user_id,track_id' }); if (error) throw error; setSaved(true); await supabase.from('music_activity').insert({ user_id: session.user.id, track_id: id, action: 'saved' }); onNotice('Canción guardada en tus favoritas.'); }
    catch (error: any) { console.error(error); onNotice(error?.message || 'No se pudo guardar la canción.'); }
    finally { setBusy(false); }
  }
  async function share() {
    setBusy(true);
    try { const id = await ensureTrack(); await supabase.from('music_activity').insert({ user_id: session.user.id, track_id: id, action: 'shared' }); const shareData = { title: track.title, text: `${track.title} · ${track.artist}`, url: `https://www.youtube.com/watch?v=${track.youtube_id}` }; if (navigator.share) await navigator.share(shareData); else { await navigator.clipboard.writeText(shareData.url); onNotice('Enlace de la canción copiado.'); } }
    catch (error: any) { if (error?.name !== 'AbortError') onNotice(error?.message || 'No se pudo compartir.'); }
    finally { setBusy(false); }
  }
  const play = () => player.playSong({ source_type: 'youtube', video_id: track.youtube_id || undefined, title: track.title, artist: track.artist || '', thumbnail: track.cover_url || undefined });
  return <div className="music-result">
    <div style={{ position: 'relative', flex: '0 0 72px' }}>{track.cover_url ? <img className="music-cover" src={track.cover_url} alt="" /> : <div className="music-cover" />}<button className="music-action primary" onClick={play} title="Reproducir" style={{ position: 'absolute', left: 18, top: 18, width: 36, height: 36, borderRadius: '50%' }}><Play size={17} fill="currentColor" /></button></div>
    <div style={{ flex: 1, minWidth: 0 }}><strong style={{ display: 'block', color: '#3f2aa6', fontSize: 15, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{track.title}</strong><span style={{ display: 'block', marginTop: 4, color: muted, fontSize: 13 }}>{track.artist}</span><span style={{ display: 'block', marginTop: 3, color: '#9aa8b6', fontSize: 11 }}>YouTube</span></div>
    <div className="music-result-actions" style={{ display: 'flex', gap: 7, alignItems: 'center' }}><button className="music-action primary" onClick={play} title="Reproducir"><Play size={16} fill="currentColor" /></button><button className="music-action" onClick={saveFavorite} disabled={busy} title="Guardar en favoritas"><Heart size={16} fill={saved ? 'currentColor' : 'none'} color={saved ? blue : undefined} /></button><button className="music-action" onClick={onAdd} disabled={busy} title="Añadir a playlist"><Plus size={18} /></button><button className="music-action" onClick={share} disabled={busy} title="Compartir"><Share2 size={16} /></button></div>
  </div>;
}

function PlaylistPicker({ track, session, onClose, onDone }: { track: MusicTrack; session: any; onClose: () => void; onDone: () => void }) {
  const [playlists, setPlaylists] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  useEffect(() => { (async () => { const { data } = await supabase.from('music_playlists').select('*').eq('user_id', session.user.id).order('created_at', { ascending: false }); setPlaylists(data || []); setLoading(false); })(); }, [session.user.id]);
  async function ensureTrack() { const { data: existing } = await supabase.from('music_tracks').select('id').eq('source_type', 'youtube').eq('youtube_id', track.youtube_id).maybeSingle(); if (existing?.id) return existing.id; const { data, error } = await supabase.from('music_tracks').insert({ user_id: session.user.id, title: track.title, artist: track.artist, source_type: 'youtube', youtube_id: track.youtube_id, cover_url: track.cover_url }).select('id').single(); if (error) throw error; return data.id; }
  async function addToPlaylist(playlistId: string) { setError(''); try { const trackId = await ensureTrack(); const { error } = await supabase.from('music_playlist_items').upsert({ playlist_id: playlistId, track_id: trackId, position: 0 }, { onConflict: 'playlist_id,track_id' }); if (error) throw error; onDone(); } catch (err: any) { setError(err?.message || 'No se pudo añadir la canción.'); } }
  async function createAndAdd() { if (!name.trim()) return; setCreating(true); setError(''); try { const { data, error } = await supabase.from('music_playlists').insert({ user_id: session.user.id, name: name.trim(), is_public: true }).select('id').single(); if (error) throw error; await addToPlaylist(data.id); } catch (err: any) { setError(err?.message || 'No se pudo crear la playlist.'); } finally { setCreating(false); } }
  return <div className="music-modal-backdrop" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}><div className="music-modal">
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 16px', borderBottom: `1px solid ${border}` }}><strong style={{ color: text }}>Añadir a playlist</strong><button onClick={onClose} style={{ background: 'transparent', color: muted }}><X size={18} /></button></div>
    <div style={{ padding: 16 }}><div style={{ display: 'flex', gap: 10, marginBottom: 15 }}>{track.cover_url && <img src={track.cover_url} alt="" style={{ width: 52, height: 52, borderRadius: 4, objectFit: 'cover' }} />}<div style={{ minWidth: 0 }}><strong style={{ display: 'block', color: text }}>{track.title}</strong><span style={{ color: muted, fontSize: 12 }}>{track.artist}</span></div></div>
      {loading ? <Loader2 className="spin" size={20} /> : playlists.length === 0 ? <p style={{ color: muted, fontSize: 13 }}>No tienes playlists todavía. Crea una abajo.</p> : playlists.map((playlist) => <button key={playlist.id} onClick={() => addToPlaylist(playlist.id)} style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 10, padding: 10, marginBottom: 7, border: `1px solid ${border}`, borderRadius: 5, color: text, background: '#fff', textAlign: 'left', cursor: 'pointer' }}><ListPlus size={17} color={blue} />{playlist.name}</button>)}
      <div style={{ display: 'flex', gap: 8, marginTop: 14 }}><input value={name} onChange={(e) => setName(e.target.value)} placeholder="Nombre de nueva playlist" style={{ flex: 1, minWidth: 0, height: 38, padding: '0 10px', border: `1px solid ${border}`, borderRadius: 5 }} /><button onClick={createAndAdd} disabled={creating || !name.trim()} style={{ padding: '0 13px', borderRadius: 5, color: '#fff', background: blue, fontWeight: 700 }}>{creating ? <Loader2 className="spin" size={17} /> : <Plus size={17} />}</button></div>
      {error && <p style={{ margin: '10px 0 0', color: '#b52a2a', fontSize: 12 }}>{error}</p>}
    </div>
  </div></div>;
}

function MusicDiscover({ onSearch }: { onSearch: () => void }) {
  const [activities, setActivities] = useState<any[]>([]);
  const player = usePlayerStore();
  useEffect(() => { (async () => { const { data } = await supabase.from('music_activity').select('*, profiles:user_id(username, full_name, avatar_url), music_tracks:track_id(*)').order('created_at', { ascending: false }).limit(12); setActivities(data || []); })(); }, []);
  return <div style={{ display: 'grid', gap: 14 }}><Card><div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10 }}><div><h2 style={{ margin: 0, color: text, fontSize: 21 }}>Descubrir</h2><p style={{ margin: '5px 0 0', color: muted }}>Música compartida recientemente por la comunidad.</p></div><button onClick={onSearch} style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '9px 13px', border: `1px solid ${blue}`, borderRadius: 5, color: blue, background: '#fff', fontWeight: 700 }}><Search size={16} /> Buscar</button></div></Card><Card><h3 style={{ margin: '0 0 10px', color: text }}>Actividad musical reciente</h3>{activities.length === 0 ? <p style={{ color: muted, fontStyle: 'italic' }}>No hay actividad reciente.</p> : activities.map((activity) => { const track = activity.music_tracks; if (!track) return null; const cover = track.cover_url || (track.source_type === 'youtube' && track.youtube_id ? `https://i.ytimg.com/vi/${track.youtube_id}/hqdefault.jpg` : null); return <div className="music-result" key={activity.id}>{cover ? <img className="music-cover" src={cover} alt="" /> : <div className="music-cover" style={{ display: 'grid', placeItems: 'center' }}><Music size={24} color="#aebdca" /></div>}<div style={{ flex: 1, minWidth: 0 }}><strong style={{ color: text }}>{track.title}</strong><div style={{ color: muted, fontSize: 13 }}>{track.artist || 'Artista desconocido'}</div><div style={{ color: '#98a6b4', fontSize: 11, marginTop: 3 }}>{activity.profiles?.full_name || activity.profiles?.username || 'Usuario'} · {relativeTime(activity.created_at)}</div></div><button className="music-action primary" onClick={() => player.playSong({ source_type: track.source_type, video_id: track.youtube_id || undefined, audio_url: track.source_type === 'local' && track.youtube_id ? supabase.storage.from('music-media').getPublicUrl(track.youtube_id).data.publicUrl : undefined, title: track.title, artist: track.artist || '', thumbnail: cover || undefined, id: track.id })}><Play size={16} fill="currentColor" /></button></div>; })}</Card></div>;
}

function MyMusic({ session }: { session: any }) {
  const [tracks, setTracks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const player = usePlayerStore();
  useEffect(() => { (async () => { const { data } = await supabase.from('music_tracks').select('*').eq('user_id', session.user.id).order('created_at', { ascending: false }); setTracks(data || []); setLoading(false); })(); }, [session.user.id]);
  if (loading) return <Card><div style={{ display: 'grid', placeItems: 'center', padding: 40 }}><Loader2 className="spin" size={24} /></div></Card>;
  return <Card><h2 style={{ margin: '0 0 16px', color: text, fontSize: 22 }}>Mi música</h2>{tracks.length === 0 ? <p style={{ color: muted }}>Todavía no has subido canciones.</p> : tracks.map((track) => { const cover = track.cover_url || (track.source_type === 'youtube' && track.youtube_id ? `https://i.ytimg.com/vi/${track.youtube_id}/hqdefault.jpg` : null); return <div className="music-result" key={track.id}>{cover ? <img className="music-cover" src={cover} alt="" /> : <div className="music-cover" style={{ display: 'grid', placeItems: 'center' }}><Music size={24} color="#aebdca" /></div>}<div style={{ flex: 1, minWidth: 0 }}><strong style={{ color: text }}>{track.title}</strong><div style={{ color: muted, fontSize: 13 }}>{track.artist}</div></div><button className="music-action primary" onClick={() => player.playSong({ source_type: track.source_type, video_id: track.youtube_id || undefined, audio_url: track.source_type === 'local' && track.youtube_id ? supabase.storage.from('music-media').getPublicUrl(track.youtube_id).data.publicUrl : undefined, title: track.title, artist: track.artist || '', thumbnail: cover || undefined, id: track.id })}><Play size={16} fill="currentColor" /></button></div>; })}</Card>;
}

function PlaylistsTab({ session }: { session: any }) {
  const [playlists, setPlaylists] = useState<any[]>([]);
  const [name, setName] = useState('');
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState('');
  async function load() { const { data } = await supabase.from('music_playlists').select('*').eq('user_id', session.user.id).order('created_at', { ascending: false }); setPlaylists(data || []); }
  useEffect(() => { load(); }, [session.user.id]);
  async function createPlaylist() { if (!name.trim()) return; setCreating(true); setError(''); const { error: insertError } = await supabase.from('music_playlists').insert({ user_id: session.user.id, name: name.trim(), is_public: true }); if (insertError) setError(insertError.message); else { setName(''); await load(); } setCreating(false); }
  return <Card><div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, marginBottom: 16 }}><h2 style={{ margin: 0, color: text, fontSize: 22 }}>Mis playlists</h2><div style={{ display: 'flex', gap: 7 }}><input value={name} onChange={(e) => setName(e.target.value)} placeholder="Nueva playlist" style={{ width: 180, height: 36, padding: '0 9px', border: `1px solid ${border}`, borderRadius: 5 }} /><button onClick={createPlaylist} disabled={creating || !name.trim()} className="music-action primary"><Plus size={17} /></button></div></div>{error && <p style={{ color: '#b52a2a', fontSize: 13 }}>{error}</p>}{playlists.length === 0 ? <p style={{ color: muted }}>No tienes playlists creadas todavía.</p> : <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(190px,1fr))', gap: 12 }}>{playlists.map((playlist) => <div key={playlist.id} style={{ border: `1px solid ${border}`, borderRadius: 6, overflow: 'hidden', background: '#fff' }}><div style={{ aspectRatio: '1', background: '#edf2f7', display: 'grid', placeItems: 'center' }}>{playlist.cover_url ? <img src={playlist.cover_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <ListPlus size={35} color="#aab9c7" />}</div><div style={{ padding: 11 }}><strong style={{ color: text }}>{playlist.name}</strong><div style={{ color: muted, fontSize: 12, marginTop: 4 }}>{playlist.is_public ? 'Pública' : 'Privada'}</div></div></div>)}</div>}</Card>;
}

function MusicUpload({ session, onDone }: { session: any; onDone: () => void }) {
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState('');
  const [artist, setArtist] = useState('');
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  async function upload(event: React.FormEvent) { event.preventDefault(); if (!file || !title.trim() || !artist.trim()) return; if (!file.type.startsWith('audio/')) return setError('Solo se permiten archivos de audio.'); if (file.size > 20 * 1024 * 1024) return setError('El archivo es demasiado grande. Máximo 20 MB.'); setUploading(true); setError(''); try { const ext = file.name.split('.').pop() || 'mp3'; const path = `${session.user.id}/${uuidv4()}.${ext}`; const { error: uploadError } = await supabase.storage.from('music-media').upload(path, file, { cacheControl: '3600', upsert: false }); if (uploadError) throw uploadError; const { error: dbError } = await supabase.from('music_tracks').insert({ user_id: session.user.id, title: title.trim(), artist: artist.trim(), source_type: 'local', youtube_id: path }); if (dbError) throw dbError; setFile(null); setTitle(''); setArtist(''); onDone(); } catch (err: any) { setError(err?.message || 'No se pudo subir la canción.'); } finally { setUploading(false); } }
  return <Card><h2 style={{ margin: '0 0 16px', color: text, fontSize: 22 }}>Subir canción</h2>{error && <p style={{ color: '#b52a2a', background: '#fff1f1', border: '1px solid #f0caca', padding: 10, borderRadius: 5, fontSize: 13 }}>{error}</p>}<form onSubmit={upload} style={{ display: 'grid', gap: 13, maxWidth: 560 }}><label style={{ color: text, fontWeight: 700, fontSize: 13 }}>Archivo de audio<input type="file" accept="audio/*" onChange={(e) => setFile(e.target.files?.[0] || null)} style={{ display: 'block', width: '100%', marginTop: 6 }} /></label><label style={{ color: text, fontWeight: 700, fontSize: 13 }}>Título<input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Título de la canción" style={{ display: 'block', width: '100%', height: 38, marginTop: 6, padding: '0 10px', border: `1px solid ${border}`, borderRadius: 5 }} /></label><label style={{ color: text, fontWeight: 700, fontSize: 13 }}>Artista<input value={artist} onChange={(e) => setArtist(e.target.value)} placeholder="Artista" style={{ display: 'block', width: '100%', height: 38, marginTop: 6, padding: '0 10px', border: `1px solid ${border}`, borderRadius: 5 }} /></label><button type="submit" disabled={uploading || !file || !title.trim() || !artist.trim()} style={{ width: 150, height: 40, borderRadius: 5, color: '#fff', background: blue, fontWeight: 700 }}>{uploading ? <Loader2 className="spin" size={18} /> : <><UploadCloud size={17} style={{ verticalAlign: 'middle', marginRight: 6 }} />Subir canción</>}</button></form></Card>;
}

function stripHtml(value: string) { return value.replace(/<[^>]*>/g, '').replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&amp;/g, '&'); }
function relativeTime(value: string) { const minutes = Math.max(0, Math.floor((Date.now() - new Date(value).getTime()) / 60000)); if (minutes < 1) return 'ahora'; if (minutes < 60) return `hace ${minutes} min`; const hours = Math.floor(minutes / 60); if (hours < 24) return `hace ${hours} h`; return `hace ${Math.floor(hours / 24)} d`; }
