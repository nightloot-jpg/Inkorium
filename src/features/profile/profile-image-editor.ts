import { createStorageUploadTicket, uploadToPresignedUrl } from '../../lib/storage';
import { supabase } from '../../lib/supabase';

type Target = 'avatar' | 'banner';
type EditorOptions = { target: Target; file: File; userId: string; onSaved?: (url: string, target: Target) => void };
type EditorState = { target: Target; userId: string; image: HTMLImageElement; zoom: number; rotation: number; offsetX: number; offsetY: number; onSaved?: (url: string, target: Target) => void };

const OVERLAY_ID = 'inkorium-profile-image-editor';
const STYLE_ID = `${OVERLAY_ID}-styles`;
const FRAME = { avatar: { width: 720, height: 720, label: 'foto de perfil' }, banner: { width: 1400, height: 480, label: 'foto de portada' } } as const;

function ensureStyles() {
  if (document.getElementById(STYLE_ID)) return;
  const style = document.createElement('style'); style.id = STYLE_ID;
  style.textContent = `#${OVERLAY_ID}{position:fixed;inset:0;z-index:30000;display:flex;align-items:center;justify-content:center;padding:24px;background:rgba(20,36,56,.64);backdrop-filter:blur(3px)}#${OVERLAY_ID} .pie-dialog{width:min(900px,100%);max-height:92vh;overflow:auto;background:#fff;border:1px solid #dbe4ed;border-radius:14px;box-shadow:0 24px 80px rgba(12,27,45,.28);color:#17324f;font-family:Arial,Helvetica,sans-serif}#${OVERLAY_ID} .pie-head{display:flex;justify-content:space-between;gap:16px;padding:18px 20px;border-bottom:1px solid #e8eef4}#${OVERLAY_ID} .pie-head h2{margin:0;font-size:19px}#${OVERLAY_ID} .pie-head p{margin:5px 0 0;font-size:13px;color:#73869a}#${OVERLAY_ID} .pie-close{width:34px;height:34px;border:1px solid #d6e0ea;border-radius:8px;background:#fff;color:#526b83;font-size:22px;cursor:pointer}#${OVERLAY_ID} .pie-body{display:grid;grid-template-columns:minmax(0,1fr) 220px;gap:16px;padding:18px}#${OVERLAY_ID} .pie-stage{display:flex;align-items:center;justify-content:center;min-height:390px;padding:16px;background:#eef3f8;border:1px solid #dfe7ef;border-radius:10px}#${OVERLAY_ID} canvas{display:block;max-width:100%;max-height:56vh;background:#dce5ee;border-radius:8px;box-shadow:0 8px 26px rgba(20,43,66,.12);touch-action:none;cursor:grab}#${OVERLAY_ID} canvas.dragging{cursor:grabbing}#${OVERLAY_ID} .pie-controls{display:flex;flex-direction:column;gap:12px}.pie-control{padding:13px;border:1px solid #e3eaf1;border-radius:10px;background:#f9fbfd}#${OVERLAY_ID} .pie-control h3{margin:0 0 8px;font-size:13px}.pie-range{width:100%}#${OVERLAY_ID} .pie-rotate{display:grid;grid-template-columns:1fr 1fr;gap:8px}.pie-rotate button{height:36px;border:1px solid #d5dfe8;border-radius:7px;background:#fff;color:#47627c;font-weight:700;cursor:pointer}#${OVERLAY_ID} .pie-note{font-size:12px;line-height:1.4;color:#71869c}#${OVERLAY_ID} .pie-footer{display:flex;justify-content:flex-end;gap:9px;padding:15px 20px;border-top:1px solid #e8eef4}#${OVERLAY_ID} .pie-footer button{padding:9px 14px;border-radius:8px;font-weight:800;cursor:pointer}.pie-cancel{border:1px solid #d3dee8;background:#fff;color:#536a80}.pie-save{border:1px solid #6a35c2;background:#6a35c2;color:#fff}.pie-save:disabled{opacity:.6;cursor:wait}@media(max-width:760px){#${OVERLAY_ID}{padding:10px}#${OVERLAY_ID} .pie-body{grid-template-columns:1fr}#${OVERLAY_ID} .pie-stage{min-height:300px}#${OVERLAY_ID} canvas{max-height:46vh}}`;
  document.head.appendChild(style);
}

function readFile(file: File): Promise<string> { return new Promise((resolve, reject) => { const reader = new FileReader(); reader.onload = () => resolve(String(reader.result)); reader.onerror = () => reject(reader.error || new Error('No se pudo leer la imagen.')); reader.readAsDataURL(file); }); }

async function persistImage(state: EditorState, canvas: HTMLCanvasElement) {
  const blob = await new Promise<Blob | null>(resolve => canvas.toBlob(resolve, 'image/jpeg', 0.92));
  if (!blob) throw new Error('No se pudo preparar la imagen final.');
  const file = new File([blob], `${state.target}.jpg`, { type: 'image/jpeg' });
  const ticket = await createStorageUploadTicket({ folder: state.target === 'banner' ? 'covers' : 'avatars', file });
  await uploadToPresignedUrl(ticket.uploadUrl, file, 'image/jpeg');
  if (!ticket.url) throw new Error('El almacenamiento no devolvió la URL de la imagen.');
  const field = state.target === 'banner' ? 'banner_url' : 'avatar_url';
  const { error } = await supabase.from('profiles').update({ [field]: ticket.url, updated_at: new Date().toISOString() }).eq('id', state.userId);
  if (error) throw error;
  state.onSaved?.(ticket.url, state.target);
}

export async function openProfileImageEditor({ target, file, userId, onSaved }: EditorOptions): Promise<void> {
  document.getElementById(OVERLAY_ID)?.remove(); ensureStyles();
  const source = await readFile(file); const image = new Image(); image.src = source;
  await new Promise<void>((resolve, reject) => { image.onload = () => resolve(); image.onerror = () => reject(new Error('No se pudo abrir la imagen seleccionada.')); });
  return new Promise<void>(resolve => {
    const frame = FRAME[target]; const state: EditorState = { target, userId, image, zoom: 1, rotation: 0, offsetX: 0, offsetY: 0, onSaved };
    const overlay = document.createElement('div'); overlay.id = OVERLAY_ID;
    overlay.innerHTML = `<div class="pie-dialog" role="dialog" aria-modal="true" aria-labelledby="pie-title"><div class="pie-head"><div><h2 id="pie-title">Ajusta tu ${frame.label}</h2><p>Recorta, mueve y gira la imagen antes de guardarla.</p></div><button type="button" class="pie-close" aria-label="Cerrar">×</button></div><div class="pie-body"><div class="pie-stage"><canvas width="${frame.width}" height="${frame.height}"></canvas></div><div class="pie-controls"><div class="pie-control"><h3>Zoom</h3><input class="pie-range" type="range" min="1" max="3" step="0.01" value="1" /></div><div class="pie-control"><h3>Girar</h3><div class="pie-rotate"><button type="button" data-rotate="-90">↶ 90°</button><button type="button" data-rotate="90">↷ 90°</button></div></div><div class="pie-control"><div class="pie-note">Arrastra la imagen dentro del marco. La proporción se mantendrá ${target === 'banner' ? 'para la portada' : 'en formato cuadrado'}.</div></div></div></div><div class="pie-footer"><button type="button" class="pie-cancel">Cancelar</button><button type="button" class="pie-save">Guardar imagen</button></div></div>`;
    document.body.appendChild(overlay);
    const canvas = overlay.querySelector('canvas') as HTMLCanvasElement; const ctx = canvas.getContext('2d'); if (!ctx) { overlay.remove(); resolve(); return; }
    const draw = () => { const w=canvas.width,h=canvas.height; ctx.clearRect(0,0,w,h); ctx.fillStyle='#dce5ee'; ctx.fillRect(0,0,w,h); const ratio=state.image.width/state.image.height, fr=w/h; let baseW:number,baseH:number; if(ratio>fr){baseH=h;baseW=h*ratio}else{baseW=w;baseH=w/ratio} const dw=baseW*state.zoom,dh=baseH*state.zoom; ctx.save();ctx.translate(w/2+state.offsetX,h/2+state.offsetY);ctx.rotate(state.rotation*Math.PI/180);ctx.drawImage(state.image,-dw/2,-dh/2,dw,dh);ctx.restore(); };
    const finish=()=>{overlay.remove();resolve();};
    overlay.querySelector<HTMLButtonElement>('.pie-close')?.addEventListener('click',finish); overlay.querySelector<HTMLButtonElement>('.pie-cancel')?.addEventListener('click',finish); overlay.addEventListener('mousedown',e=>{if(e.target===overlay)finish();});
    (overlay.querySelector('.pie-range') as HTMLInputElement).addEventListener('input',e=>{state.zoom=Number((e.target as HTMLInputElement).value);draw();});
    overlay.querySelectorAll<HTMLButtonElement>('[data-rotate]').forEach(btn=>btn.addEventListener('click',()=>{state.rotation=(state.rotation+Number(btn.dataset.rotate||0)+360)%360;draw();}));
    let dragging=false,startX=0,startY=0,originX=0,originY=0; canvas.addEventListener('pointerdown',e=>{dragging=true;startX=e.clientX;startY=e.clientY;originX=state.offsetX;originY=state.offsetY;canvas.classList.add('dragging');canvas.setPointerCapture(e.pointerId);}); canvas.addEventListener('pointermove',e=>{if(!dragging)return;state.offsetX=originX+(e.clientX-startX)*(canvas.width/canvas.clientWidth);state.offsetY=originY+(e.clientY-startY)*(canvas.height/canvas.clientHeight);draw();}); const stop=()=>{dragging=false;canvas.classList.remove('dragging');}; canvas.addEventListener('pointerup',stop);canvas.addEventListener('pointercancel',stop);
    overlay.querySelector<HTMLButtonElement>('.pie-save')?.addEventListener('click',async()=>{const button=overlay.querySelector<HTMLButtonElement>('.pie-save');if(!button)return;button.disabled=true;button.textContent='Guardando…';try{draw();await persistImage(state,canvas);finish();}catch(error){button.disabled=false;button.textContent='Guardar imagen';window.alert(error instanceof Error?error.message:'No se pudo guardar la imagen.');}});
    draw();
  });
}
