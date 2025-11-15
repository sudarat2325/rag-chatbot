import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
}

// GET /api/admin/overview - Get system overview
export async function GET(request: NextRequest) {
  try {
    // Get counts
    const [
      totalUsers,
      totalRestaurants,
      totalOrders,
      totalReviews,
      pendingRestaurants,
      reportedReviews,
      activeDrivers,
      todayOrders,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.restaurant.count(),
      prisma.order.count(),
      prisma.review.count(),
      prisma.restaurant.count({
        where: { isActive: false },
      }),
      prisma.review.count({
        where: { isReported: true },
      }),
      prisma.user.count({
        where: {
          role: 'DRIVER',
          driverProfile: {
            some: {
              isAvailable: true,
            },
          },
        },
      }),
      prisma.order.count({
        where: {
          createdAt: {
            gte: new Date(new Date().setHours(0, 0, 0, 0)),
          },
        },
      }),
    ]);

    // Get total revenue
    const paidOrders = await prisma.order.findMany({
      where: { paymentStatus: 'PAID' },
      select: { total: true },
    });

    const totalRevenue = paidOrders.reduce((sum, order) => sum + order.total, 0);

    // Get recent activities
    const recentOrders = await prisma.order.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      include: {
        restaurant: {
          select: { name: true },
        },
        customer: {
          select: { name: true },
        },
      },
    });

    const recentUsers = await prisma.user.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
      },
    });

    const response: ApiResponse = {
      success: true,
      data: {
        stats: {
          totalUsers,
          totalRestaurants,
          totalOrders,
          totalReviews,
          totalRevenue,
          pendingRestaurants,
          reportedReviews,
          activeDrivers,
          todayOrders,
        },
        recentOrders: recentOrders.map((order) => ({
          id: order.id,
          orderNumber: order.orderNumber,
          restaurant: order.restaurant.name,
          customer: order.customer.name,
          total: order.total,
          status: order.status,
          createdAt: order.createdAt,
        })),
        recentUsers,
      },
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error fetching admin overview:', error);
    const response: ApiResponse = {
      success: false,
      error: 'Failed to fetch admin overview',
    };
    return NextResponse.json(response, { status: 500 });
  }
}
