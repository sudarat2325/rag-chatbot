import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import type { ApiResponse } from '@/lib/types';

// GET /api/addresses - Get user's addresses
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

    const addresses = await prisma.address.findMany({
      where: { userId },
      orderBy: [{ isDefault: 'desc' }, { createdAt: 'desc' }],
    });

    const response: ApiResponse = {
      success: true,
      data: addresses,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error fetching addresses:', error);
    const response: ApiResponse = {
      success: false,
      error: 'Failed to fetch addresses',
    };
    return NextResponse.json(response, { status: 500 });
  }
}

// POST /api/addresses - Create new address
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      userId,
      fullAddress,
      latitude,
      longitude,
      district,
      province,
      postalCode,
      label,
      isDefault,
    } = body;

    if (!userId || !fullAddress) {
      return NextResponse.json(
        {
          success: false,
          error: 'User ID and address are required',
        } as ApiResponse,
        { status: 400 }
      );
    }

    // If this is set as default, unset other defaults
    if (isDefault) {
      await prisma.address.updateMany({
        where: { userId, isDefault: true },
        data: { isDefault: false },
      });
    }

    const address = await prisma.address.create({
      data: {
        userId,
        fullAddress,
        latitude: latitude || 0,
        longitude: longitude || 0,
        district,
        province,
        postalCode,
        label,
        isDefault: isDefault || false,
      },
    });

    const response: ApiResponse = {
      success: true,
      data: address,
      message: 'Address created successfully',
    };

    return NextResponse.json(response, { status: 201 });
  } catch (error) {
    console.error('Error creating address:', error);
    const response: ApiResponse = {
      success: false,
      error: 'Failed to create address',
    };
    return NextResponse.json(response, { status: 500 });
  }
}

// PATCH /api/addresses - Update address
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { addressId, userId, ...updateData } = body;

    if (!addressId || !userId) {
      return NextResponse.json(
        {
          success: false,
          error: 'Address ID and User ID are required',
        } as ApiResponse,
        { status: 400 }
      );
    }

    // If setting as default, unset other defaults
    if (updateData.isDefault) {
      await prisma.address.updateMany({
        where: { userId, isDefault: true, id: { not: addressId } },
        data: { isDefault: false },
      });
    }

    const address = await prisma.address.update({
      where: { id: addressId },
      data: updateData,
    });

    const response: ApiResponse = {
      success: true,
      data: address,
      message: 'Address updated successfully',
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error updating address:', error);
    const response: ApiResponse = {
      success: false,
      error: 'Failed to update address',
    };
    return NextResponse.json(response, { status: 500 });
  }
}

// DELETE /api/addresses - Delete address
export async function DELETE(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const addressId = searchParams.get('addressId');

    if (!addressId) {
      return NextResponse.json(
        {
          success: false,
          error: 'Address ID is required',
        } as ApiResponse,
        { status: 400 }
      );
    }

    await prisma.address.delete({
      where: { id: addressId },
    });

    const response: ApiResponse = {
      success: true,
      message: 'Address deleted successfully',
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error deleting address:', error);
    const response: ApiResponse = {
      success: false,
      error: 'Failed to delete address',
    };
    return NextResponse.json(response, { status: 500 });
  }
}
