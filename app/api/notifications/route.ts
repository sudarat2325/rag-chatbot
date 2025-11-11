import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import type { ApiResponse } from '@/lib/types';
import { sendPushNotification } from '@/lib/services/notificationService';
import { Prisma, NotificationType } from '@prisma/client';

interface CreateNotificationBody {
  userId: string;
  orderId?: string;
  type: NotificationType;
  title: string;
  message: string;
}

interface UpdateNotificationBody {
  notificationIds?: string[];
  notificationId?: string;
  userId?: string;
  markAllRead?: boolean;
}

// GET /api/notifications - Get user notifications
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const userId = searchParams.get('userId');
    const unreadOnly = searchParams.get('unreadOnly') === 'true';
    const limit = parseInt(searchParams.get('limit') || '50');

    if (!userId) {
      return NextResponse.json(
        {
          success: false,
          error: 'userId is required',
        } as ApiResponse,
        { status: 400 }
      );
    }

    const where: Prisma.NotificationWhereInput = { userId };

    if (unreadOnly) {
      where.isRead = false;
    }

    const notifications = await prisma.notification.findMany({
      where,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        order: {
          select: {
            orderNumber: true,
            status: true,
          },
        },
      },
    });

    // Get unread count
    const unreadCount = await prisma.notification.count({
      where: {
        userId,
        isRead: false,
      },
    });

    const response: ApiResponse = {
      success: true,
      data: {
        notifications,
        unreadCount,
      },
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error fetching notifications:', error);
    const response: ApiResponse = {
      success: false,
      error: 'Failed to fetch notifications',
    };
    return NextResponse.json(response, { status: 500 });
  }
}

// POST /api/notifications - Create notification (internal use)
export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as CreateNotificationBody;
    const { userId, orderId, type, title, message } = body;

    if (!userId || !type || !title || !message) {
      return NextResponse.json(
        {
          success: false,
          error: 'Missing required fields',
        } as ApiResponse,
        { status: 400 }
      );
    }

    const notification = await prisma.notification.create({
      data: {
        userId,
        orderId,
        type,
        title,
        message,
      },
    });

    // Send push notification if user has push subscriptions
    try {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { pushSubscription: true },
      });

      if (user?.pushSubscription) {
        await sendPushNotification(user.pushSubscription, {
          title,
          message,
          data: {
            notificationId: notification.id,
            orderId,
            type,
          },
        });
      } else {
        console.warn(`📱 No push subscription for user ${userId}`);
      }
    } catch (pushError) {
      // Log error but don't fail the notification creation
      console.error('Failed to send push notification:', pushError);
    }

    // Emit Socket.IO event for real-time notification
    try {
      const emitUserNotification = (
        globalThis as typeof globalThis & {
          emitUserNotification?: (
            userId: string,
            notification: Record<string, unknown>
          ) => void;
        }
      ).emitUserNotification;

      if (emitUserNotification) {
        emitUserNotification(userId, {
          id: notification.id,
          type,
          title,
          message,
          data: { orderId },
        });
      }
    } catch (socketError) {
      console.error('Failed to emit Socket.IO event:', socketError);
    }

    const response: ApiResponse = {
      success: true,
      data: notification,
    };

    return NextResponse.json(response, { status: 201 });
  } catch (error) {
    console.error('Error creating notification:', error);
    const response: ApiResponse = {
      success: false,
      error: 'Failed to create notification',
    };
    return NextResponse.json(response, { status: 500 });
  }
}

// PATCH /api/notifications - Mark notifications as read
export async function PATCH(request: NextRequest) {
  try {
    const { notificationIds, notificationId, userId, markAllRead } =
      (await request.json()) as UpdateNotificationBody;

    if (markAllRead && userId) {
      // Mark all notifications as read for user
      await prisma.notification.updateMany({
        where: { userId },
        data: { isRead: true },
      });
    } else if (notificationId) {
      // Mark single notification as read
      await prisma.notification.update({
        where: { id: notificationId },
        data: { isRead: true },
      });
    } else if (notificationIds && Array.isArray(notificationIds)) {
      // Mark specific notifications as read
      await prisma.notification.updateMany({
        where: {
          id: { in: notificationIds },
        },
        data: { isRead: true },
      });
    } else {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid request',
        } as ApiResponse,
        { status: 400 }
      );
    }

    const response: ApiResponse = {
      success: true,
      message: 'Notifications marked as read',
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error updating notifications:', error);
    const response: ApiResponse = {
      success: false,
      error: 'Failed to update notifications',
    };
    return NextResponse.json(response, { status: 500 });
  }
}

// DELETE /api/notifications - Delete notification
export async function DELETE(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const notificationId = searchParams.get('notificationId');

    if (!notificationId) {
      return NextResponse.json(
        {
          success: false,
          error: 'notificationId is required',
        } as ApiResponse,
        { status: 400 }
      );
    }

    await prisma.notification.delete({
      where: { id: notificationId },
    });

    const response: ApiResponse = {
      success: true,
      message: 'Notification deleted',
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error deleting notification:', error);
    const response: ApiResponse = {
      success: false,
      error: 'Failed to delete notification',
    };
    return NextResponse.json(response, { status: 500 });
  }
}
