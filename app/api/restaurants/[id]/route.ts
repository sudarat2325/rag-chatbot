import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { isRestaurantOpen } from '@/lib/utils/helpers';
import type { ApiResponse } from '@/lib/types';

// GET /api/restaurants/[id] - Get restaurant details
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const restaurant = await prisma.restaurant.findUnique({
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
    const menuByCategory = restaurant.menuItems.reduce((acc: any, item) => {
      if (!acc[item.category]) {
        acc[item.category] = [];
      }
      acc[item.category].push(item);
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

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error fetching restaurant:', error);
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
    const body = await request.json();

    // Remove fields that shouldn't be updated directly
    const { id: _, ownerId: __, createdAt: ___, updatedAt: ____, ...updateData } = body;

    const restaurant = await prisma.restaurant.update({
      where: { id },
      data: updateData,
    });

    const response: ApiResponse = {
      success: true,
      data: restaurant,
      message: 'Restaurant updated successfully',
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error updating restaurant:', error);
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
    const restaurant = await prisma.restaurant.update({
      where: { id },
      data: { isActive: false },
    });

    const response: ApiResponse = {
      success: true,
      message: 'Restaurant deactivated successfully',
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error deleting restaurant:', error);
    const response: ApiResponse = {
      success: false,
      error: 'Failed to delete restaurant',
    };
    return NextResponse.json(response, { status: 500 });
  }
}
