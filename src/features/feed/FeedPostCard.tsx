import type { ReactNode } from 'react';
import type { Session } from '@supabase/supabase-js';
import { Heart, MessageCircle, MoreHorizontal, Share2 } from 'lucide-react';

export type FeedPostCardData = {
  id: string;
  text: string;
  time: string;
  likes: number;
  authorName?: string;
  authorAvatarUrl?: string | null;
  author_id: string;
  target_profile_id?: string | null;
  targetName?: string;
  shared_post_id?: string | null;
  originalPost?: {
    text: string;
    authorName: string;
    authorAvatarUrl?: string | null;
    time: string;
    author_id: string;
  };
  commentsCount?: number;
  media_data?: any;
  poll_id?: string;
};

type Props = {
  post: FeedPostCardData;
  session: Session;
  username: string;
  liked: boolean;
  commentsOpen: boolean;
  shareOpen: boolean;
  postMenuOpen: boolean;
  onLike: () => void;
  onComment: () => void;
  onShare: () => void;
  onPostMenu: () => void;
  onDelete: () => void;
  renderUser: ReactNode;
  renderMedia: ReactNode;
  renderShareMenu?: ReactNode;
  renderComments?: ReactNode;
};

export function FeedPostCard({
  post,
  session,
  username,
  liked,
  commentsOpen,
  shareOpen,
  postMenuOpen,
  onLike,
  onComment,
  onShare,
  onPostMenu,
  onDelete,
  renderUser,
  renderMedia,
  renderShareMenu,
  renderComments,
}: Props) {
  return (
    <article className="post panel">
      <div className="post-head">
        <div style={{ position: 'absolute', top: 12, right: 12 }}>
          {post.author_id === session.user.id && (
            <button
              className="post-menu-toggle"
              onClick={onPostMenu}
              aria-label={`Opciones de la publicación de ${post.authorName || username}`}
            >
              <MoreHorizontal size={16} />
            </button>
          )}
          {postMenuOpen && post.author_id === session.user.id && (
            <div className="popover" style={{ top: 24, right: 0, minWidth: 150, zIndex: 10 }}>
              <button
                onClick={onDelete}
                style={{ color: 'var(--error-color,#d32f2f)', textAlign: 'left', width: '100%' }}
              >
                🗑 Eliminar publicación
              </button>
            </div>
          )}
        </div>

        {renderUser}

        <div>
          {post.target_profile_id && post.target_profile_id !== post.author_id ? (
            <span
              className="signature-meta"
              style={{ display: 'block', fontSize: '0.85em', color: 'var(--text-light)' }}
            >
              dejó un mensaje en el tablón de {post.targetName || 'alguien'}
            </span>
          ) : null}
          <span>{post.time} · ◉</span>
        </div>
      </div>

      {post.shared_post_id && post.originalPost && (
        <div style={{ fontSize: '0.85em', color: 'var(--text-light)', marginBottom: 8, marginLeft: 16 }}>
          Compartió una publicación de <strong>{post.originalPost.authorName}</strong>
        </div>
      )}

      {post.media_data?.type !== 'background' && post.text && (
        <p className="post-text">{post.text}</p>
      )}

      {renderMedia}

      {post.shared_post_id && post.originalPost && (
        <div className="shared-post-ref">
          <div className="post-head">
            <strong>{post.originalPost.authorName}</strong>
            <span style={{ fontSize: '0.85em', color: 'var(--text-light)' }}>
              {post.originalPost.time}
            </span>
          </div>
          <p className="post-text">{post.originalPost.text}</p>
        </div>
      )}

      <div className="post-actions" style={{ position: 'relative' }}>
        <button onClick={onLike} className={liked ? 'is-liked' : ''}>
          <Heart size={16} fill={liked ? 'currentColor' : 'none'} /> Me gusta
        </button>
        <button onClick={onComment}>
          <MessageCircle size={16} /> Comentar {post.commentsCount ? `(${post.commentsCount})` : ''}
        </button>
        <button onClick={onShare}>
          <Share2 size={16} /> Compartir
        </button>
        <span
          style={{
            marginLeft: 'auto',
            display: 'flex',
            alignItems: 'center',
            fontSize: '0.85em',
            color: 'var(--text-light)',
          }}
        >
          <Heart size={14} style={{ display: 'inline', verticalAlign: 'middle', marginRight: 4, opacity: 0.7 }} />
          {post.likes}
        </span>
        {shareOpen ? renderShareMenu : null}
      </div>

      {commentsOpen ? renderComments : null}
    </article>
  );
}
