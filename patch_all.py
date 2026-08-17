import re

# 1. MAIN.TSX
with open("src/main.tsx", "r") as f:
    content = f.read()

start_feed_layout = content.find('<div className="feed-layout">')
end_feed_layout = content.find('</aside></div>\n    <button className="chat">')

if start_feed_layout != -1 and end_feed_layout != -1:
    feed_layout_content = content[start_feed_layout:end_feed_layout + len('</aside></div>')]
    feed_layout_content = feed_layout_content.replace('{page === "fotos" && <PhotosPage session={session} profileId={currentRoute.params?.userId} navigate={navigate} />}', '')

    replacement = f'''{{page === "fotos" ? (
      <PhotosPage session={{session}} profileId={{currentRoute.params?.userId}} navigate={{navigate}} />
    ) : (
      {feed_layout_content}
    )}}'''

    new_content = content[:start_feed_layout] + replacement + content[end_feed_layout + len('</aside></div>'):]
    with open("src/main.tsx", "w") as f:
        f.write(new_content)


# 2. PHOTOSPAGE.TSX
with open("src/components/PhotosPage.tsx", "r") as f:
    content = f.read()

sidebar_replacement = """<aside className="photos-sidebar">
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
        </aside>"""

sidebar_start = content.find('<aside className="photos-sidebar">')
if sidebar_start != -1:
    sidebar_end = content.find('</aside>', sidebar_start) + len('</aside>')
    content = content[:sidebar_start] + sidebar_replacement + content[sidebar_end:]

rightbar_replacement = """<aside className="photos-rightbar">
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
        </aside>"""
rightbar_start = content.find('<aside className="photos-stats-sidebar">')
if rightbar_start != -1:
    rightbar_end = content.find('</aside>', rightbar_start) + len('</aside>')
    content = content[:rightbar_start] + rightbar_replacement + content[rightbar_end:]

empty_state_replacement = """<div className="photos-empty-state">
                    <span className="photos-empty-icon">📷</span>
                    <h2 className="photos-empty-title">Aún no hay fotos</h2>
                    <p className="photos-empty-desc">Sube tus primeras imágenes<br/>para crear tu galería.</p>
                    {isOwnProfile && (
                      <button className="photos-primary-button" onClick={() => setShowUploader(true)}>
                        <Plus size={18} /> Subir fotos
                      </button>
                    )}
                  </div>"""

import re
pattern1 = re.compile(r'<div className="photos-empty-state">\s*<ImageIcon[^>]*/>\s*<h2>Aún no hay fotos</h2>\s*<p>Sube tus primeras imágenes para crear tu galería\.</p>\s*</div>', re.MULTILINE)
content = pattern1.sub(empty_state_replacement, content)

header_replacement = """<header className="photos-header">
            <div className="photos-header-left">
              <h1><span className="photos-header-icon">📷</span> {isOwnProfile ? "Mis fotos" : "Fotos"}</h1>
              <p className="photos-header-subtitle">Aquí puedes ver y gestionar todas tus fotos.</p>
            </div>
            {isOwnProfile && (
              <button className="photos-primary-button" onClick={() => setShowUploader(true)}>
                <Plus size={18} /> Subir fotos
              </button>
            )}
          </header>"""

pattern = re.compile(r'<header className="photos-header">.*?</header>', re.DOTALL)
content = pattern.sub(header_replacement, content)

with open("src/components/PhotosPage.tsx", "w") as f:
    f.write(content)

# 3. CSS
with open("src/styles.css", "r") as f:
    css = f.read()

start_photos = css.find('/* --- PHOTOS PAGE --- */')
if start_photos == -1:
    start_photos = css.find('.photos-page {')

new_photos_css = """/* --- PHOTOS PAGE --- */
.photos-page {
  width: 100%;
  min-height: 100vh;
  background: var(--bg-color);
}

.photos-layout {
  display: grid;
  grid-template-columns: 260px minmax(0, 1fr) 300px;
  gap: 24px;
  padding: 20px 24px;
  max-width: 1400px;
  margin: 0 auto;
  align-items: start;
}

/* LEFT SIDEBAR */
.photos-sidebar {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.photos-profile-card {
  background: white;
  border-radius: 8px;
  padding: 20px;
  border: 1px solid var(--border-color);
  box-shadow: 0 1px 3px rgba(0,0,0,0.05);
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
}

.photos-avatar {
  width: 80px;
  height: 80px;
  border-radius: 50%;
  background: var(--primary-color);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 32px;
  font-weight: bold;
  margin-bottom: 12px;
}

.photos-profile-info strong {
  display: block;
  font-size: 1.1em;
  color: var(--text-color);
  margin-bottom: 4px;
}

.photos-online-status {
  display: block;
  color: #2e9e3e;
  font-size: 0.85em;
  font-style: normal;
  margin-bottom: 12px;
}

.photos-link-button {
  background: none;
  border: none;
  color: var(--primary-color);
  font-size: 0.9em;
  cursor: pointer;
  padding: 0;
}
.photos-link-button:hover {
  text-decoration: underline;
}

.photos-menu {
  background: white;
  border-radius: 8px;
  padding: 16px;
  border: 1px solid var(--border-color);
  box-shadow: 0 1px 3px rgba(0,0,0,0.05);
}

.photos-menu-title {
  font-size: 0.85em;
  color: var(--text-light);
  margin: 0 0 12px 0;
  font-weight: 700;
  letter-spacing: 0.5px;
}

.photos-menu-list {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.photos-menu-item {
  display: flex;
  align-items: center;
  gap: 12px;
  background: none;
  border: none;
  padding: 10px 12px;
  border-radius: 6px;
  cursor: pointer;
  color: var(--text-color);
  font-size: 0.95em;
  text-align: left;
  transition: all 0.2s ease;
}

.photos-menu-item:hover {
  background: var(--bg-hover);
}

.photos-menu-item.active {
  background: #e8f0fe;
  color: var(--primary-color);
  font-weight: 600;
}

.photos-menu-item span {
  font-size: 1.2em;
  opacity: 0.7;
}
.photos-menu-item.active span {
  opacity: 1;
}

.photos-storage {
  background: white;
  border-radius: 8px;
  padding: 16px;
  border: 1px solid var(--border-color);
  box-shadow: 0 1px 3px rgba(0,0,0,0.05);
}

.photos-storage-bar-container {
  height: 6px;
  background: #eee;
  border-radius: 3px;
  margin-bottom: 8px;
  overflow: hidden;
}

.photos-storage-bar {
  height: 100%;
  background: var(--primary-color);
  border-radius: 3px;
}

.photos-storage-text {
  font-size: 0.85em;
  color: var(--text-light);
  margin: 0;
}

/* MAIN CONTENT (CENTER) */
.photos-main {
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.photos-header {
  background: white;
  border-radius: 8px;
  padding: 24px;
  border: 1px solid var(--border-color);
  box-shadow: 0 1px 3px rgba(0,0,0,0.05);
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
}

.photos-header-left h1 {
  margin: 0 0 8px 0;
  font-size: 1.5em;
  color: var(--text-color);
  display: flex;
  align-items: center;
  gap: 8px;
}

.photos-header-subtitle {
  margin: 0;
  color: var(--text-light);
  font-size: 0.95em;
}

.photos-primary-button {
  background: var(--primary-color);
  color: white;
  border: none;
  padding: 10px 16px;
  border-radius: 6px;
  font-weight: 600;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 8px;
  transition: background 0.2s;
}

.photos-primary-button:hover {
  background: #064085;
}

.photos-tabs {
  display: flex;
  gap: 24px;
  border-bottom: 1px solid var(--border-color);
  padding: 0 12px;
}

.photos-tab {
  background: none;
  border: none;
  padding: 12px 0;
  font-size: 0.95em;
  color: var(--text-light);
  cursor: pointer;
  font-weight: 500;
  position: relative;
}

.photos-tab:hover {
  color: var(--text-color);
}

.photos-tab.active {
  color: var(--primary-color);
  font-weight: 600;
}

.photos-tab.active::after {
  content: '';
  position: absolute;
  bottom: -1px;
  left: 0;
  right: 0;
  height: 3px;
  background: var(--primary-color);
  border-radius: 3px 3px 0 0;
}

/* EMPTY STATE */
.photos-empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 80px 20px;
  text-align: center;
  background: white;
  border-radius: 8px;
  border: 1px dashed var(--border-color);
  min-height: 400px;
}

.photos-empty-icon {
  font-size: 48px;
  margin-bottom: 24px;
  opacity: 0.8;
}

.photos-empty-title {
  font-size: 1.5em;
  color: var(--text-color);
  margin: 0 0 12px 0;
}

.photos-empty-desc {
  color: var(--text-light);
  font-size: 1.05em;
  line-height: 1.5;
  margin: 0 0 32px 0;
  max-width: 400px;
}

/* RIGHT SIDEBAR */
.photos-rightbar {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.photos-panel {
  background: white;
  border-radius: 8px;
  padding: 16px;
  border: 1px solid var(--border-color);
  box-shadow: 0 1px 3px rgba(0,0,0,0.05);
}

.photos-panel-title {
  font-size: 0.85em;
  color: var(--text-light);
  margin: 0 0 16px 0;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.photos-empty-text {
  font-size: 0.85em;
  color: var(--text-light);
  margin: 0;
}

.photos-gallery {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
}

@media (max-width: 1024px) {
  .photos-layout {
    grid-template-columns: 240px 1fr;
  }
  .photos-rightbar {
    display: none;
  }
}

@media (max-width: 768px) {
  .photos-layout {
    grid-template-columns: 1fr;
    padding: 12px;
  }
  .photos-sidebar {
    display: none;
  }
  .photos-gallery {
    grid-template-columns: repeat(2, 1fr);
  }
}

"""

end_photos_layout = css.find('.photos-gallery {')
if end_photos_layout != -1:
    remaining_css = css[end_photos_layout:]
    # Strip any old photos gallery CSS out of remaining since we included it above
    remaining_css = re.sub(r'\.photos-gallery\s*\{[^}]*\}', '', remaining_css)
else:
    remaining_css = ""

final_css = css[:start_photos] + new_photos_css + remaining_css

with open("src/styles.css", "w") as f:
    f.write(final_css)

print("Patch complete")
