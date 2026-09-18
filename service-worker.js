const CACHE_NAME = 'sales-price-calculator-v15';
const APP_SHELL = [
  './',
  './index.html',
  './compare-tab.js',
  './ultra-compact-items.js',
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
    caches.keys().then(keys => Promise.all(keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key))))
  );
  self.clients.claim();
});

function patchHtml(html){
  if(!html.includes('compare-tab.js')){
    html = html.replace('</body>', '<script src="./compare-tab.js?v=1"></script>\n</body>');
  }
  if(!html.includes('ultra-compact-items.js')){
    html = html.replace('</body>', '<script src="./ultra-compact-items.js?v=3"></script>\n</body>');
  }
  return html;
}

self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;
  const url = new URL(event.request.url);
  if (url.origin !== self.location.origin) return;

  const isPage = event.request.mode === 'navigate' || url.pathname.endsWith('/') || url.pathname.endsWith('/index.html');

  if(isPage){
    event.respondWith((async()=>{
      try{
        const response=await fetch(event.request,{cache:'no-store'});
        const text=await response.text();
        const headers=new Headers(response.headers);
        headers.delete('content-length');
        headers.set('content-type','text/html; charset=utf-8');
        const patched=new Response(patchHtml(text),{status:response.status,statusText:response.statusText,headers});
        const cache=await caches.open(CACHE_NAME);
        cache.put('./index.html',patched.clone()).catch(()=>{});
        return patched;
      }catch(err){
        const cached=await caches.match('./index.html');
        if(!cached) throw err;
        const text=await cached.text();
        const headers=new Headers(cached.headers);
        headers.delete('content-length');
        headers.set('content-type','text/html; charset=utf-8');
        return new Response(patchHtml(text),{status:200,headers});
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
