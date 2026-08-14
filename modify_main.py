import re

with open('src/main.tsx', 'r') as f:
    content = f.read()

# 1. Update Post type
content = content.replace(
    'type Post = { id: string; text: string; time: string; likes: number; authorName?: string; author_id: string };',
    'type Post = { id: string; text: string; time: string; likes: number; authorName?: string; author_id: string; target_profile_id?: string | null };'
)

# 2. Extract FeedComposer
feed_composer_code = """
function FeedComposer({ session, username, onPublish, targetProfileId }: { session: Session; username: string; onPublish: (post: Post) => void; targetProfileId?: string }) {
  const [draft, setDraft] = useState("");
  const [publishing, setPublishing] = useState(false);
  const [error, setError] = useState("");

  async function publish(event: FormEvent) {
    event.preventDefault();
    const content = draft.trim();
    if (!content || publishing) return;
    setPublishing(true);
    setError("");
    const { data, error: insertError } = await supabase.from("posts").insert({
      author_id: session.user.id,
      content,
      visibility: "public",
      target_profile_id: targetProfileId || null
    }).select("id, content, created_at").single();

    if (insertError) {
      setError(insertError.message);
    } else if (data) {
      onPublish({
        id: data.id,
        text: data.content ?? content,
        time: "ahora",
        likes: 0,
        authorName: username,
        author_id: session.user.id,
        target_profile_id: targetProfileId || null
      });
      setDraft("");
    }
    setPublishing(false);
  }

  return (
    <section className="composer panel">
      <div className="composer-row">
        <div className="avatar">{username[0].toUpperCase()}</div>
        <input value={draft} onChange={(e) => setDraft(e.target.value)} placeholder={`Que estas pensando, ${username}?`} />
      </div>
      <div className="composer-tools">
        <button>▧ Estado</button><button>▣ Foto</button><button>▹ Video</button><button>♫ Musica</button><button>▧ Encuesta</button><button>▤ Noticia</button><button>☷ Mas⌄</button>
      </div>
      <div className="composer-footer">
        <span>◉ Publico⌄</span>
        <button className="publish" onClick={publish} disabled={publishing}>{publishing ? "Guardando..." : "Publicar"}</button>
      </div>
      {error && <p className="message">{error}</p>}
    </section>
  );
}

function SignatureComposer({ session, targetName, targetProfileId, onPublish }: { session: Session; targetName: string; targetProfileId: string; onPublish: (post: Post) => void }) {
  const [expanded, setExpanded] = useState(false);
  const [draft, setDraft] = useState("");
  const [publishing, setPublishing] = useState(false);
  const [error, setError] = useState("");

  async function publish(event: FormEvent) {
    event.preventDefault();
    const content = draft.trim();
    if (!content || publishing) return;
    setPublishing(true);
    setError("");
    const { data, error: insertError } = await supabase.from("posts").insert({
      author_id: session.user.id,
      content,
      visibility: "public",
      target_profile_id: targetProfileId
    }).select("id, content, created_at").single();

    if (insertError) {
      setError(insertError.message);
    } else if (data) {
      // Need a way to get the author name if we can, but we can default to session username
      onPublish({
        id: data.id,
        text: data.content ?? content,
        time: "ahora",
        likes: 0,
        authorName: "Tú", // Will be rendered by UserLink properly if author_id is used
        author_id: session.user.id,
        target_profile_id: targetProfileId
      });
      setDraft("");
      setExpanded(false);
    }
    setPublishing(false);
  }

  if (!expanded) {
    return (
      <div className="signature-prompt panel" onClick={() => setExpanded(true)} style={{ cursor: "text", padding: "12px", color: "var(--text-light)" }}>
        Escribe en el tablón de {targetName}...
      </div>
    );
  }

  return (
    <form className="signature-composer panel" onSubmit={publish} style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
      <div className="editor-toolbar" style={{ display: "flex", gap: "4px", paddingBottom: "8px", borderBottom: "1px solid var(--border)", flexWrap: "wrap" }}>
        <button type="button" onClick={() => document.execCommand('bold')} title="Negrita"><b>B</b></button>
        <button type="button" onClick={() => document.execCommand('italic')} title="Cursiva"><i>I</i></button>
        <button type="button" onClick={() => document.execCommand('underline')} title="Subrayado"><u>U</u></button>
        <span style={{ borderLeft: "1px solid var(--border)", margin: "0 4px" }}></span>
        <button type="button" onClick={() => document.execCommand('justifyLeft')} title="Izquierda">▤</button>
        <button type="button" onClick={() => document.execCommand('justifyCenter')} title="Centro">▥</button>
        <span style={{ borderLeft: "1px solid var(--border)", margin: "0 4px" }}></span>
        <button type="button" title="Emojis">😀</button>
        <button type="button" title="Enlace">🔗</button>
        <button type="button" title="Dibujar">🖌️</button>
      </div>
      <div
        contentEditable
        className="rich-editor"
        style={{ minHeight: "80px", outline: "none", padding: "8px 0" }}
        onInput={(e) => setDraft(e.currentTarget.innerHTML)}
        placeholder={`Escribe en el tablón de ${targetName}...`}
      />
      {error && <p className="message">{error}</p>}
      <div className="composer-footer" style={{ display: "flex", justifyContent: "flex-end", gap: "8px", marginTop: "8px" }}>
        <button type="button" className="text-button" onClick={() => setExpanded(false)}>Cancelar</button>
        <button type="submit" className="primary-button" disabled={publishing || !draft.trim()}>{publishing ? "Firmando..." : "Firmar"}</button>
      </div>
    </form>
  );
}
"""

with open('src/main.tsx', 'w') as f:
    f.write(content)
