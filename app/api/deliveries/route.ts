import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import type { ApiResponse } from '@/lib/types';
import { Prisma, DeliveryStatus, NotificationType } from '@prisma/client';
import logger from '@/lib/logger/winston';

// GET /api/deliveries - Get deliveries for driver
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const driverId = searchParams.get('driverId');
    const statusParam = searchParams.get('status');

    if (!driverId) {
      // Get available deliveries (no driver assigned yet)
      // Step 1: Get all deliveries without driver
      const deliveries = await prisma.delivery.findMany({
        where: {
          status: 'FINDING_DRIVER',
          // Note: Don't filter by driverId here as MongoDB documents may not have the field
        },
        include: {
          order: {
            include: {
              restaurant: {
                select: {
                  id: true,
                  ownerId: true,
                  name: true,
                  logo: true,
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
        take: 20, // Get more, then filter
      });

      // Step 2: Filter by order status in code
      logger.info('Found deliveries matching criteria', { count: deliveries.length });
      deliveries.forEach((d, i) => {
        logger.info(`Delivery ${i}`, {
          id: d.id,
          orderId: d.orderId,
          status: d.status,
          hasOrder: !!d.order,
          orderStatus: d.order?.status || 'NO_ORDER',
        });
      });

      const availableDeliveries = deliveries.filter((delivery) => {
        // Exclude deliveries already assigned to a driver
        if (delivery.driverId) {
          return false;
        }
        if (!delivery.order) {
          console.warn('⚠️ Delivery without order:', delivery.id);
          return false;
        }
        const orderStatus = delivery.order.status;
        // Only show orders that are READY (food is ready for pickup)
        // Don't show ACCEPTED or PREPARING (restaurant still preparing)
        return orderStatus === 'READY';
      }).slice(0, 10); // Take first 10

      logger.info('Available deliveries after READY filter', {
        count: availableDeliveries.length,
      });

      const response: ApiResponse = {
        success: true,
        data: availableDeliveries,
      };

      return NextResponse.json(response);
    }

    // Get deliveries for specific driver
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
                logo: true,
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

    const response: ApiResponse = {
      success: true,
      data: deliveries,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error fetching deliveries:', error);
    const response: ApiResponse = {
      success: false,
      error: 'Failed to fetch deliveries',
    };
    return NextResponse.json(response, { status: 500 });
  }
}

// POST /api/deliveries - Accept/assign delivery to driver
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { deliveryId, driverId } = body;

    if (!deliveryId || !driverId) {
      return NextResponse.json(
        {
          success: false,
          error: 'Missing required fields',
        } as ApiResponse,
        { status: 400 }
      );
    }

    // Check if delivery exists and is available
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
        {
          success: false,
          error: 'Delivery not found',
        } as ApiResponse,
        { status: 404 }
      );
    }

    if (delivery.driverId) {
      return NextResponse.json(
        {
          success: false,
          error: 'Delivery already assigned to another driver',
        } as ApiResponse,
        { status: 400 }
      );
    }

    // Check if order status is READY (food must be ready for pickup)
    if (!delivery.order || delivery.order.status !== 'READY') {
      return NextResponse.json(
        {
          success: false,
          error: 'Order is not ready for pickup. Restaurant may have changed the status.',
        } as ApiResponse,
        { status: 400 }
      );
    }

    // Check if driver is online and available
    const driverProfile = await prisma.driverProfile.findUnique({
      where: { userId: driverId },
    });

    if (!driverProfile || !driverProfile.isOnline || !driverProfile.isAvailable) {
      return NextResponse.json(
        {
          success: false,
          error: 'Driver is not available',
        } as ApiResponse,
        { status: 400 }
      );
    }

    // Assign delivery to driver
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
                  logo: true,
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

      // Create notification for customer
      await tx.notification.create({
        data: {
          userId: delivery.order.customerId,
          orderId: delivery.orderId,
          type: NotificationType.SYSTEM,
          title: 'พบไรเดอร์แล้ว!',
          message: `ไรเดอร์กำลังเดินทางไปรับอาหารจากร้าน ${delivery.order.restaurant.name}`,
        },
      });

      // Update driver profile
      await tx.driverProfile.update({
        where: { userId: driverId },
        data: { isAvailable: false },
      });

      return updated;
    });

    // Emit Socket.IO events
    try {
      const emitOrderUpdate = (
        globalThis as {
          emitOrderUpdate?: (orderId: string, status: string, payload?: unknown) => void;
        }
      ).emitOrderUpdate;
      if (emitOrderUpdate) {
        emitOrderUpdate(delivery.orderId, 'READY', updatedDelivery.order);
      }
    } catch (socketError) {
      console.error('Failed to emit Socket.IO event:', socketError);
    }

    const response: ApiResponse = {
      success: true,
      data: updatedDelivery,
      message: 'Delivery assigned successfully',
    };

    return NextResponse.json(response, { status: 201 });
  } catch (error) {
    console.error('Error assigning delivery:', error);
    const response: ApiResponse = {
      success: false,
      error: 'Failed to assign delivery',
    };
    return NextResponse.json(response, { status: 500 });
  }
}
