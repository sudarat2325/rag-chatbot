import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
}

// POST /api/reviews/[id]/reply - Restaurant owner reply to review
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: reviewId } = await params;
    const body = await request.json();
    const { response: replyText, ownerId } = body;

    if (!replyText || !ownerId) {
      const apiResponse: ApiResponse = {
        success: false,
        error: 'response and ownerId are required',
      };
      return NextResponse.json(apiResponse, { status: 400 });
    }

    // Get review to verify ownership
    const review = await prisma.review.findUnique({
      where: { id: reviewId },
      include: {
        restaurant: true,
      },
    });

    if (!review) {
      const apiResponse: ApiResponse = {
        success: false,
        error: 'Review not found',
      };
      return NextResponse.json(apiResponse, { status: 404 });
    }

    // Verify that the user is the restaurant owner
    if (review.restaurant.ownerId !== ownerId) {
      const apiResponse: ApiResponse = {
        success: false,
        error: 'Unauthorized - only restaurant owner can reply',
      };
      return NextResponse.json(apiResponse, { status: 403 });
    }

    // Update review with response
    const updatedReview = await prisma.review.update({
      where: { id: reviewId },
      data: {
        response: replyText,
        respondedAt: new Date(),
      },
      include: {
        customer: {
          select: {
            name: true,
            avatar: true,
          },
        },
        restaurant: {
          select: {
            name: true,
            logo: true,
          },
        },
      },
    });

    // Create notification for customer
    try {
      await prisma.notification.create({
        data: {
          userId: review.customerId,
          type: 'SYSTEM',
          title: 'ร้านตอบกลับรีวิวของคุณ',
          message: `${review.restaurant.name} ได้ตอบกลับรีวิวของคุณแล้ว`,
        },
      });
    } catch (notifError) {
      console.error('Error creating notification:', notifError);
      // Don't fail the reply if notification fails
    }

    const apiResponse: ApiResponse = {
      success: true,
      data: updatedReview,
    };

    return NextResponse.json(apiResponse);
  } catch (error) {
    console.error('Error replying to review:', error);
    const apiResponse: ApiResponse = {
      success: false,
      error: 'Failed to reply to review',
    };
    return NextResponse.json(apiResponse, { status: 500 });
  }
}
