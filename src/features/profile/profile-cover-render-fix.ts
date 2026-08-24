import { supabase } from "../../lib/supabase";

const COVER_SELECTOR = ".profile-view-cover.profile-view-cover-button";
const HEADER_SELECTOR = ".profile-view-header";
const INLINE_URL_RE = /url\((?:["']?)(.*?)(?:["']?)\)/i;
const PROFILE_VISUAL_STYLE_ID = "inkorium-profile-light-runtime-style";

function getProfileCover(): HTMLButtonElement | null {
  return document.querySelector<HTMLButtonElement>(COVER_SELECTOR);
}

function getInlineCoverUrl(cover: HTMLElement): string | null {
  const match = cover.style.backgroundImage.match(INLINE_URL_RE);
  return match?.[1] || null;
}

function installLightProfileVisualBaseline() {
  if (document.getElementById(PROFILE_VISUAL_STYLE_ID)) return;
  const style = document.createElement("style");
  style.id = PROFILE_VISUAL_STYLE_ID;
  style.textContent = `
    html body:has(.profile-view-page) { background: #f3f6fa !important; color: #14253b !important; }
    html body:has(.profile-view-page) .profile-view-page {
      max-width: 1180px !important;
      margin: 0 auto !important;
      padding: 18px 16px 40px !important;
      background: #f3f6fa !important;
      color: #14253b !important;
      font-family: Arial, Helvetica, sans-serif !important;
    }
    html body:has(.profile-view-page) .profile-view-cover {
      background-color: #dfe8f2 !important;
      border-color: #dfe6ee !important;
      border-bottom: 0 !important;
      border-radius: 10px 10px 0 0 !important;
      box-shadow: none !important;
    }
    html body:has(.profile-view-page) .profile-view-header {
      background: #fff !important;
      border-color: #dfe6ee !important;
      color: #14253b !important;
      box-shadow: none !important;
      border-radius: 0 !important;
    }
    html body:has(.profile-view-page) .profile-view-name-row h1 { color: #132a45 !important; }
    html body:has(.profile-view-page) .profile-view-handle { color: #6a7d92 !important; }
    html body:has(.profile-view-page) .profile-view-status-select,
    html body:has(.profile-view-page) .profile-view-status-label { color: #536b84 !important; }
    html body:has(.profile-view-page) .profile-view-bio { color: #3e5167 !important; }
    html body:has(.profile-view-page) .profile-view-tabs {
      background: #fff !important;
      border-color: #dfe6ee !important;
      color: #566b82 !important;
    }
    html body:has(.profile-view-page) .profile-view-tabs button { color: #566b82 !important; }
    html body:has(.profile-view-page) .profile-view-tabs button.active {
      color: #5b2db5 !important;
      border-bottom-color: #6a35c2 !important;
    }
    html body:has(.profile-view-page) .profile-view-card {
      background: #fff !important;
      border-color: #dfe6ee !important;
      color: #14253b !important;
      box-shadow: 0 1px 3px rgba(27,55,90,.035) !important;
    }
    html body:has(.profile-view-page) .profile-view-card h2,
    html body:has(.profile-view-page) .profile-view-section-head h2 { color: #17385c !important; }
    html body:has(.profile-view-page) .profile-view-listening { background: #f3f7fb !important; color: #728398 !important; }
    html body:has(.profile-view-page) .profile-view-empty { color: #8191a3 !important; }
    html body:has(.profile-view-page) .profile-view-side { color: #14253b !important; }
  `;
  document.head.appendChild(style);
}

function renderCoverImage(cover: HTMLButtonElement, url: string) {
  const existing = cover.querySelector<HTMLImageElement>(".profile-view-cover-image");
  if (existing?.src === url) return;
  existing?.remove();
  const image = document.createElement("img");
  image.className = "profile-view-cover-image";
  image.src = url;
  image.alt = "Foto de portada";
  image.decoding = "async";
  image.loading = "eager";
  image.addEventListener("error", () => image.remove(), { once: true });
  cover.appendChild(image);
}

async function syncCover() {
  const cover = getProfileCover();
  if (!cover) return false;
  installLightProfileVisualBaseline();
  cover.classList.add("profile-view-cover-final");

  const inlineUrl = getInlineCoverUrl(cover);
  if (inlineUrl) {
    renderCoverImage(cover, inlineUrl);
    return true;
  }

  const sessionResult = await supabase.auth.getSession();
  const userId = sessionResult.data.session?.user?.id;
  if (!userId) return false;

  const { data, error } = await supabase
    .from("profiles")
    .select("banner_url")
    .eq("id", userId)
    .maybeSingle();

  if (error || !data?.banner_url) return false;
  renderCoverImage(cover, data.banner_url);
  return true;
}

function normalizeHeader() {
  const header = document.querySelector<HTMLElement>(HEADER_SELECTOR);
  if (!header) return false;
  const avatar = header.querySelector<HTMLElement>(".profile-view-avatar-wrap");
  const identity = header.querySelector<HTMLElement>(".profile-view-identity");
  if (!avatar || !identity) return false;

  installLightProfileVisualBaseline();
  header.classList.add("profile-view-header-final");
  header.classList.add("profile-cover-header-synced");
  identity.classList.add("profile-view-identity-final");
  return true;
}

async function reconcile() {
  installLightProfileVisualBaseline();
  const coverReady = await syncCover();
  const headerReady = normalizeHeader();
  return coverReady && headerReady;
}

function boot() {
  let attempts = 0;
  let running = false;

  const tryReconcile = () => {
    if (running) return;
    running = true;
    void reconcile().finally(() => {
      running = false;
    });
  };

  tryReconcile();

  const observer = new MutationObserver(() => {
    if (++attempts > 40) {
      observer.disconnect();
      return;
    }
    if (document.querySelector(COVER_SELECTOR) || document.querySelector(HEADER_SELECTOR)) tryReconcile();
  });

  observer.observe(document.body, { childList: true, subtree: true });
  window.addEventListener("inkorium-profile-banner-updated", tryReconcile);
  window.addEventListener("pageshow", tryReconcile);
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", boot, { once: true });
} else {
  boot();
}
