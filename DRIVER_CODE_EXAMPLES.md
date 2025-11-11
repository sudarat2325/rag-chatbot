# Driver System - Code Examples & Implementation Patterns

## Table of Contents
1. [Frontend Examples](#frontend-examples)
2. [Backend API Examples](#backend-api-examples)
3. [Database Queries](#database-queries)
4. [Real-time Socket Events](#real-time-socket-events)
5. [Common Patterns](#common-patterns)

---

## Frontend Examples

### 1. Driver Dashboard Initialization
**File:** `app/driver/dashboard/page.tsx`

```typescript
// Initialize driver profile on mount
useEffect(() => {
  const storedUserId = localStorage.getItem('userId');
  const storedUserRole = localStorage.getItem('userRole');

  if (!storedUserId) {
    alert('⚠️ Please login first');
    router.push('/login');
    return;
  }

  if (storedUserRole !== 'DRIVER') {
    alert('❌ You do not have permission to access this page');
    router.push('/food');
    return;
  }

  setUserName(storedUserRole || 'Rider');
  setUserId(storedUserId);
  initializeDriver(storedUserId);
}, [router]);
```

### 2. Toggle Online Status
**File:** `app/driver/dashboard/page.tsx`

```typescript
const toggleOnlineStatus = async () => {
  try {
    const storedUserId = localStorage.getItem('userId');
    if (!storedUserId) return;

    const newStatus = !isOnline;

    const response = await fetch(`/api/drivers/${storedUserId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        isOnline: newStatus, 
        isAvailable: newStatus 
      }),
    });

    const data = await response.json();

    if (data.success) {
      setIsOnline(newStatus);
      if (newStatus) {
        localStorage.setItem('driverOnlineStatus', 'true');
        fetchDeliveries(true);  // Get available deliveries
      } else {
        localStorage.removeItem('driverOnlineStatus');
        setAvailableDeliveries([]);
      }
    }
  } catch (error) {
    console.error('Error toggling online status:', error);
  }
};
```

### 3. GPS Location Tracking
**File:** `app/driver/dashboard/page.tsx`

```typescript
useEffect(() => {
  if ('geolocation' in navigator) {
    const watchId = navigator.geolocation.watchPosition(
      (position) => {
        setLocation({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        });

        // Update location to server if on delivery
        if (currentDelivery && isOnline) {
          updateLocationToServer(currentDelivery.id, {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          });
        }
      },
      (error) => {
        console.error('Error getting location:', error);
      },
      {
        enableHighAccuracy: true,
        timeout: 5000,
        maximumAge: 0,
      }
    );

    return () => {
      navigator.geolocation.clearWatch(watchId);
    };
  }
}, [currentDelivery, isOnline]);

const updateLocationToServer = async (
  deliveryId: string,
  coords: { latitude: number; longitude: number }
) => {
  try {
    await fetch(`/api/deliveries/${deliveryId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        latitude: coords.latitude,
        longitude: coords.longitude,
      }),
    });
  } catch (error) {
    console.error('Error updating location:', error);
  }
};
```

### 4. Accept Delivery Workflow
**File:** `app/driver/dashboard/page.tsx`

```typescript
const acceptDelivery = async (deliveryId: string) => {
  try {
    const storedUserId = localStorage.getItem('userId');
    if (!storedUserId) return;

    const response = await fetch('/api/deliveries', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        deliveryId,
        driverId: storedUserId,
      }),
    });

    const data = await response.json();

    if (data.success) {
      setCurrentDelivery(data.data);
      setAvailableDeliveries([]);

      // Show success notification
      const message = document.createElement('div');
      message.className = 
        'fixed top-4 right-4 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg z-50';
      message.textContent = '✅ Delivery accepted!';
      document.body.appendChild(message);
      setTimeout(() => message.remove(), 3000);
    } else {
      alert('❌ ' + (data.error || 'Unable to accept delivery'));
    }
  } catch (error) {
    console.error('Error accepting delivery:', error);
    alert('❌ An error occurred');
  }
};
```

### 5. Update Delivery Status
**File:** `app/driver/dashboard/page.tsx`

```typescript
const updateDeliveryStatus = async (deliveryId: string, status: string) => {
  try {
    const response = await fetch(`/api/deliveries/${deliveryId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    });

    const data = await response.json();

    if (data.success) {
      setCurrentDelivery(prev => 
        prev ? { ...prev, status } : null
      );

      // Clear current delivery if completed
      if (status === 'DELIVERED' || status === 'FAILED') {
        setCurrentDelivery(null);
        fetchDeliveries();
        fetchTodayStats();
      }

      // Show success feedback
      const message = document.createElement('div');
      message.className = 
        'fixed top-4 right-4 bg-green-500 text-white px-6 py-3 rounded-lg';
      message.textContent = '✅ Status updated';
      document.body.appendChild(message);
      setTimeout(() => message.remove(), 3000);
    }
  } catch (error) {
    console.error('Error updating delivery status:', error);
    alert('❌ Could not update status');
  }
};
```

### 6. Distance Calculation (Haversine Formula)
**File:** `app/driver/dashboard/page.tsx`

```typescript
const calculateDistanceKm = (
  targetLat?: number | null,
  targetLng?: number | null
): number | null => {
  if (!location || targetLat == null || targetLng == null) {
    return null;
  }

  const toRad = (value: number) => (value * Math.PI) / 180;
  const R = 6371; // Earth radius in kilometers

  const dLat = toRad(targetLat - location.latitude);
  const dLon = toRad(targetLng - location.longitude);
  const lat1 = toRad(location.latitude);
  const lat2 = toRad(targetLat);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.sin(dLon / 2) * Math.sin(dLon / 2) * 
    Math.cos(lat1) * Math.cos(lat2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return Math.round(R * c * 10) / 10; // one decimal place
};
```

---

## Backend API Examples

### 1. Get Driver Profile
**File:** `app/api/drivers/[id]/route.ts`

```typescript
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const driver = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        phone: true,
        email: true,
        role: true,
        driverProfile: true,
      },
    });

    if (!driver || driver.role !== 'DRIVER') {
      return NextResponse.json(
        { success: false, error: 'Driver not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: driver,
    });
  } catch (error) {
    console.error('Error fetching driver:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch driver' },
      { status: 500 }
    );
  }
}
```

### 2. Update Driver Profile
**File:** `app/api/drivers/[id]/route.ts`

```typescript
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { isOnline, isAvailable, vehicleType, vehiclePlate } = body;

    // Verify driver exists
    const driver = await prisma.user.findUnique({
      where: { id },
      select: { role: true },
    });

    if (!driver || driver.role !== 'DRIVER') {
      return NextResponse.json(
        { success: false, error: 'Driver not found' },
        { status: 404 }
      );
    }

    // Get or create driver profile
    let driverProfile = await prisma.driverProfile.findUnique({
      where: { userId: id },
    });

    if (!driverProfile) {
      // Create new profile
      driverProfile = await prisma.driverProfile.create({
        data: {
          userId: id,
          vehicleType: vehicleType || 'Motorcycle',
          vehiclePlate: vehiclePlate || null,
          isOnline: isOnline !== undefined ? isOnline : false,
          isAvailable: isAvailable !== undefined ? isAvailable : true,
        },
      });
    } else {
      // Update existing profile
      const updateData: Prisma.DriverProfileUpdateInput = {};

      if (isOnline !== undefined) {
        updateData.isOnline = isOnline;
        // When going offline, also set available to false
        if (!isOnline) {
          updateData.isAvailable = false;
        }
      }

      if (isAvailable !== undefined && isOnline !== false) {
        updateData.isAvailable = isAvailable;
      }

      if (vehicleType !== undefined) {
        updateData.vehicleType = vehicleType;
      }

      if (vehiclePlate !== undefined) {
        updateData.vehiclePlate = vehiclePlate;
      }

      driverProfile = await prisma.driverProfile.update({
        where: { userId: id },
        data: updateData,
      });
    }

    return NextResponse.json({
      success: true,
      data: driverProfile,
      message: 'Driver profile updated successfully',
    });
  } catch (error) {
    console.error('Error updating driver:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update driver' },
      { status: 500 }
    );
  }
}
```

### 3. Get Available Deliveries
**File:** `app/api/deliveries/route.ts` (GET handler)

```typescript
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const driverId = searchParams.get('driverId');
    const statusParam = searchParams.get('status');

    if (!driverId) {
      // Get available deliveries (no driver assigned yet)
      const availableDeliveries = await prisma.delivery.findMany({
        where: {
          status: 'FINDING_DRIVER',
          driverId: null,
          order: {
            status: {
              in: ['ACCEPTED', 'PREPARING', 'READY'],
            },
          },
        },
        include: {
          order: {
            include: {
              restaurant: {
                select: {
                  id: true,
                  ownerId: true,
                  name: true,
                  address: true,
                  phone: true,
                  latitude: true,
                  longitude: true,
                },
              },
              address: {
                select: {
                  fullAddress: true,
                  latitude: true,
                  longitude: true,
                },
              },
              customer: {
                select: {
                  id: true,
                  name: true,
                  phone: true,
                },
              },
            },
          },
        },
        orderBy: {
          createdAt: 'asc',
        },
        take: 10,
      });

      return NextResponse.json({
        success: true,
        data: availableDeliveries,
      });
    }

    // Get driver's specific deliveries
    const where: Prisma.DeliveryWhereInput = {
      driverId,
    };

    if (statusParam) {
      const statuses = statusParam
        .split(',')
        .map((value) => value.trim())
        .filter(Boolean) as DeliveryStatus[];

      if (statuses.length === 1) {
        where.status = statuses[0];
      } else if (statuses.length > 1) {
        where.status = {
          in: statuses,
        };
      }
    }

    const deliveries = await prisma.delivery.findMany({
      where,
      include: {
        order: {
          include: {
            restaurant: {
              select: {
                id: true,
                ownerId: true,
                name: true,
                address: true,
                phone: true,
              },
            },
            address: {
              select: {
                fullAddress: true,
                latitude: true,
                longitude: true,
              },
            },
            customer: {
              select: {
                id: true,
                name: true,
                phone: true,
              },
            },
            items: {
              include: {
                menuItem: {
                  select: {
                    name: true,
                  },
                },
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return NextResponse.json({
      success: true,
      data: deliveries,
    });
  } catch (error) {
    console.error('Error fetching deliveries:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch deliveries' },
      { status: 500 }
    );
  }
}
```

### 4. Accept Delivery (POST)
**File:** `app/api/deliveries/route.ts` (POST handler)

```typescript
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { deliveryId, driverId } = body;

    if (!deliveryId || !driverId) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Check delivery exists and is available
    const delivery = await prisma.delivery.findUnique({
      where: { id: deliveryId },
      include: {
        order: {
          include: {
            restaurant: true,
          },
        },
      },
    });

    if (!delivery) {
      return NextResponse.json(
        { success: false, error: 'Delivery not found' },
        { status: 404 }
      );
    }

    if (delivery.driverId) {
      return NextResponse.json(
        { success: false, error: 'Delivery already assigned' },
        { status: 400 }
      );
    }

    // Check driver is online and available
    const driverProfile = await prisma.driverProfile.findUnique({
      where: { userId: driverId },
    });

    if (!driverProfile || !driverProfile.isOnline || !driverProfile.isAvailable) {
      return NextResponse.json(
        { success: false, error: 'Driver is not available' },
        { status: 400 }
      );
    }

    // Assign delivery to driver (transactional)
    const updatedDelivery = await prisma.$transaction(async (tx) => {
      // Update delivery
      const updated = await tx.delivery.update({
        where: { id: deliveryId },
        data: {
          driverId,
          status: 'DRIVER_ASSIGNED',
          assignedAt: new Date(),
        },
        include: {
          order: {
            include: {
              restaurant: {
                select: {
                  id: true,
                  ownerId: true,
                  name: true,
                  address: true,
                  phone: true,
                },
              },
              address: true,
              customer: {
                select: {
                  id: true,
                  name: true,
                  phone: true,
                },
              },
            },
          },
        },
      });

      // Update order status
      await tx.order.update({
        where: { id: delivery.orderId },
        data: { status: 'READY' },
      });

      // Create customer notification
      await tx.notification.create({
        data: {
          userId: delivery.order.customerId,
          orderId: delivery.orderId,
          type: NotificationType.SYSTEM,
          title: 'Found a rider!',
          message: `Rider is heading to ${delivery.order.restaurant.name}`,
        },
      });

      // Update driver profile
      await tx.driverProfile.update({
        where: { userId: driverId },
        data: { isAvailable: false },
      });

      return updated;
    });

    return NextResponse.json({
      success: true,
      data: updatedDelivery,
      message: 'Delivery assigned successfully',
    }, { status: 201 });
  } catch (error) {
    console.error('Error assigning delivery:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to assign delivery' },
      { status: 500 }
    );
  }
}
```

### 5. Update Delivery Status with Retry Logic
**File:** `app/api/deliveries/[id]/route.ts` (PATCH handler - excerpt)

```typescript
const MAX_TX_RETRIES = 3;
const BACKOFF_MS = 150;

const wait = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { status, latitude, longitude } = body;

    // Get current delivery
    const currentDelivery = await prisma.delivery.findUnique({
      where: { id },
      include: {
        order: {
          include: {
            customer: true,
            restaurant: true,
          },
        },
      },
    });

    if (!currentDelivery) {
      return NextResponse.json(
        { success: false, error: 'Delivery not found' },
        { status: 404 }
      );
    }

    const updateData: Prisma.DeliveryUpdateInput = {};

    // Update location if provided
    if (latitude !== undefined && longitude !== undefined) {
      updateData.currentLatitude = latitude;
      updateData.currentLongitude = longitude;
    }

    // Location-only updates skip transaction to avoid write conflicts
    if (!status) {
      const updatedLocationDelivery = await prisma.delivery.update({
        where: { id },
        data: updateData,
      });

      return NextResponse.json({
        success: true,
        data: updatedLocationDelivery,
      });
    }

    // Status updates use transaction with retry logic
    if (status) {
      const validStatuses = [
        'FINDING_DRIVER',
        'DRIVER_ASSIGNED',
        'DRIVER_ARRIVED',
        'PICKED_UP',
        'ON_THE_WAY',
        'DELIVERED',
        'FAILED',
      ];

      if (!validStatuses.includes(status)) {
        return NextResponse.json(
          { success: false, error: 'Invalid status' },
          { status: 400 }
        );
      }

      updateData.status = status;

      // Set appropriate timestamp
      switch (status) {
        case 'DRIVER_ASSIGNED':
          updateData.assignedAt = new Date();
          break;
        case 'PICKED_UP':
          updateData.pickedUpAt = new Date();
          break;
        case 'DELIVERED':
          updateData.deliveredAt = new Date();
          break;
      }
    }

    // Retry loop for transactional updates
    let updatedDelivery;
    for (let attempt = 1; attempt <= MAX_TX_RETRIES; attempt++) {
      try {
        updatedDelivery = await prisma.$transaction(async (tx) => {
          const updated = await tx.delivery.update({
            where: { id },
            data: updateData,
            include: {
              order: {
                include: {
                  restaurant: true,
                  customer: true,
                },
              },
            },
          });

          // Handle status-specific updates
          if (status) {
            let orderStatus: OrderStatus | undefined;
            let notificationData: { 
              type: NotificationType; 
              title: string; 
              message: string; 
            } | null = null;

            switch (status) {
              case 'DELIVERED':
                orderStatus = OrderStatus.DELIVERED;
                notificationData = {
                  type: NotificationType.ORDER_DELIVERED,
                  title: 'Delivery complete',
                  message: `Order ${currentDelivery.order.orderNumber} delivered!`,
                };
                // Mark driver as available
                if (currentDelivery.driverId) {
                  await tx.driverProfile.update({
                    where: { userId: currentDelivery.driverId },
                    data: {
                      isAvailable: true,
                      totalDeliveries: { increment: 1 },
                    },
                  });
                }
                break;

              case 'FAILED':
                orderStatus = OrderStatus.CANCELLED;
                notificationData = {
                  type: NotificationType.SYSTEM,
                  title: 'Delivery failed',
                  message: 'Please contact support',
                };
                // Mark driver as available
                if (currentDelivery.driverId) {
                  await tx.driverProfile.update({
                    where: { userId: currentDelivery.driverId },
                    data: { isAvailable: true },
                  });
                }
                break;
            }

            // Update order status
            if (orderStatus) {
              await tx.order.update({
                where: { id: currentDelivery.orderId },
                data: { status: orderStatus },
              });
            }

            // Create notification
            if (notificationData) {
              await tx.notification.create({
                data: {
                  userId: currentDelivery.order.customerId,
                  orderId: currentDelivery.orderId,
                  ...notificationData,
                },
              });
            }
          }

          return updated;
        });
        break;
      } catch (error) {
        if (
          error instanceof Prisma.PrismaClientKnownRequestError &&
          error.code === 'P2034' &&
          attempt < MAX_TX_RETRIES
        ) {
          // Write conflict - retry with exponential backoff
          await wait(BACKOFF_MS * attempt);
          continue;
        }
        throw error;
      }
    }

    return NextResponse.json({
      success: true,
      data: updatedDelivery,
    });
  } catch (error) {
    console.error('Error updating delivery:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update delivery' },
      { status: 500 }
    );
  }
}
```

---

## Database Queries

### 1. Find Nearest Driver
**File:** `lib/services/driverService.ts`

```typescript
export async function findNearestDriver(): Promise<string | null> {
  try {
    // Get all online and available drivers
    const availableDrivers = await prisma.driverProfile.findMany({
      where: {
        isOnline: true,
        isAvailable: true,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    if (availableDrivers.length === 0) {
      console.warn('No available drivers found');
      return null;
    }

    // Currently returns first available driver
    // TODO: Implement distance-based selection
    const selectedDriver = availableDrivers[0];

    console.warn(
      `Selected driver: ${selectedDriver.user.name} (${selectedDriver.userId})`
    );
    return selectedDriver.userId;
  } catch (error) {
    console.error('Error finding nearest driver:', error);
    return null;
  }
}
```

### 2. Auto-Assign Driver
**File:** `lib/services/driverService.ts`

```typescript
export async function autoAssignDriver(orderId: string): Promise<boolean> {
  try {
    console.warn(`Auto-assigning driver for order ${orderId}...`);

    // Get order and delivery info
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        restaurant: {
          select: {
            latitude: true,
            longitude: true,
            name: true,
          },
        },
        delivery: true,
      },
    });

    if (!order || !order.delivery) {
      console.warn('Order or delivery not found');
      return false;
    }

    if (order.delivery.driverId) {
      console.warn('Driver already assigned');
      return true;
    }

    // Find nearest available driver
    const driverId = await findNearestDriver();

    if (!driverId) {
      console.warn('No drivers available');
      return false;
    }

    // Assign driver with transaction
    await prisma.$transaction(async (tx) => {
      // Update delivery
      await tx.delivery.update({
        where: { id: order.delivery!.id },
        data: {
          driverId,
          status: 'DRIVER_ASSIGNED',
          assignedAt: new Date(),
        },
      });

      // Update driver availability
      await tx.driverProfile.update({
        where: { userId: driverId },
        data: { isAvailable: false },
      });

      // Create notification for driver
      await tx.notification.create({
        data: {
          userId: driverId,
          orderId,
          type: NotificationType.SYSTEM,
          title: 'New delivery!',
          message: `New delivery from ${order.restaurant.name}`,
        },
      });

      // Create notification for customer
      await tx.notification.create({
        data: {
          userId: order.customerId,
          orderId,
          type: NotificationType.SYSTEM,
          title: 'Driver found!',
          message: `Driver is heading to ${order.restaurant.name}`,
        },
      });
    });

    console.warn(`Driver assigned successfully: ${driverId}`);
    return true;
  } catch (error) {
    console.error('Error auto-assigning driver:', error);
    return false;
  }
}
```

---

## Real-time Socket Events

### 1. Driver Location Update
**File:** `lib/services/socket.ts`

```typescript
// Listen for driver location updates
socket.on('driver:location', async (data: {
  orderId: string;
  latitude: number;
  longitude: number;
  driverId: string;
}) => {
  try {
    // Update delivery location in database
    await prisma.delivery.update({
      where: { orderId: data.orderId },
      data: {
        currentLatitude: data.latitude,
        currentLongitude: data.longitude,
      },
    });

    // Broadcast to order room (customer, restaurant, driver)
    io?.to(`order:${data.orderId}`).emit(SocketEvent.DRIVER_LOCATION_UPDATE, {
      orderId: data.orderId,
      latitude: data.latitude,
      longitude: data.longitude,
      timestamp: new Date(),
    });
  } catch (error) {
    console.error('Error updating driver location:', error);
  }
});
```

### 2. Order Status Update
**File:** `lib/services/socket.ts`

```typescript
// Listen for order status updates
socket.on('order:status', async (data: {
  orderId: string;
  status: string;
}) => {
  try {
    // Broadcast status change to all connected parties
    io?.to(`order:${data.orderId}`).emit(SocketEvent.ORDER_STATUS_CHANGED, {
      orderId: data.orderId,
      status: data.status,
      timestamp: new Date(),
    });
  } catch (error) {
    console.error('Error broadcasting order status:', error);
  }
});
```

### 3. Join Order Room
**File:** `lib/services/socket.ts`

```typescript
// Driver/customer/restaurant joins order room
socket.on('join:order', (orderId: string) => {
  socket.join(`order:${orderId}`);
  console.warn(`Client joined order room: ${orderId}`);
});

socket.on('join:user', (userId: string) => {
  socket.join(`user:${userId}`);
  console.warn(`User ${userId} joined their room`);
});
```

### 4. Emit Notifications
**File:** `lib/services/socket.ts`

```typescript
export function emitNotification(userId: string, notification: unknown) {
  if (io) {
    io.to(`user:${userId}`).emit(SocketEvent.NOTIFICATION_NEW, notification);
  }
}

export function emitDriverLocation(
  orderId: string, 
  location: { latitude: number; longitude: number }
) {
  if (io) {
    io.to(`order:${orderId}`).emit(SocketEvent.DRIVER_LOCATION_UPDATE, {
      ...location,
      timestamp: new Date(),
    });
  }
}
```

---

## Common Patterns

### 1. Role-Based Access Control
**Pattern:**

```typescript
// Verify user is a driver
if (storedUserRole !== 'DRIVER') {
  alert('You do not have permission to access this page');
  router.push('/food');
  return;
}
```

### 2. Optimistic Updates
**Pattern:**

```typescript
// Update local state immediately for better UX
setIsOnline(newStatus);

// Then sync with server
const response = await fetch(`/api/drivers/${userId}`, {
  method: 'PATCH',
  body: JSON.stringify({ isOnline: newStatus }),
});

// Rollback if server fails
if (!response.ok) {
  setIsOnline(!newStatus); // Revert
}
```

### 3. Polling with Cleanup
**Pattern:**

```typescript
useEffect(() => {
  if (!userId || !isOnline) {
    return;
  }

  const interval = setInterval(() => {
    fetchDeliveries();
  }, 15000);

  return () => clearInterval(interval);
}, [userId, isOnline]);
```

### 4. Error Handling with User Feedback
**Pattern:**

```typescript
try {
  const response = await fetch(url);
  const data = await response.json();

  if (data.success) {
    // Success feedback
    showSuccessMessage('Status updated');
  } else {
    // API error
    alert('Error: ' + (data.error || 'Unknown error'));
  }
} catch (error) {
  console.error('Error:', error);
  // Network/parsing error
  alert('An error occurred. Please try again.');
}
```

### 5. Transaction Pattern
**Pattern:**

```typescript
await prisma.$transaction(async (tx) => {
  // All operations must succeed or all must fail
  await tx.table1.update({...});
  await tx.table2.update({...});
  await tx.table3.create({...});
  // If any fails, transaction rolls back
});
```

---

**Last Updated:** 2025-11-10
