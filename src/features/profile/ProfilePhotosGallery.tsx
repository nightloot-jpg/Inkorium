import React, { useEffect, useMemo, useRef, useState } from "react";
import { Album, CalendarDays, ChevronLeft, ChevronRight, Heart, ImagePlus, MessageCircle, Plus, Sparkles, Upload, X } from "lucide-react";
import { supabase } from "../../lib/supabase";
import "../../profile-photos-v2.css";

type Photo = { id: string; url: string; caption: string | null; created_at: string; album_id: string | null; visibility: string };
type AlbumRow = { id: string; name: string; description: string | null; cover_photo_url: string | null; created_at: string };
type CommentRow = { id: string; author_id: string; content: string; created_at: string };
type ViewMode = "all" | "albums" | "moments";
type Moment = { id: string; title: string; subtitle: string; date: string; cover: string; photos: Photo[] };

const MAX_UPLOAD = 60 * 1024 * 1024;
const ALLOWED = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);
const DEFAULT_ALBUM_NAMES = new Set(["perfil", "fotos de mi perfil"]);

async function ensureDefaultAlbum(userId: string) {
  const { data } = await supabase.from("photo_albums").select("id,name,description,cover_photo_url,created_at").eq("user_id", userId).order("created_at", { ascending: true });
  if (data?.length) return data as AlbumRow[];
  const { data: created, error } = await supabase.from("photo_albums").insert({ user_id: userId, name: "Perfil", description: "Fotos de mi perfil" }).select("id,name,description,cover_photo_url,created_at").single();
  if (error) throw error;
  return created ? [created as AlbumRow] : [];
}

const dateText = (value: string) => new Date(value).toLocaleDateString("es-ES", { day: "numeric", month: "short", year: "numeric" });
const monthText = (value: string) => new Date(value).toLocaleDateString("es-ES", { month: "long", year: "numeric" });
const albumIsDefault = (album?: AlbumRow) => !!album && DEFAULT_ALBUM_NAMES.has(album.name.trim().toLowerCase());

export function ProfilePhotosGallery({ profileId, username, own }: { profileId: string; username: string; own: boolean }) {
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [albums, setAlbums] = useState<AlbumRow[]>([]);
  const [albumId, setAlbumId] = useState<string | null>(null);
  const [sort, setSort] = useState<"newest" | "oldest">("newest");
  const [view, setView] = useState<ViewMode>("all");
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [showAlbumForm, setShowAlbumForm] = useState(false);
  const [albumName, setAlbumName] = useState("");
  const [selected, setSelected] = useState(0);
  const [lightbox, setLightbox] = useState(false);
  const [lightboxPhotos, setLightboxPhotos] = useState<Photo[]>([]);
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

  const albumCards = useMemo(() => albums.map(album => ({
    album,
    count: photos.filter(photo => photo.album_id === album.id).length,
    cover: album.cover_photo_url || photos.find(photo => photo.album_id === album.id)?.url,
  })), [albums, photos]);

  const moments = useMemo<Moment[]>(() => {
    const byAlbum = new Map<string, Photo[]>();
    const monthGroups = new Map<string, Photo[]>();
    const albumMap = new Map(albums.map(album => [album.id, album]));

    photos.forEach(photo => {
      const album = photo.album_id ? albumMap.get(photo.album_id) : undefined;
      if (album && !albumIsDefault(album)) {
        const group = byAlbum.get(album.id) || [];
        group.push(photo);
        byAlbum.set(album.id, group);
        return;
      }
      const key = new Date(photo.created_at).toISOString().slice(0, 7);
      const group = monthGroups.get(key) || [];
      group.push(photo);
      monthGroups.set(key, group);
    });

    const albumMoments: Moment[] = Array.from(byAlbum.entries()).map(([id, group]) => {
      const album = albumMap.get(id)!;
      const ordered = [...group].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      return {
        id: `album-${id}`,
        title: album.name,
        subtitle: `${ordered.length} ${ordered.length === 1 ? "foto" : "fotos"}`,
        date: ordered[0]?.created_at || album.created_at,
        cover: album.cover_photo_url || ordered[0]?.url || "",
        photos: ordered,
      };
    });

    const monthMoments: Moment[] = Array.from(monthGroups.entries()).map(([, group]) => {
      const ordered = [...group].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      return {
        id: `month-${ordered[0].created_at.slice(0, 7)}`,
        title: monthText(ordered[0].created_at),
        subtitle: `${ordered.length} ${ordered.length === 1 ? "foto" : "fotos"}`,
        date: ordered[0].created_at,
        cover: ordered[0].url,
        photos: ordered,
      };
    });

    return [...albumMoments, ...monthMoments].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [albums, photos]);

  const activePhoto = lightboxPhotos[selected] || lightboxPhotos[0];

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

  const openPhoto = async (photoList: Photo[], index: number) => {
    setLightboxPhotos(photoList);
    setSelected(index);
    setLightbox(true);
    const photo = photoList[index];
    if (photo) await loadPhotoMeta(photo);
  };

  const movePhoto = async (delta: number) => {
    if (!lightboxPhotos.length) return;
    const next = (selected + delta + lightboxPhotos.length) % lightboxPhotos.length;
    setSelected(next);
    const photo = lightboxPhotos[next];
    if (photo) await loadPhotoMeta(photo);
  };

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
    setView("albums");
    setAlbumId(null);
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

  const selectAlbum = (id: string | null) => {
    setAlbumId(id);
    setView("all");
  };

  return <section className="profile-photos-v2">
    <header className="profile-photos-v2-head">
      <div>
        <div className="profile-photos-v2-eyebrow"><span>FOTOS</span><i /> <span>{photos.length} recuerdos</span></div>
        <h2>Fotos de {username}</h2>
        <p>Tu historia visual, organizada en momentos.</p>
      </div>
      {own && <label className="profile-photos-v2-upload"><Upload size={16}/>{uploading ? "Subiendo…" : "Añadir foto"}<input ref={inputRef} type="file" accept="image/jpeg,image/png,image/webp,image/gif" disabled={uploading} onChange={event => { const file = event.target.files?.[0]; event.currentTarget.value = ""; if (file) void uploadPhoto(file); }}/></label>}
    </header>

    <nav className="profile-photos-v2-tabs" aria-label="Secciones de fotos">
      <button className={view === "all" ? "active" : ""} onClick={() => { setView("all"); setAlbumId(null); }}>Todas</button>
      <button className={view === "albums" ? "active" : ""} onClick={() => { setView("albums"); setAlbumId(null); }}>Álbumes <span>{albums.length}</span></button>
      <button className={view === "moments" ? "active" : ""} onClick={() => { setView("moments"); setAlbumId(null); }}>Momentos <span>{moments.length}</span></button>
    </nav>

    {showAlbumForm && <div className="profile-photos-v2-create"><div><strong>Nuevo álbum</strong><span>Agrupa tus fotos como quieras.</span></div><input autoFocus value={albumName} onChange={event => setAlbumName(event.target.value)} onKeyDown={event => { if (event.key === "Enter") void createAlbum(); }} placeholder="Nombre del álbum"/><button onClick={() => void createAlbum()}>Crear</button><button className="ghost" onClick={() => setShowAlbumForm(false)}>Cancelar</button></div>}

    {loading ? <div className="profile-photos-v2-empty">Cargando recuerdos…</div> : !photos.length ? <div className="profile-photos-v2-empty"><ImagePlus size={34}/><strong>Aún no hay fotos</strong><span>{own ? "Añade una foto y empieza a construir tu historia." : "Este perfil todavía no ha publicado fotos."}</span>{own && <label className="profile-photos-v2-empty-action">Añadir la primera<input type="file" accept="image/jpeg,image/png,image/webp,image/gif" onChange={event => { const file = event.target.files?.[0]; event.currentTarget.value = ""; if (file) void uploadPhoto(file); }}/></label>}</div> : <>
      {view === "all" && <div className="profile-photos-v2-content">
        <div className="profile-photos-v2-feature">
          <button className="profile-photos-v2-feature-image" onClick={() => void openPhoto(visiblePhotos, 0)}>
            <img src={visiblePhotos[0].url} alt={visiblePhotos[0].caption || "Foto destacada"}/>
            <span className="profile-photos-v2-feature-shade" />
            <span className="profile-photos-v2-feature-badge"><Sparkles size={14}/> Momento destacado</span>
            <span className="profile-photos-v2-feature-copy"><strong>{visiblePhotos[0].caption || `Recuerdo de ${monthText(visiblePhotos[0].created_at)}`}</strong><small>{dateText(visiblePhotos[0].created_at)} · abre para ver el momento</small></span>
          </button>
        </div>

        <div className="profile-photos-v2-section-head"><div><h3>{albumId ? (albums.find(album => album.id === albumId)?.name || "Álbum") : "Últimas fotos"}</h3><span>{albumId ? "Las fotos de esta colección." : "Las imágenes que más cerca están de hoy."}</span></div><select value={sort} onChange={event => setSort(event.target.value as "newest" | "oldest")} aria-label="Ordenar fotos"><option value="newest">Más recientes</option><option value="oldest">Más antiguas</option></select></div>
        {albumId && <div className="profile-photos-v2-filter-pill"><Album size={14}/> {albums.find(album => album.id === albumId)?.name || "Álbum"}<button onClick={() => setAlbumId(null)} aria-label="Quitar filtro">×</button></div>}
        <div className="profile-photos-v2-grid">{visiblePhotos.slice(0, 12).map((photo, index) => <button key={photo.id} className="profile-photos-v2-tile" onClick={() => void openPhoto(visiblePhotos, index)}><img src={photo.url} alt={photo.caption || "Foto"}/><span>{dateText(photo.created_at)}</span></button>)}</div>

        {!!albumCards.length && <div className="profile-photos-v2-rail-head"><div><h3>Álbumes</h3><span>Tu forma de guardar grandes momentos.</span></div><button onClick={() => setView("albums")}>Ver todos</button></div>}
        {!!albumCards.length && <div className="profile-photos-v2-album-rail">{albumCards.slice(0, 4).map(({ album, count, cover }) => <button key={album.id} className="profile-photos-v2-album-card" onClick={() => selectAlbum(album.id)}><div>{cover ? <img src={cover} alt=""/> : <Album size={24}/>}</div><strong>{album.name}</strong><span>{count} {count === 1 ? "foto" : "fotos"}</span></button>)}</div>}
      </div>}

      {view === "albums" && <div className="profile-photos-v2-view-grid"><div className="profile-photos-v2-section-head"><div><h3>Álbumes</h3><span>Las colecciones que has creado.</span></div>{own && <button className="profile-photos-v2-add-button" onClick={() => setShowAlbumForm(true)}><Plus size={15}/> Crear álbum</button>}</div><div className="profile-photos-v2-albums-grid">{albumCards.map(({ album, count, cover }) => <button key={album.id} className="profile-photos-v2-album-large" onClick={() => selectAlbum(album.id)}><div className="profile-photos-v2-album-large-cover">{cover ? <img src={cover} alt=""/> : <Album size={34}/>}<span>{count} {count === 1 ? "foto" : "fotos"}</span></div><div><strong>{album.name}</strong><small>{album.description || "Colección de fotos"}</small></div></button>)}</div></div>}

      {view === "moments" && <div className="profile-photos-v2-view-grid"><div className="profile-photos-v2-section-head"><div><h3>Momentos</h3><span>Una línea del tiempo visual, sin historias que desaparecen.</span></div></div><div className="profile-photos-v2-moments">{moments.map(moment => <article key={moment.id} className="profile-photos-v2-moment"><button className="profile-photos-v2-moment-cover" onClick={() => void openPhoto(moment.photos, 0)}><img src={moment.cover} alt=""/><span><Sparkles size={14}/> {moment.subtitle}</span></button><div className="profile-photos-v2-moment-copy"><div><CalendarDays size={15}/><small>{dateText(moment.date)}</small></div><h4>{moment.title}</h4><button onClick={() => void openPhoto(moment.photos, 0)}>Abrir momento <ChevronRight size={15}/></button></div></article>)}</div></div>}
    </>}

    {lightbox && activePhoto && <div className="profile-photos-v2-lightbox" role="dialog" aria-modal="true" onMouseDown={event => { if (event.target === event.currentTarget) setLightbox(false); }}><button className="profile-photos-v2-close" onClick={() => setLightbox(false)} aria-label="Cerrar"><X size={20}/></button><button className="profile-photos-v2-nav prev" onClick={() => void movePhoto(-1)} aria-label="Anterior"><ChevronLeft/></button><div className="profile-photos-v2-viewer"><img src={activePhoto.url} alt={activePhoto.caption || "Foto"}/><div className="profile-photos-v2-info"><div><strong>{activePhoto.caption || `Recuerdo de ${monthText(activePhoto.created_at)}`}</strong><span>{dateText(activePhoto.created_at)}</span></div><div className="profile-photos-v2-actions"><button className={liked[activePhoto.id] ? "liked" : ""} onClick={() => void toggleLike()}><Heart size={17} fill={liked[activePhoto.id] ? "currentColor" : "none"}/> {likes[activePhoto.id] || 0}</button><span><MessageCircle size={17}/> {commentsCount[activePhoto.id] || 0}</span></div></div><div className="profile-photos-v2-comments"><div className="profile-photos-v2-comments-list">{comments.map(comment => <article key={comment.id}><small>{new Date(comment.created_at).toLocaleString("es-ES")}</small><p>{comment.content}</p></article>)}</div><div className="profile-photos-v2-comment-form"><input value={commentText} onChange={event => setCommentText(event.target.value)} onKeyDown={event => { if (event.key === "Enter") void sendComment(); }} placeholder="Escribe un comentario…"/><button onClick={() => void sendComment()} disabled={sendingComment}>Enviar</button></div></div></div><button className="profile-photos-v2-nav next" onClick={() => void movePhoto(1)} aria-label="Siguiente"><ChevronRight/></button></div>}
  </section>;
}
