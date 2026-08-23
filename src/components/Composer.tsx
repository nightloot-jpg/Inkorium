import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from "react-dom";
import { supabase } from '../lib/supabase';
import { v4 as uuidv4 } from "uuid";
import { Session } from '@supabase/supabase-js';
import { 
  Image as ImageIcon, Video, Music, BarChart3, Newspaper, List, Search,
  X, ChevronDown, Globe, Users, Lock, ChevronUp, Loader2, Calendar, MapPin, Palette, AtSign
} from 'lucide-react';
import { ProfileData } from '../main';
import { getDisplayName } from '../utils';
import { createR2UploadTicket, uploadToPresignedUrl } from '../lib/r2';

type Post = any;

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
      setPosition({ top: rect.bottom + window.scrollY, left: rect.left + window.scrollX });
    }
  }, [isOpen, triggerRef]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node) && triggerRef.current && !triggerRef.current.contains(e.target as Node)) onClose();
    }
    function handleScroll() { onClose(); }
    function handleResize() { onClose(); }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      window.addEventListener('scroll', handleScroll, true);
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
    <div ref={menuRef} className="composer-more-menu" style={{ position: 'absolute', top: `${position.top}px`, left: `${position.left}px`, zIndex: 9999 }}>
      <button type="button" className="disabled" disabled><span>📅 Evento</span><span className="soon-badge">Próximamente</span></button>
      <button type="button" className="disabled" disabled><span>📍 Lugar</span><span className="soon-badge">Próximamente</span></button>
      <button type="button" onClick={() => onSelect("poll")}><span>❓ Pregunta</span></button>
      <button type="button" onClick={() => onSelect("news")}><span>🔗 Enlace</span></button>
      <button type="button" onClick={() => onSelect("note")}><span>📝 Nota</span></button>
      <button type="button" onClick={() => onSelect("mention")}><span>👥 Mencionar personas</span></button>
      <button type="button" onClick={() => onSelect("background")}><span>🎨 Fondo / estilo</span></button>
    </div>,
    document.body,
  );
}

export function Composer({ session, profile, onPublish, targetProfileId, targetName }: {
  session: Session;
  profile: ProfileData | null;
  onPublish: (post: Post) => void;
  targetProfileId?: string;
  targetName?: string;
}) {
  const [draft, setDraft] = useState("");
  const [publishing, setPublishing] = useState(false);
  const [error, setError] = useState("");
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [mode, setMode] = useState<"text" | "photo" | "video" | "music" | "poll" | "news" | "event" | "location" | "background" | "more">("text");
  const [moreMenuOpen, setMoreMenuOpen] = useState(false);
  const [privacy, setPrivacy] = useState<"public" | "friends" | "private">("public");
  const [privacyMenuOpen, setPrivacyMenuOpen] = useState(false);
  const [privateUsers, setPrivateUsers] = useState<ProfileData[]>([]);
  const [showPrivateSelector, setShowPrivateSelector] = useState(false);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [videoPreview, setVideoPreview] = useState<string | null>(null);
  const [musicTab, setMusicTab] = useState<'canciones' | 'playlists'>('canciones');
  const [youtubeSearch, setYoutubeSearch] = useState("");
  const [youtubeResults, setYoutubeResults] = useState<any[]>([]);
  const [youtubeSearching, setYoutubeSearching] = useState(false);
  const [youtubeSelected, setYoutubeSelected] = useState<any | null>(null);
  const [youtubeHasKey, setYoutubeHasKey] = useState(!!import.meta.env.VITE_YOUTUBE_API_KEY);
  const [pollOptions, setPollOptions] = useState<string[]>(["", ""]);
  const [newsUrl, setNewsUrl] = useState("");
  const [newsTitle, setNewsTitle] = useState("");
  const [eventDate, setEventDate] = useState("");
  const [eventTime, setEventTime] = useState("");
  const [eventLocation, setEventLocation] = useState("");
  const BACKGROUND_STYLES: { id: string; label: string; css: string }[] = [
    { id: 'note', label: 'Nota', css: 'linear-gradient(135deg, #fef9c3, #fde68a)' },
    { id: 'ocean', label: 'Océano', css: 'linear-gradient(135deg, #38bdf8, #0ea5e9)' },
    { id: 'sunset', label: 'Atardecer', css: 'linear-gradient(135deg, #fb923c, #ef4444)' },
    { id: 'purple', label: 'Violeta', css: 'linear-gradient(135deg, #a78bfa, #7c3aed)' },
    { id: 'forest', label: 'Bosque', css: 'linear-gradient(135deg, #34d399, #059669)' },
    { id: 'slate', label: 'Pizarra', css: 'linear-gradient(135deg, #64748b, #1e293b)' },
  ];
  const [bgChoice, setBgChoice] = useState<string>('note');
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
  const placeholderText = targetProfileId && !isOwnProfile && targetName ? `¿Qué estás pensando, ${targetName}?` : `¿Qué estás pensando, ${username}?`;
  const buttonText = targetProfileId && !isOwnProfile ? "Firmar" : "Publicar";
  const moreMenuRef = useRef<HTMLButtonElement>(null);
  const privacyMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleVideoShare = (e: any) => {
      const v = e.detail;
      setMode("music");
      setYoutubeSelected({ id: { videoId: v.youtube_id, kind: 'youtube#video' }, snippet: { title: v.title, description: v.description, channelTitle: v.channel, thumbnails: { high: { url: v.thumbnail }, default: { url: v.thumbnail } } } });
      window.scrollTo({ top: 0, behavior: 'smooth' });
    };
    window.addEventListener('open-composer-video', handleVideoShare);
    return () => window.removeEventListener('open-composer-video', handleVideoShare);
  }, []);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (moreMenuRef.current && !moreMenuRef.current.contains(event.target as Node)) setMoreMenuOpen(false);
      if (privacyMenuRef.current && !privacyMenuRef.current.contains(event.target as Node)) setPrivacyMenuOpen(false);
      if (mentionPickerRef.current && !mentionPickerRef.current.contains(event.target as Node)) setMentionPickerOpen(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (!mentionPickerOpen) return;
    const term = mentionQuery.trim();
    if (!term) { setMentionResults([]); return; }
    let cancelled = false;
    setMentionSearching(true);
    const timer = window.setTimeout(async () => {
      const { data } = await supabase.from("profiles").select("id, username, full_name, avatar_url").ilike("username", `%${term}%`).neq("id", session.user.id).limit(6);
      if (!cancelled) { setMentionResults(data || []); setMentionSearching(false); }
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
      requestAnimationFrame(() => { ta.focus(); const pos = start + handle.length; ta.setSelectionRange(pos, pos); });
    } else setDraft(draft + handle);
    setMentionPickerOpen(false); setMentionQuery(""); setMentionResults([]);
  }

  async function searchYoutube(e: React.FormEvent) {
    e.preventDefault();
    if (!youtubeSearch.trim() || !youtubeHasKey) return;
    setYoutubeSearching(true); setError("");
    try {
      const typeParam = musicTab === 'playlists' ? 'playlist' : 'video';
      const res = await fetch(`https://www.googleapis.com/youtube/v3/search?part=snippet&q=${encodeURIComponent(youtubeSearch)}&type=${typeParam}&maxResults=10&key=${import.meta.env.VITE_YOUTUBE_API_KEY}`);
      if (!res.ok) throw new Error("Error en la API de YouTube");
      const data = await res.json();
      setYoutubeResults(data.items || []);
    } catch (err: any) { setError(err.message); setYoutubeResults([]); }
    finally { setYoutubeSearching(false); }
  }

  function handleInput(e: React.ChangeEvent<HTMLTextAreaElement>) {
    setDraft(e.target.value);
    e.target.style.height = 'auto';
    e.target.style.height = `${e.target.scrollHeight}px`;
  }

  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) return setError("Por favor, selecciona una imagen válida.");
    setPhotoFile(file); setPhotoPreview(URL.createObjectURL(file)); setError("");
  };

  const handleVideoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('video/')) return setError("Por favor, selecciona un archivo de vídeo válido.");
    if (file.size > 1024 * 1024 * 1024) return setError("El vídeo es demasiado grande. El límite es 1GB.");
    setVideoFile(file); setVideoPreview(URL.createObjectURL(file)); setError("");
  };

  const removePhoto = () => { setPhotoFile(null); setPhotoPreview(null); };
  const removeVideo = () => { setVideoFile(null); setVideoPreview(null); };

  async function publish(event: React.FormEvent) {
    event.preventDefault();
    const contentText = draft.trim();
    if ((!contentText && mode === "text") || publishing) return;
    setPublishing(true); setError("");
    let media_data: any = null;
    let poll_id: string | undefined;

    try {
      if (mode === "photo" && photoFile) {
        if (photoFile.size > 60 * 1024 * 1024) throw new Error("La foto supera el límite de 60MB.");
        const ticket = await createR2UploadTicket({ folder: 'post-media', file: photoFile });
        await uploadToPresignedUrl(ticket.uploadUrl, photoFile, photoFile.type);
        const url = ticket.url || `${window.location.origin}/r2/${ticket.key}`;
        media_data = { type: "photo", url, storage_path: ticket.key, storage_backend: "r2" };
      } else if (mode === "video" && videoFile) {
        const ticket = await createR2UploadTicket({ folder: 'post-media', file: videoFile });
        setUploadProgress(0);
        await uploadToPresignedUrl(ticket.uploadUrl, videoFile, videoFile.type);
        setUploadProgress(100);
        const url = ticket.url || `r2://${ticket.key}`;
        media_data = { type: "video", url, storage_path: ticket.key, storage_backend: "r2" };
        const { error: videoDbError } = await supabase.from("user_videos").insert({
          user_id: session.user.id,
          title: contentText || videoFile.name,
          url,
          source: "upload"
        });
        if (videoDbError) throw videoDbError;
        setUploadProgress(null);
      } else if (mode === "music" && youtubeSelected) {
        const isPlaylist = youtubeSelected.id.kind === 'youtube#playlist';
        media_data = { type: isPlaylist ? "youtube_playlist" : "youtube_song", youtube_id: isPlaylist ? youtubeSelected.id.playlistId : youtubeSelected.id.videoId, title: youtubeSelected.snippet.title, thumbnail: youtubeSelected.snippet.thumbnails?.high?.url || youtubeSelected.snippet.thumbnails?.default?.url };
      } else if (mode === "news" && newsUrl) {
        media_data = { type: "news", url: newsUrl, title: newsTitle };
      } else if (mode === "event") {
        if (!contentText) throw new Error("Escribe un título para el evento.");
        if (!eventDate) throw new Error("Selecciona una fecha para el evento.");
        media_data = { type: "event", date: eventDate, time: eventTime || null, location: eventLocation.trim() || null };
      } else if (mode === "location") {
        if (!locationName.trim()) throw new Error("Escribe el nombre del lugar.");
        media_data = { type: "location", name: locationName.trim() };
      } else if (mode === "background") {
        if (!contentText) throw new Error("Escribe algo de texto para tu nota.");
        media_data = { type: "background", style: bgChoice };
      } else if (mode === "poll") {
        const validOptions = pollOptions.filter(o => o.trim().length > 0);
        if (validOptions.length < 2) throw new Error("Una encuesta necesita al menos 2 opciones.");
        if (!contentText) throw new Error("Debes escribir una pregunta en el estado.");
        const { data: pollData, error: pollError } = await supabase.from("polls").insert({ question: contentText, author_id: session.user.id }).select("id").single();
        if (pollError) throw pollError;
        poll_id = pollData.id;
        const { error: optionError } = await supabase.from("poll_options").insert(validOptions.map((opt, i) => ({ poll_id: pollData.id, text: opt.trim(), order_index: i })));
        if (optionError) throw optionError;
      }

      const finalVisibility = privacy;
      const { data, error: submitError } = await supabase.from("posts").insert({ author_id: session.user.id, content: contentText, visibility: finalVisibility, target_profile_id: targetProfileId ? targetProfileId : null, media_data, poll_id }).select("id, content, created_at, media_data, poll_id, visibility").single();
      if (submitError) throw submitError;

      if (data && finalVisibility === 'private' && privateUsers.length > 0) {
        const visInserts = privateUsers.map(u => ({ post_id: data.id, user_id: u.id }));
        const { error: visError } = await supabase.from("post_visibility_users").insert(visInserts);
        if (visError) console.error("Error al guardar privacidad privada:", visError);
      }

      if (data) {
        onPublish({ id: data.id, text: data.content ?? contentText, time: "ahora", likes: 0, authorName: username, author_id: session.user.id, authorAvatarUrl: avatarUrl, commentsCount: 0, media_data: data.media_data, poll_id: data.poll_id });
        setDraft(""); setMode("text"); setPhotoFile(null); setPhotoPreview(null); setVideoFile(null); setVideoPreview(null); setYoutubeSelected(null); setPollOptions(["", ""]); setNewsUrl(""); setNewsTitle(""); setEventDate(""); setEventTime(""); setEventLocation(""); setLocationName(""); setBgChoice('note');
        const ta = document.querySelector(".composer-input") as HTMLTextAreaElement; if (ta) ta.style.height = "auto";
      }
    } catch (caught: any) {
      console.error("[COMPOSER_R2]", caught);
      setError(caught?.message || "Error al publicar");
    } finally {
      setUploadProgress(null);
      setPublishing(false);
    }
  }

  const renderPrivacySelector = () => {
    const getIcon = () => privacy === 'public' ? <Globe size={16} /> : privacy === 'friends' ? <Users size={16} /> : <Lock size={16} />;
    const getLabel = () => privacy === 'public' ? 'Público' : privacy === 'friends' ? 'Amigos' : 'Privado';
    return <div className="new-composer-privacy" ref={privacyMenuRef}>
      <div className="privacy-trigger" onClick={() => setPrivacyMenuOpen(!privacyMenuOpen)}>{getIcon()} {getLabel()} {privacyMenuOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />}</div>
      {privacyMenuOpen && <div className="privacy-dropdown">
        <button type="button" onClick={() => { setPrivacy('public'); setPrivacyMenuOpen(false); setShowPrivateSelector(false); }}><Globe size={16} /><div className="privacy-option-text"><strong>Público</strong><small>Todos pueden ver el post</small></div></button>
        <button type="button" onClick={() => { setPrivacy('friends'); setPrivacyMenuOpen(false); setShowPrivateSelector(false); }}><Users size={16} /><div className="privacy-option-text"><strong>Amigos</strong><small>Solo tus amigos</small></div></button>
        <button type="button" onClick={() => { setPrivacy('private'); setPrivacyMenuOpen(false); setShowPrivateSelector(true); }}><Lock size={16} /><div className="privacy-option-text"><strong>Privado</strong><small>Tú y personas específicas</small></div></button>
      </div>}
    </div>;
  };

  const renderPrivateSelector = () => {
    if (!showPrivateSelector || privacy !== 'private') return null;
    return <div className="private-users-selector"><strong>¿Quién puede verlo?</strong><p style={{fontSize:'0.85em',color:'var(--text-light)',margin:'4px 0 12px'}}>Busca y selecciona las personas que podrán ver este post.</p><div className="private-users-search"><input type="text" placeholder="Buscar personas..." /></div><div className="private-users-list"><p style={{fontSize:'0.85em',color:'var(--text-light)',padding:'10px 0',textAlign:'center'}}>(Funcionalidad de búsqueda en desarrollo. El post se guardará como privado.)</p></div><div className="private-users-actions" style={{textAlign:'right',marginTop:'12px'}}><button type="button" className="btn-primary" onClick={() => setShowPrivateSelector(false)} style={{padding:'6px 16px',borderRadius:'4px',border:'none',background:'var(--primary)',color:'white'}}>Guardar</button></div></div>;
  };

  const handleModeChange = (newMode: typeof mode) => { setMode(newMode); setMoreMenuOpen(false); };

  return (
    <section className="composer-container panel">
      <div className="composer-top"><div className="composer-avatar">{avatarUrl ? <img src={avatarUrl} alt={username} /> : <div className="initials">{initials}</div>}</div><textarea ref={textareaRef} className="composer-input" value={draft} onChange={handleInput} placeholder={mode === "poll" ? "Haz una pregunta..." : mode === "event" ? "Título del evento..." : placeholderText} rows={1} /></div>
      {mentionPickerOpen && <div className="mention-picker" ref={mentionPickerRef}><div className="mention-picker-search"><AtSign size={14} /><input type="text" autoFocus placeholder="Buscar personas..." value={mentionQuery} onChange={e=>setMentionQuery(e.target.value)} /></div>{mentionSearching&&<div className="mention-picker-empty">Buscando...</div>}{!mentionSearching&&mentionQuery.trim()&&mentionResults.length===0&&<div className="mention-picker-empty">Sin resultados</div>}{mentionResults.map(u=><button type="button" key={u.id} className="mention-picker-item" onClick={()=>insertMention(u)}><div className="avatar tiny" style={{overflow:'hidden'}}>{u.avatar_url?<img src={u.avatar_url} alt="" style={{width:'100%',height:'100%',objectFit:'cover'}}/>:(u.username||'?').slice(0,2).toUpperCase()}</div><span>{getDisplayName(u,"")}</span></button>)}</div>}
      {mode === "photo" && <div className="composer-extended photo-mode">{!photoPreview ? <div className="file-upload-box"><input type="file" id="photo-upload" accept="image/*" onChange={handlePhotoSelect}/><label htmlFor="photo-upload"><ImageIcon size={24}/><span>Seleccionar imagen</span></label></div> : <div className="composer-photo-preview" style={{width:'100%',maxWidth:'100%',height:'350px',maxHeight:'350px',overflow:'hidden'}}><img src={photoPreview} alt="Vista previa" style={{width:'100%',height:'100%',objectFit:'contain'}}/><button type="button" onClick={removePhoto} className="remove-media-btn"><X size={18}/></button></div>}</div>}
      {mode === "video" && <div className="composer-extended video-mode">{!videoPreview ? <div className="file-upload-box"><input type="file" id="video-upload" accept="video/*" onChange={handleVideoSelect}/><label htmlFor="video-upload"><Video size={24}/><span>Seleccionar vídeo</span></label></div> : <div className="composer-video-preview" style={{position:'relative'}}><video src={videoPreview} controls style={{width:'100%',maxHeight:'350px'}}/><button type="button" onClick={removeVideo} className="remove-media-btn"><X size={18}/></button></div>}{uploadProgress !== null && <div style={{marginTop:8,fontSize:12,color:'var(--text-light)'}}>Subiendo: {uploadProgress}%</div>}</div>}

      {mode === "music" && <div className="composer-extended music-mode"><div className="music-tabs"><button type="button" className={musicTab === 'canciones' ? 'active' : ''} onClick={() => setMusicTab('canciones')}>Canciones</button><button type="button" className={musicTab === 'playlists' ? 'active' : ''} onClick={() => setMusicTab('playlists')}>Playlists</button></div><form onSubmit={searchYoutube} className="youtube-search"><input value={youtubeSearch} onChange={e=>setYoutubeSearch(e.target.value)} placeholder="Buscar en YouTube..."/><button type="submit" disabled={youtubeSearching||!youtubeHasKey}>{youtubeSearching?<Loader2 size={16}/>:<Search size={16}/>}</button></form><div className="youtube-results">{youtubeResults.map((item:any)=>{const isPlaylist=item.id.kind==='youtube#playlist';const id=isPlaylist?item.id.playlistId:item.id.videoId;return <button key={id} type="button" onClick={()=>setYoutubeSelected(item)} className={`youtube-result ${youtubeSelected===item?'selected':''}`}><img src={item.snippet.thumbnails?.medium?.url||item.snippet.thumbnails?.default?.url} alt=""/><span><strong>{item.snippet.title}</strong><small>{item.snippet.channelTitle}</small></span></button>})}</div>{youtubeSelected&&<div className="youtube-selected-preview"><strong>{youtubeSelected.snippet.title}</strong><span>{youtubeSelected.snippet.channelTitle}</span></div>}</div>}

      {error && <div className="composer-error">{error}</div>}
      <div className="composer-bottom"><div className="composer-modes"><button type="button" onClick={()=>handleModeChange('photo')} title="Foto"><ImageIcon size={18}/></button><button type="button" onClick={()=>handleModeChange('video')} title="Vídeo"><Video size={18}/></button><button type="button" onClick={()=>handleModeChange('music')} title="Música"><Music size={18}/></button><button type="button" onClick={()=>handleModeChange('poll')} title="Encuesta"><BarChart3 size={18}/></button><button type="button" ref={moreMenuRef} onClick={()=>setMoreMenuOpen(v=>!v)} title="Más"><List size={18}/></button></div>{renderPrivacySelector()}<button type="button" className="composer-publish" onClick={(e:any)=>publish(e as any)} disabled={publishing}>{publishing?<Loader2 size={16}/>:buttonText}</button></div>
      <ComposerMenuPortal isOpen={moreMenuOpen} onClose={()=>setMoreMenuOpen(false)} triggerRef={moreMenuRef} onSelect={handleModeChange}/>
      {renderPrivateSelector()}
    </section>
  );
}
