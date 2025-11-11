import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import type { ApiResponse } from '@/lib/types';

/**
 * POST /api/push/subscribe
 * Subscribe user to push notifications
 */
export async function POST(request: NextRequest) {
  try {
    const { userId, subscription } = await request.json();

    if (!userId || !subscription) {
      return NextResponse.json(
        {
          success: false,
          error: 'Missing required fields',
        } as ApiResponse,
        { status: 400 }
      );
    }

    // Validate subscription object
    if (!subscription.endpoint || !subscription.keys) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid subscription object',
        } as ApiResponse,
        { status: 400 }
      );
    }

    // Save subscription to user
    const user = await prisma.user.update({
      where: { id: userId },
      data: {
        pushSubscription: JSON.stringify(subscription),
      },
      select: {
        id: true,
        name: true,
        email: true,
      },
    });

    console.warn(`✅ Push subscription saved for user ${userId}`);

    const response: ApiResponse = {
      success: true,
      data: user,
      message: 'Successfully subscribed to push notifications',
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error subscribing to push notifications:', error);
    const response: ApiResponse = {
      success: false,
      error: 'Failed to subscribe to push notifications',
    };
    return NextResponse.json(response, { status: 500 });
  }
}

/**
 * DELETE /api/push/subscribe
 * Unsubscribe user from push notifications
 */
export async function DELETE(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json(
        {
          success: false,
          error: 'userId is required',
        } as ApiResponse,
        { status: 400 }
      );
    }

    // Remove subscription from user
    await prisma.user.update({
      where: { id: userId },
      data: {
        pushSubscription: null,
      },
    });

    console.warn(`✅ Push subscription removed for user ${userId}`);

    const response: ApiResponse = {
      success: true,
      message: 'Successfully unsubscribed from push notifications',
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error unsubscribing from push notifications:', error);
    const response: ApiResponse = {
      success: false,
      error: 'Failed to unsubscribe from push notifications',
    };
    return NextResponse.json(response, { status: 500 });
  }
}
