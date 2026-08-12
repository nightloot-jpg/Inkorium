import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import { Heart, MessageCircle, Play, Share2 } from 'lucide-react';
import type { FeedPost } from '../types';

export function PostCard({ post, onLike }: { post: FeedPost; onLike: (id: string) => void }) {
  return (
    <article className="feed-post">
      <header className="feed-post-header">
        <img src={post.authorAvatar} alt="" className="feed-avatar" />
        <div className="feed-post-meta">
          <p className="feed-post-name">{post.authorName}</p>
          <p className="feed-post-time"><span suppressHydrationWarning>{formatDistanceToNow(new Date(post.createdAt), { addSuffix: true, locale: es })}</span> · Público</p>
        </div>
        <button type="button" className="feed-post-menu" aria-label="Opciones">⌄</button>
      </header>

      {post.kind === 'music' ? (
        <div className="feed-music">
          <div className="feed-music-row">
            <div className="feed-music-thumb">
              {post.image && <img src={post.image} alt="" />}
              <span className="feed-play"><Play size={22} fill="white" /></span>
            </div>
            <div className="feed-music-copy">
              <p className="feed-music-title">{post.title || post.content || 'Publicación musical'}</p>
              <p className="feed-music-subtitle">{post.subtitle || 'MHR MUSIC'}</p>
            </div>
            <span className="feed-music-duration">{post.duration || '5:05'}</span>
          </div>
        </div>
      ) : (
        <>
          {post.content && <div className="feed-post-content">{post.content}</div>}
          {post.image && <div className="feed-post-media"><img src={post.image} alt="" /></div>}
        </>
      )}

      <div className="feed-post-stats">
        <span>{post.likes} Me gusta</span>
        <span>{post.comments} comentarios · {post.shares} compartidos</span>
      </div>
      <div className="feed-post-buttons">
        <button type="button" onClick={() => onLike(post.id)} className={`feed-post-button ${post.liked ? 'feed-post-button-active' : ''}`}><Heart size={18} fill={post.liked ? 'currentColor' : 'none'} />Me gusta</button>
        <button type="button" className="feed-post-button"><MessageCircle size={18} />Comentar</button>
        <button type="button" className="feed-post-button"><Share2 size={18} />Compartir</button>
      </div>
    </article>
  );
}
