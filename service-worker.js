const VERSION = 'english-kids-v1.2.0';
const STATIC_CACHE = `${VERSION}-static`;
const CONTENT_CACHE = `${VERSION}-content`;
const MEDIA_CACHE = `${VERSION}-media`;

const CORE = [
  './','./index.html','./offline.html','./manifest.webmanifest',
  './css/reset.css','./css/variables.css','./css/layout.css','./css/components.css','./css/activities.css','./css/animations.css','./css/responsive.css',
  './js/app.js','./js/starter-content.js','./js/router.js','./js/storage.js','./js/audio.js','./js/speech.js','./js/recorder.js','./js/progress.js','./js/rewards.js','./js/accessibility.js','./js/lesson-engine.js','./js/activity-engine.js','./js/data-loader.js',
  './js/activities/activity-utils.js','./js/activities/letter-intro.js','./js/activities/word-gallery.js','./js/activities/letter-trace.js','./js/activities/multiple-choice.js','./js/activities/image-match.js','./js/activities/audio-match.js','./js/activities/letter-order.js','./js/activities/word-builder.js','./js/activities/memory-game.js','./js/activities/sorting-game.js','./js/activities/missing-letter.js','./js/activities/sentence-builder.js','./js/activities/pronunciation-practice.js','./js/activities/bingo.js',
  './data/course.json','./data/lessons.json','./data/words.json','./data/sentences.json','./data/rewards.json','./data/settings.json',
  './assets/images/words/placeholder.svg','./assets/icons/icon-192.png','./assets/icons/icon-512.png','./assets/icons/icon-maskable-512.png'
];

self.addEventListener('install', event => {
  event.waitUntil((async () => {
    const cache = await caches.open(STATIC_CACHE);
    await Promise.all(CORE.map(async url => {
      try {
        const response = await fetch(url, { cache: 'reload' });
        if (response.ok) await cache.put(url, response);
      } catch (error) {
        console.warn('Could not precache', url, error);
      }
    }));
    await self.skipWaiting();
  })());
});

self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys
      .filter(key => key.startsWith('english-kids-') && ![STATIC_CACHE, CONTENT_CACHE, MEDIA_CACHE].includes(key))
      .map(key => caches.delete(key)));
    await self.clients.claim();
  })());
});

self.addEventListener('message', event => {
  if (event.data === 'SKIP_WAITING') self.skipWaiting();
});

async function cacheFirst(request) {
  const cached = await caches.match(request);
  if (cached) return cached;
  const response = await fetch(request);
  if (response?.ok) (await caches.open(MEDIA_CACHE)).put(request, response.clone());
  return response;
}

async function networkFirst(request, fallbackUrl = null) {
  const cache = await caches.open(STATIC_CACHE);
  try {
    const response = await fetch(request, { cache: 'no-store' });
    if (response?.ok) await cache.put(request, response.clone());
    return response;
  } catch (error) {
    return (await cache.match(request)) ||
      (fallbackUrl ? await cache.match(fallbackUrl) : null) ||
      Response.error();
  }
}

async function contentNetworkFirst(request) {
  const cache = await caches.open(CONTENT_CACHE);
  try {
    const response = await fetch(request, { cache: 'no-store' });
    if (response?.ok) await cache.put(request, response.clone());
    return response;
  } catch (error) {
    return (await cache.match(request)) || new Response('{}', { headers: { 'Content-Type': 'application/json' } });
  }
}

self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;
  const url = new URL(event.request.url);
  if (url.origin !== self.location.origin) return;

  if (event.request.mode === 'navigate' || event.request.destination === 'document') {
    event.respondWith(networkFirst(event.request, './index.html'));
    return;
  }

  if (url.pathname.endsWith('.json')) {
    event.respondWith(contentNetworkFirst(event.request));
    return;
  }

  if (['script', 'style', 'worker'].includes(event.request.destination) || /\.(js|css|webmanifest)$/i.test(url.pathname)) {
    event.respondWith(networkFirst(event.request));
    return;
  }

  if (['image', 'audio', 'font'].includes(event.request.destination) || /\.(png|webp|avif|svg|mp3|ogg|wav)$/i.test(url.pathname)) {
    event.respondWith(cacheFirst(event.request));
    return;
  }

  event.respondWith(networkFirst(event.request));
});
