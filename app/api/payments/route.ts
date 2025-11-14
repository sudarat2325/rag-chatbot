import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import {
  generatePromptPayQR,
  createPayment,
  processWalletPayment,
  topUpWallet,
} from '@/lib/services/payment';

const prisma = new PrismaClient();

interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
}

// GET /api/payments - Get payment history
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const orderId = searchParams.get('orderId');

    if (orderId) {
      // Get payments for specific order
      const payments = await prisma.payment.findMany({
        where: { orderId },
        include: {
          order: {
            select: {
              orderNumber: true,
              total: true,
              status: true,
            },
          },
          refunds: true,
        },
        orderBy: { createdAt: 'desc' },
      });

      const response: ApiResponse = {
        success: true,
        data: payments,
      };

      return NextResponse.json(response);
    }

    if (userId) {
      // Get payment history for user
      const payments = await prisma.payment.findMany({
        where: {
          order: {
            customerId: userId,
          },
        },
        include: {
          order: {
            select: {
              orderNumber: true,
              total: true,
              status: true,
              restaurant: {
                select: {
                  name: true,
                  logo: true,
                },
              },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        take: 50,
      });

      const response: ApiResponse = {
        success: true,
        data: payments,
      };

      return NextResponse.json(response);
    }

    const response: ApiResponse = {
      success: false,
      error: 'userId or orderId required',
    };

    return NextResponse.json(response, { status: 400 });
  } catch (error) {
    console.error('Error fetching payments:', error);
    const response: ApiResponse = {
      success: false,
      error: 'Failed to fetch payments',
    };
    return NextResponse.json(response, { status: 500 });
  }
}

// POST /api/payments - Create payment
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { orderId, method } = body;

    if (!orderId || !method) {
      const response: ApiResponse = {
        success: false,
        error: 'orderId and method are required',
      };
      return NextResponse.json(response, { status: 400 });
    }

    // Get order details
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        customer: true,
      },
    });

    if (!order) {
      const response: ApiResponse = {
        success: false,
        error: 'Order not found',
      };
      return NextResponse.json(response, { status: 404 });
    }

    let qrCodeUrl: string | undefined;
    let payment;

    // Handle different payment methods
    switch (method) {
      case 'PROMPTPAY':
      case 'QR_CODE':
        // Generate PromptPay QR code
        qrCodeUrl = await generatePromptPayQR(order.total);
        payment = await createPayment({
          orderId,
          amount: order.total,
          method,
          qrCodeUrl,
        });
        break;

      case 'WALLET':
        // Process wallet payment
        try {
          const walletResult = await processWalletPayment(
            order.customerId,
            order.total,
            orderId
          );

          payment = await createPayment({
            orderId,
            amount: order.total,
            method,
          });

          // Mark as paid immediately
          await prisma.payment.update({
            where: { id: payment.id },
            data: {
              status: 'PAID',
              paidAt: new Date(),
            },
          });

          // Update order status
          await prisma.order.update({
            where: { id: orderId },
            data: { paymentStatus: 'PAID' },
          });

          const response: ApiResponse = {
            success: true,
            data: {
              payment,
              wallet: walletResult,
            },
          };

          return NextResponse.json(response);
        } catch (walletError: unknown) {
          const response: ApiResponse = {
            success: false,
            error: walletError instanceof Error ? walletError.message : 'Wallet payment failed',
          };
          return NextResponse.json(response, { status: 400 });
        }

      case 'CASH':
        payment = await createPayment({
          orderId,
          amount: order.total,
          method: 'CASH',
        });
        break;

      default:
        payment = await createPayment({
          orderId,
          amount: order.total,
          method,
        });
    }

    const response: ApiResponse = {
      success: true,
      data: {
        payment,
        qrCodeUrl,
      },
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error creating payment:', error);
    const response: ApiResponse = {
      success: false,
      error: 'Failed to create payment',
    };
    return NextResponse.json(response, { status: 500 });
  }
}
