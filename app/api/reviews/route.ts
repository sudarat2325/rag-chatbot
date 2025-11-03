import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import type { ApiResponse } from '@/lib/types';

// GET /api/reviews - Get reviews
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const restaurantId = searchParams.get('restaurantId');
    const customerId = searchParams.get('customerId');
    const limit = parseInt(searchParams.get('limit') || '20');

    const where: any = {};

    if (restaurantId) {
      where.restaurantId = restaurantId;
    }

    if (customerId) {
      where.customerId = customerId;
    }

    const reviews = await prisma.review.findMany({
      where,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        customer: {
          select: {
            name: true,
            avatar: true,
          },
        },
        restaurant: {
          select: {
            name: true,
            logo: true,
          },
        },
        order: {
          select: {
            orderNumber: true,
          },
        },
      },
    });

    const response: ApiResponse = {
      success: true,
      data: reviews,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error fetching reviews:', error);
    const response: ApiResponse = {
      success: false,
      error: 'Failed to fetch reviews',
    };
    return NextResponse.json(response, { status: 500 });
  }
}

// POST /api/reviews - Create review
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      orderId,
      customerId,
      restaurantId,
      foodRating,
      deliveryRating,
      comment,
      images,
    } = body;

    // Validate required fields
    if (!orderId || !customerId || !restaurantId || !foodRating || !deliveryRating) {
      return NextResponse.json(
        {
          success: false,
          error: 'Missing required fields',
        } as ApiResponse,
        { status: 400 }
      );
    }

    // Validate ratings are between 1-5
    if (
      foodRating < 1 ||
      foodRating > 5 ||
      deliveryRating < 1 ||
      deliveryRating > 5
    ) {
      return NextResponse.json(
        {
          success: false,
          error: 'Ratings must be between 1 and 5',
        } as ApiResponse,
        { status: 400 }
      );
    }

    // Check if order exists and belongs to customer
    const order = await prisma.order.findUnique({
      where: { id: orderId },
    });

    if (!order || order.customerId !== customerId) {
      return NextResponse.json(
        {
          success: false,
          error: 'Order not found or does not belong to customer',
        } as ApiResponse,
        { status: 404 }
      );
    }

    // Check if order is delivered
    if (order.status !== 'DELIVERED') {
      return NextResponse.json(
        {
          success: false,
          error: 'Can only review delivered orders',
        } as ApiResponse,
        { status: 400 }
      );
    }

    // Check if review already exists
    const existingReview = await prisma.review.findUnique({
      where: { orderId },
    });

    if (existingReview) {
      return NextResponse.json(
        {
          success: false,
          error: 'Review already exists for this order',
        } as ApiResponse,
        { status: 400 }
      );
    }

    // Calculate overall rating
    const overallRating = Math.round((foodRating + deliveryRating) / 2);

    // Create review and update restaurant stats in transaction
    const review = await prisma.$transaction(async (tx) => {
      const newReview = await tx.review.create({
        data: {
          orderId,
          customerId,
          restaurantId,
          foodRating,
          deliveryRating,
          overallRating,
          comment,
          images: images ? JSON.stringify(images) : null,
        },
      });

      // Update restaurant rating
      const restaurant = await tx.restaurant.findUnique({
        where: { id: restaurantId },
        select: {
          rating: true,
          totalReviews: true,
        },
      });

      if (restaurant) {
        const newTotalReviews = restaurant.totalReviews + 1;
        const newRating =
          (restaurant.rating * restaurant.totalReviews + overallRating) /
          newTotalReviews;

        await tx.restaurant.update({
          where: { id: restaurantId },
          data: {
            rating: Math.round(newRating * 10) / 10, // Round to 1 decimal
            totalReviews: newTotalReviews,
          },
        });
      }

      return newReview;
    });

    const response: ApiResponse = {
      success: true,
      data: review,
      message: 'Review created successfully',
    };

    return NextResponse.json(response, { status: 201 });
  } catch (error) {
    console.error('Error creating review:', error);
    const response: ApiResponse = {
      success: false,
      error: 'Failed to create review',
    };
    return NextResponse.json(response, { status: 500 });
  }
}
