import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
}

// GET /api/loyalty - Get loyalty points and history
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      const response: ApiResponse = {
        success: false,
        error: 'userId is required',
      };
      return NextResponse.json(response, { status: 400 });
    }

    // Get or create loyalty points
    let loyaltyPoints = await prisma.loyaltyPoints.findUnique({
      where: { userId },
      include: {
        transactions: {
          orderBy: { createdAt: 'desc' },
          take: 50,
        },
      },
    });

    if (!loyaltyPoints) {
      loyaltyPoints = await prisma.loyaltyPoints.create({
        data: {
          userId,
          points: 0,
          totalEarned: 0,
          tier: 'BRONZE',
        },
        include: {
          transactions: true,
        },
      });
    }

    // Calculate tier benefits
    const tierBenefits = {
      BRONZE: { discount: 0, pointMultiplier: 1, freeDelivery: false },
      SILVER: { discount: 5, pointMultiplier: 1.2, freeDelivery: false },
      GOLD: { discount: 10, pointMultiplier: 1.5, freeDelivery: true },
      PLATINUM: { discount: 15, pointMultiplier: 2, freeDelivery: true },
      DIAMOND: { discount: 20, pointMultiplier: 3, freeDelivery: true },
    };

    const response: ApiResponse = {
      success: true,
      data: {
        ...loyaltyPoints,
        benefits: tierBenefits[loyaltyPoints.tier],
      },
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error fetching loyalty points:', error);
    const response: ApiResponse = {
      success: false,
      error: 'Failed to fetch loyalty points',
    };
    return NextResponse.json(response, { status: 500 });
  }
}

// POST /api/loyalty/redeem - Redeem loyalty points
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, points } = body;

    if (!userId || !points) {
      const response: ApiResponse = {
        success: false,
        error: 'userId and points are required',
      };
      return NextResponse.json(response, { status: 400 });
    }

    // Get loyalty points
    const loyaltyPoints = await prisma.loyaltyPoints.findUnique({
      where: { userId },
    });

    if (!loyaltyPoints) {
      const response: ApiResponse = {
        success: false,
        error: 'Loyalty account not found',
      };
      return NextResponse.json(response, { status: 404 });
    }

    if (loyaltyPoints.points < points) {
      const response: ApiResponse = {
        success: false,
        error: 'Insufficient points',
      };
      return NextResponse.json(response, { status: 400 });
    }

    // Redeem points
    const balanceBefore = loyaltyPoints.points;
    const balanceAfter = balanceBefore - points;

    await prisma.loyaltyPoints.update({
      where: { id: loyaltyPoints.id },
      data: {
        points: balanceAfter,
        totalSpent: loyaltyPoints.totalSpent + points,
      },
    });

    // Record transaction
    await prisma.pointTransaction.create({
      data: {
        loyaltyPointsId: loyaltyPoints.id,
        type: 'REDEEMED',
        points: -points,
        balanceBefore,
        balanceAfter,
        description: 'Points redeemed for discount',
      },
    });

    // Convert points to discount (100 points = 10 THB)
    const discountAmount = points / 10;

    const response: ApiResponse = {
      success: true,
      data: {
        pointsRedeemed: points,
        discountAmount,
        remainingPoints: balanceAfter,
      },
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error redeeming points:', error);
    const response: ApiResponse = {
      success: false,
      error: 'Failed to redeem points',
    };
    return NextResponse.json(response, { status: 500 });
  }
}
