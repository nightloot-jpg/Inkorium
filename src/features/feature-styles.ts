type RouteStylePage = 'inicio' | 'perfil' | 'personas' | 'musica' | 'videos' | 'fotos' | 'eventos';

const loaded = new Set<RouteStylePage>();

async function loadOnce(page: RouteStylePage, loader: () => Promise<unknown>) {
  if (loaded.has(page)) return;
  try {
    await loader();
    loaded.add(page);
  } catch (error) {
    console.error(`[Inkorium styles] No se pudieron cargar los estilos de ${page}:`, error);
  }
}

export function loadRouteStyles(page: RouteStylePage) {
  switch (page) {
    case 'perfil':
      return loadOnce(page, () => Promise.all([
        import('./profile/profile-photos-2026.css'),
        import('./profile/profile-photos-lightbox-2026.css'),
        import('./profile/profile-albums-moments-2026.css'),
        import('./profile/profile-home-2026.css'),
        import('./profile/profile-header-tabs-2026.css'),
        import('./profile/profile-music-2026.css'),
        import('./profile/profile-final-polish-2026.css'),
        import('./profile/profile-background-fix-2026.css'),
        import('./profile/profile-enhancements.css'),
        import('./profile/profile-view.css'),
        import('./profile/profile-about-card.css'),
        import('./profile/profile-videos-tab-2026.css'),
      ]));
    case 'personas':
      return loadOnce(page, () => Promise.all([
        import('./people-search-light.css'),
        import('./people-requests-light.css'),
      ]));
    case 'musica':
      return loadOnce(page, () => Promise.all([
        import('./music/music-2026.css'),
        import('./music/music-library-playlists-2026.css'),
        import('./music/music-upload-player-2026.css'),
        import('../music-redesign.css'),
      ]));
    case 'videos':
      return loadOnce(page, () => Promise.all([
        import('./videos/videos-2026.css'),
        import('./videos/videos-player-library-2026.css'),
        import('./videos/videos-uploader-2026.css'),
      ]));
    case 'fotos':
      return loadOnce(page, () => Promise.all([
        import('./profile/profile-photos-2026.css'),
        import('./profile/profile-photos-lightbox-2026.css'),
      ]));
    default:
      return Promise.resolve();
  }
}
