import { useEffect, useState } from 'react';
import { ExternalLink, Loader2, Video } from 'lucide-react';
import { supabase } from '../../../lib/supabase';
import { getR2SignedUrl } from '../../../lib/r2';

type UserVideo = {
  id: string;
  title: string;
  thumbnail: string | null;
  channel: string | null;
  url: string | null;
  source: string;
  youtube_video_id: string | null;
};

type Props = { profileId: string };

export function ProfileVideos({ profileId }: Props) {
  const [videos, setVideos] = useState<Array<UserVideo & { playbackUrl: string | null }>>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      const { data } = await supabase
        .from('user_videos')
        .select('id, title, thumbnail, channel, url, source, youtube_video_id')
        .eq('user_id', profileId)
        .order('created_at', { ascending: false });

      const rows = (data || []) as UserVideo[];
      const hydrated = await Promise.all(rows.map(async video => ({
        ...video,
        playbackUrl: video.source === 'upload' && video.url?.startsWith('r2://')
          ? await getR2SignedUrl(video.url.slice('r2://'.length)).catch(() => null)
          : video.url,
      })));

      if (!cancelled) {
        setVideos(hydrated);
        setLoading(false);
      }
    }

    void load();
    return () => { cancelled = true; };
  }, [profileId]);

  if (loading) {
    return <div className="profile-view-card profile-view-empty"><Loader2 size={18} /> Cargando vídeos...</div>;
  }

  if (videos.length === 0) {
    return <div className="profile-view-card profile-view-empty"><Video size={28} /><span>Este perfil todavía no tiene vídeos.</span></div>;
  }

  return (
    <div className="profile-view-card profile-profile-videos-card">
      <div className="profile-view-section-head"><h2><Video size={17} /> Vídeos</h2><span>{videos.length}</span></div>
      <div className="profile-profile-videos-grid">
        {videos.map(video => (
          <article className="profile-profile-video-item" key={video.id}>
            {video.source === 'upload' && video.playbackUrl ? (
              <video src={video.playbackUrl} controls preload="metadata" />
            ) : video.thumbnail ? (
              <button type="button" onClick={() => video.playbackUrl && window.open(video.playbackUrl, '_blank', 'noopener,noreferrer')}>
                <img src={video.thumbnail} alt="" />
              </button>
            ) : (
              <div className="profile-profile-video-placeholder"><Video size={30} /></div>
            )}
            <div className="profile-profile-video-info">
              <strong title={video.title}>{video.title}</strong>
              <span>{video.channel || (video.source === 'upload' ? 'Vídeo subido' : 'YouTube')}</span>
              {video.source !== 'upload' && video.playbackUrl && (
                <button type="button" onClick={() => window.open(video.playbackUrl!, '_blank', 'noopener,noreferrer')}><ExternalLink size={13} /> Ver</button>
              )}
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
