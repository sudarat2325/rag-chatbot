import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import type { ApiResponse } from '@/lib/types';
import { OrderStatus, PaymentStatus, Prisma, NotificationType } from '@prisma/client';

const emitters = globalThis as typeof globalThis & {
  emitOrderUpdate?: (orderId: string, status: string, payload?: unknown) => void;
  emitUserNotification?: (
    userId: string,
    notification: { type: string; title: string; message: string; data?: Record<string, unknown> }
  ) => void;
};

/**
 * PATCH /api/orders/[orderId]/status
 * Update order status and send notifications
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ orderId: string }> }
) {
  try {
    const { orderId } = await params;
    const { status } = (await request.json()) as { status?: OrderStatus };

    if (!status) {
      return NextResponse.json(
        {
          success: false,
          error: 'Status is required',
        } as ApiResponse,
        { status: 400 }
      );
    }

    // Get order with details
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        customer: true,
        restaurant: true,
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

    // Update order status and timestamp
    const updateData: Prisma.OrderUpdateInput = { status };
    const now = new Date();

    switch (status) {
      case 'ACCEPTED':
        updateData.acceptedAt = now;
        break;
      case 'PREPARING':
        updateData.preparingAt = now;
        break;
      case 'READY':
        updateData.readyAt = now;
        break;
      case 'PICKED_UP':
        updateData.pickedUpAt = now;
        break;
      case 'DELIVERED':
        updateData.deliveredAt = now;
        updateData.paymentStatus = PaymentStatus.PAID; // Auto-mark as paid on delivery
        break;
      case 'CANCELLED':
      case 'REJECTED':
        updateData.cancelledAt = now;
        break;
    }

    const updatedOrder = await prisma.order.update({
      where: { id: orderId },
      data: updateData,
      include: {
        customer: true,
        restaurant: true,
        delivery: true,
      },
    });

    // Create notification for customer
    const notificationMessages: Partial<
      Record<OrderStatus, { title: string; message: string }>
    > = {
      ACCEPTED: {
        title: 'ร้านรับออเดอร์แล้ว',
        message: `ร้าน ${order.restaurant.name} รับออเดอร์ของคุณแล้ว กำลังเตรียมอาหาร`,
      },
      PREPARING: {
        title: 'กำลังเตรียมอาหาร',
        message: `ร้าน ${order.restaurant.name} กำลังเตรียมอาหารของคุณ`,
      },
      READY: {
        title: 'อาหารพร้อมแล้ว',
        message: 'อาหารของคุณพร้อมส่งแล้ว กำลังรอคนขับมารับ',
      },
      PICKED_UP: {
        title: 'กำลังจัดส่ง',
        message: 'คนขับรับอาหารแล้ว กำลังจัดส่งถึงคุณ',
      },
      ON_THE_WAY: {
        title: 'กำลังเดินทาง',
        message: 'คนขับกำลังเดินทางมาส่งอาหารให้คุณ',
      },
      DELIVERED: {
        title: 'จัดส่งสำเร็จ',
        message: 'อาหารของคุณส่งถึงแล้ว ขอบคุณที่ใช้บริการ',
      },
      CANCELLED: {
        title: 'ยกเลิกออเดอร์',
        message: 'ออเดอร์ของคุณถูกยกเลิกแล้ว',
      },
      REJECTED: {
        title: 'ร้านปฏิเสธออเดอร์',
        message: `ร้าน ${order.restaurant.name} ไม่สามารถรับออเดอร์ได้ในขณะนี้`,
      },
    };

    const notificationContent = notificationMessages[status];

    if (notificationContent) {
      await prisma.notification.create({
        data: {
          userId: order.customerId,
          orderId: order.id,
          type: NotificationType[`ORDER_${status}` as keyof typeof NotificationType] || NotificationType.SYSTEM,
          title: notificationContent.title,
          message: notificationContent.message,
        },
      });
    }

    // Emit Socket.IO events for real-time updates
    try {
      emitters.emitOrderUpdate?.(orderId, status, updatedOrder);

      if (notificationContent) {
        emitters.emitUserNotification?.(order.customerId, {
          type: NotificationType[`ORDER_${status}` as keyof typeof NotificationType] || NotificationType.SYSTEM,
          title: notificationContent.title,
          message: notificationContent.message,
          data: { orderId, orderNumber: order.orderNumber },
        });
      }
    } catch (socketError) {
      console.error('❌ Failed to emit Socket.IO events:', socketError);
    }

    const response: ApiResponse = {
      success: true,
      data: updatedOrder,
      message: 'Order status updated successfully',
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error updating order status:', error);
    const response: ApiResponse = {
      success: false,
      error: 'Failed to update order status',
    };
    return NextResponse.json(response, { status: 500 });
  }
}
