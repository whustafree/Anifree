/**
 * AnimeFree Service Worker
 * - Cache offline para assets estáticos
 * - Bloqueador de anuncios (intercepta y bloquea dominios conocidos de ads)
 * - Proxy de imágenes para evitar CORS en thumbnails
 */

const CACHE_NAME = 'animefree-v1';
const STATIC_CACHE = 'animefree-static-v1';

// Assets que se pre-cachean al instalar
const PRECACHE_URLS = ['/', '/browse', '/manifest.json'];

// ─── Lista de dominios y patrones bloqueados ──────────────────────────────────
// Misma filosofía que uBlock/AdGuard: bloquear por dominio/patrón conocido
const AD_DOMAINS = [
  // Redes de anuncios principales
  'doubleclick.net', 'googlesyndication.com', 'googleadservices.com',
  'adnxs.com', 'adsrvr.org', 'advertising.com', 'adtechus.com',
  'openx.net', 'rubiconproject.com', 'pubmatic.com', 'criteo.com',
  'taboola.com', 'outbrain.com', 'revcontent.com', 'mgid.com',
  'trafficjunky.net', 'traffichaus.com', 'exoclick.com',
  'hilltopads.net', 'propellerads.com', 'popcash.net', 'popads.net',
  'adcash.com', 'adsterra.com', 'clickadu.com', 'richpush.co',
  'pushground.com', 'evadav.com', 'monetag.com', 'galaksion.com',
  'admaven.com', 'plugrush.com', 'juicyads.com', 'trafficstars.com',
  // Popups / redirects comunes en sitios de streaming
  'best4ty.com', 'bestwebsiterating.com', 'gg-download.com',
  'playhydrax.com', 'thevideome.com', 'vidstream.pro',
  // Trackers y analytics
  'googletagmanager.com', 'hotjar.com', 'mouseflow.com',
  'facebook.com/tr', 'connect.facebook.net', 'analytics.twitter.com',
  // Crypto miners
  'coinhive.com', 'coin-hive.com', 'cryptoloot.pro', 'webminepool.com',
  'miner.pr0gramm.com', 'jsecoin.com',
];

// Patrones en URL que indican anuncio (regex)
const AD_URL_PATTERNS = [
  /\/ads?\//i,
  /\/adserv/i,
  /\/banner/i,
  /\/popup/i,
  /\/popunder/i,
  /[?&]utm_/i,
  /\/track(ing)?\//i,
  /\/pixel\//i,
  /\/impression/i,
  /\/click\?/i,
  /doubleclick/i,
];

function isAdRequest(url) {
  try {
    const parsed = new URL(url);
    const hostname = parsed.hostname.toLowerCase();

    // Bloquear por dominio exacto o subdominio
    if (AD_DOMAINS.some(d => hostname === d || hostname.endsWith('.' + d))) {
      return true;
    }

    // Bloquear por patrón en la URL completa
    if (AD_URL_PATTERNS.some(p => p.test(url))) {
      return true;
    }

    return false;
  } catch {
    return false;
  }
}

// ─── Install: pre-cachear assets ─────────────────────────────────────────────
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then(cache => cache.addAll(PRECACHE_URLS).catch(() => {}))
      .then(() => self.skipWaiting())
  );
});

// ─── Activate: limpiar caches viejos ─────────────────────────────────────────
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys.filter(k => k !== CACHE_NAME && k !== STATIC_CACHE)
            .map(k => caches.delete(k))
      )
    ).then(() => self.clients.claim())
  );
});

// ─── Fetch: interceptar todas las peticiones ──────────────────────────────────
self.addEventListener('fetch', event => {
  const { request } = event;
  const url = request.url;

  // 1. BLOQUEAR anuncios — devolver respuesta vacía 200 (no 204, para no romper iframes)
  if (isAdRequest(url)) {
    event.respondWith(
      new Response('', {
        status: 200,
        headers: { 'Content-Type': 'text/plain', 'X-Blocked-By': 'AnimeFree-AdBlock' }
      })
    );
    return;
  }

  // 2. Peticiones a nuestra API — network only, sin cache (datos siempre frescos)
  if (url.includes('/api/')) {
    event.respondWith(fetch(request).catch(() =>
      new Response(JSON.stringify({ error: 'Sin conexión' }), {
        status: 503,
        headers: { 'Content-Type': 'application/json' }
      })
    ));
    return;
  }

  // 3. Imágenes externas (thumbnails, portadas) — cache-first con expiración
  if (request.destination === 'image') {
    event.respondWith(
      caches.open(CACHE_NAME).then(async cache => {
        const cached = await cache.match(request);
        if (cached) return cached;

        try {
          // Usar modo no-cors para imágenes cross-origin
          const response = await fetch(request, { mode: 'no-cors' });
          if (response.ok || response.type === 'opaque') {
            cache.put(request, response.clone());
          }
          return response;
        } catch {
          // Si falla, devolver un SVG placeholder transparente
          return new Response(
            '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 160 90"><rect fill="#111" width="160" height="90"/><text x="80" y="50" text-anchor="middle" fill="#333" font-size="24">▶</text></svg>',
            { headers: { 'Content-Type': 'image/svg+xml' } }
          );
        }
      })
    );
    return;
  }

  // 4. Assets estáticos (JS, CSS, fuentes) — stale-while-revalidate
  if (request.destination === 'script' || request.destination === 'style' ||
      request.destination === 'font' || url.endsWith('.woff2')) {
    event.respondWith(
      caches.open(STATIC_CACHE).then(async cache => {
        const cached = await cache.match(request);
        const fetchPromise = fetch(request).then(response => {
          if (response.ok) cache.put(request, response.clone());
          return response;
        }).catch(() => cached);
        return cached || fetchPromise;
      })
    );
    return;
  }

  // 5. Navegación (HTML) — network-first, fallback a cache
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request).catch(() =>
        caches.match('/') // SPA fallback
      )
    );
    return;
  }

  // 6. Todo lo demás — network normal
  event.respondWith(fetch(request).catch(() => new Response('', { status: 408 })));
});

// ─── Mensaje desde la app para actualizar el SW ──────────────────────────────
self.addEventListener('message', event => {
  if (event.data?.type === 'SKIP_WAITING') self.skipWaiting();
  if (event.data?.type === 'CLEAR_CACHE') {
    caches.keys().then(keys => Promise.all(keys.map(k => caches.delete(k))));
  }
});
