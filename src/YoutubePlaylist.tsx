import { parseISO8601Duration } from "./utils";
import React, { useState, useEffect } from 'react';
import { Play, Pause, SkipBack, SkipForward, Volume2, VolumeX, ExternalLink, ChevronDown } from 'lucide-react';
import { usePlayerStore } from './lib/store';
import { youtubeRequest } from './lib/youtube';

export function YoutubePlaylist({ media }: { media: any }) {
    const playerState = usePlayerStore();
    const [tracks, setTracks] = useState<any[]>(media.initial_tracks || []);
    const [nextPageToken, setNextPageToken] = useState<string | null>(media.nextPageToken || null);
    const [loading, setLoading] = useState(false);
    const [, setError] = useState<string | null>(null);
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
            const pid = media.playlist_id || media.youtube_id;
            const data = await youtubeRequest('playlistItems', {
                part: 'snippet',
                maxResults: 10,
                playlistId: pid,
                pageToken: !isInitial && nextPageToken ? nextPageToken : undefined,
            });

            let newTracks = data.items ? data.items.map((t: any) => ({
                video_id: t.snippet.resourceId.videoId,
                title: t.snippet.title,
                channel_title: t.snippet.videoOwnerChannelTitle,
                thumbnail: t.snippet.thumbnails?.default?.url,
                duration: ''
            })) : [];

            if (newTracks.length > 0) {
                const videoIds = newTracks.map((t: any) => t.video_id).join(',');
                const videosData = await youtubeRequest('videos', {
                    part: 'contentDetails',
                    id: videoIds,
                });

                if (videosData.items) {
                    const durationMap = new Map();
                    videosData.items.forEach((v: any) => {
                        durationMap.set(v.id, parseISO8601Duration(v.contentDetails.duration));
                    });

                    newTracks = newTracks.map((t: any) => ({
                        ...t,
                        duration: durationMap.get(t.video_id) || ''
                    }));
                }
            }

            setTracks(prev => {
                const map = new Map();
                [...prev, ...newTracks].forEach(item => map.set(item.video_id, item));
                return Array.from(map.values());
            });
            setNextPageToken(data.nextPageToken || null);
            if (!isInitial) setVisibleCount(prev => prev + 4);
        } catch (err: any) {
            setError(err?.message || 'No se pudo cargar la playlist.');
        }
        setLoading(false);
    }

    function playTrack(idx: number) {
        const playlist = {
            type: 'youtube_playlist' as const,
            playlist_id: media.playlist_id || media.youtube_id,
            title: media.title || "Playlist",
        };
        playerState.playPlaylist(playlist, tracks, idx, false);
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
                <div className="ink-playlist-v2-cover-container group" onClick={() => {
                                if (isActivePlaylist) {
                                    if (playerState.isPlaying) playerState.pause();
                                    else playerState.resume();
                                } else if (tracks.length > 0) {
                                    playerState.playPlaylist({ type: "youtube_playlist", playlist_id: media.playlist_id || media.youtube_id, title: media.title || "Playlist" }, tracks, 0, false);
                                }
                            }}>
                    <img src={media.thumbnail || 'https://placehold.co/120'} alt="Cover" className="ink-playlist-v2-cover" />
                    <div className="ink-playlist-v2-cover-overlay">
                        <Play className="ink-playlist-v2-cover-icon" fill="currentColor" size={24} />
                    </div>
                </div>

                <div className="ink-playlist-v2-main">
                    <div>
                        <h3 className="ink-playlist-v2-title">{media.title || "Playlist"}</h3>
                        {media.channel_title && <p className="ink-playlist-v2-artist">{media.channel_title}</p>}
                    </div>

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
                                        <div className="ink-playlist-v2-progress-fill" style={{ width: `${(playerState.currentTime / playerState.duration) * 100}%` }}></div>
                                    </div>
                                    <div className="ink-playlist-v2-progress-thumb group-hover:opacity-100" style={{ left: `${(playerState.currentTime / playerState.duration) * 100}%` }}></div>
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

                    <div className="ink-playlist-v2-controls-row">
                        <div className="ink-playlist-v2-playback-controls">
                            <button className="ink-playlist-v2-btn-icon" aria-label="Previous" onClick={() => isActivePlaylist && playerState.previous()}>
                                <SkipBack size={24} fill="currentColor" />
                            </button>
                            <button className="ink-playlist-v2-btn-play" aria-label="Play/Pause" onClick={() => {
                                if (isActivePlaylist && (playerState.isPlaying || playerState.pendingPlay)) playerState.pause();
                                else if (isActivePlaylist && !playerState.isPlaying && !playerState.pendingPlay) playerState.resume();
                                else playPlaylistFull();
                            }}>
                                {isActivePlaylist && (playerState.isPlaying || playerState.pendingPlay) ? <Pause size={24} fill="currentColor" /> : <Play size={24} fill="currentColor" />}
                            </button>
                            <button className="ink-playlist-v2-btn-icon" aria-label="Next" onClick={() => isActivePlaylist && playerState.next()}>
                                <SkipForward size={24} fill="currentColor" />
                            </button>

                            <div className="hidden-mobile" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <button className="ink-playlist-v2-btn-icon ink-playlist-v2-btn-volume" aria-label="Volume" onClick={(e) => { e.stopPropagation(); playerState.toggleMute(); }}>
                                    {playerState.isMuted || playerState.volume === 0 ? <VolumeX size={24} fill="currentColor" /> : <Volume2 size={24} fill="currentColor" />}
                                </button>
                                <input type="range" min="0" max="100" value={playerState.volume} onChange={(e) => playerState.setVolume(parseInt(e.target.value))} onClick={(e) => e.stopPropagation()} style={{ width: '60px', height: '4px', cursor: 'pointer' }} />
                            </div>
                        </div>

                        <button className="ink-playlist-v2-btn-secondary" onClick={(e) => {
                            e.stopPropagation();
                            if (isActivePlaylist) playerState.openPlayer();
                            else if (tracks.length > 0) playerState.playPlaylist({ type: 'youtube_playlist', playlist_id: media.playlist_id || media.youtube_id, title: media.title || "Playlist" }, tracks, 0, true);
                        }}>
                            <ExternalLink size={14} />
                            Reproducir en reproductor
                        </button>
                    </div>
                </div>
            </div>

            <div className="ink-playlist-v2-tracklist">
                {visibleTracks.map((t: any, i: number) => {
                    const isActive = isActivePlaylist && currentTrackIndex === i;
                    return (
                        <div key={i} className={`ink-playlist-v2-track group ${isActive ? 'active' : ''} ${i === visibleTracks.length - 1 ? 'last' : ''}`} onClick={() => {
                            if (isActive) {
                                if (playerState.isPlaying || playerState.pendingPlay) playerState.pause();
                                else playerState.resume();
                            } else playTrack(i);
                        }}>
                            <div className="ink-playlist-v2-track-num">
                                <span className={isActive ? 'hidden' : 'group-hover:hidden'}>{i + 1}</span>
                                <span className={isActive ? 'block text-primary' : 'hidden group-hover:block text-primary'}>
                                    {isActive && (playerState.isPlaying || playerState.pendingPlay) ? <Pause size={16} fill="currentColor" /> : <Play size={16} fill="currentColor" />}
                                </span>
                            </div>
                            <div className="ink-playlist-v2-track-info">
                                <p className="ink-playlist-v2-track-title">{t.title}</p>
                                {t.channel_title && <p className="ink-playlist-v2-track-artist">{t.channel_title}</p>}
                            </div>
                            <div className="ink-playlist-v2-track-duration">{t.duration || '0:00'}</div>
                        </div>
                    );
                })}
            </div>

            {(tracks.length > visibleCount || nextPageToken) && (
                <div className="ink-playlist-v2-footer">
                    <button className="ink-playlist-v2-btn-load-more" onClick={() => loadMore()} disabled={loading}>
                        {loading ? 'Cargando...' : 'Cargar más canciones'}
                        {!loading && <ChevronDown size={14} />}
                    </button>
                </div>
            )}
        </div>
    );
}
