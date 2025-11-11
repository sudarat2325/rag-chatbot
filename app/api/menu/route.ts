import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import type { ApiResponse, CreateMenuItemDTO } from '@/lib/types';
import { Prisma } from '@prisma/client';

// GET /api/menu - Get menu items (with restaurant filter)
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const restaurantId = searchParams.get('restaurantId');
    const category = searchParams.get('category');
    const isPopular = searchParams.get('isPopular') === 'true';

    const where: Prisma.MenuItemWhereInput = {
      isAvailable: true,
    };

    if (restaurantId) {
      where.restaurantId = restaurantId;
    }

    if (category) {
      where.category = category;
    }

    if (isPopular) {
      where.isPopular = true;
    }

    const menuItems = await prisma.menuItem.findMany({
      where,
      include: {
        restaurant: {
          select: {
            id: true,
            name: true,
            logo: true,
            rating: true,
            deliveryFee: true,
            estimatedTime: true,
          },
        },
      },
      orderBy: [
        { isPopular: 'desc' },
        { createdAt: 'desc' },
      ],
    });

    const response: ApiResponse = {
      success: true,
      data: menuItems,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error fetching menu items:', error);
    const response: ApiResponse = {
      success: false,
      error: 'Failed to fetch menu items',
    };
    return NextResponse.json(response, { status: 500 });
  }
}

// POST /api/menu - Create menu item
export async function POST(request: NextRequest) {
  try {
    const body: CreateMenuItemDTO = await request.json();
    const {
      restaurantId,
      name,
      description,
      price,
      image,
      category,
      options,
      preparationTime,
    } = body;

    // Validate required fields
    if (!restaurantId || !name || !price || !category) {
      return NextResponse.json(
        {
          success: false,
          error: 'Missing required fields',
        } as ApiResponse,
        { status: 400 }
      );
    }

    // Verify restaurant exists
    const restaurant = await prisma.restaurant.findUnique({
      where: { id: restaurantId },
    });

    if (!restaurant) {
      return NextResponse.json(
        {
          success: false,
          error: 'Restaurant not found',
        } as ApiResponse,
        { status: 404 }
      );
    }

    // Create menu item
    const menuItem = await prisma.menuItem.create({
      data: {
        restaurantId,
        name,
        description,
        price,
        image,
        category,
        options: options ? JSON.stringify(options) : null,
        preparationTime,
      },
    });

    const response: ApiResponse = {
      success: true,
      data: menuItem,
      message: 'Menu item created successfully',
    };

    return NextResponse.json(response, { status: 201 });
  } catch (error) {
    console.error('Error creating menu item:', error);
    const response: ApiResponse = {
      success: false,
      error: 'Failed to create menu item',
    };
    return NextResponse.json(response, { status: 500 });
  }
}
