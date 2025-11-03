import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import type { ApiResponse } from '@/lib/types';

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

    const where: any = { userId };

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
    const body = await request.json();
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

    // TODO: Send push notification

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
    const { notificationIds, userId, markAllRead } = await request.json();

    if (markAllRead && userId) {
      // Mark all notifications as read for user
      await prisma.notification.updateMany({
        where: { userId },
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
