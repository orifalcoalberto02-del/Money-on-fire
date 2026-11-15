// Service worker: permette l'uso offline e l'installazione come app.
// Se modifichi i file dell'app, cambia il numero di versione qui sotto.
const VER = 'cassa-v4';
const SHELL = [
  './', 'index.html', 'style.css', 'app.js', 'config.js', 'manifest.webmanifest',
  'icons/icon-192.png', 'icons/icon-512.png', 'icons/apple-touch-icon.png',
  'fonts/montserrat-latin-wght-normal.woff2', 'fonts/playfair-display-latin-wght-normal.woff2',
  'fonts/playfair-display-latin-wght-italic.woff2'
];
// I file in ocr/ (lettore scontrini, circa 9 MB) NON sono nell'elenco: si scaricano la prima
// volta che scansioni uno scontrino e poi restano in cache per l'uso offline.

self.addEventListener('install', e => {
  e.waitUntil(caches.open(VER).then(c => c.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== VER).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  const sameOrigin = url.origin === location.origin;
  const firebaseLib = url.hostname === 'www.gstatic.com' && url.pathname.startsWith('/firebasejs/');
  if (!sameOrigin && !firebaseLib) return; // il resto (Firestore, Auth) passa direttamente

  if (sameOrigin) {
    // file dell'app: prima la rete (sempre aggiornati), se offline la cache
    e.respondWith(
      fetch(req)
        .then(res => {
          if (res.ok) { const copy = res.clone(); caches.open(VER).then(c => c.put(req, copy)); }
          return res;
        })
        .catch(async () => (await caches.match(req)) || (req.mode === 'navigate' ? caches.match('index.html') : Response.error()))
    );
  } else {
    // librerie Firebase (URL con versione fissa): prima la cache
    e.respondWith(
      caches.match(req).then(hit => hit || fetch(req).then(res => {
        if (res.ok) { const copy = res.clone(); caches.open(VER).then(c => c.put(req, copy)); }
        return res;
      }))
    );
  }
});