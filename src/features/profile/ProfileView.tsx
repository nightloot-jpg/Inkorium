import React, { useEffect, useMemo, useState } from "react";
import { CalendarDays, Camera, Image as ImageIcon, MapPin, Music2, Pencil, Play, Pause, Users, Video, X, Upload, Check, Circle } from "lucide-react";
import { supabase } from "../../lib/supabase";
import { usePlayerStore } from "../../lib/store";
import type { Session } from "@supabase/supabase-js";
import "./profile-view.css";

type Profile = {
  id?: string;
  username: string | null;
  full_name: string | null;
  bio: string | null;
  city: string | null;
  avatar_url: string | null;
  banner_url: string | null;
  user_status?: string | null;
};

type ProfileViewProps = { session: Session; profile: Profile | null; profileId: string; username: string };
type UserPost = { id: string; content: string | null; created_at: string; media_data?: any };
type GalleryPhoto = { id: string; url: string; caption: string | null; created_at: string };
type MediaTarget = "avatar" | "banner";
type StatusValue = "conectado" | "ausente" | "desconectado";
const STATUS_META: Record<StatusValue, { label: string; className: string }> = { conectado: { label: "Conectado", className: "online" }, ausente: { label: "Ausente", className: "away" }, desconectado: { label: "Desconectado", className: "offline" } };
function normalizeStatus(value: string | null | undefined): StatusValue { return value === "ausente" || value === "desconectado" ? value : "conectado"; }
function initials(name: string) { return name.trim().split(/\s+/).slice(0, 2).map((part) => part[0]).join("").toUpperCase() || "U"; }
function formatPlayerTime(seconds: number) { if (!Number.isFinite(seconds) || seconds < 0) return "0:00"; const total = Math.floor(seconds); return `${Math.floor(total / 60)}:${String(total % 60).padStart(2, "0")}`; }

export function ProfileView({ session, profile, profileId, username }: ProfileViewProps) {
  const [posts, setPosts] = useState<UserPost[]>([]);
  const [loadingPosts, setLoadingPosts] = useState(true);
  const [activeTab, setActiveTab] = useState("Inicio");
  const [viewedProfile, setViewedProfile] = useState<Profile | null>(profile);
  const [viewedProfileId, setViewedProfileId] = useState(profileId);
  const [mediaTarget, setMediaTarget] = useState<MediaTarget | null>(null);
  const [gallery, setGallery] = useState<GalleryPhoto[]>([]);
  const [loadingGallery, setLoadingGallery] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [savingStatus, setSavingStatus] = useState(false);
  const [status, setStatus] = useState<StatusValue>(normalizeStatus(profile?.user_status));
  const [editingBio, setEditingBio] = useState(false);
  const [bioDraft, setBioDraft] = useState(profile?.bio || "");
  const [savingBio, setSavingBio] = useState(false);
  const [mediaPreview, setMediaPreview] = useState<string | null>(null);

  const currentSong = usePlayerStore((state) => state.currentSong);
  const isPlaying = usePlayerStore((state) => state.isPlaying);
  const pendingPlay = usePlayerStore((state) => state.pendingPlay);
  const currentTime = usePlayerStore((state) => state.currentTime);
  const duration = usePlayerStore((state) => state.duration);
  const pause = usePlayerStore((state) => state.pause);
  const resume = usePlayerStore((state) => state.resume);
  const openPlayer = usePlayerStore((state) => state.openPlayer);

  const isOwnProfile = viewedProfileId === session.user.id;
  const displayProfile = viewedProfile || profile;
  const displayName = displayProfile?.full_name || displayProfile?.username || username || "Usuario";
  const handle = displayProfile?.username ? `@${displayProfile.username}` : `@${username}`;
  const avatar = displayProfile?.avatar_url || "";
  const banner = displayProfile?.banner_url || "";
  const effectiveStatus = isOwnProfile ? status : normalizeStatus(displayProfile?.user_status);
  const statusMeta = STATUS_META[effectiveStatus];

  useEffect(() => {
    let cancelled = false;
    setViewedProfileId(profileId);
    async function resolveProfile() {
      const { data, error } = await supabase.from("profiles").select("id, username, full_name, bio, city, avatar_url, banner_url, user_status").eq("id", profileId).maybeSingle();
      if (!cancelled) { if (error) console.error("Error loading profile:", error); setViewedProfile((data || profile || null) as Profile | null); }
    }
    void resolveProfile();
    return () => { cancelled = true; };
  }, [profile, profileId]);

  useEffect(() => {
    if (!isOwnProfile) { setStatus(normalizeStatus(displayProfile?.user_status)); setBioDraft(displayProfile?.bio || ""); }
  }, [displayProfile?.user_status, displayProfile?.bio, isOwnProfile]);

  useEffect(() => {
    let cancelled = false;
    setLoadingPosts(true);
    async function loadPosts() {
      const { data, error } = await supabase.from("posts").select("id, content, created_at, media_data").eq("author_id", profileId).is("group_id", null).order("created_at", { ascending: false }).limit(20);
      if (!cancelled) { if (error) console.error("Error loading profile posts:", error); setPosts((data || []) as UserPost[]); setLoadingPosts(false); }
    }
    void loadPosts();
    return () => { cancelled = true; };
  }, [profileId]);

  const postCountLabel = useMemo(() => `${posts.length}${posts.length === 20 ? "+" : ""}`, [posts.length]);
  const progress = duration > 0 ? Math.min(100, Math.max(0, (currentTime / duration) * 100)) : 0;

  const openMediaChooser = async (target: MediaTarget) => {
    if (!isOwnProfile) return;
    setMediaTarget(target); setMediaPreview(null); setLoadingGallery(true);
    const { data, error } = await supabase.from("photos").select("id, url, caption, created_at").eq("user_id", session.user.id).order("created_at", { ascending: false }).limit(60);
    if (error) console.error("Error loading profile gallery:", error);
    setGallery((data || []) as GalleryPhoto[]); setLoadingGallery(false);
  };

  const applyProfileMedia = async (url: string, target: MediaTarget) => {
    if (!isOwnProfile) return;
    const field = target === "avatar" ? "avatar_url" : "banner_url";
    const { error } = await supabase.from("profiles").update({ [field]: url, updated_at: new Date().toISOString() }).eq("id", session.user.id);
    if (error) { window.alert(`No se pudo actualizar la imagen: ${error.message}`); return; }
    setViewedProfile((current) => current ? { ...current, [field]: url } : current);
    setMediaTarget(null); setMediaPreview(null);
  };

  const handleUpload = async (file: File) => {
    if (!mediaTarget || !isOwnProfile || !file.type.startsWith("image/")) return;
    setUploading(true);
    try {
      const extension = file.name.split(".").pop()?.toLowerCase() || "jpg";
      const path = `${session.user.id}/${mediaTarget}-${crypto.randomUUID()}.${extension}`;
      const { error: uploadError } = await supabase.storage.from("profile-media").upload(path, file, { upsert: false, contentType: file.type, cacheControl: "3600" });
      if (uploadError) throw uploadError;
      const { data } = supabase.storage.from("profile-media").getPublicUrl(path);
      await applyProfileMedia(data.publicUrl, mediaTarget);
    } catch (error: any) { console.error("Profile media upload failed:", error); window.alert(`No se pudo subir la imagen: ${error?.message || "Error desconocido"}`); }
    finally { setUploading(false); }
  };

  const chooseGalleryPhoto = async (photo: GalleryPhoto) => { if (!mediaTarget) return; setMediaPreview(photo.url); await applyProfileMedia(photo.url, mediaTarget); };

  const saveStatus = async (next: StatusValue) => {
    if (!isOwnProfile) return;
    setStatus(next); setSavingStatus(true);
    const { error } = await supabase.from("profiles").update({ user_status: next, updated_at: new Date().toISOString() }).eq("id", session.user.id);
    setSavingStatus(false);
    if (error) window.alert(`No se pudo guardar el estado: ${error.message}`);
    else setViewedProfile((current) => current ? { ...current, user_status: next } : current);
  };

  const saveBio = async () => {
    if (!isOwnProfile) return;
    setSavingBio(true); const value = bioDraft.trim().slice(0, 180);
    const { error } = await supabase.from("profiles").update({ bio: value || null, updated_at: new Date().toISOString() }).eq("id", session.user.id);
    setSavingBio(false);
    if (error) { window.alert(`No se pudo guardar la biografía: ${error.message}`); return; }
    setViewedProfile((current) => current ? { ...current, bio: value || null } : current); setEditingBio(false);
  };

  const togglePlayback = () => { if (!currentSong) { openPlayer(); return; } if (isPlaying || pendingPlay) pause(); else resume(); };

  return (
    <section className="profile-view-page">
      <button className={`profile-view-cover profile-view-cover-button ${isOwnProfile ? "editable" : ""}`} type="button" onClick={() => void openMediaChooser("banner")} disabled={!isOwnProfile} style={banner ? { backgroundImage: `url(${banner})` } : undefined} aria-label={isOwnProfile ? "Cambiar foto de portada" : "Foto de portada"}>
        {!banner && <div className="profile-view-cover-placeholder" />}{isOwnProfile && <span className="profile-view-image-overlay"><Camera size={18} /> Cambiar portada</span>}
      </button>

      <div className="profile-view-header">
        <div className="profile-view-avatar-wrap"><button className={`profile-view-avatar-button ${isOwnProfile ? "editable" : ""}`} type="button" onClick={() => void openMediaChooser("avatar")} disabled={!isOwnProfile} aria-label={isOwnProfile ? "Cambiar foto de perfil" : "Foto de perfil"}>{avatar ? <img className="profile-view-avatar" src={avatar} alt={displayName} /> : <div className="profile-view-avatar profile-view-avatar-fallback">{initials(displayName)}</div>}{isOwnProfile && <span className="profile-view-avatar-overlay"><Camera size={16} /></span>}</button></div>
        <div className="profile-view-identity">
          <div className="profile-view-name-row"><h1>{displayName}</h1><span className="profile-view-verified" aria-label="Perfil verificado">✓</span></div>
          <div className="profile-view-handle">{handle}</div>
          <div className="profile-view-status-row"><span className={`profile-view-status-dot ${statusMeta.className}`}><Circle size={10} fill="currentColor" /></span>{isOwnProfile ? <select className="profile-view-status-select" value={status} onChange={(e) => void saveStatus(e.target.value as StatusValue)} disabled={savingStatus} aria-label="Estado"><option value="conectado">Conectado</option><option value="ausente">Ausente</option><option value="desconectado">Desconectado</option></select> : <span className="profile-view-status-label">{statusMeta.label}</span>}</div>
          {editingBio && isOwnProfile ? <div className="profile-view-bio-editor"><textarea value={bioDraft} onChange={(e) => setBioDraft(e.target.value)} maxLength={180} placeholder="Comparte música, fotos y momentos en Inkorium." /><div className="profile-view-bio-actions"><button type="button" className="secondary" onClick={() => { setEditingBio(false); setBioDraft(displayProfile?.bio || ""); }}><X size={15} /> Cancelar</button><button type="button" className="primary" onClick={() => void saveBio()} disabled={savingBio}><Check size={15} /> Guardar</button></div></div> : <button type="button" className={`profile-view-bio ${isOwnProfile ? "editable" : ""}`} onClick={() => isOwnProfile && setEditingBio(true)}>{displayProfile?.bio || "Comparte música, fotos y momentos en Inkorium."}{isOwnProfile && <Pencil size={14} />}</button>}
          <div className="profile-view-meta">{displayProfile?.city && <span><MapPin size={15} /> {displayProfile.city}</span>}<span><Music2 size={15} /> Música</span><span><Users size={15} /> Inkorium</span></div>
        </div>
        {isOwnProfile && <button className="profile-view-edit" type="button" onClick={() => setEditingBio(true)}><Pencil size={16} /> Editar perfil</button>}
      </div>

      <div className="profile-view-tabs" role="tablist">{["Inicio", "Música", "Fotos", "Vídeos", "Eventos", "Amigos"].map((tab) => <button key={tab} type="button" className={activeTab === tab ? "active" : ""} onClick={() => setActiveTab(tab)}>{tab}</button>)}</div>
      <div className="profile-view-grid">
        <main className="profile-view-main">
          <div className="profile-view-card profile-view-intro-card"><div className="profile-view-card-title"><Music2 size={18} /> ¿Qué estás escuchando ahora?</div>{currentSong ? <div className="profile-view-listening profile-view-listening-active"><button type="button" className="profile-view-listening-main" onClick={openPlayer} aria-label="Abrir el reproductor global">{currentSong.thumbnail ? <img className="profile-view-listening-cover" src={currentSong.thumbnail} alt="" /> : <div className="profile-view-listening-cover profile-view-listening-cover-fallback"><Music2 size={20} /></div>}<span className="profile-view-listening-copy"><strong>{currentSong.title}</strong><small>{currentSong.artist || currentSong.channel_title || "Inkorium"}</small><span className="profile-view-listening-progress" aria-hidden="true"><span style={{ width: `${progress}%` }} /></span><small>{formatPlayerTime(currentTime)} / {formatPlayerTime(duration)}</small></span></button><button type="button" className="profile-view-listening-control" onClick={togglePlayback} aria-label={isPlaying || pendingPlay ? "Pausar" : "Reproducir"}>{isPlaying || pendingPlay ? <Pause size={18} /> : <Play size={18} />}</button></div> : <button type="button" className="profile-view-listening" onClick={openPlayer}>Nada reproduciéndose ahora. Abre el reproductor global para empezar a escuchar música.</button>}</div>
          <div className="profile-view-card"><div className="profile-view-section-head"><h2>Publicaciones</h2><span>{postCountLabel}</span></div>{loadingPosts ? <div className="profile-view-empty">Cargando publicaciones…</div> : posts.length === 0 ? <div className="profile-view-empty">Todavía no has publicado nada.</div> : <div className="profile-view-posts">{posts.map((post) => <article key={post.id} className="profile-view-post"><div className="profile-view-post-date">{new Date(post.created_at).toLocaleDateString("es-ES", { day: "numeric", month: "short", year: "numeric" })}</div>{post.content && <p>{post.content}</p>}{post.media_data?.type === "photo" && <img src={post.media_data.url} alt="Publicación" />}{post.media_data?.type === "video" && <div className="profile-view-media-label"><Video size={16} /> Vídeo compartido</div>}{post.media_data?.type === "youtube_song" && <div className="profile-view-media-label"><Music2 size={16} /> Música compartida</div>}{!post.content && !post.media_data && <p className="muted">Publicación sin texto.</p>}</article>)}</div>}</div>
        </main>
        <aside className="profile-view-side"><div className="profile-view-card"><h2>Sobre mí</h2><p>{displayProfile?.bio || "Este perfil todavía no tiene una biografía."}</p>{displayProfile?.city && <div className="profile-view-side-row"><MapPin size={17} /> {displayProfile.city}</div>}</div><div className="profile-view-card"><h2>Tu Inkorium</h2><div className="profile-view-feature"><Music2 size={18} /><span><strong>Música destacada</strong><small>La canción que escuchas ahora</small></span></div><div className="profile-view-feature"><Camera size={18} /><span><strong>Fotos</strong><small>Comparte tus momentos</small></span></div><div className="profile-view-feature"><CalendarDays size={18} /><span><strong>Eventos</strong><small>Descubre y organiza planes</small></span></div></div><div className="profile-view-card profile-view-stats"><div><strong>{postCountLabel}</strong><span>Publicaciones</span></div><div><strong>0</strong><span>Amigos</span></div><div><strong>0</strong><span>Seguidores</span></div></div></aside>
      </div>

      {mediaTarget && <div className="profile-media-modal-backdrop" role="presentation" onMouseDown={(e) => { if (e.currentTarget === e.target) setMediaTarget(null); }}><div className="profile-media-modal" role="dialog" aria-modal="true" aria-labelledby="profile-media-title"><div className="profile-media-modal-head"><div><h2 id="profile-media-title">Cambiar {mediaTarget === "avatar" ? "foto de perfil" : "foto de portada"}</h2><p>Sube una imagen o elige una de tu galería de Inkorium.</p></div><button type="button" className="profile-media-close" onClick={() => setMediaTarget(null)} aria-label="Cerrar"><X size={20} /></button></div><div className="profile-media-actions"><label className="profile-media-upload"><Upload size={17} /> {uploading ? "Subiendo…" : "Subir una foto"}<input type="file" accept="image/*" disabled={uploading} onChange={(e) => { const file = e.target.files?.[0]; if (file) void handleUpload(file); e.currentTarget.value = ""; }} /></label><span className="profile-media-or">o elige de tu galería</span></div>{mediaPreview && <img className="profile-media-preview" src={mediaPreview} alt="Vista previa" />}{loadingGallery ? <div className="profile-media-empty">Cargando galería…</div> : gallery.length ? <div className="profile-media-gallery">{gallery.map((photo) => <button key={photo.id} type="button" onClick={() => void chooseGalleryPhoto(photo)}><img src={photo.url} alt={photo.caption || "Foto"} /></button>)}</div> : <div className="profile-media-empty"><ImageIcon size={30} /><span>No tienes fotos en tu galería todavía.</span></div>}</div></div>}
    </section>
  );
}
