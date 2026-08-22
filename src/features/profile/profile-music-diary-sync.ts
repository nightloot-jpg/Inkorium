import { supabase } from '../../lib/supabase';
import { usePlayerStore } from '../../lib/store';
import './profile-music-diary-sync.css';

type DiaryTrack = {
  id: string;
  title: string;
  artist: string | null;
  cover_url: string | null;
  youtube_id: string | null;
  source_type: string;
};

type DiaryRow = {
  id: string;
  entry_date: string;
  created_at: string;
  track_id: string;
  track?: DiaryTrack | null;
};

const today = () => new Date().toISOString().slice(0, 10);
const esc = (value: unknown) => String(value ?? '').replace(/[&<>\"']/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '\"': '&quot;', "'": '&#39;' }[ch] || ch));
const coverFor = (track?: DiaryTrack | null) => track?.cover_url || (track?.youtube_id ? `https://i.ytimg.com/vi/${track.youtube_id}/hqdefault.jpg` : '');

function playTrack(track?: DiaryTrack | null) {
  if (!track) return;
  usePlayerStore.getState().playSong({
    type: track.source_type === 'youtube' ? 'youtube_song' : 'local_song',
    video_id: track.youtube_id || undefined,
    title: track.title,
    artist: track.artist || undefined,
    channel_title: track.artist || undefined,
    thumbnail: coverFor(track),
  } as any, false);
}

async function resolveProfile(root: HTMLElement) {
  const handle = root.querySelector('.profile-view-handle')?.textContent?.trim().replace(/^@/, '') || '';
  const session = await supabase.auth.getSession();
  const ownId = session.data.session?.user?.id || '';
  if (!handle) return { id: ownId, own: true };
  const { data } = await supabase.from('profiles').select('id').eq('username', handle).maybeSingle();
  return { id: data?.id || '', own: data?.id === ownId };
}

function dateLabel(value: string) {
  return new Date(`${value}T12:00:00`).toLocaleDateString('es-ES', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

function timeLabel(value: string) {
  return new Date(value).toLocaleTimeString('es-ES', {
    hour: '2-digit',
    minute: '2-digit',
  });
}

function entryMarkup(entry: DiaryRow) {
  return `<article class="profile-music-diary-sync-entry" data-diary-sync-track="${esc(entry.track_id)}">
    <div class="profile-music-diary-sync-marker" aria-hidden="true"></div>
    <div class="profile-music-diary-sync-date">
      <strong>${esc(dateLabel(entry.entry_date))}</strong>
      <span>${esc(timeLabel(entry.created_at))}</span>
    </div>
    <button type="button" class="profile-music-diary-sync-song" data-diary-sync-play="${esc(entry.track_id)}" aria-label="Reproducir ${esc(entry.track?.title || 'canción')}">
      <img src="${esc(coverFor(entry.track))}" alt="">
      <span>
        <strong>${esc(entry.track?.title || 'Canción')}</strong>
        <small>${esc(entry.track?.artist || 'Artista desconocido')}</small>
      </span>
    </button>
    <span class="profile-music-diary-sync-badge">🎵 Canción del día</span>
  </article>`;
}

async function loadDiary(profileId: string) {
  const { data, error } = await supabase
    .from('profile_music_diary')
    .select('id,entry_date,created_at,track_id,music_tracks(id,title,artist,cover_url,youtube_id,source_type)')
    .eq('user_id', profileId)
    .order('entry_date', { ascending: false })
    .order('created_at', { ascending: false })
    .limit(100);

  if (error) throw error;
  return ((data || []) as any[]).map(row => ({
    ...row,
    track: row.music_tracks || null,
  })) as DiaryRow[];
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
    await supabase.from('profile_music_diary').insert({
      user_id: profileId,
      track_id: daily.track_id,
      entry_date: today(),
    });
    return;
  }

  if (diary.track_id !== daily.track_id) {
    await supabase
      .from('profile_music_diary')
      .update({ track_id: daily.track_id, created_at: new Date().toISOString() })
      .eq('id', diary.id)
      .eq('user_id', profileId);
  }
}

function findDiaryHeading(root: HTMLElement) {
  return Array.from(root.querySelectorAll<HTMLElement>('h1,h2,h3,h4,strong,div,span'))
    .find(element => element.textContent?.replace(/\s+/g, ' ').trim().toLowerCase() === 'diario musical') || null;
}

function findDiaryCard(root: HTMLElement): HTMLElement | null {
  const existing = root.querySelector<HTMLElement>('.profile-music-diary-sync-host');
  if (existing) return existing;

  const heading = findDiaryHeading(root);
  if (heading) {
    let current: HTMLElement | null = heading;
    for (let depth = 0; current && depth < 6; depth += 1, current = current.parentElement) {
      const className = typeof current.className === 'string' ? current.className : '';
      if (/(card|diary|music-final)/i.test(className) && current !== root) return current;
    }
  }

  return root.querySelector<HTMLElement>('.profile-music-main') || null;
}

function hideLegacyDiaryContent(card: HTMLElement) {
  card.querySelectorAll<HTMLElement>('button,a,[role="button"]').forEach(element => {
    const text = element.textContent?.replace(/\s+/g, ' ').trim().toLowerCase() || '';
    if (text.includes('añadir música')) element.remove();
  });

  card.querySelectorAll<HTMLElement>('[data-music-action="add"],[data-music-action="save"]').forEach(element => element.remove());

  const heading = findDiaryHeading(card);
  if (!heading) return;
  let legacy: HTMLElement | null = heading;
  for (let depth = 0; legacy && depth < 5; depth += 1, legacy = legacy.parentElement) {
    const className = typeof legacy.className === 'string' ? legacy.className : '';
    if (/(card|diary|music-final)/i.test(className) && legacy !== card) {
      legacy.style.display = 'none';
      return;
    }
  }
}

function ensureCanonicalHost(root: HTMLElement): HTMLElement {
  const existing = root.querySelector<HTMLElement>('.profile-music-diary-sync-host');
  if (existing) return existing;

  const main = root.querySelector<HTMLElement>('.profile-music-main');
  const host = document.createElement('section');
  host.className = 'profile-music-diary-sync-host';
  host.innerHTML = '<div class="profile-music-diary-sync-head"><div><h2>📖 Diario musical</h2><p>Tu historia musical, sincronizada con la canción del día.</p></div><span class="profile-music-diary-sync-count">0/100</span></div><div class="profile-music-diary-sync-list"></div>';

  if (main) main.appendChild(host);
  else root.querySelector('.profile-music-tab')?.appendChild(host);
  return host;
}

function renderDiary(root: HTMLElement, diary: DiaryRow[]) {
  const card = findDiaryCard(root);
  const host = ensureCanonicalHost(root);
  if (!host) return;

  if (card && card !== host && card !== root.querySelector('.profile-music-main')) {
    hideLegacyDiaryContent(card);
  }

  const container = host.querySelector<HTMLElement>('.profile-music-diary-sync-list');
  if (!container) return;

  host.querySelector<HTMLElement>('.profile-music-diary-sync-count')!.textContent = `${Math.min(diary.length, 100)}/100`;
  container.innerHTML = diary.length
    ? diary.slice(0, 100).map(entryMarkup).join('')
    : '<div class="profile-music-diary-sync-empty">Todavía no hay páginas en tu diario. Elige tu canción del día y aquí quedará registrada.</div>';
}

let running = false;
let timer: number | null = null;

async function sync() {
  if (running) return;
  const root = document.querySelector<HTMLElement>('.profile-view-page');
  if (!root) return;

  running = true;
  try {
    const profile = await resolveProfile(root);
    if (!profile.id) return;
    if (profile.own) await ensureDiaryMatchesDailySong(profile.id);
    const diary = await loadDiary(profile.id);
    renderDiary(root, diary);
  } catch (error) {
    console.warn('[Inkorium] No se pudo sincronizar el Diario musical', error);
  } finally {
    running = false;
  }
}

function schedule(delay = 100) {
  if (timer !== null) window.clearTimeout(timer);
  timer = window.setTimeout(() => {
    timer = null;
    void sync();
  }, delay);
}

function boot() {
  const observer = new MutationObserver(() => schedule(180));
  observer.observe(document.body, { childList: true, subtree: true });
  window.addEventListener('inkorium:daily-song-changed', () => schedule(50));
  schedule(150);
}

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot, { once: true });
else boot();
