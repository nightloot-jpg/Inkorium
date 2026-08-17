import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { Session } from '@supabase/supabase-js';
import { 
  Image as ImageIcon, Video, Music, BarChart3, Newspaper, List, Search,
  X, ChevronDown, Globe, Users, Lock, ChevronUp, Loader2
} from 'lucide-react';
import { ProfileData } from '../main';
import { getDisplayName } from '../utils';

type Post = any; // We'll refine this if needed

export function Composer({
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
  targetName?: string;
}) {
  const [draft, setDraft] = useState("");
  const [publishing, setPublishing] = useState(false);
  const [error, setError] = useState("");
  
  const [mode, setMode] = useState<"text" | "photo" | "video" | "music" | "poll" | "news" | "more">("text");
  const [moreMenuOpen, setMoreMenuOpen] = useState(false);
  
  // Privacy
  const [privacy, setPrivacy] = useState<"public" | "friends" | "private">("public");
  const [privacyMenuOpen, setPrivacyMenuOpen] = useState(false);
  const [privateUsers, setPrivateUsers] = useState<ProfileData[]>([]);
  const [showPrivateSelector, setShowPrivateSelector] = useState(false);
  
  // Photo
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  
  // Video
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [videoPreview, setVideoPreview] = useState<string | null>(null);
  
  // Music
  const [musicTab, setMusicTab] = useState<'canciones' | 'playlists'>('canciones');
  const [youtubeSearch, setYoutubeSearch] = useState("");
  const [youtubeResults, setYoutubeResults] = useState<any[]>([]);
  const [youtubeSearching, setYoutubeSearching] = useState(false);
  const [youtubeSelected, setYoutubeSelected] = useState<any | null>(null);
  const [youtubeHasKey, setYoutubeHasKey] = useState(!!import.meta.env.VITE_YOUTUBE_API_KEY);
  
  // Poll
  const [pollOptions, setPollOptions] = useState<string[]>(["", ""]);
  
  // News
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

  // Refs for clicking outside
  const moreMenuRef = useRef<HTMLDivElement>(null);
  const privacyMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (moreMenuRef.current && !moreMenuRef.current.contains(event.target as Node)) {
        setMoreMenuOpen(false);
      }
      if (privacyMenuRef.current && !privacyMenuRef.current.contains(event.target as Node)) {
        setPrivacyMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  async function searchYoutube(e: React.FormEvent) {
    e.preventDefault();
    if (!youtubeSearch.trim() || !youtubeHasKey) return;
    setYoutubeSearching(true);
    setError("");
    try {
      const typeParam = musicTab === 'playlists' ? 'playlist' : 'video';
      const maxResults = 10;
      const res = await fetch(`https://www.googleapis.com/youtube/v3/search?part=snippet&q=${encodeURIComponent(youtubeSearch)}&type=${typeParam}&maxResults=${maxResults}&key=${import.meta.env.VITE_YOUTUBE_API_KEY}`);
      if (!res.ok) throw new Error("Error en la API de YouTube");
      const data = await res.json();
      setYoutubeResults(data.items || []);
    } catch (err: any) {
      setError(err.message);
      setYoutubeResults([]);
    } finally {
      setYoutubeSearching(false);
    }
  }

  function handleInput(e: React.ChangeEvent<HTMLTextAreaElement>) {
    setDraft(e.target.value);
    e.target.style.height = 'auto';
    e.target.style.height = (e.target.scrollHeight) + 'px';
  }

  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setPhotoFile(file);
      setPhotoPreview(URL.createObjectURL(file));
    }
  };

  const handleVideoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (!file.type.startsWith('video/')) {
        setError("Por favor, selecciona un archivo de vídeo válido.");
        return;
      }
      if (file.size > 100 * 1024 * 1024) { // 100MB limit for example
        setError("El vídeo es demasiado grande. El límite es 100MB.");
        return;
      }
      setVideoFile(file);
      setVideoPreview(URL.createObjectURL(file));
    }
  };

  const removePhoto = () => {
    setPhotoFile(null);
    setPhotoPreview(null);
  };

  const removeVideo = () => {
    setVideoFile(null);
    setVideoPreview(null);
  };

  async function publish(event: React.FormEvent) {
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
          setError("Error al subir foto: " + uploadError.message);
          setPublishing(false);
          return;
        }
        const { data: publicData } = supabase.storage.from("post-media").getPublicUrl(path);
        media_data = { type: "photo", url: publicData.publicUrl };
    } else if (mode === "video" && videoFile) {
        const extension = videoFile.name.split(".").pop()?.toLowerCase() || "mp4";
        const path = `${session.user.id}/video-${Date.now()}.${extension}`;
        const { error: uploadError } = await supabase.storage.from("post-media").upload(path, videoFile, { cacheControl: "3600", upsert: true, contentType: videoFile.type });
        if (uploadError) {
          setError("Error al subir vídeo: " + uploadError.message);
          setPublishing(false);
          return;
        }
        const { data: publicData } = supabase.storage.from("post-media").getPublicUrl(path);
        media_data = { type: "video", url: publicData.publicUrl };
    } else if (mode === "music" && youtubeSelected) {
        const isPlaylist = youtubeSelected.id.kind === 'youtube#playlist';
        media_data = { 
            type: isPlaylist ? "youtube_playlist" : "youtube_song",
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

    // Prepare visibility
    const finalVisibility = privacy;

    const { data, error: submitError } = await supabase.from("posts").insert({
      author_id: session.user.id,
      content: contentText,
      visibility: finalVisibility,
      target_profile_id: targetProfileId ? targetProfileId : null,
      media_data,
      poll_id
    }).select("id, content, created_at, media_data, poll_id, visibility").single();

    if (submitError) {
      console.error("Error al publicar:", submitError);
      setError(submitError.message || "Error al publicar");
      setPublishing(false);
      return;
    }

    if (data && finalVisibility === 'private' && privateUsers.length > 0) {
        const visInserts = privateUsers.map(u => ({ post_id: data.id, user_id: u.id }));
        const { error: visError } = await supabase.from("post_visibility_users").insert(visInserts);
        if (visError) {
            console.error("Error al guardar privacidad privada:", visError);
        }
    }

    if (data) {
      onPublish({
        id: data.id,
        text: data.content ?? contentText,
        time: "ahora",
        likes: 0,
        authorName: username,
        author_id: session.user.id,
        authorAvatarUrl: avatarUrl,
        commentsCount: 0,
        media_data: data.media_data,
        poll_id: data.poll_id
      });
      // Reset composer
      setDraft("");
      setMode("text");
      setPhotoFile(null);
      setPhotoPreview(null);
      setVideoFile(null);
      setVideoPreview(null);
      setYoutubeSelected(null);
      setPollOptions(["", ""]);
      setNewsUrl("");
      setNewsTitle("");
      const ta = document.querySelector(".composer-input") as HTMLTextAreaElement;
      if (ta) ta.style.height = "auto";
    }
    setPublishing(false);
  }

  const renderPrivacySelector = () => {
      const getIcon = () => {
          if (privacy === 'public') return <Globe size={16} />;
          if (privacy === 'friends') return <Users size={16} />;
          return <Lock size={16} />;
      };
      
      const getLabel = () => {
          if (privacy === 'public') return 'Público';
          if (privacy === 'friends') return 'Amigos';
          return 'Privado';
      };

      return (
          <div className="new-composer-privacy" ref={privacyMenuRef}>
              <div 
                  className="privacy-trigger" 
                  onClick={() => setPrivacyMenuOpen(!privacyMenuOpen)}
              >
                  {getIcon()} {getLabel()} {privacyMenuOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
              </div>
              {privacyMenuOpen && (
                  <div className="privacy-dropdown">
                      <button type="button" onClick={() => { setPrivacy('public'); setPrivacyMenuOpen(false); setShowPrivateSelector(false); }}>
                          <Globe size={16} />
                          <div className="privacy-option-text">
                              <strong>Público</strong>
                              <small>Todos pueden ver el post</small>
                          </div>
                      </button>
                      <button type="button" onClick={() => { setPrivacy('friends'); setPrivacyMenuOpen(false); setShowPrivateSelector(false); }}>
                          <Users size={16} />
                          <div className="privacy-option-text">
                              <strong>Amigos</strong>
                              <small>Solo tus amigos</small>
                          </div>
                      </button>
                      <button type="button" onClick={() => { setPrivacy('private'); setPrivacyMenuOpen(false); setShowPrivateSelector(true); }}>
                          <Lock size={16} />
                          <div className="privacy-option-text">
                              <strong>Privado</strong>
                              <small>Tú y personas específicas</small>
                          </div>
                      </button>
                  </div>
              )}
          </div>
      );
  };

  const renderPrivateSelector = () => {
      if (!showPrivateSelector || privacy !== 'private') return null;
      // Esto es una maqueta del selector de personas privadas para Inkorium
      return (
          <div className="private-users-selector">
              <strong>¿Quién puede verlo?</strong>
              <p style={{fontSize: '0.85em', color: 'var(--text-light)', margin: '4px 0 12px 0'}}>Busca y selecciona las personas que podrán ver este post.</p>
              
              <div className="private-users-search">
                  <input type="text" placeholder="Buscar personas..." />
              </div>
              
              <div className="private-users-list">
                  {/* Aquí idealmente buscaríamos en supabase, pero como mock o para dejarlo preparado: */}
                  <p style={{fontSize: '0.85em', color: 'var(--text-light)', padding: '10px 0', textAlign: 'center'}}>
                      (Funcionalidad de búsqueda en desarrollo. El post se guardará como privado.)
                  </p>
              </div>
              
              <div className="private-users-actions" style={{textAlign: 'right', marginTop: '12px'}}>
                  <button type="button" className="btn-primary" onClick={() => setShowPrivateSelector(false)} style={{padding: '6px 16px', borderRadius: '4px', border: 'none', background: 'var(--primary)', color: 'white'}}>Guardar</button>
              </div>
          </div>
      );
  };

  const handleModeChange = (newMode: typeof mode) => {
      setMode(newMode);
      setMoreMenuOpen(false);
  };

  return (
    <section className="composer-container panel">
      <div className="composer-top">
        <div className="avatar composer-avatar" style={{ overflow: 'hidden' }}>
          {avatarUrl ? <img src={avatarUrl} alt={username} style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} /> : initials}
        </div>
        <textarea
          className="composer-input"
          value={draft}
          onChange={handleInput}
          placeholder={mode === "poll" ? "Haz una pregunta..." : placeholderText}
          rows={1}
        />
      </div>
      
      {mode === "photo" && (
          <div className="composer-extended photo-mode">
              {!photoPreview ? (
                  <div className="file-upload-box">
                      <input type="file" id="photo-upload" accept="image/*" onChange={handlePhotoSelect} />
                      <label htmlFor="photo-upload">
                          <ImageIcon size={24} />
                          <span>Seleccionar imagen</span>
                      </label>
                  </div>
              ) : (
                  <div
                      className="composer-photo-preview"
                      style={{
                          width: '100%',
                          maxWidth: '100%',
                          height: '350px',
                          maxHeight: '350px',
                          overflow: 'hidden',
                          position: 'relative',
                          boxSizing: 'border-box',
                          background: '#000',
                          borderRadius: '8px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          marginBottom: '12px'
                      }}
                  >
                      <img
                          src={photoPreview}
                          alt="Preview"
                          className="composer-photo-preview-image"
                          style={{
                              display: 'block',
                              width: '100%',
                              height: '100%',
                              maxWidth: '100%',
                              maxHeight: '100%',
                              objectFit: 'contain'
                          }}
                      />
                      <button type="button" className="composer-photo-preview-remove remove-btn" onClick={removePhoto}><X size={16}/></button>
                  </div>
              )}
          </div>
      )}

      {mode === "video" && (
          <div className="composer-extended video-mode">
              {!videoPreview ? (
                  <div className="file-upload-box">
                      <input type="file" id="video-upload" accept="video/*" onChange={handleVideoSelect} />
                      <label htmlFor="video-upload">
                          <Video size={24} />
                          <span>Sube un vídeo desde tu dispositivo</span>
                      </label>
                  </div>
              ) : (
                  <div
                      className="composer-video-preview"
                      style={{
                          width: '100%',
                          maxWidth: '100%',
                          height: '350px',
                          maxHeight: '350px',
                          overflow: 'hidden',
                          position: 'relative',
                          boxSizing: 'border-box',
                          background: '#000',
                          borderRadius: '8px',
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          justifyContent: 'center',
                          marginBottom: '12px'
                      }}
                  >
                      <video
                          src={videoPreview}
                          controls
                          className="composer-video-preview-media"
                          style={{
                              display: 'block',
                              width: '100%',
                              height: '100%',
                              maxWidth: '100%',
                              maxHeight: '100%',
                              objectFit: 'contain'
                          }}
                      />
                      <div className="video-info">
                          <span>{videoFile?.name}</span>
                          <span style={{opacity: 0.7}}>{((videoFile?.size || 0) / (1024*1024)).toFixed(2)} MB</span>
                      </div>
                      <button type="button" className="composer-video-preview-remove remove-btn" onClick={removeVideo}><X size={16}/></button>
                  </div>
              )}
          </div>
      )}

      {mode === "music" && (
          <div className="composer-extended music-mode">
              <div className="music-tabs">
                  <button type="button" className={musicTab === 'canciones' ? 'active' : ''} onClick={() => setMusicTab('canciones')}>Canciones</button>
                  <button type="button" className={musicTab === 'playlists' ? 'active' : ''} onClick={() => setMusicTab('playlists')}>Playlists</button>
              </div>
              
              {!youtubeSelected ? (
                  <div className="music-search-container">
                      <form onSubmit={searchYoutube} className="music-search-form">
                          <input 
                              type="text" 
                              placeholder={`Buscar ${musicTab === 'canciones' ? 'canciones o artistas' : 'playlists'}...`} 
                              value={youtubeSearch}
                              onChange={(e) => setYoutubeSearch(e.target.value)}
                          />
                          <button type="submit" disabled={!youtubeSearch.trim() || youtubeSearching}>
                              {youtubeSearching ? <Loader2 size={16} className="spin" /> : <Search size={16} />}
                          </button>
                      </form>
                      
                      {youtubeResults.length > 0 && (
                          <div className="music-results">
                              {youtubeResults.map((item) => (
                                  <button type="button" key={item.id.videoId || item.id.playlistId} className="music-result-item" onClick={() => setYoutubeSelected(item)}>
                                      <img src={item.snippet.thumbnails?.default?.url} alt="" />
                                      <div className="music-result-info">
                                          <strong>{item.snippet.title}</strong>
                                          <span>{item.snippet.channelTitle}</span>
                                      </div>
                                  </button>
                              ))}
                          </div>
                      )}
                      
                      {!youtubeHasKey && (
                          <p style={{color: 'red', fontSize: '0.85em', marginTop: 8}}>YouTube API Key no configurada.</p>
                      )}
                  </div>
              ) : (
                  <div className="music-selected">
                      <img src={youtubeSelected.snippet.thumbnails?.high?.url || youtubeSelected.snippet.thumbnails?.default?.url} alt="" />
                      <div className="music-selected-info">
                          <strong>{youtubeSelected.snippet.title}</strong>
                          <span>{youtubeSelected.snippet.channelTitle}</span>
                      </div>
                      <button type="button" className="remove-btn" onClick={() => setYoutubeSelected(null)}><X size={16}/></button>
                  </div>
              )}
          </div>
      )}

      {mode === "poll" && (
          <div className="composer-extended poll-mode">
              {pollOptions.map((opt, i) => (
                  <div key={i} className="poll-option-input">
                      <input 
                          type="text" 
                          placeholder={`Opción ${i + 1}`} 
                          value={opt} 
                          onChange={(e) => {
                              const newOpts = [...pollOptions];
                              newOpts[i] = e.target.value;
                              setPollOptions(newOpts);
                          }}
                      />
                      {pollOptions.length > 2 && (
                          <button type="button" onClick={() => {
                              const newOpts = pollOptions.filter((_, idx) => idx !== i);
                              setPollOptions(newOpts);
                          }}><X size={14}/></button>
                      )}
                  </div>
              ))}
              {pollOptions.length < 10 && (
                  <button type="button" className="text-button add-option-btn" onClick={() => setPollOptions([...pollOptions, ""])}>+ Añadir opción</button>
              )}
          </div>
      )}

      {mode === "news" && (
          <div className="composer-extended news-mode">
              <input 
                  type="text" 
                  placeholder="URL de la noticia..." 
                  value={newsUrl} 
                  onChange={(e) => setNewsUrl(e.target.value)} 
                  style={{marginBottom: 8}}
              />
              <input 
                  type="text" 
                  placeholder="Título de la noticia (opcional)..." 
                  value={newsTitle} 
                  onChange={(e) => setNewsTitle(e.target.value)} 
              />
          </div>
      )}

      {showPrivateSelector && renderPrivateSelector()}

      <div className="new-composer-divider"></div>
      
      <div className="composer-toolbar-container">
          <div className="new-composer-tools">
            <button type="button" className={`composer-tool-btn ${mode === "text" ? 'active' : ''}`} onClick={() => handleModeChange("text")}>
                <Search size={18} /> Estado
            </button>
            <button type="button" className={`composer-tool-btn ${mode === "photo" ? 'active' : ''}`} onClick={() => handleModeChange("photo")}>
                <ImageIcon size={18} /> Foto
            </button>
            <button type="button" className={`composer-tool-btn ${mode === "video" ? 'active' : ''}`} onClick={() => handleModeChange("video")}>
                <Video size={18} /> Vídeo
            </button>
            <button type="button" className={`composer-tool-btn ${mode === "music" ? 'active' : ''}`} onClick={() => handleModeChange("music")}>
                <Music size={18} /> Música
            </button>
            <button type="button" className={`composer-tool-btn ${mode === "poll" ? 'active' : ''}`} onClick={() => handleModeChange("poll")}>
                <BarChart3 size={18} /> Encuesta
            </button>
            <button type="button" className={`composer-tool-btn ${mode === "news" ? 'active' : ''}`} onClick={() => handleModeChange("news")}>
                <Newspaper size={18} /> Noticia
            </button>
            
            <div className="composer-more-wrapper" ref={moreMenuRef}>
                <button type="button" className="composer-tool-btn" onClick={() => setMoreMenuOpen(!moreMenuOpen)} aria-label="Más opciones">
                    <List size={18} /> <ChevronDown size={14} style={{marginLeft: -2}}/>
                </button>
                {moreMenuOpen && (
                    <div className="composer-more-menu">
                        <button type="button" onClick={() => { handleModeChange("text"); }}>📅 Evento <span className="soon-badge">Próximamente</span></button>
                        <button type="button" onClick={() => { handleModeChange("text"); }}>📍 Lugar <span className="soon-badge">Próximamente</span></button>
                        <button type="button" onClick={() => { handleModeChange("poll"); }}>💭 Pregunta</button>
                        <button type="button" onClick={() => { handleModeChange("news"); }}>🔗 Enlace</button>
                        <button type="button" onClick={() => { handleModeChange("text"); }}>📝 Artículo <span className="soon-badge">Próximamente</span></button>
                        <button type="button" onClick={() => { handleModeChange("text"); }}>🎁 Recomendación <span className="soon-badge">Próximamente</span></button>
                    </div>
                )}
            </div>
          </div>
      </div>
      
      <div className="new-composer-divider"></div>
      
      <div className="new-composer-footer">
        {renderPrivacySelector()}
        <button className="new-composer-publish" onClick={publish} disabled={publishing || (mode === "text" && !draft.trim())}>
          {publishing ? "Publicando..." : buttonText}
        </button>
      </div>
      
      {error && <p className="message" style={{marginTop: 8, padding: '8px 12px', background: 'rgba(255,0,0,0.05)', color: 'red', borderRadius: 6, fontSize: '0.9em'}}>{error}</p>}
    </section>
  );
}
