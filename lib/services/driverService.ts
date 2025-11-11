import prisma from '@/lib/prisma';
import { NotificationType } from '@prisma/client';

/**
 * Calculate distance between two coordinates using Haversine formula
 * @param lat1 Latitude of point 1
 * @param lon1 Longitude of point 1
 * @param lat2 Latitude of point 2
 * @param lon2 Longitude of point 2
 * @returns Distance in kilometers
 */
function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371; // Radius of Earth in kilometers
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) *
      Math.cos(lat2 * (Math.PI / 180)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;

  return distance;
}

interface FindNearestDriverOptions {
  restaurantLat?: number;
  restaurantLon?: number;
  maxDistance?: number; // Maximum distance in kilometers
}

/**
 * Find nearest available driver for a delivery
 * @param options Options for finding nearest driver
 * @returns Driver user ID or null if no driver available
 */
export async function findNearestDriver(
  options: FindNearestDriverOptions = {}
): Promise<string | null> {
  try {
    const { restaurantLat, restaurantLon, maxDistance = 10 } = options;

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
      console.warn('⚠️ No available drivers found');
      return null;
    }

    // If restaurant location is provided, calculate distances and sort by nearest
    if (restaurantLat !== undefined && restaurantLon !== undefined) {
      const driversWithDistance = availableDrivers
        .filter(
          (driver) =>
            driver.currentLatitude !== null && driver.currentLongitude !== null
        )
        .map((driver) => {
          const distance = calculateDistance(
            restaurantLat,
            restaurantLon,
            driver.currentLatitude!,
            driver.currentLongitude!
          );

          return {
            driver,
            distance,
          };
        })
        .filter((item) => item.distance <= maxDistance) // Only drivers within maxDistance
        .sort((a, b) => a.distance - b.distance); // Sort by distance (nearest first)

      if (driversWithDistance.length === 0) {
        console.warn(
          `⚠️ No drivers found within ${maxDistance}km of restaurant`
        );
        // Fallback: return any available driver
        const fallbackDriver = availableDrivers[0];
        console.warn(
          `✅ Using fallback driver: ${fallbackDriver.user.name} (${fallbackDriver.userId})`
        );
        return fallbackDriver.userId;
      }

      const nearestDriver = driversWithDistance[0];
      console.warn(
        `✅ Selected nearest driver: ${nearestDriver.driver.user.name} (${nearestDriver.driver.userId}) - Distance: ${nearestDriver.distance.toFixed(2)}km`
      );
      return nearestDriver.driver.userId;
    }

    // Fallback: If no location provided, return first available driver
    const selectedDriver = availableDrivers[0];
    console.warn(
      `✅ Selected driver (no location provided): ${selectedDriver.user.name} (${selectedDriver.userId})`
    );
    return selectedDriver.userId;
  } catch (error) {
    console.error('Error finding nearest driver:', error);
    return null;
  }
}

/**
 * Auto-assign driver to a delivery
 * Called when restaurant accepts an order
 */
export async function autoAssignDriver(orderId: string): Promise<boolean> {
  try {
    console.warn(`🔍 Auto-assigning driver for order ${orderId}...`);

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
      console.warn('❌ Order or delivery not found');
      return false;
    }

    if (order.delivery.driverId) {
      console.warn('✅ Driver already assigned');
      return true;
    }

    // Find nearest available driver
    const driverId = await findNearestDriver({
      restaurantLat: order.restaurant.latitude,
      restaurantLon: order.restaurant.longitude,
      maxDistance: 15, // 15km radius
    });

    if (!driverId) {
      console.warn('⚠️ No drivers available - delivery will remain in FINDING_DRIVER status');
      return false;
    }

    // Assign driver to delivery
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
          title: 'มีงานใหม่!',
          message: `คุณได้รับงานส่งอาหารจาก ${order.restaurant.name}`,
        },
      });

      // Create notification for customer
      await tx.notification.create({
        data: {
          userId: order.customerId,
          orderId,
          type: NotificationType.SYSTEM,
          title: 'พบไรเดอร์แล้ว!',
          message: `ไรเดอร์กำลังเดินทางไปรับอาหารจากร้าน ${order.restaurant.name}`,
        },
      });
    });

    console.warn(`✅ Driver assigned successfully: ${driverId}`);
    return true;
  } catch (error) {
    console.error('Error auto-assigning driver:', error);
    return false;
  }
}
