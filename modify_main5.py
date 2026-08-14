import re

with open('/app/src/main.tsx', 'r') as f:
    content = f.read()

# Let's add PostItem component to replace the inline map
# This allows us to handle comments & shares per post without blowing up Feed state

new_components = """
function CommentsSection({ postId, session, navigate }: { postId: string; session: Session; navigate: any }) {
  const [comments, setComments] = useState<any[]>([]);
  const [newComment, setNewComment] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function loadComments() {
      const { data, error } = await supabase
        .from("post_comments")
        .select("id, content, created_at, author_id, profiles(username, full_name, avatar_url)")
        .eq("post_id", postId)
        .order("created_at", { ascending: true });

      if (!cancelled && !error && data) {
        setComments(data);
      }
      if (!cancelled) setLoading(false);
    }
    loadComments();
    return () => { cancelled = true; };
  }, [postId]);

  async function postComment() {
    if (!newComment.trim()) return;
    const txt = newComment.trim();
    setNewComment("");

    const { data, error } = await supabase
      .from("post_comments")
      .insert({ post_id: postId, author_id: session.user.id, content: txt })
      .select("id, content, created_at, author_id, profiles(username, full_name, avatar_url)")
      .single();

    if (!error && data) {
      setComments((prev) => [...prev, data]);
    }
  }

  return (
    <div className="post-comments">
      {loading ? <p style={{fontSize: "0.85em", color: "var(--text-light)"}}>Cargando comentarios...</p> : (
        <div className="comment-list">
          {comments.map(c => {
            const author = c.profiles;
            const name = author.username || author.full_name || "Usuario";
            return (
              <div key={c.id} className="comment-item">
                <UserLink userId={c.author_id} name={name} avatarUrl={author.avatar_url} navigate={navigate} />
                <div style={{flex: 1}}>
                  <div className="comment-content">
                    {c.content}
                  </div>
                  <div className="comment-meta">{formatPostTime(c.created_at)}</div>
                </div>
              </div>
            );
          })}
        </div>
      )}
      <div className="comment-input-area">
        <input
          type="text"
          placeholder="Escribe un comentario..."
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          onKeyDown={(e) => { if(e.key === 'Enter') postComment(); }}
        />
        <button onClick={postComment} disabled={!newComment.trim()}><Send size={14} /></button>
      </div>
    </div>
  );
}

function ShareMenu({ post, session, onClose }: { post: Post; session: Session; onClose: () => void }) {
  const shareUrl = `${window.location.origin}/post/${post.id}`; // Simple URL for now

  async function shareToFeed() {
    onClose();
    await supabase.from("posts").insert({
      author_id: session.user.id,
      content: "", // Can be empty if just sharing
      visibility: "public",
      shared_post_id: post.shared_post_id || post.id // Share original if it's already a share
    });
    // Ideally we'd trigger a reload here, but let's rely on optimistic UI if needed, or just let them see it on refresh
    window.location.reload();
  }

  return (
    <div className="share-menu-popover" style={{right: 16}}>
      <strong>Compartir</strong>
      <button onClick={shareToFeed}><Share2 size={16} /> Compartir en mi feed</button>
      <div style={{height: 1, background: "var(--border)", margin: "4px 0"}} />
      <strong style={{marginTop: 4}}>Compartir fuera de Inkorium</strong>
      <button onClick={() => {
        window.open(`https://api.whatsapp.com/send?text=Mira esta publicación en Inkorium: ${encodeURIComponent(shareUrl)}`);
        onClose();
      }}>WhatsApp</button>
      <button onClick={() => {
        window.open(`sms:?body=Mira esta publicación en Inkorium: ${encodeURIComponent(shareUrl)}`);
        onClose();
      }}>Mensajes</button>
      <button onClick={() => {
        navigator.clipboard.writeText(shareUrl);
        alert("Enlace copiado al portapapeles");
        onClose();
      }}><Copy size={16} /> Copiar enlace</button>
      {navigator.share && (
        <button onClick={() => {
          navigator.share({
            title: 'Publicación en Inkorium',
            text: 'Mira esta publicación en Inkorium',
            url: shareUrl,
          });
          onClose();
        }}>Otras opciones nativas...</button>
      )}
    </div>
  );
}
"""

content = content.replace('function Feed', new_components + '\nfunction Feed')

with open('/app/src/main.tsx', 'w') as f:
    f.write(content)
