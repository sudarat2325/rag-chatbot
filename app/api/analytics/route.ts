import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
}

// GET /api/analytics - Get analytics data for restaurant
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const restaurantId = searchParams.get('restaurantId');
    const period = searchParams.get('period') || '7d'; // 7d, 30d, 90d, 1y

    if (!restaurantId) {
      const response: ApiResponse = {
        success: false,
        error: 'restaurantId is required',
      };
      return NextResponse.json(response, { status: 400 });
    }

    // Calculate date range
    const now = new Date();
    let startDate = new Date();

    switch (period) {
      case '7d':
        startDate.setDate(now.getDate() - 7);
        break;
      case '30d':
        startDate.setDate(now.getDate() - 30);
        break;
      case '90d':
        startDate.setDate(now.getDate() - 90);
        break;
      case '1y':
        startDate.setFullYear(now.getFullYear() - 1);
        break;
      default:
        startDate.setDate(now.getDate() - 7);
    }

    // Get orders for the period
    const orders = await prisma.order.findMany({
      where: {
        restaurantId,
        createdAt: {
          gte: startDate,
        },
      },
      include: {
        items: {
          include: {
            menuItem: true,
          },
        },
        payments: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    // Calculate statistics
    const totalOrders = orders.length;
    const completedOrders = orders.filter((o) => o.status === 'DELIVERED').length;
    const cancelledOrders = orders.filter((o) => o.status === 'CANCELLED').length;
    const totalRevenue = orders
      .filter((o) => o.paymentStatus === 'PAID')
      .reduce((sum, o) => sum + o.total, 0);

    // Calculate daily revenue
    const dailyRevenue: { [key: string]: number } = {};
    orders
      .filter((o) => o.paymentStatus === 'PAID')
      .forEach((order) => {
        const date = order.createdAt.toISOString().split('T')[0];
        dailyRevenue[date] = (dailyRevenue[date] || 0) + order.total;
      });

    // Get top selling items
    const itemSales: { [key: string]: { name: string; quantity: number; revenue: number } } = {};
    orders
      .filter((o) => o.paymentStatus === 'PAID')
      .forEach((order) => {
        order.items.forEach((item) => {
          if (!itemSales[item.menuItemId]) {
            itemSales[item.menuItemId] = {
              name: item.menuItem.name,
              quantity: 0,
              revenue: 0,
            };
          }
          itemSales[item.menuItemId].quantity += item.quantity;
          itemSales[item.menuItemId].revenue += item.price * item.quantity;
        });
      });

    const topSellingItems = Object.entries(itemSales)
      .map(([id, data]) => ({ id, ...data }))
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 10);

    // Calculate order status distribution
    const statusDistribution = {
      PENDING: orders.filter((o) => o.status === 'PENDING').length,
      ACCEPTED: orders.filter((o) => o.status === 'ACCEPTED').length,
      PREPARING: orders.filter((o) => o.status === 'PREPARING').length,
      READY: orders.filter((o) => o.status === 'READY').length,
      PICKED_UP: orders.filter((o) => o.status === 'PICKED_UP').length,
      DELIVERED: orders.filter((o) => o.status === 'DELIVERED').length,
      CANCELLED: orders.filter((o) => o.status === 'CANCELLED').length,
    };

    // Calculate average order value
    const avgOrderValue = totalOrders > 0 ? totalRevenue / completedOrders : 0;

    // Get reviews statistics
    const reviews = await prisma.review.findMany({
      where: {
        restaurantId,
        createdAt: {
          gte: startDate,
        },
      },
    });

    const avgRating = reviews.length > 0
      ? reviews.reduce((sum, r) => sum + r.overallRating, 0) / reviews.length
      : 0;

    const response: ApiResponse = {
      success: true,
      data: {
        summary: {
          totalOrders,
          completedOrders,
          cancelledOrders,
          totalRevenue,
          avgOrderValue,
          avgRating: Math.round(avgRating * 10) / 10,
          totalReviews: reviews.length,
        },
        dailyRevenue: Object.entries(dailyRevenue)
          .map(([date, revenue]) => ({ date, revenue }))
          .sort((a, b) => a.date.localeCompare(b.date)),
        topSellingItems,
        statusDistribution,
        period,
        startDate: startDate.toISOString(),
        endDate: now.toISOString(),
      },
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error fetching analytics:', error);
    const response: ApiResponse = {
      success: false,
      error: 'Failed to fetch analytics',
    };
    return NextResponse.json(response, { status: 500 });
  }
}
