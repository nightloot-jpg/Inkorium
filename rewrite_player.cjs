const fs = require('fs');

let code = fs.readFileSync('src/components_player.tsx', 'utf8');

// The file needs careful parsing, I'll regex replace the sections.

// 1. the interval in useEffect
const oldInterval = `const interval = setInterval(() => {
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

    return () => clearInterval(interval);`;

const newInterval = `let pollingInterval: any;
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
    };`;

code = code.replace(oldInterval, newInterval);


// 2. The state change events
const oldStateChange = `onStateChange: (event: any) => {
              // 1: playing, 2: paused, 0: ended
              if (event.data === 1) {
                playerState.resume();
                playerState.updateProgress(playerRef.current.getCurrentTime(), playerRef.current.getDuration());
              } else if (event.data === 2) {
                playerState.pause();
              } else if (event.data === 0) {
                playerState.next();
              }
            }`;

const newStateChange = `onStateChange: (event: any) => {
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
            }`;

code = code.replace(oldStateChange, newStateChange);

// 3. The currentSong effect
const oldCurrentSongEffect = `useEffect(() => {
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
  }, [playerState.currentSong, playerState.isPlaying, isReady]);`;

const newCurrentSongEffect = `useEffect(() => {
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
          if (playerState.isPlaying) {
             playerRef.current.loadVideoById(currentVideoId);
          } else {
             playerRef.current.cueVideoById(currentVideoId);
          }
        }
      } catch (e) {}
    }
  }, [playerState.currentSong?.video_id, playerState.isPlaying, isReady]);`;

code = code.replace(oldCurrentSongEffect, newCurrentSongEffect);

fs.writeFileSync('src/components_player.tsx', code);
console.log('done rewriting');
