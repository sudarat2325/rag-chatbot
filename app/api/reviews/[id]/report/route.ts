import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
}

// POST /api/reviews/[id]/report - Report inappropriate review
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: reviewId } = await params;
    const body = await request.json();
    const { reporterId, reason, description } = body;

    if (!reporterId || !reason) {
      const response: ApiResponse = {
        success: false,
        error: 'reporterId and reason are required',
      };
      return NextResponse.json(response, { status: 400 });
    }

    // Check if user already reported this review
    const existingReport = await prisma.reviewReport.findFirst({
      where: {
        reviewId,
        reporterId,
      },
    });

    if (existingReport) {
      const response: ApiResponse = {
        success: false,
        error: 'You have already reported this review',
      };
      return NextResponse.json(response, { status: 400 });
    }

    // Create report
    const report = await prisma.reviewReport.create({
      data: {
        reviewId,
        reporterId,
        reason,
        description,
        status: 'PENDING',
      },
    });

    // Mark review as reported
    await prisma.review.update({
      where: { id: reviewId },
      data: {
        isReported: true,
      },
    });

    const response: ApiResponse = {
      success: true,
      data: report,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error reporting review:', error);
    const response: ApiResponse = {
      success: false,
      error: 'Failed to report review',
    };
    return NextResponse.json(response, { status: 500 });
  }
}
