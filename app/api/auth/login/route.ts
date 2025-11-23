import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import { authRateLimit, rateLimitResponse } from '@/lib/rate-limit';

export async function POST(request: NextRequest) {
  // Apply rate limiting
  const rateLimitCheck = authRateLimit.check(request);
  if (!rateLimitCheck) {
    const remaining = authRateLimit.getRemaining(request);
    const reset = authRateLimit.getReset(request);
    return rateLimitResponse(request, remaining, reset);
  }

  try {
    const body = await request.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json(
        { success: false, error: 'กรุณากรอกอีเมลและรหัสผ่าน' },
        { status: 400 }
      );
    }

    // Find user
    let user = await prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        email: true,
        name: true,
        phone: true,
        role: true,
        password: true,
      },
    });

    // If user not found, create demo user with default address
    if (!user) {
      console.warn('User not found, creating demo user...');
      const hashedPassword = await bcrypt.hash(password, 10);

      // Create user with default address in a transaction
      const newUser = await prisma.$transaction(async (tx) => {
        const createdUser = await tx.user.create({
          data: {
            email,
            password: hashedPassword,
            name: email.split('@')[0],
            role: 'CUSTOMER',
          },
        });

        // Create default address for the user
        await tx.address.create({
          data: {
            userId: createdUser.id,
            label: 'บ้าน',
            fullAddress: '123 ถนนสุขุมวิท แขวงคลองเตย เขตคลองเตย กรุงเทพฯ 10110',
            latitude: 13.7563,
            longitude: 100.5018,
            district: 'คลองเตย',
            province: 'กรุงเทพมหานคร',
            postalCode: '10110',
            isDefault: true,
          },
        });

        return createdUser;
      });

      // Fetch user with password for verification
      user = await prisma.user.findUnique({
        where: { id: newUser.id },
        select: {
          id: true,
          email: true,
          name: true,
          phone: true,
          role: true,
          password: true,
        },
      });
    }

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'อีเมลหรือรหัสผ่านไม่ถูกต้อง' },
        { status: 401 }
      );
    }

    // Verify password (skip OAuth-only accounts without stored hash)
    if (!user.password) {
      return NextResponse.json(
        { success: false, error: 'อีเมลหรือรหัสผ่านไม่ถูกต้อง' },
        { status: 401 }
      );
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      return NextResponse.json(
        { success: false, error: 'อีเมลหรือรหัสผ่านไม่ถูกต้อง' },
        { status: 401 }
      );
    }

    // Remove password from response
    const { password: _, ...userWithoutPassword } = user;

    return NextResponse.json({
      success: true,
      data: userWithoutPassword,
      message: 'เข้าสู่ระบบสำเร็จ',
    });
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { success: false, error: 'เกิดข้อผิดพลาดในการเข้าสู่ระบบ' },
      { status: 500 }
    );
  }
}
