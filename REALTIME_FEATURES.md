# 🚀 Real-time Features Guide

This guide covers the real-time features implemented in the Food Delivery System:
- Socket.IO for real-time updates
- Web Push Notifications
- Real-time order tracking
- Live delivery tracking

## 📋 Table of Contents

1. [Setup](#setup)
2. [Socket.IO Real-time Updates](#socketio-real-time-updates)
3. [Push Notifications](#push-notifications)
4. [Usage Examples](#usage-examples)
5. [API Endpoints](#api-endpoints)

---

## 🔧 Setup

### 1. Database Schema

The database schema has been updated with:
- `User.pushSubscription` - Stores push notification subscription
- `Order.promotionId` - Links orders to promotions

These changes are already applied. If you need to reset the database:

```bash
npm run db:reset
```

### 2. Environment Variables

Make sure your `.env` file has the VAPID keys for push notifications:

```env
# Web Push Notifications
NEXT_PUBLIC_VAPID_PUBLIC_KEY=your_public_key
VAPID_PRIVATE_KEY=your_private_key
VAPID_EMAIL=mailto:your-email@example.com
```

To generate new VAPID keys:

```bash
npx tsx scripts/generate-vapid-keys.ts
```

### 3. Start the Server

Use the custom server with Socket.IO enabled:

```bash
npm run dev
```

This will start:
- ✓ Next.js Server at http://localhost:3000
- ✓ Socket.IO at /api/socket
- ✓ Real-time features enabled

---

## 🔌 Socket.IO Real-time Updates

### Client-side Usage

```tsx
import { useSocket } from '@/lib/hooks/useSocket';

function MyComponent() {
  const { isConnected, joinOrder, on, off } = useSocket(userId);

  useEffect(() => {
    // Join order room
    joinOrder(orderId);

    // Listen for order updates
    const handleOrderUpdate = (data) => {
      console.log('Order updated:', data);
    };

    on('order-status-update', handleOrderUpdate);

    return () => {
      off('order-status-update', handleOrderUpdate);
    };
  }, [orderId]);

  return (
    <div>
      Status: {isConnected ? 'Connected' : 'Disconnected'}
    </div>
  );
}
```

### Available Socket Events

**Client to Server:**
- `authenticate` - Authenticate user
- `join-order` - Join order room for updates
- `leave-order` - Leave order room
- `join-delivery` - Join delivery tracking room
- `leave-delivery` - Leave delivery room
- `join-restaurant` - Join restaurant room (for owners)
- `leave-restaurant` - Leave restaurant room
- `update-location` - Update driver location

**Server to Client:**
- `order-status-update` - Order status changed
- `delivery-location-update` - Driver location updated
- `notification` - New notification
- `restaurant-notification` - Restaurant-specific notification

---

## 🔔 Push Notifications

### Client-side Setup

```tsx
import { usePushNotifications } from '@/lib/hooks/usePushNotifications';

function NotificationSettings() {
  const {
    isSupported,
    isSubscribed,
    isLoading,
    error,
    subscribe,
    unsubscribe,
  } = usePushNotifications(userId);

  return (
    <div>
      {isSupported ? (
        <button
          onClick={() => isSubscribed ? unsubscribe() : subscribe()}
          disabled={isLoading}
        >
          {isSubscribed ? 'Disable' : 'Enable'} Notifications
        </button>
      ) : (
        <p>Push notifications not supported</p>
      )}
    </div>
  );
}
```

### Service Worker

The service worker is automatically registered and handles:
- Push notification events
- Notification click actions
- Background sync (future feature)

Location: `/public/sw.js`

### Sending Push Notifications

Push notifications are automatically sent when:
- Orders are created
- Order status changes
- Delivery updates occur

You can also send custom push notifications:

```ts
import { sendPushNotification } from '@/lib/services/notificationService';

await sendPushNotification(userPushSubscription, {
  title: 'New Message',
  message: 'You have a new message!',
  icon: '/icons/message-icon.png',
  data: { url: '/messages' },
});
```

---

## 💡 Usage Examples

### 1. Real-time Order Tracking

```tsx
'use client';

import { useState, useEffect } from 'react';
import { useSocket } from '@/lib/hooks/useSocket';

export function OrderTracking({ orderId, userId }) {
  const [orderStatus, setOrderStatus] = useState('PENDING');
  const { joinOrder, leaveOrder, on, off } = useSocket(userId);

  useEffect(() => {
    // Join order room
    joinOrder(orderId);

    // Listen for status updates
    const handleUpdate = (data) => {
      setOrderStatus(data.status);
      console.log('Order updated:', data);
    };

    on('order-status-update', handleUpdate);

    return () => {
      leaveOrder(orderId);
      off('order-status-update', handleUpdate);
    };
  }, [orderId]);

  return (
    <div>
      <h2>Order Status: {orderStatus}</h2>
    </div>
  );
}
```

### 2. Real-time Delivery Tracking

```tsx
'use client';

import { useState, useEffect } from 'react';
import { useSocket } from '@/lib/hooks/useSocket';

export function DeliveryTracking({ orderId, userId }) {
  const [driverLocation, setDriverLocation] = useState(null);
  const { joinDelivery, leaveDelivery, on, off } = useSocket(userId);

  useEffect(() => {
    joinDelivery(orderId);

    const handleLocationUpdate = (data) => {
      setDriverLocation(data.location);
      console.log('Driver location:', data.location);
    };

    on('delivery-location-update', handleLocationUpdate);

    return () => {
      leaveDelivery(orderId);
      off('delivery-location-update', handleLocationUpdate);
    };
  }, [orderId]);

  return (
    <div>
      {driverLocation ? (
        <p>
          Driver at: {driverLocation.latitude}, {driverLocation.longitude}
        </p>
      ) : (
        <p>Waiting for driver...</p>
      )}
    </div>
  );
}
```

### 3. Notification Bell Component

```tsx
import { NotificationBell } from '@/components/NotificationBell';

export function Header({ userId }) {
  return (
    <header>
      <nav>
        {/* Other nav items */}
        <NotificationBell userId={userId} />
      </nav>
    </header>
  );
}
```

---

## 🌐 API Endpoints

### Order Management

**Create Order**
```http
POST /api/orders
Content-Type: application/json

{
  "customerId": "user-id",
  "restaurantId": "restaurant-id",
  "addressId": "address-id",
  "items": [...],
  "promoCode": "WELCOME10"
}
```

**Update Order Status**
```http
PATCH /api/orders/{orderId}/status
Content-Type: application/json

{
  "status": "ACCEPTED"
}
```

### Notifications

**Get Notifications**
```http
GET /api/notifications?userId={userId}&limit=20
```

**Mark as Read**
```http
PATCH /api/notifications
Content-Type: application/json

{
  "notificationIds": ["id1", "id2"]
}
```

**Mark All as Read**
```http
PATCH /api/notifications
Content-Type: application/json

{
  "userId": "user-id",
  "markAllRead": true
}
```

### Push Notifications

**Subscribe**
```http
POST /api/push/subscribe
Content-Type: application/json

{
  "userId": "user-id",
  "subscription": {...}
}
```

**Unsubscribe**
```http
DELETE /api/push/subscribe?userId={userId}
```

### Delivery Tracking

**Get Tracking Info**
```http
GET /api/tracking/{orderId}
```

**Update Driver Location**
```http
PATCH /api/tracking/{orderId}
Content-Type: application/json

{
  "latitude": 13.7563,
  "longitude": 100.5018
}
```

---

## 🎯 Features Summary

### ✅ Completed Features

1. **Database Schema Updates**
   - Added `pushSubscription` field to User model
   - Added `promotionId` field to Order model

2. **Socket.IO Integration**
   - Custom Next.js server with Socket.IO
   - Real-time order status updates
   - Real-time delivery tracking
   - Room-based event broadcasting

3. **Web Push Notifications**
   - VAPID keys generation
   - Service Worker implementation
   - Push subscription management
   - Automatic notifications on order events

4. **Real-time Components**
   - `NotificationBell` - Real-time notification center
   - `useSocket` - Socket.IO client hook
   - `usePushNotifications` - Push notification management hook

5. **API Integration**
   - Order creation emits Socket.IO events
   - Order status updates send notifications
   - Delivery tracking broadcasts location updates
   - Notification API integrated with push and Socket.IO

---

## 🔍 Troubleshooting

### Socket.IO not connecting

1. Make sure you're using `npm run dev` (not `npm run dev:next`)
2. Check browser console for connection errors
3. Verify server is running on the correct port

### Push notifications not working

1. Check if VAPID keys are set in `.env`
2. Verify service worker is registered (check DevTools > Application)
3. Make sure browser supports push notifications
4. Check notification permissions in browser settings

### Real-time updates not received

1. Verify Socket.IO connection status
2. Check if you've joined the correct room
3. Look for errors in server logs
4. Ensure event listeners are properly attached

---

## 📚 Next Steps

Potential enhancements:

1. **Mobile App Integration**
   - FCM (Firebase Cloud Messaging) for mobile push
   - React Native Socket.IO client

2. **Advanced Features**
   - Typing indicators for chat
   - Read receipts for notifications
   - Offline sync with background sync API

3. **Analytics**
   - Track notification engagement
   - Monitor Socket.IO connection health
   - Analyze real-time feature usage

4. **Performance**
   - Implement Redis for Socket.IO scaling
   - Add message queuing (RabbitMQ/Kafka)
   - Optimize notification delivery

---

## 🤝 Support

If you encounter any issues or have questions:

1. Check the troubleshooting section above
2. Review server logs for errors
3. Test in different browsers
4. Check network connectivity

Happy coding! 🎉
