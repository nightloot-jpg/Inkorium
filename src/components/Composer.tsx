import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from "react-dom";
import { supabase } from '../lib/supabase';
import { Session } from '@supabase/supabase-js';
import { 
  Image as ImageIcon, Video, Music, BarChart3, Newspaper, List, Search,
  X, ChevronDown, Globe, Users, Lock, ChevronUp, Loader2, Calendar, MapPin, Palette, AtSign
} from 'lucide-react';
import { ProfileData } from '../main';
import { getDisplayName } from '../utils';

type Post = any; // We'll refine this if needed


function ComposerMenuPortal({
  isOpen,
  onClose,
  triggerRef,
  onSelect
}: {
  isOpen: boolean;
  onClose: () => void;
  triggerRef: React.RefObject<HTMLElement | null>;
  onSelect: (action: string) => void;
}) {
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen && triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      // Position below the button
      setPosition({
        top: rect.bottom + window.scrollY,
        left: rect.left + window.scrollX,
      });
    }
  }, [isOpen, triggerRef]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        menuRef.current &&
        !menuRef.current.contains(e.target as Node) &&
        triggerRef.current &&
        !triggerRef.current.contains(e.target as Node)
      ) {
        onClose();
      }
    }

    function handleScroll() {
       onClose();
    }

    function handleResize() {
        onClose();
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      window.addEventListener('scroll', handleScroll, true); // true to catch scroll in scrollable containers
      window.addEventListener('resize', handleResize);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      window.removeEventListener('scroll', handleScroll, true);
      window.removeEventListener('resize', handleResize);
    };
  }, [isOpen, onClose, triggerRef]);

  if (!isOpen) return null;

  return createPortal(
    <div
      ref={menuRef}
      className="composer-more-menu"
      style={{
        position: 'absolute',
        top: `${position.top}px`,
        left: `${position.left}px`,
        zIndex: 9999,
      }}
    >
      <button type="button" className="disabled" disabled>
        <span>📅 Evento</span>
        <span className="soon-badge">Próximamente</span>
      </button>
      <button type="button" className="disabled" disabled>
        <span>📍 Lugar</span>
        <span className="soon-badge">Próximamente</span>
      </button>
      <button type="button" onClick={() => { onSelect("poll"); }}>
        <span>❓ Pregunta</span>
      </button>
      <button type="button" onClick={() => { onSelect("news"); }}>
        <span>🔗 Enlace</span>
      </button>
      <button type="button" onClick={() => { onSelect("note"); }}>
        <span>📝 Nota</span>
      </button>
      <button type="button" onClick={() => { onSelect("mention"); }}>
        <span>👥 Mencionar personas</span>
      </button>
      <button type="button" onClick={() => { onSelect("background"); }}>
        <span>🎨 Fondo / estilo</span>
      </button>
    </div>,
    document.body
  );
}

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
  
  const [mode, setMode] = useState<"text" | "photo" | "video" | "music" | "poll" | "news" | "event" | "location" | "background" | "more">("text");
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

  useEffect(() => {
    const handleVideoShare = (e: any) => {
      const v = e.detail;
      setMode("music");
      setYoutubeSelected({
        id: { videoId: v.youtube_id, kind: 'youtube#video' },
        snippet: {
          title: v.title,
          description: v.description,
          channelTitle: v.channel,
          thumbnails: { high: { url: v.thumbnail }, default: { url: v.thumbnail } }
        }
      });
      window.scrollTo({ top: 0, behavior: 'smooth' });
    };
    window.addEventListener('open-composer-video', handleVideoShare);
    return () => window.removeEventListener('open-composer-video', handleVideoShare);
  }, []);


  useEffect(() => {
    const handleVideoShare = (e: any) => {
      const v = e.detail;
      setMode("music");
      setYoutubeSelected({
        id: { videoId: v.youtube_id, kind: 'youtube#video' },
        snippet: {
          title: v.title,
          description: v.description,
          channelTitle: v.channel,
          thumbnails: { high: { url: v.thumbnail }, default: { url: v.thumbnail } }
        }
      });
      window.scrollTo({ top: 0, behavior: 'smooth' });
    };
    window.addEventListener('open-composer-video', handleVideoShare);
    return () => window.removeEventListener('open-composer-video', handleVideoShare);
  }, []);


  useEffect(() => {
    const handleVideoShare = (e: any) => {
      const v = e.detail;
      setMode("music");
      setYoutubeSelected({
        id: { videoId: v.youtube_id, kind: 'youtube#video' },
        snippet: {
          title: v.title,
          description: v.description,
          channelTitle: v.channel,
          thumbnails: { high: { url: v.thumbnail }, default: { url: v.thumbnail } }
        }
      });
      window.scrollTo({ top: 0, behavior: 'smooth' });
    };
    window.addEventListener('open-composer-video', handleVideoShare);
    return () => window.removeEventListener('open-composer-video', handleVideoShare);
  }, []);

  
  // Poll
  const [pollOptions, setPollOptions] = useState<string[]>(["", ""]);
  
  // News
  const [newsUrl, setNewsUrl] = useState("");
  const [newsTitle, setNewsTitle] = useState("");

  // Event
  const [eventDate, setEventDate] = useState("");
  const [eventTime, setEventTime] = useState("");
  const [eventLocation, setEventLocation] = useState("");

  // Location
  const [locationName, setLocationName] = useState("");

  // Background / Nota
  const BACKGROUND_STYLES: { id: string; label: string; css: string }[] = [
    { id: 'note', label: 'Nota', css: 'linear-gradient(135deg, #fef9c3, #fde68a)' },
    { id: 'ocean', label: 'Océano', css: 'linear-gradient(135deg, #38bdf8, #0ea5e9)' },
    { id: 'sunset', label: 'Atardecer', css: 'linear-gradient(135deg, #fb923c, #ef4444)' },
    { id: 'purple', label: 'Violeta', css: 'linear-gradient(135deg, #a78bfa, #7c3aed)' },
    { id: 'forest', label: 'Bosque', css: 'linear-gradient(135deg, #34d399, #059669)' },
    { id: 'slate', label: 'Pizarra', css: 'linear-gradient(135deg, #64748b, #1e293b)' },
  ];
  const [bgChoice, setBgChoice] = useState<string>('note');

  // Mencionar personas
  const [mentionPickerOpen, setMentionPickerOpen] = useState(false);
  const [mentionQuery, setMentionQuery] = useState("");
  const [mentionResults, setMentionResults] = useState<any[]>([]);
  const [mentionSearching, setMentionSearching] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const mentionPickerRef = useRef<HTMLDivElement>(null);

  const username = getDisplayName(profile, session.user.email);
  const initials = username.slice(0, 2).toUpperCase();
  const avatarUrl = profile?.avatar_url;

  const isOwnProfile = !targetProfileId || targetProfileId === session.user.id;

  const placeholderText = targetProfileId && !isOwnProfile && targetName
    ? `¿Qué estás pensando, ${targetName}?`
    : `¿Qué estás pensando, ${username}?`;

  const buttonText = targetProfileId && !isOwnProfile ? "Firmar" : "Publicar";

  // Refs for clicking outside
  const moreMenuRef = useRef<HTMLButtonElement>(null);
  const privacyMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (moreMenuRef.current && !moreMenuRef.current.contains(event.target as Node)) {
        setMoreMenuOpen(false);
      }
      if (privacyMenuRef.current && !privacyMenuRef.current.contains(event.target as Node)) {
        setPrivacyMenuOpen(false);
      }
      if (mentionPickerRef.current && !mentionPickerRef.current.contains(event.target as Node)) {
        setMentionPickerOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (!mentionPickerOpen) return;
    const term = mentionQuery.trim();
    if (!term) {
      setMentionResults([]);
      return;
    }
    let cancelled = false;
    setMentionSearching(true);
    const timer = window.setTimeout(async () => {
      const { data } = await supabase
        .from("profiles")
        .select("id, username, full_name, avatar_url")
        .ilike("username", `%${term}%`)
        .neq("id", session.user.id)
        .limit(6);
      if (!cancelled) {
        setMentionResults(data || []);
        setMentionSearching(false);
      }
    }, 250);
    return () => { cancelled = true; window.clearTimeout(timer); };
  }, [mentionQuery, mentionPickerOpen, session.user.id]);

  function insertMention(user: any) {
    const handle = `@${user.username || getDisplayName(user, "")} `;
    const ta = textareaRef.current;
    if (ta) {
      const start = ta.selectionStart ?? draft.length;
      const end = ta.selectionEnd ?? draft.length;
      const newDraft = draft.slice(0, start) + handle + draft.slice(end);
      setDraft(newDraft);
      requestAnimationFrame(() => {
        ta.focus();
        const pos = start + handle.length;
        ta.setSelectionRange(pos, pos);
      });
    } else {
      setDraft(draft + handle);
    }
    setMentionPickerOpen(false);
    setMentionQuery("");
    setMentionResults([]);
  }

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
    } else if (mode === "event") {
        if (!contentText) {
            setError("Escribe un título para el evento.");
            setPublishing(false);
            return;
        }
        if (!eventDate) {
            setError("Selecciona una fecha para el evento.");
            setPublishing(false);
            return;
        }
        media_data = { type: "event", date: eventDate, time: eventTime || null, location: eventLocation.trim() || null };
    } else if (mode === "location") {
        if (!locationName.trim()) {
            setError("Escribe el nombre del lugar.");
            setPublishing(false);
            return;
        }
        media_data = { type: "location", name: locationName.trim() };
    } else if (mode === "background") {
        if (!contentText) {
            setError("Escribe algo de texto para tu nota.");
            setPublishing(false);
            return;
        }
        media_data = { type: "background", style: bgChoice };
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
      setEventDate("");
      setEventTime("");
      setEventLocation("");
      setLocationName("");
      setBgChoice('note');
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
        <div className="composer-avatar">
          {avatarUrl ? <img src={avatarUrl} alt={username} /> : <div className="initials">{initials}</div>}
        </div>
        <textarea
          ref={textareaRef}
          className="composer-input"
          value={draft}
          onChange={handleInput}
          placeholder={mode === "poll" ? "Haz una pregunta..." : mode === "event" ? "Título del evento..." : placeholderText}
          rows={1}
        />
      </div>

      {mentionPickerOpen && (
          <div className="mention-picker" ref={mentionPickerRef}>
              <div className="mention-picker-search">
                  <AtSign size={14} />
                  <input
                      type="text"
                      autoFocus
                      placeholder="Buscar personas..."
                      value={mentionQuery}
                      onChange={(e) => setMentionQuery(e.target.value)}
                  />
              </div>
              {mentionSearching && <div className="mention-picker-empty">Buscando...</div>}
              {!mentionSearching && mentionQuery.trim() && mentionResults.length === 0 && (
                  <div className="mention-picker-empty">Sin resultados</div>
              )}
              {mentionResults.map((u) => (
                  <button type="button" key={u.id} className="mention-picker-item" onClick={() => insertMention(u)}>
                      <div className="avatar tiny" style={{ overflow: 'hidden' }}>
                        {u.avatar_url ? <img src={u.avatar_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : (u.username || '?').slice(0,2).toUpperCase()}
                      </div>
                      <span>{getDisplayName(u, "")}</span>
                  </button>
              ))}
          </div>
      )}
      
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

      {mode === "event" && (
          <div className="composer-extended event-mode">
              <div className="event-mode-row">
                  <label>
                      <span>Fecha</span>
                      <input type="date" value={eventDate} onChange={(e) => setEventDate(e.target.value)} />
                  </label>
                  <label>
                      <span>Hora (opcional)</span>
                      <input type="time" value={eventTime} onChange={(e) => setEventTime(e.target.value)} />
                  </label>
              </div>
              <input
                  type="text"
                  placeholder="Lugar (opcional)..."
                  value={eventLocation}
                  onChange={(e) => setEventLocation(e.target.value)}
                  style={{marginTop: 8}}
              />
          </div>
      )}

      {mode === "location" && (
          <div className="composer-extended location-mode">
              <div className="location-input-row">
                  <MapPin size={16} style={{ color: 'var(--primary)', flexShrink: 0 }} />
                  <input
                      type="text"
                      placeholder="¿Dónde estás?"
                      value={locationName}
                      onChange={(e) => setLocationName(e.target.value)}
                  />
              </div>
          </div>
      )}

      {mode === "background" && (
          <div className="composer-extended background-mode">
              <div
                  className="background-preview"
                  style={{ background: BACKGROUND_STYLES.find(s => s.id === bgChoice)?.css }}
              >
                  {draft.trim() || (bgChoice === 'note' ? 'Escribe tu nota...' : 'Escribe algo...')}
              </div>
              <div className="background-swatches">
                  {BACKGROUND_STYLES.map(s => (
                      <button
                          type="button"
                          key={s.id}
                          className={`background-swatch ${bgChoice === s.id ? 'active' : ''}`}
                          style={{ background: s.css }}
                          title={s.label}
                          aria-label={s.label}
                          onClick={() => setBgChoice(s.id)}
                      />
                  ))}
              </div>
          </div>
      )}

      {showPrivateSelector && renderPrivateSelector()}

      <div className="new-composer-divider"></div>
      
      <div className="composer-toolbar-container">
          <div className="new-composer-tools">
            <button type="button" className={`composer-tool-btn ${mode === "text" ? 'active' : ''}`} onClick={() => handleModeChange("text")}>
                <Search size={16} /> <span>Estado</span>
            </button>
            <button type="button" className={`composer-tool-btn ${mode === "photo" ? 'active' : ''}`} onClick={() => handleModeChange("photo")}>
                <ImageIcon size={16} /> <span>Foto</span>
            </button>
            <button type="button" className={`composer-tool-btn ${mode === "video" ? 'active' : ''}`} onClick={() => handleModeChange("video")}>
                <Video size={16} /> <span>Vídeo</span>
            </button>
            <button type="button" className={`composer-tool-btn ${mode === "music" ? 'active' : ''}`} onClick={() => handleModeChange("music")}>
                <Music size={16} /> <span>Música</span>
            </button>
            <button type="button" className={`composer-tool-btn ${mode === "poll" ? 'active' : ''}`} onClick={() => handleModeChange("poll")}>
                <BarChart3 size={16} /> <span>Encuesta</span>
            </button>
            <button type="button" className={`composer-tool-btn ${mode === "news" ? 'active' : ''}`} onClick={() => handleModeChange("news")}>
                <Newspaper size={16} /> <span>Noticia</span>
            </button>
            
            <div className="composer-more-wrapper">
                <button
                  type="button"
                  ref={moreMenuRef}
                  className={`composer-tool-btn ${moreMenuOpen ? 'active' : ''}`}
                  onClick={() => setMoreMenuOpen(!moreMenuOpen)}
                  aria-label="Más opciones"
                >
                    <List size={16} /> <span>Más</span> <ChevronDown size={14} style={{marginLeft: -2}}/>
                </button>
                <ComposerMenuPortal
                   isOpen={moreMenuOpen}
                   onClose={() => setMoreMenuOpen(false)}
                   triggerRef={moreMenuRef}
                   onSelect={(action) => {
                     setMoreMenuOpen(false);
                     if (action === "poll") handleModeChange("poll");
                     if (action === "news") handleModeChange("news");
                     if (action === "note") { handleModeChange("background"); setBgChoice('note'); }
                     if (action === "mention") setMentionPickerOpen(true);
                     if (action === "background") handleModeChange("background");
                   }}
                />
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
