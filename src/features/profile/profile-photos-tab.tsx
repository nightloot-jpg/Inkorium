import React from "react";
import { createRoot, type Root } from "react-dom/client";
import { supabase } from "../../lib/supabase";
import { ProfilePhotosGallery } from "./ProfilePhotosGallery";

let root: Root | null = null;
let host: HTMLDivElement | null = null;
let hiddenGrid: HTMLElement | null = null;
let active = false;
let syncQueued = false;

function context() {
  const page = document.querySelector<HTMLElement>(".profile-view-page");
  const grid = page?.querySelector<HTMLElement>(".profile-view-grid");
  const username = page?.querySelector(".profile-view-name-row h1")?.textContent?.trim() || "usuario";
  const tabs = page?.querySelectorAll<HTMLButtonElement>(".profile-view-tabs button") || [];
  const photosTab = Array.from(tabs).find(button => button.textContent?.trim() === "Fotos") || null;
  const photosActive = !!photosTab && (photosTab.classList.contains("active") || photosTab.getAttribute("aria-selected") === "true");
  return page && grid ? { page, grid, username, photosActive } : null;
}

async function resolveProfileId(username: string, fallback: string) {
  const { data } = await supabase.from("profiles").select("id").eq("username", username).maybeSingle();
  return data?.id || fallback;
}

async function mount() {
  const ctx = context();
  if (!ctx || !ctx.photosActive || active) return;
  active = true;
  hiddenGrid = ctx.grid;
  hiddenGrid.style.display = "none";
  host = document.createElement("div");
  host.className = "profile-photos-host profile-photos-host-active";
  hiddenGrid.parentElement?.insertBefore(host, hiddenGrid.nextSibling);
  const { data } = await supabase.auth.getSession();
  const currentUserId = data.session?.user?.id || "";
  const profileId = await resolveProfileId(ctx.username, currentUserId);
  if (!host?.isConnected) { active = false; hiddenGrid = null; host = null; return; }
  root = createRoot(host);
  root.render(<ProfilePhotosGallery profileId={profileId} username={ctx.username} own={!!currentUserId && profileId === currentUserId} />);
}

function unmount() {
  if (!active) return;
  active = false;
  root?.unmount();
  root = null;
  host?.remove();
  host = null;
  if (hiddenGrid) hiddenGrid.style.display = "";
  hiddenGrid = null;
}

function sync() {
  if (syncQueued) return;
  syncQueued = true;
  window.setTimeout(() => {
    syncQueued = false;
    const ctx = context();
    if (!ctx) return;
    if (ctx.photosActive) {
      if (!active) void mount();
    } else if (active) {
      unmount();
    }
  }, 0);
}

function bind() {
  document.querySelectorAll<HTMLButtonElement>(".profile-view-tabs button").forEach(button => {
    if (button.dataset.profilePhotosBound === "1") return;
    button.dataset.profilePhotosBound = "1";
    button.addEventListener("click", sync, true);
  });
}

function boot() {
  bind();
  sync();
  const observer = new MutationObserver(() => {
    bind();
    sync();
  });
  observer.observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ["class", "aria-selected"] });
  window.addEventListener("pageshow", () => { bind(); sync(); });
}

if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot, { once: true }); else boot();
