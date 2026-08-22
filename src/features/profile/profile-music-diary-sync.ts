import { supabase } from '../../lib/supabase';
import './profile-music-diary-sync.css';

type DiaryRow = {
  id: string;
  entry_date: string;
  created_at: string;
  track_id: string;
  track?: { id: string; title: string; artist: string | null; cover_url: string | null; youtube_id: string | null; source_type: string } | null;
};

const today = () => new Date().toISOString().slice(0, 10);
const esc = (value: unknown) => String(value ?? '').replace(/[&<>\"']/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '\"': '&quot;', "'": '&#39;' }[ch] || ch));
const coverFor = (track?: DiaryRow['track']) => track?.cover_url || (track?.youtube_id ? `https://i.ytimg.com/vi/${track.youtube_id}/hqdefault.jpg` : '');

async function resolveProfile(root: HTMLElement) {
  const handle = root.querySelector('.profile-view-handle')?.textContent?.trim().replace(/^@/, '') || '';
  const session = await supabase.auth.getSession();
  const ownId = session.data.session?.user?.id || '';
  if (!handle) return { id: ownId, own: true };
  const { data } = await supabase.from('profiles').select('id').eq('username', handle).maybeSingle();
  return { id: data?.id || '', own: data?.id === ownId };
}

function dateLabel(value: string) {
  return new Date(`${value}T12:00:00`).toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
}

function timeLabel(value: string) {
  const date = new Date(value);
  return date.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
}

function entryMarkup(entry: DiaryRow) {
  return `<article class="profile-music-diary-sync-entry" data-diary-sync-track="${esc(entry.track_id)}">
    <div class="profile-music-diary-sync-date"><strong>${esc(dateLabel(entry.entry_date))}</strong><span>${esc(timeLabel(entry.created_at))}</span></div>
    <div class="profile-music-diary-sync-song"><img src="${esc(coverFor(entry.track))}" alt=""><div><strong>${esc(entry.track?.title || 'Canción')}</strong><small>${esc(entry.track?.artist || 'Artista desconocido')}</small></div></div>
    <span class="profile-music-diary-sync-badge">🎵 Canción del día</span>
  </article>`;
}

async function loadDiary(profileId: string) {
  const { data, error } = await supabase
    .from('profile_music_diary')
    .select('id,entry_date,created_at,track_id,music_tracks(id,title,artist,cover_url,youtube_id,source_type)')
    .eq('user_id', profileId)
    .order('entry_date', { ascending: false })
    .limit(100);
  if (error) throw error;
  return ((data || []) as any[]).map(row => ({ ...row, track: row.music_tracks || null })) as DiaryRow[];
}

async function ensureDiaryMatchesDailySong(profileId: string) {
  const { data: daily, error: dailyError } = await supabase
    .from('profile_song_of_day')
    .select('track_id')
    .eq('user_id', profileId)
    .maybeSingle();
  if (dailyError || !daily?.track_id) return;

  const { data: diary, error: diaryError } = await supabase
    .from('profile_music_diary')
    .select('id,track_id')
    .eq('user_id', profileId)
    .eq('entry_date', today())
    .maybeSingle();
  if (diaryError) return;

  if (!diary) {
    await supabase.from('profile_music_diary').insert({ user_id: profileId, track_id: daily.track_id, entry_date: today() });
    return;
  }

  if (diary.track_id !== daily.track_id) {
    await supabase.from('profile_music_diary').update({ track_id: daily.track_id, created_at: new Date().toISOString() }).eq('id', diary.id).eq('user_id', profileId);
  }
}

function findDiaryCard(root: HTMLElement): HTMLElement | null {
  const finalCard = Array.from(root.querySelectorAll<HTMLElement>('.profile-music-final-card')).find(card => card.querySelector('h2')?.textContent?.includes('Diario musical'));
  if (finalCard) return finalCard;
  return Array.from(root.querySelectorAll<HTMLElement>('.profile-music-card, .profile-music-side-card, section, article')).find(card => card.querySelector('h2,h3')?.textContent?.includes('Diario musical')) || null;
}

function removeAddMusicButtons(card: HTMLElement) {
  card.querySelectorAll<HTMLElement>('button,a,[role="button"]').forEach(element => {
    const text = element.textContent?.replace(/\s+/g, ' ').trim().toLowerCase() || '';
    if (text.includes('añadir música')) element.remove();
  });
  card.querySelectorAll<HTMLElement>('[data-music-action="add"],[data-music-action="save"]').forEach(element => element.remove());
}

function renderDiary(card: HTMLElement, diary: DiaryRow[]) {
  removeAddMusicButtons(card);
  let container = card.querySelector<HTMLElement>('.profile-music-diary-sync-list');
  if (!container) {
    container = document.createElement('div');
    container.className = 'profile-music-diary-sync-list';
    const existing = card.querySelector('.profile-music-final-diary, .profile-music-diary');
    if (existing) existing.replaceWith(container); else card.appendChild(container);
  }
  container.innerHTML = diary.length
    ? diary.map(entryMarkup).join('')
    : '<div class="profile-music-diary-sync-empty">Todavía no hay páginas en tu diario. Elige tu canción del día y aquí quedará registrada.</div>';
}

let running = false;
let timer: number | null = null;

async function sync() {
  if (running) return;
  const root = document.querySelector<HTMLElement>('.profile-view-page');
  if (!root) return;
  const card = findDiaryCard(root);
  if (!card) return;
  running = true;
  try {
    const profile = await resolveProfile(root);
    if (!profile.id) return;
    if (profile.own) await ensureDiaryMatchesDailySong(profile.id);
    const diary = await loadDiary(profile.id);
    renderDiary(card, diary);
  } catch (error) {
    console.warn('[Inkorium] No se pudo sincronizar el Diario musical', error);
  } finally {
    running = false;
  }
}

function schedule(delay = 100) {
  if (timer !== null) window.clearTimeout(timer);
  timer = window.setTimeout(() => { timer = null; void sync(); }, delay);
}

function boot() {
  const observer = new MutationObserver(() => schedule(120));
  observer.observe(document.body, { childList: true, subtree: true });
  window.addEventListener('inkorium:daily-song-changed', () => schedule(50));
  schedule(150);
}

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot, { once: true });
else boot();
