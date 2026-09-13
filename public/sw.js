// Service worker for the one page that must work with no signal: /bite.
//
// Everything else in PawBook is live data and stays live — /api/state and the
// animal pages are never cached here, because a stale "last fed" is worse than
// no answer. The bite page is the opposite: it is static, it has to open at a
// gate at 2 a.m. on a phone with one bar, and its content changes about once a
// year. So once someone has visited it, the page and the scripts it needs are
// kept and served from cache first.

const CACHE = 'pawbook-v2';
const PRECACHE = ['/bite', '/rules'];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE).then((cache) => cache.addAll(PRECACHE)).then(() => self.skipWaiting()),
  );
});

// Old cache names are dropped so a bump of CACHE above is a clean slate.
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

// The two static pages: /bite and /rules, with or without a /c/<campus> prefix.
// Both are precached above; this is what lets a navigation to them be answered
// from that cache instead of only filling it.
const isStaticPage = (url) => /^\/(?:c\/[a-z0-9-]+\/)?(?:bite|rules)\/?$/.test(url.pathname);

// Serve the cached copy if there is one and refresh it in the background;
// otherwise wait for the network and keep what comes back.
async function cachedOrFetch(request, ignoreSearch) {
  const cache = await caches.open(CACHE);
  const cached = await cache.match(request, { ignoreSearch });
  const fresh = fetch(request)
    .then((res) => { if (res.ok) cache.put(request, res.clone()); return res; })
    .catch(() => undefined);
  return cached || (await fresh) || Response.error();
}

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  // Cache first: the copy we have is the copy that works offline.
  if (request.mode === 'navigate' && isStaticPage(url)) {
    event.respondWith(cachedOrFetch(request, true));
    return;
  }

  // Hashed build assets, stale-while-revalidate. The page cached above
  // references these by hash, so they have to survive for it to render.
  if (url.pathname.startsWith('/_next/static/')) {
    event.respondWith(cachedOrFetch(request, false));
  }
  // Everything else falls through to the network untouched.
});
