/**
 * Razel Tech Photo Booth Pro - Service Worker
 * Enables offline capability and PWA standalone app execution
 */
const CACHE_NAME = 'digismile-studio-v3.6';
const ASSETS_TO_CACHE = [
    './',
    './index.html',
    './booth.html',
    './css/style.css',
    './js/audio.js',
    './js/camera.js',
    './js/filters.js',
    './js/strip.js',
    './js/pwa.js',
    './js/share.js',
    './js/gif.js',
    './js/app.js',
    './assets/logo.png',
    './assets/favicon.png',
    './manifest.json'
];

self.addEventListener('install', (e) => {
    e.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            return cache.addAll(ASSETS_TO_CACHE);
        }).then(() => self.skipWaiting())
    );
});

self.addEventListener('activate', (e) => {
    e.waitUntil(
        caches.keys().then((keys) => {
            return Promise.all(
                keys.map((key) => {
                    if (key !== CACHE_NAME) {
                        return caches.delete(key);
                    }
                })
            );
        }).then(() => self.clients.claim())
    );
});

self.addEventListener('fetch', (e) => {
    // Network-First with Cache Fallback for instant updates
    e.respondWith(
        fetch(e.request).then((networkResponse) => {
            if (networkResponse && networkResponse.status === 200 && e.request.method === 'GET') {
                const responseClone = networkResponse.clone();
                caches.open(CACHE_NAME).then((cache) => {
                    cache.put(e.request, responseClone);
                });
            }
            return networkResponse;
        }).catch(() => {
            return caches.match(e.request).then((cachedResponse) => {
                if (cachedResponse) return cachedResponse;
                if (e.request.mode === 'navigate') {
                    return caches.match('./booth.html') || caches.match('./index.html');
                }
            });
        })
    );
});
