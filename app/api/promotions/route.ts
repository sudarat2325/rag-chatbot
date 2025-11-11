import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

/**
 * GET /api/promotions
 * Get all active promotions
 */
export async function GET(_request: NextRequest) {
  try {
    const now = new Date();

    const promotions = await prisma.promotion.findMany({
      where: {
        isActive: true,
        startDate: {
          lte: now,
        },
        endDate: {
          gte: now,
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    // If no promotions exist, create demo data
    if (promotions.length === 0) {
      const demoPromotions = await createDemoPromotions();
      return NextResponse.json({
        success: true,
        data: demoPromotions,
      });
    }

    return NextResponse.json({
      success: true,
      data: promotions,
    });
  } catch (error) {
    console.error('Error fetching promotions:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch promotions' },
      { status: 500 }
    );
  }
}

/**
 * Create demo promotions (called when database is empty)
 */
async function createDemoPromotions() {
  const now = new Date();
  const oneMonthLater = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
  const twoMonthsLater = new Date(now.getTime() + 60 * 24 * 60 * 60 * 1000);

  const promotions = [
    {
      code: 'WELCOME50',
      name: 'ส่วนลด 50% สำหรับคำสั่งซื้อแรก',
      description: 'รับส่วนลดทันที 50% สำหรับคำสั่งซื้อแรกของคุณ! ไม่มีขั้นต่ำ สูงสุด 100 บาท',
      type: 'PERCENTAGE' as const,
      discountValue: 50,
      minimumOrder: 100,
      maxDiscount: 100,
      usageLimit: 1,
      isActive: true,
      startDate: now,
      endDate: oneMonthLater,
    },
    {
      code: 'FREEDEL',
      name: 'ฟรีค่าจัดส่ง',
      description: 'ฟรีค่าจัดส่งไม่มีขั้นต่ำ! ใช้ได้ทุกร้าน',
      type: 'FREE_DELIVERY' as const,
      discountValue: 0,
      minimumOrder: 0,
      isActive: true,
      startDate: now,
      endDate: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000),
    },
    {
      code: 'SAVE100',
      name: 'ลด 100 บาท',
      description: 'รับส่วนลด 100 บาท เมื่อสั่งอาหารครบ 500 บาทขึ้นไป',
      type: 'FIXED_AMOUNT' as const,
      discountValue: 100,
      minimumOrder: 500,
      isActive: true,
      startDate: now,
      endDate: new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000),
    },
    {
      code: 'LUNCH15',
      name: 'ส่วนลดมื้อกลางวัน',
      description: 'ส่วนลด 15% สำหรับมื้อกลางวัน (11:00-14:00) สูงสุด 50 บาท',
      type: 'PERCENTAGE' as const,
      discountValue: 15,
      minimumOrder: 200,
      maxDiscount: 50,
      isActive: true,
      startDate: now,
      endDate: oneMonthLater,
    },
    {
      code: 'WEEKEND20',
      name: 'ส่วนลดวันหยุด',
      description: 'ส่วนลด 20% ทุกวันเสาร์-อาทิตย์ ขั้นต่ำ 300 บาท สูงสุด 80 บาท',
      type: 'PERCENTAGE' as const,
      discountValue: 20,
      minimumOrder: 300,
      maxDiscount: 80,
      isActive: true,
      startDate: now,
      endDate: twoMonthsLater,
    },
  ];

  // Create all promotions
  const created = await Promise.all(
    promotions.map((promo) =>
      prisma.promotion.create({
        data: promo,
      })
    )
  );

  return created;
}

/**
 * POST /api/promotions
 * Validate and apply promotion code
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { code, subtotal, restaurantId } = body;

    if (!code || subtotal === undefined) {
      return NextResponse.json(
        { success: false, error: 'Code and subtotal are required' },
        { status: 400 }
      );
    }

    // Import promotion service
    const { calculateDiscount } = await import('@/lib/services/promotionService');

    const result = await calculateDiscount(code, subtotal, restaurantId);

    if (result.error) {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error('Error validating promotion:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to validate promotion' },
      { status: 500 }
    );
  }
}
