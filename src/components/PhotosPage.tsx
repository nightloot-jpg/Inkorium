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
          <div className="photos-profile-card">
            <div className="photos-avatar">{session.user.user_metadata?.username?.[0]?.toUpperCase() || 'U'}</div>
            <div className="photos-profile-info">
              <strong>{session.user.user_metadata?.username || 'Usuario'}</strong>
              <em className="photos-online-status">● En línea</em>
              <button className="photos-link-button" onClick={() => navigate('perfil')}>Ver mi perfil »</button>
            </div>
          </div>
          <div className="photos-menu">
            <h3 className="photos-menu-title">FOTOS</h3>
            <div className="photos-menu-list">
              <button className="photos-menu-item" onClick={() => setActiveTab('all')}>
                <span>⌂</span> Novedades
              </button>
              <button className={`photos-menu-item ${activeTab === 'all' ? 'active' : ''}`} onClick={() => setActiveTab('all')}>
                <span>▣</span> Fotos
              </button>
              <button className={`photos-menu-item ${activeTab === 'albums' ? 'active' : ''}`} onClick={() => setActiveTab('albums')}>
                <span>▣</span> Álbumes
              </button>
              <button className="photos-menu-item" onClick={() => setActiveTab('all')}>
                <span>▣</span> Mis fotos
              </button>
              <button className={`photos-menu-item ${activeTab === 'favorites' ? 'active' : ''}`} onClick={() => setActiveTab('favorites')}>
                <span>★</span> Favoritas
              </button>
              <button className="photos-menu-item">
                <span>◇</span> Etiquetas
              </button>
              <button className="photos-menu-item">
                <span>▣</span> Comentarios
              </button>
            </div>
          </div>
          <div className="photos-storage">
            <h3 className="photos-menu-title">ALMACENAMIENTO</h3>
            <div className="photos-storage-bar-container">
              <div className="photos-storage-bar" style={{ width: '0%' }}></div>
            </div>
            <p className="photos-storage-text">0 MB de 5 GB utilizado</p>
          </div>
        </aside>

        {/* CENTER COLUMN: MAIN CONTENT */}
        <main className="photos-main">
          <header className="photos-header">
            <div className="photos-header-left">
              <h1><span className="photos-header-icon">📷</span> {isOwnProfile ? "Mis fotos" : "Fotos"}</h1>
              <p className="photos-header-subtitle">Aquí puedes ver y gestionar todas tus fotos.</p>
            </div>
            {isOwnProfile && (
              <button className="photos-primary-button" onClick={() => setShowUploader(true)}>
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
                    <span className="photos-empty-icon">📷</span>
                    <h2 className="photos-empty-title">Aún no hay fotos</h2>
                    <p className="photos-empty-desc">Sube tus primeras imágenes<br/>para crear tu galería.</p>
                    {isOwnProfile && (
                      <button className="photos-primary-button" onClick={() => setShowUploader(true)}>
                        <Plus size={18} /> Subir fotos
                      </button>
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
          <div className="photos-panel photos-popular">
            <h3 className="photos-panel-title">Mis álbumes</h3>
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
            {albums.length === 0 && <p className="photos-empty-text">Sin álbumes</p>}
          </div>
        </aside>

      </div>

      {showUploader && <PhotoUploader session={session} onClose={() => setShowUploader(false)} onSuccess={loadData} />}
      {selectedPhoto && <PhotoViewer photo={selectedPhoto} photos={photos} session={session} onClose={() => setSelectedPhoto(null)} onNavigate={setSelectedPhoto} />}
    </div>
  );
}
