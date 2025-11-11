import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// GET - Get driver profile
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const driverId = searchParams.get('id');

    if (userId) {
      // Get driver by user ID
      const driver = await prisma.driverProfile.findUnique({
        where: { userId },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              phone: true,
              avatar: true,
            },
          },
        },
      });

      if (!driver) {
        return NextResponse.json(
          { success: false, error: 'Driver not found' },
          { status: 404 }
        );
      }

      return NextResponse.json({ success: true, data: driver });
    }

    if (driverId) {
      // Get driver by driver profile ID
      const driver = await prisma.driverProfile.findUnique({
        where: { id: driverId },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              phone: true,
              avatar: true,
            },
          },
        },
      });

      if (!driver) {
        return NextResponse.json(
          { success: false, error: 'Driver not found' },
          { status: 404 }
        );
      }

      return NextResponse.json({ success: true, data: driver });
    }

    // Get all drivers (for admin)
    const drivers = await prisma.driverProfile.findMany({
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            avatar: true,
            isActive: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return NextResponse.json({ success: true, data: drivers });
  } catch (error) {
    console.error('Error getting driver:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to get driver' },
      { status: 500 }
    );
  }
}

// POST - Create driver profile
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      userId,
      vehicleType,
      vehiclePlate,
      licenseNumber,
      licenseExpiry,
      emergencyContact,
      emergencyPhone,
      address,
      district,
      province,
      postalCode,
    } = body;

    // Validate required fields
    if (!userId || !vehicleType || !vehiclePlate || !licenseNumber || !licenseExpiry) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Check if driver profile already exists
    const existingDriver = await prisma.driverProfile.findUnique({
      where: { userId },
    });

    if (existingDriver) {
      return NextResponse.json(
        { success: false, error: 'Driver profile already exists' },
        { status: 400 }
      );
    }

    // Create driver profile with all fields
    const driver = await prisma.driverProfile.create({
      data: {
        userId,
        vehicleType,
        vehiclePlate,
        licenseNumber,
        licenseExpiry: new Date(licenseExpiry),
        emergencyContact,
        emergencyPhone,
        address,
        district,
        province,
        postalCode,
        isOnline: false,
        isAvailable: true,
        isVerified: false,
        rating: 5.0,
        totalDeliveries: 0,
        totalEarnings: 0,
      },
    });

    // Create success notification for user
    await prisma.notification.create({
      data: {
        userId,
        type: 'SYSTEM',
        title: 'ยินดีต้อนรับสู่ทีมไรเดอร์!',
        message: 'บัญชีไรเดอร์ของคุณถูกสร้างเรียบร้อยแล้ว คุณสามารถเริ่มรับงานได้ทันที',
        isRead: false,
      },
    });

    return NextResponse.json({ success: true, data: driver });
  } catch (error) {
    console.error('Error creating driver:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create driver profile' },
      { status: 500 }
    );
  }
}

// PATCH - Update driver profile
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, ...updateData } = body;

    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'User ID is required' },
        { status: 400 }
      );
    }

    // Convert date fields if they exist
    if (updateData.licenseExpiry) {
      updateData.licenseExpiry = new Date(updateData.licenseExpiry);
    }

    const driver = await prisma.driverProfile.update({
      where: { userId },
      data: updateData,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            avatar: true,
          },
        },
      },
    });

    return NextResponse.json({ success: true, data: driver });
  } catch (error) {
    console.error('Error updating driver:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update driver profile' },
      { status: 500 }
    );
  }
}

// DELETE - Delete driver profile (admin only)
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'User ID is required' },
        { status: 400 }
      );
    }

    // Delete driver profile
    await prisma.driverProfile.delete({
      where: { userId },
    });

    // Update user role back to CUSTOMER
    await prisma.user.update({
      where: { id: userId },
      data: { role: 'CUSTOMER' },
    });

    return NextResponse.json({
      success: true,
      message: 'Driver profile deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting driver:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete driver profile' },
      { status: 500 }
    );
  }
}
