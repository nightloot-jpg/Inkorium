import { useEffect, useState } from 'react';

/**
 * Returns `false` during SSR and the first client render, then `true`
 * after the first effect runs (i.e. once the component is fully hydrated).
 *
 * Use this to gate any markup that depends on browser-only values
 * (Date.now, window, localStorage, etc.) so SSR output is stable and
 * matches the initial client render — preventing React #418 hydration
 * mismatches in React 19, where suppressHydrationWarning alone is not
 * enough to keep the subtree from being torn down.
 */
export function useHydrated(): boolean {
  const [hydrated, setHydrated] = useState(false);
  useEffect(() => setHydrated(true), []);
  return hydrated;
}
