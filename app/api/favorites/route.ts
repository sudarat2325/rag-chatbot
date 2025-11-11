import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import type { ApiResponse } from '@/lib/types';

// GET /api/favorites - Get user's favorite restaurants
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json(
        {
          success: false,
          error: 'User ID is required',
        } as ApiResponse,
        { status: 400 }
      );
    }

    const favorites = await prisma.favorite.findMany({
      where: { userId },
      include: {
        restaurant: {
          select: {
            id: true,
            name: true,
            description: true,
            logo: true,
            coverImage: true,
            rating: true,
            totalReviews: true,
            deliveryFee: true,
            minimumOrder: true,
            estimatedTime: true,
            categories: true,
            isOpen: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    const response: ApiResponse = {
      success: true,
      data: favorites,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error fetching favorites:', error);
    const response: ApiResponse = {
      success: false,
      error: 'Failed to fetch favorites',
    };
    return NextResponse.json(response, { status: 500 });
  }
}

// POST /api/favorites - Add restaurant to favorites
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, restaurantId } = body;

    if (!userId || !restaurantId) {
      return NextResponse.json(
        {
          success: false,
          error: 'User ID and Restaurant ID are required',
        } as ApiResponse,
        { status: 400 }
      );
    }

    // Check if already favorited
    const existing = await prisma.favorite.findUnique({
      where: {
        userId_restaurantId: {
          userId,
          restaurantId,
        },
      },
    });

    if (existing) {
      return NextResponse.json(
        {
          success: false,
          error: 'Restaurant already in favorites',
        } as ApiResponse,
        { status: 400 }
      );
    }

    const favorite = await prisma.favorite.create({
      data: {
        userId,
        restaurantId,
      },
      include: {
        restaurant: {
          select: {
            id: true,
            name: true,
            logo: true,
          },
        },
      },
    });

    const response: ApiResponse = {
      success: true,
      data: favorite,
      message: 'Added to favorites',
    };

    return NextResponse.json(response, { status: 201 });
  } catch (error) {
    console.error('Error adding favorite:', error);
    const response: ApiResponse = {
      success: false,
      error: 'Failed to add favorite',
    };
    return NextResponse.json(response, { status: 500 });
  }
}

// DELETE /api/favorites - Remove restaurant from favorites
export async function DELETE(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const userId = searchParams.get('userId');
    const restaurantId = searchParams.get('restaurantId');

    if (!userId || !restaurantId) {
      return NextResponse.json(
        {
          success: false,
          error: 'User ID and Restaurant ID are required',
        } as ApiResponse,
        { status: 400 }
      );
    }

    await prisma.favorite.delete({
      where: {
        userId_restaurantId: {
          userId,
          restaurantId,
        },
      },
    });

    const response: ApiResponse = {
      success: true,
      message: 'Removed from favorites',
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error removing favorite:', error);
    const response: ApiResponse = {
      success: false,
      error: 'Failed to remove favorite',
    };
    return NextResponse.json(response, { status: 500 });
  }
}
