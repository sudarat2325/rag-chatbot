import 'dotenv/config';
import { PrismaClient, DeliveryStatus } from '@prisma/client';

const prisma = new PrismaClient();

async function createMissingDeliveries() {
  const ordersWithoutDelivery = await prisma.order.findMany({
    where: {
      status: 'READY',
      delivery: null,
    },
    include: {
      restaurant: {
        select: {
          id: true,
          latitude: true,
          longitude: true,
        },
      },
      address: {
        select: {
          id: true,
          latitude: true,
          longitude: true,
        },
      },
    },
  });

  for (const order of ordersWithoutDelivery) {
    await prisma.delivery.create({
      data: {
        orderId: order.id,
        status: DeliveryStatus.FINDING_DRIVER,
        pickupLatitude: order.restaurant.latitude,
        pickupLongitude: order.restaurant.longitude,
        deliveryLatitude: order.address.latitude,
        deliveryLongitude: order.address.longitude,
      },
    });
  }

  return ordersWithoutDelivery.length;
}

async function fixExistingDeliveries() {
  const resetToFinding = await prisma.delivery.updateMany({
    where: {
      order: { status: 'READY' },
      driverId: null,
      status: { not: DeliveryStatus.FINDING_DRIVER },
    },
    data: {
      status: DeliveryStatus.FINDING_DRIVER,
    },
  });

  const resetToAssigned = await prisma.delivery.updateMany({
    where: {
      order: { status: 'READY' },
      driverId: { not: null },
      status: { not: DeliveryStatus.DRIVER_ASSIGNED },
    },
    data: {
      status: DeliveryStatus.DRIVER_ASSIGNED,
    },
  });

  return {
    findingDriver: resetToFinding.count,
    driverAssigned: resetToAssigned.count,
  };
}

async function main() {
  try {
    console.log('🔍 Restoring READY orders into the driver queue...');

    const created = await createMissingDeliveries();
    const fixed = await fixExistingDeliveries();

    console.log(
      `✅ Done! Created ${created} deliveries, ` +
        `reset ${fixed.findingDriver} to FINDING_DRIVER, ` +
        `reset ${fixed.driverAssigned} to DRIVER_ASSIGNED.`
    );
  } catch (error) {
    console.error('❌ Failed to fix READY orders:', error);
    process.exitCode = 1;
  } finally {
    await prisma.$disconnect();
  }
}

main();
