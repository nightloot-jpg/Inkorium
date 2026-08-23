import { supabase } from "../../lib/supabase";
import { createR2UploadTicket, uploadToPresignedUrl } from "../../lib/r2";

type Target = "avatar" | "banner";
const ROOT = "inkorium-direct-profile-media";
const STYLE = `${ROOT}-style`;

const userId = async () => {
  const { data } = await supabase.auth.getUser();
  if (!data.user?.id) throw new Error("La sesión ha caducado");
  return data.user.id;
};

const readFile = (file: File) => new Promise<string>((resolve, reject) => {
  const r = new FileReader();
  r.onload = () => resolve(String(r.result));
  r.onerror = () => reject(r.error || new Error("No se pudo leer la imagen"));
  r.readAsDataURL(file);
});

const readUrl = async (url: string) => {
  const response = await fetch(url, { mode: "cors", credentials: "omit" });
  if (!response.ok) throw new Error("No se pudo obtener la imagen de la galería");
  const blob = await response.blob();
  return readFile(new File([blob], "gallery-image.jpg", { type: blob.type || "image/jpeg" }));
};

function ensureStyle() {
  if (document.getElementById(STYLE)) return;
  const s = document.createElement("style"); s.id = STYLE;
  s.textContent = `
#${ROOT}{position:fixed;inset:0;z-index:30000;display:flex;align-items:center;justify-content:center;padding:18px;background:rgba(13,28,45,.62);font-family:Arial,Helvetica,sans-serif}
#${ROOT} *{box-sizing:border-box}#${ROOT} .box{width:min(920px,100%);max-height:92vh;overflow:auto;background:#fff;border:1px solid #dbe4ed;border-radius:16px;box-shadow:0 28px 90px rgba(10,24,40,.35);color:#17324f}
#${ROOT} .head{display:flex;justify-content:space-between;gap:14px;padding:18px 20px;border-bottom:1px solid #e8edf2}#${ROOT} h2{margin:0;font-size:20px}#${ROOT} .sub{margin-top:5px;color:#73869a;font-size:13px}
#${ROOT} .close{width:36px;height:36px;border:1px solid #d5dee8;border-radius:9px;background:#fff;color:#587087;font-size:22px;cursor:pointer}
#${ROOT} .source{padding:22px}.opts{display:grid;grid-template-columns:1fr 1fr;gap:14px}.opt{display:flex;align-items:center;gap:14px;padding:18px;border:1px solid #dbe4ed;border-radius:12px;background:#f9fbfd;cursor:pointer;text-align:left}.opt:hover{border-color:#6a35c2;box-shadow:0 6px 18px rgba(106,53,194,.08)}
#${ROOT} .ico{width:46px;height:46px;display:grid;place-items:center;border-radius:12px;background:#eee8fb;color:#6a35c2;font-size:24px;flex:0 0 46px}.opt strong{display:block;font-size:15px}.opt small{display:block;margin-top:3px;color:#73869a;font-size:12px}
#${ROOT} .gallery{padding:0 22px 22px}.ghead{display:flex;justify-content:space-between;align-items:center;margin-bottom:12px}.gback{border:1px solid #d4dfe9;border-radius:8px;background:#fff;padding:7px 10px;cursor:pointer}.grid{display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:10px}.item{padding:0;border:1px solid #dbe4ed;border-radius:9px;overflow:hidden;background:#eef3f7;aspect-ratio:1;cursor:pointer}.item img{width:100%;height:100%;object-fit:cover;display:block}.empty{padding:30px 10px;text-align:center;color:#7b8da0;background:#f7f9fb;border-radius:10px}
#${ROOT} .editor{display:grid;grid-template-columns:minmax(0,1fr) 250px;gap:18px;padding:20px}.stage{display:flex;align-items:center;justify-content:center;min-height:430px;padding:18px;background:#eef3f8;border:1px solid #dce5ef;border-radius:12px}canvas{display:block;max-width:100%;max-height:58vh;background:#dfe7ef;border-radius:10px;touch-action:none;cursor:grab}canvas.drag{cursor:grabbing}.controls{display:flex;flex-direction:column;gap:12px}.control{padding:13px;border:1px solid #e0e7ee;border-radius:10px;background:#fbfcfe}.control strong{display:block;margin-bottom:8px;font-size:13px}.range{width:100%}.rot{display:grid;grid-template-columns:1fr 1fr;gap:8px}.rot button,.footer button{height:38px;border:1px solid #d4dfe9;border-radius:8px;background:#fff;color:#49627a;font-weight:700;cursor:pointer}.footer{display:flex;justify-content:flex-end;gap:9px;padding:15px 20px;border-top:1px solid #e8edf2}.save{background:#6a35c2!important;color:#fff!important;border-color:#6a35c2!important}
@media(max-width:780px){.opts{grid-template-columns:1fr}.editor{grid-template-columns:1fr}.grid{grid-template-columns:repeat(3,minmax(0,1fr))}}
`;
  document.head.appendChild(s);
}
function close() { document.getElementById(ROOT)?.remove(); }

function editor(target: Target, source: string) {
  const root = document.getElementById(ROOT); if (!root) return;
  const image = new Image(); image.onload = () => {
    const w = target === "avatar" ? 720 : 1400, h = target === "avatar" ? 720 : 480;
    root.innerHTML = `<div class="box"><div class="head"><div><h2>Ajustar ${target === "avatar" ? "foto de perfil" : "foto de portada"}</h2><div class="sub">Recorta, mueve, amplía o gira la imagen.</div></div><button class="close" type="button">×</button></div><div class="editor"><div class="stage"><canvas width="${w}" height="${h}"></canvas></div><div class="controls"><div class="control"><strong>Zoom</strong><input class="range" type="range" min="1" max="3" step="0.01" value="1"></div><div class="control"><strong>Girar</strong><div class="rot"><button type="button" data-r="-90">↶ 90°</button><button type="button" data-r="90">↷ 90°</button></div></div></div></div><div class="footer"><button class="cancel" type="button">Cancelar</button><button class="save" type="button">Guardar imagen</button></div></div>`;
    root.querySelector(".close")?.addEventListener("click", close); root.querySelector(".cancel")?.addEventListener("click", close);
    const canvas = root.querySelector("canvas") as HTMLCanvasElement, ctx = canvas.getContext("2d"); if (!ctx) return;
    let zoom=1,rot=0,ox=0,oy=0,drag=false,sx=0,sy=0,sox=0,soy=0;
    const draw=()=>{const ratio=image.width/image.height,fr=w/h;let bw:number,bh:number;if(ratio>fr){bh=h;bw=h*ratio}else{bw=w;bh=w/ratio}const dw=bw*zoom,dh=bh*zoom;ctx.clearRect(0,0,w,h);ctx.fillStyle="#dfe7ef";ctx.fillRect(0,0,w,h);ctx.save();ctx.translate(w/2+ox,h/2+oy);ctx.rotate(rot*Math.PI/180);ctx.drawImage(image,-dw/2,-dh/2,dw,dh);ctx.restore()};
    (root.querySelector(".range") as HTMLInputElement).addEventListener("input",e=>{zoom=Number((e.target as HTMLInputElement).value);draw()});
    root.querySelectorAll<HTMLButtonElement>("[data-r]").forEach(b=>b.addEventListener("click",()=>{rot=(rot+Number(b.dataset.r||0)+360)%360;draw()}));
    canvas.addEventListener("pointerdown",e=>{drag=true;sx=e.clientX;sy=e.clientY;sox=ox;soy=oy;canvas.classList.add("drag");canvas.setPointerCapture(e.pointerId)});
    canvas.addEventListener("pointermove",e=>{if(!drag)return;ox=sox+(e.clientX-sx)*(w/canvas.clientWidth);oy=soy+(e.clientY-sy)*(h/canvas.clientHeight);draw()});
    const stop=()=>{drag=false;canvas.classList.remove("drag")};canvas.addEventListener("pointerup",stop);canvas.addEventListener("pointercancel",stop);
    root.querySelector(".save")?.addEventListener("click",async()=>{const save=root.querySelector<HTMLButtonElement>(".save")!;save.disabled=true;save.textContent="Guardando…";try{draw();const blob=await new Promise<Blob|null>(r=>canvas.toBlob(r,"image/jpeg",.92));if(!blob)throw new Error("No se pudo generar la imagen");const id=await userId();const file=new File([blob],`${target}.jpg`,{type:"image/jpeg"});const ticket=await createR2UploadTicket({folder:target==="avatar"?"avatars":"covers",file});await uploadToPresignedUrl(ticket.uploadUrl,blob,"image/jpeg");if(!ticket.url)throw new Error("El almacenamiento no devolvió una URL pública");const field=target==="avatar"?"avatar_url":"banner_url";const{error}=await supabase.from("profiles").update({[field]:ticket.url,updated_at:new Date().toISOString()}).eq("id",id);if(error)throw error;close();location.reload()}catch(error:any){alert(`No se pudo guardar la imagen: ${error?.message||"Error desconocido"}`);save.disabled=false;save.textContent="Guardar imagen"}});
    draw();
  }; image.onerror=()=>alert("No se pudo cargar la imagen"); image.src=source;
}

async function picker(target: Target) {
  close();ensureStyle();const root=document.createElement("div");root.id=ROOT;root.innerHTML=`<div class="box"><div class="head"><div><h2>Elegir ${target==="avatar"?"foto de perfil":"foto de portada"}</h2><div class="sub">Selecciona desde dónde quieres obtener la imagen.</div></div><button class="close" type="button">×</button></div><div class="source"><div class="opts"><button class="opt" data-pc type="button"><span class="ico">💻</span><span><strong>Desde mi PC</strong><small>Selecciona una imagen de tu ordenador</small></span></button><button class="opt" data-gallery type="button"><span class="ico">🖼️</span><span><strong>Desde mi galería</strong><small>Usa una imagen que ya tengas en Inkorium</small></span></button></div><input class="pick" type="file" accept="image/*" hidden></div><div class="gallery" hidden></div></div>`;document.body.appendChild(root);root.querySelector(".close")?.addEventListener("click",close);
  const input=root.querySelector<HTMLInputElement>(".pick")!;root.querySelector("[data-pc]")?.addEventListener("click",()=>input.click());input.addEventListener("change",async()=>{const file=input.files?.[0];if(file)editor(target,await readFile(file))});
  root.querySelector("[data-gallery]")?.addEventListener("click",async()=>{const opts=root.querySelector<HTMLElement>(".opts")!,g=root.querySelector<HTMLElement>(".gallery")!;opts.style.display="none";g.hidden=false;g.innerHTML='<div class="ghead"><strong>Tu galería</strong><button class="gback" type="button">← Volver</button></div><div class="empty">Cargando imágenes…</div>';g.querySelector(".gback")?.addEventListener("click",()=>{g.hidden=true;opts.style.display="grid"});try{const id=await userId();const{data,error}=await supabase.from("photos").select("id,url,caption,created_at").eq("user_id",id).order("created_at",{ascending:false}).limit(60);if(error)throw error;const photos=data||[];if(!photos.length){g.querySelector(".empty")!.textContent="Todavía no tienes fotos en tu galería.";return}g.querySelector(".empty")?.remove();const grid=document.createElement("div");grid.className="grid";for(const photo of photos){const b=document.createElement("button");b.type="button";b.className="item";const img=document.createElement("img");img.src=photo.url;img.alt=photo.caption||"Foto";b.appendChild(img);b.addEventListener("click",async()=>editor(target,await readUrl(photo.url)));grid.appendChild(b)}g.appendChild(grid)}catch(error:any){g.querySelector(".empty")!.textContent=`No se pudo cargar la galería: ${error?.message||"Error desconocido"}`}});
}

function install(){if((window as any).__inkoriumDirectProfileMediaInstalled)return;(window as any).__inkoriumDirectProfileMediaInstalled=true;document.addEventListener("click",event=>{const el=event.target as HTMLElement|null;const cover=el?.closest(".profile-view-cover-button.editable");const avatar=el?.closest(".profile-view-avatar-button.editable");if(!cover&&!avatar)return;event.preventDefault();event.stopPropagation();event.stopImmediatePropagation();void picker(cover?"banner":"avatar")},true)}
if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",install,{once:true});else install();
