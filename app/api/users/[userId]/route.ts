import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import type { ApiResponse } from '@/lib/types';
import { Prisma, UserRole } from '@prisma/client';

interface UpdateUserBody {
  role?: UserRole;
  name?: string;
  phone?: string;
  avatar?: string | null;
}

// PATCH /api/users/[userId] - Update user
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const { userId } = await params;
    const body = (await request.json()) as UpdateUserBody;
    const { role, name, phone, avatar } = body;

    const updateData: Prisma.UserUpdateInput = {};

    if (role) {
      // Validate role
      const validRoles = Object.values(UserRole);
      if (!validRoles.includes(role)) {
        return NextResponse.json(
          {
            success: false,
            error: 'Invalid role',
          } as ApiResponse,
          { status: 400 }
        );
      }
      updateData.role = role;
    }

    if (name) updateData.name = name;
    if (phone) updateData.phone = phone;
    if (avatar !== undefined) updateData.avatar = avatar;

    const user = await prisma.user.update({
      where: { id: userId },
      data: updateData,
      select: {
        id: true,
        email: true,
        name: true,
        phone: true,
        role: true,
        avatar: true,
        isActive: true,
      },
    });

    const response: ApiResponse = {
      success: true,
      data: user,
      message: 'User updated successfully',
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error updating user:', error);
    const response: ApiResponse = {
      success: false,
      error: 'Failed to update user',
    };
    return NextResponse.json(response, { status: 500 });
  }
}

// GET /api/users/[userId] - Get user
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const { userId } = await params;

    const user = await prisma.user.findUnique({
      where: { id: userId },
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

    if (!user) {
      return NextResponse.json(
        {
          success: false,
          error: 'User not found',
        } as ApiResponse,
        { status: 404 }
      );
    }

    const response: ApiResponse = {
      success: true,
      data: user,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error fetching user:', error);
    const response: ApiResponse = {
      success: false,
      error: 'Failed to fetch user',
    };
    return NextResponse.json(response, { status: 500 });
  }
}

// DELETE /api/users/[userId] - Delete user
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const { userId } = await params;

    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return NextResponse.json(
        {
          success: false,
          error: 'User not found',
        } as ApiResponse,
        { status: 404 }
      );
    }

    // Delete user (cascade delete will handle related records)
    await prisma.user.delete({
      where: { id: userId },
    });

    const response: ApiResponse = {
      success: true,
      message: 'User deleted successfully',
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error deleting user:', error);
    const response: ApiResponse = {
      success: false,
      error: 'Failed to delete user',
    };
    return NextResponse.json(response, { status: 500 });
  }
}
