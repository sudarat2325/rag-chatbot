import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { calculateDistance, isRestaurantOpen } from '@/lib/utils/helpers';
import type { ApiResponse, RestaurantWithDetails, RestaurantFilter } from '@/lib/types';

// GET /api/restaurants - Get all restaurants with filters
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const search = searchParams.get('search') || undefined;
    const category = searchParams.get('category') || undefined;
    const minRating = searchParams.get('minRating') ? parseFloat(searchParams.get('minRating')!) : undefined;
    const isOpen = searchParams.get('isOpen') === 'true' ? true : undefined;
    const sortBy = searchParams.get('sortBy') || 'rating';
    const latitude = searchParams.get('latitude') ? parseFloat(searchParams.get('latitude')!) : undefined;
    const longitude = searchParams.get('longitude') ? parseFloat(searchParams.get('longitude')!) : undefined;

    // Build where clause
    const where: any = {
      isActive: true,
    };

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (category) {
      where.categories = { contains: category };
    }

    if (minRating !== undefined) {
      where.rating = { gte: minRating };
    }

    if (isOpen !== undefined) {
      where.isOpen = isOpen;
    }

    // Fetch restaurants
    const restaurants = await prisma.restaurant.findMany({
      where,
      include: {
        owner: {
          select: {
            name: true,
            email: true,
          },
        },
      },
      orderBy:
        sortBy === 'rating'
          ? { rating: 'desc' }
          : sortBy === 'popular'
          ? { totalOrders: 'desc' }
          : { createdAt: 'desc' },
    });

    // Transform and calculate distances
    const restaurantsWithDetails: RestaurantWithDetails[] = restaurants.map((restaurant) => {
      const distance =
        latitude && longitude
          ? calculateDistance(latitude, longitude, restaurant.latitude, restaurant.longitude)
          : undefined;

      const categories = restaurant.categories ? restaurant.categories.split(',') : [];

      return {
        id: restaurant.id,
        name: restaurant.name,
        description: restaurant.description || undefined,
        logo: restaurant.logo || undefined,
        coverImage: restaurant.coverImage || undefined,
        rating: restaurant.rating,
        totalReviews: restaurant.totalReviews,
        categories,
        isOpen: restaurant.isOpen && isRestaurantOpen(restaurant.operatingHours || undefined),
        estimatedTime: restaurant.estimatedTime || undefined,
        deliveryFee: restaurant.deliveryFee,
        minimumOrder: restaurant.minimumOrder,
        distance,
      };
    });

    // Sort by distance if coordinates provided and sortBy is 'distance'
    if (sortBy === 'distance' && latitude && longitude) {
      restaurantsWithDetails.sort((a, b) => (a.distance || 0) - (b.distance || 0));
    }

    const response: ApiResponse<RestaurantWithDetails[]> = {
      success: true,
      data: restaurantsWithDetails,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error fetching restaurants:', error);
    const response: ApiResponse = {
      success: false,
      error: 'Failed to fetch restaurants',
    };
    return NextResponse.json(response, { status: 500 });
  }
}

// POST /api/restaurants - Create new restaurant (for restaurant owners)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      ownerId,
      name,
      description,
      phone,
      email,
      address,
      latitude,
      longitude,
      district,
      province,
      categories,
      deliveryFee,
      minimumOrder,
      estimatedTime,
      operatingHours,
      logo,
      coverImage,
    } = body;

    // Validate required fields
    if (!ownerId || !name || !phone || !address || !latitude || !longitude) {
      return NextResponse.json(
        {
          success: false,
          error: 'Missing required fields',
        } as ApiResponse,
        { status: 400 }
      );
    }

    // Check if user exists and is a restaurant owner
    const user = await prisma.user.findUnique({
      where: { id: ownerId },
    });

    if (!user || user.role !== 'RESTAURANT_OWNER') {
      return NextResponse.json(
        {
          success: false,
          error: 'User not found or not a restaurant owner',
        } as ApiResponse,
        { status: 400 }
      );
    }

    // Check if user already has a restaurant
    const existingRestaurant = await prisma.restaurant.findUnique({
      where: { ownerId },
    });

    if (existingRestaurant) {
      return NextResponse.json(
        {
          success: false,
          error: 'User already has a restaurant',
        } as ApiResponse,
        { status: 400 }
      );
    }

    // Create restaurant
    const restaurant = await prisma.restaurant.create({
      data: {
        ownerId,
        name,
        description,
        phone,
        email,
        address,
        latitude,
        longitude,
        district,
        province,
        categories,
        deliveryFee: deliveryFee || 0,
        minimumOrder: minimumOrder || 0,
        estimatedTime,
        operatingHours,
        logo,
        coverImage,
      },
    });

    const response: ApiResponse = {
      success: true,
      data: restaurant,
      message: 'Restaurant created successfully',
    };

    return NextResponse.json(response, { status: 201 });
  } catch (error) {
    console.error('Error creating restaurant:', error);
    const response: ApiResponse = {
      success: false,
      error: 'Failed to create restaurant',
    };
    return NextResponse.json(response, { status: 500 });
  }
}
