const DEMO_ARRAY_FILTERS: Array<[string, (item: any) => boolean]> = [
  ['inkorium:events', item => /^evt-[123]$/.test(String(item?.id || ''))],
  ['inkorium:pages', item => /^pag-[1-4]$/.test(String(item?.id || ''))],
  ['inkorium:campus', item => new Set([
    'campus_ucm', 'campus_upc', 'campus_uam', 'campus_us',
    'campus_ies_beatriz', 'barrio_malasana', 'barrio_gracia'
  ]).has(String(item?.id || ''))],
  ['inkorium:game_scores', item => /^sc-\d+$/.test(String(item?.id || ''))],
  ['inkorium:music_playlist', item => /^track-[1-8]$/.test(String(item?.id || ''))]
];

export function purgeLegacyDemoData(): void {
  if (typeof window === 'undefined' || typeof localStorage === 'undefined') return;

  for (const [key, isDemo] of DEMO_ARRAY_FILTERS) {
    try {
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
