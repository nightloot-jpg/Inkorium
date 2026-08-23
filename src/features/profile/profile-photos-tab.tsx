import React from "react";
import { createRoot, type Root } from "react-dom/client";
import { supabase } from "../../lib/supabase";
import { ProfilePhotosGallery } from "./ProfilePhotosGallery";

let root: Root | null = null;
let host: HTMLDivElement | null = null;
let active = false;

function context() {
  const page = document.querySelector<HTMLElement>(".profile-view-page");
  const main = page?.querySelector<HTMLElement>(".profile-view-main");
  const username = page?.querySelector(".profile-view-name-row h1")?.textContent?.trim() || "usuario";
  return page && main ? { page, main, username } : null;
}

async function resolveProfileId(username: string, fallback: string) {
  const { data } = await supabase.from("profiles").select("id").eq("username", username).maybeSingle();
  return data?.id || fallback;
}

async function mount() {
  const ctx = context();
  if (!ctx || active) return;
  active = true;
  ctx.main.style.display = "none";
  host = document.createElement("div");
  host.className = "profile-photos-host";
  ctx.main.parentElement?.appendChild(host);
  const { data } = await supabase.auth.getSession();
  const currentUserId = data.session?.user?.id || "";
  const profileId = await resolveProfileId(ctx.username, currentUserId);
  if (!host?.isConnected) { active = false; return; }
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
  const ctx = context();
  if (ctx) ctx.main.style.display = "";
}

function bind() {
  document.querySelectorAll<HTMLButtonElement>(".profile-view-tabs button").forEach(button => {
    if (button.dataset.profilePhotosBound === "1") return;
    button.dataset.profilePhotosBound = "1";
    button.addEventListener("click", () => {
      window.setTimeout(() => {
        if (button.textContent?.trim() === "Fotos") void mount();
        else unmount();
      }, 0);
    }, true);
  });
}

function boot() {
  bind();
  const observer = new MutationObserver(() => {
    bind();
    if (active && !host?.isConnected) { active = false; root = null; host = null; setTimeout(() => void mount(), 0); }
  });
  observer.observe(document.body, { childList: true, subtree: true });
  window.addEventListener("pageshow", bind);
}

if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot, { once: true }); else boot();
