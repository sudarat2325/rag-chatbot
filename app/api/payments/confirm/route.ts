import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { updatePaymentStatus, awardLoyaltyPoints } from '@/lib/services/payment';

const prisma = new PrismaClient();

interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
}

// POST /api/payments/confirm - Confirm payment (manual confirmation for QR/Cash payments)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { paymentId, transactionId, status = 'PAID' } = body;

    if (!paymentId) {
      const response: ApiResponse = {
        success: false,
        error: 'paymentId is required',
      };
      return NextResponse.json(response, { status: 400 });
    }

    // Get payment details
    const payment = await prisma.payment.findUnique({
      where: { id: paymentId },
      include: {
        order: {
          include: {
            customer: true,
          },
        },
      },
    });

    if (!payment) {
      const response: ApiResponse = {
        success: false,
        error: 'Payment not found',
      };
      return NextResponse.json(response, { status: 404 });
    }

    // Update payment status
    const updatedPayment = await updatePaymentStatus(paymentId, status, {
      gatewayTxnId: transactionId,
    });

    // If payment successful, award loyalty points
    if (status === 'PAID') {
      try {
        await awardLoyaltyPoints(
          payment.order.customerId,
          payment.amount,
          payment.orderId
        );
      } catch (error) {
        console.error('Error awarding loyalty points:', error);
        // Don't fail the payment confirmation if loyalty points fail
      }

      // Create notification for successful payment
      try {
        await prisma.notification.create({
          data: {
            userId: payment.order.customerId,
            orderId: payment.orderId,
            type: 'SYSTEM',
            title: 'ชำระเงินสำเร็จ',
            message: `การชำระเงินสำหรับออเดอร์ #${payment.order.orderNumber} เสร็จสมบูรณ์แล้ว`,
          },
        });
      } catch (error) {
        console.error('Error creating notification:', error);
      }
    }

    const response: ApiResponse = {
      success: true,
      data: updatedPayment,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error confirming payment:', error);
    const response: ApiResponse = {
      success: false,
      error: 'Failed to confirm payment',
    };
    return NextResponse.json(response, { status: 500 });
  }
}
