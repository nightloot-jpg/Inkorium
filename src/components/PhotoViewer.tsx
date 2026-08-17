import { useState, useEffect } from "react";
import { X, ChevronLeft, ChevronRight, Heart, Share2, Tag as TagIcon, Search, Trash2 } from "lucide-react";
import { supabase } from "../lib/supabase";
import type { Session } from "@supabase/supabase-js";
import { formatPostTime } from "../utils";

type Props = {
  photo: any;
  photos: any[];
  session: Session;
  onClose: () => void;
  onNavigate: (photo: any) => void;
};

export function PhotoViewer({ photo, photos, session, onClose, onNavigate }: Props) {
  const currentIndex = photos.findIndex(p => p.id === photo.id);
  const [likes, setLikes] = useState(0);
  const [hasLiked, setHasLiked] = useState(false);
  const [comments, setComments] = useState<any[]>([]);
  const [newComment, setNewComment] = useState("");

  // Tagging State
  const [tags, setTags] = useState<any[]>([]);
  const [showTags, setShowTags] = useState(false);
  const [isTaggingMode, setIsTaggingMode] = useState(false);
  const [pendingTag, setPendingTag] = useState<{x: number, y: number} | null>(null);
  const [tagSearchQuery, setTagSearchQuery] = useState("");
  const [tagSearchResults, setTagSearchResults] = useState<any[]>([]);


  useEffect(() => {
    let cancelled = false;
    
    async function fetchDetails() {
      // Likes
      const { count } = await supabase.from('photo_likes').select('*', { count: 'exact', head: true }).eq('photo_id', photo.id);
      const { data: myLike } = await supabase.from('photo_likes').select('id').eq('photo_id', photo.id).eq('user_id', session.user.id).maybeSingle();
      
      // Tags
      const { data: tagsData } = await supabase
        .from('photo_tags')
        .select('*, profiles!user_id(id, username, full_name, avatar_url)')
        .eq('photo_id', photo.id);

      // Comments
      const { data: commentsData } = await supabase
        .from('photo_comments')
        .select('*, profiles!photo_comments_author_id_fkey(username, full_name, avatar_url)')
        .eq('photo_id', photo.id)
        .order('created_at', { ascending: true });

      if (!cancelled) {
        setLikes(count || 0);
        setHasLiked(!!myLike);
        setComments(commentsData || []);
        setTags(tagsData || []);
      }
    }
    
    fetchDetails();

    return () => { cancelled = true; };
  }, [photo.id, session.user.id]);

  // Debounced search for tagging
  useEffect(() => {
    if (!pendingTag || !tagSearchQuery.trim()) {
      setTagSearchResults([]);
      return;
    }

    const timeout = setTimeout(async () => {
      const query = tagSearchQuery.trim();
      const { data } = await supabase
        .from('profiles')
        .select('id, username, full_name, avatar_url')
        .or(`username.ilike.%${query}%,full_name.ilike.%${query}%`)
        .limit(10);
      setTagSearchResults(data || []);
    }, 300);

    return () => clearTimeout(timeout);
  }, [tagSearchQuery, pendingTag]);

  async function toggleLike() {
    if (hasLiked) {
      setHasLiked(false);
      setLikes(l => l - 1);
      await supabase.from('photo_likes').delete().match({ photo_id: photo.id, user_id: session.user.id });
    } else {
      setHasLiked(true);
      setLikes(l => l + 1);
      await supabase.from('photo_likes').insert({ photo_id: photo.id, user_id: session.user.id });
    }
  }

  async function postComment(e: React.FormEvent) {
    e.preventDefault();
    if (!newComment.trim()) return;

    const text = newComment.trim();
    setNewComment("");

    const { data } = await supabase
      .from('photo_comments')
      .insert({ photo_id: photo.id, author_id: session.user.id, content: text })
      .select('*, profiles!photo_comments_author_id_fkey(username, full_name, avatar_url)')
      .single();

    if (data) {
      setComments(prev => [...prev, data]);
    }
  }

  function handleImageClick(e: React.MouseEvent<HTMLDivElement>) {
    if (!isTaggingMode) return;

    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;

    setPendingTag({ x, y });
    setTagSearchQuery("");
    setTagSearchResults([]);
  }

  async function handleAddTag(user: any) {
    if (!pendingTag) return;
    console.log("[PHOTO TAG] user selected", user);
    console.log("[PHOTO TAG] inserting at", pendingTag);

    const { data, error } = await supabase
      .from('photo_tags')
      .insert({
        photo_id: photo.id,
        user_id: user.id,
        tagged_by: session.user.id,
        x: pendingTag.x,
        y: pendingTag.y
      })
      .select('*, profiles!user_id(id, username, full_name, avatar_url)')
      .single();

    if (!error && data) {
      console.log("[PHOTO TAG] inserted", data);
      setTags(prev => [...prev, data]);
      setPendingTag(null);
      setShowTags(true);
      console.log("[PHOTO TAG] state updated");
    } else {
      console.error("[PHOTO TAG] Error adding tag", error);
      alert("No tienes permiso para etiquetar en esta foto o ocurrió un error.");
    }
  }

  async function handleDeleteTag(tagId: string) {
    const { error } = await supabase.from('photo_tags').delete().eq('id', tagId);
    if (!error) {
      setTags(prev => prev.filter(t => t.id !== tagId));
    }
  }

  const canManageTags = photo.user_id === session.user.id;

  return (
    <div className="photos-viewer-overlay">
      <button className="photos-viewer-close" onClick={onClose}><X size={24} /></button>
      
      {currentIndex > 0 && (
        <button className="photos-viewer-nav prev" onClick={() => onNavigate(photos[currentIndex - 1])}>
          <ChevronLeft size={32} />
        </button>
      )}
      
      {currentIndex < photos.length - 1 && (
        <button className="photos-viewer-nav next" onClick={() => onNavigate(photos[currentIndex + 1])}>
          <ChevronRight size={32} />
        </button>
      )}

      <div className="photos-viewer-content" onClick={(e) => e.stopPropagation()}>
        <div className="photos-viewer-image-section">
          <div className="photos-viewer-image-container" onClick={handleImageClick} style={{ position: 'relative', display: 'inline-block', maxWidth: '100%', maxHeight: '100%' }}>
            <img src={photo.url} alt={photo.caption || "Fotografía"} style={{ display: 'block', maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} />

            {/* Render existing tags */}
            {showTags && tags.map(tag => (
              <div
                key={tag.id}
                className="photo-tag-marker"
                style={{ left: `${tag.x}%`, top: `${tag.y}%` }}
              >
                <div className="photo-tag-dot"></div>
                <div className="photo-tag-label">
                  {tag.profiles?.full_name || tag.profiles?.username}
                  {(canManageTags || tag.user_id === session.user.id) && (
                    <button className="photo-tag-delete" onClick={(e) => { e.stopPropagation(); handleDeleteTag(tag.id); }}><X size={12}/></button>
                  )}
                </div>
              </div>
            ))}

            {/* Render pending tag popover */}
            {pendingTag && (
              <div
                className="photo-tag-popover"
                style={{ left: `${pendingTag.x}%`, top: `${pendingTag.y}%` }}
                onClick={(e) => e.stopPropagation()}
              >
                <div className="photo-tag-popover-header">
                  <span>¿A quién quieres etiquetar?</span>
                  <button onClick={() => setPendingTag(null)}><X size={14}/></button>
                </div>
                <div className="photo-tag-popover-search">
                  <Search size={14} />
                  <input
                    type="text"
                    placeholder="Buscar personas..."
                    value={tagSearchQuery}
                    onChange={e => setTagSearchQuery(e.target.value)}
                    autoFocus
                  />
                </div>
                {tagSearchResults.length > 0 && (
                  <div className="photo-tag-popover-results">
                    {tagSearchResults.map(u => (
                      <div key={u.id} className="photo-tag-popover-user" onMouseDown={(e) => { e.preventDefault(); e.stopPropagation(); }} onClick={(e) => { e.stopPropagation(); handleAddTag(u); }}>
                        <div className="avatar tiny" style={{ width: 24, height: 24, flexShrink: 0 }}>
                          {u.avatar_url ? <img src={u.avatar_url} /> : (u.username?.[0] || 'U').toUpperCase()}
                        </div>
                        <span>{u.full_name || u.username}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Top floating controls */}
          <div className="photos-viewer-top-controls">
            <button
              className={`photos-viewer-control-btn ${isTaggingMode ? 'active' : ''}`}
              onClick={() => { setIsTaggingMode(!isTaggingMode); if(!isTaggingMode) setShowTags(true); setPendingTag(null); }}
            >
              <TagIcon size={16} /> {isTaggingMode ? "Cancelar etiquetado" : "Etiquetar personas"}
            </button>
            <button
              className="photos-viewer-control-btn"
              onClick={() => setShowTags(!showTags)}
            >
              <TagIcon size={16} /> {showTags ? "Ocultar etiquetas" : "Mostrar etiquetas"}
            </button>
          </div>

          {isTaggingMode && !pendingTag && (
             <div className="photos-viewer-tagging-hint">
               Pulsa sobre la foto para etiquetar a alguien
             </div>
          )}
        </div>
        
        <div className="photos-viewer-sidebar">
          <div className="photos-viewer-header">
            <div className="avatar tiny" style={{ width: 32, height: 32 }}>
              {photo.profiles?.avatar_url ? <img src={photo.profiles.avatar_url} /> : (photo.profiles?.username?.[0] || 'U').toUpperCase()}
            </div>
            <div>
              <strong style={{ display: 'block' }}>{photo.profiles?.username || photo.profiles?.full_name || 'Usuario'}</strong>
              <small style={{ color: 'var(--text-light)' }}>{formatPostTime(photo.created_at)}</small>
            </div>
          </div>
          
          <div className="photos-viewer-details">
            {photo.caption && <p className="photos-viewer-caption">{photo.caption}</p>}
          </div>

          <div className="photos-viewer-actions">
            <button style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, color: hasLiked ? '#e0245e' : 'inherit' }} onClick={toggleLike}>
              <Heart size={20} fill={hasLiked ? '#e0245e' : 'none'} />
              <span>{likes}</span>
            </button>
            <button style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
              <Share2 size={20} />
            </button>
          </div>


          {tags.length > 0 && (
            <div className="photos-viewer-sidebar-tags">
              <h4 style={{ margin: '0 0 12px 0', fontSize: '12px', color: '#666', textTransform: 'uppercase' }}>
                <TagIcon size={12} style={{marginRight: '4px', verticalAlign: 'middle'}}/> Etiquetas en esta foto
              </h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {tags.map(tag => (
                  <div key={tag.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                      <div className="avatar tiny" style={{ width: 24, height: 24, flexShrink: 0 }}>
                        {tag.profiles?.avatar_url ? <img src={tag.profiles.avatar_url} /> : (tag.profiles?.username?.[0] || 'U').toUpperCase()}
                      </div>
                      <span style={{ fontSize: '13px', fontWeight: 500, color: '#333' }}>
                        {tag.profiles?.full_name || tag.profiles?.username}
                      </span>
                    </div>
                    {(canManageTags || tag.user_id === session.user.id) && (
                      <button
                        onClick={() => handleDeleteTag(tag.id)}
                        style={{ background: 'none', border: 'none', color: '#999', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
                      >
                        <Trash2 size={14} />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="photos-viewer-comments">
            {comments.map(c => (
              <div key={c.id} style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
                <div className="avatar tiny" style={{ width: 24, height: 24, flexShrink: 0 }}>
                  {c.profiles?.avatar_url ? <img src={c.profiles.avatar_url} /> : (c.profiles?.username?.[0] || 'U').toUpperCase()}
                </div>
                <div>
                  <strong style={{ fontSize: '0.9em' }}>{c.profiles?.username || c.profiles?.full_name || 'Usuario'}</strong>
                  <p style={{ margin: '2px 0 0', fontSize: '0.95em' }}>{c.content}</p>
                </div>
              </div>
            ))}
          </div>
          
          <form onSubmit={postComment} style={{ padding: 16, borderTop: '1px solid var(--border)', display: 'flex', gap: 8 }}>
            <input 
              type="text" 
              placeholder="Añadir comentario..." 
              value={newComment}
              onChange={e => setNewComment(e.target.value)}
              style={{ flex: 1, padding: '8px 12px', borderRadius: 20, border: '1px solid var(--border)', background: 'var(--bg-color)' }}
            />
          </form>
        </div>
      </div>
    </div>
  );
}
