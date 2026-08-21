import { supabase } from '../../lib/supabase';
import { usePlayerStore } from '../../lib/store';
import './profile-music-diary.css';

type Track = { id: string; title: string; artist: string | null; cover_url: string | null; youtube_id: string | null; source_type: string; album: string | null; user_id?: string | null };
type DiaryEntry = { id: string; entry_date: string; track_id: string; track?: Track | null };

const esc = (v: unknown) => String(v ?? '').replace(/[&<>\"']/g, c => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '\"':'&quot;', "'":'&#39;' }[c] || c));
const stripHtml = (v: string) => v.replace(/<[^>]*>/g, '').replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&amp;/g, '&');
const coverFor = (track?: Track | null) => track?.cover_url || (track?.youtube_id ? `https://i.ytimg.com/vi/${track.youtube_id}/hqdefault.jpg` : '');
const localDateKey = () => { const d = new Date(); const y = d.getFullYear(); const m = String(d.getMonth()+1).padStart(2,'0'); const day = String(d.getDate()).padStart(2,'0'); return `${y}-${m}-${day}`; };
const formatDate = (value: string) => { const d = new Date(`${value}T12:00:00`); return { day: String(d.getDate()).padStart(2,'0'), month: d.toLocaleDateString('es-ES',{month:'short'}).replace('.','').toUpperCase(), year: d.getFullYear() }; };
const play = (track?: Track | null) => { if (!track) return; const p = usePlayerStore.getState(); p.playSong({ type: track.source_type === 'youtube' ? 'youtube_song' : 'local_song', video_id: track.youtube_id || undefined, title: track.title, artist: track.artist || undefined, channel_title: track.artist || undefined, thumbnail: coverFor(track) } as any, false); };

let root: HTMLElement | null = null;
let profileId = '';
let isOwn = false;
let mounted = false;

async function resolveProfile() {
  if (!root) return { id:'', own:false };
  const handle = root.querySelector('.profile-view-handle')?.textContent?.trim().replace(/^@/,'') || '';
  const session = await supabase.auth.getSession();
  const ownId = session.data.session?.user?.id || '';
  if (!handle) return { id:ownId, own:true };
  const { data } = await supabase.from('profiles').select('id,username').eq('username',handle).maybeSingle();
  return { id:data?.id || '', own:data?.id === ownId };
}

async function loadDiary() {
  if (!profileId) return { entries:[] as DiaryEntry[], tracks:[] as Track[] };
  const { data: rows } = await supabase.from('profile_music_diary').select('id,entry_date,track_id').eq('user_id',profileId).order('entry_date',{ascending:false}).limit(120);
  const entries = (rows || []) as DiaryEntry[];
  const ids = entries.map(e => e.track_id).filter(Boolean);
  let tracks: Track[] = [];
  if (ids.length) { const { data } = await supabase.from('music_tracks').select('id,title,artist,cover_url,youtube_id,source_type,album,user_id').in('id',ids); tracks = (data || []) as Track[]; }
  const map = new Map(tracks.map(t => [t.id,t]));
  return { entries:entries.map(e => ({ ...e, track:map.get(e.track_id) || null })).filter(e => e.track) as DiaryEntry[], tracks };
}

async function getLibrary() {
  const { data } = await supabase.from('music_tracks').select('id,title,artist,cover_url,youtube_id,source_type,album,user_id').eq('user_id',profileId).order('created_at',{ascending:false}).limit(80);
  return (data || []) as Track[];
}

function closeModal() { document.querySelector('.profile-music-diary-modal-backdrop')?.remove(); }
function openModal(title: string, body: string) {
  closeModal();
  const host = document.createElement('div');
  host.className='profile-music-diary-modal-backdrop';
  host.innerHTML=`<div class="profile-music-diary-modal" role="dialog" aria-modal="true"><div class="profile-music-diary-modal-head"><h3>${esc(title)}</h3><button class="profile-music-diary-modal-close" data-diary-close>×</button></div><div class="profile-music-diary-modal-body">${body}</div></div>`;
  document.body.appendChild(host);
  host.addEventListener('click', e => { const t=e.target as HTMLElement; if(t.classList.contains('profile-music-diary-modal-backdrop') || t.closest('[data-diary-close]')) closeModal(); });
  return host;
}

async function chooseToday() {
  if (!isOwn || !profileId) return;
  const today = localDateKey();
  const { data: existing } = await supabase.from('profile_music_diary').select('id,track_id').eq('user_id',profileId).eq('entry_date',today).maybeSingle();
  if (existing) { window.alert('Ya has elegido tu canción del día. Mañana podrás elegir otra.'); return; }
  const host = openModal('Elegir canción del día', `<div class="profile-music-diary-picker-tabs"><button class="active" data-picker="youtube">YouTube</button><button data-picker="saved">Mi música</button></div><div class="profile-music-diary-search"><input id="diarySearch" placeholder="Busca una canción, artista o vídeo..."><button id="diarySearchBtn">Buscar</button></div><div id="diaryPickerResults" class="profile-music-diary-empty">Busca una canción en YouTube o abre Mi música.</div>`);
  const input = host.querySelector<HTMLInputElement>('#diarySearch')!;
  const results = host.querySelector<HTMLElement>('#diaryPickerResults')!;
  const renderSaved = async () => { const tracks=await getLibrary(); results.className=''; results.innerHTML=tracks.length ? tracks.map(t=>`<div class="profile-music-diary-picker-row"><img src="${esc(coverFor(t))}" alt=""><div><strong>${esc(t.title)}</strong><small>${esc(t.artist || 'Artista desconocido')}</small></div><button class="profile-music-diary-btn" data-saved-track="${t.id}">Elegir</button></div>`).join('') : '<div class="profile-music-diary-empty">Todavía no tienes canciones en tu biblioteca.</div>'; };
  const search = async () => { const q=input.value.trim(); if(!q) return; results.className='profile-music-diary-loading'; results.textContent='Buscando en YouTube…'; try { const key=import.meta.env.VITE_YOUTUBE_API_KEY; if(!key) throw new Error('Falta VITE_YOUTUBE_API_KEY'); const res=await fetch(`https://www.googleapis.com/youtube/v3/search?part=snippet&q=${encodeURIComponent(q)}&type=video&maxResults=12&key=${key}`); const data=await res.json(); if(!res.ok) throw new Error(data?.error?.message || 'No se pudo buscar en YouTube.'); results.className=''; results.innerHTML=(data.items || []).map((item:any)=>{ const r={youtube_id:item.id.videoId,title:stripHtml(item.snippet?.title||'Sin título'),artist:item.snippet?.channelTitle||'YouTube',cover_url:item.snippet?.thumbnails?.high?.url||item.snippet?.thumbnails?.medium?.url||item.snippet?.thumbnails?.default?.url||''}; return `<div class="profile-music-diary-picker-row"><img src="${esc(r.cover_url)}" alt=""><div><strong>${esc(r.title)}</strong><small>${esc(r.artist)}</small></div><button class="profile-music-diary-btn primary" data-youtube='${esc(JSON.stringify(r))}'>Elegir</button></div>`; }).join('') || '<div class="profile-music-diary-empty">No hemos encontrado resultados.</div>'; } catch(error:any) { results.className='profile-music-diary-empty profile-music-diary-error'; results.textContent=error?.message || 'No se pudo buscar.'; } };
  host.querySelector('#diarySearchBtn')?.addEventListener('click', () => void search());
  input.addEventListener('keydown', e => { if(e.key==='Enter') void search(); });
  host.querySelectorAll('[data-picker]').forEach(btn=>btn.addEventListener('click',()=>{ host.querySelectorAll('[data-picker]').forEach(x=>x.classList.remove('active')); btn.classList.add('active'); if((btn as HTMLElement).dataset.picker==='saved') void renderSaved(); else { results.className='profile-music-diary-empty'; results.textContent='Busca una canción en YouTube.'; } }));
  results.addEventListener('click', async e => {
    const t=e.target as HTMLElement;
    const saved=t.closest<HTMLElement>('[data-saved-track]');
    const yt=t.closest<HTMLElement>('[data-youtube]');
    try {
      if(saved) { const trackId=saved.dataset.savedTrack!; await insertToday(trackId,today); return; }
      if(yt) { const video=JSON.parse(yt.dataset.youtube||'{}'); let trackId=(await supabase.from('music_tracks').select('id').eq('user_id',profileId).eq('youtube_id',video.youtube_id).maybeSingle()).data?.id; if(!trackId) { const { data,error }=await supabase.from('music_tracks').insert({user_id:profileId,title:video.title,artist:video.artist,cover_url:video.cover_url,youtube_id:video.youtube_id,source_type:'youtube'}).select('id').single(); if(error) throw error; trackId=data.id; } await insertToday(trackId,today); }
    } catch(error:any) { window.alert(error?.message || 'No se pudo guardar la canción del día.'); }
  });
}

async function insertToday(trackId:string, today:string) {
  const { error } = await supabase.from('profile_music_diary').insert({user_id:profileId,track_id:trackId,entry_date:today});
  if(error) { if(String(error.message || '').toLowerCase().includes('duplicate') || String(error.code || '')==='23505') throw new Error('Hoy ya tienes una canción del día. Mañana podrás elegir otra.'); throw error; }
  closeModal(); await render();
}

function renderEntry(entry:DiaryEntry, index:number) {
  const date=formatDate(entry.entry_date); const today=entry.entry_date===localDateKey();
  return `<article class="profile-music-diary-entry"><div class="profile-music-diary-date"><span class="profile-music-diary-day">${date.day}</span><span class="profile-music-diary-month">${date.month} ${date.year}</span></div><div class="profile-music-diary-entry-main"><img class="profile-music-diary-entry-cover" src="${esc(coverFor(entry.track))}" alt=""><div><div class="profile-music-diary-entry-title">${esc(entry.track?.title)}</div><div class="profile-music-diary-entry-artist">${esc(entry.track?.artist || 'Artista desconocido')}</div><span class="profile-music-diary-entry-tag">${today ? 'Canción de hoy' : `Entrada ${index+1}`}</span></div></div><button class="profile-music-diary-entry-play" data-play-track="${entry.track?.id}" aria-label="Reproducir">▶</button></article>`;
}

async function render() {
  if(!root || mounted===false) return;
  const { entries } = await loadDiary();
  const today=localDateKey();
  const todayEntry=entries.find(e=>e.entry_date===today) || null;
  const artists=Array.from(new Set(entries.map(e=>e.track?.artist).filter(Boolean))).slice(0,10) as string[];
  const years=Array.from(new Set(entries.map(e=>formatDate(e.entry_date).year))).sort((a,b)=>Number(b)-Number(a));
  const grid=root.querySelector('.profile-view-grid'); if(!grid) return;
  grid.innerHTML=`<div class="profile-music-diary"><main class="profile-music-diary-main">
    <header class="profile-music-diary-header"><div><div class="profile-music-diary-kicker">TU HISTORIA MUSICAL</div><h2 class="profile-music-diary-title">Diario musical</h2><p class="profile-music-diary-sub">Una canción al día. Un pequeño recuerdo para cada fecha.</p></div><div class="profile-music-diary-actions"><button class="profile-music-diary-btn" data-diary-library>Mi biblioteca</button>${isOwn ? `<button class="profile-music-diary-btn primary" data-diary-today ${todayEntry?'disabled':''}>${todayEntry?'✓ Canción de hoy elegida':'＋ Elegir canción de hoy'}</button>`:''}</div></header>
    <section class="profile-music-diary-hero">${todayEntry ? `<div class="profile-music-diary-hero-song"><img class="profile-music-diary-cover" src="${esc(coverFor(todayEntry.track))}" alt=""><div class="profile-music-diary-track"><div class="profile-music-diary-hero-label">Canción del día · ${today}</div><div class="profile-music-diary-hero-title">${esc(todayEntry.track?.title)}</div><div class="profile-music-diary-hero-note">${esc(todayEntry.track?.artist || 'Artista desconocido')}</div><span class="profile-music-diary-lock">🔒 Una canción por día</span></div><button class="profile-music-diary-play" data-play-track="${todayEntry.track?.id}">▶</button></div>` : `<div class="profile-music-diary-hero-empty"><div><div class="profile-music-diary-hero-label">Hoy todavía está en blanco</div><div class="profile-music-diary-hero-title">¿Qué canción representa tu día?</div><p class="profile-music-diary-hero-note">Elige una sola. Mañana comenzará una nueva página.</p></div>${isOwn?`<button class="profile-music-diary-btn primary" data-diary-today>＋ Elegir canción</button>`:''}</div>`}</section>
    <section class="profile-music-diary-section"><div class="profile-music-diary-section-head"><h3 class="profile-music-diary-section-title">📖 Páginas del diario</h3><span style="color:#8a9aac;font-size:11px">${entries.length} ${entries.length===1?'día':'días'}</span></div><div class="profile-music-diary-timeline">${entries.length ? entries.map((e,i)=>renderEntry(e,i)).join('') : '<div class="profile-music-diary-empty">Todavía no hay páginas. Empieza hoy.</div>'}</div></section>
    <section class="profile-music-diary-section"><div class="profile-music-diary-section-head"><h3 class="profile-music-diary-section-title">Colección que va dejando huella</h3></div>${entries.length ? `<div class="profile-music-diary-mini-grid">${entries.slice(0,4).map(e=>`<div class="profile-music-diary-mini-card"><img src="${esc(coverFor(e.track))}" alt=""><div class="profile-music-diary-mini-title">${esc(e.track?.title)}</div><div class="profile-music-diary-mini-artist">${esc(e.track?.artist || '')}</div></div>`).join('')}</div>` : '<div class="profile-music-diary-empty">Cuando tengas varias páginas, aquí aparecerá una pequeña colección de recuerdos.</div>'}</section>
  </main><aside class="profile-music-diary-side">
    <section class="profile-music-diary-side-card"><h3 class="profile-music-diary-side-title">🎶 Tu gusto musical</h3><p class="profile-music-diary-side-sub">Los artistas que aparecen una y otra vez en tu diario.</p><div class="profile-music-diary-pills">${artists.length?artists.map(a=>`<span class="profile-music-diary-pill">${esc(a)}</span>`).join(''):'<span class="profile-music-diary-pill">Todavía sin pistas</span>'}</div></section>
    <section class="profile-music-diary-side-card"><h3 class="profile-music-diary-side-title">🗂 Archivo</h3><p class="profile-music-diary-side-sub">Tus capítulos musicales, por año.</p><div class="profile-music-diary-archive">${years.length?years.map(y=>{const count=entries.filter(e=>formatDate(e.entry_date).year===Number(y)).length; return `<div class="profile-music-diary-archive-item"><span>${y}</span><strong>${count}</strong></div>`}).join(''):'<div class="profile-music-diary-side-sub">Aún no hay capítulos.</div>'}</div></section>
    <section class="profile-music-diary-side-card"><h3 class="profile-music-diary-side-title">💜 Un detalle musical</h3><p class="profile-music-diary-side-sub">La biblioteca sigue viviendo en Música. Este diario guarda solamente un momento: una canción, un día.</p><button class="profile-music-diary-btn" data-diary-library>Ir a Música</button></section>
  </aside></div>`;
  grid.querySelectorAll('[data-play-track]').forEach(btn=>btn.addEventListener('click',()=>{ const id=(btn as HTMLElement).dataset.playTrack; const entry=entries.find(e=>e.track?.id===id); play(entry?.track); }));
  grid.querySelectorAll('[data-diary-today]').forEach(btn=>btn.addEventListener('click',()=>void chooseToday()));
  grid.querySelectorAll('[data-diary-library]').forEach(btn=>btn.addEventListener('click',()=>{ window.location.href='/music'; }));
}

function boot() {
  const page=document.querySelector<HTMLElement>('.profile-view-page'); if(!page || mounted) return;
  root=page; mounted=true;
  const observer=new MutationObserver(()=>{ const tab=document.querySelector('.profile-music-tab'); if(tab && !tab.querySelector('.profile-music-diary')) { void init(); } });
  observer.observe(document.body,{childList:true,subtree:true});
  const tabs=page.querySelectorAll<HTMLButtonElement>('.profile-view-tabs button'); tabs.forEach(tab=>tab.addEventListener('click',()=>{ if(tab.textContent?.trim()==='Música') setTimeout(()=>void init(),50); }));
}
async function init(){ const resolved=await resolveProfile(); profileId=resolved.id; isOwn=resolved.own; if(profileId) await render(); }
if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',boot,{once:true}); else boot();
