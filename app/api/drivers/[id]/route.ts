import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import type { ApiResponse } from '@/lib/types';
import { Prisma } from '@prisma/client';

// GET /api/drivers/[id] - Get driver profile
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const driver = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        phone: true,
        email: true,
        role: true,
        driverProfile: true,
      },
    });

    if (!driver || driver.role !== 'DRIVER') {
      return NextResponse.json(
        {
          success: false,
          error: 'Driver not found',
        } as ApiResponse,
        { status: 404 }
      );
    }

    const response: ApiResponse = {
      success: true,
      data: driver,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error fetching driver:', error);
    const response: ApiResponse = {
      success: false,
      error: 'Failed to fetch driver',
    };
    return NextResponse.json(response, { status: 500 });
  }
}

// PATCH /api/drivers/[id] - Update driver profile
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { isOnline, isAvailable, vehicleType, vehiclePlate } = body;

    // Verify driver exists
    const driver = await prisma.user.findUnique({
      where: { id },
      select: { role: true },
    });

    if (!driver || driver.role !== 'DRIVER') {
      return NextResponse.json(
        {
          success: false,
          error: 'Driver not found',
        } as ApiResponse,
        { status: 404 }
      );
    }

    // Check if driver profile exists
    let driverProfile = await prisma.driverProfile.findUnique({
      where: { userId: id },
    });

    if (!driverProfile) {
      // Create driver profile if not exists
      driverProfile = await prisma.driverProfile.create({
        data: {
          userId: id,
          vehicleType: vehicleType || 'Motorcycle',
          vehiclePlate: vehiclePlate || null,
          isOnline: isOnline !== undefined ? isOnline : false,
          isAvailable: isAvailable !== undefined ? isAvailable : true,
        },
      });
    } else {
      // Update driver profile
      const updateData: Prisma.DriverProfileUpdateInput = {};

      if (isOnline !== undefined) {
        updateData.isOnline = isOnline;
        // When going offline, also set available to false
        if (!isOnline) {
          updateData.isAvailable = false;
        }
      }

      if (isAvailable !== undefined && isOnline !== false) {
        updateData.isAvailable = isAvailable;
      }

      if (vehicleType !== undefined) {
        updateData.vehicleType = vehicleType;
      }

      if (vehiclePlate !== undefined) {
        updateData.vehiclePlate = vehiclePlate;
      }

      driverProfile = await prisma.driverProfile.update({
        where: { userId: id },
        data: updateData,
      });
    }

    const response: ApiResponse = {
      success: true,
      data: driverProfile,
      message: 'Driver profile updated successfully',
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error updating driver:', error);
    const response: ApiResponse = {
      success: false,
      error: 'Failed to update driver',
    };
    return NextResponse.json(response, { status: 500 });
  }
}
