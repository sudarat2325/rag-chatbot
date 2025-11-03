import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import type { ApiResponse } from '@/lib/types';

// GET /api/tracking/[orderId] - Get delivery tracking info
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ orderId: string }> }
) {
  try {
    const { orderId } = await params;

    const delivery = await prisma.delivery.findUnique({
      where: { orderId },
      include: {
        order: {
          include: {
            restaurant: {
              select: {
                name: true,
                address: true,
                phone: true,
              },
            },
            address: true,
          },
        },
        driver: {
          select: {
            id: true,
            name: true,
            phone: true,
            driverProfile: {
              select: {
                vehicleType: true,
                vehiclePlate: true,
                rating: true,
              },
            },
          },
        },
      },
    });

    if (!delivery) {
      return NextResponse.json(
        {
          success: false,
          error: 'Delivery tracking not found',
        } as ApiResponse,
        { status: 404 }
      );
    }

    const response: ApiResponse = {
      success: true,
      data: delivery,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error fetching tracking:', error);
    const response: ApiResponse = {
      success: false,
      error: 'Failed to fetch tracking',
    };
    return NextResponse.json(response, { status: 500 });
  }
}

// PATCH /api/tracking/[orderId] - Update driver location
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ orderId: string }> }
) {
  try {
    const { orderId } = await params;
    const { latitude, longitude, driverId } = await request.json();

    if (!latitude || !longitude) {
      return NextResponse.json(
        {
          success: false,
          error: 'Latitude and longitude are required',
        } as ApiResponse,
        { status: 400 }
      );
    }

    const delivery = await prisma.delivery.update({
      where: { orderId },
      data: {
        currentLatitude: latitude,
        currentLongitude: longitude,
        ...(driverId && { driverId }),
      },
    });

    // TODO: Emit WebSocket event for real-time update

    const response: ApiResponse = {
      success: true,
      data: delivery,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error updating tracking:', error);
    const response: ApiResponse = {
      success: false,
      error: 'Failed to update tracking',
    };
    return NextResponse.json(response, { status: 500 });
  }
}
