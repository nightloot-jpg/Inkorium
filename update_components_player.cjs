const fs = require('fs');
let code = fs.readFileSync('./src/components_player.tsx', 'utf8');

// We need to add an audio ref and audio state
code = code.replace(
  "  const containerRef = useRef<HTMLDivElement>(null);",
  "  const containerRef = useRef<HTMLDivElement>(null);\n  const audioRef = useRef<HTMLAudioElement>(null);"
);

// In play effect
const playEffectSearch = `          events: {
            onReady: () => {
              console.log('[MusicPlayer] Player ready');
              setIsReady(true);
              if (usePlayerStore.getState().volume !== undefined) {
                playerRef.current.setVolume(usePlayerStore.getState().volume);
              }
              // Check if there was a pending play before ready
              if (usePlayerStore.getState().pendingPlay && usePlayerStore.getState().currentSong) {
                const vid = usePlayerStore.getState().currentSong?.video_id;
                if (vid) playerRef.current.loadVideoById(vid);
              }
            },
            onStateChange: (event: any) => {
              if (event.data === window.YT.PlayerState.PLAYING) {
                usePlayerStore.getState().setIsPlaying(true);
                usePlayerStore.getState().setPendingPlay(false);
              } else if (event.data === window.YT.PlayerState.PAUSED) {
                // If we get PAUSED but are supposed to be playing, we might update UI
                // For now, let the interval handle progress
                usePlayerStore.getState().setIsPlaying(false);
              } else if (event.data === window.YT.PlayerState.ENDED) {
                usePlayerStore.getState().next();
              }
            }
          }
        });
      }
    };`;

const playEffectReplace = `          events: {
            onReady: () => {
              console.log('[MusicPlayer] Player ready');
              setIsReady(true);
              if (usePlayerStore.getState().volume !== undefined) {
                playerRef.current.setVolume(usePlayerStore.getState().volume);
              }
              // Check if there was a pending play before ready
              if (usePlayerStore.getState().pendingPlay && usePlayerStore.getState().currentSong && usePlayerStore.getState().currentSong?.source_type !== 'local') {
                const vid = usePlayerStore.getState().currentSong?.video_id;
                if (vid) playerRef.current.loadVideoById(vid);
              }
            },
            onStateChange: (event: any) => {
              if (usePlayerStore.getState().currentSong?.source_type === 'local') return;
              if (event.data === window.YT.PlayerState.PLAYING) {
                usePlayerStore.getState().setIsPlaying(true);
                usePlayerStore.getState().setPendingPlay(false);
              } else if (event.data === window.YT.PlayerState.PAUSED) {
                usePlayerStore.getState().setIsPlaying(false);
              } else if (event.data === window.YT.PlayerState.ENDED) {
                usePlayerStore.getState().next();
              }
            }
          }
        });
      }
    };`;

code = code.replace(playEffectSearch, playEffectReplace);

// Interval effect for YT and Audio
const intervalSearch = `  useEffect(() => {
    let interval: any;
    if (playerState.isPlaying && isReady) {
      interval = setInterval(() => {
        if (playerRef.current && playerRef.current.getCurrentTime && playerRef.current.getDuration) {
           const currentTime = playerRef.current.getCurrentTime();
           const duration = playerRef.current.getDuration();
           if (currentTime !== undefined && duration !== undefined) {
              usePlayerStore.getState().updateProgress(currentTime, duration);
           }
        }
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [playerState.isPlaying, isReady]);`;

const intervalReplace = `  useEffect(() => {
    let interval: any;
    if (playerState.isPlaying) {
      interval = setInterval(() => {
        if (playerState.currentSong?.source_type === 'local') {
          if (audioRef.current) {
            usePlayerStore.getState().updateProgress(audioRef.current.currentTime, audioRef.current.duration || 0);
          }
        } else if (isReady) {
          if (playerRef.current && playerRef.current.getCurrentTime && playerRef.current.getDuration) {
             const currentTime = playerRef.current.getCurrentTime();
             const duration = playerRef.current.getDuration();
             if (currentTime !== undefined && duration !== undefined) {
                usePlayerStore.getState().updateProgress(currentTime, duration);
             }
          }
        }
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [playerState.isPlaying, isReady, playerState.currentSong]);`;

code = code.replace(intervalSearch, intervalReplace);

// Setup effect
const setupSearch = `  useEffect(() => {
    if (playerState.pendingPlay && playerState.currentSong && isReady) {
      if (playerRef.current && playerRef.current.loadVideoById) {
        playerRef.current.loadVideoById(playerState.currentSong.video_id);
      }
    }
  }, [playerState.currentSong, playerState.pendingPlay, isReady]);`;

const setupReplace = `  useEffect(() => {
    if (playerState.pendingPlay && playerState.currentSong) {
      if (playerState.currentSong.source_type === 'local') {
        if (isReady && playerRef.current && playerRef.current.pauseVideo) {
          playerRef.current.pauseVideo();
        }
        if (audioRef.current && playerState.currentSong.audio_url) {
          audioRef.current.src = playerState.currentSong.audio_url;
          audioRef.current.play().then(() => {
            playerState.setIsPlaying(true);
            playerState.setPendingPlay(false);
          }).catch(console.error);
        }
      } else {
        if (audioRef.current) {
          audioRef.current.pause();
        }
        if (isReady && playerRef.current && playerRef.current.loadVideoById) {
          playerRef.current.loadVideoById(playerState.currentSong.video_id);
        }
      }
    }
  }, [playerState.currentSong, playerState.pendingPlay, isReady]);`;

code = code.replace(setupSearch, setupReplace);

// Play/Pause effect
const ppSearch = `  useEffect(() => {
    if (!playerState.pendingPlay && isReady && playerRef.current) {
      if (playerState.isPlaying && playerRef.current.playVideo) {
        playerRef.current.playVideo();
      } else if (!playerState.isPlaying && playerRef.current.pauseVideo) {
        playerRef.current.pauseVideo();
      }
    }
  }, [playerState.isPlaying, playerState.pendingPlay, isReady]);`;

const ppReplace = `  useEffect(() => {
    if (!playerState.pendingPlay) {
      if (playerState.currentSong?.source_type === 'local') {
        if (audioRef.current) {
          if (playerState.isPlaying) {
             audioRef.current.play().catch(console.error);
          } else {
             audioRef.current.pause();
          }
        }
      } else if (isReady && playerRef.current) {
        if (playerState.isPlaying && playerRef.current.playVideo) {
          playerRef.current.playVideo();
        } else if (!playerState.isPlaying && playerRef.current.pauseVideo) {
          playerRef.current.pauseVideo();
        }
      }
    }
  }, [playerState.isPlaying, playerState.pendingPlay, isReady, playerState.currentSong]);`;

code = code.replace(ppSearch, ppReplace);

// Seek effect
const seekSearch = `  useEffect(() => {
    if (playerState.seekRequest !== null && isReady && playerRef.current) {
      if (playerRef.current.seekTo) {
        playerRef.current.seekTo(playerState.seekRequest, true);
        playerState.clearSeekRequest();
      }
    }
  }, [playerState.seekRequest, isReady]);`;

const seekReplace = `  useEffect(() => {
    if (playerState.seekRequest !== null) {
      if (playerState.currentSong?.source_type === 'local') {
         if (audioRef.current) {
           audioRef.current.currentTime = playerState.seekRequest;
           playerState.clearSeekRequest();
         }
      } else if (isReady && playerRef.current) {
        if (playerRef.current.seekTo) {
          playerRef.current.seekTo(playerState.seekRequest, true);
          playerState.clearSeekRequest();
        }
      }
    }
  }, [playerState.seekRequest, isReady, playerState.currentSong]);`;

code = code.replace(seekSearch, seekReplace);

// Volume effect
const volSearch = `  useEffect(() => {
    if (isReady && playerRef.current && playerRef.current.setVolume) {
      playerRef.current.setVolume(playerState.isMuted ? 0 : playerState.volume);
    }
  }, [playerState.volume, playerState.isMuted, isReady]);`;

const volReplace = `  useEffect(() => {
    const targetVol = playerState.isMuted ? 0 : playerState.volume;
    if (audioRef.current) {
      audioRef.current.volume = targetVol / 100;
    }
    if (isReady && playerRef.current && playerRef.current.setVolume) {
      playerRef.current.setVolume(targetVol);
    }
  }, [playerState.volume, playerState.isMuted, isReady]);`;

code = code.replace(volSearch, volReplace);

// Add audio tag in JSX
const audioSearch = `<div id="youtube-player-container" style={{ display: 'none' }} />`;
const audioReplace = `<div id="youtube-player-container" style={{ display: 'none' }} />
      <audio 
         ref={audioRef} 
         onEnded={() => playerState.next()} 
         onPlay={() => playerState.setIsPlaying(true)} 
         onPause={() => playerState.setIsPlaying(false)} 
         style={{ display: 'none' }} 
      />`;

code = code.replace(audioSearch, audioReplace);

// Render info
const infoSearch = `const artist = playerState.currentSong?.channel_title || "Unknown";`;
const infoReplace = `const artist = playerState.currentSong?.artist || playerState.currentSong?.channel_title || "Unknown";`;
code = code.replace(infoSearch, infoReplace);

fs.writeFileSync('./src/components_player.tsx', code);
console.log('components_player.tsx updated successfully');
