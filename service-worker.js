const VERSION = 'english-kids-v1.0.0';
const STATIC_CACHE = `${VERSION}-static`;
const CONTENT_CACHE = `${VERSION}-content`;
const MEDIA_CACHE = `${VERSION}-media`;
const CORE = [
  './','./index.html','./offline.html','./manifest.webmanifest',
  './css/reset.css','./css/variables.css','./css/layout.css','./css/components.css','./css/activities.css','./css/animations.css','./css/responsive.css',
  './js/app.js','./js/router.js','./js/storage.js','./js/audio.js','./js/speech.js','./js/recorder.js','./js/progress.js','./js/rewards.js','./js/accessibility.js','./js/lesson-engine.js','./js/activity-engine.js','./js/data-loader.js',
  './js/activities/activity-utils.js','./js/activities/multiple-choice.js','./js/activities/image-match.js','./js/activities/audio-match.js','./js/activities/letter-order.js','./js/activities/word-builder.js','./js/activities/memory-game.js','./js/activities/sorting-game.js','./js/activities/missing-letter.js','./js/activities/sentence-builder.js','./js/activities/pronunciation-practice.js','./js/activities/bingo.js',
  './data/course.json','./data/lessons.json','./data/words.json','./data/sentences.json','./data/rewards.json','./data/settings.json',
  './assets/images/words/placeholder.svg','./assets/icons/icon-192.png','./assets/icons/icon-512.png','./assets/icons/icon-maskable-512.png'
];
self.addEventListener('install', event => {
  event.waitUntil(caches.open(STATIC_CACHE).then(cache => cache.addAll(CORE)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', event => {
  event.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(key => ![STATIC_CACHE,CONTENT_CACHE,MEDIA_CACHE].includes(key)).map(key => caches.delete(key)))).then(() => self.clients.claim()));
});
async function cacheFirst(request) {
  const cached = await caches.match(request); if (cached) return cached;
  const response = await fetch(request); if (response?.ok) (await caches.open(MEDIA_CACHE)).put(request,response.clone()); return response;
}
async function staleWhileRevalidate(request) {
  const cache = await caches.open(CONTENT_CACHE); const cached = await cache.match(request);
  const network = fetch(request).then(response => { if(response?.ok) cache.put(request,response.clone()); return response; }).catch(()=>null);
  return cached || network || new Response('{}',{headers:{'Content-Type':'application/json'}});
}
async function networkFirst(request) {
  const cache = await caches.open(STATIC_CACHE);
  try { const response = await fetch(request); if(response?.ok) cache.put(request,response.clone()); return response; }
  catch { return (await cache.match(request)) || (await cache.match('./index.html')) || (await cache.match('./offline.html')); }
}
self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;
  const url = new URL(event.request.url); if (url.origin !== self.location.origin) return;
  if (event.request.mode === 'navigate' || event.request.destination === 'document') { event.respondWith(networkFirst(event.request)); return; }
  if (url.pathname.endsWith('.json')) { event.respondWith(staleWhileRevalidate(event.request)); return; }
  if (['image','audio','font'].includes(event.request.destination) || /\.(png|webp|avif|svg|mp3|ogg|wav)$/i.test(url.pathname)) { event.respondWith(cacheFirst(event.request)); return; }
  event.respondWith(caches.match(event.request).then(cached => cached || fetch(event.request).then(response => { if(response?.ok) caches.open(STATIC_CACHE).then(cache=>cache.put(event.request,response.clone())); return response; })));
});
