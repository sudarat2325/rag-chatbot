# Rider/Driver Functionality Analysis - RAG Chatbot Food Delivery System

## Executive Summary
The codebase implements a comprehensive **rider/driver management system** for a food delivery platform. The system is built with Next.js, TypeScript, Prisma ORM, and MongoDB, featuring real-time location tracking, delivery assignment, and driver-customer communication.

---

## 1. Driver Pages & UI

### 1.1 Driver Dashboard (`app/driver/dashboard/page.tsx`)
**Status:** Fully implemented and production-ready

**Key Features:**
- Real-time driver status management (Online/Offline toggle)
- Current delivery tracking with live map updates
- Available deliveries queue when not on delivery
- GPS location tracking with auto-update every 15 seconds
- Today's statistics (deliveries completed, earnings)
- Real-time chat with restaurant and customer
- Multi-status delivery workflow with action buttons
- Distance calculation using Haversine formula
- Location status indicator showing current GPS coordinates
- Responsive UI with Tailwind CSS and dark mode support

**Technologies Used:**
- React hooks (useState, useEffect, useRef)
- Geolocation API for GPS tracking
- Socket.IO for real-time updates
- Mapbox integration (fallback to Google Maps)

**UI Components:**
- Dynamic header with online/offline status indicator
- Current delivery details card
- Available deliveries list
- Chat boxes (restaurant and customer channels)
- Status action buttons with state-based rendering
- Daily earnings and delivery count summary

---

## 2. Driver API Endpoints

### 2.1 GET `/api/drivers/[id]` - Get Driver Profile
**Endpoint:** `/api/drivers/[id]`
**Method:** GET

**Functionality:**
- Retrieves driver user profile with role validation
- Returns user info: id, name, phone, email, role, driverProfile

**Response Example:**
```json
{
  "success": true,
  "data": {
    "id": "driver_user_id",
    "name": "John Rider",
    "phone": "0812345678",
    "email": "driver@example.com",
    "role": "DRIVER",
    "driverProfile": {
      "vehicleType": "Motorcycle",
      "vehiclePlate": "ABC123",
      "isOnline": true,
      "isAvailable": true,
      "rating": 4.8,
      "totalDeliveries": 245
    }
  }
}
```

### 2.2 PATCH `/api/drivers/[id]` - Update Driver Profile
**Endpoint:** `/api/drivers/[id]`
**Method:** PATCH

**Request Body:**
```json
{
  "isOnline": boolean,
  "isAvailable": boolean,
  "vehicleType": string,
  "vehiclePlate": string
}
```

**Functionality:**
- Creates or updates driver profile
- Handles online/offline status with availability management
- Auto-creates driver profile if doesn't exist
- Prevents availability change when driver is offline
- Returns updated driver profile

**Status Management Logic:**
- When going online: driver becomes available
- When going offline: driver becomes unavailable
- Availability only toggled when online

---

## 3. Delivery API Endpoints

### 3.1 GET `/api/deliveries` - Get Deliveries
**Endpoint:** `/api/deliveries`
**Method:** GET

**Query Parameters:**
- `driverId`: Optional - filter by driver
- `status`: Optional - comma-separated delivery statuses

**Delivery Statuses Supported:**
- `FINDING_DRIVER` - Waiting for driver assignment
- `DRIVER_ASSIGNED` - Driver assigned, en route to restaurant
- `DRIVER_ARRIVED` - Driver arrived at restaurant
- `PICKED_UP` - Food picked up from restaurant
- `ON_THE_WAY` - Delivery in progress to customer
- `DELIVERED` - Successfully delivered
- `FAILED` - Delivery failed

**Response (Available Deliveries):**
When no driverId specified, returns list of available deliveries:
```json
{
  "success": true,
  "data": [
    {
      "id": "delivery_id",
      "orderId": "order_id",
      "status": "FINDING_DRIVER",
      "estimatedTime": "30-45 mins",
      "order": {
        "orderNumber": "#12345",
        "total": 199.99,
        "restaurant": {
          "id": "restaurant_id",
          "name": "Thai Restaurant",
          "address": "123 Main St",
          "phone": "0899999999",
          "latitude": 13.756,
          "longitude": 100.501
        },
        "customer": {
          "id": "customer_id",
          "name": "John Doe",
          "phone": "0898888888"
        },
        "address": {
          "fullAddress": "456 Customer St"
        }
      }
    }
  ]
}
```

### 3.2 POST `/api/deliveries` - Accept/Assign Delivery
**Endpoint:** `/api/deliveries`
**Method:** POST

**Request Body:**
```json
{
  "deliveryId": "delivery_id",
  "driverId": "driver_user_id"
}
```

**Functionality:**
- Driver accepts available delivery
- Validates delivery exists and not yet assigned
- Validates driver is online and available
- Updates delivery status to `DRIVER_ASSIGNED`
- Creates notification for customer
- Marks driver as unavailable
- Emits Socket.IO events for real-time updates

**Transaction-based Operations:**
- Updates delivery with driver assignment and timestamp
- Updates order status to READY
- Creates customer notification
- Updates driver profile availability
- All operations atomic - all succeed or all fail

**Response:**
Returns updated delivery with order and customer details

### 3.3 PATCH `/api/deliveries/[id]` - Update Delivery Status
**Endpoint:** `/api/deliveries/[id]`
**Method:** PATCH

**Request Body:**
```json
{
  "status": "DRIVER_ARRIVED|PICKED_UP|ON_THE_WAY|DELIVERED|FAILED",
  "latitude": number,    // Optional - current location
  "longitude": number    // Optional - current location
}
```

**Functionality:**
- Updates delivery status and/or location
- Location-only updates bypass transaction (avoid write conflicts)
- Status updates use transactional operations with retry logic
- Automatic timestamp management based on status
- Driver availability management:
  - On DELIVERED: marks driver available, increments totalDeliveries
  - On FAILED: marks driver available for reassignment
- Automatic order status updates:
  - DRIVER_ARRIVED → Order: READY
  - DELIVERED → Order: DELIVERED
  - FAILED → Order: CANCELLED
- Customer notifications on status changes
- Socket.IO real-time event emissions

**Error Handling:**
- Retry mechanism for database write conflicts (max 3 retries with exponential backoff)
- Graceful degradation: fails fast on persistent errors
- Separate handling for location vs. status updates

**Timestamps Set:**
- `assignedAt` - when driver assigned
- `pickedUpAt` - when food picked up
- `deliveredAt` - when delivered

---

## 4. Driver Service Implementation (`lib/services/driverService.ts`)

### 4.1 findNearestDriver()
**Purpose:** Find nearest available driver for auto-assignment

**Logic:**
```typescript
export async function findNearestDriver(): Promise<string | null>
```

**Process:**
1. Query all drivers where `isOnline: true` AND `isAvailable: true`
2. Returns first available driver (TODO: implement actual distance calculation)
3. Returns driver user ID or null if none available
4. Logs warning if no drivers found

**Current State:** Uses simple first-available logic, production implementation should use:
- Haversine formula for distance calculation
- Driver current location vs. pickup location
- Consider delivery time estimates
- Load balancing

### 4.2 autoAssignDriver(orderId)
**Purpose:** Automatically assign driver to delivery when restaurant accepts order

**Process:**
1. Fetch order with delivery and restaurant location info
2. Check if delivery already has driver assigned
3. Call `findNearestDriver()` to find available driver
4. Perform transaction with atomic operations:
   - Update delivery status to `DRIVER_ASSIGNED`
   - Update delivery with assignment timestamp
   - Mark driver as unavailable
   - Create notification for driver: "มีงานใหม่! [Restaurant Name]"
   - Create notification for customer: "พบไรเดอร์แล้ว! ไรเดอร์กำลังเดินทาง"

**Return:** Boolean - true if assignment successful, false otherwise

**Error Handling:**
- Returns false if order/delivery not found
- Returns false if no drivers available
- Logs all steps with console warnings and errors

---

## 5. Database Models

### 5.1 DriverProfile Model
```prisma
model DriverProfile {
  id              String   @id @default(auto()) @map("_id") @db.ObjectId
  userId          String   @unique @db.ObjectId
  user            User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  // Vehicle Information
  vehicleType     String   // "Motorcycle", "Car", "Bicycle"
  vehiclePlate    String?

  // Status Tracking
  isOnline        Boolean  @default(false)
  isAvailable     Boolean  @default(true)

  // Performance Stats
  rating          Float    @default(5.0)
  totalDeliveries Int      @default(0)

  // Documentation
  licenseNumber   String?
  licenseExpiry   DateTime?

  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
}
```

### 5.2 Delivery Model
```prisma
model Delivery {
  id              String         @id @default(auto()) @map("_id") @db.ObjectId
  orderId         String         @unique @db.ObjectId
  order           Order          @relation(fields: [orderId], references: [id], onDelete: Cascade)

  driverId        String?        @db.ObjectId
  driver          User?          @relation(fields: [driverId], references: [id])

  status          DeliveryStatus @default(FINDING_DRIVER)

  // Location Data
  pickupLatitude  Float?
  pickupLongitude Float?
  deliveryLatitude  Float?
  deliveryLongitude Float?

  // Real-time Driver Location
  currentLatitude   Float?
  currentLongitude  Float?

  // Timing
  estimatedTime     String?
  assignedAt        DateTime?
  pickedUpAt        DateTime?
  deliveredAt       DateTime?

  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt
}

enum DeliveryStatus {
  FINDING_DRIVER    // Waiting for driver
  DRIVER_ASSIGNED   // Driver found and assigned
  DRIVER_ARRIVED    // At restaurant
  PICKED_UP         // Food collected
  ON_THE_WAY        // En route to customer
  DELIVERED         // Delivered successfully
  FAILED            // Delivery failed
}
```

---

## 6. User Model Extensions for Drivers
```prisma
model User {
  // ... other fields ...
  
  // Driver Relations
  deliveries    Delivery[]
  driverProfile DriverProfile?
  
  role          UserRole
}

enum UserRole {
  CUSTOMER
  RESTAURANT_OWNER
  DRIVER
  ADMIN
}
```

---

## 7. Real-time Communication

### 7.1 Socket.IO Events

#### Driver Location Updates
```typescript
// Emit event: driver:location
socket.on('driver:location', async (data: {
  orderId: string;
  latitude: number;
  longitude: number;
  driverId: string;
}) => {
  // Updates database and broadcasts to order room
  io.to(`order:${orderId}`).emit('DRIVER_LOCATION_UPDATE', {
    orderId, latitude, longitude, timestamp
  });
});
```

#### Order Status Updates
```typescript
socket.on('order:status', async (data: {
  orderId: string;
  status: string;
}) => {
  io.to(`order:${orderId}`).emit('ORDER_STATUS_CHANGED', {
    orderId, status, timestamp
  });
});
```

### 7.2 Socket Rooms
- `order:{orderId}` - Order-specific room for all participants
- `user:{userId}` - User-specific room for notifications
- `restaurant:{restaurantId}` - Restaurant notifications

### 7.3 Helper Functions
- `emitOrderUpdate(orderId, data)` - Emit order updates
- `emitOrderStatusChange(orderId, status)` - Emit status changes
- `emitDriverLocation(orderId, location)` - Emit driver location
- `emitNotification(userId, notification)` - User notifications
- `emitToRestaurant(restaurantId, event, data)` - Restaurant notifications

---

## 8. Authentication & Driver Registration

### 8.1 User Registration (`/api/auth/register`)
**Current State:** Only creates CUSTOMER role users

**Limitations:**
- Registration endpoint hardcodes role to `CUSTOMER`
- No driver-specific registration flow
- No verification for driver documents

**Missing Features:**
- Driver role selection during registration
- License number and expiry collection
- Vehicle type and plate number during signup
- Driver verification workflow
- KYC (Know Your Customer) requirements

### 8.2 User Login (`/api/auth/login`)
**Current State:** Universal login for all roles

**Features:**
- Email/password authentication
- Auto-creates CUSTOMER account on first login
- Returns user role (can be DRIVER for existing users)
- Rate limiting: 5 requests per 15 minutes per IP

**For Drivers:**
- Must have account with role='DRIVER' created by admin/seed data
- No self-service driver signup currently implemented

---

## 9. Customer-Facing Delivery Tracking

### 9.1 Order Tracking Page (`app/orders/[orderId]/page.tsx`)
**Status:** Fully implemented

**Features:**
- Real-time order status visualization
- Live driver location tracking on map
- Chat with restaurant and driver
- Delivery map with three markers:
  - Restaurant location (green 🏪)
  - Delivery location (blue 📍)
  - Driver location (orange 🛵, updates in real-time)
- Order details display
- Review submission after delivery
- Status timeline with icons:
  - PENDING: Clock icon, yellow
  - ACCEPTED: Checkmark, blue
  - PREPARING: Chef hat, orange
  - READY: Package, purple
  - PICKED_UP: Bike, indigo
  - ON_THE_WAY: Bike, cyan
  - DELIVERED: Checkmark, green
  - CANCELLED/REJECTED: X, red

### 9.2 DeliveryMap Component (`components/map/DeliveryMap.tsx`)
**Status:** Fully implemented with fallback

**Features:**
- Mapbox integration (when token configured)
- Automatic map bounds fitting based on all locations
- Real-time driver marker updates
- Navigation control
- Fallback to Google Maps link when Mapbox not available
- Demo mode with helpful message

---

## 10. Driver Statistics & Analytics

### 10.1 Driver Stats Tracking
**Tracked Metrics:**
- `totalDeliveries` - Cumulative delivery count
- `rating` - Average driver rating (1-5)
- `isOnline` - Current online status
- `isAvailable` - Current availability status

**Stats Visible on Dashboard:**
- Today's deliveries count
- Today's earnings (sum of order totals from delivered orders)
- GPS location (live latitude/longitude)

### 10.2 Daily Stats Model
```prisma
model DailyStats {
  id              String   @id @default(auto()) @map("_id") @db.ObjectId
  date            DateTime @unique
  
  totalOrders     Int      @default(0)
  totalRevenue    Float    @default(0)
  totalDeliveries Int      @default(0)
  activeDrivers   Int      @default(0)
  avgOrderValue   Float    @default(0)
  avgDeliveryTime Float    @default(0)
  
  createdAt       DateTime @default(now())
}
```

---

## 11. Notification System for Drivers

### 11.1 Notification Types
```prisma
enum NotificationType {
  ORDER_PLACED
  ORDER_ACCEPTED
  ORDER_PREPARING
  ORDER_READY
  ORDER_PICKED_UP
  ORDER_ON_THE_WAY
  ORDER_DELIVERED
  ORDER_CANCELLED
  PROMOTION
  SYSTEM
}
```

### 11.2 Driver Notifications
**When delivery assigned to driver:**
- Type: SYSTEM
- Title: "มีงานใหม่!" (Thai: "New job!")
- Message: "คุณได้รับงานส่งอาหารจาก [Restaurant Name]"
- Contains: orderId for tracking

**When driver completes delivery:**
- Customer notified with: "จัดส่งสำเร็จ" (Successfully delivered)
- Driver marked available for new deliveries

---

## 12. Current Implementation Status

### Fully Implemented
✓ Driver dashboard with online/offline status
✓ Real-time location tracking (GPS/Geolocation API)
✓ Delivery assignment workflow
✓ Driver profile management
✓ Real-time Socket.IO communication
✓ Customer order tracking
✓ Delivery map visualization
✓ Driver-customer/restaurant chat
✓ Status workflow management
✓ Notification system
✓ Statistics tracking
✓ Role-based access control

### Partially Implemented
⚠ Driver registration (need separate flow)
⚠ Nearest driver algorithm (basic, not distance-based)
⚠ Driver documents/verification (schema exists, not integrated)
⚠ Driver rating system (schema exists, not implemented)

### Not Implemented
✗ Driver background verification
✗ Driver profile editing UI
✗ Driver earnings dashboard/payouts
✗ Driver support/help system
✗ Driver performance metrics/analytics
✗ Acceptance/rejection of deliveries
✗ Driver photo upload for verification
✗ Delivery issue reporting
✗ Multi-driver/team assignments

---

## 13. Key Technologies & Libraries

**Backend:**
- Next.js 13+ (App Router)
- Prisma ORM with MongoDB
- Socket.IO for real-time communication
- bcryptjs for password hashing
- TypeScript for type safety

**Frontend:**
- React 18+ with hooks
- TailwindCSS for styling
- Lucide React for icons
- Mapbox GL for maps
- Native Geolocation API for GPS

**Infrastructure:**
- MongoDB database
- WebSocket (Socket.IO) for real-time updates
- Google Maps fallback
- Rate limiting middleware

---

## 14. Security Considerations

**Current Implementation:**
- Password hashing with bcryptjs (10 salt rounds)
- Role-based access control (RBAC)
- Rate limiting on auth endpoints (5/15min per IP)
- User role validation on driver endpoints

**Recommended Enhancements:**
- JWT token-based authentication
- HTTPS/TLS for all communications
- Input validation and sanitization
- CORS configuration hardening
- Rate limiting on delivery endpoints
- Driver verification before assignment
- Encryption for sensitive location data
- Audit logging for deliveries

---

## 15. Performance Metrics

**Location Update Frequency:**
- Dashboard: Updates every 15 seconds via polling
- GPS tracking: Every 5-10 seconds (configurable in geolocation options)
- Database: Real-time via location update patch endpoint

**Scalability Considerations:**
- Socket.IO rooms prevent broadcasting to all users
- Transactional database operations prevent race conditions
- Connection pooling for database queries
- Retry logic for write conflicts (P2034 handling)

---

## 16. Data Flow Diagrams

### Delivery Assignment Flow
```
1. Customer places order → Delivery created with status: FINDING_DRIVER
2. Restaurant accepts order → autoAssignDriver() called
3. findNearestDriver() returns available driver
4. Transaction:
   - Delivery.driverId = driver
   - Delivery.status = DRIVER_ASSIGNED
   - DriverProfile.isAvailable = false
   - Notification created for driver and customer
5. Driver receives notification (real-time)
6. Customer sees driver assigned and location on map
```

### Delivery Completion Flow
```
1. Driver picks up food → PICKED_UP status
2. Driver en route → ON_THE_WAY status
3. Driver arrives at customer → DELIVERED status
   - Order status → DELIVERED
   - DriverProfile.isAvailable = true
   - DriverProfile.totalDeliveries += 1
   - Customer notified
4. Driver now available for next delivery
```

---

## 17. Testing Recommendations

**Unit Tests Needed:**
- findNearestDriver() logic
- autoAssignDriver() transaction handling
- Status transition validation
- Location update calculations

**Integration Tests Needed:**
- Full delivery assignment flow
- Socket.IO event propagation
- Database transaction rollback
- Concurrent status updates
- Real-time map updates

**E2E Tests Needed:**
- Driver login to delivery completion
- Customer sees real-time location
- Chat between driver and customer
- Notification delivery

---

## 18. Conclusion

The rider/driver system is **well-architected and feature-complete** for core delivery operations. It successfully implements:

1. **Full Delivery Lifecycle** - From assignment to completion
2. **Real-time Updates** - Location tracking, notifications, chat
3. **Performance Optimization** - Transaction handling, retry logic
4. **User Experience** - Intuitive dashboard, real-time feedback
5. **Data Integrity** - Atomic transactions, conflict handling

**Primary Gap:** Lacks self-service driver registration and administrative tools for driver management beyond basic profile updates.

**Recommendation:** Implement dedicated driver registration flow with document verification to fully operationalize the platform for onboarding new riders.
