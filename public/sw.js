// Inkorium Primary Service Worker Entry
try {
  importScripts('/push-sw.js');
} catch (e) {
  console.warn('[SW] Could not import push-sw.js:', e);
}
