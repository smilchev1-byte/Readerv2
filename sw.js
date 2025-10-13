const CACHE_NAME = 'mynews-v1';
const ASSETS = [
  './',
  './index.html',
  './style.css',
  './manifest.json',
  // не кешираме sidebar.html нарочно, за да го дърпаме свеж (но можеш да го добавиш)
  './icons/icon-192.png',
  './icons/icon-512.png'
];

// Install: кеширане на статиките
self.addEventListener('install', (e)=>{
  e.waitUntil(
    caches.open(CACHE_NAME).then(c=>c.addAll(ASSETS)).then(()=>self.skipWaiting())
  );
});

// Activate: чисти стари кешове
self.addEventListener('activate', (e)=>{
  e.waitUntil(
    caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==CACHE_NAME).map(k=>caches.delete(k)))))
  self.clients.claim();
});

// Fetch: Cache-first за статиките, network за останалото
self.addEventListener('fetch', (e)=>{
  const url = new URL(e.request.url);
  // само same-origin статиките -> cache-first
  if (url.origin === location.origin) {
    e.respondWith(
      caches.match(e.request).then(res => res || fetch(e.request))
    );
  } else {
    // външни не ги кешираме (allorigins/сайтове)
    return;
  }
});