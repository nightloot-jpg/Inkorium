import React, { useEffect, useRef, useState } from 'react';
import { usePlayerStore } from './lib/store';
import { Play, Pause, SkipBack, SkipForward, X, Maximize2, Minimize2, Volume2, VolumeX, ListMusic } from 'lucide-react';

declare global {
  interface Window {
    YT: any;
    onYouTubeIframeAPIReady: () => void;
  }
}

export function formatTime(seconds: number) {
  if (isNaN(seconds)) return '0:00';
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s < 10 ? '0' : ''}${s}`;
}

export function FloatingMusicPlayer() {
  const playerState = usePlayerStore();
  const playerRef = useRef<any>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const [isReady, setIsReady] = useState(false);
  const [showQueue, setShowQueue] = useState(false);

  useEffect(() => {
    // YT API init
    const initPlayer = () => {
      if (window.YT && window.YT.Player && !playerRef.current) {
        playerRef.current = new window.YT.Player('youtube-player-container', {
          height: '0',
          width: '0',
          playerVars: {
            autoplay: 1,
            controls: 0,
            disablekb: 1,
            fs: 0,
            modestbranding: 1,
            rel: 0
          },
          events: {
            onReady: () => {
              setIsReady(true);
              if (playerState.volume !== undefined) {
                playerRef.current.setVolume(playerState.volume);
              }
            },
            onStateChange: (event: any) => {
              // 1: playing, 2: paused, 0: ended
              if (event.data === 1) {
                playerState.resume();
                playerState.updateProgress(playerRef.current.getCurrentTime(), playerRef.current.getDuration());
              } else if (event.data === 2) {
                playerState.pause();
              } else if (event.data === 0) {
                playerState.next();
              }
            }
          }
        });
      }
    };

    if (window.YT && window.YT.Player) {
      initPlayer();
    } else {
      window.onYouTubeIframeAPIReady = initPlayer;
    }

    const interval = setInterval(() => {
      if (playerRef.current && isReady && playerState.isPlaying) {
        try {
          const currentTime = playerRef.current.getCurrentTime();
          const duration = playerRef.current.getDuration();
          if (currentTime && duration) {
            playerState.updateProgress(currentTime, duration);
          }
        } catch (e) {}
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [isReady]); // We deliberately don't want to re-run this on every state change

  useEffect(() => {
    if (isReady && playerRef.current && playerState.currentSong) {
      const currentVideoId = playerState.currentSong.video_id;
      // Need a way to check if we need to load or just play
      try {
        const videoData = playerRef.current.getVideoData();
        if (videoData && videoData.video_id === currentVideoId) {
          if (playerState.isPlaying) {
             playerRef.current.playVideo();
          } else {
             playerRef.current.pauseVideo();
          }
        } else {
          playerRef.current.loadVideoById(currentVideoId);
        }
      } catch (e) {}
    }
  }, [playerState.currentSong, playerState.isPlaying, isReady]);


  useEffect(() => {
     if (isReady && playerRef.current && playerState.seekRequest !== null) {
         playerRef.current.seekTo(playerState.seekRequest, true);
         playerState.clearSeekRequest();
     }
  }, [playerState.seekRequest, isReady]);

  useEffect(() => {
     if (isReady && playerRef.current) {
         playerRef.current.setVolume(playerState.volume);
     }
  }, [playerState.volume, isReady]);

  // Ensure the YouTube container is always rendered if there's a song, even if the UI is closed
  if (!playerState.isOpen || !playerState.currentSong) {
      return (
          <div id="youtube-player-container" style={{ position: 'absolute', left: '-9999px' }}></div>
      );
  }

  const song = playerState.currentSong;

  if (playerState.isExpanded) {
    return (
      <div className="music-player-expanded">
        <div id="youtube-player-container" style={{ position: 'absolute', left: '-9999px' }}></div>
        <div className="player-expanded-header">
          <button onClick={() => playerState.minimizePlayer()} className="icon-btn" aria-label="Minimizar">
            <Minimize2 size={24} />
          </button>
          <div className="tabs">
              <button className={!showQueue ? "active" : ""} onClick={() => setShowQueue(false)}>Reproduciendo</button>
              {playerState.queue.length > 1 && <button className={showQueue ? "active" : ""} onClick={() => setShowQueue(true)}>Cola ({playerState.queue.length})</button>}
          </div>
          <button onClick={() => playerState.closePlayer()} className="icon-btn" aria-label="Cerrar">
            <X size={24} />
          </button>
        </div>

        {!showQueue ? (
          <div className="player-expanded-content">
            <img src={song.thumbnail || 'https://placehold.co/400x400/233B5D/FFF?text=Music'} alt={song.title} className="cover-large" />

            <div className="info-large">
              <h2>{song.title}</h2>
              <p>{song.channel_title}</p>
              {playerState.currentPlaylist && <span className="playlist-badge">De: {playerState.currentPlaylist.title}</span>}
            </div>

            <div className="progress-container">
              <input
                type="range"
                min="0"
                max={playerState.duration || 100}
                value={playerState.currentTime || 0}
                onChange={(e) => {
                  const t = parseFloat(e.target.value);
                  playerState.seek(t);
                }}
              />
              <div className="time-labels">
                <span>{formatTime(playerState.currentTime)}</span>
                <span>{formatTime(playerState.duration)}</span>
              </div>
            </div>

            <div className="controls-large">
              <button onClick={() => playerState.previous()} disabled={playerState.currentIndex === 0} className="icon-btn">
                <SkipBack size={32} />
              </button>
              <button onClick={() => playerState.isPlaying ? playerState.pause() : playerState.resume()} className="play-btn-large">
                {playerState.isPlaying ? <Pause size={32} fill="currentColor" /> : <Play size={32} fill="currentColor" />}
              </button>
              <button onClick={() => playerState.next()} disabled={playerState.currentIndex >= playerState.queue.length - 1} className="icon-btn">
                <SkipForward size={32} />
              </button>
            </div>

            <div className="volume-control">
               {playerState.volume === 0 ? <VolumeX size={20} /> : <Volume2 size={20} />}
               <input
                 type="range"
                 min="0" max="100"
                 value={playerState.volume}
                 onChange={(e) => playerState.setVolume(parseInt(e.target.value))}
               />
            </div>
          </div>
        ) : (
          <div className="player-expanded-queue">
             {playerState.queue.map((item, idx) => (
                <div key={idx} className={`queue-item ${idx === playerState.currentIndex ? 'active' : ''}`} onClick={() => {
                   playerState.playPlaylist(playerState.currentPlaylist!, playerState.queue, idx);
                }}>
                   <span className="queue-idx">{idx + 1}</span>
                   <div className="queue-info">
                      <span className="title">{item.title}</span>
                      <span className="artist">{item.channel_title}</span>
                   </div>
                   {idx === playerState.currentIndex && playerState.isPlaying && <span className="playing-icon"><Play size={16} fill="currentColor" /></span>}
                </div>
             ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="floating-music-player">
      <div id="youtube-player-container" style={{ position: 'absolute', left: '-9999px' }}></div>
      <div className="player-left" onClick={() => playerState.expandPlayer()}>
        <img src={song.thumbnail || 'https://placehold.co/100x100/233B5D/FFF?text=Music'} alt={song.title} className="cover-small" />
        <div className="info-small">
          <strong>{song.title}</strong>
          <span>{song.channel_title} {playerState.currentPlaylist ? `· ${playerState.currentPlaylist.title}` : ''}</span>
        </div>
      </div>

      <div className="player-center">
        <div className="controls-small">
          <button onClick={() => playerState.previous()} disabled={playerState.currentIndex === 0} className="icon-btn">
            <SkipBack size={20} />
          </button>
          <button onClick={() => playerState.isPlaying ? playerState.pause() : playerState.resume()} className="play-btn-small">
            {playerState.isPlaying ? <Pause size={20} fill="currentColor" /> : <Play size={20} fill="currentColor" />}
          </button>
          <button onClick={() => playerState.next()} disabled={playerState.currentIndex >= playerState.queue.length - 1} className="icon-btn">
            <SkipForward size={20} />
          </button>
        </div>
        <div className="progress-small">
           <span>{formatTime(playerState.currentTime)}</span>
           <input
              type="range"
              min="0"
              max={playerState.duration || 100}
              value={playerState.currentTime || 0}
              onChange={(e) => {
                const t = parseFloat(e.target.value);
                playerState.seek(t);
              }}
            />
            <span>{formatTime(playerState.duration)}</span>
        </div>
      </div>

      <div className="player-right">
        <div className="volume-control-small">
           {playerState.volume === 0 ? <VolumeX size={16} /> : <Volume2 size={16} />}
           <input
             type="range"
             min="0" max="100"
             value={playerState.volume}
             onChange={(e) => playerState.setVolume(parseInt(e.target.value))}
           />
        </div>
        <button onClick={() => playerState.expandPlayer()} className="icon-btn" aria-label="Expandir">
          <Maximize2 size={20} />
        </button>
        <button onClick={() => playerState.closePlayer()} className="icon-btn" aria-label="Cerrar">
          <X size={20} />
        </button>
      </div>
    </div>
  );
}
