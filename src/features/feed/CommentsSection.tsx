import { useEffect, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import { Send } from "lucide-react";
import { supabase } from "../../lib/supabase";
import { formatPostTime } from "../../utils";

type Props = { postId: string; session: Session; navigate: (page: "perfil", params?: Record<string, unknown>) => void };

export function CommentsSection({ postId, session, navigate }: Props) {
  const [comments, setComments] = useState<any[]>([]);
  const [newComment, setNewComment] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function loadComments() {
      const { data, error } = await supabase.from("comments").select("id, content, created_at, author_id, profiles!comments_author_id_fkey(username, full_name, avatar_url)").eq("post_id", postId).order("created_at", { ascending: true });
      if (cancelled) return;
      if (!error && data) setComments(data);
      setLoading(false);
    }
    void loadComments();
    return () => { cancelled = true; };
  }, [postId]);

  async function postComment() {
    const text = newComment.trim();
    if (!text) return;
    setNewComment("");
    const { data, error } = await supabase.from("comments").insert({ post_id: postId, author_id: session.user.id, content: text }).select("id, content, created_at, author_id, profiles!comments_author_id_fkey(username, full_name, avatar_url)").single();
    if (!error && data) setComments((current) => [...current, data]);
  }

  return <div className="post-comments">
    {loading ? <p style={{ fontSize: "0.85em", color: "var(--text-light)" }}>Cargando comentarios...</p> : <div className="comment-list">
      {comments.map((comment) => {
        const author = comment.profiles;
        const name = author?.username || author?.full_name || "Usuario";
        return <div key={comment.id} className="comment-item">
          <button onClick={() => navigate("perfil", { userId: comment.author_id })} style={{ border: 0, background: "none", padding: 0, cursor: "pointer", fontWeight: 700 }}>{name}</button>
          <div style={{ flex: 1 }}><div className="comment-content">{comment.content}</div><div className="comment-meta">{formatPostTime(comment.created_at)}</div></div>
        </div>;
      })}
    </div>}
    <div className="comment-input-area">
      <input type="text" placeholder="Escribe un comentario..." value={newComment} onChange={(event) => setNewComment(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter") void postComment(); }} />
      <button onClick={() => void postComment()} disabled={!newComment.trim()} aria-label="Publicar comentario"><Send size={14} /></button>
    </div>
  </div>;
}
