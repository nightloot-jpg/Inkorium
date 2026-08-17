import { useState, useEffect } from "react";
import { Plus, Grid, List as ListIcon, Image as ImageIcon, Folders, Heart, Tag } from "lucide-react";
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
  const [activeTab, setActiveTab] = useState("all");
  const [stats, setStats] = useState({ photos: 0, albums: 0, likes: 0 });

  const targetUserId = profileId || session.user.id;
  const isOwnProfile = targetUserId === session.user.id;

  async function loadData() {
    setLoading(true);
    // Load Photos
    const { data: photosData } = await supabase
      .from('photos')
      .select('*, profiles!photos_user_id_fkey(username, full_name, avatar_url)')
      .eq('user_id', targetUserId)
      .order('created_at', { ascending: false });

    // Load Albums
    const { data: albumsData } = await supabase
      .from('photo_albums')
      .select('*')
      .eq('user_id', targetUserId)
      .order('created_at', { ascending: false });

    setPhotos(photosData || []);
    setAlbums(albumsData || []);
    setStats(s => ({ ...s, photos: photosData?.length || 0, albums: albumsData?.length || 0 }));
    setLoading(false);
  }

  useEffect(() => {
    loadData();
  }, [targetUserId]);

  return (
    <div className="photos-page">
      <div className="photos-layout">
        
        {/* LEFT COLUMN: NAVIGATION */}
        <aside className="photos-sidebar">
          <div className="panel" style={{ padding: 16 }}>
            <h3 style={{ margin: "0 0 16px", fontSize: "1em", color: "var(--text-light)" }}>Fotos</h3>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <button className="text-button" style={{ justifyContent: "flex-start", padding: 8, background: activeTab === 'all' ? 'var(--bg-color)' : 'transparent', borderRadius: 8 }} onClick={() => setActiveTab('all')}>
                <ImageIcon size={18} /> Mis fotos
              </button>
              <button className="text-button" style={{ justifyContent: "flex-start", padding: 8, background: activeTab === 'albums' ? 'var(--bg-color)' : 'transparent', borderRadius: 8 }} onClick={() => setActiveTab('albums')}>
                <Folders size={18} /> Álbumes
              </button>
              <button className="text-button" style={{ justifyContent: "flex-start", padding: 8, background: activeTab === 'favorites' ? 'var(--bg-color)' : 'transparent', borderRadius: 8 }} onClick={() => setActiveTab('favorites')}>
                <Heart size={18} /> Favoritas
              </button>
              <button className="text-button" style={{ justifyContent: "flex-start", padding: 8 }}>
                <Tag size={18} /> Etiquetas
              </button>
            </div>
          </div>
        </aside>

        {/* CENTER COLUMN: MAIN CONTENT */}
        <main className="photos-main">
          <header className="photos-header">
            <div>
              <h1>{isOwnProfile ? "Mis fotos" : "Fotos"}</h1>
            </div>
            {isOwnProfile && (
              <button className="primary-button" onClick={() => setShowUploader(true)} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px' }}>
                <Plus size={18} /> Subir fotos
              </button>
            )}
          </header>

          <div className="photos-tabs">
            <button className={`photos-tab ${activeTab === 'all' ? 'active' : ''}`} onClick={() => setActiveTab('all')}>Todas</button>
            <button className={`photos-tab ${activeTab === 'albums' ? 'active' : ''}`} onClick={() => setActiveTab('albums')}>Álbumes</button>
          </div>

          {loading ? (
            <p>Cargando fotos...</p>
          ) : (
            <>
              {activeTab === 'all' && (
                photos.length === 0 ? (
                  <div className="photos-empty-state">
                    <ImageIcon size={48} style={{ opacity: 0.5, marginBottom: 16 }} />
                    <h2>Aún no hay fotos</h2>
                    <p>Sube tus primeras imágenes para crear tu galería.</p>
                  </div>
                ) : (
                  <div className="photos-gallery">
                    {photos.map(photo => (
                      <PhotoCard key={photo.id} photo={photo} session={session} onClick={() => setSelectedPhoto(photo)} />
                    ))}
                  </div>
                )
              )}

              {activeTab === 'albums' && (
                albums.length === 0 ? (
                  <div className="photos-empty-state">
                    <Folders size={48} style={{ opacity: 0.5, marginBottom: 16 }} />
                    <h2>No hay álbumes</h2>
                    <p>Organiza tus fotos en álbumes.</p>
                  </div>
                ) : (
                  <div className="photos-albums">
                    {albums.map(album => (
                      <div key={album.id} className="photos-album-card">
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
        <aside className="photos-stats-sidebar">
          <div className="photos-stats">
            <h3>Estadísticas</h3>
            <div className="photos-stat-row">
              <span className="photos-stat-label">Fotos subidas</span>
              <span className="photos-stat-value">{stats.photos}</span>
            </div>
            <div className="photos-stat-row">
              <span className="photos-stat-label">Álbumes</span>
              <span className="photos-stat-value">{stats.albums}</span>
            </div>
          </div>
          
          <div className="panel" style={{ padding: 16 }}>
            <h3 style={{ margin: "0 0 12px", fontSize: "1em", color: "var(--text-color)" }}>Mis álbumes</h3>
            <div className="photos-albums" style={{ gridTemplateColumns: 'repeat(2, 1fr)' }}>
               {albums.slice(0, 4).map(album => (
                  <div key={album.id} className="photos-album-card">
                    <img src={album.cover_photo_url || "https://via.placeholder.com/150"} alt={album.name} />
                    <div className="photos-album-card-overlay" style={{ padding: '4px' }}>
                      <strong style={{ fontSize: '0.7em' }}>{album.name}</strong>
                    </div>
                  </div>
                ))}
            </div>
            {albums.length === 0 && <p style={{ fontSize: '0.85em', color: 'var(--text-light)', margin: 0 }}>Sin álbumes</p>}
          </div>
        </aside>

      </div>

      {showUploader && <PhotoUploader session={session} onClose={() => setShowUploader(false)} onSuccess={loadData} />}
      {selectedPhoto && <PhotoViewer photo={selectedPhoto} photos={photos} session={session} onClose={() => setSelectedPhoto(null)} onNavigate={setSelectedPhoto} />}
    </div>
  );
}
