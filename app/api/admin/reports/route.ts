import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
}

// GET /api/admin/reports - Get all review reports
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') || 'PENDING';

    const reports = await prisma.reviewReport.findMany({
      where: status !== 'ALL' ? { status: status as any } : undefined,
      include: {
        review: {
          include: {
            customer: {
              select: {
                name: true,
                email: true,
              },
            },
            restaurant: {
              select: {
                name: true,
              },
            },
          },
        },
        reporter: {
          select: {
            name: true,
            email: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    const response: ApiResponse = {
      success: true,
      data: reports,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error fetching reports:', error);
    const response: ApiResponse = {
      success: false,
      error: 'Failed to fetch reports',
    };
    return NextResponse.json(response, { status: 500 });
  }
}

// PATCH /api/admin/reports - Update report status
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { reportId, status, action } = body;

    if (!reportId || !status) {
      const response: ApiResponse = {
        success: false,
        error: 'reportId and status are required',
      };
      return NextResponse.json(response, { status: 400 });
    }

    // Update report status
    const report = await prisma.reviewReport.update({
      where: { id: reportId },
      data: {
        status,
      },
      include: {
        review: true,
      },
    });

    // If action is to hide review
    if (action === 'HIDE_REVIEW' && status === 'RESOLVED') {
      await prisma.review.update({
        where: { id: report.reviewId },
        data: { isHidden: true },
      });
    }

    // If action is to dismiss report
    if (action === 'DISMISS' && status === 'RESOLVED') {
      await prisma.review.update({
        where: { id: report.reviewId },
        data: { isReported: false },
      });
    }

    const response: ApiResponse = {
      success: true,
      data: report,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error updating report:', error);
    const response: ApiResponse = {
      success: false,
      error: 'Failed to update report',
    };
    return NextResponse.json(response, { status: 500 });
  }
}
