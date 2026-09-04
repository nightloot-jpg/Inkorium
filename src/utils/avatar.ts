const FALLBACK_AVATAR = 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=400&auto=format&fit=crop&q=80';

export function normalizeAvatarUrl(value: unknown): string {
  if (typeof value !== 'string') return FALLBACK_AVATAR;
  const url = value.trim();
  return url || FALLBACK_AVATAR;
}

export function getAvatarCandidates(value: unknown): string[] {
  const url = normalizeAvatarUrl(value);
  const candidates = [url];
  // Some legacy records may contain a stale proxy/preview URL. Keep the normalized
  // URL first and let the UI fallback to the generated avatar when the image fails.
  return Array.from(new Set(candidates));
}

export { FALLBACK_AVATAR };
