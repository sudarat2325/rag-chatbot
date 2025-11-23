import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

interface HealthCheck {
  status: 'healthy' | 'unhealthy';
  timestamp: string;
  uptime: number;
  environment: string;
  version: string;
  checks: {
    database: { status: 'up' | 'down'; responseTime?: number; error?: string };
    memory: { status: 'ok' | 'warning' | 'critical'; usage: number; limit: number };
    disk: { status: 'ok' | 'warning' | 'critical'; usage?: number };
  };
}

export async function GET(_request: NextRequest) {
  const startTime = Date.now();

  try {
    // Check database connection
    let dbStatus: 'up' | 'down' = 'down';
    let dbResponseTime: number | undefined;
    let dbError: string | undefined;

    try {
      const dbStart = Date.now();
      await prisma.$runCommandRaw({ ping: 1 });
      dbResponseTime = Date.now() - dbStart;
      dbStatus = 'up';
    } catch (error) {
      dbError = error instanceof Error ? error.message : 'Unknown error';
      dbStatus = 'down';
    }

    // Check memory usage
    const memUsage = process.memoryUsage();
    const totalMemory = memUsage.heapTotal;
    const usedMemory = memUsage.heapUsed;
    const memoryUsagePercent = (usedMemory / totalMemory) * 100;

    let memoryStatus: 'ok' | 'warning' | 'critical' = 'ok';
    if (memoryUsagePercent > 90) {
      memoryStatus = 'critical';
    } else if (memoryUsagePercent > 75) {
      memoryStatus = 'warning';
    }

    // Overall health status
    const isHealthy = dbStatus === 'up' && memoryStatus !== 'critical';

    const healthCheck: HealthCheck = {
      status: isHealthy ? 'healthy' : 'unhealthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: process.env.NODE_ENV || 'development',
      version: process.env.npm_package_version || '1.0.0',
      checks: {
        database: {
          status: dbStatus,
          responseTime: dbResponseTime,
          ...(dbError && { error: dbError }),
        },
        memory: {
          status: memoryStatus,
          usage: Math.round(memoryUsagePercent),
          limit: 100,
        },
        disk: {
          status: 'ok',
        },
      },
    };

    const statusCode = isHealthy ? 200 : 503;

    return NextResponse.json(healthCheck, {
      status: statusCode,
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'X-Response-Time': `${Date.now() - startTime}ms`,
      },
    });
  } catch (error) {
    console.error('Health check error:', error);

    return NextResponse.json(
      {
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 503 }
    );
  }
}
