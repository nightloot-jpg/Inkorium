function YoutubePlaylist({ media }: { media: any }) {
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
        const m = Math.floor(secs / 60);
        const s = Math.floor(secs % 60);
        return `${m}:${s.toString().padStart(2, '0')}`;
    };

    return (
        <div className="ink-playlist-card">
            <div className="ink-playlist-header">
                <div className="ink-playlist-cover-wrapper" onClick={playPlaylistFull}>
                    <img src={media.thumbnail || 'https://placehold.co/150'} alt="Cover" className="ink-playlist-cover" />
                    <button className="ink-play-overlay"><Play fill="currentColor" size={32}/></button>
                </div>

                <div className="ink-playlist-main">
                    <div className="ink-playlist-info">
                        <h3 className="ink-playlist-title">{media.title || "Playlist"}</h3>
                        <p className="ink-playlist-artist">{media.channel_title || ""}</p>
                        <small className="ink-playlist-count">{tracks.length} canciones</small>
                    </div>

                    <div className="ink-playlist-controls">
                        {isActivePlaylist && playerState.duration > 0 ? (
                            <div className="ink-playlist-progress active">
                                <span>{formatDuration(playerState.currentTime)}</span>
                                <input
                                    type="range"
                                    min="0"
                                    max={playerState.duration || 100}
                                    value={playerState.currentTime || 0}
                                    onChange={(e) => {
                                        playerState.seek(parseFloat(e.target.value));
                                    }}
                                />
                                <span>{formatDuration(playerState.duration)}</span>
                            </div>
                        ) : (
                             <div className="ink-playlist-progress dummy">
                                <span>0:00</span>
                                <input type="range" min="0" max="100" value="0" disabled />
                                <span>0:00</span>
                            </div>
                        )}

                        <div className="ink-playlist-actions">
                            <div className="ink-playback-btns">
                                <button onClick={() => {
                                    if (isActivePlaylist) playerState.previous();
                                }} className="ink-icon-btn">
                                    <SkipBack size={20} fill="currentColor" />
                                </button>

                                <button onClick={() => {
                                    if (isActivePlaylist && playerState.isPlaying) {
                                        playerState.pause();
                                    } else if (isActivePlaylist && !playerState.isPlaying) {
                                        playerState.resume();
                                    } else {
                                        playPlaylistFull();
                                    }
                                }} className="ink-icon-btn ink-play-pause-btn">
                                    {isActivePlaylist && playerState.isPlaying ? (
                                        <Pause size={24} fill="currentColor" />
                                    ) : (
                                        <Play size={24} fill="currentColor" />
                                    )}
                                </button>

                                <button onClick={() => {
                                    if (isActivePlaylist) playerState.next();
                                }} className="ink-icon-btn">
                                    <SkipForward size={20} fill="currentColor" />
                                </button>

                                <div className="ink-volume-control">
                                    {playerState.volume === 0 ? <VolumeX size={16} /> : <Volume2 size={16} />}
                                    <input
                                        type="range"
                                        min="0" max="100"
                                        value={playerState.volume}
                                        onChange={(e) => playerState.setVolume(parseInt(e.target.value))}
                                    />
                                </div>
                            </div>

                            <button onClick={playPlaylistFull} className="ink-outline-button">
                                Reproducir en reproductor
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <div className="ink-playlist-tracks">
                {visibleTracks.map((t: any, i: number) => {
                    const isActive = playerState.currentSong?.video_id === t.video_id && isActivePlaylist;
                    return (
                        <div key={i} className={`ink-playlist-track ${isActive ? 'active' : ''}`} onClick={() => playTrack(i)}>
                            <span className="ink-track-number">{isActive ? <Play size={14} fill="currentColor"/> : i + 1}</span>
                            <div className="ink-track-details">
                                <span className="ink-track-title">{t.title}</span>
                                {t.channel_title && <span className="ink-track-artist">{t.channel_title}</span>}
                            </div>
                            <span className="ink-track-duration">{t.duration || ''}</span>
                        </div>
                    );
                })}
            </div>

            {(tracks.length > visibleCount || nextPageToken) && (
                <button onClick={() => loadMore()} disabled={loading} className="ink-load-more-tracks">
                    {loading ? 'Cargando...' : 'Cargar más canciones ↓'}
                </button>
            )}
        </div>
    );
}
