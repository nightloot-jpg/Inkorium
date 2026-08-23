import { supabase } from "../../lib/supabase";

const ROOT_ID = "inkorium-composer-video-source-picker";
const STYLE_ID = `${ROOT_ID}-styles`;
const VIDEO_INPUT = "#video-upload";

function closePicker() {
  document.getElementById(ROOT_ID)?.remove();
}

function ensureStyles() {
  if (document.getElementById(STYLE_ID)) return;
  const style = document.createElement("style");
  style.id = STYLE_ID;
  style.textContent = `
    #${ROOT_ID}{position:fixed;inset:0;z-index:30050;display:flex;align-items:center;justify-content:center;padding:16px;background:rgba(12,28,45,.62);font-family:Arial,Helvetica,sans-serif}
    #${ROOT_ID} *{box-sizing:border-box}
    #${ROOT_ID} .cvs-dialog{width:min(760px,100%);max-height:88vh;overflow:auto;background:#fff;border:1px solid #dbe4ed;border-radius:16px;box-shadow:0 28px 90px rgba(10,24,40,.35);color:#17324f}
    #${ROOT_ID} .cvs-head{display:flex;justify-content:space-between;gap:14px;padding:18px 20px;border-bottom:1px solid #e8edf2}
    #${ROOT_ID} h2{margin:0;font-size:20px}
    #${ROOT_ID} p{margin:5px 0 0;font-size:13px;color:#73869a}
    #${ROOT_ID} .cvs-close{width:36px;height:36px;border:1px solid #d5dee8;border-radius:9px;background:#fff;color:#587087;font-size:22px;cursor:pointer}
    #${ROOT_ID} .cvs-body{padding:20px}
    #${ROOT_ID} .cvs-options{display:grid;grid-template-columns:1fr 1fr;gap:14px}
    #${ROOT_ID} .cvs-option{display:flex;align-items:center;gap:14px;padding:20px;border:1px solid #dbe4ed;border-radius:12px;background:#f9fbfd;cursor:pointer;text-align:left}
    #${ROOT_ID} .cvs-option:hover{border-color:#6a35c2;box-shadow:0 8px 22px rgba(106,53,194,.08);transform:translateY(-1px)}
    #${ROOT_ID} .cvs-icon{width:46px;height:46px;display:grid;place-items:center;border-radius:12px;background:#eee8fb;color:#6a35c2;font-size:22px}
    #${ROOT_ID} .cvs-option strong{display:block;font-size:15px}
    #${ROOT_ID} .cvs-option span{display:block;margin-top:3px;font-size:12px;color:#73869a}
    #${ROOT_ID} .cvs-gallery-head{display:flex;align-items:center;justify-content:space-between;margin-bottom:12px}
    #${ROOT_ID} .cvs-back{border:1px solid #d4dfe9;border-radius:8px;background:#fff;padding:7px 10px;color:#49627a;font-weight:700;cursor:pointer}
    #${ROOT_ID} .cvs-list{display:grid;gap:10px}
    #${ROOT_ID} .cvs-item{display:grid;grid-template-columns:180px 1fr;gap:14px;align-items:center;width:100%;padding:10px;border:1px solid #dde5ec;border-radius:10px;background:#fff;text-align:left;cursor:pointer}
    #${ROOT_ID} .cvs-item:hover{border-color:#6a35c2;background:#fbf9ff}
    #${ROOT_ID} .cvs-item video{width:180px;height:104px;object-fit:cover;border-radius:8px;background:#111}
    #${ROOT_ID} .cvs-meta strong{display:block;font-size:14px}
    #${ROOT_ID} .cvs-meta span{display:block;margin-top:4px;font-size:12px;color:#74879b}
    #${ROOT_ID} .cvs-empty{padding:28px 10px;text-align:center;color:#74879b;background:#f7f9fb;border-radius:10px}
    #${ROOT_ID} .cvs-loading{padding:28px 10px;text-align:center;color:#6a35c2}
    @media(max-width:700px){#${ROOT_ID} .cvs-options{grid-template-columns:1fr}#${ROOT_ID} .cvs-item{grid-template-columns:1fr}#${ROOT_ID} .cvs-item video{width:100%;height:180px}}
  `;
  document.head.appendChild(style);
}

async function currentUserId() {
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user?.id) throw new Error("La sesión ha caducado");
  return data.user.id;
}

async function resolveVideoUrl(rawUrl: string) {
  if (!rawUrl.startsWith("r2://")) return rawUrl;
  const key = rawUrl.slice(5);
  const { data, error } = await supabase.functions.invoke("r2-media", { body: { action: "get", key } });
  if (error || !data?.url) throw error || new Error("No se pudo obtener el vídeo");
  return String(data.url);
}

async function urlToFile(url: string, name: string) {
  const response = await fetch(url, { mode: "cors", credentials: "omit" });
  if (!response.ok) throw new Error("No se pudo descargar el vídeo seleccionado");
  const blob = await response.blob();
  const type = blob.type || "video/mp4";
  return new File([blob], name, { type });
}

function dispatchFileToComposer(file: File) {
  const input = document.querySelector(VIDEO_INPUT) as HTMLInputElement | null;
  if (!input) throw new Error("No se encontró el selector de vídeo del compositor");
  const transfer = new DataTransfer();
  transfer.items.add(file);
  input.files = transfer.files;
  input.dispatchEvent(new Event("change", { bubbles: true }));
  closePicker();
}

async function openGallery() {
  const root = document.getElementById(ROOT_ID);
  if (!root) return;
  const body = root.querySelector<HTMLElement>(".cvs-body");
  if (!body) return;
  body.innerHTML = `<div class="cvs-gallery-head"><strong>Mis vídeos</strong><button type="button" class="cvs-back">← Volver</button></div><div class="cvs-loading">Cargando vídeos…</div>`;
  body.querySelector<HTMLButtonElement>(".cvs-back")?.addEventListener("click", renderOptions);
  try {
    const userId = await currentUserId();
    const { data, error } = await supabase
      .from("user_videos")
      .select("id,title,url,source,created_at")
      .eq("user_id", userId)
      .eq("source", "upload")
      .order("created_at", { ascending: false })
      .limit(60);
    if (error) throw error;
    const videos = (data || []) as Array<{ id:string; title:string|null; url:string; source:string; created_at:string }>;
    if (!videos.length) {
      body.querySelector(".cvs-loading")!.outerHTML = `<div class="cvs-empty">Todavía no tienes vídeos subidos a tu galería.</div>`;
      return;
    }
    body.innerHTML = `<div class="cvs-gallery-head"><strong>Mis vídeos</strong><button type="button" class="cvs-back">← Volver</button></div><div class="cvs-list"></div>`;
    body.querySelector<HTMLButtonElement>(".cvs-back")?.addEventListener("click", renderOptions);
    const list = body.querySelector<HTMLElement>(".cvs-list")!;
    for (const video of videos) {
      const item = document.createElement("button");
      item.type = "button";
      item.className = "cvs-item";
      item.innerHTML = `<video muted preload="metadata"></video><span class="cvs-meta"><strong></strong><span>Vídeo de tu galería</span></span>`;
      const player = item.querySelector("video") as HTMLVideoElement;
      const title = item.querySelector("strong") as HTMLElement;
      title.textContent = video.title || "Vídeo sin título";
      try {
        player.src = await resolveVideoUrl(video.url);
      } catch {
        player.removeAttribute("src");
      }
      item.addEventListener("click", async () => {
        try {
          const resolvedUrl = await resolveVideoUrl(video.url);
          const file = await urlToFile(resolvedUrl, `${(video.title || "video").replace(/[^a-z0-9_-]+/gi, "-")}.mp4`);
          if (file.size > 1024 * 1024 * 1024) throw new Error("El vídeo supera el máximo de 1 GB");
          dispatchFileToComposer(file);
        } catch (error) {
          window.alert(error instanceof Error ? error.message : "No se pudo seleccionar el vídeo");
        }
      });
      list.appendChild(item);
    }
  } catch (error) {
    body.querySelector(".cvs-loading")!.outerHTML = `<div class="cvs-empty">No se pudo cargar la galería: ${(error as Error)?.message || "Error desconocido"}</div>`;
  }
}

function renderOptions() {
  closePicker();
  ensureStyles();
  const root = document.createElement("div");
  root.id = ROOT_ID;
  root.innerHTML = `<div class="cvs-dialog" role="dialog" aria-modal="true" aria-label="Elegir vídeo"><div class="cvs-head"><div><h2>Elegir vídeo</h2><p>Selecciona un vídeo desde tu PC o desde tu galería de Inkorium.</p></div><button type="button" class="cvs-close" aria-label="Cerrar">×</button></div><div class="cvs-body"><div class="cvs-options"><button type="button" class="cvs-option" data-source="pc"><span class="cvs-icon">💻</span><span><strong>Desde mi PC</strong><span>Selecciona un vídeo del ordenador</span></span></button><button type="button" class="cvs-option" data-source="gallery"><span class="cvs-icon">🎬</span><span><strong>Desde mi galería</strong><span>Usa uno de tus vídeos ya subidos</span></span></button></div><input id="${ROOT_ID}-input" type="file" accept="video/mp4,video/webm,video/ogg,video/quicktime" hidden></div></div>`;
  document.body.appendChild(root);
  root.querySelector<HTMLButtonElement>(".cvs-close")?.addEventListener("click", closePicker);
  root.addEventListener("mousedown", (event) => { if (event.target === root) closePicker(); });
  const input = root.querySelector<HTMLInputElement>(`#${ROOT_ID}-input`)!;
  root.querySelector<HTMLButtonElement>("[data-source=pc]")?.addEventListener("click", () => input.click());
  input.addEventListener("change", () => {
    const file = input.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("video/")) { window.alert("Selecciona un vídeo válido"); return; }
    if (file.size > 1024 * 1024 * 1024) { window.alert("El vídeo supera el máximo de 1 GB"); return; }
    dispatchFileToComposer(file);
  });
  root.querySelector<HTMLButtonElement>("[data-source=gallery]")?.addEventListener("click", () => void openGallery());
}

function install() {
  if ((window as any).__inkoriumComposerVideoSourcePickerInstalled) return;
  (window as any).__inkoriumComposerVideoSourcePickerInstalled = true;
  document.addEventListener("click", (event) => {
    const target = event.target as HTMLElement | null;
    const button = target?.closest(".composer-extended.video-mode .file-upload-trigger") as HTMLButtonElement | null;
    if (!button) return;
    event.preventDefault();
    event.stopPropagation();
    event.stopImmediatePropagation();
    renderOptions();
  }, true);
}

if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", install, { once: true });
else install();
