const CACHE_NAME = 'sales-price-calculator-v12';
const APP_SHELL = [
  './',
  './index.html',
  './compare-tab.js',
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
    caches.keys().then(keys =>
      Promise.all(keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key)))
    )
  );
  self.clients.claim();
});

const COMPACT_ITEMS_CSS = `
<style id="compact-items-v12">
.item-list{gap:7px!important}
.item-card-head{grid-template-columns:46px minmax(180px,1.25fr) minmax(360px,1.8fr) auto!important;gap:9px!important;padding:8px 10px!important}
.item-card-photo{width:40px!important;height:40px!important;border-radius:8px!important;font-size:8px!important}
.item-card-name{font-size:14px!important}
.item-card-sub{font-size:10px!important;margin-top:2px!important}
.item-quick{grid-template-columns:repeat(4,minmax(72px,1fr))!important;gap:5px!important}
.quick-metric{padding-left:8px!important}
.quick-metric .qk{font-size:8px!important}
.quick-metric .qv{font-size:12px!important;margin-top:1px!important}
.item-card-actions{gap:4px!important}
.item-card-actions button{padding:6px 8px!important;font-size:11px!important}
.card-toggle{min-width:74px!important}
.item-card-body{padding:8px!important;grid-template-columns:1.1fr 1fr!important;gap:8px!important;align-items:start!important}
.item-section{padding:8px!important;border-radius:10px!important}
.item-section-title{font-size:9px!important;margin-bottom:6px!important}
.item-grid{grid-template-columns:repeat(3,minmax(0,1fr))!important;gap:6px!important}
.item-grid.product{grid-template-columns:72px 1fr 1.1fr!important;gap:6px!important}
.item-field label{font-size:10px!important;margin-bottom:3px!important}
.item-field input,.item-field select{padding:7px 8px!important;font-size:12px!important}
.item-field .hint{font-size:9px!important;margin-top:3px!important}
.item-field .readout{min-height:33px!important;padding:7px 8px!important;font-size:12px!important;border-radius:8px!important}
.item-photo-box{width:62px!important;height:62px!important;border-radius:9px!important}
.item-photo-box span{font-size:9px!important}
@media(max-width:1200px){
  .item-card-head{grid-template-columns:42px minmax(160px,1fr) minmax(280px,1.5fr) auto!important}
  .item-card-body{grid-template-columns:1fr!important}
  .item-grid,.item-grid.product{grid-template-columns:repeat(3,minmax(0,1fr))!important}
  .item-quick{grid-template-columns:repeat(2,1fr)!important}
}
@media(max-width:760px){
  .item-card-head{grid-template-columns:40px 1fr auto!important}
  .item-quick{grid-column:1/-1!important;grid-template-columns:repeat(4,1fr)!important}
  .item-card-actions{grid-column:1/-1!important;justify-content:flex-end!important}
  .item-card-body{grid-template-columns:1fr!important}
  .item-grid,.item-grid.product{grid-template-columns:1fr 1fr!important}
  .item-photo-field{grid-column:1/-1!important;grid-row:auto!important}
}
@media(max-width:500px){
  .item-grid,.item-grid.product{grid-template-columns:1fr!important}
  .item-quick{grid-template-columns:1fr 1fr!important}
}
</style>`;

function patchHtml(html){
  if(!html.includes('compact-items-v12')){
    html = html.replace('</head>', COMPACT_ITEMS_CSS + '\n</head>');
  }
  if(!html.includes('compare-tab.js')){
    html = html.replace('</body>', '<script src="./compare-tab.js?v=1"></script>\n</body>');
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
