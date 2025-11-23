import { NextRequest, NextResponse } from 'next/server';
import { metrics } from '@/lib/logger/metrics';

interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
}

// GET /api/monitoring/metrics - Get all metrics
export async function GET(_request: NextRequest) {
  try {
    const summary = metrics.getSummary();

    // Add system info
    const systemInfo = {
      uptime: process.uptime(),
      memory: {
        total: process.memoryUsage().heapTotal / 1024 / 1024, // MB
        used: process.memoryUsage().heapUsed / 1024 / 1024, // MB
        external: process.memoryUsage().external / 1024 / 1024, // MB
      },
      cpu: process.cpuUsage ? process.cpuUsage() : null,
      platform: process.platform,
      nodeVersion: process.version,
    };

    const response: ApiResponse = {
      success: true,
      data: {
        ...summary,
        system: systemInfo,
      },
    };

    return NextResponse.json(response, {
      headers: {
        'Cache-Control': 'no-cache',
      },
    });
  } catch (error) {
    console.error('Error fetching metrics:', error);

    const response: ApiResponse = {
      success: false,
      error: 'Failed to fetch metrics',
    };

    return NextResponse.json(response, { status: 500 });
  }
}

// DELETE /api/monitoring/metrics - Reset all metrics
export async function DELETE(request: NextRequest) {
  try {
    // Optional: Add authentication check here
    const authHeader = request.headers.get('authorization');

    if (!authHeader || authHeader !== `Bearer ${process.env.ADMIN_API_KEY}`) {
      return NextResponse.json(
        {
          success: false,
          error: 'Unauthorized',
        } as ApiResponse,
        { status: 401 }
      );
    }

    metrics.resetAll();

    const response: ApiResponse = {
      success: true,
      data: { message: 'All metrics reset successfully' },
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error resetting metrics:', error);

    const response: ApiResponse = {
      success: false,
      error: 'Failed to reset metrics',
    };

    return NextResponse.json(response, { status: 500 });
  }
}
