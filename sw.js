const V = 'sets-v2';
const ASSETS = ['./', './index.html', './manifest.webmanifest', './icon-180.png', './icon-512.png'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(V).then(c => c.addAll(ASSETS)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== V).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
// Network first for the page itself (so updates land), cache fallback when offline. Cache first for the rest.
self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== location.origin) return;
  const isPage = req.mode === 'navigate' || url.pathname.endsWith('/') || url.pathname.endsWith('index.html');
  if (isPage) {
    e.respondWith(fetch(req).then(r => { caches.open(V).then(c => c.put('./index.html', r.clone())); return r; })
      .catch(() => caches.match('./index.html')));
  } else {
    e.respondWith(caches.match(req).then(r => r || fetch(req).then(res => { caches.open(V).then(c => c.put(req, res.clone())); return res; })));
  }
});
