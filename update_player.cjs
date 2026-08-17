const fs = require('fs');

let code = fs.readFileSync('src/components_player.tsx', 'utf8');

// Modify intervals and effects in components_player
const intervalReplacement = `
    let pollingInterval;
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
                // To avoid React loop warnings, we could check if it's different but store does it usually
                usePlayerStore.getState().updateProgress(currentTime, duration);
              }
            }
          } catch (e) {}
        }
      }, 250);
    }
    return () => clearInterval(pollingInterval);
`;

const stateChangeReplacement = `
            onStateChange: (event: any) => {
              // 1: playing, 2: paused, 0: ended
              if (event.data === 1) {
                usePlayerStore.getState().setIsPlaying(true);
                const current = playerRef.current.getCurrentTime();
                const dur = playerRef.current.getDuration();
                if (current && dur) usePlayerStore.getState().updateProgress(current, dur);
              } else if (event.data === 2) {
                usePlayerStore.getState().setIsPlaying(false);
              } else if (event.data === 0) {
                usePlayerStore.getState().next();
              }
            }
`;

const effectCurrentSongReplacement = `
  useEffect(() => {
    if (isReady && playerRef.current && playerState.currentSong) {
      const currentVideoId = playerState.currentSong.video_id;
      try {
        const videoData = playerRef.current.getVideoData();
        const state = playerRef.current.getPlayerState();
        if (videoData && videoData.video_id === currentVideoId) {
          if (playerState.isPlaying && state !== 1) {
             playerRef.current.playVideo();
          } else if (!playerState.isPlaying && state === 1) {
             playerRef.current.pauseVideo();
          }
        } else {
          playerRef.current.loadVideoById(currentVideoId);
          // Wait for onReady or state change to play if it was playing, loadVideoById auto-plays usually, but to be safe:
          if (!playerState.isPlaying) {
             // We want to load it but not play
             playerRef.current.cueVideoById(currentVideoId);
          }
        }
      } catch (e) {}
    }
  }, [playerState.currentSong?.video_id, playerState.isPlaying, isReady]);
`;

// we will write a script to rewrite components_player.tsx to ensure all pieces match the user's requirements exactly.
