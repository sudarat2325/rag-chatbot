import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import type { ApiResponse } from '@/lib/types';
import { DeliveryStatus, OrderStatus, Prisma, NotificationType } from '@prisma/client';
import { cache, CacheKeys, CacheTTL } from '@/lib/cache/cache';
import logger from '@/lib/logger/winston';
import { PerformanceMonitor } from '@/lib/logger/errorHandler';

const emitters = globalThis as typeof globalThis & {
  emitOrderUpdate?: (orderId: string, status: string, payload?: unknown) => void;
};

// GET /api/orders/[orderId] - Get single order
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ orderId: string }> }
) {
  const monitor = new PerformanceMonitor('GET /api/orders/[orderId]');

  try {
    const { orderId } = await params;
    const searchParams = request.nextUrl.searchParams;
    const userId = searchParams.get('userId');

    // Fetch order with all related data including restaurant owner info
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        restaurant: {
          select: {
            id: true,
            name: true,
            logo: true,
            phone: true,
            ownerId: true, // Need this for authorization check
            latitude: true,
            longitude: true,
          },
        },
        address: true,
        items: {
          include: {
            menuItem: {
              select: {
                name: true,
                image: true,
                category: true,
              },
            },
          },
        },
        delivery: {
          include: {
            driver: {
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

    if (!order) {
      return NextResponse.json(
        {
          success: false,
          error: 'Order not found',
        } as ApiResponse,
        { status: 404 }
      );
    }

    // Authorization check: Only allow access if user is:
    // 1. The customer who placed the order
    // 2. The restaurant owner
    // 3. The assigned driver
    if (userId) {
      const isCustomer = order.customerId === userId;
      const isRestaurantOwner = order.restaurant.ownerId === userId;
      const isDriver = order.delivery?.driver?.id === userId;

      if (!isCustomer && !isRestaurantOwner && !isDriver) {
        return NextResponse.json(
          {
            success: false,
            error: 'Unauthorized: You do not have permission to view this order',
          } as ApiResponse,
          { status: 403 }
        );
      }
    }

    const response: ApiResponse = {
      success: true,
      data: order,
    };

    monitor.end({ orderId: order.id });
    return NextResponse.json(response);
  } catch (error) {
    logger.error('Error fetching order', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    });
    const response: ApiResponse = {
      success: false,
      error: 'Failed to fetch order',
    };
    return NextResponse.json(response, { status: 500 });
  }
}

// PATCH /api/orders/[orderId] - Update order status
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ orderId: string }> }
) {
  try {
    const { orderId } = await params;
    const body = (await request.json()) as { status?: OrderStatus; userId?: string };
    const { status, userId } = body;

    if (!status) {
      return NextResponse.json(
        {
          success: false,
          error: 'Status is required',
        } as ApiResponse,
        { status: 400 }
      );
    }

    // Valid status values
    const validStatuses = Object.values(OrderStatus);

    if (!validStatuses.includes(status)) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid status value',
        } as ApiResponse,
        { status: 400 }
      );
    }

    // Get current order with restaurant and delivery info for authorization
    const currentOrder = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        restaurant: { select: { name: true, ownerId: true } },
        delivery: { select: { driverId: true } },
      },
    });

    if (!currentOrder) {
      return NextResponse.json(
        {
          success: false,
          error: 'Order not found',
        } as ApiResponse,
        { status: 404 }
      );
    }

    // Authorization check: Only restaurant owners and drivers can update order status
    if (userId) {
      const isRestaurantOwner = currentOrder.restaurant.ownerId === userId;
      const isDriver = currentOrder.delivery?.driverId === userId;

      if (!isRestaurantOwner && !isDriver) {
        return NextResponse.json(
          {
            success: false,
            error: 'Unauthorized: Only restaurant owners and drivers can update order status',
          } as ApiResponse,
          { status: 403 }
        );
      }
    }

    // Prepare update data with timestamps
    const updateData: Prisma.OrderUpdateInput = {
      status,
    };

    // Set appropriate timestamp based on status
    switch (status) {
      case 'ACCEPTED':
        updateData.acceptedAt = new Date();
        break;
      case 'PREPARING':
        updateData.preparingAt = new Date();
        break;
      case 'READY':
        updateData.readyAt = new Date();
        break;
      case 'PICKED_UP':
        updateData.pickedUpAt = new Date();
        break;
      case 'DELIVERED':
        updateData.deliveredAt = new Date();
        updateData.paymentStatus = 'PAID'; // Auto mark as paid when delivered
        break;
      case 'CANCELLED':
        updateData.cancelledAt = new Date();
        break;
    }

    // Update order
    const updatedOrder = await prisma.order.update({
      where: { id: orderId },
      data: updateData,
      include: {
        restaurant: {
          select: {
            id: true,
            name: true,
            phone: true,
          },
        },
        items: {
          include: {
            menuItem: true,
          },
        },
      },
    });

    // Update delivery status if exists
    if (status === 'READY' || status === 'PICKED_UP' || status === 'DELIVERED') {
      let deliveryStatus: DeliveryStatus | null = null;

      if (status === 'READY') {
        deliveryStatus = currentOrder.delivery?.driverId ? DeliveryStatus.DRIVER_ASSIGNED : DeliveryStatus.FINDING_DRIVER;
      } else if (status === 'PICKED_UP') {
        deliveryStatus = DeliveryStatus.ON_THE_WAY;
      } else if (status === 'DELIVERED') {
        deliveryStatus = DeliveryStatus.DELIVERED;
      }

      if (deliveryStatus) {
        await prisma.delivery.updateMany({
          where: { orderId },
          data: { status: deliveryStatus },
        });
      }
    }

    // Create notification for customer with proper NotificationType
    const statusNotifications: Partial<
      Record<OrderStatus, { type: NotificationType; title: string; message: string }>
    > = {
      ACCEPTED: {
        type: NotificationType.ORDER_ACCEPTED,
        title: 'ร้านยืนยันคำสั่งซื้อแล้ว',
        message: `ร้าน ${currentOrder.restaurant.name} ยืนยันออเดอร์ ${currentOrder.orderNumber} แล้ว`,
      },
      PREPARING: {
        type: NotificationType.ORDER_PREPARING,
        title: 'กำลังเตรียมอาหาร',
        message: `ร้าน ${currentOrder.restaurant.name} กำลังเตรียมอาหารของคุณ`,
      },
      READY: {
        type: NotificationType.ORDER_READY,
        title: 'อาหารพร้อมแล้ว',
        message: `อาหารของคุณพร้อมส่งแล้ว กำลังรอไรเดอร์มารับ`,
      },
      PICKED_UP: {
        type: NotificationType.ORDER_PICKED_UP,
        title: 'ไรเดอร์กำลังนำส่ง',
        message: `ไรเดอร์รับอาหารแล้ว กำลังเดินทางมาส่งให้คุณ`,
      },
      ON_THE_WAY: {
        type: NotificationType.ORDER_ON_THE_WAY,
        title: 'กำลังจัดส่ง',
        message: `ไรเดอร์กำลังนำส่งออเดอร์ ${currentOrder.orderNumber} ของคุณ`,
      },
      DELIVERED: {
        type: NotificationType.ORDER_DELIVERED,
        title: 'จัดส่งสำเร็จ',
        message: `ออเดอร์ ${currentOrder.orderNumber} จัดส่งสำเร็จแล้ว ขอบคุณที่ใช้บริการ`,
      },
      CANCELLED: {
        type: NotificationType.ORDER_CANCELLED,
        title: 'ยกเลิกออเดอร์',
        message: `ออเดอร์ ${currentOrder.orderNumber} ถูกยกเลิกแล้ว`,
      },
      REJECTED: {
        type: NotificationType.ORDER_CANCELLED,
        title: 'ร้านปฏิเสธออเดอร์',
        message: `ร้าน ${currentOrder.restaurant.name} ไม่สามารถรับออเดอร์ ${currentOrder.orderNumber} ได้`,
      },
    };

    if (statusNotifications[status]) {
      await prisma.notification.create({
        data: {
          userId: currentOrder.customerId,
          orderId: currentOrder.id,
          type: statusNotifications[status].type,
          title: statusNotifications[status].title,
          message: statusNotifications[status].message,
        },
      });
    }

    // Invalidate order caches
    await cache.clear('orders:*');
    logger.info('Order status updated, cache invalidated', {
      orderId,
      status,
      orderNumber: currentOrder.orderNumber
    });

    // Emit Socket.IO event for real-time updates
    try {
      emitters.emitOrderUpdate?.(orderId, status, updatedOrder);
    } catch (socketError) {
      logger.error('Failed to emit Socket.IO event', {
        error: socketError instanceof Error ? socketError.message : String(socketError),
      });
    }

    const response: ApiResponse = {
      success: true,
      data: updatedOrder,
      message: 'Order status updated successfully',
    };

    return NextResponse.json(response);
  } catch (error) {
    logger.error('Error updating order', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    });
    const response: ApiResponse = {
      success: false,
      error: 'Failed to update order',
    };
    return NextResponse.json(response, { status: 500 });
  }
}

// DELETE /api/orders/[orderId] - Delete order (Admin only)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ orderId: string }> }
) {
  try {
    const { orderId } = await params;

    // Check if order exists
    const order = await prisma.order.findUnique({
      where: { id: orderId },
    });

    if (!order) {
      return NextResponse.json(
        {
          success: false,
          error: 'Order not found',
        } as ApiResponse,
        { status: 404 }
      );
    }

    // Delete related records first (using transaction for consistency)
    await prisma.$transaction([
      // Delete order items
      prisma.orderItem.deleteMany({
        where: { orderId },
      }),
      // Delete delivery
      prisma.delivery.deleteMany({
        where: { orderId },
      }),
      // Delete notifications
      prisma.notification.deleteMany({
        where: { orderId },
      }),
      // Delete chat messages
      prisma.chatMessage.deleteMany({
        where: { orderId },
      }),
      // Delete the order itself
      prisma.order.delete({
        where: { id: orderId },
      }),
    ]);

    // Invalidate order caches
    await cache.clear('orders:*');
    logger.info('Order deleted, cache invalidated', { orderId });

    const response: ApiResponse = {
      success: true,
      message: 'Order deleted successfully',
    };

    return NextResponse.json(response);
  } catch (error) {
    logger.error('Error deleting order', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    });
    const response: ApiResponse = {
      success: false,
      error: 'Failed to delete order',
    };
    return NextResponse.json(response, { status: 500 });
  }
}
