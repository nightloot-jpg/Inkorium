import { useState } from 'react';
import { Globe2, Heart, MessageCircle, MoreVertical, Play, Share2 } from 'lucide-react';
import type { FeedPost } from '../types';

export function PostCard({ post, onLike }: { post: FeedPost; onLike: (id: string) => void }) {
  const [commentsOpen, setCommentsOpen] = useState(false);
  const isMusic = post.kind === 'music';

  return (
    <article className="feed-post">
      <header className="feed-post-header">
        <img src={post.authorAvatar} alt="" className="feed-avatar" style={{ width: 46, height: 46, flexBasis: 46 }} />
        <div className="feed-post-meta">
          <p className="feed-post-name">{post.authorName}</p>
          <p className="feed-post-time">hace 31 m · <Globe2 size={12} style={{ display: 'inline', verticalAlign: '-2px' }} /></p>
        </div>
        <button type="button" className="feed-post-button" style={{ borderRadius: 999, padding: 8 }} aria-label="Opciones"><MoreVertical size={18} /></button>
      </header>

      {isMusic ? (
        <div className="feed-music">
          <div className="feed-music-row">
            <div className="feed-music-thumb">
              {post.image && <img src={post.image} alt="" />}
              <span className="feed-play"><Play size={22} fill="white" /></span>
            </div>
            <div className="feed-music-copy">
              <p className="feed-music-title">{post.title || post.content}</p>
              <p className="feed-music-subtitle">{post.subtitle}</p>
            </div>
            <span className="feed-music-duration">{post.duration}</span>
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
        <button type="button" onClick={() => onLike(post.id)} className="feed-post-button" style={{ color: post.liked ? '#075db0' : undefined }}><Heart size={18} fill={post.liked ? 'currentColor' : 'none'} />Me gusta</button>
        <button type="button" onClick={() => setCommentsOpen((open) => !open)} className="feed-post-button"><MessageCircle size={18} />Comentar</button>
        <button type="button" className="feed-post-button"><Share2 size={18} />Compartir</button>
      </div>
      {commentsOpen && <div style={{ borderTop: '1px solid #edf0f4', background: '#f7f9fb', padding: '12px 18px', color: '#6d7888', fontSize: 13 }}>Los comentarios aparecerán aquí.</div>}
    </article>
  );
}
