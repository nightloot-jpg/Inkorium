import React from "react";
import { createRoot, type Root } from "react-dom/client";
import { supabase } from "../../lib/supabase";
import { ProfilePhotosGallery } from "./ProfilePhotosGallery";

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
  return page && grid ? { page, grid, username } : null;
}

async function resolveProfileId(username: string, fallback: string) {
  const { data } = await supabase.from("profiles").select("id").eq("username", username).maybeSingle();
  return data?.id || fallback;
}

async function mount() {
  const ctx = context();
  if (!ctx || active) return;
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
  host.style.gridColumn = "1 / -1";

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

function bind() {
  document.querySelectorAll<HTMLButtonElement>(".profile-view-tabs button").forEach(button => {
    if (button.dataset.profilePhotosBound === "1") return;
    button.dataset.profilePhotosBound = "1";

    button.addEventListener(
      "click",
      () => {
        window.setTimeout(() => {
          if (button.textContent?.trim() === "Fotos") void mount();
          else unmount();
        }, 0);
      },
      true,
    );
  });
}

function boot() {
  bind();

  const observer = new MutationObserver(() => {
    bind();

    if (active && !host?.isConnected) {
      const grid = context()?.grid;
      active = false;
      root = null;
      host = null;
      contextGrid = grid || contextGrid;
      window.setTimeout(() => void mount(), 0);
    }
  });

  observer.observe(document.body, { childList: true, subtree: true });
  window.addEventListener("pageshow", bind);
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", boot, { once: true });
} else {
  boot();
}
