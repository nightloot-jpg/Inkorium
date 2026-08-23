import { supabase } from "../../lib/supabase";

const COVER_SELECTOR = ".profile-view-cover.profile-view-cover-button";
const HEADER_SELECTOR = ".profile-view-header";
const INLINE_URL_RE = /url\((?:["']?)(.*?)(?:["']?)\)/i;

function getProfileCover(): HTMLButtonElement | null {
  return document.querySelector<HTMLButtonElement>(COVER_SELECTOR);
}

function getInlineCoverUrl(cover: HTMLElement): string | null {
  const match = cover.style.backgroundImage.match(INLINE_URL_RE);
  return match?.[1] || null;
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

  header.classList.add("profile-view-header-final");
  header.classList.add("profile-cover-header-synced");
  identity.classList.add("profile-view-identity-final");
  return true;
}

async function reconcile() {
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
