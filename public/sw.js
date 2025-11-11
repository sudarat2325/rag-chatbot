/* eslint-env serviceworker */
/* global console, self, clients, fetch, atob */
/**
 * Service Worker for Push Notifications
 *
 * This service worker handles:
 * - Push notification events
 * - Notification clicks
 * - Background sync (future)
 */

// Service Worker version
const SW_VERSION = '1.0.0';

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
self.addEventListener('install', () => {
  console.warn(`✅ Service Worker v${SW_VERSION} installed`);
  // Skip waiting to activate immediately
  self.skipWaiting();
});

// Service Worker activation
self.addEventListener('activate', (event) => {
  console.warn(`✅ Service Worker v${SW_VERSION} activated`);
  // Claim all clients immediately
  event.waitUntil(clients.claim());
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
