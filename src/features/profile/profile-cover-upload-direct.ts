import { supabase } from '../../lib/supabase';
import './profile-cover-upload-direct.css';

const MAX_BYTES = 10 * 1024 * 1024;
const ACCEPTED = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif']);

function getCover(): HTMLButtonElement | null {
  return document.querySelector<HTMLButtonElement>('.profile-view-cover-button.editable');
}

function getStatusHost(cover: HTMLElement): HTMLElement {
  let host = cover.parentElement?.querySelector<HTMLElement>('.profile-cover-upload-status');
  if (!host) {
    host = document.createElement('div');
    host.className = 'profile-cover-upload-status';
    cover.parentElement?.appendChild(host);
  }
  return host;
}

function setStatus(cover: HTMLElement, message: string, kind: 'idle' | 'loading' | 'success' | 'error' = 'idle') {
  const host = getStatusHost(cover);
  host.textContent = message;
  host.dataset.kind = kind;
  host.hidden = !message;
}

function makeInput(): HTMLInputElement {
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = 'image/jpeg,image/png,image/webp,image/gif';
  input.setAttribute('aria-label', 'Seleccionar foto de portada');
  input.className = 'profile-cover-upload-input';
  document.body.appendChild(input);
  return input;
}

async function uploadBanner(file: File, cover: HTMLButtonElement) {
  if (!ACCEPTED.has(file.type)) {
    setStatus(cover, 'Formato no válido. Usa JPG, PNG, WEBP o GIF.', 'error');
    return;
  }
  if (file.size > MAX_BYTES) {
    setStatus(cover, 'La portada no puede superar los 10 MB.', 'error');
    return;
  }

  const { data: refreshed, error: refreshError } = await supabase.auth.refreshSession();
  const user = refreshed.session?.user;
  if (refreshError || !user) {
    setStatus(cover, 'Tu sesión ha caducado. Recarga Inkorium e inténtalo de nuevo.', 'error');
    return;
  }

  setStatus(cover, 'Subiendo portada…', 'loading');

  try {
    const extension = file.name.split('.').pop()?.toLowerCase() || 'jpg';
    const path = `${user.id}/banner-${crypto.randomUUID()}.${extension}`;
    const { error: uploadError } = await supabase.storage
      .from('profile-media')
      .upload(path, file, { upsert: false, contentType: file.type, cacheControl: '3600' });
    if (uploadError) throw uploadError;

    const { data } = supabase.storage.from('profile-media').getPublicUrl(path);
    const bannerUrl = `${data.publicUrl}?v=${Date.now()}`;
    const { error: updateError } = await supabase
      .from('profiles')
      .update({ banner_url: bannerUrl, updated_at: new Date().toISOString() })
      .eq('id', user.id);
    if (updateError) throw updateError;

    cover.style.backgroundImage = `url("${bannerUrl}")`;
    cover.querySelector('.profile-view-cover-placeholder')?.remove();
    window.dispatchEvent(new CustomEvent('inkorium-profile-banner-updated', { detail: { userId: user.id, bannerUrl } }));
    setStatus(cover, 'Portada actualizada.', 'success');
    window.setTimeout(() => setStatus(cover, ''), 2200);
  } catch (error: any) {
    console.error('[Inkorium] Cover upload failed:', error);
    setStatus(cover, error?.message ? `No se pudo subir la portada: ${error.message}` : 'No se pudo subir la portada.', 'error');
  }
}

function enhanceCover() {
  const cover = getCover();
  if (!cover || cover.dataset.directCoverUpload === '1') return;
  cover.dataset.directCoverUpload = '1';

  const input = makeInput();
  input.addEventListener('change', () => {
    const file = input.files?.[0];
    input.value = '';
    if (file) void uploadBanner(file, cover);
  });

  cover.addEventListener('click', (event) => {
    event.preventDefault();
    event.stopImmediatePropagation();
    input.click();
  }, true);

  const overlay = cover.querySelector<HTMLElement>('.profile-view-image-overlay');
  if (overlay) overlay.innerHTML = '<span aria-hidden="true">📷</span><span>Cambiar portada</span>';
}

function boot() {
  enhanceCover();
  const observer = new MutationObserver(() => enhanceCover());
  observer.observe(document.body, { childList: true, subtree: true });
  window.addEventListener('inkorium-profile-route-ready', enhanceCover);
}

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot, { once: true }); else boot();
