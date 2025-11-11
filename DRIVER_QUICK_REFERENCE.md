# Driver/Rider System - Quick Reference Guide

## System Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────┐
│                     RIDER/DRIVER SYSTEM ARCHITECTURE                 │
└─────────────────────────────────────────────────────────────────────┘

┌─── FRONTEND (Driver Dashboard) ───┐
│ app/driver/dashboard/page.tsx      │
│ - Online/Offline Toggle            │
│ - Current Delivery Tracking        │
│ - Available Deliveries Queue       │
│ - Real-time GPS Tracking           │
│ - Chat Interface                   │
│ - Status Workflow Actions          │
│ - Daily Stats Display              │
└────────────────────────────────────┘
           │
           ▼
┌─── SOCKET.IO REAL-TIME ────────────┐
│ Socket Events:                      │
│ • driver:location                   │
│ • order:status                      │
│ • Rooms: order:{id}, user:{id}      │
└────────────────────────────────────┘
           │
           ▼
┌─── API ENDPOINTS ──────────────────┐
│ /api/drivers/[id] (GET, PATCH)      │
│ /api/deliveries (GET, POST)         │
│ /api/deliveries/[id] (PATCH)        │
└────────────────────────────────────┘
           │
           ▼
┌─── DATABASE (MongoDB) ─────────────┐
│ Models:                             │
│ • User (role: DRIVER)               │
│ • DriverProfile                     │
│ • Delivery                          │
│ • Notification                      │
└────────────────────────────────────┘
```

## Key Features Checklist

### Core Features (100% Complete)
```
✅ Driver Online/Offline Status
✅ Real-time Location Tracking (GPS)
✅ Delivery Assignment & Workflow
✅ Driver Profile Management
✅ Customer Order Tracking
✅ Live Map Visualization
✅ Driver-Customer/Restaurant Chat
✅ Notification System
✅ Status Update Workflow
✅ Statistics & Analytics
```

### Partially Implemented (Needs Work)
```
⚠️  Driver Registration (basic, no self-serve)
⚠️  Nearest Driver Algorithm (first-available only)
⚠️  Driver Document Verification (schema only)
⚠️  Rating System (schema only, not active)
```

### Missing Features
```
❌ Driver Profile Editing UI
❌ Earnings/Payouts Dashboard
❌ Driver Support System
❌ Background Verification
❌ Performance Analytics
❌ Delivery Issue Reporting
```

## Delivery Status Workflow

```
┌─────────────────┐
│ FINDING_DRIVER  │ (Waiting for driver assignment)
└────────┬────────┘
         │
         ▼
┌──────────────────┐
│ DRIVER_ASSIGNED  │ (Driver found, en route to restaurant)
└────────┬─────────┘
         │
         ▼
┌────────────────┐
│ DRIVER_ARRIVED │ (At restaurant, picking up food)
└────────┬───────┘
         │
         ▼
┌──────────────┐
│ PICKED_UP    │ (Food collected, heading to customer)
└────────┬─────┘
         │
         ▼
┌──────────────┐
│ ON_THE_WAY   │ (Delivery in progress)
└────────┬─────┘
         │
         ▼
┌──────────────┐
│ DELIVERED    │ (Delivery complete)
└──────────────┘

Alternative: FAILED → Driver marked available again
```

## API Quick Reference

### Get Driver Profile
```bash
GET /api/drivers/[userId]

Response:
{
  "success": true,
  "data": {
    "id": "user_id",
    "name": "John Rider",
    "role": "DRIVER",
    "driverProfile": {
      "vehicleType": "Motorcycle",
      "isOnline": true,
      "isAvailable": true,
      "totalDeliveries": 245,
      "rating": 4.8
    }
  }
}
```

### Update Driver Status
```bash
PATCH /api/drivers/[userId]

Body:
{
  "isOnline": true|false,
  "isAvailable": true|false,
  "vehicleType": "Motorcycle|Car|Bicycle",
  "vehiclePlate": "ABC123"
}
```

### Get Available Deliveries
```bash
GET /api/deliveries

Response: Array of deliveries waiting for driver assignment
```

### Accept Delivery
```bash
POST /api/deliveries

Body:
{
  "deliveryId": "delivery_id",
  "driverId": "driver_user_id"
}
```

### Update Delivery Status
```bash
PATCH /api/deliveries/[deliveryId]

Body:
{
  "status": "DRIVER_ARRIVED|PICKED_UP|ON_THE_WAY|DELIVERED|FAILED",
  "latitude": 13.7563,      # Optional
  "longitude": 100.5018     # Optional
}
```

## Database Models Summary

### DriverProfile
```
- vehicleType: "Motorcycle" | "Car" | "Bicycle"
- vehiclePlate: optional string
- isOnline: boolean (default: false)
- isAvailable: boolean (default: true)
- rating: float (default: 5.0)
- totalDeliveries: int (default: 0)
- licenseNumber: optional string
- licenseExpiry: optional datetime
```

### Delivery
```
- status: DeliveryStatus (7 statuses)
- driverId: optional reference to User
- pickupLatitude/Longitude: restaurant location
- deliveryLatitude/Longitude: customer delivery address
- currentLatitude/Longitude: driver's real-time location
- assignedAt, pickedUpAt, deliveredAt: timestamps
```

## Real-time Communication Events

### Driver Location Updates
```typescript
// Emitted every 5-10 seconds
socket.emit('driver:location', {
  orderId: string,
  latitude: number,
  longitude: number,
  driverId: string
});

// Received by customers in order room
io.to(`order:${orderId}`).emit('DRIVER_LOCATION_UPDATE', {...})
```

### Order Status Changes
```typescript
socket.on('order:status', (data: {
  orderId: string,
  status: string
}) => {
  io.to(`order:${orderId}`).emit('ORDER_STATUS_CHANGED', data);
});
```

## File Structure

```
app/
├── driver/
│   └── dashboard/
│       └── page.tsx                    # Driver Dashboard UI
├── api/
│   ├── drivers/
│   │   └── [id]/
│   │       └── route.ts               # GET/PATCH driver profile
│   └── deliveries/
│       ├── route.ts                   # GET/POST deliveries
│       └── [id]/
│           └── route.ts               # PATCH delivery status

lib/
├── services/
│   ├── driverService.ts               # findNearestDriver, autoAssignDriver
│   ├── socket.ts                      # Socket.IO server setup
│   └── socketService.ts               # Socket helper functions
└── types/
    └── index.ts                       # TypeScript definitions

components/
├── map/
│   └── DeliveryMap.tsx               # Mapbox delivery tracking
└── chat/
    └── ChatBox.tsx                    # Driver-Customer chat

prisma/
└── schema.prisma                      # Database models
```

## Key Implementation Details

### Transaction-based Operations
All critical driver operations use database transactions to ensure atomicity:

```typescript
// Example: Delivery Assignment
prisma.$transaction(async (tx) => {
  // Update 1: Delivery assignment
  await tx.delivery.update({...});
  
  // Update 2: Driver availability
  await tx.driverProfile.update({...});
  
  // Update 3: Create notifications (2)
  await tx.notification.create({...});
  // All succeed together or all fail together
});
```

### Error Handling for Conflicts
Location-only updates bypass transactions to avoid write conflicts:
```typescript
// Frequent location updates
if (!status) {
  // Simple update, no transaction
  await prisma.delivery.update({...});
}

// Status updates with retries
for (let attempt = 1; attempt <= MAX_TX_RETRIES; attempt++) {
  try {
    // Try transactional update
  } catch (error) {
    if (error.code === 'P2034' && attempt < MAX_TX_RETRIES) {
      await wait(BACKOFF_MS * attempt);
      continue;  // Retry with exponential backoff
    }
    throw error;
  }
}
```

### Location Calculation
Distance calculation uses Haversine formula for accurate results:

```typescript
const calculateDistanceKm = (
  targetLat: number, 
  targetLng: number, 
  location: {latitude, longitude}
) => {
  const toRad = (value: number) => (value * Math.PI) / 180;
  const R = 6371; // Earth radius in km
  
  const dLat = toRad(targetLat - location.latitude);
  const dLon = toRad(targetLng - location.longitude);
  
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) + 
            Math.sin(dLon/2) * Math.sin(dLon/2) * 
            Math.cos(toRad(location.latitude)) * 
            Math.cos(toRad(targetLat));
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
};
```

## Performance Characteristics

| Operation | Frequency | Method |
|-----------|-----------|--------|
| Location Update | Every 5-10s | PATCH (no transaction) |
| Status Update | On action | PATCH (with transaction) |
| Available Deliveries Fetch | Every 15s | GET polling |
| GPS Tracking | Every 5-10s | Geolocation API |
| Socket.IO Room Broadcast | Real-time | Emit to room |

## Testing Checklist

- [ ] Driver login and role verification
- [ ] Online/offline status toggle
- [ ] Available deliveries fetch
- [ ] Delivery acceptance workflow
- [ ] Status transitions (all 7 states)
- [ ] Location updates and map refresh
- [ ] Chat functionality with customer/restaurant
- [ ] Notification delivery and display
- [ ] Socket.IO real-time event propagation
- [ ] Concurrent status updates (race conditions)
- [ ] Driver availability management
- [ ] Today's stats calculation

## Common Issues & Troubleshooting

### Issue: Location not updating on map
**Solution:** Check Mapbox token configuration and ensure geolocation permissions granted

### Issue: Driver appears offline after refresh
**Solution:** Check localStorage for driverOnlineStatus; profile status fetched from DB on init

### Issue: Multiple deliveries shown as current
**Solution:** API filters for DRIVER_ASSIGNED, DRIVER_ARRIVED, PICKED_UP, ON_THE_WAY statuses

### Issue: Chat not working
**Solution:** Verify recipientId and recipientType are correct (restaurant vs customer)

### Issue: Status updates slow
**Solution:** Check database connection; location updates and status updates are separate paths

## Configuration Environment Variables

```
DATABASE_URL=mongodb://...              # MongoDB connection
NEXT_PUBLIC_MAPBOX_TOKEN=pk.eyJ...      # Mapbox token (optional, uses Google Maps fallback)
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

## Deployment Considerations

1. **Real-time Communication:** Ensure WebSocket support enabled
2. **Location Tracking:** HTTPS required for Geolocation API
3. **Database:** MongoDB Atlas recommended, or self-hosted
4. **Scalability:** Use Socket.IO adapter for multi-server deployment
5. **Rate Limiting:** Implement on delivery endpoints for production
6. **Monitoring:** Track socket connections, location update frequency
7. **Backup:** Regular MongoDB backups essential for delivery history

---

**Status:** Production-Ready for Core Features | Enhancement Needed for Advanced Features
**Last Updated:** 2025-11-10
