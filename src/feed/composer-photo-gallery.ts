import { supabase } from "../lib/supabase";

const STYLE_ID = "inkorium-composer-gallery-style";
const MODAL_ID = "inkorium-composer-gallery-modal";

function escapeHtml(value: unknown): string {
  return String(value ?? "").replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;").replaceAll("'", "&#039;");
}

function ensureStyles() {
  if (document.getElementById(STYLE_ID)) return;
  const style = document.createElement("style");
  style.id = STYLE_ID;
  style.textContent = `
    .inkorium-photo-actions{display:flex;align-items:center;justify-content:center;gap:8px;margin-top:8px;flex-wrap:wrap}
    .inkorium-photo-gallery-btn{display:inline-flex;align-items:center;justify-content:center;gap:7px;padding:9px 14px;border:1px solid #cbd7e2;border-radius:4px;background:#fff;color:#315a7d;font:600 14px Arial,sans-serif;cursor:pointer}
    .inkorium-photo-gallery-btn:hover{background:#f3f7fb;border-color:#9eb7cc;color:#1766ad}
    .inkorium-photo-gallery-overlay{position:fixed;inset:0;z-index:10050;background:rgba(21,39,56,.48);display:flex;align-items:center;justify-content:center;padding:24px}
    .inkorium-photo-gallery-modal{width:min(760px,96vw);max-height:min(720px,90vh);overflow:hidden;background:#fff;border:1px solid #ccd7e1;border-radius:5px;box-shadow:0 12px 40px rgba(0,0,0,.2);display:flex;flex-direction:column}
    .inkorium-photo-gallery-header{display:flex;align-items:center;justify-content:space-between;padding:14px 16px;border-bottom:1px solid #e1e7ed}
    .inkorium-photo-gallery-header strong{font:700 16px Arial,sans-serif;color:#314b63}
    .inkorium-photo-gallery-close{width:30px;height:30px;border:0;background:transparent;color:#63798c;font-size:24px;cursor:pointer;border-radius:3px}
    .inkorium-photo-gallery-close:hover{background:#f0f4f7}
    .inkorium-photo-gallery-grid{padding:16px;overflow:auto;display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:10px}
    .inkorium-photo-gallery-item{position:relative;aspect-ratio:1;border:1px solid #d7e0e7;border-radius:4px;overflow:hidden;background:#edf2f6;padding:0;cursor:pointer}
    .inkorium-photo-gallery-item:hover{border-color:#3977ae;box-shadow:0 0 0 2px rgba(57,119,174,.12)}
    .inkorium-photo-gallery-item img{display:block;width:100%;height:100%;object-fit:cover}
    .inkorium-photo-gallery-empty,.inkorium-photo-gallery-loading{padding:40px 20px;text-align:center;color:#728396;font:13px Arial,sans-serif}
    @media(max-width:650px){.inkorium-photo-gallery-grid{grid-template-columns:repeat(3,minmax(0,1fr))}.inkorium-photo-gallery-overlay{padding:10px}}
  `;
  document.head.appendChild(style);
}

function getPhotoInput(): HTMLInputElement | null {
  return document.querySelector<HTMLInputElement>('input[type="file"][accept="image/*"]#photo-upload');
}

function setInputFile(input: HTMLInputElement, file: File) {
  const transfer = new DataTransfer();
  transfer.items.add(file);
  input.files = transfer.files;
  input.dispatchEvent(new Event("change", { bubbles: true }));
}

async function chooseGalleryPhoto(photo: any) {
  const input = getPhotoInput();
  if (!input) return;
  const response = await fetch(photo.url, { mode: "cors" });
  if (!response.ok) throw new Error("No se pudo cargar la foto.");
  const blob = await response.blob();
  const extension = (blob.type.split("/")[1] || "jpg").split(";")[0];
  setInputFile(input, new File([blob], `galeria-${photo.id}.${extension}`, { type: blob.type || "image/jpeg" }));
}

function closeModal() { document.getElementById(MODAL_ID)?.remove(); }

async function openGallery() {
  closeModal();
  ensureStyles();
  const overlay = document.createElement("div");
  overlay.id = MODAL_ID;
  overlay.className = "inkorium-photo-gallery-overlay";
  overlay.innerHTML = `<div class="inkorium-photo-gallery-modal" role="dialog" aria-modal="true"><div class="inkorium-photo-gallery-header"><strong>Elegir de mi galería</strong><button type="button" class="inkorium-photo-gallery-close" aria-label="Cerrar">×</button></div><div class="inkorium-photo-gallery-loading">Cargando tus fotos...</div></div>`;
  document.body.appendChild(overlay);
  overlay.querySelector<HTMLButtonElement>(".inkorium-photo-gallery-close")?.addEventListener("click", closeModal);
  overlay.addEventListener("click", (event) => { if (event.target === overlay) closeModal(); });

  const { data: sessionData } = await supabase.auth.getSession();
  const userId = sessionData.session?.user.id;
  if (!userId) { overlay.querySelector(".inkorium-photo-gallery-loading")!.textContent = "Inicia sesión para usar tu galería."; return; }

  const { data: photos, error } = await supabase.from("photos").select("id, url, created_at, caption").eq("user_id", userId).order("created_at", { ascending: false }).limit(80);
  const modal = overlay.querySelector(".inkorium-photo-gallery-modal")!;
  const loading = modal.querySelector(".inkorium-photo-gallery-loading")!;
  if (error) { loading.textContent = "No se pudo cargar la galería."; return; }
  if (!photos?.length) { loading.textContent = "Todavía no tienes fotos en tu galería. Puedes subir una desde tu dispositivo."; return; }

  loading.outerHTML = `<div class="inkorium-photo-gallery-grid">${photos.map((photo: any) => `<button type="button" class="inkorium-photo-gallery-item" data-gallery-photo="${escapeHtml(photo.id)}" title="Elegir esta foto"><img src="${escapeHtml(photo.url)}" alt="${escapeHtml(photo.caption || "Foto de mi galería")}" loading="lazy" /></button>`).join("")}</div>`;
  modal.querySelectorAll<HTMLButtonElement>("[data-gallery-photo]").forEach((button) => button.addEventListener("click", async () => {
    const photo = photos.find((item: any) => String(item.id) === button.dataset.galleryPhoto);
    if (!photo) return;
    button.disabled = true;
    try { await chooseGalleryPhoto(photo); closeModal(); } catch (error) { console.error("[COMPOSER_GALLERY]", error); button.disabled = false; }
  }));
}

function enhancePhotoMode() {
  const box = document.querySelector<HTMLElement>(".composer-extended.photo-mode .file-upload-box");
  if (!box || box.querySelector(".inkorium-photo-actions")) return;
  ensureStyles();
  const input = box.querySelector<HTMLInputElement>('input[type="file"]');
  const label = box.querySelector<HTMLLabelElement>("label");
  if (!input || !label) return;
  const actions = document.createElement("div");
  actions.className = "inkorium-photo-actions";
  actions.innerHTML = `<button type="button" class="inkorium-photo-gallery-btn">▦ Elegir de mi galería</button>`;
  actions.querySelector("button")?.addEventListener("click", openGallery);
  label.insertAdjacentElement("afterend", actions);
}

const observer = new MutationObserver(enhancePhotoMode);
observer.observe(document.body, { childList: true, subtree: true });
ensureStyles();
enhancePhotoMode();
