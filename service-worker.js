const CACHE_NAME = 'sales-price-calculator-v4';
const GOOGLE_SHEETS_API_URL = 'https://script.google.com/macros/s/AKfycbzr3v6Drnac_jy3_KFIA8N2xxFQn_TB1DCJ5EHa61xYoMWAXn2-DcJI1tiRm6QkG_Xz/exec';

const APP_SHELL = [
  './',
  './index.html',
  './manifest.json',
  './favicon.png',
  './app-icon.png',
  './icons/icon-192.png',
  './icons/icon-512.png'
];

self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE_NAME).then(cache => cache.addAll(APP_SHELL)));
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys => Promise.all(
      keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key))
    ))
  );
  self.clients.claim();
});

function injectGoogleBackend(html) {
  const script = `\n<script>\n(function(){\n  const url = '${GOOGLE_SHEETS_API_URL}';\n  window.ensureApiUrl = function(){\n    const el = document.getElementById('apiUrl');\n    if (el) el.value = url;\n    return url;\n  };\n  try {\n    const old = JSON.parse(localStorage.getItem('spc_settings') || '{}');\n    old.apiUrl = url;\n    localStorage.setItem('spc_settings', JSON.stringify(old));\n  } catch(e) {}\n  const el = document.getElementById('apiUrl');\n  if (el) el.value = url;\n})();\n<\/script>\n`;
  return html.replace('</body>', script + '</body>');
}

self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;

  const url = new URL(event.request.url);
  const isSameOrigin = url.origin === self.location.origin;
  const isPage = isSameOrigin && (
    event.request.mode === 'navigate' ||
    url.pathname.endsWith('/') ||
    url.pathname.endsWith('/index.html')
  );

  if (isPage) {
    event.respondWith((async () => {
      try {
        const network = await fetch(event.request, { cache: 'no-store' });
        const text = await network.text();
        const headers = new Headers(network.headers);
        headers.delete('content-length');
        headers.set('content-type', 'text/html; charset=utf-8');
        const injected = injectGoogleBackend(text);
        const response = new Response(injected, {
          status: network.status,
          statusText: network.statusText,
          headers
        });
        const cache = await caches.open(CACHE_NAME);
        cache.put('./index.html', response.clone()).catch(() => {});
        return response;
      } catch (err) {
        const cached = await caches.match('./index.html');
        if (!cached) throw err;
        const text = await cached.text();
        const headers = new Headers(cached.headers);
        headers.delete('content-length');
        headers.set('content-type', 'text/html; charset=utf-8');
        return new Response(injectGoogleBackend(text), { status: 200, headers });
      }
    })());
    return;
  }

  if (!isSameOrigin) return;

  event.respondWith(
    fetch(event.request)
      .then(response => {
        const copy = response.clone();
        caches.open(CACHE_NAME).then(cache => cache.put(event.request, copy)).catch(() => {});
        return response;
      })
      .catch(() => caches.match(event.request))
  );
});
