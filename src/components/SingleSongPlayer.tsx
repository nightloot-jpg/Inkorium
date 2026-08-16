import React from 'react';
import { Play, Pause, SkipBack, SkipForward, Volume2, VolumeX, ExternalLink } from 'lucide-react';
import { usePlayerStore } from '../lib/store';
import { formatTime } from '../components_player';

export function SingleSongPlayer({ media }: { media: any }) {
    const playerState = usePlayerStore();

    // Determine if this song is currently the active one in the global player
    const isActiveSong = playerState.currentSong?.video_id === media.youtube_id;
    const isPlaying = isActiveSong && (playerState.isPlaying || playerState.pendingPlay);

    // We use the thumbnail from media, or a placeholder
    const thumbnail = media.thumbnail || (media.youtube_id ? `https://i.ytimg.com/vi/${media.youtube_id}/default.jpg` : '');
    const title = media.title;
    const channel = media.channel_title;

    // Format the duration string
    // media.duration might be available from the API, if not we fallback
    // Since we don't have media.duration in the exact same way always, let's check
    const displayDuration = isActiveSong ? formatTime(playerState.duration) : (media.duration || '');

    const handlePlayPause = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (isActiveSong) {
            if (isPlaying) {
                playerState.pause();
            } else {
                playerState.resume();
            }
        } else {
            // Load and play the song
            const song = {
                type: 'youtube_song',
                video_id: media.youtube_id,
                title: title,
                channel_title: channel,
                thumbnail: thumbnail,
            };
            // Do not open UI by default as requested in "estado expandido" vs "modo compacto"
            playerState.playSong(song as any, false);
        }
    };

    const handleOpenPlayer = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (isActiveSong) {
            playerState.openPlayer();
            // Optional: playerState.expandPlayer() to show the big UI
        } else {
            const song = {
                type: 'youtube_song',
                video_id: media.youtube_id,
                title: title,
                channel_title: channel,
                thumbnail: thumbnail,
            };
            playerState.playSong(song as any, true);
        }
    };

    if (!isActiveSong) {
        // Compact state
        return (
            <div className="single-song-player compact" onClick={handlePlayPause}>
                {thumbnail && <img src={thumbnail} alt={title || 'Cover'} className="single-song-player__cover" />}
                <div className="single-song-player__info">
                    {title && <strong className="single-song-player__title">{title}</strong>}
                    {channel && <span className="single-song-player__artist">{channel}</span>}
                </div>
                <div className="single-song-player__duration">
                    {media.duration || ''}
                </div>
                <button className="single-song-player__play-btn" onClick={handlePlayPause}>
                    <Play size={24} fill="currentColor" />
                </button>
            </div>
        );
    }

    // Expanded state
    return (
        <div className="single-song-player expanded">
            <div className="single-song-player__main">
                {thumbnail && <img src={thumbnail} alt={title || 'Cover'} className="single-song-player__cover-large" />}
                <div className="single-song-player__details">
                    <div className="single-song-player__header-info">
                        {title && <strong className="single-song-player__title-large">{title}</strong>}
                        {channel && <span className="single-song-player__artist-large">{channel}</span>}
                        {/* If we have album/year, we would show it here. Assuming not available directly */}
                    </div>

                    <div className="single-song-player__progress">
                        <span className="time">{formatTime(playerState.currentTime)}</span>
                        <div
                            className="progress-bar-container group"
                            onClick={(e) => {
                                const rect = e.currentTarget.getBoundingClientRect();
                                const x = e.clientX - rect.left;
                                const percentage = Math.max(0, Math.min(1, x / rect.width));
                                playerState.seek(percentage * playerState.duration);
                            }}
                        >
                            <div className="progress-bg">
                                <div
                                    className="progress-fill"
                                    style={{ width: `${(playerState.currentTime / (playerState.duration || 1)) * 100}%` }}
                                ></div>
                            </div>
                            <div
                                className="progress-thumb group-hover:opacity-100"
                                style={{ left: `${(playerState.currentTime / (playerState.duration || 1)) * 100}%` }}
                            ></div>
                        </div>
                        <span className="time">{formatTime(playerState.duration)}</span>
                    </div>

                    <div className="single-song-player__controls-row">
                        <div className="playback-controls">
                            <button
                                className="icon-btn"
                                onClick={(e) => { e.stopPropagation(); playerState.previous(); }}
                                disabled={playerState.currentIndex === 0}
                            >
                                <SkipBack size={20} fill="currentColor" />
                            </button>
                            <button
                                className="play-btn"
                                onClick={handlePlayPause}
                            >
                                {isPlaying ? <Pause size={24} fill="currentColor" /> : <Play size={24} fill="currentColor" />}
                            </button>
                            <button
                                className="icon-btn"
                                onClick={(e) => { e.stopPropagation(); playerState.next(); }}
                                disabled={playerState.currentIndex >= playerState.queue.length - 1}
                            >
                                <SkipForward size={20} fill="currentColor" />
                            </button>

                            <div className="volume-controls hidden-mobile">
                                <button
                                    className="icon-btn volume-btn"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        playerState.toggleMute();
                                    }}
                                >
                                    {playerState.isMuted || playerState.volume === 0 ? <VolumeX size={18} /> : <Volume2 size={18} />}
                                </button>
                                <input
                                    type="range"
                                    min="0"
                                    max="100"
                                    value={playerState.volume}
                                    onChange={(e) => playerState.setVolume(parseInt(e.target.value))}
                                    onClick={(e) => e.stopPropagation()}
                                    className="volume-slider"
                                />
                            </div>
                        </div>

                        <button
                            className="open-player-btn"
                            onClick={handleOpenPlayer}
                        >
                            <ExternalLink size={14} />
                            Reproducir en reproductor
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
