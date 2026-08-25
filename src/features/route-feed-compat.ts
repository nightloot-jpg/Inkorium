const normalizeFeedRoute = () => {
  const path = window.location.pathname.replace(/\/+$/, '').toLowerCase();
  if (path !== '/feed') return;
  sessionStorage.setItem('inkorium-page', 'inicio');
  sessionStorage.removeItem('inkorium-route-params');
  window.dispatchEvent(new CustomEvent('inkorium-route-change', { detail: { page: 'inicio' } }));
};

normalizeFeedRoute();
window.addEventListener('popstate', normalizeFeedRoute);
window.addEventListener('hashchange', normalizeFeedRoute);
