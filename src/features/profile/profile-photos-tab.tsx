import React, { useEffect, useMemo, useRef, useState } from "react";
import { createRoot, type Root } from "react-dom/client";
import { Album, ChevronLeft, ChevronRight, Heart, ImagePlus, MessageCircle, Plus, Upload, X } from "lucide-react";
import { supabase } from "../../lib/supabase";
import "./profile-photos-tab.css";

type Photo = { id: string; url: string; caption: string | null; created_at: string; album_id: string | null; visibility: string };
type AlbumRow = { id: string; name: string; description: string | null; cover_photo_url: string | null; created_at: string };
type CommentRow = { id: string; author_id: string; content: string; created_at: string };

const MAX_UPLOAD = 60 * 1024 * 1024;
const allowed = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);

async function ensureDefaultAlbum(userId: string) {
  const { data } = await supabase.from("photo_albums").select("id,name,description,cover_photo_url,created_at").eq("user_id", userId).order("created_at", { ascending: true });
  if (data?.length) return data as AlbumRow[];
  const { data: created, error } = await supabase.from("photo_albums").insert({ user_id: userId, name: "Perfil", description: "Fotos de mi perfil" }).select("id,name,description,cover_photo_url,created_at").single();
  if (error) throw error;
  return created ? [created as AlbumRow] : [];
}

function formatDate(value: string) {
  return new Date(value).toLocaleDateString("es-ES", { day: "numeric", month: "short", year: "numeric" });
}

function PhotosGallery({ profileId, username, own }: { profileId: string; username: string; own: boolean }) {
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [albums, setAlbums] = useState<AlbumRow[]>([]);
  const [albumId, setAlbumId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [showCreateAlbum, setShowCreateAlbum] = useState(false);
  const [newAlbum, setNewAlbum] = useState("");
  const [selected, setSelected] = useState(0);
  const [lightbox, setLightbox] = useState(false);
  const [liked, setLiked] = useState<Record<string, boolean>>({});
  const [likeCounts, setLikeCounts] = useState<Record<string, number>>({});
  const [commentCounts, setCommentCounts] = useState<Record<string, number>>({});
  const [comments, setComments] = useState<CommentRow[]>([]);
  const [commentText, setCommentText] = useState("");
  const [commentLoading, setCommentLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const load = async () => {
    setLoading(true);
    const [albumResult, photoResult] = await Promise.all([
      supabase.from("photo_albums").select("id,name,description,cover_photo_url,created_at").eq("user_id", profileId).order("created_at", { ascending: false }),
      supabase.from("photos").select("id,url,caption,created_at,album_id,visibility").eq("user_id", profileId).order("created_at", { ascending: false }),
    ]);
    if (albumResult.error) console.error("[PROFILE_PHOTOS] albums", albumResult.error);
    if (photoResult.error) console.error("[PROFILE_PHOTOS] photos", photoResult.error);
    let nextAlbums = (albumResult.data || []) as AlbumRow[];
    if (own && nextAlbums.length === 0) {
      try { nextAlbums = await ensureDefaultAlbum(profileId); } catch (error) { console.error("[PROFILE_PHOTOS] default album", error); }
    }
    setAlbums(nextAlbums);
    setPhotos((photoResult.data || []) as Photo[]);
    if (nextAlbums.length && albumId && !nextAlbums.some(album => album.id === albumId)) setAlbumId(null);
    setLoading(false);
  };

  useEffect(() => { void load(); }, [profileId]);

  const visiblePhotos = useMemo(() => albumId ? photos.filter(photo => photo.album_id === albumId) : photos, [albumId, photos]);
  const recentPhotos = visiblePhotos.slice(0, 12);
  const activePhoto = visiblePhotos[selected] || visiblePhotos[0];

  const loadPhotoStats = async (photo: Photo) => {
    const [{ count: likes }, { count: commentCount }, { data: myLike }, { data: commentRows }] = await Promise.all([
      supabase.from("photo_likes").select("id", { count: "exact", head: true }).eq("photo_id", photo.id),
      supabase.from("photo_comments").select("id", { count: "exact", head: true }).eq("photo_id", photo.id),
      supabase.from("photo_likes").select("id").eq("photo_id", photo.id).eq("user_id", (await supabase.auth.getUser()).data.user?.id || "").maybeSingle(),
      supabase.from("photo_comments").select("id,author_id,content,created_at").eq("photo_id", photo.id).order("created_at", { ascending: true }).limit(50),
    ]);
    setLikeCounts(current => ({ ...current, [photo.id]: likes || 0 }));
    setCommentCounts(current => ({ ...current, [photo.id]: commentCount || 0 }));
    setLiked(current => ({ ...current, [photo.id]: !!myLike }));
    setComments((commentRows || []) as CommentRow[]);
  };

  const openPhoto = async (index: number) => { setSelected(index); setLightbox(true); const photo = visiblePhotos[index]; if (photo) await loadPhotoStats(photo); };
  const move = async (delta: number) => { if (!visiblePhotos.length) return; const next = (selected + delta + visiblePhotos.length) % visiblePhotos.length; setSelected(next); const photo = visiblePhotos[next]; if (photo) await loadPhotoStats(photo); };

  const toggleLike = async () => {
    const userId = (await supabase.auth.getUser()).data.user?.id;
    if (!userId || !activePhoto) return;
    const already = liked[activePhoto.id];
    if (already) {
      const { error } = await supabase.from("photo_likes").delete().eq("photo_id", activePhoto.id).eq("user_id", userId);
      if (error) return window.alert(error.message);
      setLiked(current => ({ ...current, [activePhoto.id]: false }));
      setLikeCounts(current => ({ ...current, [activePhoto.id]: Math.max(0, (current[activePhoto.id] || 1) - 1) }));
    } else {
      const { error } = await supabase.from("photo_likes").insert({ photo_id: activePhoto.id, user_id: userId });
      if (error) return window.alert(error.message);
      setLiked(current => ({ ...current, [activePhoto.id]: true }));
      setLikeCounts(current => ({ ...current, [activePhoto.id]: (current[activePhoto.id] || 0) + 1 }));
    }
  };

  const sendComment = async () => {
    const userId = (await supabase.auth.getUser()).data.user?.id;
    if (!userId || !activePhoto || !commentText.trim()) return;
    setCommentLoading(true);
    const { data, error } = await supabase.from("photo_comments").insert({ photo_id: activePhoto.id, author_id: userId, content: commentText.trim() }).select("id,author_id,content,created_at").single();
    setCommentLoading(false);
    if (error) return window.alert(error.message);
    setComments(current => [...current, data as CommentRow]);
    setCommentCounts(current => ({ ...current, [activePhoto.id]: (current[activePhoto.id] || 0) + 1 }));
    setCommentText("");
  };

  const createAlbum = async () => {
    const name = newAlbum.trim().slice(0, 50);
    if (!own || !name) return;
    const { data, error } = await supabase.from("photo_albums").insert({ user_id: profileId, name }).select("id,name,description,cover_photo_url,created_at").single();
    if (error) return window.alert(error.message);
    setAlbums(current => [data as AlbumRow, ...current]); setAlbumId(data.id); setNewAlbum(""); setShowCreateAlbum(false);
  };

  const uploadPhoto = async (file: File) => {
    if (!own) return;
    if (!allowed.has(file.type)) return window.alert("Formato no soportado. Usa JPG, PNG, WEBP o GIF.");
    if (file.size > MAX_UPLOAD) return window.alert("La imagen es demasiado grande. Máximo 60 MB.");
    setUploading(true);
    try {
      let targetAlbum = albumId;
      if (!targetAlbum) {
        const next = albums[0] || (await ensureDefaultAlbum(profileId))[0];
        targetAlbum = next?.id || null;
        if (next && !albums.some(album => album.id === next.id)) setAlbums(current => [next, ...current]);
      }
      const { data: signed, error: signError } = await supabase.functions.invoke("r2-media", { body: { action: "upload", folder: "photos", fileName: file.name, contentType: file.type, size: file.size } });
      if (signError) throw signError;
      if (!signed?.uploadUrl || !signed?.key || !signed?.url) throw new Error("No se pudo preparar la subida a Cloudflare R2.");
      const response = await fetch(signed.uploadUrl, { method: "PUT", headers: { "Content-Type": file.type }, body: file });
      if (!response.ok) throw new Error(`Cloudflare R2 rechazó la subida (${response.status}).`);
      const { error: dbError } = await supabase.from("photos").insert({ user_id: profileId, album_id: targetAlbum, storage_path: signed.key, url: signed.url, caption: null, visibility: "public" });
      if (dbError) throw dbError;
      await load();
    } catch (error: any) {
      console.error("[PROFILE_PHOTOS_UPLOAD]", error); window.alert(error?.message || "No se pudo subir la foto.");
    } finally { setUploading(false); }
  };

  return <section className="profile-photos-panel">
    <header className="profile-photos-head"><div><span className="profile-photos-eyebrow">GALERÍA DE PERFIL</span><h2>Fotos de {username}</h2><p>{photos.length} fotos · {albums.length} álbumes</p></div>{own && <label className="profile-photos-upload"><Upload size={17}/> {uploading ? "Subiendo…" : "Subir foto"}<input ref={inputRef} type="file" accept="image/jpeg,image/png,image/webp,image/gif" disabled={uploading} onChange={event => { const file = event.target.files?.[0]; event.currentTarget.value = ""; if (file) void uploadPhoto(file); }}/></label>}</header>
    <div className="profile-photos-toolbar"><div className="profile-photos-filter"><button className={!albumId ? "active" : ""} onClick={() => setAlbumId(null)}>Todas</button>{albums.map(album => <button key={album.id} className={albumId === album.id ? "active" : ""} onClick={() => setAlbumId(album.id)}>{album.name}</button>)}</div>{own && <button className="profile-photos-new-album" onClick={() => setShowCreateAlbum(true)}><Plus size={16}/> Nuevo álbum</button>}</div>
    {showCreateAlbum && <div className="profile-photos-create"><input autoFocus value={newAlbum} onChange={event => setNewAlbum(event.target.value)} onKeyDown={event => { if (event.key === "Enter") void createAlbum(); }} placeholder="Nombre del álbum"/><button onClick={() => void createAlbum()}>Crear</button><button className="ghost" onClick={() => setShowCreateAlbum(false)}>Cancelar</button></div>}
    {loading ? <div className="profile-photos-empty">Cargando fotos…</div> : recentPhotos.length ? <><div className="profile-photos-section-title"><div><h3>Fotos recientes</h3><span>Las últimas imágenes compartidas en tu perfil</span></div></div><div className="profile-photos-grid">{recentPhotos.map((photo, index) => <button key={photo.id} className="profile-photos-tile" onClick={() => void openPhoto(index)}><img src={photo.url} alt={photo.caption || "Foto"}/><span className="profile-photos-tile-meta">{formatDate(photo.created_at)}</span></button>)}</div></> : <div className="profile-photos-empty"><ImagePlus size={38}/><strong>Aún no hay fotos aquí</strong><span>{own ? "Sube la primera foto para estrenar tu galería." : "Este perfil todavía no ha publicado fotos."}</span></div>}
    <section className="profile-photos-albums"><div className="profile-photos-section-title"><div><h3>Álbumes</h3><span>Organiza tus recuerdos como quieras</span></div>{own && <button onClick={() => setShowCreateAlbum(true)}>+ Nuevo álbum</button>}</div><div className="profile-photos-album-grid">{albums.map(album => { const albumPhotos = photos.filter(photo => photo.album_id === album.id); const cover = album.cover_photo_url || albumPhotos[0]?.url; return <button key={album.id} className="profile-photos-album" onClick={() => setAlbumId(album.id)}><div className="profile-photos-album-cover">{cover ? <img src={cover} alt=""/> : <Album size={28}/>}</div><div><strong>{album.name}</strong><span>{albumPhotos.length} {albumPhotos.length === 1 ? "foto" : "fotos"}</span></div></button>; })}</div></section>
    {lightbox && activePhoto && <div className="profile-photos-lightbox" role="dialog" aria-modal="true" onMouseDown={event => { if (event.target === event.currentTarget) setLightbox(false); }}><button className="profile-photos-close" onClick={() => setLightbox(false)} aria-label="Cerrar"><X/></button><button className="profile-photos-nav prev" onClick={() => void move(-1)} aria-label="Anterior"><ChevronLeft/></button><div className="profile-photos-viewer"><img src={activePhoto.url} alt={activePhoto.caption || "Foto"}/><div className="profile-photos-info"><div><strong>{activePhoto.caption || "Foto de perfil"}</strong><span>{formatDate(activePhoto.created_at)}</span></div><div className="profile-photos-actions"><button className={liked[activePhoto.id] ? "liked" : ""} onClick={() => void toggleLike()}><Heart size={17} fill={liked[activePhoto.id] ? "currentColor" : "none"}/> {likeCounts[activePhoto.id] || 0}</button><span><MessageCircle size={17}/> {commentCounts[activePhoto.id] || 0}</span></div></div><div className="profile-photos-comments"><div className="profile-photos-comments-list">{comments.map(comment => <article key={comment.id}><small>{new Date(comment.created_at).toLocaleString("es-ES")}</small><p>{comment.content}</p></article>)}</div><div className="profile-photos-comment-form"><input value={commentText} onChange={event => setCommentText(event.target.value)} onKeyDown={event => { if (event.key === "Enter") void sendComment(); }} placeholder="Escribe un comentario…"/><button onClick={() => void sendComment()} disabled={commentLoading}>Enviar</button></div></div></div><button className="profile-photos-nav next" onClick={() => void move(1)} aria-label="Siguiente"><ChevronRight/></button></div>}
  </section>;
}

let root: Root | null = null;
let host: HTMLDivElement | null = null;
let active = false;

function findProfileContext() {
  const page = document.querySelector<HTMLElement>(".profile-view-page");
  const main = page?.querySelector<HTMLElement>(".profile-view-main");
  const username = page?.querySelector(".profile-view-name-row h1")?.textContent?.trim() || "usuario";
  return page && main ? { page, main, username } : null;
}

function mountPhotos() {
  const context = findProfileContext();
  if (!context || active) return;
  active = true;
  context.main.style.display = "none";
  host = document.createElement("div"); host.className = "profile-photos-host";
  context.main.parentElement?.appendChild(host);
  const sessionPromise = supabase.auth.getSession();
  void sessionPromise.then(({ data }) => {
    const userId = data.session?.user?.id;
    const profileId = context.page?.querySelector(".profile-view-name-row")?.getAttribute("data-profile-id") || userId || "";
    const own = !!userId && profileId === userId;
    root = createRoot(host!);
    root.render(<PhotosGallery profileId={profileId} username={context.username} own={own}/>);
  });
}

function unmountPhotos() {
  if (!active) return;
  active = false;
  root?.unmount(); root = null; host?.remove(); host = null;
  const context = findProfileContext(); if (context) context.main.style.display = "";
}

function bindTabs() {
  document.querySelectorAll<HTMLButtonElement>(".profile-view-tabs button").forEach(button => {
    if (button.dataset.photosTabBound === "1") return;
    button.dataset.photosTabBound = "1";
    button.addEventListener("click", () => { if (button.textContent?.trim() === "Fotos") setTimeout(mountPhotos, 0); else setTimeout(unmountPhotos, 0); }, true);
  });
}

function boot() {
  bindTabs();
  const observer = new MutationObserver(() => { bindTabs(); if (active && !document.querySelector(".profile-view-page")) unmountPhotos(); });
  observer.observe(document.body, { childList: true, subtree: true });
}

if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot, { once: true }); else boot();
