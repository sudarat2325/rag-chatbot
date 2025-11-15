import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { isRestaurantOpen } from '@/lib/utils/helpers';
import type { ApiResponse } from '@/lib/types';
import type { MenuItem, Prisma } from '@prisma/client';
import { cache, CacheKeys, CacheTTL } from '@/lib/cache/cache';
import logger from '@/lib/logger/winston';
import { PerformanceMonitor } from '@/lib/logger/errorHandler';

// GET /api/restaurants/[id] - Get restaurant details
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const monitor = new PerformanceMonitor('GET /api/restaurants/[id]');

  try {
    const { id } = await params;
    const cacheKey = CacheKeys.restaurant(id);

    // Try to get from cache
    const restaurant = await cache.getOrSet(
      cacheKey,
      async () => {
        const dbRestaurant = await prisma.restaurant.findUnique({
          where: { id },
          include: {
            owner: {
              select: {
                name: true,
                email: true,
                phone: true,
              },
            },
            menuItems: {
              where: { isAvailable: true },
              orderBy: { createdAt: 'desc' },
            },
            reviews: {
              take: 10,
              orderBy: { createdAt: 'desc' },
              include: {
                customer: {
                  select: {
                    name: true,
                    avatar: true,
                  },
                },
              },
            },
          },
        });

        if (!dbRestaurant) {
          return null;
        }

        logger.info('Restaurant details fetched from database', { restaurantId: id, name: dbRestaurant.name });
        return dbRestaurant;
      },
      CacheTTL.MEDIUM
    );

    if (!restaurant) {
      return NextResponse.json(
        {
          success: false,
          error: 'Restaurant not found',
        } as ApiResponse,
        { status: 404 }
      );
    }

    // Check if restaurant is currently open
    const isCurrentlyOpen = restaurant.isOpen && isRestaurantOpen(restaurant.operatingHours || undefined);

    // Group menu items by category
    const menuByCategory = restaurant.menuItems.reduce<Record<string, MenuItem[]>>((acc, item) => {
      const categoryKey = item.category || 'อื่นๆ';
      if (!acc[categoryKey]) {
        acc[categoryKey] = [];
      }
      acc[categoryKey].push(item);
      return acc;
    }, {});

    const response: ApiResponse = {
      success: true,
      data: {
        ...restaurant,
        isCurrentlyOpen,
        menuByCategory,
      },
    };

    monitor.end({ restaurantId: restaurant.id });
    return NextResponse.json(response);
  } catch (error) {
    logger.error('Error fetching restaurant', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    });
    const response: ApiResponse = {
      success: false,
      error: 'Failed to fetch restaurant',
    };
    return NextResponse.json(response, { status: 500 });
  }
}

// PATCH /api/restaurants/[id] - Update restaurant
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    type RestaurantUpdatePayload = Prisma.RestaurantUpdateInput & Record<string, unknown>;
    const body = (await request.json()) as RestaurantUpdatePayload;

    // Remove fields that shouldn't be updated directly
    const { id: _, ownerId: __, createdAt: ___, updatedAt: ____, ...updateData } = body;

    const restaurant = await prisma.restaurant.update({
      where: { id },
      data: updateData as Prisma.RestaurantUpdateInput,
    });

    // Invalidate caches
    await cache.del(CacheKeys.restaurant(id));
    await cache.clear('restaurants:*');
    logger.info('Restaurant updated, cache invalidated', { restaurantId: id, name: restaurant.name });

    const response: ApiResponse = {
      success: true,
      data: restaurant,
      message: 'Restaurant updated successfully',
    };

    return NextResponse.json(response);
  } catch (error) {
    logger.error('Error updating restaurant', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    });
    const response: ApiResponse = {
      success: false,
      error: 'Failed to update restaurant',
    };
    return NextResponse.json(response, { status: 500 });
  }
}

// DELETE /api/restaurants/[id] - Delete/deactivate restaurant
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Soft delete - just deactivate
    await prisma.restaurant.update({
      where: { id },
      data: { isActive: false },
    });

    // Invalidate caches
    await cache.del(CacheKeys.restaurant(id));
    await cache.clear('restaurants:*');
    logger.info('Restaurant deactivated, cache invalidated', { restaurantId: id });

    const response: ApiResponse = {
      success: true,
      message: 'Restaurant deactivated successfully',
    };

    return NextResponse.json(response);
  } catch (error) {
    logger.error('Error deleting restaurant', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    });
    const response: ApiResponse = {
      success: false,
      error: 'Failed to delete restaurant',
    };
    return NextResponse.json(response, { status: 500 });
  }
}
