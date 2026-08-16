// We need to check if there is an issue with `seekTo` in YoutubePlaylist since it doesn't have the playerRef
// Wait, the store handles state, but `seekTo` is only called inside FloatingMusicPlayer which has playerRef.
// How do we notify FloatingMusicPlayer that seek happened from another component?
// Ah! `seek` updates `currentTime`. But FloatingMusicPlayer doesn't re-trigger `seekTo` when `currentTime` changes because `currentTime` updates constantly while playing.
