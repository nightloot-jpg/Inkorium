import re

with open('src/features/music/MusicView.tsx', 'r') as f:
    content = f.read()

# We need to change the grid inside MusicDiscover
# Currently it's `<div style={{display: 'grid', gridTemplateColumns: '1fr 250px', gap: 20}}>` around section 2 and 3.
# Let's remove that grid and put "Canción del día" in a new bottom grid.

# Rebuilding the render part of MusicDiscover
old_render_pattern = r"  return \(\n    <div style=\{\{display: 'flex', flexDirection: 'column', gap: 20\}\}>\n      \{\/\* 1\. TUS AMIGOS ESTÁN ESCUCHANDO \*\/\}.*?    </div>\n  \);\n\}"

new_render = """  return (
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
}"""

match = re.search(old_render_pattern, content, re.DOTALL)
if match:
    content = content[:match.start()] + new_render + content[match.end():]
    with open('src/features/music/MusicView.tsx', 'w') as f:
        f.write(content)
    print("Rewrote MusicDiscover layout.")
else:
    print("Pattern not found for MusicDiscover render.")
