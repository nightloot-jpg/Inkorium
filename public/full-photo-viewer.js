(() => {
  if (window.__inkoriumFullPhotoViewerInstalled) return;
  window.__inkoriumFullPhotoViewerInstalled = true;

  const getImageFromTrigger = (node) => {
    let current = node;
    for (let i = 0; i < 10 && current; i += 1) {
      if (current.querySelector) {
        const image = current.querySelector('img[src], img[data-src]');
        if (image) return image;
      }
      current = current.parentElement;
    }
    return null;
  };

  const closeViewer = () => {
    const overlay = document.getElementById('inkorium-full-photo-viewer');
    if (overlay) overlay.remove();
    document.removeEventListener('keydown', onKeyDown);
  };

  const onKeyDown = (event) => {
    if (event.key === 'Escape') closeViewer();
  };

  const openViewer = (source, alt = 'Foto completa') => {
    closeViewer();
    if (typeof source !== 'string' || !/^(https?:\/\/|data:image\/|\/)/i.test(source.trim())) return;

    const overlay = document.createElement('div');
    overlay.id = 'inkorium-full-photo-viewer';
    overlay.setAttribute('role', 'dialog');
    overlay.setAttribute('aria-modal', 'true');
    Object.assign(overlay.style, {
      position: 'fixed', inset: '0', zIndex: '2147483647',
      background: 'rgba(0,0,0,.94)', display: 'flex',
      alignItems: 'center', justifyContent: 'center', padding: '24px',
      cursor: 'zoom-out', boxSizing: 'border-box'
    });

    const image = document.createElement('img');
    image.src = source;
    image.alt = alt;
    image.draggable = false;
    Object.assign(image.style, {
      display: 'block', width: 'auto', height: 'auto',
      maxWidth: 'calc(100vw - 48px)', maxHeight: 'calc(100vh - 48px)',
      objectFit: 'contain', borderRadius: '4px',
      boxShadow: '0 20px 60px rgba(0,0,0,.5)', cursor: 'default'
    });
    image.addEventListener('click', event => event.stopPropagation());

    const close = document.createElement('button');
    close.type = 'button';
    close.setAttribute('aria-label', 'Cerrar foto');
    close.textContent = '×';
    Object.assign(close.style, {
      position: 'absolute', top: '14px', right: '18px',
      width: '44px', height: '44px', border: '0', borderRadius: '50%',
      background: 'rgba(255,255,255,.16)', color: '#fff',
      fontSize: '32px', lineHeight: '1', cursor: 'pointer',
      display: 'flex', alignItems: 'center', justifyContent: 'center'
    });
    close.addEventListener('click', event => {
      event.stopPropagation();
      closeViewer();
    });

    overlay.addEventListener('click', event => {
      if (event.target === overlay) closeViewer();
    });

    overlay.append(image, close);
    document.body.appendChild(overlay);
    document.addEventListener('keydown', onKeyDown);
  };

  document.addEventListener('click', event => {
    let current = event.target;
    for (let i = 0; i < 12 && current && current !== document.body; i += 1) {
      const text = (current.textContent || '').replace(/\s+/g, ' ').trim();
      if (text === 'Ver foto completa') {
        const image = getImageFromTrigger(current);
        const source = image && (image.currentSrc || image.src || image.getAttribute('data-src'));
        if (!source) return;
        event.preventDefault();
        event.stopPropagation();
        openViewer(source, image.alt || 'Foto completa');
        return;
      }
      current = current.parentElement;
    }
  }, true);
})();
