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
    if (!window.YT) {
      console.log('[MusicPlayer] YouTube API loaded');
      const tag = document.createElement('script');
      tag.src = "https://www.youtube.com/iframe_api";
      const firstScriptTag = document.getElementsByTagName('script')[0];
      firstScriptTag.parentNode?.insertBefore(tag, firstScriptTag);
    }
  }, []);

  useEffect(() => {
    // YT API init
    const initPlayer = () => {
      if (window.YT && window.YT.Player && !playerRef.current) {
        console.log('[MusicPlayer] Player created');
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
              console.log('[MusicPlayer] Player ready');
              setIsReady(true);
              if (usePlayerStore.getState().volume !== undefined) {
                playerRef.current.setVolume(usePlayerStore.getState().volume);
              }
              // If there's a pending play on ready, trigger it
              if (usePlayerStore.getState().pendingPlay && usePlayerStore.getState().currentSong) {
                const vid = usePlayerStore.getState().currentSong?.video_id;
                console.log('[MusicPlayer] loadVideoById (onReady):', vid);
                playerRef.current.loadVideoById(vid);
              }
            },
            onStateChange: (event: any) => {
              // 1: playing, 2: paused, 0: ended, 3: buffering
              if (event.data === 1) {
                console.log('[MusicPlayer] YouTube state: PLAYING');
                usePlayerStore.getState().setIsPlaying(true);
                usePlayerStore.getState().setPendingPlay(false);
                const current = playerRef.current.getCurrentTime();
                const dur = playerRef.current.getDuration();
                if (current !== undefined && dur !== undefined) usePlayerStore.getState().updateProgress(current, dur);
              } else if (event.data === 2) {
                console.log('[MusicPlayer] YouTube state: PAUSED');
                usePlayerStore.getState().setIsPlaying(false);
              } else if (event.data === 3) {
                console.log('[MusicPlayer] YouTube state: BUFFERING');
              } else if (event.data === 0) {
                console.log('[MusicPlayer] YouTube state: ENDED');
                usePlayerStore.getState().next();
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

    let pollingInterval: any;
    if (isReady) {
      pollingInterval = setInterval(() => {
        if (playerRef.current && typeof playerRef.current.getPlayerState === 'function') {
          try {
            const state = playerRef.current.getPlayerState();
            // 1 === playing
            if (state === 1) {
              const currentTime = playerRef.current.getCurrentTime();
              const duration = playerRef.current.getDuration();
              if (currentTime !== undefined && duration !== undefined) {
                usePlayerStore.getState().updateProgress(currentTime, duration);
              }
            }
          } catch (e) {}
        }
      }, 250);
    }

    return () => {
      if (pollingInterval) clearInterval(pollingInterval);
    };
  }, [isReady]); // We deliberately don't want to re-run this on every state change


  useEffect(() => {
    if (isReady && playerRef.current && playerState.currentSong) {
      const currentVideoId = playerState.currentSong.video_id;

      try {
        const videoData = playerRef.current.getVideoData();
        const state = playerRef.current.getPlayerState();
        const isSameVideo = videoData && videoData.video_id === currentVideoId;

        if (playerState.pendingPlay) {
           console.log('[MusicPlayer] current song:', currentVideoId);
           if (!isSameVideo) {
              console.log('[MusicPlayer] Video ID:', currentVideoId);
              console.log('[MusicPlayer] loadVideoById:', currentVideoId);
              playerRef.current.loadVideoById(currentVideoId);
           } else {
              if (state !== 1) {
                 console.log('[MusicPlayer] playVideo()');
                 playerRef.current.playVideo();
              }
           }
        } else if (!playerState.isPlaying && !playerState.pendingPlay && isSameVideo && state === 1) {
           playerRef.current.pauseVideo();
        }
      } catch (e) {
         console.error('[MusicPlayer] Error interacting with player:', e);
      }
    }
  }, [playerState.currentSong?.video_id, playerState.pendingPlay, playerState.isPlaying, isReady]);



  useEffect(() => {
     if (isReady && playerRef.current && playerState.seekRequest !== null) {
         playerRef.current.seekTo(playerState.seekRequest, true);
         playerState.clearSeekRequest();
     }
  }, [playerState.seekRequest, isReady]);

  useEffect(() => {
     if (isReady && playerRef.current) {
         if (playerState.isMuted) {
             console.log('[MusicPlayer] mute');
             playerRef.current.mute();
             // Some youtube iframe API might need to see volume set to 0 even on mute, but mute is standard
         } else {
             console.log('[MusicPlayer] unMute');
             playerRef.current.unMute();
             console.log('[MusicPlayer] Volume:', playerState.volume);
             console.log('[MusicPlayer] setVolume(' + playerState.volume + ')');
             playerRef.current.setVolume(playerState.volume);
         }
     }
  }, [playerState.volume, playerState.isMuted, isReady]);

    // Create a persistent container for the YouTube iframe that doesn't get unmounted
  // when the player expands or minimizes.
  return (
    <>
      {/* The YouTube iframe container must be entirely static in the DOM to avoid re-creation */}
      <div id="youtube-player-container" style={{ position: 'fixed', left: '-9999px', top: '-9999px', width: '1px', height: '1px' }}></div>

      {playerState.isOpen && playerState.currentSong && (
        playerState.isExpanded ? (
          <div className="music-player-expanded">
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
                <img src={playerState.currentSong.thumbnail || 'https://placehold.co/400x400/233B5D/FFF?text=Music'} alt={playerState.currentSong.title} className="cover-large" />

                <div className="info-large">
                  <h2>{playerState.currentSong.title}</h2>
                  <p>{playerState.currentSong.channel_title}</p>
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
                   <button onClick={() => playerState.toggleMute()} className="icon-btn-vol" style={{background:'none', border:'none', color:'inherit', cursor:'pointer'}}>
                     {playerState.isMuted || playerState.volume === 0 ? <VolumeX size={20} /> : <Volume2 size={20} />}
                   </button>
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
        ) : (
          <div className="floating-music-player">
            <div className="player-left" onClick={() => playerState.expandPlayer()}>
              <img src={playerState.currentSong.thumbnail || 'https://placehold.co/100x100/233B5D/FFF?text=Music'} alt={playerState.currentSong.title} className="cover-small" />
              <div className="info-small">
                <strong>{playerState.currentSong.title}</strong>
                <span>{playerState.currentSong.channel_title} {playerState.currentPlaylist ? `· ${playerState.currentPlaylist.title}` : ''}</span>
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
                 <button onClick={() => playerState.toggleMute()} className="icon-btn-vol" style={{background:'none', border:'none', color:'inherit', cursor:'pointer'}}>
                   {playerState.isMuted || playerState.volume === 0 ? <VolumeX size={16} /> : <Volume2 size={16} />}
                 </button>
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
        )
      )}
    </>
  );
}