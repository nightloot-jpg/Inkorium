import re

with open('src/main.tsx', 'r') as f:
    content = f.read()

# We need to find the Composer component and inject states for new features.
composer_code = re.search(r'function Composer\(.*?\) \{.*?(?=function CommentsSection)', content, re.DOTALL).group(0)

# Replace the component
new_composer = """
function Composer({
  session,
  profile,
  onPublish,
  targetProfileId,
  targetName
}: {
  session: Session;
  profile: ProfileData | null;
  onPublish: (post: Post) => void;
  targetProfileId?: string;
  targetName?: string
}) {
  const [draft, setDraft] = useState("");
  const [publishing, setPublishing] = useState(false);
  const [error, setError] = useState("");
  
  const [mode, setMode] = useState<"text" | "photo" | "video" | "music" | "poll" | "news">("text");
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  
  const [videoUrl, setVideoUrl] = useState("");
  
  const [youtubeSearch, setYoutubeSearch] = useState("");
  const [youtubeResults, setYoutubeResults] = useState<any[]>([]);
  const [youtubeSearching, setYoutubeSearching] = useState(false);
  const [youtubeSelected, setYoutubeSelected] = useState<any | null>(null);
  const [youtubeHasKey, setYoutubeHasKey] = useState(!!import.meta.env.VITE_YOUTUBE_API_KEY);
  
  const [pollOptions, setPollOptions] = useState<string[]>(["", ""]);
  
  const [newsUrl, setNewsUrl] = useState("");
  const [newsTitle, setNewsTitle] = useState("");

  const username = getDisplayName(profile, session.user.email);
  const initials = username.slice(0, 2).toUpperCase();
  const avatarUrl = profile?.avatar_url;

  const isOwnProfile = !targetProfileId || targetProfileId === session.user.id;

  const placeholderText = targetProfileId && !isOwnProfile && targetName
    ? `¿Qué estás pensando, ${targetName}?`
    : `¿Qué estás pensando, ${username}?`;

  const buttonText = targetProfileId && !isOwnProfile ? "Firmar" : "Publicar";

  async function searchYoutube(e: React.FormEvent) {
    e.preventDefault();
    if (!youtubeSearch.trim() || !youtubeHasKey) return;
    setYoutubeSearching(true);
    setError("");
    try {
      const apiKey = import.meta.env.VITE_YOUTUBE_API_KEY;
      // Search for both videos and playlists
      const res = await fetch(`https://www.googleapis.com/youtube/v3/search?part=snippet&maxResults=10&q=${encodeURIComponent(youtubeSearch)}&type=video,playlist&key=${apiKey}`);
      const data = await res.json();
      if (data.error) throw new Error(data.error.message);
      setYoutubeResults(data.items || []);
    } catch (err: any) {
      setError("Error al buscar en YouTube: " + err.message);
    }
    setYoutubeSearching(false);
  }

  async function handlePhotoSelect(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) { setError("Selecciona una imagen válida."); return; }
    if (file.size > 5 * 1024 * 1024) { setError("La imagen no puede superar los 5 MB."); return; }
    setPhotoFile(file);
    const url = URL.createObjectURL(file);
    setPhotoPreview(url);
    setError("");
  }

  async function publish(event: FormEvent) {
    event.preventDefault();
    const contentText = draft.trim();
    if ((!contentText && mode === "text") || publishing) return;
    setPublishing(true);
    setError("");
    
    let media_data: any = null;
    let poll_id: string | undefined = undefined;
    
    if (mode === "photo" && photoFile) {
        const extension = photoFile.name.split(".").pop()?.toLowerCase() || "jpg";
        const path = `${session.user.id}/post-${Date.now()}.${extension}`;
        const { error: uploadError } = await supabase.storage.from("post-media").upload(path, photoFile, { cacheControl: "3600", upsert: true, contentType: photoFile.type });
        if (uploadError) {
          setError("Error al subir foto (¿existe el bucket 'post-media'?): " + uploadError.message);
          setPublishing(false);
          return;
        }
        const { data: publicData } = supabase.storage.from("post-media").getPublicUrl(path);
        media_data = { type: "photo", url: publicData.publicUrl };
    } else if (mode === "video" && videoUrl) {
        media_data = { type: "video", url: videoUrl };
    } else if (mode === "music" && youtubeSelected) {
        const isPlaylist = youtubeSelected.id.kind === 'youtube#playlist';
        media_data = { 
            type: isPlaylist ? "youtube_playlist" : "youtube_video",
            youtube_id: isPlaylist ? youtubeSelected.id.playlistId : youtubeSelected.id.videoId,
            title: youtubeSelected.snippet.title,
            thumbnail: youtubeSelected.snippet.thumbnails?.high?.url || youtubeSelected.snippet.thumbnails?.default?.url
        };
    } else if (mode === "news" && newsUrl) {
        media_data = { type: "news", url: newsUrl, title: newsTitle };
    } else if (mode === "poll") {
        const validOptions = pollOptions.filter(o => o.trim().length > 0);
        if (validOptions.length < 2) {
            setError("Una encuesta necesita al menos 2 opciones.");
            setPublishing(false);
            return;
        }
        if (!contentText) {
            setError("Debes escribir una pregunta en el estado.");
            setPublishing(false);
            return;
        }
        // Insert poll
        const { data: pollData, error: pollError } = await supabase.from("polls").insert({
            question: contentText,
            author_id: session.user.id
        }).select("id").single();
        
        if (pollError) {
            setError("Error al crear encuesta: " + pollError.message);
            setPublishing(false);
            return;
        }
        poll_id = pollData.id;
        
        // Insert options
        const optionsToInsert = validOptions.map((opt, i) => ({
            poll_id: pollData.id,
            text: opt.trim(),
            order_index: i
        }));
        await supabase.from("poll_options").insert(optionsToInsert);
    }

    const { data, error: submitError } = await supabase.from("posts").insert({
      author_id: session.user.id,
      content: contentText,
      visibility: "public",
      target_profile_id: targetProfileId ? targetProfileId : null,
      media_data,
      poll_id
    }).select("id, content, created_at, media_data, poll_id").single();

    if (submitError) {
      console.error("Error al publicar:", submitError);
      setError(submitError.message || "Error al publicar");
    } else if (data) {
      onPublish({
        id: data.id,
        text: data.content ?? contentText,
        time: "ahora",
        likes: 0,
        authorName: username,
        author_id: session.user.id,
        target_profile_id: targetProfileId ? targetProfileId : null, shared_post_id: null,
        targetName: targetName,
        media_data: data.media_data,
        poll_id: data.poll_id
      });
      setDraft("");
      setMode("text");
      setPhotoFile(null);
      setPhotoPreview(null);
      setVideoUrl("");
      setYoutubeSelected(null);
      setNewsUrl("");
      setNewsTitle("");
      setPollOptions(["", ""]);
    }
    setPublishing(false);
  }

  const handleInput = (e: ChangeEvent<HTMLTextAreaElement>) => {
    setDraft(e.target.value);
    e.target.style.height = 'auto';
    e.target.style.height = `${e.target.scrollHeight}px`;
  };

  return (
    <section className="new-composer panel">
      <div className="new-composer-row">
        <div className="new-composer-avatar">
          {avatarUrl ? <img src={avatarUrl} alt={username} /> : initials}
        </div>
        <textarea
          className="new-composer-input"
          value={draft}
          onChange={handleInput}
          placeholder={mode === "poll" ? "Haz una pregunta..." : placeholderText}
          rows={1}
        />
      </div>
      
      {mode === "photo" && (
          <div style={{padding: '0 16px', marginBottom: 16}}>
              {!photoPreview ? (
                  <div style={{border: '2px dashed var(--border)', padding: 32, textAlign: 'center', borderRadius: 8}}>
                      <label style={{cursor: 'pointer', color: 'var(--primary)'}}>
                          <input type="file" accept="image/*" style={{display: 'none'}} onChange={handlePhotoSelect} />
                          Seleccionar una imagen desde el dispositivo
                      </label>
                  </div>
              ) : (
                  <div style={{position: 'relative'}}>
                      <img src={photoPreview} style={{width: '100%', maxHeight: 400, objectFit: 'contain', borderRadius: 8}} />
                      <button type="button" onClick={() => { setPhotoPreview(null); setPhotoFile(null); }} style={{position: 'absolute', top: 8, right: 8, background: 'rgba(0,0,0,0.6)', color: '#fff', border: 'none', borderRadius: '50%', width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer'}}>
                          <X size={16} />
                      </button>
                  </div>
              )}
          </div>
      )}

      {mode === "video" && (
          <div style={{padding: '0 16px', marginBottom: 16}}>
              <input type="url" value={videoUrl} onChange={e => setVideoUrl(e.target.value)} placeholder="Introduce una URL de vídeo (ej. .mp4)" className="primary-input" style={{width: '100%'}} />
              {videoUrl && <video src={videoUrl} controls style={{width: '100%', marginTop: 16, borderRadius: 8, maxHeight: 300}} />}
          </div>
      )}

      {mode === "news" && (
          <div style={{padding: '0 16px', marginBottom: 16, display: 'flex', flexDirection: 'column', gap: 12}}>
              <input type="text" value={newsTitle} onChange={e => setNewsTitle(e.target.value)} placeholder="Titular de la noticia" className="primary-input" style={{width: '100%'}} />
              <input type="url" value={newsUrl} onChange={e => setNewsUrl(e.target.value)} placeholder="Enlace a la noticia (URL)" className="primary-input" style={{width: '100%'}} />
          </div>
      )}
      
      {mode === "poll" && (
          <div style={{padding: '0 16px', marginBottom: 16, display: 'flex', flexDirection: 'column', gap: 8}}>
              {pollOptions.map((opt, i) => (
                  <div key={i} style={{display: 'flex', gap: 8}}>
                      <input type="text" value={opt} onChange={e => {
                          const newOpts = [...pollOptions];
                          newOpts[i] = e.target.value;
                          setPollOptions(newOpts);
                      }} placeholder={`Opción ${i + 1}`} className="primary-input" style={{flex: 1}} />
                      {pollOptions.length > 2 && (
                          <button type="button" className="icon-button" onClick={() => {
                              setPollOptions(pollOptions.filter((_, idx) => idx !== i));
                          }}><X size={18}/></button>
                      )}
                  </div>
              ))}
              {pollOptions.length < 10 && (
                  <button type="button" className="text-button" onClick={() => setPollOptions([...pollOptions, ""])} style={{alignSelf: 'flex-start'}}>+ Añadir otra opción</button>
              )}
          </div>
      )}

      {mode === "music" && (
          <div style={{padding: '0 16px', marginBottom: 16}}>
              {!youtubeHasKey ? (
                  <div className="message" style={{textAlign: 'left', padding: 16, background: 'rgba(255,0,0,0.1)', color: 'var(--text)', borderRadius: 8}}>
                      <h4 style={{marginTop: 0}}>Falta configurar YouTube Data API v3</h4>
                      <p>Para buscar música real en YouTube, necesitas configurar una API Key en COOLIFY.</p>
                      <ol style={{margin: '8px 0', paddingLeft: 24, fontSize: '0.9em', lineHeight: 1.5}}>
                          <li>Entra en <strong>Google Cloud Console</strong> (console.cloud.google.com).</li>
                          <li>Crea o selecciona tu proyecto.</li>
                          <li>Busca y activa <strong>YouTube Data API v3</strong>.</li>
                          <li>Ve a Credenciales y crea una nueva <strong>API Key</strong>.</li>
                          <li>Entra en tu entorno de <strong>COOLIFY</strong>.</li>
                          <li>Ve a las variables de entorno (Environment Variables) del proyecto de frontend.</li>
                          <li>Añade: <code>VITE_YOUTUBE_API_KEY=tu_clave_aqui</code></li>
                          <li>Haz <strong>Redeploy</strong> de la aplicación en Coolify.</li>
                      </ol>
                  </div>
              ) : !youtubeSelected ? (
                  <div style={{display: 'flex', flexDirection: 'column', gap: 12}}>
                      <form onSubmit={searchYoutube} style={{display: 'flex', gap: 8}}>
                          <input type="text" value={youtubeSearch} onChange={e => setYoutubeSearch(e.target.value)} placeholder="Buscar canciones, vídeos o playlists..." className="primary-input" style={{flex: 1}} />
                          <button type="submit" className="primary-button" disabled={youtubeSearching}>{youtubeSearching ? "Buscando..." : "Buscar"}</button>
                      </form>
                      {youtubeResults.length > 0 && (
                          <div style={{maxHeight: 300, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 8, border: '1px solid var(--border)', borderRadius: 8, padding: 8}}>
                              {youtubeResults.map((item, i) => {
                                  const isPlaylist = item.id.kind === 'youtube#playlist';
                                  return (
                                      <div key={i} style={{display: 'flex', gap: 12, padding: 8, cursor: 'pointer', borderRadius: 6, transition: 'background 0.2s'}} className="hover-bg" onClick={() => setYoutubeSelected(item)}>
                                          <img src={item.snippet.thumbnails?.default?.url} alt="" style={{width: 120, height: 90, objectFit: 'cover', borderRadius: 4}} />
                                          <div style={{flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center'}}>
                                              <strong style={{fontSize: '0.9em', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden'}}>{item.snippet.title}</strong>
                                              <small style={{opacity: 0.6}}>{item.snippet.channelTitle}</small>
                                              <small style={{display: 'inline-block', marginTop: 4, padding: '2px 6px', background: 'var(--border)', borderRadius: 4, fontSize: '0.7em', width: 'fit-content'}}>
                                                  {isPlaylist ? "Playlist" : "Vídeo"}
                                              </small>
                                          </div>
                                      </div>
                                  );
                              })}
                          </div>
                      )}
                  </div>
              ) : (
                  <div style={{position: 'relative', border: '1px solid var(--border)', borderRadius: 8, padding: 12, display: 'flex', gap: 16}}>
                      <img src={youtubeSelected.snippet.thumbnails?.high?.url || youtubeSelected.snippet.thumbnails?.default?.url} style={{width: 160, borderRadius: 8, objectFit: 'cover'}} />
                      <div style={{display: 'flex', flexDirection: 'column', justifyContent: 'center'}}>
                          <strong>{youtubeSelected.snippet.title}</strong>
                          <span style={{opacity: 0.7}}>{youtubeSelected.snippet.channelTitle}</span>
                      </div>
                      <button type="button" onClick={() => setYoutubeSelected(null)} style={{position: 'absolute', top: 8, right: 8, background: 'rgba(0,0,0,0.6)', color: '#fff', border: 'none', borderRadius: '50%', width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer'}}>
                          <X size={16} />
                      </button>
                  </div>
              )}
          </div>
      )}

      <div className="new-composer-tools">
        <button type="button" className={`composer-tool-btn ${mode === "text" ? 'active' : ''}`} onClick={() => setMode("text")}><Search size={18} /> Estado</button>
        <button type="button" className={`composer-tool-btn ${mode === "photo" ? 'active' : ''}`} onClick={() => setMode("photo")}><Image size={18} /> Foto</button>
        <button type="button" className={`composer-tool-btn ${mode === "video" ? 'active' : ''}`} onClick={() => setMode("video")}><Video size={18} /> Vídeo</button>
        <button type="button" className={`composer-tool-btn ${mode === "music" ? 'active' : ''}`} onClick={() => setMode("music")}><Music size={18} /> Música</button>
        <button type="button" className={`composer-tool-btn ${mode === "poll" ? 'active' : ''}`} onClick={() => setMode("poll")}><BarChart3 size={18} /> Encuesta</button>
        <button type="button" className={`composer-tool-btn ${mode === "news" ? 'active' : ''}`} onClick={() => setMode("news")}><Newspaper size={18} /> Noticia</button>
        <button type="button" className="composer-tool-btn"><List size={18} /> Más <ChevronDown size={14} style={{marginLeft: -2}}/></button>
      </div>
      <div className="new-composer-divider"></div>
      <div className="new-composer-footer">
        <div className="new-composer-privacy">
          <Globe size={16} /> Público <ChevronDown size={14} />
        </div>
        <button className="new-composer-publish" onClick={publish} disabled={publishing}>
          {publishing ? "Guardando..." : buttonText}
        </button>
      </div>
      {error && <p className="message">{error}</p>}
    </section>
  );
}
"""

content = content.replace(composer_code, new_composer.strip())

# Need to update rendering in article.post
# Find where article post is rendered, inside <main className="stream">... 
# and also ProfileView
with open('src/main.tsx', 'w') as f:
    f.write(content)

print("Composer updated")
