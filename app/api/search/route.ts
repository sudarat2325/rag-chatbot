import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
}

// GET /api/search - Search and filter restaurants
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    const query = searchParams.get('q') || '';
    const categories = searchParams.get('categories')?.split(',').filter(Boolean) || [];
    const minRating = searchParams.get('minRating') ? Number(searchParams.get('minRating')) : undefined;
    const maxDeliveryFee = searchParams.get('maxDeliveryFee') ? Number(searchParams.get('maxDeliveryFee')) : undefined;
    const minPrice = searchParams.get('minPrice') ? Number(searchParams.get('minPrice')) : undefined;
    const maxPrice = searchParams.get('maxPrice') ? Number(searchParams.get('maxPrice')) : undefined;
    const isOpen = searchParams.get('isOpen') === 'true' ? true : undefined;
    const sortBy = searchParams.get('sortBy') || 'rating';
    const sortOrder = searchParams.get('sortOrder') || 'desc';

    // Build where clause
    const where: any = {
      isActive: true,
    };

    // Search by name or description
    if (query) {
      where.OR = [
        { name: { contains: query, mode: 'insensitive' } },
        { description: { contains: query, mode: 'insensitive' } },
      ];
    }

    // Filter by categories
    if (categories.length > 0) {
      where.categories = {
        hasSome: categories,
      };
    }

    // Filter by rating
    if (minRating !== undefined) {
      where.rating = { gte: minRating };
    }

    // Filter by delivery fee
    if (maxDeliveryFee !== undefined) {
      where.deliveryFee = { lte: maxDeliveryFee };
    }

    // Filter by open status
    if (isOpen !== undefined) {
      where.isOpen = isOpen;
    }

    // Build orderBy clause
    const orderBy: any = {};
    if (sortBy === 'rating' || sortBy === 'totalOrders' || sortBy === 'deliveryFee') {
      orderBy[sortBy] = sortOrder;
    } else if (sortBy === 'name') {
      orderBy.name = sortOrder;
    } else {
      orderBy.rating = 'desc'; // Default
    }

    // Fetch restaurants
    let restaurants = await prisma.restaurant.findMany({
      where,
      include: {
        owner: {
          select: {
            name: true,
            email: true,
          },
        },
      },
      orderBy,
    });

    // If price filter is set, we need to filter by menu items
    if (minPrice !== undefined || maxPrice !== undefined) {
      const restaurantIds = restaurants.map((r) => r.id);

      const menuItems = await prisma.menuItem.findMany({
        where: {
          restaurantId: { in: restaurantIds },
          isAvailable: true,
          ...(minPrice !== undefined && { price: { gte: minPrice } }),
          ...(maxPrice !== undefined && { price: { lte: maxPrice } }),
        },
        select: {
          restaurantId: true,
        },
      });

      const restaurantsWithMatchingPrice = new Set(menuItems.map((item) => item.restaurantId));
      restaurants = restaurants.filter((r) => restaurantsWithMatchingPrice.has(r.id));
    }

    const response: ApiResponse = {
      success: true,
      data: {
        restaurants,
        total: restaurants.length,
        filters: {
          query,
          categories,
          minRating,
          maxDeliveryFee,
          minPrice,
          maxPrice,
          isOpen,
          sortBy,
          sortOrder,
        },
      },
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error searching restaurants:', error);
    const response: ApiResponse = {
      success: false,
      error: 'Failed to search restaurants',
    };
    return NextResponse.json(response, { status: 500 });
  }
}
