const EVENT_ROUTE = 'eventos';

function restoreSafeRoute() {
  try {
    const hash = window.location.hash.replace(/^#/, '').trim().toLowerCase();
    const path = window.location.pathname.replace(/\/+$/, '').split('/').pop()?.toLowerCase() || '';
    const stored = sessionStorage.getItem('inkorium-page')?.trim().toLowerCase() || '';
    const trapped = hash === EVENT_ROUTE || path === EVENT_ROUTE || stored === EVENT_ROUTE;

    if (!trapped) return;

    sessionStorage.setItem('inkorium-page', 'inicio');
    sessionStorage.removeItem('inkorium-route-params');

    if (hash === EVENT_ROUTE || path === EVENT_ROUTE) {
      window.history.replaceState({}, '', '/feed');
    }

    window.dispatchEvent(new CustomEvent('inkorium-route-change', {
      detail: { page: 'inicio' },
    }));
  } catch {
    // Navigation recovery must never break app bootstrap.
  }
}

restoreSafeRoute();
window.addEventListener('hashchange', restoreSafeRoute);
window.addEventListener('popstate', restoreSafeRoute);
window.addEventListener('inkorium-route-change', (event) => {
  const page = (event as CustomEvent<{ page?: string }>).detail?.page;
  if (page === EVENT_ROUTE) {
    sessionStorage.setItem('inkorium-page', 'inicio');
    sessionStorage.removeItem('inkorium-route-params');
    window.dispatchEvent(new CustomEvent('inkorium-route-change', {
      detail: { page: 'inicio' },
    }));
  }
});
