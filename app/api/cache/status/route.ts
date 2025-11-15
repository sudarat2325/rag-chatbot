import { NextResponse } from 'next/server';
import { isRedisAvailable } from '@/lib/cache/redis';

export async function GET() {
  const redisStatus = isRedisAvailable();

  return NextResponse.json({
    success: true,
    data: {
      redis: {
        available: redisStatus,
        mode: redisStatus ? 'Redis' : 'In-Memory Fallback',
      },
      message: redisStatus
        ? '✅ Cache is running on Redis'
        : '⚠️ Cache is running on In-Memory (Redis not available)',
    },
  });
}
