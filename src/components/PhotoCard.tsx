import { useState, useEffect } from "react";
import { Heart, MessageCircle } from "lucide-react";
import { supabase } from "../lib/supabase";
import { formatPostTime } from "../utils";

export function PhotoCard({ photo, onClick, session }: { photo: any, onClick: () => void, session: any }) {
  const [likes, setLikes] = useState(0);
  const [comments, setComments] = useState(0);
  const [hasLiked, setHasLiked] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function loadStats() {
      const { count: likeCount } = await supabase.from('photo_likes').select('*', { count: 'exact', head: true }).eq('photo_id', photo.id);
      const { count: commentCount } = await supabase.from('photo_comments').select('*', { count: 'exact', head: true }).eq('photo_id', photo.id);
      const { data: myLike } = await supabase.from('photo_likes').select('id').eq('photo_id', photo.id).eq('user_id', session.user.id).maybeSingle();
      
      if (!cancelled) {
        setLikes(likeCount || 0);
        setComments(commentCount || 0);
        setHasLiked(!!myLike);
      }
    }
    loadStats();
    return () => { cancelled = true; };
  }, [photo.id, session.user.id]);

  async function toggleLike(e: React.MouseEvent) {
    e.stopPropagation();
    if (hasLiked) {
      setHasLiked(false);
      setLikes(l => l - 1);
      await supabase.from('photo_likes').delete().match({ photo_id: photo.id, user_id: session.user.id });
    } else {
      setHasLiked(true);
      setLikes(l => l + 1);
      await supabase.from('photo_likes').insert({ photo_id: photo.id, user_id: session.user.id });
    }
  }

  return (
    <div className="photos-card" onClick={onClick}>
      <div className="photos-card-img-container">
        <img src={photo.url} alt={photo.caption} className="photos-card-img" />
      </div>
      <div className="photos-card-info">
        <p className="photos-card-caption">{photo.caption || "Sin título"}</p>
        <div className="photos-card-meta">
          <span>{formatPostTime(photo.created_at)}</span>
          <div className="photos-card-actions">
            <button onClick={toggleLike} style={{ color: hasLiked ? '#e0245e' : 'inherit' }}>
              <Heart size={16} fill={hasLiked ? '#e0245e' : 'none'} /> {likes > 0 && likes}
            </button>
            <button><MessageCircle size={16} /> {comments > 0 && comments}</button>
          </div>
        </div>
      </div>
    </div>
  );
}
