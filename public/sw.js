/* eslint-env serviceworker */
/* global console, self, clients, fetch, atob, caches */
/**
 * Service Worker for PWA
 *
 * This service worker handles:
 * - Push notification events
 * - Notification clicks
 * - Offline support with cache strategies
 * - Background sync
 */

// Service Worker version
const SW_VERSION = '2.0.0';
const CACHE_NAME = `food-delivery-v${SW_VERSION}`;
const RUNTIME_CACHE = `runtime-${CACHE_NAME}`;
const OFFLINE_PAGE = '/offline.html';

// Assets to cache on install
const STATIC_ASSETS = [
  '/',
  '/offline.html',
  '/manifest.json',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png',
];

console.warn(`🔧 Service Worker v${SW_VERSION} loaded`);

// Listen for push events
self.addEventListener('push', (event) => {
  console.warn('📬 Push notification received:', event);

  if (!event.data) {
    console.warn('⚠️  Push event has no data');
    return;
  }

  let notificationData;
  try {
    notificationData = event.data.json();
  } catch (error) {
    console.error('❌ Failed to parse notification data:', error);
    return;
  }

  const {
    title = 'Food Delivery',
    body = 'You have a new notification',
    icon = '/icons/notification-icon.png',
    badge = '/icons/badge-icon.png',
    data = {},
  } = notificationData;

  const options = {
    body,
    icon,
    badge,
    data,
    vibrate: [200, 100, 200],
    tag: data.orderId || 'notification',
    requireInteraction: data.requireInteraction || false,
    actions: [
      {
        action: 'view',
        title: 'View',
        icon: '/icons/view-icon.png',
      },
      {
        action: 'dismiss',
        title: 'Dismiss',
        icon: '/icons/close-icon.png',
      },
    ],
  };

  event.waitUntil(
    self.registration.showNotification(title, options)
      .then(() => {
        console.warn('✅ Notification displayed:', title);
      })
      .catch((error) => {
        console.error('❌ Failed to display notification:', error);
      })
  );
});

// Handle notification click
self.addEventListener('notificationclick', (event) => {
  console.warn('👆 Notification clicked:', event.notification.tag);

  event.notification.close();

  const { action, notification } = event;
  const { data } = notification;

  // Handle different actions
  if (action === 'dismiss') {
    console.warn('User dismissed notification');
    return;
  }

  // Default action or 'view' action
  let targetUrl = '/';

  if (data.orderId) {
    // Navigate to order tracking page
    targetUrl = `/orders/${data.orderId}`;
  } else if (data.url) {
    // Custom URL
    targetUrl = data.url;
  }

  // Open or focus the app window
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then((windowClients) => {
        // Check if there's already a window open
        for (let i = 0; i < windowClients.length; i++) {
          const client = windowClients[i];
          if (client.url.includes(targetUrl) && 'focus' in client) {
            return client.focus();
          }
        }

        // If no window is open, open a new one
        if (clients.openWindow) {
          return clients.openWindow(targetUrl);
        }
      })
      .catch((error) => {
        console.error('❌ Failed to handle notification click:', error);
      })
  );
});

// Handle push subscription change
self.addEventListener('pushsubscriptionchange', (event) => {
  console.warn('🔄 Push subscription changed');

  event.waitUntil(
    self.registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(
        // This should match your VAPID public key
        self.registration.scope
      ),
    })
      .then((subscription) => {
        console.warn('✅ Re-subscribed to push notifications');
        // Send new subscription to server
        return fetch('/api/push/subscribe', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            subscription,
          }),
        });
      })
      .catch((error) => {
        console.error('❌ Failed to re-subscribe:', error);
      })
  );
});

// Service Worker installation
self.addEventListener('install', (event) => {
  console.warn(`✅ Service Worker v${SW_VERSION} installing...`);

  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => {
        console.warn('📦 Caching static assets');
        return cache.addAll(STATIC_ASSETS);
      })
      .then(() => {
        console.warn(`✅ Service Worker v${SW_VERSION} installed`);
        // Skip waiting to activate immediately
        return self.skipWaiting();
      })
      .catch((error) => {
        console.error('❌ Failed to cache static assets:', error);
      })
  );
});

// Service Worker activation
self.addEventListener('activate', (event) => {
  console.warn(`✅ Service Worker v${SW_VERSION} activating...`);

  event.waitUntil(
    caches
      .keys()
      .then((cacheNames) => {
        // Delete old caches
        return Promise.all(
          cacheNames
            .filter((name) => name !== CACHE_NAME && name !== RUNTIME_CACHE)
            .map((name) => {
              console.warn(`🗑️  Deleting old cache: ${name}`);
              return caches.delete(name);
            })
        );
      })
      .then(() => {
        console.warn(`✅ Service Worker v${SW_VERSION} activated`);
        // Claim all clients immediately
        return clients.claim();
      })
  );
});

// Fetch event - Network First strategy for API, Cache First for static assets
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== 'GET') {
    return;
  }

  // Skip chrome-extension and other non-http(s) requests
  if (!url.protocol.startsWith('http')) {
    return;
  }

  // API requests - Network First strategy
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          // Clone the response before caching
          const responseToCache = response.clone();
          caches.open(RUNTIME_CACHE).then((cache) => {
            cache.put(request, responseToCache);
          });
          return response;
        })
        .catch(() => {
          // Return cached response if network fails
          return caches.match(request).then((response) => {
            if (response) {
              return response;
            }
            // Return offline response for API calls
            return new Response(
              JSON.stringify({
                success: false,
                error: 'You are offline. Please check your internet connection.',
                offline: true,
              }),
              {
                headers: { 'Content-Type': 'application/json' },
                status: 503,
              }
            );
          });
        })
    );
    return;
  }

  // Static assets and pages - Cache First strategy
  event.respondWith(
    caches.match(request).then((cachedResponse) => {
      if (cachedResponse) {
        // Return cached version and update cache in background
        fetch(request)
          .then((response) => {
            caches.open(RUNTIME_CACHE).then((cache) => {
              cache.put(request, response);
            });
          })
          .catch(() => {
            // Ignore fetch errors in background update
          });

        return cachedResponse;
      }

      // Not in cache, fetch from network
      return fetch(request)
        .then((response) => {
          // Don't cache non-successful responses
          if (!response || response.status !== 200) {
            return response;
          }

          // Clone the response before caching
          const responseToCache = response.clone();
          caches.open(RUNTIME_CACHE).then((cache) => {
            cache.put(request, responseToCache);
          });

          return response;
        })
        .catch(() => {
          // Return offline page for navigation requests
          if (request.mode === 'navigate') {
            return caches.match(OFFLINE_PAGE);
          }

          // Return fallback for images
          if (request.destination === 'image') {
            return new Response(
              '<svg width="100" height="100" xmlns="http://www.w3.org/2000/svg"><rect width="100" height="100" fill="#f97316"/><text x="50" y="50" text-anchor="middle" fill="white" font-size="14">Offline</text></svg>',
              { headers: { 'Content-Type': 'image/svg+xml' } }
            );
          }

          return new Response('Offline', { status: 503 });
        });
    })
  );
});

// Helper function to convert VAPID key
function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding)
    .replace(/-/g, '+')
    .replace(/_/g, '/');

  const rawData = atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }

  return outputArray;
}
