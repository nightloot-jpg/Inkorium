import React, { useEffect, useMemo, useRef, useState } from "react";
import { Album, ChevronLeft, ChevronRight, Heart, ImagePlus, MessageCircle, Plus, Upload, X } from "lucide-react";
import { supabase } from "../../lib/supabase";

type Photo = { id: string; url: string; caption: string | null; created_at: string; album_id: string | null; visibility: string };
type AlbumRow = { id: string; name: string; description: string | null; cover_photo_url: string | null; created_at: string };
type CommentRow = { id: string; author_id: string; content: string; created_at: string };

const MAX_UPLOAD = 60 * 1024 * 1024;
const ALLOWED = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);

async function ensureDefaultAlbum(userId: string) {
  const { data } = await supabase.from("photo_albums").select("id,name,description,cover_photo_url,created_at").eq("user_id", userId).order("created_at", { ascending: true });
  if (data?.length) return data as AlbumRow[];
  const { data: created, error } = await supabase.from("photo_albums").insert({ user_id: userId, name: "Perfil", description: "Fotos de mi perfil" }).select("id,name,description,cover_photo_url,created_at").single();
  if (error) throw error;
  return created ? [created as AlbumRow] : [];
}

const dateText = (value: string) => new Date(value).toLocaleDateString("es-ES", { day: "numeric", month: "short", year: "numeric" });

export function ProfilePhotosGallery({ profileId, username, own }: { profileId: string; username: string; own: boolean }) {
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [albums, setAlbums] = useState<AlbumRow[]>([]);
  const [albumId, setAlbumId] = useState<string | null>(null);
  const [sort, setSort] = useState<"newest" | "oldest">("newest");
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [showAlbumForm, setShowAlbumForm] = useState(false);
  const [albumName, setAlbumName] = useState("");
  const [selected, setSelected] = useState(0);
  const [lightbox, setLightbox] = useState(false);
  const [liked, setLiked] = useState<Record<string, boolean>>({});
  const [likes, setLikes] = useState<Record<string, number>>({});
  const [commentsCount, setCommentsCount] = useState<Record<string, number>>({});
  const [comments, setComments] = useState<CommentRow[]>([]);
  const [commentText, setCommentText] = useState("");
  const [sendingComment, setSendingComment] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const loadData = async () => {
    setLoading(true);
    const [albumsResult, photosResult] = await Promise.all([
      supabase.from("photo_albums").select("id,name,description,cover_photo_url,created_at").eq("user_id", profileId).order("created_at", { ascending: false }),
      supabase.from("photos").select("id,url,caption,created_at,album_id,visibility").eq("user_id", profileId).order("created_at", { ascending: false }),
    ]);
    if (albumsResult.error) console.error("[PROFILE_PHOTOS] albums", albumsResult.error);
    if (photosResult.error) console.error("[PROFILE_PHOTOS] photos", photosResult.error);
    let nextAlbums = (albumsResult.data || []) as AlbumRow[];
    if (own && nextAlbums.length === 0) {
      try { nextAlbums = await ensureDefaultAlbum(profileId); } catch (error) { console.error("[PROFILE_PHOTOS] default album", error); }
    }
    setAlbums(nextAlbums);
    setPhotos((photosResult.data || []) as Photo[]);
    if (albumId && !nextAlbums.some(album => album.id === albumId)) setAlbumId(null);
    setLoading(false);
  };

  useEffect(() => { void loadData(); }, [profileId]);
  useEffect(() => { setSelected(0); }, [albumId, sort]);

  const visiblePhotos = useMemo(() => {
    const filtered = albumId ? photos.filter(photo => photo.album_id === albumId) : photos;
    return [...filtered].sort((a, b) => sort === "newest" ? new Date(b.created_at).getTime() - new Date(a.created_at).getTime() : new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
  }, [albumId, photos, sort]);
  const activePhoto = visiblePhotos[selected] || visiblePhotos[0];

  const albumCards = useMemo(() => albums.map(album => ({
    album,
    count: photos.filter(photo => photo.album_id === album.id).length,
    cover: album.cover_photo_url || photos.find(photo => photo.album_id === album.id)?.url,
  })), [albums, photos]);

  const loadPhotoMeta = async (photo: Photo) => {
    const userId = (await supabase.auth.getUser()).data.user?.id || "";
    const [{ count: likeCount }, { count: commentCount }, { data: ownLike }, { data: commentRows }] = await Promise.all([
      supabase.from("photo_likes").select("id", { count: "exact", head: true }).eq("photo_id", photo.id),
      supabase.from("photo_comments").select("id", { count: "exact", head: true }).eq("photo_id", photo.id),
      userId ? supabase.from("photo_likes").select("id").eq("photo_id", photo.id).eq("user_id", userId).maybeSingle() : Promise.resolve({ data: null } as any),
      supabase.from("photo_comments").select("id,author_id,content,created_at").eq("photo_id", photo.id).order("created_at", { ascending: true }).limit(50),
    ]);
    setLikes(current => ({ ...current, [photo.id]: likeCount || 0 }));
    setCommentsCount(current => ({ ...current, [photo.id]: commentCount || 0 }));
    setLiked(current => ({ ...current, [photo.id]: !!ownLike }));
    setComments((commentRows || []) as CommentRow[]);
  };

  const openPhoto = async (index: number) => { setSelected(index); setLightbox(true); const photo = visiblePhotos[index]; if (photo) await loadPhotoMeta(photo); };
  const movePhoto = async (delta: number) => { if (!visiblePhotos.length) return; const next = (selected + delta + visiblePhotos.length) % visiblePhotos.length; setSelected(next); const photo = visiblePhotos[next]; if (photo) await loadPhotoMeta(photo); };

  const toggleLike = async () => {
    if (!activePhoto) return;
    const userId = (await supabase.auth.getUser()).data.user?.id;
    if (!userId) return;
    if (liked[activePhoto.id]) {
      const { error } = await supabase.from("photo_likes").delete().eq("photo_id", activePhoto.id).eq("user_id", userId);
      if (error) return window.alert(error.message);
      setLiked(current => ({ ...current, [activePhoto.id]: false }));
      setLikes(current => ({ ...current, [activePhoto.id]: Math.max(0, (current[activePhoto.id] || 1) - 1) }));
    } else {
      const { error } = await supabase.from("photo_likes").insert({ photo_id: activePhoto.id, user_id: userId });
      if (error) return window.alert(error.message);
      setLiked(current => ({ ...current, [activePhoto.id]: true }));
      setLikes(current => ({ ...current, [activePhoto.id]: (current[activePhoto.id] || 0) + 1 }));
    }
  };

  const sendComment = async () => {
    if (!activePhoto || !commentText.trim()) return;
    const userId = (await supabase.auth.getUser()).data.user?.id;
    if (!userId) return;
    setSendingComment(true);
    const { data, error } = await supabase.from("photo_comments").insert({ photo_id: activePhoto.id, author_id: userId, content: commentText.trim() }).select("id,author_id,content,created_at").single();
    setSendingComment(false);
    if (error) return window.alert(error.message);
    setComments(current => [...current, data as CommentRow]);
    setCommentsCount(current => ({ ...current, [activePhoto.id]: (current[activePhoto.id] || 0) + 1 }));
    setCommentText("");
  };

  const createAlbum = async () => {
    const name = albumName.trim().slice(0, 50);
    if (!own || !name) return;
    const { data, error } = await supabase.from("photo_albums").insert({ user_id: profileId, name }).select("id,name,description,cover_photo_url,created_at").single();
    if (error) return window.alert(error.message);
    setAlbums(current => [data as AlbumRow, ...current]);
    setAlbumName("");
    setShowAlbumForm(false);
    setAlbumId(data.id);
  };

  const uploadPhoto = async (file: File) => {
    if (!own) return;
    if (!ALLOWED.has(file.type)) return window.alert("Formato no soportado. Usa JPG, PNG, WEBP o GIF.");
    if (file.size > MAX_UPLOAD) return window.alert("La imagen es demasiado grande. Máximo 60 MB.");
    setUploading(true);
    try {
      let targetAlbumId = albumId;
      if (!targetAlbumId) {
        const nextAlbum = albums[0] || (await ensureDefaultAlbum(profileId))[0];
        targetAlbumId = nextAlbum?.id || null;
        if (nextAlbum && !albums.some(album => album.id === nextAlbum.id)) setAlbums(current => [nextAlbum, ...current]);
      }
      const { data: signed, error: signError } = await supabase.functions.invoke("r2-media", { body: { action: "upload", folder: "photos", fileName: file.name, contentType: file.type, size: file.size } });
      if (signError) throw signError;
      if (!signed?.uploadUrl || !signed?.key || !signed?.url) throw new Error("No se pudo preparar la subida a Cloudflare R2.");
      const response = await fetch(signed.uploadUrl, { method: "PUT", headers: { "Content-Type": file.type }, body: file });
      if (!response.ok) throw new Error(`Cloudflare R2 rechazó la subida (${response.status}).`);
      const { error: dbError } = await supabase.from("photos").insert({ user_id: profileId, album_id: targetAlbumId, storage_path: signed.key, url: signed.url, caption: null, visibility: "public" });
      if (dbError) throw dbError;
      await loadData();
    } catch (error: any) {
      console.error("[PROFILE_PHOTOS_UPLOAD]", error);
      window.alert(error?.message || "No se pudo subir la foto.");
    } finally { setUploading(false); }
  };

  return <section className="profile-photos-panel">
    <header className="profile-photos-head">
      <div>
        <span className="profile-photos-eyebrow">FOTOS</span>
        <h2>Fotos de {username}</h2>
        <p>{photos.length} fotos · {albums.length} álbumes</p>
      </div>
      {own && <label className="profile-photos-upload"><Upload size={17}/>{uploading ? "Subiendo…" : "Subir foto"}<input ref={inputRef} type="file" accept="image/jpeg,image/png,image/webp,image/gif" disabled={uploading} onChange={event => { const file = event.target.files?.[0]; event.currentTarget.value = ""; if (file) void uploadPhoto(file); }}/></label>}
    </header>

    <div className="profile-photos-layout">
      <div className="profile-photos-main-column">
        <div className="profile-photos-toolbar">
          <div className="profile-photos-filter">
            <button className={!albumId ? "active" : ""} onClick={() => setAlbumId(null)}>Todas</button>
            {albums.slice(0, 4).map(album => <button key={album.id} className={albumId === album.id ? "active" : ""} onClick={() => setAlbumId(album.id)}>{album.name}</button>)}
          </div>
          <select className="profile-photos-sort" value={sort} onChange={event => setSort(event.target.value as "newest" | "oldest")} aria-label="Ordenar fotos"><option value="newest">Más recientes</option><option value="oldest">Más antiguas</option></select>
        </div>

        {showAlbumForm && <div className="profile-photos-create"><input autoFocus value={albumName} onChange={event => setAlbumName(event.target.value)} onKeyDown={event => { if (event.key === "Enter") void createAlbum(); }} placeholder="Nombre del álbum"/><button onClick={() => void createAlbum()}>Crear</button><button className="ghost" onClick={() => setShowAlbumForm(false)}>Cancelar</button></div>}

        {loading ? <div className="profile-photos-empty">Cargando fotos…</div> : visiblePhotos.length ? <>
          <div className="profile-photos-section-title"><div><h3>Fotos recientes</h3><span>Las últimas imágenes compartidas en tu perfil</span></div></div>
          <div className="profile-photos-grid">{visiblePhotos.slice(0, 12).map((photo, index) => <button key={photo.id} className="profile-photos-tile" onClick={() => void openPhoto(index)}><img src={photo.url} alt={photo.caption || "Foto"}/><span className="profile-photos-tile-meta">{dateText(photo.created_at)}</span></button>)}</div>
        </> : <div className="profile-photos-empty"><ImagePlus size={38}/><strong>Aún no hay fotos aquí</strong><span>{own ? "Sube la primera foto para estrenar tu galería." : "Este perfil todavía no ha publicado fotos."}</span></div>}
      </div>

      <aside className="profile-photos-albums-side">
        <div className="profile-photos-side-head"><div><h3>Mis álbumes</h3><span>{albums.length} álbumes</span></div>{own && <button onClick={() => setShowAlbumForm(true)} aria-label="Crear álbum"><Plus size={17}/></button>}</div>
        <div className="profile-photos-album-list">{albumCards.map(({ album, count, cover }) => <button key={album.id} className={`profile-photos-album ${albumId === album.id ? "active" : ""}`} onClick={() => setAlbumId(album.id)}><div className="profile-photos-album-cover">{cover ? <img src={cover} alt=""/> : <Album size={23}/>}</div><div><strong>{album.name}</strong><span>{count} {count === 1 ? "foto" : "fotos"}</span></div></button>)}</div>
        {own && <button className="profile-photos-all-albums" onClick={() => setShowAlbumForm(true)}>+ Crear álbum</button>}
      </aside>
    </div>

    {lightbox && activePhoto && <div className="profile-photos-lightbox" role="dialog" aria-modal="true" onMouseDown={event => { if (event.target === event.currentTarget) setLightbox(false); }}><button className="profile-photos-close" onClick={() => setLightbox(false)} aria-label="Cerrar"><X/></button><button className="profile-photos-nav prev" onClick={() => void movePhoto(-1)} aria-label="Anterior"><ChevronLeft/></button><div className="profile-photos-viewer"><img src={activePhoto.url} alt={activePhoto.caption || "Foto"}/><div className="profile-photos-info"><div><strong>{activePhoto.caption || "Foto"}</strong><span>{dateText(activePhoto.created_at)}</span></div><div className="profile-photos-actions"><button className={liked[activePhoto.id] ? "liked" : ""} onClick={() => void toggleLike()}><Heart size={17} fill={liked[activePhoto.id] ? "currentColor" : "none"}/> {likes[activePhoto.id] || 0}</button><span><MessageCircle size={17}/> {commentsCount[activePhoto.id] || 0}</span></div></div><div className="profile-photos-comments"><div className="profile-photos-comments-list">{comments.map(comment => <article key={comment.id}><small>{new Date(comment.created_at).toLocaleString("es-ES")}</small><p>{comment.content}</p></article>)}</div><div className="profile-photos-comment-form"><input value={commentText} onChange={event => setCommentText(event.target.value)} onKeyDown={event => { if (event.key === "Enter") void sendComment(); }} placeholder="Escribe un comentario…"/><button onClick={() => void sendComment()} disabled={sendingComment}>Enviar</button></div></div></div><button className="profile-photos-nav next" onClick={() => void movePhoto(1)} aria-label="Siguiente"><ChevronRight/></button></div>}
  </section>;
}
