import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import type { ApiResponse, CreateMenuItemDTO } from '@/lib/types';
import { Prisma } from '@prisma/client';
import { cache, CacheKeys, CacheTTL } from '@/lib/cache/cache';
import logger from '@/lib/logger/winston';
import { PerformanceMonitor } from '@/lib/logger/errorHandler';

// GET /api/menu - Get menu items (with restaurant filter)
export async function GET(request: NextRequest) {
  const monitor = new PerformanceMonitor('GET /api/menu');

  try {
    const searchParams = request.nextUrl.searchParams;
    const restaurantId = searchParams.get('restaurantId');
    const category = searchParams.get('category');
    const isPopular = searchParams.get('isPopular') === 'true';

    // Build cache key based on filters
    const cacheKey = restaurantId
      ? CacheKeys.menu(restaurantId)
      : `menu:all:${JSON.stringify({ category, isPopular })}`;

    // Try to get from cache
    const menuItems = await cache.getOrSet(
      cacheKey,
      async () => {
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

        const dbMenuItems = await prisma.menuItem.findMany({
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

        logger.info('Menu items fetched from database', {
          count: dbMenuItems.length,
          filters: { restaurantId, category, isPopular }
        });
        return dbMenuItems;
      },
      CacheTTL.MEDIUM
    );

    const response: ApiResponse = {
      success: true,
      data: menuItems,
    };

    monitor.end({ menuItemCount: menuItems.length });
    return NextResponse.json(response);
  } catch (error) {
    logger.error('Error fetching menu items', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    });
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

    // Invalidate menu and restaurant caches
    await cache.clear('menu:*');
    await cache.del(CacheKeys.restaurant(restaurantId));
    await cache.clear('restaurants:*');
    logger.info('Menu item created, cache invalidated', {
      menuItemId: menuItem.id,
      restaurantId,
      name: menuItem.name
    });

    const response: ApiResponse = {
      success: true,
      data: menuItem,
      message: 'Menu item created successfully',
    };

    return NextResponse.json(response, { status: 201 });
  } catch (error) {
    logger.error('Error creating menu item', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    });
    const response: ApiResponse = {
      success: false,
      error: 'Failed to create menu item',
    };
    return NextResponse.json(response, { status: 500 });
  }
}
