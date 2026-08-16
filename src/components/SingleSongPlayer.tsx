import React from 'react';
import { usePlayerStore } from '../lib/store';
import { Play, Pause, SkipBack, SkipForward, Volume2, VolumeX, Shuffle, Repeat, ExternalLink } from 'lucide-react';
import { formatTime } from '../components_player'; // We can reuse formatTime from there

export function SingleSongPlayer({ media }: { media: any }) {
  const playerState = usePlayerStore();
  const videoId = media.youtube_id || media.video_id;
  const isCurrentSong = playerState.currentSong?.video_id === videoId;

  const handlePlay = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isCurrentSong) {
      if (playerState.isPlaying) {
        playerState.pause();
      } else {
        playerState.resume();
      }
    } else {
      playerState.playSong({
        video_id: videoId,
        title: media.title,
        channel_title: media.channel_title,
        thumbnail: media.thumbnail
      }, false);
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const time = Number(e.target.value);
    playerState.seek(time);
  };

  const handleVolume = (e: React.ChangeEvent<HTMLInputElement>) => {
    const vol = Number(e.target.value);
    playerState.setVolume(vol);
  };

  const handleMute = () => {
    playerState.toggleMute();
  };

  const openFloatingPlayer = () => {
    playerState.openPlayer();
  };

  const thumbnail = media.thumbnail || `https://i.ytimg.com/vi/${videoId}/default.jpg`;
  const title = media.title || "Canción de YouTube";
  const artist = media.channel_title;

  if (!isCurrentSong) {
    // COMPACT STATE
    return (
      <div className="single-song-compact panel" onClick={handlePlay} style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '12px', padding: '12px', marginTop: '12px' }}>
        <div style={{ position: 'relative', width: '56px', height: '56px', borderRadius: '8px', overflow: 'hidden', flexShrink: 0 }}>
          <img src={thumbnail} alt={title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        </div>
        <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column' }}>
          <strong style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', fontSize: '1rem', color: 'var(--text-main)' }}>{title}</strong>
          {artist && <span style={{ color: 'var(--text-light)', fontSize: '0.85rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{artist}</span>}
          {media.duration && <span style={{ color: 'var(--text-light)', fontSize: '0.8rem' }}>{media.duration}</span>}
        </div>
        <button className="icon-button primary-circle-btn" onClick={handlePlay} style={{ flexShrink: 0, width: '40px', height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '50%', background: 'var(--primary)', color: 'white', border: 'none' }}>
          <Play size={20} fill="currentColor" style={{ marginLeft: '2px' }} />
        </button>
      </div>
    );
  }

  // EXPANDED STATE
  return (
    <div className="single-song-expanded panel" style={{ marginTop: '12px', padding: '16px', display: 'flex', flexDirection: 'column', gap: '16px', background: 'var(--panel-bg)' }}>
      <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-start' }}>
        <div style={{ width: '80px', height: '80px', borderRadius: '8px', overflow: 'hidden', flexShrink: 0, boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
          <img src={thumbnail} alt={title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <strong style={{ display: 'block', fontSize: '1.1rem', color: 'var(--text-main)', marginBottom: '4px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{title}</strong>
          {artist && <span style={{ display: 'block', color: 'var(--text-light)', fontSize: '0.9rem', marginBottom: '2px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{artist}</span>}
          {media.album && <span style={{ display: 'block', color: 'var(--text-light)', fontSize: '0.85rem' }}>{media.album} {media.year ? `(${media.year})` : ''}</span>}
        </div>
        <button onClick={openFloatingPlayer} title="Reproducir en reproductor" style={{ background: 'transparent', border: 'none', color: 'var(--text-light)', cursor: 'pointer', padding: '4px' }}>
          <ExternalLink size={20} />
        </button>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <span style={{ fontSize: '0.8rem', color: 'var(--text-light)', fontVariantNumeric: 'tabular-nums' }}>{formatTime(playerState.currentTime)}</span>
        <input
          type="range"
          className="song-progress-slider"
          min={0}
          max={playerState.duration || 100}
          value={playerState.currentTime}
          onChange={handleSeek}
          style={{ flex: 1 }}
        />
        <span style={{ fontSize: '0.8rem', color: 'var(--text-light)', fontVariantNumeric: 'tabular-nums' }}>{formatTime(playerState.duration)}</span>
      </div>

      <div className="single-song-controls" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <button
            onClick={() => playerState.previous()}
            disabled={playerState.currentIndex === 0}
            style={{ background: 'transparent', border: 'none', color: playerState.currentIndex === 0 ? 'var(--border)' : 'var(--text-main)', cursor: playerState.currentIndex === 0 ? 'default' : 'pointer' }}
          >
            <SkipBack size={24} fill="currentColor" />
          </button>

          <button
            onClick={handlePlay}
            style={{ width: '48px', height: '48px', borderRadius: '50%', background: 'var(--primary)', color: 'white', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', boxShadow: '0 2px 8px rgba(0,0,0,0.2)' }}
          >
            {playerState.isPlaying ? <Pause size={24} fill="currentColor" /> : <Play size={24} fill="currentColor" style={{ marginLeft: '4px' }} />}
          </button>

          <button
            onClick={() => playerState.next()}
            disabled={playerState.currentIndex === playerState.queue.length - 1}
            style={{ background: 'transparent', border: 'none', color: playerState.currentIndex === playerState.queue.length - 1 ? 'var(--border)' : 'var(--text-main)', cursor: playerState.currentIndex === playerState.queue.length - 1 ? 'default' : 'pointer' }}
          >
            <SkipForward size={24} fill="currentColor" />
          </button>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button onClick={handleMute} style={{ background: 'transparent', border: 'none', color: 'var(--text-light)', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
            {playerState.isMuted ? <VolumeX size={20} /> : <Volume2 size={20} />}
          </button>
          <input
            type="range"
            className="song-volume-slider"
            min={0}
            max={100}
            value={playerState.isMuted ? 0 : playerState.volume}
            onChange={handleVolume}
            style={{ width: '80px' }}
          />
        </div>
      </div>
    </div>
  );
}
