import webpush from 'web-push';

// Configure web push (you'll need to set these in environment variables)
const vapidKeys = {
  publicKey: process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || '',
  privateKey: process.env.VAPID_PRIVATE_KEY || '',
};

if (vapidKeys.publicKey && vapidKeys.privateKey) {
  webpush.setVapidDetails(
    process.env.VAPID_EMAIL || 'mailto:your-email@example.com',
    vapidKeys.publicKey,
    vapidKeys.privateKey
  );
}

export interface PushNotificationPayload {
  title: string;
  message: string;
  icon?: string;
  badge?: string;
  data?: Record<string, unknown>;
}

/**
 * Send push notification to a user's subscribed devices
 */
export async function sendPushNotification(
  subscription: webpush.PushSubscription | string,
  payload: PushNotificationPayload
): Promise<boolean> {
  try {
    // Skip if VAPID keys are not configured
    if (!vapidKeys.publicKey || !vapidKeys.privateKey) {
      console.warn('⚠️  Push notifications not configured. Set VAPID keys in .env');
      return false;
    }

    // Parse subscription if it's a string
    const parsedSubscription = typeof subscription === 'string'
      ? JSON.parse(subscription)
      : subscription;

    const notificationPayload = JSON.stringify({
      title: payload.title,
      body: payload.message,
      icon: payload.icon || '/icons/notification-icon.png',
      badge: payload.badge || '/icons/badge-icon.png',
      data: payload.data || {},
    });

    await webpush.sendNotification(parsedSubscription, notificationPayload);

    console.warn('✅ Push notification sent successfully');
    return true;
  } catch (error) {
    console.error('❌ Error sending push notification:', error);
    return false;
  }
}

/**
 * Send push notification to multiple subscriptions
 */
export async function sendBulkPushNotifications(
  subscriptions: (webpush.PushSubscription | string)[],
  payload: PushNotificationPayload
): Promise<{ success: number; failed: number }> {
  const results = await Promise.allSettled(
    subscriptions.map(sub => sendPushNotification(sub, payload))
  );

  const success = results.filter(r => r.status === 'fulfilled' && r.value).length;
  const failed = results.length - success;

  return { success, failed };
}

/**
 * Generate VAPID keys (run this once to generate keys for your app)
 * Usage: node -e "require('./lib/services/notificationService').generateVapidKeys()"
 */
export function generateVapidKeys() {
  const keys = webpush.generateVAPIDKeys();
  console.warn('VAPID Keys Generated:');
  console.warn('\nAdd these to your .env file:');
  console.warn(`\nNEXT_PUBLIC_VAPID_PUBLIC_KEY=${keys.publicKey}`);
  console.warn(`VAPID_PRIVATE_KEY=${keys.privateKey}\n`);
  return keys;
}
