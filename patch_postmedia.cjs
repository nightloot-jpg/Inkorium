const fs = require('fs');
let code = fs.readFileSync('./src/components_post.tsx', 'utf8');

const importSearch = `import { useState } from 'react';`;
const importReplace = `import { useState } from 'react';\nimport { usePlayerStore } from './lib/store';\nimport { Play, Music } from 'lucide-react';`;
code = code.replace(importSearch, importReplace);

const mediaSearch = `  if (media.type === "youtube_song" || media.type === "youtube_playlist") {
    // Para simplificar, usamos un iframe embebido simple si es YouTube
    const ytId = media.youtube_id;
    if (ytId) {
      return (
        <div className="media-embed youtube-embed">
          <iframe 
            src={\`https://www.youtube.com/embed/\${ytId}\`}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        </div>
      );
    }
  }`;

const mediaReplace = `  if (media.type === "youtube_song" || media.type === "youtube_playlist" || media.type === "local_audio" || media.type === "music_track") {
    const playerState = usePlayerStore.getState();
    return (
      <div className="music-post-card panel" style={{display: 'flex', gap: 12, padding: 12, background: '#f5f7f9', margin: '10px 0', border: '1px solid #e0e5ea', alignItems: 'center'}}>
        <div style={{width: 60, height: 60, flexShrink: 0, background: '#e0e0e0', borderRadius: 4, overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
          {media.thumbnail ? <img src={media.thumbnail} style={{width: '100%', height: '100%', objectFit: 'cover'}}/> : <Music size={24} color="#999"/>}
        </div>
        <div style={{flex: 1, overflow: 'hidden'}}>
          <strong style={{display: 'block', fontSize: '1em', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis'}}>{media.title || 'Canción'}</strong>
          <span style={{fontSize: '0.85em', color: 'var(--text-light)'}}>{media.artist || 'Artista desconocido'}</span>
        </div>
        <button className="primary-button" style={{padding: '6px 12px', flexShrink: 0, display: 'flex', alignItems: 'center', gap: 5}} onClick={() => {
          playerState.playSong({
            source_type: media.type === 'local_audio' ? 'local' : 'youtube',
            video_id: media.youtube_id,
            audio_url: media.audio_url,
            title: media.title || 'Canción',
            artist: media.artist || 'Artista',
            thumbnail: media.thumbnail
          });
        }}>
          <Play size={16}/> Escuchar
        </button>
      </div>
    );
  }`;

code = code.replace(mediaSearch, mediaReplace);
fs.writeFileSync('./src/components_post.tsx', code);
