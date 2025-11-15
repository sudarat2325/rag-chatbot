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
    const { orderId, method, amount: demoAmount, userId } = body;

    if (!method) {
      const response: ApiResponse = {
        success: false,
        error: 'method is required',
      };
      return NextResponse.json(response, { status: 400 });
    }

    // Demo mode: if no orderId, create a temporary demo order
    let order;
    let isDemoMode = false;

    if (!orderId && demoAmount && userId) {
      // Demo mode - create temporary order
      isDemoMode = true;
      order = await prisma.order.create({
        data: {
          customerId: userId,
          restaurantId: '690b86f51ae3dae3cb00cbb3', // Demo restaurant ID
          orderNumber: `DEMO-${Date.now()}`,
          total: demoAmount,
          subtotal: demoAmount,
          deliveryFee: 0,
          deliveryAddress: 'Demo Address',
          deliveryLat: 0,
          deliveryLng: 0,
          status: 'PENDING',
          paymentStatus: 'PENDING',
          paymentMethod: method as any,
        },
      });
    } else if (orderId) {
      // Normal mode - get existing order
      order = await prisma.order.findUnique({
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
    } else {
      const response: ApiResponse = {
        success: false,
        error: 'Either orderId or (amount + userId) required',
      };
      return NextResponse.json(response, { status: 400 });
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
          orderId: order.id,
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
            order.id
          );

          payment = await createPayment({
            orderId: order.id,
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
            where: { id: order.id },
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
          orderId: order.id,
          amount: order.total,
          method: 'CASH',
        });
        break;

      default:
        payment = await createPayment({
          orderId: order.id,
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
