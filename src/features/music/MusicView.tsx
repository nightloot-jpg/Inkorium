import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../../lib/supabase';
import { usePlayerStore } from '../../lib/store';
import { Search, Heart, Share2, Plus, Music, Play, ListPlus, Loader2, UploadCloud, X } from 'lucide-react';
import * as tus from "tus-js-client";
import { v4 as uuidv4 } from "uuid";
import { formatTime } from '../../components_player';

export function MusicView({ session, navigate }: { session: any, navigate: any }) {
  const [activeTab, setActiveTab] = useState<'descubrir' | 'buscar' | 'mi-musica' | 'playlists' | 'subir'>('descubrir');
  

  // Responsive column layout styling based on Tuenti/MySpace aesthetics
  return (
    <section className="content-view music-view" style={{ backgroundColor: '#eef2f5', minHeight: '100%', padding: '15px' }}>
      <div className="music-layout" style={{
        display: 'grid',
        gridTemplateColumns: '260px minmax(650px, 1fr) 300px',
        gap: '15px',
        maxWidth: '1200px',
        margin: '0 auto',
        alignItems: 'start'
      }}>
        {/* LEFT SIDEBAR: Navigation */}
        <div className="music-sidebar-left" style={{
          backgroundColor: '#fff',
          borderRadius: '4px',
          border: '1px solid #d3d9df',
          padding: '15px',
          display: 'flex',
          flexDirection: 'column',
          gap: '15px'
        }}>
          <div style={{ paddingBottom: '10px', borderBottom: '1px solid #e0e5ea', marginBottom: '5px' }}>
            <h1 style={{ margin: '0 0 5px 0', fontSize: '1.4em', color: '#0750A7', display: 'flex', alignItems: 'center', gap: 8 }}>
              <Music size={22} /> Música
            </h1>
            <p style={{ margin: 0, fontSize: '0.85em', color: '#666', lineHeight: 1.4 }}>
              Escucha, comparte y descubre música con tus amigos.
            </p>
          </div>

          <nav style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
            {[
              ['descubrir', 'Descubrir', <Heart size={16} />],
              ['buscar', 'Buscar', <Search size={16} />],
              ['mi-musica', 'Mi música', <Music size={16} />],
              ['playlists', 'Playlists', <ListPlus size={16} />],
              ['subir', 'Subir canción', <UploadCloud size={16} />]
            ].map(([id, label, icon]) => (
              <button
                key={id as string}
                onClick={() => setActiveTab(id as any)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  background: activeTab === id ? '#0750A7' : 'transparent',
                  color: activeTab === id ? '#fff' : '#333',
                  border: '1px solid',
                  borderColor: activeTab === id ? '#0750A7' : 'transparent',
                  padding: '8px 12px',
                  borderRadius: '3px',
                  cursor: 'pointer',
                  fontWeight: activeTab === id ? 'bold' : 'normal',
                  fontSize: '0.9em',
                  textAlign: 'left',
                  transition: 'all 0.1s'
                }}
                onMouseEnter={(e) => {
                  if (activeTab !== id) e.currentTarget.style.backgroundColor = '#f0f4f8';
                }}
                onMouseLeave={(e) => {
                  if (activeTab !== id) e.currentTarget.style.backgroundColor = 'transparent';
                }}
              >
                {icon} {label}
              </button>
            ))}
          </nav>
        </div>

        {/* CENTER: Main Content */}
        <div className="music-main-content" style={{ display: 'flex', flexDirection: 'column', gap: '15px', minWidth: 0 }}>

          <div style={{ backgroundColor: '#fff', borderRadius: '4px', border: '1px solid #d3d9df', padding: '15px' }}>
        {activeTab === 'buscar' && <MusicSearch />}
        {activeTab === 'subir' && <MusicUpload session={session} onDone={() => setActiveTab('mi-musica')} />}
        {activeTab === 'descubrir' && <MusicDiscover session={session} />}
        {activeTab === 'mi-musica' && <MyMusic session={session} />}
        {activeTab === 'playlists' && <PlaylistsTab session={session} />}
      </div>
        </div>
        {/* RIGHT SIDEBAR: Activity & Friends' Playlists */}
        <div className="music-sidebar-right" style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
          <div style={{ backgroundColor: '#fff', borderRadius: '4px', border: '1px solid #d3d9df', padding: '15px' }}>
            <h3 style={{ margin: '0 0 10px 0', fontSize: '0.9em', color: '#0750A7', textTransform: 'uppercase', fontWeight: 'bold' }}>Actividad musical</h3>
            <MusicActivitySidebar />
          </div>
          <div style={{ backgroundColor: '#fff', borderRadius: '4px', border: '1px solid #d3d9df', padding: '15px' }}>
            <h3 style={{ margin: '0 0 10px 0', fontSize: '0.9em', color: '#0750A7', textTransform: 'uppercase', fontWeight: 'bold' }}>Playlists de amigos</h3>
            <FriendsPlaylistsSidebar />
          </div>
        </div>
      </div>
    </section>
  );
}


function MusicActivitySidebar() {
  const [activities, setActivities] = useState<any[]>([]);

  useEffect(() => {
    async function fetchActivity() {
      const { data } = await supabase
        .from('music_activity')
        .select('*, profiles:user_id(username, full_name, avatar_url), music_tracks:track_id(*)')
        .order('created_at', { ascending: false })
        .limit(8);
      if(data) setActivities(data);
    }
    fetchActivity();
  }, []);

  if (activities.length === 0) return <p style={{color: '#666', fontSize: '0.85em', fontStyle: 'italic'}}>No hay actividad reciente.</p>;

  return (
    <div style={{display: 'flex', flexDirection: 'column', gap: 12}}>
      {activities.map(act => (
        <div key={act.id} style={{display: 'flex', gap: 10, fontSize: '0.85em', alignItems: 'flex-start'}}>
          <img src={act.profiles?.avatar_url || '/default-avatar.png'} style={{width: 32, height: 32, borderRadius: '50%'}}/>
          <div>
            <strong style={{color: '#1a202c'}}>{act.profiles?.full_name || act.profiles?.username}</strong>
            <span style={{color: '#4a5568'}}>
              {act.action === 'listened' ? ' escuchó ' :
               act.action === 'shared' ? ' compartió ' :
               act.action === 'saved' ? ' guardó ' :
               act.action === 'playlist_created' ? ' creó una playlist ' : ' '}
            </span>
            <strong style={{color: '#1a202c'}}>{act.music_tracks?.title}</strong>
            <div style={{color: '#a0aec0', fontSize: '0.9em', marginTop: 2}}>
              {new Date(act.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function FriendsPlaylistsSidebar() {
  const [playlists, setPlaylists] = useState<any[]>([]);

  useEffect(() => {
    async function fetchPlaylists() {
      const { data } = await supabase
        .from('music_playlists')
        .select('*, profiles:user_id(username, full_name)')
        .eq('is_public', true)
        .order('created_at', { ascending: false })
        .limit(5);
      if(data) setPlaylists(data);
    }
    fetchPlaylists();
  }, []);

  if (playlists.length === 0) return <p style={{color: '#666', fontSize: '0.85em', fontStyle: 'italic'}}>No hay playlists públicas.</p>;

  return (
    <div style={{display: 'flex', flexDirection: 'column', gap: 10}}>
      {playlists.map(pl => (
        <div key={pl.id} style={{display: 'flex', gap: 10, alignItems: 'center', backgroundColor: '#fafafa', padding: 8, borderRadius: 4, border: '1px solid #edf2f7'}}>
          <div style={{width: 40, height: 40, backgroundColor: '#e2e8f0', borderRadius: 2, display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
            {pl.cover_url ? <img src={pl.cover_url} style={{width: '100%', height: '100%', objectFit: 'cover'}}/> : <ListPlus size={16} color="#718096"/>}
          </div>
          <div style={{flex: 1, minWidth: 0}}>
            <strong style={{display: 'block', fontSize: '0.85em', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', color: '#1a202c'}}>{pl.name}</strong>
            <span style={{fontSize: '0.75em', color: '#718096'}}>Por {pl.profiles?.full_name || pl.profiles?.username}</span>
          </div>
        </div>
      ))}
    </div>
  );
}

function MusicSearch() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<any[]>([]);
  const [searching, setSearching] = useState(false);
  const playerState = usePlayerStore();

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    if(!query.trim()) return;
    setSearching(true);
    try {
      const res = await fetch(`https://www.googleapis.com/youtube/v3/search?part=snippet&q=${encodeURIComponent(query)}&type=video&maxResults=15&key=${import.meta.env.VITE_YOUTUBE_API_KEY}`);
      const data = await res.json();
      setResults(data.items || []);
    } catch(e) {
      console.error(e);
    } finally {
      setSearching(false);
    }
  }

  return (
    <div>
      <h3 style={{margin: '0 0 15px 0', color: '#0750A7', fontSize: '1.2em'}}>Buscar Música</h3>
      <form onSubmit={handleSearch} style={{display: 'flex', gap: 10, marginBottom: 20}}>
        <div style={{position: 'relative', flex: 1}}>
          <Search size={18} color="#999" style={{position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)'}}/>
          <input
            type="text"
            placeholder="Buscar canciones en YouTube..."
            value={query}
            onChange={e => setQuery(e.target.value)}
            style={{width: '100%', padding: '10px 10px 10px 35px', border: '1px solid #d3d9df', borderRadius: 4, outline: 'none', fontSize: '0.95em', boxSizing: 'border-box'}}
          />
        </div>
        <button type="submit" disabled={searching} style={{backgroundColor: '#0750A7', color: '#fff', border: 'none', padding: '0 20px', borderRadius: 4, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8, fontWeight: 'bold'}}>
          {searching ? <Loader2 className="spin" size={16}/> : 'Buscar'}
        </button>
      </form>
      
      <div style={{display: 'flex', flexDirection: 'column', gap: 10}}>
        {results.map(item => (
          <div key={item.id.videoId} style={{display: 'flex', alignItems: 'center', gap: 15, padding: 10, border: '1px solid #e0e5ea', borderRadius: 4, backgroundColor: '#fafafa', transition: 'background 0.2s'}}
               onMouseEnter={e => e.currentTarget.style.backgroundColor = '#f0f4f8'}
               onMouseLeave={e => e.currentTarget.style.backgroundColor = '#fafafa'}>
            <div style={{width: 60, height: 45, borderRadius: 2, overflow: 'hidden', position: 'relative'}}>
              <img src={item.snippet.thumbnails?.default?.url} style={{width: '100%', height: '100%', objectFit: 'cover'}} />
            </div>

            <div style={{flex: 1, minWidth: 0}}>
              <strong style={{display: 'block', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden', color: '#1a202c'}}>{item.snippet.title}</strong>
              <span style={{fontSize: '0.85em', color: '#718096'}}>{item.snippet.channelTitle}</span>
            </div>

            <div style={{display: 'flex', gap: 8}}>
              <button
                onClick={() => {
                  playerState.playSong({
                    source_type: 'youtube',
                    video_id: item.id.videoId,
                    title: item.snippet.title,
                    artist: item.snippet.channelTitle,
                    thumbnail: item.snippet.thumbnails?.default?.url
                  });
                }}
                style={{background: '#0750A7', color: '#fff', border: 'none', padding: '6px', borderRadius: 4, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center'}}
                title="Escuchar"
              >
                <Play size={16}/>
              </button>

              <button style={{background: '#fff', border: '1px solid #cbd5e0', padding: '6px', borderRadius: 4, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#4a5568'}} title="Guardar a Mis Canciones">
                <Heart size={16}/>
              </button>

              <button style={{background: '#fff', border: '1px solid #cbd5e0', padding: '6px', borderRadius: 4, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#4a5568'}} title="Añadir a Playlist">
                <Plus size={16}/>
              </button>

              <button style={{background: '#fff', border: '1px solid #cbd5e0', padding: '6px', borderRadius: 4, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#4a5568'}} title="Compartir">
                <Share2 size={16}/>
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function MusicUpload({ session, onDone }: { session: any, onDone: () => void }) {
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState("");
  const [artist, setArtist] = useState("");
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState("");

  async function handleUpload(e: React.FormEvent) {
    e.preventDefault();
    if(!file || !title || !artist) return;
    if(!file.type.startsWith('audio/')) {
      setError("Solo se permiten archivos de audio.");
      return;
    }
    if(file.size > 20 * 1024 * 1024) {
      setError("El archivo es muy grande (máx 20MB).");
      return;
    }
    
    setUploading(true);
    setError("");
    const ext = file.name.split('.').pop();
    const fileName = `${session.user.id}/${uuidv4()}.${ext}`;
    
    const { data: uploadData, error: uploadError } = await supabase.storage.from('music-media').upload(fileName, file, {
      cacheControl: '3600',
      upsert: false
    });
    
    if(uploadError) {
      console.error(uploadError);
      setError("Error al subir el archivo.");
      setUploading(false);
      return;
    }
    
    // Save to database
    const { error: dbError } = await supabase.from('music_tracks').insert({
      title,
      artist,
      source_type: 'local',
      youtube_id: fileName, // Using this field for the storage path
      user_id: session.user.id
    });
    
    if(dbError) {
      console.error(dbError);
      setError("Error al guardar la canción.");
      setUploading(false);
      return;
    }
    
    setUploading(false);
    onDone();
  }

  return (
    <div>
      <h3 style={{margin: '0 0 15px 0', color: '#0750A7', fontSize: '1.2em'}}>Subir Canción</h3>
      <div style={{backgroundColor: '#fafafa', border: '1px solid #e0e5ea', borderRadius: 4, padding: '20px', maxWidth: 500, margin: '0 auto'}}>
        {error && <div style={{backgroundColor: '#ffebee', color: '#c62828', padding: 10, borderRadius: 4, marginBottom: 15, fontSize: '0.9em'}}>{error}</div>}

        <form onSubmit={handleUpload} style={{display: 'flex', flexDirection: 'column', gap: 15}}>
          <div>
            <label style={{display: 'block', marginBottom: 5, fontSize: '0.9em', fontWeight: 'bold', color: '#333'}}>Archivo de audio (MP3, WAV, M4A, OGG)</label>
            <input
              type="file"
              accept="audio/*"
              onChange={e => setFile(e.target.files?.[0] || null)}
              style={{width: '100%', padding: 8, border: '1px solid #d3d9df', borderRadius: 4, backgroundColor: '#fff', boxSizing: 'border-box'}}
            />
          </div>

          <div>
            <label style={{display: 'block', marginBottom: 5, fontSize: '0.9em', fontWeight: 'bold', color: '#333'}}>Título</label>
            <input
              type="text"
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="Ej: La Incondicional"
              style={{width: '100%', padding: 8, border: '1px solid #d3d9df', borderRadius: 4, outline: 'none', boxSizing: 'border-box'}}
            />
          </div>

          <div>
            <label style={{display: 'block', marginBottom: 5, fontSize: '0.9em', fontWeight: 'bold', color: '#333'}}>Artista</label>
            <input
              type="text"
              value={artist}
              onChange={e => setArtist(e.target.value)}
              placeholder="Ej: Luis Miguel"
              style={{width: '100%', padding: 8, border: '1px solid #d3d9df', borderRadius: 4, outline: 'none', boxSizing: 'border-box'}}
            />
          </div>

          <button
            type="submit"
            disabled={uploading || !file || !title || !artist}
            style={{
              backgroundColor: '#0750A7',
              color: '#fff',
              border: 'none',
              padding: '10px',
              borderRadius: 4,
              cursor: (uploading || !file || !title || !artist) ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              fontWeight: 'bold',
              opacity: (uploading || !file || !title || !artist) ? 0.7 : 1,
              marginTop: 10
            }}
          >
            {uploading ? <><Loader2 className="spin" size={18}/> Subiendo...</> : <><UploadCloud size={18}/> Subir canción</>}
          </button>
        </form>
      </div>
    </div>
  );
}

function MusicDiscover({ session }: { session: any }) {
  const [listeningNow, setListeningNow] = useState<any[]>([]);
  const [recentlyShared, setRecentlyShared] = useState<any[]>([]);
  const [songOfDay, setSongOfDay] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const playerState = usePlayerStore();

  useEffect(() => {
    async function load() {
      setLoading(true);

      // 1. TUS AMIGOS ESTÁN ESCUCHANDO (Recent 'listened' activity)
      // Group by user to get only their latest track. We'll do this client-side for simplicity.
      const { data: activityData } = await supabase
        .from('music_activity')
        .select('*, profiles:user_id(id, username, full_name, avatar_url), music_tracks:track_id(*)')
        .eq('action', 'listened')
        .order('created_at', { ascending: false })
        .limit(50);

      if (activityData) {
        const uniqueUsers = new Map();
        for (const item of activityData) {
          if (!uniqueUsers.has(item.user_id) && item.music_tracks) {
            // Only consider it "listening now" if it was in the last hour maybe?
            // Actually instructions say "recent activity, no algorithm". Let's just take the latest.
            uniqueUsers.set(item.user_id, item);
          }
          if (uniqueUsers.size >= 10) break; // limit to 10 unique friends
        }
        setListeningNow(Array.from(uniqueUsers.values()));
      }

      // 2. MÚSICA COMPARTIDA RECIENTEMENTE (Posts with music + shared activity)
      // We will fetch music posts and explicit shares, combine and sort.
      const { data: postsData } = await supabase
        .from('posts')
        .select('*, profiles:user_id(username, full_name, avatar_url), music_tracks:music_track_id(*)')
        .not('music_track_id', 'is', null)
        .order('created_at', { ascending: false })
        .limit(10);

      const { data: sharedData } = await supabase
        .from('music_activity')
        .select('*, profiles:user_id(username, full_name, avatar_url), music_tracks:track_id(*)')
        .eq('action', 'shared')
        .order('created_at', { ascending: false })
        .limit(10);

      const combined: any[] = [];
      if (postsData) {
        postsData.forEach(p => combined.push({
           type: 'post',
           id: p.id,
           created_at: p.created_at,
           user: p.profiles,
           track: p.music_tracks
        }));
      }
      if (sharedData) {
        sharedData.forEach(s => combined.push({
           type: 'shared',
           id: s.id,
           created_at: s.created_at,
           user: s.profiles,
           track: s.music_tracks
        }));
      }

      combined.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      setRecentlyShared(combined.slice(0, 15));

      // 3. CANCIÓN DEL DÍA
      // Song of the day of the current user, or maybe global?
      // "La canción debe estar conectada con ProfileView. Si el usuario cambia su Canción del Día desde Música, debe cambiar también en su Perfil."
      // So we fetch current user's song of the day.
      const { data: sodData } = await supabase
        .from('profile_song_of_day')
        .select('*, music_tracks(*)')
        .eq('user_id', session.user.id)
        .maybeSingle();

      if (sodData && sodData.music_tracks) {
        setSongOfDay(sodData.music_tracks);
      }

      setLoading(false);
    }
    load();
  }, [session.user.id]);

  const handlePlayTrack = (track: any) => {
    const song = {
      source_type: track.source_type,
      video_id: track.youtube_id,
      audio_url: track.source_type === 'local' ? supabase.storage.from('music-media').getPublicUrl(track.youtube_id).data.publicUrl : undefined,
      title: track.title,
      artist: track.artist,
      thumbnail: track.cover_url,
      duration: track.duration?.toString(),
      id: track.id
    };
    playerState.playSong(song as any);
  };

  const handleChangeSongOfDay = async () => {
     // A modal or prompt to change song of day. For now let's just alert since we need a picker.
     // In a full implementation, this could open a modal with search/my music.
     alert("Para cambiar la canción del día, ve a Mi Música o Buscar, y selecciona 'Establecer como canción del día' en las opciones de la canción.");
  };

  if(loading) return <div style={{textAlign: 'center', padding: 40}}><Loader2 className="spin" size={24} /></div>;

  return (
    <div style={{display: 'flex', flexDirection: 'column', gap: 25}}>
      {/* 1. TUS AMIGOS ESTÁN ESCUCHANDO */}
      <div>
        <h3 style={{margin: '0 0 10px 0', color: '#0750A7', fontSize: '1.1em', display: 'flex', alignItems: 'center', gap: 6}}>
          <Heart size={18}/> Tus amigos están escuchando
        </h3>
        {listeningNow.length === 0 ? (
          <p style={{color: '#666', fontSize: '0.9em', fontStyle: 'italic'}}>Nadie está escuchando música ahora mismo.</p>
        ) : (
          <div style={{display: 'flex', gap: 15, overflowX: 'auto', paddingBottom: 10}}>
            {listeningNow.map((item) => (
              <div key={item.id} style={{
                minWidth: 160,
                maxWidth: 160,
                backgroundColor: '#fff',
                border: '1px solid #e0e5ea',
                borderRadius: 6,
                padding: 12,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                textAlign: 'center',
                position: 'relative'
              }}>
                <img src={item.profiles?.avatar_url || '/default-avatar.png'} style={{width: 48, height: 48, borderRadius: '50%', marginBottom: 8}}/>
                <strong style={{fontSize: '0.9em', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', width: '100%'}}>
                  {item.profiles?.full_name || item.profiles?.username}
                </strong>
                <span style={{fontSize: '0.8em', color: '#666', marginBottom: 10}}>Está escuchando</span>

                <div style={{position: 'relative', width: 80, height: 80, marginBottom: 8, borderRadius: 4, overflow: 'hidden', backgroundColor: '#eee', display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
                   {item.music_tracks.cover_url ?
                     <img src={item.music_tracks.cover_url} style={{width: '100%', height: '100%', objectFit: 'cover'}}/> :
                     <Music size={24} color="#999"/>}

                   <button
                     onClick={() => handlePlayTrack(item.music_tracks)}
                     style={{
                       position: 'absolute',
                       background: 'rgba(7, 80, 167, 0.8)',
                       color: '#fff',
                       border: 'none',
                       borderRadius: '50%',
                       width: 36, height: 36,
                       display: 'flex', alignItems: 'center', justifyContent: 'center',
                       cursor: 'pointer'
                     }}>
                     <Play size={18} fill="#fff" style={{marginLeft: 2}}/>
                   </button>
                </div>
                <strong style={{fontSize: '0.85em', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', width: '100%'}}>{item.music_tracks.title}</strong>
                <span style={{fontSize: '0.8em', color: '#666', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', width: '100%'}}>{item.music_tracks.artist}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 2. MÚSICA COMPARTIDA RECIENTEMENTE (Full Width) */}
      <div>
        <h3 style={{margin: '0 0 10px 0', color: '#0750A7', fontSize: '1.1em', display: 'flex', alignItems: 'center', gap: 6}}>
          <Share2 size={18}/> Música compartida recientemente
        </h3>
        {recentlyShared.length === 0 ? (
          <p style={{color: '#666', fontSize: '0.9em', fontStyle: 'italic'}}>No hay música compartida recientemente.</p>
        ) : (
          <div style={{display: 'flex', flexDirection: 'column', gap: 10}}>
            {recentlyShared.map(item => (
              <div key={item.id} style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                backgroundColor: '#fff',
                border: '1px solid #e0e5ea',
                borderRadius: 4,
                padding: 12
              }}>
                <div style={{display: 'flex', alignItems: 'center', gap: 15, flex: 1, minWidth: 0}}>
                  <img src={item.user?.avatar_url || '/default-avatar.png'} style={{width: 36, height: 36, borderRadius: '50%'}}/>

                  <div style={{width: 48, height: 48, backgroundColor: '#e2e8f0', borderRadius: 4, display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', flexShrink: 0}}>
                    {item.track.cover_url ? <img src={item.track.cover_url} style={{width: '100%', height: '100%', objectFit: 'cover'}}/> : <Music size={20} color="#a0aec0"/>}
                  </div>

                  <div style={{flex: 1, minWidth: 0}}>
                    <strong style={{display: 'block', fontSize: '0.95em', color: '#1a202c', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis'}}>{item.track.title}</strong>
                    <span style={{fontSize: '0.85em', color: '#718096', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', display: 'block'}}>{item.track.artist}</span>
                  </div>

                  <div style={{fontSize: '0.85em', color: '#666', display: 'flex', flexDirection: 'column', alignItems: 'flex-end', minWidth: 120, flexShrink: 0}}>
                    <span>{item.user?.full_name || item.user?.username}</span>
                    <span style={{fontSize: '0.9em', color: '#999'}}>hace {Math.round((Date.now() - new Date(item.created_at).getTime()) / 60000)} min</span>
                  </div>
                </div>

                <div style={{display: 'flex', gap: 8, marginLeft: 15}}>
                  <button onClick={() => handlePlayTrack(item.track)} style={{background: 'transparent', border: '1px solid #cbd5e0', padding: '6px', borderRadius: 4, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#4a5568'}}>
                    <Play size={16}/>
                  </button>
                  <button style={{background: 'transparent', border: '1px solid #cbd5e0', padding: '6px', borderRadius: 4, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#4a5568'}}>
                    <Heart size={16}/>
                  </button>
                  <button style={{background: 'transparent', border: '1px solid #cbd5e0', padding: '6px', borderRadius: 4, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#4a5568'}}>
                    <Share2 size={16}/>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 3. BLOQUE INFERIOR HORIZONTAL */}
      <div style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 20}}>
        {/* CANCIÓN DEL DÍA */}
        <div style={{ backgroundColor: '#fff', border: '1px solid #e0e5ea', borderRadius: 4, padding: 15, display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
          <h3 style={{margin: '0 0 10px 0', color: '#0750A7', fontSize: '1em'}}>Canción del día</h3>
          <div style={{width: 80, height: 80, backgroundColor: '#edf2f7', borderRadius: 4, marginBottom: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', position: 'relative'}}>
            {songOfDay?.cover_url ?
              <img src={songOfDay.cover_url} style={{width: '100%', height: '100%', objectFit: 'cover'}}/> :
              <Music size={30} color="#cbd5e0"/>}

            {songOfDay && (
              <button onClick={() => handlePlayTrack(songOfDay)} style={{position: 'absolute', background: 'rgba(7, 80, 167, 0.9)', color: '#fff', border: 'none', borderRadius: '50%', width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer'}}>
                <Play size={16} fill="#fff" style={{marginLeft: 2}}/>
              </button>
            )}
          </div>

          {songOfDay ? (
            <>
              <strong style={{fontSize: '0.9em', marginBottom: 2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', width: '100%'}}>{songOfDay.title}</strong>
              <span style={{fontSize: '0.8em', color: '#666', marginBottom: 10, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', width: '100%'}}>{songOfDay.artist}</span>
            </>
          ) : (
            <p style={{fontSize: '0.8em', color: '#666', marginBottom: 10}}>No has elegido tu canción.</p>
          )}

          <button onClick={handleChangeSongOfDay} style={{background: 'transparent', border: '1px solid #0750A7', color: '#0750A7', padding: '4px 10px', borderRadius: 4, cursor: 'pointer', fontSize: '0.8em', width: '100%'}}>
            Cambiar
          </button>
        </div>

        {/* ACCESOS RÁPIDOS */}
        <div style={{ backgroundColor: '#fff', border: '1px solid #e0e5ea', borderRadius: 4, padding: 15, display: 'flex', flexDirection: 'column' }}>
          <h3 style={{margin: '0 0 10px 0', color: '#0750A7', fontSize: '1em'}}>Mis accesos rápidos</h3>
          <div style={{display: 'flex', flexDirection: 'column', gap: 8, flex: 1, justifyContent: 'center'}}>
            <button style={{background: '#f0f4f8', border: '1px solid #d3d9df', padding: 8, borderRadius: 4, cursor: 'pointer', textAlign: 'left', display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.9em'}}>
              <Heart size={16} color="#0750A7"/> Mis Favoritas
            </button>
            <button style={{background: '#f0f4f8', border: '1px solid #d3d9df', padding: 8, borderRadius: 4, cursor: 'pointer', textAlign: 'left', display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.9em'}}>
              <ListPlus size={16} color="#0750A7"/> Crear nueva playlist
            </button>
            <button style={{background: '#f0f4f8', border: '1px solid #d3d9df', padding: 8, borderRadius: 4, cursor: 'pointer', textAlign: 'left', display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.9em'}}>
              <UploadCloud size={16} color="#0750A7"/> Subir canción
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function MyMusic({ session }: { session: any }) {
  const [tracks, setTracks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const playerState = usePlayerStore();

  useEffect(() => {
    async function load() {
      // In a real app we'd fetch favorites, saved, history.
      // For now let's just fetch user's uploaded tracks to show something.
      const { data } = await supabase.from('music_tracks').select('*').eq('user_id', session.user.id).order('created_at', {ascending: false});
      if(data) setTracks(data);
      setLoading(false);
    }
    load();
  }, [session.user.id]);

  if(loading) return <div style={{textAlign: 'center', padding: 40}}><Loader2 className="spin" size={24}/></div>;

  return (
    <div>
      <h3 style={{margin: '0 0 15px 0', color: '#0750A7', fontSize: '1.2em'}}>Mi Música</h3>

      <div style={{display: 'flex', gap: 15, marginBottom: 25}}>
        <div style={{flex: 1, backgroundColor: '#f0f4f8', border: '1px solid #d3d9df', borderRadius: 4, padding: 15, display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer'}}>
          <div style={{width: 40, height: 40, backgroundColor: '#0750A7', color: '#fff', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
            <Heart size={20} fill="#fff"/>
          </div>
          <div>
            <strong style={{display: 'block', fontSize: '0.95em'}}>Favoritas</strong>
            <span style={{fontSize: '0.85em', color: '#666'}}>12 canciones</span>
          </div>
        </div>

        <div style={{flex: 1, backgroundColor: '#f0f4f8', border: '1px solid #d3d9df', borderRadius: 4, padding: 15, display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer'}}>
          <div style={{width: 40, height: 40, backgroundColor: '#0750A7', color: '#fff', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
            <Music size={20}/>
          </div>
          <div>
            <strong style={{display: 'block', fontSize: '0.95em'}}>Mis subidas</strong>
            <span style={{fontSize: '0.85em', color: '#666'}}>{tracks.length} canciones</span>
          </div>
        </div>
      </div>

      <h4 style={{margin: '0 0 10px 0', fontSize: '1em', color: '#333'}}>Mis canciones subidas</h4>
      {tracks.length === 0 ? (
        <p style={{color: '#666', fontSize: '0.9em', fontStyle: 'italic'}}>No has subido ninguna canción todavía.</p>
      ) : (
        <div style={{display: 'flex', flexDirection: 'column', gap: 8}}>
          {tracks.map(t => (
            <div key={t.id} style={{display: 'flex', alignItems: 'center', gap: 12, padding: 8, border: '1px solid #e0e5ea', borderRadius: 4, backgroundColor: '#fff'}}>
              <div style={{width: 40, height: 40, backgroundColor: '#edf2f7', borderRadius: 2, display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
                {t.cover_url ? <img src={t.cover_url} style={{width: '100%', height: '100%', objectFit: 'cover'}}/> : <Music size={16} color="#a0aec0"/>}
              </div>
              <div style={{flex: 1, minWidth: 0}}>
                <strong style={{display: 'block', fontSize: '0.9em', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden'}}>{t.title}</strong>
                <span style={{fontSize: '0.8em', color: '#718096'}}>{t.artist}</span>
              </div>
              <button
                onClick={() => {
                  playerState.playSong({
                    source_type: 'local',
                    video_id: t.youtube_id,
                    audio_url: supabase.storage.from('music-media').getPublicUrl(t.youtube_id).data.publicUrl,
                    title: t.title,
                    artist: t.artist,
                    id: t.id
                  });
                }}
                style={{background: '#0750A7', color: '#fff', border: 'none', padding: '6px', borderRadius: 4, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center'}}
              >
                <Play size={14}/>
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function PlaylistsTab({ session }: { session: any }) {
  const [playlists, setPlaylists] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const { data } = await supabase.from('music_playlists').select('*').eq('user_id', session.user.id).order('created_at', {ascending: false});
      if(data) setPlaylists(data);
      setLoading(false);
    }
    load();
  }, [session.user.id]);

  if(loading) return <div style={{textAlign: 'center', padding: 40}}><Loader2 className="spin" size={24}/></div>;

  return (
    <div>
      <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20}}>
        <h3 style={{margin: 0, color: '#0750A7', fontSize: '1.2em'}}>Mis Playlists</h3>
        <button style={{backgroundColor: '#0750A7', color: '#fff', border: 'none', padding: '6px 12px', borderRadius: 4, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, fontWeight: 'bold', fontSize: '0.85em'}}>
          <Plus size={16}/> Crear playlist
        </button>
      </div>

      {playlists.length === 0 ? (
        <div style={{textAlign: 'center', padding: '30px 15px', backgroundColor: '#fafafa', border: '1px solid #e0e5ea', borderRadius: 4}}>
          <ListPlus size={32} color="#a0aec0" style={{marginBottom: 10}}/>
          <p style={{color: '#666', fontSize: '0.9em', margin: 0}}>No tienes playlists creadas todavía.</p>
        </div>
      ) : (
        <div style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 15}}>
          {playlists.map(pl => (
            <div key={pl.id} style={{
              backgroundColor: '#fff',
              border: '1px solid #e0e5ea',
              borderRadius: 4,
              overflow: 'hidden',
              cursor: 'pointer',
              transition: 'transform 0.1s, box-shadow 0.1s'
            }}
            onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 4px 6px rgba(0,0,0,0.05)'; }}
            onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = 'none'; }}
            >
              <div style={{width: '100%', aspectRatio: '1/1', backgroundColor: '#edf2f7', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative'}}>
                {pl.cover_url ? <img src={pl.cover_url} style={{width: '100%', height: '100%', objectFit: 'cover'}}/> : <ListPlus size={32} color="#a0aec0"/>}
                <div className="play-overlay" style={{position: 'absolute', inset: 0, backgroundColor: 'rgba(0,0,0,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: 0, transition: 'opacity 0.2s'}}>
                  <button style={{background: '#0750A7', color: '#fff', border: 'none', borderRadius: '50%', width: 40, height: 40, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer'}}>
                    <Play size={20} fill="#fff" style={{marginLeft: 2}}/>
                  </button>
                </div>
              </div>
              <div style={{padding: '12px'}}>
                <strong style={{display: 'block', fontSize: '0.95em', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', marginBottom: 4}}>{pl.name}</strong>
                <span style={{fontSize: '0.8em', color: '#718096'}}>{pl.is_public ? 'Pública' : 'Privada'}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
