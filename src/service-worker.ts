/// <reference lib="webworker" />
declare const self: ServiceWorkerGlobalScope;

const CACHE_NAME = 'luxecut-v1';
const STATIC_CACHE = 'luxecut-static-v1';
const DYNAMIC_CACHE = 'luxecut-dynamic-v1';

const STATIC_ASSETS = [
    '/',
    '/index.html',
    '/manifest.json',
    '/favicon.ico',
];

// Install event - cache static assets
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(STATIC_CACHE).then((cache) => {
            logger.info('[SW] Caching static assets', undefined, 'service-worker');
            return cache.addAll(STATIC_ASSETS);
        })
    );
    self.skipWaiting();
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
    event.waitUntil(
        Promise.all([
            caches.keys().then((cacheNames) => {
                return Promise.all(
                    cacheNames.map((cacheName) => {
                        if (cacheName !== STATIC_CACHE && cacheName !== DYNAMIC_CACHE) {
                            logger.info('[SW] Deleting old cache:', cacheName, 'service-worker');
                            return caches.delete(cacheName);
                        }
                    })
                );
            }),
            self.clients.claim(),
        ])
    );
});

// Fetch event with network-first strategy for API, cache-first for static
self.addEventListener('fetch', (event) => {
    const { request } = event;
    const url = new URL(request.url);

    // Network-first for API requests - DO NOT CACHE (causes stale data issues)
    if (url.pathname.startsWith('/api/') || url.pathname.includes('functions/v1')) {
        event.respondWith(
            fetch(request)
                .catch(() => caches.match(request)) // Fallback to cache only if offline
        );
        return;
    }

    // Cache-first for static assets
    event.respondWith(
        caches.match(request).then((response) => {
            return response || fetch(request).then((fetchResponse) => {
                if (request.method === 'GET') {
                    caches.open(DYNAMIC_CACHE).then((cache) => {
                        cache.put(request, fetchResponse.clone());
                    });
                }
                return fetchResponse;
            });
        })
    );
});

// Background sync for offline actions
self.addEventListener('sync', (event) => {
    if (event.tag === 'sync-offline-requests') {
        event.waitUntil(syncOfflineRequests());
    }
});

async function syncOfflineRequests() {
    const cache = await caches.open('offline-queue');
    const response = await cache.match('pending-requests');
    if (!response) return;

    const offlineRequests = await response.json();
    for (const requestData of offlineRequests) {
        try {
            await fetch(requestData.url, {
                method: requestData.method,
                headers: requestData.headers,
                body: requestData.body,
            });
        } catch (error) {
            logger.error('[SW] Failed to sync offline request:', error, 'service-worker');
        }
    }
    await cache.delete('pending-requests');
}

// Push notifications
self.addEventListener('push', (event) => {
    if (!event.data) return;
    const data = event.data.json();

    const options = {
        body: data.body,
        icon: '/icon-192x192.png',
        badge: '/badge-72x72.png',
        data: { url: data.url || '/' },
    };

    event.waitUntil(self.registration.showNotification(data.title || 'LuxeCut', options));
});

self.addEventListener('notificationclick', (event) => {
    event.notification.close();
    event.waitUntil(self.clients.openWindow(event.notification.data.url));
});

export { };
