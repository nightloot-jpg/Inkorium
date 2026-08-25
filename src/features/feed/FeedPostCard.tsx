import type { ReactNode } from 'react';
import type { Session } from '@supabase/supabase-js';
import { Heart, MessageCircle, MoreHorizontal, Share2 } from 'lucide-react';
import './feed-post-card-2026.css';

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
    <article className="post panel feed-post-card">
      <div className="post-head feed-post-card__head">
        <div className="feed-post-card__menu">
          {post.author_id === session.user.id && (
            <button
              className="post-menu-toggle feed-post-card__menu-button"
              onClick={onPostMenu}
              aria-label={`Opciones de la publicación de ${post.authorName || username}`}
            >
              <MoreHorizontal size={16} />
            </button>
          )}
          {postMenuOpen && post.author_id === session.user.id && (
            <div className="popover feed-post-card__menu-popover">
              <button
                onClick={onDelete}
                className="feed-post-card__delete"
              >
                🗑 Eliminar publicación
              </button>
            </div>
          )}
        </div>

        <div className="feed-post-card__user">{renderUser}</div>

        <div className="feed-post-card__meta">
          {post.target_profile_id && post.target_profile_id !== post.author_id ? (
            <span className="signature-meta feed-post-card__signature">
              dejó un mensaje en el tablón de {post.targetName || 'alguien'}
            </span>
          ) : null}
          <span>{post.time} · ◉</span>
        </div>
      </div>

      {post.shared_post_id && post.originalPost && (
        <div className="feed-post-card__shared-label">
          Compartió una publicación de <strong>{post.originalPost.authorName}</strong>
        </div>
      )}

      {post.media_data?.type !== 'background' && post.text && (
        <p className="post-text feed-post-card__text">{post.text}</p>
      )}

      {renderMedia}

      {post.shared_post_id && post.originalPost && (
        <div className="shared-post-ref feed-post-card__shared-post">
          <div className="post-head feed-post-card__shared-head">
            <strong>{post.originalPost.authorName}</strong>
            <span>{post.originalPost.time}</span>
          </div>
          <p className="post-text">{post.originalPost.text}</p>
        </div>
      )}

      <div className="post-actions feed-post-card__actions">
        <button onClick={onLike} className={liked ? 'is-liked' : ''}>
          <Heart size={16} fill={liked ? 'currentColor' : 'none'} /> Me gusta
        </button>
        <button onClick={onComment}>
          <MessageCircle size={16} /> Comentar {post.commentsCount ? `(${post.commentsCount})` : ''}
        </button>
        <button onClick={onShare}>
          <Share2 size={16} /> Compartir
        </button>
        <span className="feed-post-card__likes">
          <Heart size={14} />
          {post.likes}
        </span>
        {shareOpen ? renderShareMenu : null}
      </div>

      {commentsOpen ? renderComments : null}
    </article>
  );
}
