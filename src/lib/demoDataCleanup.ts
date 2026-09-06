const MOCK_USER_IDS = new Set([
  'user-1','user-2','user-3','user-4','user-5','user-6','user-7','user-8',
  'user-9','user-10','user-11','user-12','1','2','3',
  'user-elena','user-carlos','user-laura'
]);

const isMockRef = (value: unknown): boolean => MOCK_USER_IDS.has(String(value ?? '').toLowerCase());

const DEMO_ARRAY_FILTERS: Array<[string, (item: any) => boolean]> = [
  ['inkorium:events', item => /^evt-[123]$/.test(String(item?.id || ''))],
  ['inkorium:pages', item => /^pag-[1-4]$/.test(String(item?.id || ''))],
  ['inkorium:campus', item => new Set([
    'campus_ucm', 'campus_upc', 'campus_uam', 'campus_us',
    'campus_ies_beatriz', 'barrio_malasana', 'barrio_gracia'
  ]).has(String(item?.id || ''))],
  ['inkorium:game_scores', item => /^sc-\d+$/.test(String(item?.id || ''))],
  ['inkorium:music_playlist', item => /^track-[1-8]$/.test(String(item?.id || ''))],
  ['inkorium:users', item => isMockRef(item?.id)],
  ['inkorium:profiles', item => isMockRef(item?.id)],
  ['inkorium:photos', item => isMockRef(item?.usuarioId) || isMockRef(item?.owner_id) || /^photo-[1-9]\d*$/.test(String(item?.id || ''))],
  ['inkorium:albums', item => isMockRef(item?.usuarioId) || isMockRef(item?.owner_id) || /^album-[1-9]\d*$/.test(String(item?.id || ''))],
  ['inkorium:feed', item => isMockRef(item?.usuarioId) || isMockRef(item?.autorId) || isMockRef(item?.user_id) || /^post-[1-9]\d*$/.test(String(item?.id || ''))],
  ['inkorium:wall_comments', item => isMockRef(item?.emisorId) || isMockRef(item?.receptorId) || isMockRef(item?.autorId)],
  ['inkorium:friendships', item => isMockRef(item?.usuario1Id) || isMockRef(item?.usuario2Id) || isMockRef(item?.user_id)],
  ['inkorium:friend_requests', item => isMockRef(item?.emisorId) || isMockRef(item?.receptorId) || isMockRef(item?.from_id) || isMockRef(item?.to_id)],
  ['inkorium:private_messages', item => isMockRef(item?.emisorId) || isMockRef(item?.receptorId) || isMockRef(item?.sender_id) || isMockRef(item?.recipient_id)],
  ['inkorium:notifications', item => isMockRef(item?.userId) || isMockRef(item?.emisorId) || isMockRef(item?.receptorId)],
  ['inkorium:activities', item => isMockRef(item?.userId) || isMockRef(item?.actorId)],
  ['inkorium:access_logs', item => isMockRef(item?.userId) || isMockRef(item?.actorId)]
];

export function purgeLegacyDemoData(): void {
  if (typeof window === 'undefined' || typeof localStorage === 'undefined') return;

  for (const [key, isDemo] of DEMO_ARRAY_FILTERS) {
    try {
    const legacyKeys = ['inkorium:current_user_id', 'inkorium:currentUserId', 'inkorium:logged_user_id'];
    for (const key of legacyKeys) {
      const value = localStorage.getItem(key);
      if (isMockRef(value)) localStorage.removeItem(key);
    }
      const raw = localStorage.getItem(key);
      if (!raw) continue;
      const parsed = JSON.parse(raw);
      if (!Array.isArray(parsed)) continue;
      const cleaned = parsed.filter(item => !isDemo(item));
      if (cleaned.length !== parsed.length) {
        localStorage.setItem(key, JSON.stringify(cleaned));
      }
    } catch {
      // Ignore malformed legacy data and never block application startup.
    }
  }

  try {
    const currentTrackId = localStorage.getItem('inkorium:current_track_id') || '';
    if (/^track-[1-8]$/.test(currentTrackId)) {
      localStorage.removeItem('inkorium:current_track_id');
    }
  } catch {}
}
