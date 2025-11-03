import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import type { ApiResponse } from '@/lib/types';

// PATCH /api/orders/[id]/status - Update order status
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { status, userId } = await request.json();

    if (!status) {
      return NextResponse.json(
        {
          success: false,
          error: 'Status is required',
        } as ApiResponse,
        { status: 400 }
      );
    }

    // Get order
    const order = await prisma.order.findUnique({
      where: { id },
      include: {
        restaurant: true,
        customer: true,
        delivery: true,
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

    // Update order with timestamp based on status
    const updateData: any = { status };
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
        updateData.paymentStatus = 'PAID'; // Auto-mark as paid on delivery
        break;
      case 'CANCELLED':
        updateData.cancelledAt = now;
        break;
    }

    // Update order in transaction
    const updatedOrder = await prisma.$transaction(async (tx) => {
      const updated = await tx.order.update({
        where: { id },
        data: updateData,
      });

      // Update delivery status if needed
      if (order.delivery) {
        let deliveryStatus = order.delivery.status;

        switch (status) {
          case 'READY':
            deliveryStatus = 'FINDING_DRIVER';
            break;
          case 'PICKED_UP':
            deliveryStatus = 'PICKED_UP';
            await tx.delivery.update({
              where: { id: order.delivery.id },
              data: {
                status: deliveryStatus,
                pickedUpAt: now,
              },
            });
            break;
          case 'ON_THE_WAY':
            deliveryStatus = 'ON_THE_WAY';
            await tx.delivery.update({
              where: { id: order.delivery.id },
              data: { status: deliveryStatus },
            });
            break;
          case 'DELIVERED':
            deliveryStatus = 'DELIVERED';
            await tx.delivery.update({
              where: { id: order.delivery.id },
              data: {
                status: deliveryStatus,
                deliveredAt: now,
              },
            });
            break;
        }
      }

      // Create notification for customer
      const notificationMap: Record<string, { title: string; message: string }> = {
        ACCEPTED: {
          title: 'ร้านรับออเดอร์แล้ว',
          message: `ร้าน ${order.restaurant.name} รับออเดอร์ ${order.orderNumber} แล้ว`,
        },
        PREPARING: {
          title: 'กำลังเตรียมอาหาร',
          message: `ร้านกำลังเตรียมอาหารให้คุณ`,
        },
        READY: {
          title: 'อาหารพร้อมแล้ว',
          message: `อาหารของคุณพร้อมส่งแล้ว รอคนส่งมารับ`,
        },
        PICKED_UP: {
          title: 'คนส่งรับอาหารแล้ว',
          message: `คนส่งรับอาหารจากร้านแล้ว กำลังเดินทางไปหาคุณ`,
        },
        ON_THE_WAY: {
          title: 'กำลังส่งอาหาร',
          message: `คนส่งกำลังเดินทางไปส่งอาหารให้คุณ`,
        },
        DELIVERED: {
          title: 'ส่งเรียบร้อย',
          message: `อาหารส่งถึงแล้ว ขอบคุณที่ใช้บริการ`,
        },
        CANCELLED: {
          title: 'ยกเลิกออเดอร์',
          message: `ออเดอร์ ${order.orderNumber} ถูกยกเลิกแล้ว`,
        },
        REJECTED: {
          title: 'ร้านปฏิเสธออเดอร์',
          message: `ขออภัย ร้าน ${order.restaurant.name} ไม่สามารถรับออเดอร์ได้ในขณะนี้`,
        },
      };

      if (notificationMap[status]) {
        await tx.notification.create({
          data: {
            userId: order.customerId,
            orderId: order.id,
            type: status as any,
            title: notificationMap[status].title,
            message: notificationMap[status].message,
          },
        });
      }

      return updated;
    });

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
