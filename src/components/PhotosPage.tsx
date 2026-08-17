import { useState, useEffect } from "react";
import { Plus, Home, Image as ImageIcon, Folder, Star, Tag, Folders } from "lucide-react";
import { supabase } from "../lib/supabase";
import type { Session } from "@supabase/supabase-js";
import { PhotoUploader } from "./PhotoUploader";
import { PhotoViewer } from "./PhotoViewer";
import { PhotoCard } from "./PhotoCard";

type Props = {
  session: Session;
  profileId?: string; // If viewed from a profile
  navigate: (page: "inicio" | "perfil" | "mensajes" | "personas" | "musica" | "buscar" | "fotos", params?: Record<string, any>) => void;
};

export function PhotosPage({ session, profileId, navigate }: Props) {
  const [photos, setPhotos] = useState<any[]>([]);
  const [albums, setAlbums] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showUploader, setShowUploader] = useState(false);
  const [selectedPhoto, setSelectedPhoto] = useState<any | null>(null);

  // Tabs: 'photos', 'albums', 'favorites', 'tags'
  const [activeTab, setActiveTab] = useState<"photos" | "albums" | "favorites" | "tags">("photos");
  const [selectedAlbum, setSelectedAlbum] = useState<any | null>(null);
  const [stats, setStats] = useState({ photos: 0, albums: 0 });

  const targetUserId = profileId || session.user.id;
  const isOwnProfile = targetUserId === session.user.id;

  async function loadData() {
    setLoading(true);
    setPhotos([]);
    setAlbums([]);

    try {
      if (activeTab === 'photos') {
        if (!isOwnProfile) {
          // Viewing someone else's photos
          const { data } = await supabase
            .from('photos')
            .select('*, profiles!photos_user_id_fkey(username, full_name, avatar_url)')
            .eq('user_id', targetUserId)
            .order('created_at', { ascending: false });
          setPhotos(data || []);
        } else {
          // Viewing own photos: show own + friends
          // 1. Get friends
          const { data: friendsData1 } = await supabase
            .from('friendships')
            .select('friend_id')
            .eq('user_id', session.user.id)
            .eq('status', 'accepted');

          const { data: friendsData2 } = await supabase
            .from('friendships')
            .select('user_id')
            .eq('friend_id', session.user.id)
            .eq('status', 'accepted');

          const friendIds = [
            ...(friendsData1?.map(f => f.friend_id) || []),
            ...(friendsData2?.map(f => f.user_id) || [])
          ];
          const userIds = [session.user.id, ...friendIds];

          const { data } = await supabase
            .from('photos')
            .select('*, profiles!photos_user_id_fkey(username, full_name, avatar_url)')
            .in('user_id', userIds)
            .order('created_at', { ascending: false });
          setPhotos(data || []);
        }
      } else if (activeTab === 'albums') {
        if (selectedAlbum) {
          // Load photos for selected album
          const { data } = await supabase
            .from('photos')
            .select('*, profiles!photos_user_id_fkey(username, full_name, avatar_url)')
            .eq('album_id', selectedAlbum.id)
            .order('created_at', { ascending: false });
          setPhotos(data || []);
        } else {
          // Load albums list
          const { data } = await supabase
            .from('photo_albums')
            .select('*')
            .eq('user_id', targetUserId)
            .order('created_at', { ascending: false });
          setAlbums(data || []);
        }
      } else if (activeTab === 'favorites') {
        // Load photos liked by the target user
        const { data } = await supabase
          .from('photo_likes')
          .select('photo_id, photos(*, profiles!photos_user_id_fkey(username, full_name, avatar_url))')
          .eq('user_id', targetUserId)
          .order('created_at', { ascending: false });

        // Extract the photos from the join
        const likedPhotos = (data || []).map((like: any) => like.photos).filter(Boolean);
        setPhotos(likedPhotos);
      } else if (activeTab === 'tags') {
        // Load photos where user is tagged
        const { data } = await supabase
          .from('photo_tags')
          .select('photo_id, photos(*, profiles!photos_user_id_fkey(username, full_name, avatar_url))')
          .eq('user_id', targetUserId)
          .order('created_at', { ascending: false });

        const taggedPhotos = (data || []).map((tag: any) => tag.photos).filter(Boolean);
        setPhotos(taggedPhotos);
      }

      // Always load stats for rightbar if it's the own profile or just generally
      const { count: photosCount } = await supabase.from('photos').select('*', { count: 'exact', head: true }).eq('user_id', targetUserId);
      const { count: albumsCount } = await supabase.from('photo_albums').select('*', { count: 'exact', head: true }).eq('user_id', targetUserId);
      setStats({ photos: photosCount || 0, albums: albumsCount || 0 });

    } catch (error) {
      console.error("Error loading photos data:", error);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, [targetUserId, activeTab, selectedAlbum]);

  const handleTabChange = (tab: "photos" | "albums" | "favorites" | "tags") => {
    setActiveTab(tab);
    setSelectedAlbum(null); // Reset album selection when changing tabs
  };

  return (
    <div className="photos-page">
      <div className="photos-layout">
        
        {/* LEFT COLUMN: NAVIGATION */}
        <aside className="photos-sidebar">
          <div className="photos-menu">
            <h3 className="photos-menu-title">FOTOS</h3>
            <div className="photos-menu-list">
              <button className="photos-menu-item" onClick={() => navigate('inicio')}>
                <Home size={18} /> <span>Novedades</span>
              </button>
              <button className={`photos-menu-item ${activeTab === 'photos' ? 'active' : ''}`} onClick={() => handleTabChange('photos')}>
                <ImageIcon size={18} /> <span>Fotos</span>
              </button>
              <button className={`photos-menu-item ${activeTab === 'albums' ? 'active' : ''}`} onClick={() => handleTabChange('albums')}>
                <Folder size={18} /> <span>Álbumes</span>
              </button>
              <button className={`photos-menu-item ${activeTab === 'favorites' ? 'active' : ''}`} onClick={() => handleTabChange('favorites')}>
                <Star size={18} /> <span>Favoritas</span>
              </button>
              <button className={`photos-menu-item ${activeTab === 'tags' ? 'active' : ''}`} onClick={() => handleTabChange('tags')}>
                <Tag size={18} /> <span>Etiquetas</span>
              </button>
            </div>
          </div>
        </aside>

        {/* CENTER COLUMN: MAIN CONTENT */}
        <main className="photos-main">
          <header className="photos-header">
            <div className="photos-header-left">
              <h1>
                <span className="photos-header-icon">
                  {activeTab === 'photos' && <ImageIcon size={24} />}
                  {activeTab === 'albums' && <Folder size={24} />}
                  {activeTab === 'favorites' && <Star size={24} />}
                  {activeTab === 'tags' && <Tag size={24} />}
                </span>
                {activeTab === 'photos' && "Fotos"}
                {activeTab === 'albums' && (selectedAlbum ? selectedAlbum.name : "Álbumes")}
                {activeTab === 'favorites' && "Favoritas"}
                {activeTab === 'tags' && "Etiquetas"}
              </h1>
              <p className="photos-header-subtitle">
                {activeTab === 'photos' && "Galería de fotos."}
                {activeTab === 'albums' && (selectedAlbum ? "Fotos de este álbum." : "Tus colecciones de fotos.")}
                {activeTab === 'favorites' && "Fotos que te gustan."}
                {activeTab === 'tags' && "Fotos donde apareces."}
              </p>
            </div>
            {isOwnProfile && activeTab === 'photos' && (
              <button className="photos-primary-button" onClick={() => setShowUploader(true)}>
                <Plus size={18} /> Subir fotos
              </button>
            )}
            {selectedAlbum && (
              <button className="photos-secondary-button" onClick={() => setSelectedAlbum(null)}>
                Volver a álbumes
              </button>
            )}
          </header>

          {loading ? (
            <div className="photos-loading">Cargando...</div>
          ) : (
            <>
              {(activeTab === 'photos' || (activeTab === 'albums' && selectedAlbum) || activeTab === 'favorites' || activeTab === 'tags') && (
                photos.length === 0 ? (
                  <div className="photos-empty-state">
                    <span className="photos-empty-icon">📷</span>
                    <h2 className="photos-empty-title">
                      {activeTab === 'photos' && "No hay fotos todavía."}
                      {activeTab === 'albums' && "Este álbum está vacío."}
                      {activeTab === 'favorites' && "No tienes fotos favoritas."}
                      {activeTab === 'tags' && "No apareces etiquetado en ninguna foto."}
                    </h2>
                    {activeTab === 'photos' && isOwnProfile && (
                       <p className="photos-empty-desc">Sube tus primeras imágenes para crear tu galería.</p>
                    )}
                  </div>
                ) : (
                  <div className="photos-gallery">
                    {photos.map(photo => (
                      <PhotoCard key={photo.id} photo={photo} session={session} onClick={() => setSelectedPhoto(photo)} />
                    ))}
                  </div>
                )
              )}

              {activeTab === 'albums' && !selectedAlbum && (
                albums.length === 0 ? (
                  <div className="photos-empty-state">
                    <Folders size={48} style={{ opacity: 0.5, marginBottom: 16 }} />
                    <h2 className="photos-empty-title">No hay álbumes</h2>
                    <p className="photos-empty-desc">No tienes álbumes todavía.</p>
                  </div>
                ) : (
                  <div className="photos-albums">
                    {albums.map(album => (
                      <div key={album.id} className="photos-album-card" onClick={() => setSelectedAlbum(album)} style={{cursor: 'pointer'}}>
                        <img src={album.cover_photo_url || "https://via.placeholder.com/150?text=Album"} alt={album.name} />
                        <div className="photos-album-card-overlay">
                          <strong>{album.name}</strong>
                          <small>Álbum</small>
                        </div>
                      </div>
                    ))}
                  </div>
                )
              )}
            </>
          )}
        </main>

        {/* RIGHT COLUMN: STATS */}
        <aside className="photos-rightbar">
          <div className="photos-panel photos-statistics">
            <h3 className="photos-panel-title">Estadísticas</h3>
            <div className="photos-stat-row">
              <span className="photos-stat-label">Fotos subidas</span>
              <span className="photos-stat-value">{stats.photos}</span>
            </div>
            <div className="photos-stat-row">
              <span className="photos-stat-label">Álbumes</span>
              <span className="photos-stat-value">{stats.albums}</span>
            </div>
          </div>
        </aside>

      </div>

      {showUploader && <PhotoUploader session={session} onClose={() => setShowUploader(false)} onSuccess={loadData} />}
      {selectedPhoto && <PhotoViewer photo={selectedPhoto} photos={photos} session={session} onClose={() => setSelectedPhoto(null)} onNavigate={setSelectedPhoto} />}
    </div>
  );
}
