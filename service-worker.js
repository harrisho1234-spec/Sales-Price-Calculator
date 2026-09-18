const CACHE_NAME = 'sales-price-calculator-v7';
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
  event.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))));
  self.clients.claim();
});

function patchAppHtml(html) {
  // Google Drive's normal file URL is a viewer page, not an image URL.
  // Convert Saved Items thumbnails to Drive's thumbnail endpoint while keeping the file private.
  html = html.replace(
    '<img src="${escapeHtml(x.photoUrl)}" alt="${escapeHtml(x.name||x.code||\'Photo\')}" class="saved-photo">',
    '<img src="${escapeHtml(driveThumbnailUrl(x.photoUrl))}" alt="${escapeHtml(x.name||x.code||\'Photo\')}" class="saved-photo" onerror="this.style.display=\'none\';this.nextElementSibling.style.display=\'flex\'"><span class="saved-photo-placeholder" style="display:none">Open Photo</span>'
  );

  const helper = `\n<script>\nfunction driveThumbnailUrl(url){\n  const s=String(url||'');\n  let m=s.match(/\\/d\\/([^/?#]+)/);\n  if(!m) m=s.match(/[?&]id=([^&#]+)/);\n  if(!m) return s;\n  const id=decodeURIComponent(m[1]);\n  return 'https://drive.google.com/thumbnail?id='+encodeURIComponent(id)+'&sz=w240';\n}\n<\/script>\n`;

  return html.replace('</body>', helper + '</body>');
}

self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;
  const url = new URL(event.request.url);
  if (url.origin !== self.location.origin) return;

  const isPage = event.request.mode === 'navigate' || url.pathname.endsWith('/') || url.pathname.endsWith('/index.html');

  if (isPage) {
    event.respondWith((async () => {
      try {
        const response = await fetch(event.request, { cache: 'no-store' });
        const text = await response.text();
        const headers = new Headers(response.headers);
        headers.delete('content-length');
        headers.set('content-type', 'text/html; charset=utf-8');
        const patched = new Response(patchAppHtml(text), { status: response.status, statusText: response.statusText, headers });
        const cache = await caches.open(CACHE_NAME);
        cache.put('./index.html', patched.clone()).catch(() => {});
        return patched;
      } catch (err) {
        const cached = await caches.match('./index.html');
        if (!cached) throw err;
        const text = await cached.text();
        const headers = new Headers(cached.headers);
        headers.delete('content-length');
        headers.set('content-type', 'text/html; charset=utf-8');
        return new Response(patchAppHtml(text), { status: 200, headers });
      }
    })());
    return;
  }

  event.respondWith(
    fetch(event.request, { cache: 'no-store' })
      .then(response => {
        const copy = response.clone();
        caches.open(CACHE_NAME).then(cache => cache.put(event.request, copy)).catch(() => {});
        return response;
      })
      .catch(() => caches.match(event.request))
  );
});
