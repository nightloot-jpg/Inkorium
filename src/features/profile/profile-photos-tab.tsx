import React from "react";
import { createRoot, type Root } from "react-dom/client";
import { supabase } from "../../lib/supabase";
import { ProfilePhotosGallery } from "./ProfilePhotosGallery";
import "./profile-fotos-header-fix.css";

let root: Root | null = null;
let host: HTMLDivElement | null = null;
let active = false;
let contextGrid: HTMLElement | null = null;
let originalGridDisplay = "";
let originalChildDisplays = new Map<HTMLElement, string>();

function context() {
  const page = document.querySelector<HTMLElement>(".profile-view-page");
  const grid = page?.querySelector<HTMLElement>(".profile-view-grid");
  const username = page?.querySelector(".profile-view-name-row h1")?.textContent?.trim() || "usuario";
  const tab = Array.from(page?.querySelectorAll<HTMLButtonElement>(".profile-view-tabs button") || [])
    .find(button => button.textContent?.trim().toLowerCase() === "fotos");
  return page && grid ? { page, grid, username, tab } : null;
}

function photosTabIsActive(ctx = context()) {
  return !!ctx?.tab && (
    ctx.tab.classList.contains("active") ||
    ctx.tab.getAttribute("aria-current") === "page" ||
    ctx.tab.getAttribute("aria-selected") === "true"
  );
}

async function resolveProfileId(username: string, fallback: string) {
  const { data } = await supabase.from("profiles").select("id").eq("username", username).maybeSingle();
  return data?.id || fallback;
}

async function mount() {
  const ctx = context();
  if (!ctx || active || !photosTabIsActive(ctx)) return;
  active = true;

  contextGrid = ctx.grid;
  originalGridDisplay = ctx.grid.style.display;
  originalChildDisplays = new Map();

  Array.from(ctx.grid.children).forEach(child => {
    const element = child as HTMLElement;
    originalChildDisplays.set(element, element.style.display);
    element.style.display = "none";
  });

  ctx.grid.classList.add("profile-view-photos-active");

  host = document.createElement("div");
  host.className = "profile-photos-host";
  host.style.display = "block";
  host.style.width = "100%";
  host.style.minWidth = "0";
  ctx.grid.prepend(host);

  const { data } = await supabase.auth.getSession();
  const currentUserId = data.session?.user?.id || "";
  const profileId = await resolveProfileId(ctx.username, currentUserId);

  if (!host?.isConnected) {
    active = false;
    contextGrid = null;
    originalChildDisplays.clear();
    return;
  }

  root = createRoot(host);
  root.render(
    <ProfilePhotosGallery
      profileId={profileId}
      username={ctx.username}
      own={!!currentUserId && profileId === currentUserId}
    />
  );
}

function unmount() {
  if (!active) return;
  active = false;

  root?.unmount();
  root = null;
  host?.remove();
  host = null;

  if (contextGrid) {
    contextGrid.classList.remove("profile-view-photos-active");
    contextGrid.style.display = originalGridDisplay;
  }

  for (const [element, display] of originalChildDisplays.entries()) {
    if (element.isConnected) element.style.display = display;
  }

  originalChildDisplays.clear();
  contextGrid = null;
  originalGridDisplay = "";
}

function sync() {
  const ctx = context();
  if (!ctx) return;
  const shouldShowPhotos = photosTabIsActive(ctx);
  if (shouldShowPhotos) {
    void mount();
  } else if (active) {
    unmount();
  }
}

function boot() {
  document.addEventListener("click", event => {
    const button = (event.target as Element | null)?.closest<HTMLButtonElement>(".profile-view-tabs button");
    if (!button) return;
    window.setTimeout(sync, 0);
  }, true);

  const observer = new MutationObserver(() => {
    sync();
  });

  observer.observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ["class", "aria-current", "aria-selected"] });
  window.addEventListener("pageshow", sync);
  window.setTimeout(sync, 0);
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", boot, { once: true });
} else {
  boot();
}
