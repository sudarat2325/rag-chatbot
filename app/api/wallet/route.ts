import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { topUpWallet } from '@/lib/services/payment';

const prisma = new PrismaClient();

interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
}

// GET /api/wallet - Get wallet details and transactions
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      const response: ApiResponse = {
        success: false,
        error: 'userId is required',
      };
      return NextResponse.json(response, { status: 400 });
    }

    // Get or create wallet
    let wallet = await prisma.wallet.findUnique({
      where: { userId },
      include: {
        transactions: {
          orderBy: { createdAt: 'desc' },
          take: 50,
        },
      },
    });

    if (!wallet) {
      wallet = await prisma.wallet.create({
        data: {
          userId,
          balance: 0,
        },
        include: {
          transactions: true,
        },
      });
    }

    const response: ApiResponse = {
      success: true,
      data: wallet,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error fetching wallet:', error);
    const response: ApiResponse = {
      success: false,
      error: 'Failed to fetch wallet',
    };
    return NextResponse.json(response, { status: 500 });
  }
}

// POST /api/wallet - Top up wallet
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, amount, gatewayTxnId, gatewayProvider } = body;

    if (!userId || !amount) {
      const response: ApiResponse = {
        success: false,
        error: 'userId and amount are required',
      };
      return NextResponse.json(response, { status: 400 });
    }

    if (amount <= 0) {
      const response: ApiResponse = {
        success: false,
        error: 'Amount must be greater than 0',
      };
      return NextResponse.json(response, { status: 400 });
    }

    // Top up wallet
    const result = await topUpWallet(userId, amount, gatewayTxnId, gatewayProvider);

    // Get updated wallet
    const wallet = await prisma.wallet.findUnique({
      where: { userId },
      include: {
        transactions: {
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
      },
    });

    const response: ApiResponse = {
      success: true,
      data: {
        ...result,
        wallet,
      },
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error topping up wallet:', error);
    const response: ApiResponse = {
      success: false,
      error: 'Failed to top up wallet',
    };
    return NextResponse.json(response, { status: 500 });
  }
}
