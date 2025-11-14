import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import type { ApiResponse } from '@/lib/types';
import { Prisma, OrderStatus, NotificationType } from '@prisma/client';

const MAX_TX_RETRIES = 3;
const BACKOFF_MS = 150;

const wait = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// PATCH /api/deliveries/[id] - Update delivery status
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
        {
          success: false,
          error: 'Delivery not found',
        } as ApiResponse,
        { status: 404 }
      );
    }

    const updateData: Prisma.DeliveryUpdateInput = {};

    // Update location if provided
    if (latitude !== undefined && longitude !== undefined) {
      updateData.currentLatitude = latitude;
      updateData.currentLongitude = longitude;
    }

    // Update status if provided
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
          {
            success: false,
            error: 'Invalid status',
          } as ApiResponse,
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

    // Location-only updates can skip transaction to avoid frequent write conflicts
    if (!status) {
      const updatedLocationDelivery = await prisma.delivery.update({
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

      return NextResponse.json({
        success: true,
        data: updatedLocationDelivery,
        message: 'Delivery updated successfully',
      });
    }

    // Update delivery with transaction (retry on write conflict)
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

          // Update order status based on delivery status
          if (status) {
            let orderStatus: OrderStatus | undefined;
            let notificationData: { type: NotificationType; title: string; message: string } | null = null;

            switch (status) {
              case 'DRIVER_ARRIVED':
                orderStatus = OrderStatus.READY;
                notificationData = {
                  type: NotificationType.ORDER_READY,
                  title: 'ไรเดอร์ถึงร้านแล้ว',
                  message: `ไรเดอร์ถึงร้าน ${currentDelivery.order.restaurant.name} แล้ว กำลังรอรับอาหาร`,
                };
                break;

              case 'DELIVERED':
                orderStatus = OrderStatus.DELIVERED;
                notificationData = {
                  type: NotificationType.ORDER_DELIVERED,
                  title: 'จัดส่งสำเร็จ',
                  message: `ออเดอร์ ${currentDelivery.order.orderNumber} จัดส่งสำเร็จแล้ว ขอบคุณที่ใช้บริการ`,
                };
                // Mark driver as available again
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
                  title: 'จัดส่งไม่สำเร็จ',
                  message: 'ขออภัย การจัดส่งไม่สำเร็จ กรุณาติดต่อฝ่ายบริการลูกค้า',
                };
                // Mark driver as available again
                if (currentDelivery.driverId) {
                  await tx.driverProfile.update({
                    where: { userId: currentDelivery.driverId },
                    data: { isAvailable: true },
                  });
                }
                break;
            }

            if (orderStatus) {
              await tx.order.update({
                where: { id: currentDelivery.orderId },
                data: { status: orderStatus },
              });
            }

            // Create notification for customer
            if (notificationData) {
              await tx.notification.create({
                data: {
                  userId: currentDelivery.order.customerId,
                  orderId: currentDelivery.orderId,
                  type: notificationData.type,
                  title: notificationData.title,
                  message: notificationData.message,
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
          await wait(BACKOFF_MS * attempt);
          continue;
        }
        throw error;
      }
    }

    // Emit Socket.IO events for real-time updates
    try {
      const emitOrderUpdate = (
        globalThis as {
          emitOrderUpdate?: (orderId: string, status: string, payload?: unknown) => void;
          emitLocationUpdate?: (
            orderId: string,
            location: { latitude: number; longitude: number }
          ) => void;
        }
      ).emitOrderUpdate;
      const emitLocationUpdate = (
        globalThis as {
          emitOrderUpdate?: (orderId: string, status: string, payload?: unknown) => void;
          emitLocationUpdate?: (
            orderId: string,
            location: { latitude: number; longitude: number }
          ) => void;
        }
      ).emitLocationUpdate;

      if (status && emitOrderUpdate && updatedDelivery) {
        emitOrderUpdate(currentDelivery.orderId, status, updatedDelivery.order);
      }

      if (latitude !== undefined && longitude !== undefined && emitLocationUpdate) {
        emitLocationUpdate(currentDelivery.orderId, { latitude, longitude });
      }
    } catch (socketError) {
      console.error('Failed to emit Socket.IO events:', socketError);
    }

    const response: ApiResponse = {
      success: true,
      data: updatedDelivery,
      message: 'Delivery updated successfully',
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error updating delivery:', error);
    const response: ApiResponse = {
      success: false,
      error: 'Failed to update delivery',
    };
    return NextResponse.json(response, { status: 500 });
  }
}
