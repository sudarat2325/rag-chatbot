import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import type { ApiResponse } from '@/lib/types';
import { Prisma } from '@prisma/client';

// GET /api/users - Get all users (for admin)
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const search = searchParams.get('search') || '';
    const limit = parseInt(searchParams.get('limit') || '100');

    const where: Prisma.UserWhereInput = {};

    // Search by name or email
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search } },
      ];
    }

    const users = await prisma.user.findMany({
      where,
      take: limit,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        email: true,
        name: true,
        phone: true,
        role: true,
        avatar: true,
        isActive: true,
        createdAt: true,
      },
    });

    const response: ApiResponse = {
      success: true,
      data: users,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error fetching users:', error);
    const response: ApiResponse = {
      success: false,
      error: 'Failed to fetch users',
    };
    return NextResponse.json(response, { status: 500 });
  }
}
