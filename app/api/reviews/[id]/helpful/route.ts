import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
}

// POST /api/reviews/[id]/helpful - Mark review as helpful/not helpful
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: reviewId } = await params;
    const body = await request.json();
    const { userId, isHelpful } = body;

    if (!userId) {
      const response: ApiResponse = {
        success: false,
        error: 'userId is required',
      };
      return NextResponse.json(response, { status: 400 });
    }

    // Check if user already voted
    const existingVote = await prisma.reviewLike.findUnique({
      where: {
        reviewId_userId: {
          reviewId,
          userId,
        },
      },
    });

    if (existingVote) {
      // Update existing vote
      await prisma.reviewLike.update({
        where: { id: existingVote.id },
        data: { isHelpful },
      });

      // Update review counts
      const review = await prisma.review.findUnique({
        where: { id: reviewId },
        include: {
          likes: true,
        },
      });

      if (review) {
        const helpfulCount = review.likes.filter((l) => l.isHelpful).length;
        const notHelpfulCount = review.likes.filter((l) => !l.isHelpful).length;

        await prisma.review.update({
          where: { id: reviewId },
          data: {
            helpfulCount,
            notHelpfulCount,
          },
        });
      }
    } else {
      // Create new vote
      await prisma.reviewLike.create({
        data: {
          reviewId,
          userId,
          isHelpful,
        },
      });

      // Update review counts
      await prisma.review.update({
        where: { id: reviewId },
        data: {
          [isHelpful ? 'helpfulCount' : 'notHelpfulCount']: {
            increment: 1,
          },
        },
      });
    }

    // Get updated review
    const updatedReview = await prisma.review.findUnique({
      where: { id: reviewId },
      select: {
        helpfulCount: true,
        notHelpfulCount: true,
      },
    });

    const response: ApiResponse = {
      success: true,
      data: updatedReview,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error voting on review:', error);
    const response: ApiResponse = {
      success: false,
      error: 'Failed to vote on review',
    };
    return NextResponse.json(response, { status: 500 });
  }
}
