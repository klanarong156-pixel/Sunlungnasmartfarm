/**
 * SmartFarm V15 Premium - Service Worker
 * Handles offline support, caching strategies, and background sync
 */

const APP_VERSION = 'v15-premium';
const CACHE_NAME = `smartfarm-${APP_VERSION}-cache`;
const RUNTIME_CACHE = `smartfarm-${APP_VERSION}-runtime`;
const API_CACHE = `smartfarm-${APP_VERSION}-api`;
const IMAGE_CACHE = `smartfarm-${APP_VERSION}-images`;

const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/admin.html',
  '/manifest.json',
  '/src/app.js',
  '/src/admin.js',
  '/src/styles/global.css',
  '/src/styles/premium.css',
  '/src/styles/responsive.css',
  '/src/styles/dark-mode.css',
  '/src/components/Dashboard.js',
  '/src/modules/MQTTService.js',
  '/src/modules/NotificationService.js',
  '/src/utils/Storage.js',
  '/src/utils/ThemeManager.js'
];

const CACHE_EXPIRY_TIME = 24 * 60 * 60 * 1000; // 24 hours

/**
 * Install Event - Cache essential assets
 */
self.addEventListener('install', (event) => {
  console.log(`[ServiceWorker] Installing ${APP_VERSION}...`);

  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('[ServiceWorker] Caching static assets...');
        return cache.addAll(STATIC_ASSETS);
      })
      .then(() => {
        console.log('[ServiceWorker] Skipping waiting...');
        self.skipWaiting();
      })
      .catch(error => {
        console.error('[ServiceWorker] Install error:', error);
      })
  );
});

/**
 * Activate Event - Clean up old caches
 */
self.addEventListener('activate', (event) => {
  console.log('[ServiceWorker] Activating...');

  event.waitUntil(
    caches.keys()
      .then(cacheNames => {
        return Promise.all(
          cacheNames.map(cacheName => {
            // Delete old cache versions
            if (
              cacheName.includes('smartfarm') &&
              !cacheName.includes(APP_VERSION)
            ) {
              console.log(`[ServiceWorker] Deleting old cache: ${cacheName}`);
              return caches.delete(cacheName);
            }
          })
        );
      })
      .then(() => {
        console.log('[ServiceWorker] Claiming clients...');
        return self.clients.claim();
      })
  );
});

/**
 * Fetch Event - Routing strategy
 */
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests and chrome extensions
  if (request.method !== 'GET' || url.protocol === 'chrome-extension:') {
    return;
  }

  // API requests - Network first with cache fallback
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(apiStrategy(request));
    return;
  }

  // Images - Cache first with network fallback
  if (request.destination === 'image') {
    event.respondWith(imageStrategy(request));
    return;
  }

  // Static assets - Cache first, fallback to network
  if (
    request.destination === 'document' ||
    request.destination === 'script' ||
    request.destination === 'style' ||
    request.destination === 'font'
  ) {
    event.respondWith(cacheFirstStrategy(request));
    return;
  }

  // Default - Network first with cache fallback
  event.respondWith(networkFirstStrategy(request));
});

/**
 * API Strategy - Network first with cache fallback
 */
async function apiStrategy(request) {
  try {
    const response = await fetch(request);
    
    if (response.ok) {
      // Cache successful responses
      const cache = await caches.open(API_CACHE);
      cache.put(request, response.clone());
    }
    
    return response;
  } catch (error) {
    console.log(`[ServiceWorker] API fetch failed for ${request.url}, trying cache...`);
    
    // Try cache fallback
    const cached = await caches.match(request);
    if (cached) {
      return cached;
    }

    // Return offline response
    return new Response(
      JSON.stringify({
        error: 'Offline',
        message: 'Unable to fetch data. You are offline.'
      }),
      {
        status: 503,
        statusText: 'Service Unavailable',
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
}

/**
 * Cache First Strategy - Use cache, fallback to network
 */
async function cacheFirstStrategy(request) {
  try {
    const cached = await caches.match(request);
    if (cached) {
      return cached;
    }

    const response = await fetch(request);
    
    if (!response || response.status !== 200) {
      return response;
    }

    const cache = await caches.open(RUNTIME_CACHE);
    cache.put(request, response.clone());
    
    return response;
  } catch (error) {
    console.log(`[ServiceWorker] Cache first failed for ${request.url}`);
    
    // Return offline page for documents
    if (request.destination === 'document') {
      const cache = await caches.open(CACHE_NAME);
      return cache.match('/offline.html') || cache.match('/index.html');
    }

    return new Response('Offline', { status: 503 });
  }
}

/**
 * Network First Strategy - Try network, fallback to cache
 */
async function networkFirstStrategy(request) {
  try {
    const response = await fetch(request);
    
    if (response.ok) {
      const cache = await caches.open(RUNTIME_CACHE);
      cache.put(request, response.clone());
    }
    
    return response;
  } catch (error) {
    console.log(`[ServiceWorker] Network failed for ${request.url}, trying cache...`);
    
    const cached = await caches.match(request);
    if (cached) {
      return cached;
    }

    // Return offline page for documents
    if (request.destination === 'document') {
      const cache = await caches.open(CACHE_NAME);
      return cache.match('/offline.html') || cache.match('/index.html');
    }

    return new Response('Offline', { status: 503 });
  }
}

/**
 * Image Strategy - Cache first with network fallback
 */
async function imageStrategy(request) {
  try {
    const cached = await caches.match(request);
    if (cached) {
      return cached;
    }

    const response = await fetch(request);
    
    if (!response || response.status !== 200) {
      return response;
    }

    const cache = await caches.open(IMAGE_CACHE);
    cache.put(request, response.clone());
    
    return response;
  } catch (error) {
    console.log(`[ServiceWorker] Image fetch failed for ${request.url}`);
    
    // Return placeholder image
    return new Response(
      '<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100"><rect fill="#f0f0f0" width="100" height="100"/><text x="50" y="50" text-anchor="middle" dy=".3em" fill="#999">Offline</text></svg>',
      {
        headers: { 'Content-Type': 'image/svg+xml' },
        status: 200
      }
    );
  }
}

/**
 * Background Sync - Sync pending requests when online
 */
self.addEventListener('sync', (event) => {
  console.log('[ServiceWorker] Background sync triggered:', event.tag);
  
  if (event.tag === 'sync-data') {
    event.waitUntil(syncPendingData());
  }
});

async function syncPendingData() {
  try {
    const cache = await caches.open(API_CACHE);
    const requests = await cache.keys();

    for (const request of requests) {
      try {
        const response = await fetch(request.clone());
        if (response.ok) {
          await cache.delete(request);
          console.log(`[ServiceWorker] Synced: ${request.url}`);
        }
      } catch (error) {
        console.log(`[ServiceWorker] Sync failed for ${request.url}:`, error);
      }
    }

    console.log('[ServiceWorker] Sync completed');
  } catch (error) {
    console.error('[ServiceWorker] Background sync error:', error);
  }
}

/**
 * Push Notifications
 */
self.addEventListener('push', (event) => {
  console.log('[ServiceWorker] Push notification received');
  
  if (!event.data) return;

  let data = {};
  try {
    data = event.data.json();
  } catch (error) {
    data = { title: 'SmartFarm', body: event.data.text() };
  }

  const options = {
    body: data.body || 'SmartFarm notification',
    icon: '/assets/icons/icon-192x192.png',
    badge: '/assets/icons/icon-192x192.png',
    tag: data.tag || 'smartfarm-notification',
    requireInteraction: data.requireInteraction || false,
    actions: [
      { action: 'open', title: 'Open' },
      { action: 'close', title: 'Close' }
    ]
  };

  event.waitUntil(
    self.registration.showNotification(data.title || 'SmartFarm', options)
  );
});

/**
 * Notification Click
 */
self.addEventListener('notificationclick', (event) => {
  console.log('[ServiceWorker] Notification clicked');
  
  event.notification.close();

  if (event.action === 'close') {
    return;
  }

  event.waitUntil(
    clients.matchAll({ type: 'window' })
      .then(windowClients => {
        // Check if app is already open
        for (let i = 0; i < windowClients.length; i++) {
          const client = windowClients[i];
          if (client.url === '/' && 'focus' in client) {
            return client.focus();
          }
        }
        // Open new window if not already open
        if (clients.openWindow) {
          return clients.openWindow('/');
        }
      })
  );
});

/**
 * Message Handler - Communicate with clients
 */
self.addEventListener('message', (event) => {
  console.log('[ServiceWorker] Message received:', event.data);

  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }

  if (event.data && event.data.type === 'GET_VERSION') {
    event.ports[0].postMessage({ version: APP_VERSION });
  }

  if (event.data && event.data.type === 'CLEAR_CACHES') {
    caches.keys().then(cacheNames => {
      Promise.all(
        cacheNames.map(cacheName => caches.delete(cacheName))
      ).then(() => {
        event.ports[0].postMessage({ success: true });
      });
    });
  }
});
  );
});

// Notification click
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  if (event.action === 'open') {
    event.waitUntil(
      clients.matchAll({ type: 'window' })
        .then(clientList => {
          for (const client of clientList) {
            if (client.url === '/' && 'focus' in client) {
              return client.focus();
            }
          }
          if (clients.openWindow) {
            return clients.openWindow('/');
          }
        })
    );
  }
});

// Message from client
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
