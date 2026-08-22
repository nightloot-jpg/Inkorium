import { supabase } from '../../lib/supabase';
import './profile-cover-upload-direct.css';

const MAX_BYTES = 60 * 1024 * 1024;
const ACCEPTED = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif']);
let lastBannerUrl = '';

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

function applyBannerToDom(cover: HTMLButtonElement, url: string) {
  if (!url) return;
  cover.style.backgroundImage = `url("${url}")`;
  cover.style.backgroundSize = 'cover';
  cover.style.backgroundPosition = 'center';
  cover.querySelector('.profile-view-cover-placeholder')?.remove();
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

async function restorePersistedBanner() {
  try {
    const { data: sessionData } = await supabase.auth.getSession();
    const user = sessionData.session?.user;
    if (!user) return;
    const { data, error } = await supabase.from('profiles').select('banner_url').eq('id', user.id).maybeSingle();
    if (error) throw error;
    const bannerUrl = data?.banner_url || '';
    if (!bannerUrl) return;
    lastBannerUrl = bannerUrl;
    const cover = getCover();
    if (cover) applyBannerToDom(cover, bannerUrl);
  } catch (error) {
    console.warn('[Inkorium] Could not restore persisted profile cover:', error);
  }
}

async function uploadBanner(file: File, cover: HTMLButtonElement) {
  if (!ACCEPTED.has(file.type)) {
    setStatus(cover, 'Formato no válido. Usa JPG, PNG, WEBP o GIF.', 'error');
    return;
  }
  if (file.size > MAX_BYTES) {
    setStatus(cover, 'La portada no puede superar los 60 MB.', 'error');
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

    lastBannerUrl = bannerUrl;
    applyBannerToDom(cover, bannerUrl);
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
  if (!cover) return;

  if (lastBannerUrl) applyBannerToDom(cover, lastBannerUrl);
  if (cover.dataset.directCoverUpload === '1') return;
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

async function boot() {
  await restorePersistedBanner();
  enhanceCover();
  const observer = new MutationObserver(() => enhanceCover());
  observer.observe(document.body, { childList: true, subtree: true });
  window.addEventListener('inkorium-profile-route-ready', () => { void restorePersistedBanner(); void Promise.resolve(enhanceCover()); });
  window.addEventListener('inkorium-profile-banner-updated', event => {
    const detail = (event as CustomEvent<{ bannerUrl?: string }>).detail;
    if (detail?.bannerUrl) {
      lastBannerUrl = detail.bannerUrl;
      const cover = getCover();
      if (cover) applyBannerToDom(cover, detail.bannerUrl);
    }
  });
}

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', () => { void boot(); }, { once: true }); else void boot();
