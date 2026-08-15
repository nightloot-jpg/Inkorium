import React, { useState, useEffect } from 'react';
import { Play, Pause, SkipBack, SkipForward, Volume2, VolumeX, ExternalLink, ChevronDown } from 'lucide-react';
import { usePlayerStore } from './lib/store';

export function YoutubePlaylist({ media }: { media: any }) {
    const playerState = usePlayerStore();
    const [tracks, setTracks] = useState<any[]>(media.initial_tracks || []);
    const [nextPageToken, setNextPageToken] = useState<string | null>(media.nextPageToken || null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [visibleCount, setVisibleCount] = useState(4);

    useEffect(() => {
        if (!tracks || tracks.length === 0) {
            loadMore(true);
        }
    }, [media.youtube_id, media.playlist_id]);

    async function loadMore(isInitial = false) {
        if (!isInitial && tracks.length > visibleCount) {
            setVisibleCount(prev => prev + 4);
            return;
        }

        if (loading || (!isInitial && !nextPageToken)) return;
        setLoading(true);
        try {
            const apiKey = import.meta.env.VITE_YOUTUBE_API_KEY;
            const pid = media.playlist_id || media.youtube_id;
            const pageTokenParam = !isInitial && nextPageToken ? `&pageToken=${nextPageToken}` : '';
            const res = await fetch(`https://www.googleapis.com/youtube/v3/playlistItems?part=snippet&maxResults=10&playlistId=${pid}${pageTokenParam}&key=${apiKey}`);
            const data = await res.json();
            if (data.error) throw new Error(data.error.message);

            const newTracks = data.items ? data.items.map((t: any) => ({
                video_id: t.snippet.resourceId.videoId,
                title: t.snippet.title,
                channel_title: t.snippet.videoOwnerChannelTitle,
                thumbnail: t.snippet.thumbnails?.default?.url,
                duration: t.duration || ''
            })) : [];

            setTracks(prev => {
                const map = new Map();
                [...prev, ...newTracks].forEach(item => map.set(item.video_id, item));
                return Array.from(map.values());
            });
            setNextPageToken(data.nextPageToken || null);
            if (!isInitial) setVisibleCount(prev => prev + 4);
        } catch (err: any) {
            setError(err.message);
        }
        setLoading(false);
    }

    function playTrack(idx: number) {
        const playlist = {
            type: 'youtube_playlist' as const,
            playlist_id: media.playlist_id || media.youtube_id,
            title: media.title || "Playlist",
        };
        playerState.playPlaylist(playlist, tracks, idx);
    }

    function playPlaylistFull() {
        if (tracks.length > 0) playTrack(0);
    }

    const isActivePlaylist = playerState.currentPlaylist?.playlist_id === (media.playlist_id || media.youtube_id);
    const visibleTracks = tracks.slice(0, visibleCount);

    const formatDuration = (secs: number) => {
        if (isNaN(secs)) return '0:00';
        const m = Math.floor(secs / 60);
        const s = Math.floor(secs % 60);
        return `${m}:${s.toString().padStart(2, '0')}`;
    };

    const currentTrackIndex = isActivePlaylist ? playerState.currentIndex : -1;

    return (
        <div className="ink-playlist-card-v2">
            <div className="ink-playlist-v2-header">
                {/* Cover Art */}
                <div className="ink-playlist-v2-cover-container group" onClick={playPlaylistFull}>
                    <img src={media.thumbnail || 'https://placehold.co/120'} alt="Cover" className="ink-playlist-v2-cover" />
                    <div className="ink-playlist-v2-cover-overlay">
                        <Play className="ink-playlist-v2-cover-icon" fill="currentColor" size={24} />
                    </div>
                </div>

                {/* Metadata & Controls Column */}
                <div className="ink-playlist-v2-main">
                    <div>
                        <h3 className="ink-playlist-v2-title">{media.title || "Playlist"}</h3>
                        <p className="ink-playlist-v2-artist">{media.channel_title || "The Algorithms"}</p>
                    </div>

                    {/* Progress Bar Area */}
                    <div className="ink-playlist-v2-progress-area">
                        {isActivePlaylist && playerState.duration > 0 ? (
                            <>
                                <div className="ink-playlist-v2-progress-labels">
                                    <span>{formatDuration(playerState.currentTime)}</span>
                                    <span>{formatDuration(playerState.duration)}</span>
                                </div>
                                <div 
                                    className="ink-playlist-v2-progress-bar-container group"
                                    onClick={(e) => {
                                        const rect = e.currentTarget.getBoundingClientRect();
                                        const x = e.clientX - rect.left;
                                        const percentage = Math.max(0, Math.min(1, x / rect.width));
                                        playerState.seek(percentage * playerState.duration);
                                    }}
                                >
                                    <div className="ink-playlist-v2-progress-bg">
                                        <div 
                                            className="ink-playlist-v2-progress-fill"
                                            style={{ width: `${(playerState.currentTime / playerState.duration) * 100}%` }}
                                        ></div>
                                    </div>
                                    <div 
                                        className="ink-playlist-v2-progress-thumb group-hover:opacity-100"
                                        style={{ left: `${(playerState.currentTime / playerState.duration) * 100}%` }}
                                    ></div>
                                </div>
                            </>
                        ) : (
                             <>
                                <div className="ink-playlist-v2-progress-labels">
                                    <span>0:00</span>
                                    <span>0:00</span>
                                </div>
                                <div className="ink-playlist-v2-progress-bar-container">
                                    <div className="ink-playlist-v2-progress-bg">
                                        <div className="ink-playlist-v2-progress-fill" style={{ width: '0%' }}></div>
                                    </div>
                                </div>
                            </>
                        )}
                    </div>

                    {/* Controls & Action Row */}
                    <div className="ink-playlist-v2-controls-row">
                        <div className="ink-playlist-v2-playback-controls">
                            <button 
                                className="ink-playlist-v2-btn-icon" 
                                aria-label="Previous"
                                onClick={() => isActivePlaylist && playerState.previous()}
                            >
                                <SkipBack size={24} fill="currentColor" />
                            </button>
                            <button 
                                className="ink-playlist-v2-btn-play" 
                                aria-label="Play/Pause"
                                onClick={() => {
                                    if (isActivePlaylist && playerState.isPlaying) {
                                        playerState.pause();
                                    } else if (isActivePlaylist && !playerState.isPlaying) {
                                        playerState.resume();
                                    } else {
                                        playPlaylistFull();
                                    }
                                }}
                            >
                                {isActivePlaylist && playerState.isPlaying ? (
                                    <Pause size={24} fill="currentColor" />
                                ) : (
                                    <Play size={24} fill="currentColor" />
                                )}
                            </button>
                            <button 
                                className="ink-playlist-v2-btn-icon" 
                                aria-label="Next"
                                onClick={() => isActivePlaylist && playerState.next()}
                            >
                                <SkipForward size={24} fill="currentColor" />
                            </button>
                            
                            <button 
                                className="ink-playlist-v2-btn-icon ink-playlist-v2-btn-volume hidden-mobile" 
                                aria-label="Volume"
                            >
                                <Volume2 size={24} fill="currentColor" />
                            </button>
                        </div>
                        
                        <button 
                            className="ink-playlist-v2-btn-secondary"
                            onClick={playPlaylistFull}
                        >
                            <ExternalLink size={14} />
                            Reproducir en reproductor
                        </button>
                    </div>
                </div>
            </div>

            {/* Song List Section */}
            <div className="ink-playlist-v2-tracklist">
                {visibleTracks.map((t: any, i: number) => {
                    const isActive = isActivePlaylist && currentTrackIndex === i;
                    return (
                        <div 
                            key={i} 
                            className={`ink-playlist-v2-track group ${isActive ? 'active' : ''} ${i === visibleTracks.length - 1 ? 'last' : ''}`}
                            onClick={() => playTrack(i)}
                        >
                            <div className="ink-playlist-v2-track-num">
                                <span className={isActive ? 'hidden' : 'group-hover:hidden'}>{i + 1}</span>
                                <span className={isActive ? 'block text-primary' : 'hidden group-hover:block text-primary'}>
                                    {isActive && playerState.isPlaying ? (
                                        <Pause size={16} fill="currentColor" />
                                    ) : (
                                        <Play size={16} fill="currentColor" />
                                    )}
                                </span>
                            </div>
                            
                            <div className="ink-playlist-v2-track-info">
                                <p className="ink-playlist-v2-track-title">{t.title}</p>
                                {t.channel_title && <p className="ink-playlist-v2-track-artist">{t.channel_title}</p>}
                            </div>
                            
                            <div className="ink-playlist-v2-track-duration">
                                {t.duration || '0:00'}
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Footer Action */}
            {(tracks.length > visibleCount || nextPageToken) && (
                <div className="ink-playlist-v2-footer">
                    <button 
                        className="ink-playlist-v2-btn-load-more"
                        onClick={() => loadMore()} 
                        disabled={loading}
                    >
                        {loading ? 'Cargando...' : 'Cargar más canciones'}
                        {!loading && <ChevronDown size={14} />}
                    </button>
                </div>
            )}
        </div>
    );
}
